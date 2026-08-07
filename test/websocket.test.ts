import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createReconnectingSocket } from '../src/websocket'

/**
 * The reconnecting socket, against a real server.
 *
 * Reconnection is the whole feature, so the tests that matter are the ones
 * where the connection dies: the client has to come back after a drop, and
 * has to stay down after a deliberate close. A mocked WebSocket would only
 * prove the state machine agrees with itself.
 */

let server: ReturnType<typeof Bun.serve>
let base: string

/** Sockets the server has accepted, so a test can kill one. */
const live: Array<{ close: () => void }> = []
/** Set by a test to make the server hang up immediately on connect. */
let hangUp = false

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(request, srv) {
      if (srv.upgrade(request))
        return undefined
      return new Response('expected a websocket', { status: 400 })
    },
    websocket: {
      open(ws) {
        live.push(ws as unknown as { close: () => void })
        if (hangUp) {
          ws.close()
          return
        }
        ws.send('hello')
      },
      message(ws, message) {
        ws.send(`echo:${String(message)}`)
      },
    },
  })
  base = `ws://localhost:${server.port}`
})

afterAll(() => {
  server.stop(true)
})

function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const tick = () => {
      if (predicate())
        return resolve()
      if (Date.now() - started > timeoutMs)
        return reject(new Error('timed out'))
      setTimeout(tick, 10)
    }
    tick()
  })
}

describe('createReconnectingSocket', () => {
  it('connects and delivers messages', async () => {
    const received: string[] = []
    const socket = createReconnectingSocket(base, { onMessage: m => void received.push(m) })

    try {
      await waitFor(() => received.length > 0)
      expect(received[0]).toBe('hello')
      expect(socket.connected).toBe(true)
    }
    finally {
      socket.close()
    }
  })

  it('sends once open and reports failure when not', async () => {
    const received: string[] = []
    const socket = createReconnectingSocket(base, { onMessage: m => void received.push(m) })

    try {
      await waitFor(() => socket.connected)
      expect(socket.send('ping')).toBe(true)
      await waitFor(() => received.includes('echo:ping'))
    }
    finally {
      socket.close()
    }

    // Closed for good: a send now reports failure rather than throwing.
    expect(socket.send('ping')).toBe(false)
  })

  it('comes back after the server drops the connection', async () => {
    let opens = 0
    const socket = createReconnectingSocket(base, {
      initialDelay: 20,
      onOpen: () => { opens++ },
    })

    try {
      await waitFor(() => socket.connected)
      expect(opens).toBe(1)

      // Kill it from the server side, the way a real outage would.
      live.at(-1)?.close()

      await waitFor(() => opens >= 2)
      expect(socket.connected).toBe(true)
    }
    finally {
      socket.close()
    }
  })

  it('stays closed after a deliberate close', async () => {
    let opens = 0
    const socket = createReconnectingSocket(base, {
      initialDelay: 20,
      onOpen: () => { opens++ },
    })

    await waitFor(() => socket.connected)
    socket.close()
    const after = opens

    // A pending reconnect timer must not be able to bring it back up.
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(opens).toBe(after)
    expect(socket.connected).toBe(false)
  })

  it('gives up after maxRetries against a server that keeps hanging up', async () => {
    hangUp = true
    let closes = 0
    let lastWillReconnect = true

    const socket = createReconnectingSocket(base, {
      initialDelay: 10,
      maxRetries: 2,
      onClose: (info) => {
        closes++
        lastWillReconnect = info.willReconnect
      },
    })

    try {
      await waitFor(() => lastWillReconnect === false, 4000)
      // One initial attempt plus two retries, then it stops.
      expect(closes).toBeGreaterThanOrEqual(3)
      expect(socket.connected).toBe(false)
    }
    finally {
      socket.close()
      hangUp = false
    }
  })
})
