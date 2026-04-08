import type { HttpRequestShape, RawHttpRequestParseOptions } from '../types/public.js'
import { normalizeHeaderName, normalizeHeaderValue } from './headers.js'

const REQUEST_LINE_PATTERN = /^(\S+)\s+(\S+)(?:\s+HTTP\/\d(?:\.\d)?)?$/

const resolveRawRequestUrl = (
  target: string,
  headers: Record<string, string>,
  options: RawHttpRequestParseOptions
): string => {
  if (/^https?:\/\//i.test(target)) {
    return new URL(target).toString()
  }

  const authority = headers.host ?? headers[':authority']

  if (!authority) {
    throw new Error(
      'A raw HTTP request with a relative request target must include a Host header or use an absolute target URL.'
    )
  }

  const defaultScheme = options.defaultScheme?.trim() || 'https'

  return new URL(target, `${defaultScheme}://${authority}`).toString()
}

/**
 * Parses a captured HTTP request string into the shared request model used by the toolkit.
 */
export const parseRawHttpRequest = (
  rawRequest: string,
  options: RawHttpRequestParseOptions = {}
): HttpRequestShape => {
  const normalizedInput = rawRequest.replace(/\r\n/g, '\n').trim()

  if (!normalizedInput) {
    throw new Error('A raw HTTP request is required.')
  }

  const separatorIndex = normalizedInput.indexOf('\n\n')
  const head = separatorIndex === -1 ? normalizedInput : normalizedInput.slice(0, separatorIndex)
  const body = separatorIndex === -1 ? '' : normalizedInput.slice(separatorIndex + 2)
  const lines = head.split('\n')
  const requestLine = lines.shift()?.trim()

  if (!requestLine) {
    throw new Error('The raw HTTP request is missing a request line.')
  }

  const requestLineMatch = REQUEST_LINE_PATTERN.exec(requestLine)

  if (!requestLineMatch) {
    throw new Error(
      'The raw HTTP request line must be formatted as "METHOD /path HTTP/1.1" or use an absolute target URL.'
    )
  }

  const method = requestLineMatch[1]
  const target = requestLineMatch[2]

  if (!method || !target) {
    throw new Error(
      'The raw HTTP request line must include both an HTTP method and a request target.'
    )
  }

  const headers: Record<string, string> = {}
  let currentHeaderName: string | undefined

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      continue
    }

    if (/^\s/.test(rawLine) && currentHeaderName) {
      headers[currentHeaderName] = `${headers[currentHeaderName]} ${rawLine.trim()}`
      continue
    }

    const separatorIndex = rawLine.indexOf(':')

    if (separatorIndex === -1) {
      throw new Error(`The raw HTTP header line "${rawLine}" must be formatted as "Name: value".`)
    }

    const name = normalizeHeaderName(rawLine.slice(0, separatorIndex))
    const value = normalizeHeaderValue(rawLine.slice(separatorIndex + 1))

    if (!name || !value) {
      throw new Error(`The raw HTTP header line "${rawLine}" must include both a name and a value.`)
    }

    headers[name] = headers[name] ? `${headers[name]}, ${value}` : value
    currentHeaderName = name
  }

  return {
    ...(body ? { body } : {}),
    headers,
    method,
    url: resolveRawRequestUrl(target, headers, options)
  }
}
