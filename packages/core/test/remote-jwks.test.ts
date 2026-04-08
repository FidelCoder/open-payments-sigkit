import { describe, expect, it } from 'vitest'
import { fetchRemoteJwks } from '../src/index.js'

const createResponse = (
  body: unknown,
  init?: {
    headers?: Record<string, string>
    status?: number
    statusText?: string
  }
): Response =>
  new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json'
    },
    status: 200,
    ...init
  })

describe('fetchRemoteJwks', () => {
  it('returns a validated JWKS document from a mocked fetch implementation', async () => {
    const jwks = await fetchRemoteJwks('https://keys.example.com/jwks.json', {
      fetchImpl: async () =>
        createResponse({
          keys: [
            {
              crv: 'Ed25519',
              kid: 'fixture-primary-key',
              kty: 'OKP',
              x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapi7QnJv8Y1xgkOw'
            }
          ]
        })
    })

    expect(jwks).toEqual({
      keys: [
        {
          crv: 'Ed25519',
          kid: 'fixture-primary-key',
          kty: 'OKP',
          x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapi7QnJv8Y1xgkOw'
        }
      ]
    })
  })

  it('returns a typed HTTP error when the remote JWKS endpoint fails', async () => {
    await expect(
      fetchRemoteJwks('https://keys.example.com/jwks.json', {
        fetchImpl: async () => createResponse({ error: 'boom' }, { status: 503, statusText: 'Busy' })
      })
    ).rejects.toMatchObject({
      code: 'REMOTE_JWKS_HTTP_ERROR',
      details: {
        status: 503,
        statusText: 'Busy',
        url: 'https://keys.example.com/jwks.json'
      }
    })
  })

  it('returns a typed validation error when the JWKS payload shape is invalid', async () => {
    await expect(
      fetchRemoteJwks('https://keys.example.com/jwks.json', {
        fetchImpl: async () => createResponse({ invalid: true })
      })
    ).rejects.toMatchObject({
      code: 'REMOTE_JWKS_INVALID'
    })
  })

  it('returns a typed timeout error when the fetch does not complete in time', async () => {
    await expect(
      fetchRemoteJwks('https://keys.example.com/jwks.json', {
        fetchImpl: async (_url, init) =>
          await new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const abortError = new Error('Aborted')
              abortError.name = 'AbortError'
              reject(abortError)
            })
          }),
        timeoutMs: 5
      })
    ).rejects.toMatchObject({
      code: 'REMOTE_JWKS_TIMEOUT',
      details: {
        timeoutMs: 5,
        url: 'https://keys.example.com/jwks.json'
      }
    })
  })
})
