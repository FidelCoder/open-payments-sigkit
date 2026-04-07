import type {
  InspectionResult,
  PresetDefinition,
  SignedRequestResult,
  VerificationExplanation,
  VerificationResult
} from '@open-payments-devkit/core'

const divider = '\n'

export const renderSignedRequest = (result: SignedRequestResult): string =>
  [
    'Signed request',
    `Covered components: ${result.coveredComponents.join(', ')}`,
    result.contentDigest ? `Content-Digest: ${result.contentDigest}` : 'Content-Digest: none',
    `Signature-Input: ${result.signatureInput}`,
    `Signature: ${result.signature}`,
    'Signature base:',
    result.signatureBase,
    'Request JSON:',
    JSON.stringify(result.request, null, 2)
  ].join(divider)

export const renderVerification = (
  result: VerificationResult,
  explanation: VerificationExplanation
): string =>
  [
    `Verification: ${result.code}`,
    result.message,
    explanation.summary,
    explanation.nextSteps.length > 0 ? `Next steps: ${explanation.nextSteps.join(' | ')}` : '',
    result.signatureBase ? `Signature base:\n${result.signatureBase}` : '',
    result.details ? `Details:\n${JSON.stringify(result.details, null, 2)}` : ''
  ]
    .filter(Boolean)
    .join(divider)

export const renderInspection = (result: InspectionResult): string =>
  [
    'Inspection',
    result.selectedLabel ? `Selected label: ${result.selectedLabel}` : 'Selected label: none',
    `Covered components: ${result.coveredComponents.join(', ') || 'none'}`,
    'Parsed Signature-Input:',
    JSON.stringify(result.parsedSignatureInputs, null, 2),
    'Parsed Signature:',
    JSON.stringify(result.parsedSignatures, null, 2),
    result.signatureBase ? `Signature base:\n${result.signatureBase}` : 'Signature base: unavailable'
  ].join(divider)

export const renderPreset = (preset: PresetDefinition): string =>
  [
    `${preset.name}`,
    preset.description,
    `Base components: ${preset.baseComponents.join(', ')}`,
    `Requires authorization: ${preset.requireAuthorization}`,
    `Requires Content-Digest for body: ${preset.requireDigestForBody}`,
    preset.defaultTimestamps
      ? `Default timestamps: created=${preset.defaultTimestamps.addCreated}, ttl=${preset.defaultTimestamps.ttlSeconds}s`
      : 'Default timestamps: none'
  ].join(divider)

