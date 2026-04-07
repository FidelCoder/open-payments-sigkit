import type { JsonWebKey } from 'node:crypto'
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto'
import {
  ED25519_CURVE,
  EDDSA_JWK_ALGORITHM,
  SUPPORTED_SIGNATURE_ALGORITHM_TOKENS
} from '../constants/algorithms.js'
import { decodeBase64, encodeUtf8, encodeBase64 } from '../utils/base64.js'

const SUPPORTED_JWK_ALGORITHMS = new Set([EDDSA_JWK_ALGORITHM, 'Ed25519', 'ed25519', 'eddsa'])

export class UnsupportedAlgorithmError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'UnsupportedAlgorithmError'
  }
}

const assertCommonJwkShape = (jwk: JsonWebKey): void => {
  if (jwk.kty !== 'OKP' || jwk.crv !== ED25519_CURVE || typeof jwk.x !== 'string') {
    throw new UnsupportedAlgorithmError(
      'Only Ed25519 OKP JSON Web Keys are supported by this toolkit.'
    )
  }

  if (typeof jwk.alg === 'string' && !SUPPORTED_JWK_ALGORITHMS.has(jwk.alg)) {
    throw new UnsupportedAlgorithmError(
      `Unsupported JWK algorithm "${jwk.alg}". Expected EdDSA or Ed25519.`
    )
  }
}

export const assertSupportedPublicJwk = (jwk: JsonWebKey): void => {
  assertCommonJwkShape(jwk)
}

export const assertSupportedPrivateJwk = (jwk: JsonWebKey): void => {
  assertCommonJwkShape(jwk)

  if (typeof jwk.d !== 'string') {
    throw new UnsupportedAlgorithmError('The private Ed25519 JWK is missing its "d" parameter.')
  }
}

export const isSupportedSignatureAlgorithm = (value?: string): boolean =>
  value === undefined || SUPPORTED_SIGNATURE_ALGORITHM_TOKENS.has(value.toLowerCase())

export const signEd25519 = (signatureBase: string, privateKeyJwk: JsonWebKey): string => {
  assertSupportedPrivateJwk(privateKeyJwk)
  const key = createPrivateKey({
    format: 'jwk',
    key: privateKeyJwk
  })
  const signatureBytes = sign(null, encodeUtf8(signatureBase), key)

  return encodeBase64(signatureBytes)
}

export const verifyEd25519 = (
  signatureBase: string,
  signature: string,
  publicKeyJwk: JsonWebKey
): boolean => {
  assertSupportedPublicJwk(publicKeyJwk)
  const key = createPublicKey({
    format: 'jwk',
    key: publicKeyJwk
  })

  return verify(null, encodeUtf8(signatureBase), key, decodeBase64(signature))
}
