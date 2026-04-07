import type { JsonWebKey } from 'node:crypto'
import type { VerifyRequestOptions } from '../types/public.js'

export const getJwkKid = (jwk: JsonWebKey): string | undefined =>
  typeof jwk.kid === 'string' ? jwk.kid : undefined

export const resolveVerificationKey = (
  keyId: string | undefined,
  options: VerifyRequestOptions
): JsonWebKey | null => {
  if (options.publicKeyJwk) {
    const candidateKid = getJwkKid(options.publicKeyJwk)

    if (keyId && candidateKid && candidateKid !== keyId) {
      return null
    }

    return options.publicKeyJwk
  }

  if (!options.jwks) {
    return null
  }

  if (keyId) {
    return options.jwks.keys.find((key) => getJwkKid(key) === keyId) ?? null
  }

  return options.jwks.keys.length === 1 ? options.jwks.keys[0] ?? null : null
}
