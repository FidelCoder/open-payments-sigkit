import { describe, expect, it } from 'vitest'
import { buildSignatureBase, parseSignature, parseSignatureInput, signRequest } from '../src/index.js'
import { normalizeHeaders } from '../src/http/headers.js'
import { grantRequestFixture, primaryPrivateKeyFixture } from './fixtures.js'

describe('signature input parsing and canonicalization', () => {
  it('serializes and parses signature input members', () => {
    const result = signRequest(grantRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'grant-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const parsed = parseSignatureInput(result.signatureInput)
    const parsedSignature = parseSignature(result.signature)

    expect(parsed.sig.components).toEqual(['@method', '@target-uri', 'content-digest'])
    expect(parsed.sig.params).toMatchObject({
      created: 1735689600,
      keyid: 'fixture-primary-key'
    })
    expect(parsedSignature.sig.value).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('builds a stable signature base string', () => {
    const result = signRequest(grantRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'grant-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const parsed = parseSignatureInput(result.signatureInput)

    expect(buildSignatureBase(result.request, parsed.sig)).toMatchInlineSnapshot(`
      ""@method": POST
      "@target-uri": https://auth.example.com/grants
      "content-digest": sha-256=:v+MxjrqbRkFX2vELAWegNTtjnQGThUX/7W6NpBbpuK8=:
      "@signature-params": ("@method" "@target-uri" "content-digest");created=1735689600;keyid="fixture-primary-key""
    `)
  })

  it('normalizes request header names to lowercase', () => {
    expect(
      normalizeHeaders({
        Authorization: 'GNAP access_token="123"',
        'Content-Type': 'application/json'
      })
    ).toEqual({
      authorization: 'GNAP access_token="123"',
      'content-type': 'application/json'
    })
  })
})
