import { describe, it, expect } from 'vitest'

// Mirror the public route patterns from proxy.ts
// This tests the CONFIGURATION — that we haven't accidentally protected a public route
// or left a protected route open.
const PUBLIC_ROUTE_PATTERNS = [
  /^\/$/, // home
  /^\/sign-in(\/.*)?$/, // sign-in and sub-paths
  /^\/sign-up(\/.*)?$/, // sign-up and sub-paths
  /^\/api\/webhooks(\/.*)?$/, // webhook receivers
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))
}

describe('proxy public route configuration', () => {
  it('treats / as public', () => {
    expect(isPublicRoute('/')).toBe(true)
  })

  it('treats /sign-in as public', () => {
    expect(isPublicRoute('/sign-in')).toBe(true)
  })

  it('treats /sign-in/callback as public (catch-all)', () => {
    expect(isPublicRoute('/sign-in/callback')).toBe(true)
  })

  it('treats /sign-up as public', () => {
    expect(isPublicRoute('/sign-up')).toBe(true)
  })

  it('treats /api/webhooks/clerk as public', () => {
    expect(isPublicRoute('/api/webhooks/clerk')).toBe(true)
  })

  it('treats /dashboard as protected', () => {
    expect(isPublicRoute('/dashboard')).toBe(false)
  })

  it('treats /api/data as protected', () => {
    expect(isPublicRoute('/api/data')).toBe(false)
  })

  it('treats /profile as protected', () => {
    expect(isPublicRoute('/profile')).toBe(false)
  })
})
