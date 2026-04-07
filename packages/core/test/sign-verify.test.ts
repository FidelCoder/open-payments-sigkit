import { describe, expect, it } from 'vitest'
import {
  explainVerificationResult,
  getPreset,
  inspectRequestSignature,
  parseSignatureInput,
  signRequest,
  verifyRequest
} from '../src/index.js'
import {
  grantRequestFixture,
  incomingPaymentFixture,
  jwksFixture,
  primaryPrivateKeyFixture,
  primaryPublicKeyFixture,
  quoteRequestFixture,
  secondaryPublicKeyFixture
} from './fixtures.js'

describe('Open Payments presets', () => {
  it('adds default created and expires values for resource-write', () => {
    const preset = getPreset('resource-write')
    const result = signRequest(incomingPaymentFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: preset.name,
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const parsed = parseSignatureInput(result.signatureInput)

    expect(parsed.sig.params).toEqual({
      created: 1735689600,
      expires: 1735689900,
      keyid: 'fixture-primary-key'
    })
  })
})

describe('request signing and verification', () => {
  it('signs and verifies a grant request successfully', () => {
    const signed = signRequest(grantRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'grant-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const verified = verifyRequest(signed.request, {
      jwks: jwksFixture,
      preset: 'grant-request'
    })

    expect(verified).toEqual({
      code: 'OK',
      coveredComponents: ['@method', '@target-uri', 'content-digest'],
      message: 'The request signature and covered components verified successfully.',
      ok: true,
      signatureBase: signed.signatureBase
    })
  })

  it('exposes inspection details for a signed request', () => {
    const signed = signRequest(quoteRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'protected-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const inspection = inspectRequestSignature(signed.request)

    expect(inspection.coveredComponents).toEqual([
      '@method',
      '@target-uri',
      'authorization',
      'content-digest'
    ])
    expect(inspection.signatureBase).toContain('"authorization": GNAP access_token="quote-token"')
  })

  it('fails when the request body is tampered with after signing', () => {
    const signed = signRequest(grantRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'grant-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const tampered = {
      ...signed.request,
      body: `${signed.request.body} `
    }
    const result = verifyRequest(tampered, {
      publicKeyJwk: primaryPublicKeyFixture,
      preset: 'grant-request'
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "code": "INVALID_CONTENT_DIGEST",
        "details": {
          "expected": "sha-256 digest of request body",
          "header": "content-digest",
          "received": "sha-256=:v+MxjrqbRkFX2vELAWegNTtjnQGThUX/7W6NpBbpuK8=:",
        },
        "message": "The Content-Digest header does not match the supplied request body.",
        "ok": false,
      }
    `)
  })

  it('fails when the request method is tampered with after signing', () => {
    const signed = signRequest(grantRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'grant-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const tampered = {
      ...signed.request,
      method: 'PUT'
    }
    const result = verifyRequest(tampered, {
      publicKeyJwk: primaryPublicKeyFixture,
      preset: 'grant-request'
    })

    expect(result.code).toBe('SIGNATURE_MISMATCH')
    expect(explainVerificationResult(result).title).toBe('Signature mismatch')
  })

  it('fails when the target URI is tampered with after signing', () => {
    const signed = signRequest(grantRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'grant-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const tampered = {
      ...signed.request,
      url: 'https://auth.example.com/grants/continuation'
    }
    const result = verifyRequest(tampered, {
      publicKeyJwk: primaryPublicKeyFixture,
      preset: 'grant-request'
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "code": "SIGNATURE_MISMATCH",
        "coveredComponents": [
          "@method",
          "@target-uri",
          "content-digest",
        ],
        "details": {
          "keyId": "fixture-primary-key",
          "label": "sig",
        },
        "message": "The signature did not match the reconstructed signature base.",
        "ok": false,
        "signatureBase": ""@method": POST
"@target-uri": https://auth.example.com/grants/continuation
"content-digest": sha-256=:v+MxjrqbRkFX2vELAWegNTtjnQGThUX/7W6NpBbpuK8=:
"@signature-params": ("@method" "@target-uri" "content-digest");created=1735689600;keyid="fixture-primary-key"",
      }
    `)
  })

  it('fails when authorization is required by the preset but not covered', () => {
    const signed = signRequest(grantRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'grant-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const result = verifyRequest(signed.request, {
      publicKeyJwk: primaryPublicKeyFixture,
      preset: 'protected-request'
    })

    expect(result).toEqual({
      code: 'MISSING_REQUIRED_COMPONENT',
      coveredComponents: ['@method', '@target-uri', 'content-digest'],
      details: {
        missingComponents: ['authorization']
      },
      message: 'The signature did not cover the components required by the verification policy.',
      ok: false
    })
  })

  it('fails when the wrong public key is used', () => {
    const signed = signRequest(quoteRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'protected-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const wrongKey = { ...secondaryPublicKeyFixture }

    delete wrongKey.kid

    const result = verifyRequest(signed.request, {
      preset: 'protected-request',
      publicKeyJwk: wrongKey
    })

    expect(result.code).toBe('SIGNATURE_MISMATCH')
  })
})
