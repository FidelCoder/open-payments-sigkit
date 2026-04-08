import { parseRawHttpRequest, type HttpRequestShape } from '@open-payments-devkit/core'

export const parseHeadersText = (value: string): Record<string, string> => {
  const headers: Record<string, string> = {}

  for (const line of value.split('\n').map((entry) => entry.trim()).filter(Boolean)) {
    const separatorIndex = line.indexOf(':')

    if (separatorIndex === -1) {
      throw new Error(`Header line "${line}" must be formatted as "Name: value".`)
    }

    const name = line.slice(0, separatorIndex).trim()
    const headerValue = line.slice(separatorIndex + 1).trim()

    if (!name || !headerValue) {
      throw new Error(`Header line "${line}" must include both a name and a value.`)
    }

    headers[name] = headerValue
  }

  return headers
}

export const serializeHeaders = (headers: HttpRequestShape['headers'] = {}): string =>
  Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n')

export const serializeRequestToRawHttp = (request: HttpRequestShape): string => {
  const normalizedUrl = new URL(request.url)
  const requestTarget = `${normalizedUrl.pathname}${normalizedUrl.search}`
  const headers = {
    Host: normalizedUrl.host,
    ...(request.headers ?? {})
  }

  return [
    `${request.method.toUpperCase()} ${requestTarget || '/'} HTTP/1.1`,
    ...Object.entries(headers).map(([name, value]) => `${name}: ${value}`),
    '',
    request.body ?? ''
  ]
    .join('\n')
    .trimEnd()
}

export const buildRawRequestDraftFromFormInput = (input: {
  body: string
  headersText: string
  method: string
  url: string
}): string => {
  if (!input.method.trim() || !input.url.trim()) {
    return ''
  }

  try {
    return serializeRequestToRawHttp({
      ...(input.body.trim() ? { body: input.body } : {}),
      headers: parseHeadersText(input.headersText),
      method: input.method,
      url: input.url
    })
  } catch {
    return ''
  }
}

export const parseComponentsText = (value: string): string[] | undefined => {
  const components = value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  return components.length > 0 ? components : undefined
}

export const optionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  return Number(trimmed)
}

export const optionalString = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export const buildRequestFromFormInput = (input: {
  body?: string
  headersText?: string
  method?: string
  rawRequestText?: string
  requestScheme?: string
  url?: string
}): HttpRequestShape => {
  const rawRequestText = optionalString(input.rawRequestText ?? '')

  if (rawRequestText) {
    return parseRawHttpRequest(rawRequestText, {
      defaultScheme: optionalString(input.requestScheme ?? '') ?? 'https'
    })
  }

  return {
    ...(input.body ? { body: input.body } : {}),
    headers: parseHeadersText(input.headersText ?? ''),
    method: input.method ?? '',
    url: input.url ?? ''
  }
}
