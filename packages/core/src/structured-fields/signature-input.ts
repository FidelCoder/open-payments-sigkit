import type { ParsedSignatureInput, ParsedSignatureInputs, SignatureInputParameters } from '../types/public.js'
import {
  StructuredFieldParseError,
  parseParameterBag,
  splitDictionaryMembers,
  unquoteStructuredString
} from './shared.js'

const LABEL_PATTERN = /^[A-Za-z*][A-Za-z0-9_.*-]*$/

const findClosingParenthesis = (value: string): number => {
  let depth = 0
  let inString = false

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    const previous = value[index - 1]

    if (char === '"' && previous !== '\\') {
      inString = !inString
    }

    if (inString) {
      continue
    }

    if (char === '(') {
      depth += 1
    }

    if (char === ')') {
      depth -= 1

      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

const parseInnerList = (input: string): string[] => {
  const components: string[] = []
  let remaining = input.trim()

  while (remaining.length > 0) {
    if (!remaining.startsWith('"')) {
      throw new StructuredFieldParseError(
        `Expected a quoted covered component, received "${remaining}".`
      )
    }

    const closingIndex = remaining.indexOf('"', 1)

    if (closingIndex === -1) {
      throw new StructuredFieldParseError('Encountered an unterminated quoted component.')
    }

    const token = remaining.slice(0, closingIndex + 1)
    components.push(unquoteStructuredString(token))
    remaining = remaining.slice(closingIndex + 1).trim()
  }

  return components
}

const toSignatureInputParameters = (
  values: Record<string, number | string | true>
): SignatureInputParameters => {
  const params: SignatureInputParameters = {}

  for (const [name, value] of Object.entries(values)) {
    if (value === true) {
      throw new StructuredFieldParseError(
        `The "${name}" signature parameter must include an explicit value.`
      )
    }

    switch (name) {
      case 'created':
      case 'expires':
        if (typeof value !== 'number') {
          throw new StructuredFieldParseError(`The "${name}" parameter must be an integer.`)
        }

        params[name] = value
        break
      case 'alg':
      case 'keyid':
      case 'nonce':
      case 'tag':
        if (typeof value !== 'string') {
          throw new StructuredFieldParseError(`The "${name}" parameter must be a string.`)
        }

        params[name] = value
        break
      default:
        break
    }
  }

  return params
}

/**
 * Parses a Signature-Input header into a label-keyed dictionary.
 */
export const parseSignatureInput = (headerValue: string): ParsedSignatureInputs => {
  const members = splitDictionaryMembers(headerValue)

  if (members.length === 0) {
    throw new StructuredFieldParseError('The Signature-Input header was empty.')
  }

  const parsed: ParsedSignatureInputs = {}

  for (const member of members) {
    const equalsIndex = member.indexOf('=')

    if (equalsIndex === -1) {
      throw new StructuredFieldParseError(`Missing "=" in Signature-Input member "${member}".`)
    }

    const label = member.slice(0, equalsIndex).trim()
    const rawValue = member.slice(equalsIndex + 1).trim()

    if (!LABEL_PATTERN.test(label)) {
      throw new StructuredFieldParseError(`Invalid Signature-Input label "${label}".`)
    }

    if (!rawValue.startsWith('(')) {
      throw new StructuredFieldParseError(
        `Signature-Input member "${label}" must start with an inner list.`
      )
    }

    const closingParenthesis = findClosingParenthesis(rawValue)

    if (closingParenthesis === -1) {
      throw new StructuredFieldParseError(
        `Signature-Input member "${label}" has an unterminated inner list.`
      )
    }

    const innerList = rawValue.slice(1, closingParenthesis)
    const parameterBag = rawValue.slice(closingParenthesis + 1)
    const components = parseInnerList(innerList)
    const params = toSignatureInputParameters(parseParameterBag(parameterBag))

    parsed[label] = {
      components,
      label,
      params,
      raw: member
    } satisfies ParsedSignatureInput
  }

  return parsed
}

