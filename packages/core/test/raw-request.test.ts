import { describe, expect, it } from 'vitest'
import type { HttpRequestShape } from '../src/index.js'
import { parseRawHttpRequest, signRequest, verifyRequest } from '../src/index.js'
import { jwksFixture, primaryPrivateKeyFixture } from './fixtures.js'

const rawProtectedRequest = `POST /quotes HTTP/1.1
Host: rs.example.com
Authorization: GNAP access_token="quote-token"
Content-Type: application/json

{"receiver":"https://wallet.example.com/bob"}`

const serializeRawRequest = (request: HttpRequestShape): string => {
  const targetUrl = new URL(request.url)
  const startLine = `${request.method} ${targetUrl.pathname}${targetUrl.search} HTTP/1.1`
  const headers = { host: targetUrl.host, ...request.headers }
  const headerLines = Object.entries(headers).map(([name, value]) => `${name}: ${value}`)

  return [startLine, ...headerLines, '', request.body ?? ''].join('\n')
}

describe('raw HTTP request parsing', () => {
  it('parses a captured origin-form request using Host to build the target URI', () => {
    const request = parseRawHttpRequest(rawProtectedRequest)

    expect(request).toEqual({
      body: '{"receiver":"https://wallet.example.com/bob"}',
      headers: {
        authorization: 'GNAP access_token="quote-token"',
        'content-type': 'application/json',
        host: 'rs.example.com'
      },
      method: 'POST',
      url: 'https://rs.example.com/quotes'
    })
  })

  it('parses an absolute-form request and combines repeated headers deterministically', () => {
    const request = parseRawHttpRequest(`GET https://rs.example.com/accounts?id=1 HTTP/1.1
X-Trace-Id: trace-a
X-Trace-Id: trace-b
Accept: application/json`)

    expect(request).toEqual({
      headers: {
        accept: 'application/json',
        'x-trace-id': 'trace-a, trace-b'
      },
      method: 'GET',
      url: 'https://rs.example.com/accounts?id=1'
    })
  })

  it('signs and verifies a parsed raw HTTP request', () => {
    const request = parseRawHttpRequest(rawProtectedRequest)
    const signed = signRequest(request, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'protected-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })
    const verification = verifyRequest(parseRawHttpRequest(serializeRawRequest(signed.request)), {
      jwks: jwksFixture,
      preset: 'protected-request'
    })

    expect(verification).toMatchObject({
      code: 'OK',
      ok: true,
      signatureBase: signed.signatureBase
    })
  })
})
