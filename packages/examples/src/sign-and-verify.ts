import type { HttpRequestShape } from '@open-payments-devkit/core'
import { signRequest, verifyRequest } from '@open-payments-devkit/core'
import { keys, requests } from '@open-payments-devkit/fixtures'

const signed = signRequest(requests.grantRequest as HttpRequestShape, {
  created: 1735689600,
  keyId: 'fixture-primary-key',
  preset: 'grant-request',
  privateKeyJwk: keys.privateKey
})

const verification = verifyRequest(signed.request, {
  jwks: keys.jwks,
  preset: 'grant-request'
})

console.log(
  JSON.stringify(
    {
      signed,
      verification
    },
    null,
    2
  )
)
