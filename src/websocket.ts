/**
 * A reconnecting WebSocket client.
 *
 * The only WebSocket in this library was the one `browser.ts` uses to talk
 * to Chrome over CDP — an internal detail, not something a consumer can
 * subscribe to a site's own socket with. Plenty of sites push updates
 * rather than expecting to be polled, and a poller that ignores that is
 * both slower and noisier than it needs to be.
 *
 * ### What this handles that a bare `new WebSocket` does not
 *
 * A long-lived socket does not fail once, it fails repeatedly: the process
 * outlives any individual connection. So reconnection is the feature, and
 * the details that matter are the ones that go wrong at 3am —
 *
 *  - **Backoff with jitter.** Every client reconnecting at the same
 *    instant after a server restart is a thundering herd that keeps the
 *    server down. Jitter is what spreads them out.
 *  - **A reset that depends on staying up.** Resetting the delay the
 *    moment a socket opens means a connection that opens and immediately
 *    drops reconnects instantly, forever, at full speed. The delay only
 *    resets after the connection has survived a while.
 *  - **Deliberate closes stay closed.** `close()` must not race a pending
 *    reconnect timer and come back up a second later.
 *
 * Zero dependencies — Bun's native `WebSocket`.
 */

export interface ReconnectingSocketOptions {
  /** Sub-protocols, passed straight through. */
  protocols?: string | string[]
  /** First reconnect delay in ms. Doubles per consecutive failure. @default 500 */
  initialDelay?: number
  /** Ceiling for the reconnect delay in ms. @default 30_000 */
  maxDelay?: number
  /**
   * How long a connection must stay open before the delay resets, in ms.
   * Guards the open/drop loop described above.
   * @default 10_000
   */
  stableAfter?: number
  /** Give up after this many consecutive failures. Infinite by default. */
  maxRetries?: number
  /** Random proportion added to each delay, 0..1. @default 0.3 */
  jitter?: number
  onOpen?: () => void
  onMessage?: (data: string) => void
  onError?: (error: unknown) => void
  /** Called on every close, with whether another attempt is scheduled. */
  onClose?: (info: { willReconnect: boolean, attempt: number }) => void
}

export interface ReconnectingSocket {
  /** Queues while disconnected is *not* done — returns false if not open. */
  send: (data: string) => boolean
  /** Closes for good. No further reconnection attempts. */
  close: () => void
  readonly connected: boolean
  /** Consecutive failed attempts since the last stable connection. */
  readonly attempts: number
}

export function createReconnectingSocket(
  url: string,
  options: ReconnectingSocketOptions = {},
): ReconnectingSocket {
  const initialDelay = options.initialDelay ?? 500
  const maxDelay = options.maxDelay ?? 30_000
  const stableAfter = options.stableAfter ?? 10_000
  const maxRetries = options.maxRetries ?? Number.POSITIVE_INFINITY
  const jitter = options.jitter ?? 0.3

  let socket: WebSocket | null = null
  let attempt = 0
  let closed = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let openedAt = 0

  function delayFor(n: number): number {
    const base = Math.min(initialDelay * 2 ** n, maxDelay)
    return Math.round(base * (1 + Math.random() * jitter))
  }

  function schedule(): boolean {
    if (closed || attempt >= maxRetries)
      return false

    const wait = delayFor(attempt)
    attempt++
    timer = setTimeout(connect, wait)
    return true
  }

  function connect(): void {
    if (closed)
      return

    try {
      socket = options.protocols
        ? new WebSocket(url, options.protocols)
        : new WebSocket(url)
    }
    catch (error) {
      options.onError?.(error)
      schedule()
      return
    }

    socket.addEventListener('open', () => {
      openedAt = Date.now()
      options.onOpen?.()
    })

    socket.addEventListener('message', (event: MessageEvent) => {
      const data = event.data
      options.onMessage?.(typeof data === 'string' ? data : String(data))
    })

    socket.addEventListener('error', (error: unknown) => {
      options.onError?.(error)
    })

    socket.addEventListener('close', () => {
      // Only a connection that lasted counts as proof the endpoint is
      // healthy. Resetting on `open` alone would spin at full speed
      // against a server that accepts and immediately drops.
      if (openedAt > 0 && Date.now() - openedAt >= stableAfter)
        attempt = 0

      openedAt = 0
      socket = null

      const willReconnect = schedule()
      options.onClose?.({ willReconnect, attempt })
    })
  }

  connect()

  return {
    send(data: string): boolean {
      if (!socket || socket.readyState !== WebSocket.OPEN)
        return false
      socket.send(data)
      return true
    },
    close(): void {
      closed = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      socket?.close()
      socket = null
    },
    get connected(): boolean {
      return socket?.readyState === WebSocket.OPEN
    },
    get attempts(): number {
      return attempt
    },
  }
}
