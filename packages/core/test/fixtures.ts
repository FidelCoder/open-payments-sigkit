import type { JsonWebKey } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HttpRequestShape } from '../src/types/public.js'

const fixturesRoot = resolve(fileURLToPath(new URL('../../fixtures', import.meta.url)))

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(resolve(fixturesRoot, relativePath), 'utf8')) as T

export const grantRequestFixture = readJson<HttpRequestShape>('requests/grant-request.json')
export const quoteRequestFixture = readJson<HttpRequestShape>('requests/quote-request.json')
export const incomingPaymentFixture = readJson<HttpRequestShape>('requests/incoming-payment.json')
export const outgoingPaymentFixture = readJson<HttpRequestShape>('requests/outgoing-payment.json')

export const primaryPrivateKeyFixture = readJson<JsonWebKey>('keys/ed25519-private.jwk.json')
export const primaryPublicKeyFixture = readJson<JsonWebKey>('keys/ed25519-public.jwk.json')
export const jwksFixture = readJson<{ keys: JsonWebKey[] }>('keys/jwks.json')
export const secondaryPublicKeyFixture = jwksFixture.keys[1]

export type SignedRequestVector = {
  contentDigest?: string
  coveredComponents: string[]
  request: HttpRequestShape
  signature: string
  signatureBase: string
  signatureInput: string
}

export type VerificationCaseVector = {
  expected: {
    code: string
    coveredComponents?: string[]
    details?: Record<string, unknown>
    message: string
    ok: boolean
    signatureBase?: string
  }
  name: string
  request: HttpRequestShape
  verifyOptions: {
    keySource: 'jwks' | 'public-key' | 'secondary-public-key-without-kid'
    preset?: 'grant-request' | 'protected-request' | 'resource-write'
  }
}

export const signedGrantRequestVector = readJson<SignedRequestVector>(
  'vectors/signed/grant-request.json'
)
export const signedProtectedQuoteRequestVector = readJson<SignedRequestVector>(
  'vectors/signed/protected-quote-request.json'
)
export const signedResourceWriteIncomingPaymentVector = readJson<SignedRequestVector>(
  'vectors/signed/resource-write-incoming-payment.json'
)
export const verificationCaseVectors = readJson<VerificationCaseVector[]>(
  'vectors/verification-cases.json'
)
