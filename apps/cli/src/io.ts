import { readFile, writeFile } from 'node:fs/promises'
import { parseRawHttpRequest, type HttpRequestShape } from '@open-payments-devkit/core'

export const collect = (value: string, previous: string[] = []): string[] => [...previous, value]

export const readTextInput = async (
  body?: string,
  bodyFile?: string
): Promise<string | undefined> => {
  if (bodyFile) {
    return readFile(bodyFile, 'utf8')
  }

  return body
}

export const readJsonFile = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, 'utf8')) as T

export const parseHeaderList = (headers: string[] = []): Record<string, string> => {
  const parsed: Record<string, string> = {}

  for (const header of headers) {
    const separatorIndex = header.indexOf(':')

    if (separatorIndex === -1) {
      throw new Error(`Header "${header}" must be formatted as "Name: value".`)
    }

    const name = header.slice(0, separatorIndex).trim()
    const value = header.slice(separatorIndex + 1).trim()

    if (!name || !value) {
      throw new Error(`Header "${header}" must include both a name and a value.`)
    }

    parsed[name] = value
  }

  return parsed
}

export const writeMaybe = async (path: string | undefined, data: string): Promise<void> => {
  if (path) {
    await writeFile(path, data, 'utf8')
  }
}

export const buildRequestFromOptions = async (options: {
  body?: string
  bodyFile?: string
  header?: string[]
  headers?: string[]
  method: string
  url: string
}): Promise<HttpRequestShape> => {
  const body = await readTextInput(options.body, options.bodyFile)

  return {
    ...(body ? { body } : {}),
    headers: parseHeaderList(options.headers ?? options.header),
    method: options.method,
    url: options.url
  }
}

const assertSingleRequestSource = (sources: string[]): void => {
  if (sources.length > 1) {
    throw new Error(
      `Choose one request source: ${sources.join(', ')}. Inline fields, --request-file, and --raw-request-file are mutually exclusive.`
    )
  }
}

export const loadRequestInput = async (options: {
  body?: string
  bodyFile?: string
  defaultScheme?: string
  header?: string[]
  headers?: string[]
  method?: string
  rawRequestFile?: string
  requestFile?: string
  url?: string
}): Promise<HttpRequestShape> => {
  const sources: string[] = []
  const hasInlineRequest =
    Boolean(options.method?.trim()) ||
    Boolean(options.url?.trim()) ||
    Boolean(options.body) ||
    Boolean(options.bodyFile) ||
    Boolean(options.headers?.length) ||
    Boolean(options.header?.length)

  if (hasInlineRequest) {
    sources.push('inline fields')
  }

  if (options.requestFile) {
    sources.push('--request-file')
  }

  if (options.rawRequestFile) {
    sources.push('--raw-request-file')
  }

  assertSingleRequestSource(sources)

  if (options.requestFile) {
    return readJsonFile<HttpRequestShape>(options.requestFile)
  }

  if (options.rawRequestFile) {
    const rawRequest = await readFile(options.rawRequestFile, 'utf8')
    return parseRawHttpRequest(rawRequest, {
      defaultScheme: options.defaultScheme
    })
  }

  if (!options.method?.trim() || !options.url?.trim()) {
    throw new Error(
      'Provide either inline request fields (--method and --url), --request-file, or --raw-request-file.'
    )
  }

  return buildRequestFromOptions({
    body: options.body,
    bodyFile: options.bodyFile,
    headers: options.headers ?? options.header,
    method: options.method,
    url: options.url
  })
}
