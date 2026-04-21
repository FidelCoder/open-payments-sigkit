import { describe, it, expect } from 'vitest'
import { HttpSignatureAuthProvider } from '../src/http-signature-auth-provider.js'

// Deterministic Ed25519 test key pair matching the fixture keys in the repo
const PRIVATE_KEY_JWK = {
  kty: 'OKP',
  crv: 'Ed25519',
  d: 'nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A',
  x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo'
}

const PUBLIC_KEY_JWK = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo'
}

// A minimal mock of Kiota's Headers class
class MockHeaders {
  private store: Map<string, string[]> = new Map()

  tryAdd(key: string, value: string): boolean {
    const normalized = key.toLowerCase()
    if (!this.store.has(normalized)) {
      this.store.set(normalized, [value])
      return true
    }
    return false
  }

  get(key: string): string[] | undefined {
    return this.store.get(key.toLowerCase())
  }

  [Symbol.iterator](): Iterator<[string, string[]]> {
    return this.store.entries()
  }
}

// A minimal mock of Kiota's RequestInformation
function createMockRequest(options: {
  method: string
  url: string
  headers?: Record<string, string>
  body?: string
}) {
  const headers = new MockHeaders()

  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.tryAdd(key, value)
    }
  }

  const encoder = new TextEncoder()
  const content = options.body ? encoder.encode(options.body).buffer : undefined

  return {
    httpMethod: options.method,
    URL: options.url,
    headers,
    content: content as ArrayBuffer | undefined
  }
}

describe('HttpSignatureAuthProvider', () => {
  it('should throw when privateKeyJwk is missing', () => {
    expect(() => new HttpSignatureAuthProvider({
      privateKeyJwk: undefined as any,
      keyId: 'test-key'
    })).toThrow('privateKeyJwk')
  })

  it('should throw when keyId is missing', () => {
    expect(() => new HttpSignatureAuthProvider({
      privateKeyJwk: PRIVATE_KEY_JWK,
      keyId: '' as any
    })).toThrow('keyId')
  })

  it('should sign a request without a body (grant-request preset)', async () => {
    const provider = new HttpSignatureAuthProvider({
      privateKeyJwk: PRIVATE_KEY_JWK,
      keyId: 'test-key-1',
      preset: 'grant-request'
    })

    const request = createMockRequest({
      method: 'POST',
      url: 'https://auth.example.com/grants',
      headers: {
        'content-type': 'application/json'
      },
      body: '{"access_token":{"access":[{"type":"incoming-payment"}]}}'
    })

    await provider.authenticateRequest(request)

    const signatureInput = request.headers.get('signature-input')
    const signature = request.headers.get('signature')
    const contentDigest = request.headers.get('content-digest')

    expect(signatureInput).toBeDefined()
    expect(signatureInput![0]).toContain('sig=')
    expect(signature).toBeDefined()
    expect(signature![0]).toContain('sig=')
    expect(contentDigest).toBeDefined()
    expect(contentDigest![0]).toContain('sha-256=')
  })

  it('should sign a protected request with authorization', async () => {
    const provider = new HttpSignatureAuthProvider({
      privateKeyJwk: PRIVATE_KEY_JWK,
      keyId: 'test-key-2',
      preset: 'protected-request'
    })

    const request = createMockRequest({
      method: 'POST',
      url: 'https://rs.example.com/quotes',
      headers: {
        'authorization': 'GNAP access_token="test-token"',
        'content-type': 'application/json'
      },
      body: '{"receiver":"https://wallet.example.com/bob"}'
    })

    await provider.authenticateRequest(request)

    const signatureInput = request.headers.get('signature-input')
    const signature = request.headers.get('signature')

    expect(signatureInput).toBeDefined()
    expect(signatureInput![0]).toContain('authorization')
    expect(signature).toBeDefined()
  })

  it('should sign a GET request without a body', async () => {
    const provider = new HttpSignatureAuthProvider({
      privateKeyJwk: PRIVATE_KEY_JWK,
      keyId: 'test-key-3',
      preset: 'grant-request'
    })

    const request = createMockRequest({
      method: 'GET',
      url: 'https://rs.example.com/incoming-payments'
    })

    await provider.authenticateRequest(request)

    const signatureInput = request.headers.get('signature-input')
    const signature = request.headers.get('signature')
    const contentDigest = request.headers.get('content-digest')

    expect(signatureInput).toBeDefined()
    expect(signature).toBeDefined()
    expect(contentDigest).toBeUndefined()
  })

  it('should use protected-request as default preset', async () => {
    const provider = new HttpSignatureAuthProvider({
      privateKeyJwk: PRIVATE_KEY_JWK,
      keyId: 'test-key-4'
    })

    const request = createMockRequest({
      method: 'GET',
      url: 'https://rs.example.com/incoming-payments',
      headers: {
        'authorization': 'GNAP access_token="test-token"'
      }
    })

    await provider.authenticateRequest(request)

    const signatureInput = request.headers.get('signature-input')
    expect(signatureInput).toBeDefined()
    expect(signatureInput![0]).toContain('authorization')
  })

  it('should sign a plain request and return the full result', () => {
    const provider = new HttpSignatureAuthProvider({
      privateKeyJwk: PRIVATE_KEY_JWK,
      keyId: 'test-key-5',
      preset: 'grant-request'
    })

    const result = provider.signPlainRequest({
      method: 'POST',
      url: 'https://auth.example.com/grants',
      headers: { 'content-type': 'application/json' },
      body: '{"hello":"world"}'
    })

    expect(result.signatureInput).toContain('sig=')
    expect(result.signature).toContain('sig=')
    expect(result.contentDigest).toContain('sha-256=')
    expect(result.signatureBase).toBeTruthy()
    expect(result.coveredComponents).toContain('@method')
    expect(result.coveredComponents).toContain('@target-uri')
  })
})
