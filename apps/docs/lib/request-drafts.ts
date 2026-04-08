const parseHeadersText = (value: string): Record<string, string> => {
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

export const serializeRequestToRawHttp = (request: {
  body?: string
  headers?: Record<string, string>
  method: string
  url: string
}): string => {
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
