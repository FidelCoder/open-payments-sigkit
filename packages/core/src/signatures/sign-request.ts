import { DEFAULT_SIGNATURE_LABEL } from '../constants/algorithms.js'
import {
  AUTHORIZATION_HEADER,
  CONTENT_DIGEST_HEADER,
  SIGNATURE_HEADER,
  SIGNATURE_INPUT_HEADER
} from '../constants/headers.js'
import { assertSupportedPrivateJwk, signEd25519 } from '../crypto/ed25519.js'
import { normalizeRequest } from '../http/request.js'
import { getPreset } from '../presets/get-preset.js'
import type {
  PresetDefinition,
  SignRequestOptions,
  SignedRequestResult,
  SignatureInputParameters
} from '../types/public.js'
import { httpRequestShapeSchema, signRequestOptionsSchema } from '../types/schemas.js'
import { normalizeComponentList } from '../utils/components.js'
import { createContentDigest } from './content-digest.js'
import { buildSignatureBase } from './signature-base.js'
import { createParsedSignatureInput, serializeSignatureInput } from './signature-input.js'

const resolveCoveredComponents = (
  preset: PresetDefinition | undefined,
  options: SignRequestOptions,
  hasBody: boolean
): string[] => {
  const baseComponents = preset?.baseComponents ?? []
  const configuredComponents = options.components ?? []
  const dynamicComponents = hasBody && (preset?.includeDigestWhenBody ?? true) ? [CONTENT_DIGEST_HEADER] : []

  return normalizeComponentList([...baseComponents, ...configuredComponents, ...dynamicComponents])
}

const resolveSignatureInputParameters = (
  preset: PresetDefinition | undefined,
  options: SignRequestOptions
): SignatureInputParameters => {
  const params: SignatureInputParameters = {
    created: options.created,
    expires: options.expires,
    keyid: options.keyId,
    nonce: options.nonce,
    tag: options.tag
  }

  if (preset?.defaultTimestamps?.addCreated) {
    const created = params.created ?? Math.floor(Date.now() / 1000)
    params.created = created
    params.expires = params.expires ?? created + preset.defaultTimestamps.ttlSeconds
  }

  return params
}

/**
 * Signs an HTTP request with Ed25519 and returns the canonical signature base.
 */
export const signRequest = (
  request: Parameters<typeof httpRequestShapeSchema.parse>[0],
  options: Parameters<typeof signRequestOptionsSchema.parse>[0]
): SignedRequestResult => {
  const normalizedRequest = normalizeRequest(httpRequestShapeSchema.parse(request))
  const parsedOptions = signRequestOptionsSchema.parse(options)
  const preset = parsedOptions.preset ? getPreset(parsedOptions.preset) : undefined
  const requestBody = normalizedRequest.body

  assertSupportedPrivateJwk(parsedOptions.privateKeyJwk)

  const headers = { ...normalizedRequest.headers }
  const hasBody = requestBody !== undefined

  if (requestBody !== undefined) {
    headers[CONTENT_DIGEST_HEADER] = createContentDigest(requestBody)
  }

  if (preset?.requireAuthorization && !headers[AUTHORIZATION_HEADER]) {
    throw new Error(`The "${preset.name}" preset requires an Authorization header on the request.`)
  }

  const coveredComponents = resolveCoveredComponents(preset, parsedOptions, hasBody)
  const params = resolveSignatureInputParameters(preset, parsedOptions)
  const signatureInput = serializeSignatureInput(DEFAULT_SIGNATURE_LABEL, coveredComponents, params)
  const requestToSign = {
    ...normalizedRequest,
    headers
  }
  const parsedSignatureInput = createParsedSignatureInput(DEFAULT_SIGNATURE_LABEL, coveredComponents, params)
  const signatureBase = buildSignatureBase(requestToSign, parsedSignatureInput)
  const signatureValue = signEd25519(signatureBase, parsedOptions.privateKeyJwk)
  const signature = `${DEFAULT_SIGNATURE_LABEL}=:${signatureValue}:`

  const signedRequest = {
    ...requestToSign,
    headers: {
      ...headers,
      [SIGNATURE_HEADER]: signature,
      [SIGNATURE_INPUT_HEADER]: signatureInput
    }
  }

  return {
    contentDigest: headers[CONTENT_DIGEST_HEADER],
    coveredComponents,
    request: signedRequest,
    signature,
    signatureBase,
    signatureInput
  }
}
