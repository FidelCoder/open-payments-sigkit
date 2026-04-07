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
