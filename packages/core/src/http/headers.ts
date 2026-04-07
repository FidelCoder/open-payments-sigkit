import type { HttpRequestShape } from '../types/public.js'

export const normalizeHeaderName = (name: string): string => name.trim().toLowerCase()

export const normalizeHeaderValue = (value: string): string => value.trim()

export const normalizeHeaders = (
  headers: HttpRequestShape['headers'] = {}
): Record<string, string> => {
  const normalized: Record<string, string> = {}

  for (const [name, value] of Object.entries(headers)) {
    normalized[normalizeHeaderName(name)] = normalizeHeaderValue(value)
  }

  return normalized
}

