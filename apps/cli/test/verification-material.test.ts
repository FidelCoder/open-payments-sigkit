import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchRemoteJwks = vi.fn()

vi.mock('@open-payments-devkit/core', async () => {
  const actual = await vi.importActual<typeof import('@open-payments-devkit/core')>(
    '@open-payments-devkit/core'
  )

  return {
    ...actual,
    fetchRemoteJwks
  }
})

const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url))

describe('resolveVerificationMaterial', () => {
  beforeEach(() => {
    fetchRemoteJwks.mockReset()
  })

  it('loads a local public key file when provided', async () => {
    const { resolveVerificationMaterial } = await import('../src/verification-material.js')
    const result = await resolveVerificationMaterial({
      publicKeyFile: resolve(workspaceRoot, 'packages/fixtures/keys/ed25519-public.jwk.json')
    })

    expect(result.publicKeyJwk).toMatchObject({
      crv: 'Ed25519',
      kid: 'fixture-primary-key',
      kty: 'OKP'
    })
    expect(fetchRemoteJwks).not.toHaveBeenCalled()
  })

  it('delegates remote JWKS fetching when a JWKS URL is provided', async () => {
    fetchRemoteJwks.mockResolvedValue({
      keys: [
        {
          crv: 'Ed25519',
          kid: 'fixture-primary-key',
          kty: 'OKP',
          x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapi7QnJv8Y1xgkOw'
        }
      ]
    })

    const { resolveVerificationMaterial } = await import('../src/verification-material.js')
    const result = await resolveVerificationMaterial({
      jwksTimeoutMs: 2500,
      jwksUrl: 'https://keys.example.com/jwks.json'
    })

    expect(fetchRemoteJwks).toHaveBeenCalledWith('https://keys.example.com/jwks.json', {
      timeoutMs: 2500
    })
    expect(result.jwks).toBeDefined()
  })

  it('rejects conflicting verification material sources', async () => {
    const { resolveVerificationMaterial } = await import('../src/verification-material.js')

    await expect(
      resolveVerificationMaterial({
        jwksFile: resolve(workspaceRoot, 'packages/fixtures/keys/jwks.json'),
        publicKeyFile: resolve(workspaceRoot, 'packages/fixtures/keys/ed25519-public.jwk.json')
      })
    ).rejects.toThrow('Choose one verification key source')
  })
})
