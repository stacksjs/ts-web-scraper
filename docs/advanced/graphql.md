# GraphQL Detection

Detect and interact with GraphQL APIs for efficient data extraction.

## Detecting GraphQL

Automatically detect GraphQL endpoints:

```typescript
import { detectGraphQL } from 'ts-web-scraper'
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper()

// Scrape the page
const result = await scraper.scrape('https://example.com')

// Detect GraphQL endpoints
const detection = detectGraphQL(result.html, result.url)

console.log('Has GraphQL:', detection.hasGraphQL)
console.log('Endpoints found:', detection.endpoints.length)

detection.endpoints.forEach(endpoint => {
  console.log('  URL:', endpoint.url)
  console.log('  Method:', endpoint.method)
})
```

## Verifying Endpoints

Verify if a URL is a valid GraphQL endpoint:

```typescript
import { verifyGraphQLEndpoint } from 'ts-web-scraper'

const isValid = await verifyGraphQLEndpoint('https://api.example.com/graphql')

if (isValid) {
  console.log('Valid GraphQL endpoint')
} else {
  console.log('Not a GraphQL endpoint')
}
```

## GraphQL Client

Use the GraphQL client to execute queries:

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token',
  },
})

// Execute a query
const response = await client.query({
  query: `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
        posts {
          title
          content
        }
      }
    }
  `,
  variables: {
    id: '123',
  },
})

if (response.data) {
  console.log('User:', response.data.user)
} else if (response.errors) {
  console.error('GraphQL errors:', response.errors)
}
```

## Query Execution

Execute queries and mutations:

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
})

// Query
const queryResponse = await client.query({
  query: `
    {
      products(limit: 10) {
        id
        name
        price
      }
    }
  `,
})

console.log('Products:', queryResponse.data?.products)

// Mutation
const mutationResponse = await client.query({
  query: `
    mutation CreatePost($title: String!, $content: String!) {
      createPost(title: $title, content: $content) {
        id
        title
        createdAt
      }
    }
  `,
  variables: {
    title: 'New Post',
    content: 'Post content here',
  },
  operationName: 'CreatePost',
})

console.log('Created post:', mutationResponse.data?.createPost)
```

## Batch Queries

Execute multiple queries in parallel:

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
})

const queries = [
  {
    query: '{ user(id: "1") { name } }',
  },
  {
    query: '{ user(id: "2") { name } }',
  },
  {
    query: '{ user(id: "3") { name } }',
  },
]

const responses = await client.batchQuery(queries)

responses.forEach((response, index) => {
  if (response.data) {
    console.log(`User ${index + 1}:`, response.data.user)
  }
})
```

## Schema Introspection

Get the GraphQL schema:

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
})

const schema = await client.getSchema()

console.log('Query type:', schema?.queryType?.name)
console.log('Mutation type:', schema?.mutationType?.name)
console.log('Types:', schema?.types?.length)

// Explore available types
schema?.types?.forEach(type => {
  console.log(`Type: ${type.name}`)
  if (type.fields) {
    type.fields.forEach(field => {
      console.log(`  - ${field.name}: ${field.type.name}`)
    })
  }
})
```

## Health Check

Check if endpoint is healthy:

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
})

const isHealthy = await client.healthCheck()

if (isHealthy) {
  console.log('GraphQL endpoint is healthy')
} else {
  console.error('GraphQL endpoint is down')
}
```

## Extracting Queries from JavaScript

Extract GraphQL queries from client-side code:

```typescript
import { extractGraphQLQueries } from 'ts-web-scraper'

const jsCode = `
  const GET_USERS = gql\`
    query GetUsers {
      users {
        id
        name
        email
      }
    }
  \`

  const CREATE_POST = gql\`
    mutation CreatePost($title: String!) {
      createPost(title: $title) {
        id
        title
      }
    }
  \`
`

const queries = extractGraphQLQueries(jsCode)

console.log('Found queries:', queries.length)
queries.forEach(query => {
  console.log(query)
})
```

## Detecting from Website

Automatic detection and extraction:

```typescript
import { createScraper } from 'ts-web-scraper'
import { detectGraphQL, GraphQLClient } from 'ts-web-scraper'

const scraper = createScraper()

// Scrape page
const result = await scraper.scrape('https://example.com/products')

// Detect GraphQL
const detection = detectGraphQL(result.html, result.url)

if (detection.hasGraphQL && detection.endpoints.length > 0) {
  // Use first endpoint
  const endpoint = detection.endpoints[0]

  const client = new GraphQLClient({
    endpoint: endpoint.url,
    method: endpoint.method,
  })

  // Try to get schema
  try {
    const schema = await client.getSchema()
    console.log('Schema discovered:', schema?.types?.length, 'types')

    // Execute a query
    const response = await client.query({
      query: `
        {
          products {
            name
            price
          }
        }
      `,
    })

    console.log('Products:', response.data?.products)
  } catch (error) {
    console.error('GraphQL query failed:', error)
  }
}
```

## With Authentication

Use GraphQL with authentication:

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'X-API-Key': 'your-api-key',
  },
})

const response = await client.query({
  query: `
    {
      me {
        id
        name
        email
      }
    }
  `,
})

console.log('Current user:', response.data?.me)
```

## Error Handling

Handle GraphQL errors:

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  retries: 3,  // Retry on failure
})

const response = await client.query({
  query: `
    {
      user(id: "invalid") {
        name
      }
    }
  `,
})

if (response.errors) {
  console.error('GraphQL returned errors:')
  response.errors.forEach(error => {
    console.error('  -', error.message)
    if (error.locations) {
      console.error('    at line', error.locations[0].line)
    }
    if (error.path) {
      console.error('    path:', error.path.join('.'))
    }
  })
}

if (response.data) {
  console.log('Partial data:', response.data)
}
```

## Query Analysis

Analyze query types:

```typescript
import { getOperationType, getOperationName } from 'ts-web-scraper'

const query1 = `
  query GetUser($id: ID!) {
    user(id: $id) {
      name
    }
  }
`

const query2 = `
  mutation UpdateUser($id: ID!, $name: String!) {
    updateUser(id: $id, name: $name) {
      id
      name
    }
  }
`

console.log('Query 1 type:', getOperationType(query1))  // "query"
console.log('Query 1 name:', getOperationName(query1))  // "GetUser"

console.log('Query 2 type:', getOperationType(query2))  // "mutation"
console.log('Query 2 name:', getOperationName(query2))  // "UpdateUser"
```

## GET Requests

Some GraphQL endpoints support GET:

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  method: 'GET',  // Use GET instead of POST
})

// Query is encoded in URL parameters
const response = await client.query({
  query: '{ products { name price } }',
})

console.log('Products:', response.data?.products)
```

## Complete Example

Full GraphQL scraping workflow:

```typescript
import { createScraper } from 'ts-web-scraper'
import {
  detectGraphQL,
  verifyGraphQLEndpoint,
  GraphQLClient,
} from 'ts-web-scraper'

async function scrapeGraphQLSite(url: string) {
  // 1. Scrape the page
  const scraper = createScraper()
  const result = await scraper.scrape(url)

  // 2. Detect GraphQL endpoints
  const detection = detectGraphQL(result.html, result.url)

  if (!detection.hasGraphQL) {
    console.log('No GraphQL detected')
    return null
  }

  console.log(`Found ${detection.endpoints.length} potential endpoints`)

  // 3. Verify and use first valid endpoint
  for (const endpoint of detection.endpoints) {
    const isValid = await verifyGraphQLEndpoint(endpoint.url)

    if (!isValid) {
      console.log(`Invalid endpoint: ${endpoint.url}`)
      continue
    }

    console.log(`Valid GraphQL endpoint: ${endpoint.url}`)

    // 4. Create client
    const client = new GraphQLClient({
      endpoint: endpoint.url,
      method: endpoint.method,
    })

    // 5. Check health
    const isHealthy = await client.healthCheck()
    if (!isHealthy) {
      console.log('Endpoint unhealthy')
      continue
    }

    // 6. Get schema
    try {
      const schema = await client.getSchema()
      console.log(`Schema has ${schema?.types?.length} types`)

      // 7. Execute query
      const response = await client.query({
        query: `
          {
            __type(name: "Query") {
              fields {
                name
                description
              }
            }
          }
        `,
      })

      console.log('Available queries:')
      response.data?.__type?.fields?.forEach(field => {
        console.log(`  - ${field.name}: ${field.description}`)
      })

      return { client, schema, endpoint: endpoint.url }
    } catch (error) {
      console.error('Failed to query endpoint:', error)
    }
  }

  return null
}

// Use it
const result = await scrapeGraphQLSite('https://example.com')

if (result) {
  // Use the GraphQL client for further queries
  const response = await result.client.query({
    query: '{ products { name price } }',
  })

  console.log('Products:', response.data?.products)
}
```

## Best Practices

1. Always verify endpoints before using them
2. Use introspection to discover available queries
3. Handle GraphQL errors separately from HTTP errors
4. Use batch queries for multiple requests
5. Cache schema information
6. Set appropriate timeouts and retries

```typescript
import { GraphQLClient } from 'ts-web-scraper'

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  method: 'POST',
  timeout: 30000,    // 30 second timeout
  retries: 3,        // Retry up to 3 times
  headers: {
    'User-Agent': 'MyBot/1.0',
  },
})

// Always handle both data and errors
const response = await client.query({
  query: '{ products { id name price } }',
})

if (response.errors) {
  console.error('Errors occurred:', response.errors)
}

if (response.data) {
  console.log('Data:', response.data)
}
```

## Next Steps

- Learn about [Client-Side Rendering](/advanced/client-side)
- Explore [Pipelines](/advanced/pipelines)
- Configure [Monitoring](/features/monitoring)
