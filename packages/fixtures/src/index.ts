import type { JsonWebKey } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(resolve(packageRoot, relativePath), 'utf8')) as T

export type FixtureRequest = {
  body?: string
  headers?: Record<string, string>
  method: string
  url: string
}

export type FixtureSignedRequestResult = {
  contentDigest?: string
  coveredComponents: string[]
  request: FixtureRequest
  signature: string
  signatureBase: string
  signatureInput: string
}

export type FixtureVerificationCase = {
  expected: {
    code: string
    coveredComponents?: string[]
    details?: Record<string, unknown>
    message: string
    ok: boolean
    signatureBase?: string
  }
  name: string
  request: FixtureRequest
  verifyOptions: {
    keySource: 'jwks' | 'public-key' | 'secondary-public-key-without-kid'
    preset?: 'grant-request' | 'protected-request' | 'resource-write'
  }
}

export const fixturePaths = {
  keys: {
    jwks: resolve(packageRoot, 'keys/jwks.json'),
    privateKey: resolve(packageRoot, 'keys/ed25519-private.jwk.json'),
    publicKey: resolve(packageRoot, 'keys/ed25519-public.jwk.json')
  },
  requests: {
    grantRequest: resolve(packageRoot, 'requests/grant-request.json'),
    incomingPayment: resolve(packageRoot, 'requests/incoming-payment.json'),
    outgoingPayment: resolve(packageRoot, 'requests/outgoing-payment.json'),
    quoteRequest: resolve(packageRoot, 'requests/quote-request.json')
  },
  vectors: {
    grantRequestSigned: resolve(packageRoot, 'vectors/signed/grant-request.json'),
    protectedQuoteRequestSigned: resolve(packageRoot, 'vectors/signed/protected-quote-request.json'),
    resourceWriteIncomingPaymentSigned: resolve(
      packageRoot,
      'vectors/signed/resource-write-incoming-payment.json'
    ),
    verificationCases: resolve(packageRoot, 'vectors/verification-cases.json')
  }
}

export const keys = {
  jwks: readJson<{ keys: JsonWebKey[] }>('keys/jwks.json'),
  privateKey: readJson<JsonWebKey>('keys/ed25519-private.jwk.json'),
  publicKey: readJson<JsonWebKey>('keys/ed25519-public.jwk.json')
}

export const requests = {
  grantRequest: readJson<Record<string, unknown>>('requests/grant-request.json'),
  incomingPayment: readJson<Record<string, unknown>>('requests/incoming-payment.json'),
  outgoingPayment: readJson<Record<string, unknown>>('requests/outgoing-payment.json'),
  quoteRequest: readJson<Record<string, unknown>>('requests/quote-request.json')
}

export const vectors = {
  signed: {
    grantRequest: readJson<FixtureSignedRequestResult>('vectors/signed/grant-request.json'),
    protectedQuoteRequest: readJson<FixtureSignedRequestResult>(
      'vectors/signed/protected-quote-request.json'
    ),
    resourceWriteIncomingPayment: readJson<FixtureSignedRequestResult>(
      'vectors/signed/resource-write-incoming-payment.json'
    )
  },
  verificationCases: readJson<FixtureVerificationCase[]>('vectors/verification-cases.json')
}
