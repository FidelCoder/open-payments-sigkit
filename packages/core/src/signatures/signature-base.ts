import type { CanonicalComponent, HttpRequestShape, ParsedSignatureInput } from '../types/public.js'
import { resolveComponentValue } from '../http/components.js'
import { serializeSignatureParameters } from './signature-input.js'

export const buildSignatureBaseParts = (
  request: HttpRequestShape,
  parsedSignatureInput: ParsedSignatureInput
): {
  canonicalComponents: CanonicalComponent[]
  signatureBase: string
} => {
  const canonicalComponents = parsedSignatureInput.components.map((componentId) => {
    const value = resolveComponentValue(request, componentId)
    const line = `${JSON.stringify(componentId)}: ${value}`

    return {
      id: componentId,
      line,
      value
    } satisfies CanonicalComponent
  })

  const signatureParamsLine = `"@signature-params": ${serializeSignatureParameters(
    parsedSignatureInput.components,
    parsedSignatureInput.params
  )}`

  return {
    canonicalComponents,
    signatureBase: [...canonicalComponents.map((entry) => entry.line), signatureParamsLine].join('\n')
  }
}

/**
 * Reconstructs the canonical signature base for a parsed Signature-Input member.
 */
export const buildSignatureBase = (
  request: HttpRequestShape,
  parsedSignatureInput: ParsedSignatureInput
): string => buildSignatureBaseParts(request, parsedSignatureInput).signatureBase

