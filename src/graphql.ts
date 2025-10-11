/**
 * GraphQL Detection and Query Execution
 *
 * Detect GraphQL endpoints and execute queries
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export interface GraphQLEndpoint {
  url: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
}

export interface GraphQLQuery {
  query: string
  variables?: Record<string, any>
  operationName?: string
}

export interface GraphQLResponse<T = any> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number, column: number }>
    path?: Array<string | number>
    extensions?: Record<string, any>
  }>
  extensions?: Record<string, any>
}

export interface GraphQLDetectionResult {
  hasGraphQL: boolean
  endpoints: GraphQLEndpoint[]
  schema?: any
}

export interface GraphQLClientOptions {
  endpoint: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

/**
 * Detect GraphQL endpoints in HTML
 */
export function detectGraphQL(html: string, baseUrl: string): GraphQLDetectionResult {
  const endpoints: GraphQLEndpoint[] = []
  const detectedUrls = new Set<string>()

  // Common GraphQL endpoint patterns
  const endpointPatterns = [
    /(?:https?:)?\/\/[^"'\s]+\/graphql/gi,
    /(?:https?:)?\/\/[^"'\s]+\/api\/graphql/gi,
    /(?:https?:)?\/\/[^"'\s]+\/query/gi,
    /["']([^"']*graphql[^"']*)["']/gi,
  ]

  for (const pattern of endpointPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      let url = match[0].replace(/["']/g, '')

      // Skip if it's just the word "graphql" without a URL
      if (!url.includes('/') && !url.includes('.')) {
        continue
      }

      // Handle relative URLs
      if (url.startsWith('//')) {
        const baseProtocol = new URL(baseUrl).protocol
        url = `${baseProtocol}${url}`
      }
      else if (url.startsWith('/')) {
        const base = new URL(baseUrl)
        url = `${base.origin}${url}`
      }
      else if (!url.startsWith('http')) {
        continue
      }

      // Avoid duplicates
      if (detectedUrls.has(url)) {
        continue
      }

      detectedUrls.add(url)
      endpoints.push({
        url,
        method: 'POST', // GraphQL typically uses POST
      })
    }
  }

  // Check for Apollo Client or other GraphQL indicators
  const hasApolloClient = /apollo-client|@apollo\/client/i.test(html)
  const hasGraphQLTag = /<script[^>]*>.*?graphql.*?<\/script>/is.test(html)
  const hasGraphQLKeyword = /\bgraphql\b/i.test(html)

  // Try common default endpoints if indicators found but no endpoints detected
  if ((hasApolloClient || hasGraphQLTag || hasGraphQLKeyword) && endpoints.length === 0) {
    const base = new URL(baseUrl)
    const commonEndpoints = [
      `${base.origin}/graphql`,
      `${base.origin}/api/graphql`,
      `${base.origin}/query`,
      `${base.origin}/api/query`,
    ]

    for (const url of commonEndpoints) {
      endpoints.push({
        url,
        method: 'POST',
      })
    }
  }

  return {
    hasGraphQL: endpoints.length > 0 || hasApolloClient || hasGraphQLTag,
    endpoints,
  }
}

/**
 * Verify if a URL is a valid GraphQL endpoint
 */
export async function verifyGraphQLEndpoint(url: string, options: { timeout?: number } = {}): Promise<boolean> {
  const { timeout = 10000 } = options

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Try introspection query
    const introspectionQuery = {
      query: `
        query IntrospectionQuery {
          __schema {
            queryType { name }
            mutationType { name }
            subscriptionType { name }
          }
        }
      `,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(introspectionQuery),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return false
    }

    const data = await response.json()

    // Check if response has GraphQL structure
    return (
      typeof data === 'object'
      && data !== null
      && ('data' in data || 'errors' in data)
    )
  }
  catch {
    return false
  }
}

/**
 * GraphQL Client
 */
export class GraphQLClient {
  constructor(private options: GraphQLClientOptions) {}

  /**
   * Execute a GraphQL query
   */
  async query<T = any>(query: GraphQLQuery): Promise<GraphQLResponse<T>> {
    const {
      endpoint,
      method = 'POST',
      headers = {},
      timeout = 30000,
      retries = 0,
    } = this.options

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        let response: Response

        if (method === 'GET') {
          // For GET requests, encode query in URL
          const params = new URLSearchParams()
          params.set('query', query.query)
          if (query.variables) {
            params.set('variables', JSON.stringify(query.variables))
          }
          if (query.operationName) {
            params.set('operationName', query.operationName)
          }

          const url = `${endpoint}?${params.toString()}`
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              ...headers,
            },
            signal: controller.signal,
          })
        }
        else {
          // POST request with JSON body
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...headers,
            },
            body: JSON.stringify(query),
            signal: controller.signal,
          })
        }

        clearTimeout(timeoutId)

        if (!response.ok && attempt < retries) {
          // Retry on HTTP errors
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }

        const data = await response.json()
        return data as GraphQLResponse<T>
      }
      catch (error) {
        lastError = error as Error
        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
          continue
        }
      }
    }

    throw lastError || new Error('GraphQL query failed')
  }

  /**
   * Execute multiple queries in parallel
   */
  async batchQuery<T = any>(queries: GraphQLQuery[]): Promise<Array<GraphQLResponse<T>>> {
    const promises = queries.map(q => this.query<T>(q))
    return Promise.all(promises)
  }

  /**
   * Get schema via introspection
   */
  async getSchema(): Promise<any> {
    const introspectionQuery = {
      query: `
        query IntrospectionQuery {
          __schema {
            queryType { name }
            mutationType { name }
            subscriptionType { name }
            types {
              ...FullType
            }
            directives {
              name
              description
              locations
              args {
                ...InputValue
              }
            }
          }
        }

        fragment FullType on __Type {
          kind
          name
          description
          fields(includeDeprecated: true) {
            name
            description
            args {
              ...InputValue
            }
            type {
              ...TypeRef
            }
            isDeprecated
            deprecationReason
          }
          inputFields {
            ...InputValue
          }
          interfaces {
            ...TypeRef
          }
          enumValues(includeDeprecated: true) {
            name
            description
            isDeprecated
            deprecationReason
          }
          possibleTypes {
            ...TypeRef
          }
        }

        fragment InputValue on __InputValue {
          name
          description
          type {
            ...TypeRef
          }
          defaultValue
        }

        fragment TypeRef on __Type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                      ofType {
                        kind
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
    }

    const response = await this.query(introspectionQuery)
    return response.data?.__schema
  }

  /**
   * Check if endpoint is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query({
        query: '{ __typename }',
      })
      return true
    }
    catch {
      return false
    }
  }
}

/**
 * Extract GraphQL queries from JavaScript code
 */
export function extractGraphQLQueries(jsCode: string): string[] {
  const queriesSet = new Set<string>()

  // Match gql template literals (Apollo Client style)
  const gqlPattern = /gql`([^`]+)`/gs
  const gqlMatches = jsCode.matchAll(gqlPattern)

  for (const match of gqlMatches) {
    queriesSet.add(match[1].trim())
  }

  // Match graphql() calls
  const graphqlPattern = /graphql\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gs
  const graphqlMatches = jsCode.matchAll(graphqlPattern)

  for (const match of graphqlMatches) {
    queriesSet.add(match[1].trim())
  }

  // Match raw GraphQL strings (query/mutation keywords) - only if not already matched
  const rawPattern = /['"`]\s*((?:query|mutation|subscription)\s+[^'"`]+)['"`]/gs
  const rawMatches = jsCode.matchAll(rawPattern)

  for (const match of rawMatches) {
    const query = match[1].trim()
    // Only add if not already in set (avoids duplicates from gql/graphql patterns)
    queriesSet.add(query)
  }

  return Array.from(queriesSet)
}

/**
 * Parse GraphQL operation type
 */
export function getOperationType(query: string): 'query' | 'mutation' | 'subscription' | null {
  const trimmed = query.trim()

  if (/^query\s/i.test(trimmed)) {
    return 'query'
  }
  if (/^mutation\s/i.test(trimmed)) {
    return 'mutation'
  }
  if (/^subscription\s/i.test(trimmed)) {
    return 'subscription'
  }

  // Default to query if no operation type specified
  if (trimmed.startsWith('{')) {
    return 'query'
  }

  return null
}

/**
 * Extract operation name from query
 */
export function getOperationName(query: string): string | null {
  const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/i)
  return match ? match[1] : null
}
