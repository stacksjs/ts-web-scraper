import { describe, expect, it } from 'bun:test'
import {
  detectGraphQL,
  extractGraphQLQueries,
  getOperationName,
  getOperationType,
  GraphQLClient,
} from '../src/graphql'

describe('detectGraphQL', () => {
  it('should detect GraphQL endpoints in HTML', () => {
    const html = `
      <html>
        <body>
          <script src="https://example.com/graphql"></script>
        </body>
      </html>
    `

    const result = detectGraphQL(html, 'https://example.com')
    expect(result.hasGraphQL).toBe(true)
    expect(result.endpoints.length).toBeGreaterThan(0)
  })

  it('should detect API GraphQL endpoints', () => {
    const html = `
      <html>
        <body>
          <script>
            fetch('https://api.example.com/api/graphql', {
              method: 'POST',
              body: JSON.stringify({ query: '...' })
            })
          </script>
        </body>
      </html>
    `

    const result = detectGraphQL(html, 'https://example.com')
    expect(result.hasGraphQL).toBe(true)
    expect(result.endpoints.some(e => e.url.includes('/api/graphql'))).toBe(true)
  })

  it('should detect Apollo Client usage', () => {
    const html = `
      <html>
        <head>
          <script src="https://cdn.example.com/apollo-client.js"></script>
        </head>
      </html>
    `

    const result = detectGraphQL(html, 'https://example.com')
    expect(result.hasGraphQL).toBe(true)
  })

  it('should handle relative URLs', () => {
    const html = '<script>fetch("/graphql")</script>'

    const result = detectGraphQL(html, 'https://example.com')
    expect(result.hasGraphQL).toBe(true)
    expect(result.endpoints.some(e => e.url === 'https://example.com/graphql')).toBe(true)
  })

  it('should handle protocol-relative URLs', () => {
    const html = '<script>fetch("//api.example.com/graphql")</script>'

    const result = detectGraphQL(html, 'https://example.com')
    expect(result.hasGraphQL).toBe(true)
    expect(result.endpoints.some(e => e.url === 'https://api.example.com/graphql')).toBe(true)
  })

  it('should avoid duplicate endpoints', () => {
    const html = `
      <script>fetch("/graphql")</script>
      <script>fetch("/graphql")</script>
      <script>fetch("/graphql")</script>
    `

    const result = detectGraphQL(html, 'https://example.com')
    const graphqlEndpoints = result.endpoints.filter(e => e.url === 'https://example.com/graphql')
    expect(graphqlEndpoints.length).toBe(1)
  })

  it('should suggest common endpoints when GraphQL indicators found', () => {
    const html = '<script src="apollo-client.js"></script>'

    const result = detectGraphQL(html, 'https://example.com')
    expect(result.hasGraphQL).toBe(true)
    expect(result.endpoints.length).toBeGreaterThan(0)
  })

  it('should return false when no GraphQL detected', () => {
    const html = '<html><body>Hello World</body></html>'

    const result = detectGraphQL(html, 'https://example.com')
    expect(result.hasGraphQL).toBe(false)
    expect(result.endpoints.length).toBe(0)
  })
})

describe('extractGraphQLQueries', () => {
  it('should extract gql template literals', () => {
    const jsCode = `
      const query = gql\`
        query GetUser {
          user(id: 1) {
            name
            email
          }
        }
      \`
    `

    const queries = extractGraphQLQueries(jsCode)
    expect(queries.length).toBe(1)
    expect(queries[0]).toContain('query GetUser')
  })

  it('should extract graphql() calls', () => {
    const jsCode = `
      const query = graphql('query GetUser { user { name } }')
    `

    const queries = extractGraphQLQueries(jsCode)
    expect(queries.length).toBe(1)
    expect(queries[0]).toContain('query GetUser')
  })

  it('should extract raw GraphQL strings', () => {
    const jsCode = `
      const query = "query GetUser { user { name } }"
      const mutation = 'mutation CreateUser { createUser(name: "John") { id } }'
    `

    const queries = extractGraphQLQueries(jsCode)
    expect(queries.length).toBe(2)
    expect(queries[0]).toContain('query GetUser')
    expect(queries[1]).toContain('mutation CreateUser')
  })

  it('should extract multiple queries', () => {
    const jsCode = `
      const query1 = gql\`query A { a }\`
      const query2 = gql\`query B { b }\`
      const query3 = gql\`mutation C { c }\`
    `

    const queries = extractGraphQLQueries(jsCode)
    expect(queries.length).toBe(3)
  })

  it('should return empty array for non-GraphQL code', () => {
    const jsCode = 'const x = 1 + 2'

    const queries = extractGraphQLQueries(jsCode)
    expect(queries.length).toBe(0)
  })
})

describe('getOperationType', () => {
  it('should detect query operation', () => {
    const query = 'query GetUser { user { name } }'
    expect(getOperationType(query)).toBe('query')
  })

  it('should detect mutation operation', () => {
    const mutation = 'mutation CreateUser { createUser { id } }'
    expect(getOperationType(mutation)).toBe('mutation')
  })

  it('should detect subscription operation', () => {
    const subscription = 'subscription OnUserCreated { userCreated { id } }'
    expect(getOperationType(subscription)).toBe('subscription')
  })

  it('should default to query for shorthand syntax', () => {
    const query = '{ user { name } }'
    expect(getOperationType(query)).toBe('query')
  })

  it('should return null for invalid syntax', () => {
    const invalid = 'not a graphql query'
    expect(getOperationType(invalid)).toBeNull()
  })

  it('should be case insensitive', () => {
    expect(getOperationType('QUERY GetUser { user { name } }')).toBe('query')
    expect(getOperationType('Query GetUser { user { name } }')).toBe('query')
    expect(getOperationType('qUeRy GetUser { user { name } }')).toBe('query')
  })
})

describe('getOperationName', () => {
  it('should extract query name', () => {
    const query = 'query GetUser { user { name } }'
    expect(getOperationName(query)).toBe('GetUser')
  })

  it('should extract mutation name', () => {
    const mutation = 'mutation CreateUser { createUser { id } }'
    expect(getOperationName(mutation)).toBe('CreateUser')
  })

  it('should extract subscription name', () => {
    const subscription = 'subscription OnUserCreated { userCreated { id } }'
    expect(getOperationName(subscription)).toBe('OnUserCreated')
  })

  it('should return null for anonymous operations', () => {
    const query = '{ user { name } }'
    expect(getOperationName(query)).toBeNull()
  })

  it('should return null for operations without names', () => {
    const query = 'query { user { name } }'
    expect(getOperationName(query)).toBeNull()
  })

  it('should handle multi-line queries', () => {
    const query = `
      query GetUser {
        user {
          name
        }
      }
    `
    expect(getOperationName(query)).toBe('GetUser')
  })
})

describe('GraphQLClient', () => {
  it('should create client with endpoint', () => {
    const client = new GraphQLClient({
      endpoint: 'https://api.example.com/graphql',
    })

    expect(client).toBeDefined()
  })

  it('should create client with custom headers', () => {
    const client = new GraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      headers: {
        Authorization: 'Bearer token123',
      },
    })

    expect(client).toBeDefined()
  })

  it('should create client with custom method', () => {
    const client = new GraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      method: 'GET',
    })

    expect(client).toBeDefined()
  })

  it('should create client with timeout', () => {
    const client = new GraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      timeout: 5000,
    })

    expect(client).toBeDefined()
  })

  it('should create client with retries', () => {
    const client = new GraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      retries: 3,
    })

    expect(client).toBeDefined()
  })
})

describe('GraphQL types', () => {
  it('should handle GraphQL response with data', () => {
    const response = {
      data: {
        user: {
          id: '1',
          name: 'John',
        },
      },
    }

    expect(response.data).toBeDefined()
    expect(response.errors).toBeUndefined()
  })

  it('should handle GraphQL response with errors', () => {
    const response = {
      errors: [
        {
          message: 'Field not found',
          locations: [{ line: 2, column: 3 }],
          path: ['user', 'email'],
        },
      ],
    }

    expect(response.errors).toBeDefined()
    expect(response.errors[0].message).toBe('Field not found')
  })

  it('should handle GraphQL response with both data and errors', () => {
    const response = {
      data: {
        user: {
          id: '1',
          name: 'John',
        },
      },
      errors: [
        {
          message: 'Deprecated field used',
          extensions: { code: 'DEPRECATED' },
        },
      ],
    }

    expect(response.data).toBeDefined()
    expect(response.errors).toBeDefined()
  })
})

describe('GraphQL query structure', () => {
  it('should handle query with variables', () => {
    const query = {
      query: 'query GetUser($id: ID!) { user(id: $id) { name } }',
      variables: { id: '1' },
    }

    expect(query.query).toContain('$id')
    expect(query.variables?.id).toBe('1')
  })

  it('should handle query with operation name', () => {
    const query = {
      query: 'query GetUser { user { name } }',
      operationName: 'GetUser',
    }

    expect(query.operationName).toBe('GetUser')
  })

  it('should handle complex variables', () => {
    const query = {
      query: 'mutation CreateUser($input: UserInput!) { createUser(input: $input) { id } }',
      variables: {
        input: {
          name: 'John',
          email: 'john@example.com',
          age: 30,
        },
      },
    }

    expect(query.variables?.input.name).toBe('John')
    expect(query.variables?.input.email).toBe('john@example.com')
  })
})
