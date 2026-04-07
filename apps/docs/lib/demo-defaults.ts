import { signRequest } from '@open-payments-devkit/core'
import type { HttpRequestShape, PresetName } from '@open-payments-devkit/core'
import { keys, requests } from '@open-payments-devkit/fixtures'
import { serializeHeaders } from './form-helpers'

export type RequestEditorDefaults = {
  body: string
  headersText: string
  method: string
  url: string
}

const toRequestDefaults = (request: HttpRequestShape): RequestEditorDefaults => ({
  body: request.body ?? '',
  headersText: serializeHeaders(request.headers),
  method: request.method,
  url: request.url
})

export const defaultPrivateKeyJwkText = JSON.stringify(keys.privateKey, null, 2)
export const defaultPublicKeyJwkText = JSON.stringify(keys.publicKey, null, 2)
export const defaultJwksText = JSON.stringify(keys.jwks, null, 2)

export const grantRequestDefaults = toRequestDefaults(requests.grantRequest as HttpRequestShape)
export const incomingPaymentDefaults = toRequestDefaults(
  requests.incomingPayment as HttpRequestShape
)
export const signedQuoteRequestDefaults = toRequestDefaults(
  signRequest(requests.quoteRequest as HttpRequestShape, {
    created: 1735689600,
    keyId: 'fixture-primary-key',
    preset: 'protected-request',
    privateKeyJwk: keys.privateKey
  }).request
)

export const presetOptions: PresetName[] = [
  'grant-request',
  'protected-request',
  'resource-write'
]
