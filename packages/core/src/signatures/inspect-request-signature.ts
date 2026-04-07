import { SIGNATURE_HEADER, SIGNATURE_INPUT_HEADER } from '../constants/headers.js'
import { normalizeRequest } from '../http/request.js'
import { parseSignatureInput } from '../structured-fields/signature-input.js'
import { parseSignature } from '../structured-fields/signature.js'
import type { InspectionResult } from '../types/public.js'
import { httpRequestShapeSchema } from '../types/schemas.js'
import { buildSignatureBaseParts } from './signature-base.js'

const selectInspectionLabel = (
  parsedSignatureInputs: InspectionResult['parsedSignatureInputs'],
  parsedSignatures: InspectionResult['parsedSignatures']
): string | undefined => {
  for (const label of Object.keys(parsedSignatureInputs)) {
    if (parsedSignatures[label]) {
      return label
    }
  }

  return Object.keys(parsedSignatureInputs)[0]
}

/**
 * Parses signature headers and reconstructs the canonical base for inspection.
 */
export const inspectRequestSignature = (
  request: Parameters<typeof httpRequestShapeSchema.parse>[0]
): InspectionResult => {
  const normalizedRequest = normalizeRequest(httpRequestShapeSchema.parse(request))
  const signatureInputHeader = normalizedRequest.headers[SIGNATURE_INPUT_HEADER]
  const signatureHeader = normalizedRequest.headers[SIGNATURE_HEADER]
  const parsedSignatureInputs = signatureInputHeader ? parseSignatureInput(signatureInputHeader) : {}
  const parsedSignatures = signatureHeader ? parseSignature(signatureHeader) : {}
  const selectedLabel = selectInspectionLabel(parsedSignatureInputs, parsedSignatures)

  if (!selectedLabel) {
    return {
      canonicalComponents: [],
      coveredComponents: [],
      parsedSignatureInputs,
      parsedSignatures,
      signatureHeader,
      signatureInputHeader
    }
  }

  const selectedSignatureInput = parsedSignatureInputs[selectedLabel]

  if (!selectedSignatureInput) {
    throw new Error(`Unable to locate Signature-Input member "${selectedLabel}".`)
  }

  const { canonicalComponents, signatureBase } = buildSignatureBaseParts(
    normalizedRequest,
    selectedSignatureInput
  )

  return {
    canonicalComponents,
    coveredComponents: selectedSignatureInput.components,
    parsedSignatureInputs,
    parsedSignatures,
    selectedLabel,
    signatureBase,
    signatureHeader,
    signatureInputHeader
  }
}
