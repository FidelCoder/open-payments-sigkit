import { uniqueStrings } from './collections.js'

export const normalizeComponentId = (value: string): string => {
  const trimmed = value.trim().replace(/^"|"$/g, '')
  return trimmed.startsWith('@') ? trimmed : trimmed.toLowerCase()
}

export const normalizeComponentList = (values: string[]): string[] =>
  uniqueStrings(values.map(normalizeComponentId).filter(Boolean))

