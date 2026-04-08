import type { JsonWebKey } from 'node:crypto'
import type { VerifyRequestOptions } from '../types/public.js'

export const getJwkKid = (jwk: JsonWebKey): string | undefined =>
  typeof jwk.kid === 'string' ? jwk.kid : undefined

export type VerificationKeyResolution = {
  details?: Record<string, unknown>
  key: JsonWebKey | null
  message?: string
}

const listAvailableKeyIds = (jwks: NonNullable<VerifyRequestOptions['jwks']>): string[] =>
  jwks.keys.map(getJwkKid).filter((value): value is string => Boolean(value))

export const resolveVerificationKey = (
  keyId: string | undefined,
  options: VerifyRequestOptions
): VerificationKeyResolution => {
  if (options.publicKeyJwk) {
    const candidateKid = getJwkKid(options.publicKeyJwk)

    if (keyId && candidateKid && candidateKid !== keyId) {
      return {
        details: {
          keyId,
          providedKeyId: candidateKid,
          reason: 'public-key-kid-mismatch',
          source: 'public-key'
        },
        key: null,
        message: 'The provided public key did not match the signature key ID.'
      }
    }

    return {
      key: options.publicKeyJwk
    }
  }

  if (!options.jwks) {
    return {
      details: {
        reason: 'no-verification-key-material'
      },
      key: null,
      message: 'No public JWK or JWKS was supplied to the verifier.'
    }
  }

  if (keyId) {
    const resolved = options.jwks.keys.find((key) => getJwkKid(key) === keyId) ?? null

    if (resolved) {
      return {
        key: resolved
      }
    }

    return {
      details: {
        availableKeyIds: listAvailableKeyIds(options.jwks),
        jwksKeyCount: options.jwks.keys.length,
        keyId,
        reason: 'keyid-not-found-in-jwks',
        source: 'jwks'
      },
      key: null,
      message: 'The verifier could not find the signature key ID in the supplied JWKS.'
    }
  }

  if (options.jwks.keys.length === 1) {
    return {
      key: options.jwks.keys[0] ?? null
    }
  }

  return {
    details: {
      availableKeyIds: listAvailableKeyIds(options.jwks),
      jwksKeyCount: options.jwks.keys.length,
      reason: 'missing-keyid-for-multi-key-jwks',
      source: 'jwks'
    },
    key: null,
    message:
      'The signature key ID was missing, and the supplied JWKS contains multiple candidate keys.'
  }
}
