import type { HttpRequestShape } from '@open-payments-devkit/core'
import { parseSignatureInput, signRequest } from '@open-payments-devkit/core'
import { keys, requests } from '@open-payments-devkit/fixtures'

const signed = signRequest(requests.incomingPayment as HttpRequestShape, {
  created: 1735689600,
  keyId: 'fixture-primary-key',
  preset: 'resource-write',
  privateKeyJwk: keys.privateKey
})

console.log(
  JSON.stringify(
    {
      parsedSignatureInput: parseSignatureInput(signed.signatureInput),
      signed
    },
    null,
    2
  )
)
