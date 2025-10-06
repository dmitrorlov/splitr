import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { mockApiResponses } from '../__mocks__/api-responses'

// Define handlers for API endpoints
const handlers = [
  // Mock external API calls if any
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  // Example handler for any external HTTP requests
  http.get('*/api/*', () => {
    return HttpResponse.json({ message: 'Mock API response' })
  }),
]

// Create MSW server
export const server = setupServer(...handlers)

// Setup MSW for tests
export const setupMSW = () => {
  // Start server before all tests
  beforeAll(() => server.listen())

  // Close server after all tests
  afterAll(() => server.close())

  // Reset handlers after each test
  afterEach(() => server.resetHandlers())
}

// Helper to add custom handlers for specific tests
export const addMockHandler = (handler: any) => {
  server.use(handler)
}