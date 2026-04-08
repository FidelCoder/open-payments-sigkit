import { describe, expect, it } from 'vitest'
import { inspectRequestSignature, signRequest, verifyRequest } from '../src/index.js'
import {
  grantRequestFixture,
  incomingPaymentFixture,
  jwksFixture,
  primaryPrivateKeyFixture,
  primaryPublicKeyFixture,
  secondaryPublicKeyFixture,
  signedGrantRequestVector,
  signedProtectedQuoteRequestVector,
  signedResourceWriteIncomingPaymentVector,
  verificationCaseVectors
} from './fixtures.js'

const resolveVerifyOptions = (
  verifyOptions: (typeof verificationCaseVectors)[number]['verifyOptions']
) => {
  switch (verifyOptions.keySource) {
    case 'jwks':
      return {
        jwks: jwksFixture,
        preset: verifyOptions.preset
      }
    case 'public-key':
      return {
        preset: verifyOptions.preset,
        publicKeyJwk: primaryPublicKeyFixture
      }
    case 'secondary-public-key-without-kid': {
      const publicKeyJwk = { ...secondaryPublicKeyFixture }
      delete publicKeyJwk.kid

      return {
        preset: verifyOptions.preset,
        publicKeyJwk
      }
    }
  }
}

describe('signed request vectors', () => {
  it('matches the stored grant-request signed vector', () => {
    const signed = signRequest(grantRequestFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'grant-request',
      privateKeyJwk: primaryPrivateKeyFixture
    })

    expect(signed).toEqual(signedGrantRequestVector)
  })

  it('matches the stored resource-write signed vector', () => {
    const signed = signRequest(incomingPaymentFixture, {
      created: 1735689600,
      keyId: 'fixture-primary-key',
      preset: 'resource-write',
      privateKeyJwk: primaryPrivateKeyFixture
    })

    expect(signed).toEqual(signedResourceWriteIncomingPaymentVector)
  })

  it('reconstructs inspection output from the stored protected-request vector', () => {
    const inspection = inspectRequestSignature(signedProtectedQuoteRequestVector.request)

    expect(inspection.coveredComponents).toEqual(signedProtectedQuoteRequestVector.coveredComponents)
    expect(inspection.signatureBase).toBe(signedProtectedQuoteRequestVector.signatureBase)
    expect(inspection.signatureHeader).toBe(signedProtectedQuoteRequestVector.signature)
    expect(inspection.signatureInputHeader).toBe(signedProtectedQuoteRequestVector.signatureInput)
  })
})

describe('verification case vectors', () => {
  for (const fixture of verificationCaseVectors) {
    it(`matches vector ${fixture.name}`, () => {
      expect(verifyRequest(fixture.request, resolveVerifyOptions(fixture.verifyOptions))).toEqual(
        fixture.expected
      )
    })
  }
})
