import type { HttpRequestShape } from '@open-payments-devkit/core'
import { inspectRequestSignature, signRequest } from '@open-payments-devkit/core'
import { keys, requests } from '@open-payments-devkit/fixtures'

const signed = signRequest(requests.quoteRequest as HttpRequestShape, {
  created: 1735689600,
  keyId: 'fixture-primary-key',
  preset: 'protected-request',
  privateKeyJwk: keys.privateKey
})

console.log(JSON.stringify(inspectRequestSignature(signed.request), null, 2))
