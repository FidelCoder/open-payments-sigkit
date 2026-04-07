import type { ParsedSignature, ParsedSignatures } from '../types/public.js'
import { StructuredFieldParseError, splitDictionaryMembers } from './shared.js'

const LABEL_PATTERN = /^[A-Za-z*][A-Za-z0-9_.*-]*$/

/**
 * Parses a Signature header into a label-keyed dictionary of byte sequences.
 */
export const parseSignature = (headerValue: string): ParsedSignatures => {
  const members = splitDictionaryMembers(headerValue)

  if (members.length === 0) {
    throw new StructuredFieldParseError('The Signature header was empty.')
  }

  const parsed: ParsedSignatures = {}

  for (const member of members) {
    const equalsIndex = member.indexOf('=')

    if (equalsIndex === -1) {
      throw new StructuredFieldParseError(`Missing "=" in Signature member "${member}".`)
    }

    const label = member.slice(0, equalsIndex).trim()
    const rawValue = member.slice(equalsIndex + 1).trim()
    const match = rawValue.match(/^:([^:]+):$/)

    if (!LABEL_PATTERN.test(label)) {
      throw new StructuredFieldParseError(`Invalid Signature label "${label}".`)
    }

    if (!match) {
      throw new StructuredFieldParseError(
        `Signature member "${label}" must be encoded as an RFC 8941 byte sequence.`
      )
    }

    const value = match[1]

    if (!value) {
      throw new StructuredFieldParseError(`Signature member "${label}" contained an empty value.`)
    }

    parsed[label] = {
      label,
      raw: member,
      value
    } satisfies ParsedSignature
  }

  return parsed
}
