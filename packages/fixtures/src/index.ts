import type { JsonWebKey } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(resolve(packageRoot, relativePath), 'utf8')) as T

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
