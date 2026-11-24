import { expect, type APIRequestContext } from '@playwright/test'

export const ORIGIN = 'http://localhost:5173'
export const PASSWORD = 'e2e-password-1'
export const NEW_PASSWORD = 'e2e-password-2'

export function uniqueEmail(): string {
  return `e2e-${crypto.randomUUID()}@example.com`
}

// Setup that is not the journey under test goes through the API. The backend refuses an unsafe
// request without an allowed Origin (CONTRACTS.md), which a browser sends and this client does not.
export async function registerByApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const response = await request.post('/api/v1/auth/register', {
    data: { email, password },
    headers: { Origin: ORIGIN },
  })
  expect(response.status()).toBe(201)
}
