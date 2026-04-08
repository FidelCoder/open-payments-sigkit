import type { JsonWebKey } from 'node:crypto'

/**
 * Supported Open Payments preset names.
 */
export type PresetName = 'grant-request' | 'protected-request' | 'resource-write'

/**
 * Shared HTTP request shape used by the devkit.
 */
export type HttpRequestShape = {
  method: string
  url: string
  headers?: Record<string, string>
  body?: string
}

/**
 * Options for parsing a captured raw HTTP request into the shared request shape.
 */
export type RawHttpRequestParseOptions = {
  defaultScheme?: string
}

/**
 * Options for signing an HTTP request.
 */
export type SignRequestOptions = {
  keyId: string
  privateKeyJwk: JsonWebKey
  preset?: PresetName
  components?: string[]
  created?: number
  expires?: number
  nonce?: string
  tag?: string
}

/**
 * Options for verifying an HTTP request signature.
 */
export type VerifyRequestOptions = {
  publicKeyJwk?: JsonWebKey
  jwks?: { keys: JsonWebKey[] }
  requireDigestForBody?: boolean
  requiredComponents?: string[]
  preset?: PresetName
}

/**
 * Result returned after signing a request.
 */
export type SignedRequestResult = {
  request: HttpRequestShape
  contentDigest?: string
  signatureInput: string
  signature: string
  coveredComponents: string[]
  signatureBase: string
}

/**
 * Stable verification result codes returned by the devkit.
 */
export type VerificationCode =
  | 'OK'
  | 'MISSING_CONTENT_DIGEST'
  | 'INVALID_CONTENT_DIGEST'
  | 'MISSING_SIGNATURE'
  | 'MISSING_SIGNATURE_INPUT'
  | 'INVALID_SIGNATURE_INPUT'
  | 'UNSUPPORTED_ALGORITHM'
  | 'KEY_NOT_FOUND'
  | 'SIGNATURE_MISMATCH'
  | 'MISSING_REQUIRED_COMPONENT'
  | 'REQUEST_COMPONENT_MISMATCH'

/**
 * Typed verification response.
 */
export type VerificationResult = {
  ok: boolean
  code: VerificationCode
  message: string
  details?: Record<string, unknown>
  signatureBase?: string
  coveredComponents?: string[]
}

/**
 * Signature input parameters supported by this toolkit.
 */
export type SignatureInputParameters = {
  created?: number
  expires?: number
  keyid?: string
  alg?: string
  nonce?: string
  tag?: string
}

/**
 * Parsed representation of a single Signature-Input dictionary member.
 */
export type ParsedSignatureInput = {
  label: string
  components: string[]
  params: SignatureInputParameters
  raw: string
}

/**
 * Parsed Signature-Input header keyed by label.
 */
export type ParsedSignatureInputs = Record<string, ParsedSignatureInput>

/**
 * Parsed representation of a single Signature dictionary member.
 */
export type ParsedSignature = {
  label: string
  value: string
  raw: string
}

/**
 * Parsed Signature header keyed by label.
 */
export type ParsedSignatures = Record<string, ParsedSignature>

/**
 * Canonicalized signature-base line for an individual covered component.
 */
export type CanonicalComponent = {
  id: string
  value: string
  line: string
}

/**
 * Inspection payload returned by inspectRequestSignature.
 */
export type InspectionResult = {
  signatureInputHeader?: string
  signatureHeader?: string
  parsedSignatureInputs: ParsedSignatureInputs
  parsedSignatures: ParsedSignatures
  selectedLabel?: string
  coveredComponents: string[]
  canonicalComponents: CanonicalComponent[]
  signatureBase?: string
}

/**
 * Human-readable explanation for a verification result.
 */
export type VerificationExplanation = {
  title: string
  summary: string
  nextSteps: string[]
}

/**
 * Open Payments preset definition used by signing and verification helpers.
 */
export type PresetDefinition = {
  name: PresetName
  description: string
  baseComponents: string[]
  requireAuthorization: boolean
  includeDigestWhenBody: boolean
  requireDigestForBody: boolean
  defaultTimestamps?: {
    addCreated: boolean
    ttlSeconds: number
  }
}

export type { JsonWebKey }
