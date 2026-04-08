import { CONTENT_DIGEST_HEADER, SIGNATURE_HEADER, SIGNATURE_INPUT_HEADER } from '../constants/headers.js'
import {
  UnsupportedAlgorithmError,
  assertSupportedPublicJwk,
  isSupportedSignatureAlgorithm,
  verifyEd25519
} from '../crypto/ed25519.js'
import { RequestComponentResolutionError } from '../http/components.js'
import { normalizeRequest } from '../http/request.js'
import { resolveVerificationKey } from '../jwk/resolve.js'
import { getPreset } from '../presets/get-preset.js'
import { parseSignatureInput } from '../structured-fields/signature-input.js'
import { parseSignature } from '../structured-fields/signature.js'
import type {
  ParsedSignatureInput,
  PresetDefinition,
  VerificationCode,
  VerificationResult,
  VerifyRequestOptions
} from '../types/public.js'
import { httpRequestShapeSchema, verifyRequestOptionsSchema } from '../types/schemas.js'
import { normalizeComponentList } from '../utils/components.js'
import { verifyContentDigest } from './content-digest.js'
import { buildSignatureBase } from './signature-base.js'

const createFailure = (
  code: Exclude<VerificationCode, 'OK'>,
  message: string,
  details?: Record<string, unknown>,
  extras?: Pick<VerificationResult, 'coveredComponents' | 'signatureBase'>
): VerificationResult => ({
  code,
  details,
  message,
  ok: false,
  ...(extras?.coveredComponents ? { coveredComponents: extras.coveredComponents } : {}),
  ...(extras?.signatureBase ? { signatureBase: extras.signatureBase } : {})
})

const findMatchingSignatureLabel = (
  signatureInputMembers: Record<string, ParsedSignatureInput>,
  signatureMembers: Record<string, { label: string }>
): string | undefined => {
  for (const label of Object.keys(signatureInputMembers)) {
    if (signatureMembers[label]) {
      return label
    }
  }

  return undefined
}

const resolveRequiredComponents = (
  preset: PresetDefinition | undefined,
  options: VerifyRequestOptions,
  hasBody: boolean,
  requireDigestForBody: boolean
): string[] => {
  const presetComponents = preset?.baseComponents ?? []
  const configuredComponents = options.requiredComponents ?? []
  const dynamicComponents = hasBody && requireDigestForBody ? [CONTENT_DIGEST_HEADER] : []

  return normalizeComponentList([...presetComponents, ...configuredComponents, ...dynamicComponents])
}

/**
 * Verifies a signed HTTP request and returns a typed success or failure payload.
 */
export const verifyRequest = (
  request: Parameters<typeof httpRequestShapeSchema.parse>[0],
  options: Parameters<typeof verifyRequestOptionsSchema.parse>[0] = {}
): VerificationResult => {
  const normalizedRequest = normalizeRequest(httpRequestShapeSchema.parse(request))
  const parsedOptions = verifyRequestOptionsSchema.parse(options)
  const preset = parsedOptions.preset ? getPreset(parsedOptions.preset) : undefined
  const requestBody = normalizedRequest.body
  const hasBody = requestBody !== undefined
  const requireDigestForBody =
    parsedOptions.requireDigestForBody ?? preset?.requireDigestForBody ?? hasBody
  const requiredComponents = resolveRequiredComponents(
    preset,
    parsedOptions,
    hasBody,
    requireDigestForBody
  )
  const contentDigest = normalizedRequest.headers[CONTENT_DIGEST_HEADER]

  if (hasBody && requireDigestForBody && !contentDigest) {
    return createFailure(
      'MISSING_CONTENT_DIGEST',
      'The request body is present but the Content-Digest header is missing.',
      {
        header: CONTENT_DIGEST_HEADER
      }
    )
  }

  if (requestBody !== undefined && contentDigest && !verifyContentDigest(requestBody, contentDigest)) {
    return createFailure(
      'INVALID_CONTENT_DIGEST',
      'The Content-Digest header does not match the supplied request body.',
      {
        header: CONTENT_DIGEST_HEADER,
        expected: 'sha-256 digest of request body',
        received: contentDigest
      }
    )
  }

  const signatureHeader = normalizedRequest.headers[SIGNATURE_HEADER]

  if (!signatureHeader) {
    return createFailure('MISSING_SIGNATURE', 'The Signature header is missing from the request.')
  }

  const signatureInputHeader = normalizedRequest.headers[SIGNATURE_INPUT_HEADER]

  if (!signatureInputHeader) {
    return createFailure(
      'MISSING_SIGNATURE_INPUT',
      'The Signature-Input header is missing from the request.'
    )
  }

  try {
    const parsedSignatureInputs = parseSignatureInput(signatureInputHeader)
    const parsedSignatures = parseSignature(signatureHeader)
    const label = findMatchingSignatureLabel(parsedSignatureInputs, parsedSignatures)

    if (!label) {
      return createFailure(
        'MISSING_SIGNATURE',
        'The Signature and Signature-Input headers did not contain a matching label.',
        {
          signatureInputLabels: Object.keys(parsedSignatureInputs),
          signatureLabels: Object.keys(parsedSignatures)
        }
      )
    }

    const parsedSignatureInput = parsedSignatureInputs[label]
    const parsedSignature = parsedSignatures[label]

    if (!parsedSignatureInput || !parsedSignature) {
      return createFailure(
        'INVALID_SIGNATURE_INPUT',
        `The selected signature label "${label}" was not available in both signature headers.`
      )
    }

    if (
      parsedSignatureInput.params.alg &&
      !isSupportedSignatureAlgorithm(parsedSignatureInput.params.alg)
    ) {
      return createFailure(
        'UNSUPPORTED_ALGORITHM',
        `The Signature-Input alg parameter "${parsedSignatureInput.params.alg}" is not supported.`,
        {
          alg: parsedSignatureInput.params.alg
        },
        {
          coveredComponents: parsedSignatureInput.components
        }
      )
    }

    const missingComponents = requiredComponents.filter(
      (component) => !parsedSignatureInput.components.includes(component)
    )

    if (missingComponents.length > 0) {
      return createFailure(
        'MISSING_REQUIRED_COMPONENT',
        'The signature did not cover the components required by the verification policy.',
        {
          missingComponents
        },
        {
          coveredComponents: parsedSignatureInput.components
        }
      )
    }

    const keyResolution = resolveVerificationKey(parsedSignatureInput.params.keyid, parsedOptions)
    const publicKeyJwk = keyResolution.key

    if (!publicKeyJwk) {
      return createFailure(
        'KEY_NOT_FOUND',
        keyResolution.message ?? 'The verifier could not locate a public key for the signature key ID.',
        keyResolution.details,
        {
          coveredComponents: parsedSignatureInput.components
        }
      )
    }

    assertSupportedPublicJwk(publicKeyJwk)

    const signatureBase = buildSignatureBase(normalizedRequest, parsedSignatureInput)

    if (!verifyEd25519(signatureBase, parsedSignature.value, publicKeyJwk)) {
      return createFailure(
        'SIGNATURE_MISMATCH',
        'The signature did not match the reconstructed signature base.',
        {
          keyId: parsedSignatureInput.params.keyid,
          label
        },
        {
          coveredComponents: parsedSignatureInput.components,
          signatureBase
        }
      )
    }

    return {
      code: 'OK',
      coveredComponents: parsedSignatureInput.components,
      message: 'The request signature and covered components verified successfully.',
      ok: true,
      signatureBase
    }
  } catch (error) {
    if (error instanceof UnsupportedAlgorithmError) {
      return createFailure('UNSUPPORTED_ALGORITHM', error.message)
    }

    if (error instanceof RequestComponentResolutionError) {
      return createFailure(
        'REQUEST_COMPONENT_MISMATCH',
        error.message,
        {
          component: error.componentId
        }
      )
    }

    return createFailure(
      'INVALID_SIGNATURE_INPUT',
      error instanceof Error
        ? error.message
        : 'The Signature-Input header could not be parsed or validated.'
    )
  }
}
