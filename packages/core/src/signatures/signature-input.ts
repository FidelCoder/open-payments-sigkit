import type { ParsedSignatureInput, SignatureInputParameters } from '../types/public.js'

const PARAMETER_ORDER = ['created', 'expires', 'nonce', 'keyid', 'alg', 'tag'] as const

const serializeParameterValue = (
  name: keyof SignatureInputParameters,
  value: NonNullable<SignatureInputParameters[keyof SignatureInputParameters]>
): string => {
  if (name === 'created' || name === 'expires') {
    return String(value)
  }

  return JSON.stringify(value)
}

export const serializeSignatureParameters = (
  components: string[],
  params: SignatureInputParameters
): string => {
  const serializedComponents = components.map((component) => JSON.stringify(component)).join(' ')
  const serializedParams = PARAMETER_ORDER.flatMap((name) => {
    const value = params[name]

    if (value === undefined) {
      return []
    }

    return [`;${name}=${serializeParameterValue(name, value)}`]
  }).join('')

  return `(${serializedComponents})${serializedParams}`
}

export const createParsedSignatureInput = (
  label: string,
  components: string[],
  params: SignatureInputParameters
): ParsedSignatureInput => ({
  components,
  label,
  params,
  raw: `${label}=${serializeSignatureParameters(components, params)}`
})

/**
 * Serializes a Signature-Input member for the provided label and parameters.
 */
export const serializeSignatureInput = (
  label: string,
  components: string[],
  params: SignatureInputParameters
): string => `${label}=${serializeSignatureParameters(components, params)}`

