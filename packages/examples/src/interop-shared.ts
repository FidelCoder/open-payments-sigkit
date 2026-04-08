import type { JsonWebKey } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import type { HttpRequestShape } from '@open-payments-devkit/core'
import { parseRawHttpRequest } from '@open-payments-devkit/core'

export const readJsonFile = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, 'utf8')) as T

export const readTextFile = async (path: string): Promise<string> => readFile(path, 'utf8')

export const writeMaybe = async (path: string | undefined, data: string): Promise<void> => {
  if (path) {
    await writeFile(path, data, 'utf8')
  }
}

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

export const loadRequestInput = async (options: {
  body?: string
  bodyFile?: string
  defaultScheme?: string
  headers?: string[]
  method?: string
  rawRequestFile?: string
  requestFile?: string
  url?: string
}): Promise<HttpRequestShape> => {
  const configuredSources = [
    options.requestFile ? '--request-file' : undefined,
    options.rawRequestFile ? '--raw-request-file' : undefined,
    options.method || options.url || options.body || options.bodyFile || options.headers?.length
      ? 'inline request fields'
      : undefined
  ].filter((source): source is string => Boolean(source))

  if (configuredSources.length > 1) {
    throw new Error(
      `Choose one request source: ${configuredSources.join(', ')}. These options are mutually exclusive.`
    )
  }

  if (options.requestFile) {
    return readJsonFile<HttpRequestShape>(options.requestFile)
  }

  if (options.rawRequestFile) {
    const rawRequest = await readTextFile(options.rawRequestFile)
    return parseRawHttpRequest(rawRequest, {
      defaultScheme: options.defaultScheme
    })
  }

  if (!options.method || !options.url) {
    throw new Error(
      'Provide either --request-file, --raw-request-file, or inline request fields with --method and --url.'
    )
  }

  const body = options.bodyFile ? await readTextFile(options.bodyFile) : options.body

  return {
    ...(body ? { body } : {}),
    headers: parseHeaderList(options.headers),
    method: options.method,
    url: options.url
  }
}

export const serializeRawHttpRequest = (request: HttpRequestShape): string => {
  const targetUrl = new URL(request.url)
  const requestTarget = `${targetUrl.pathname}${targetUrl.search}` || '/'
  const existingHeaders = request.headers ?? {}
  const headers = {
    ...(existingHeaders.host ? {} : { host: targetUrl.host }),
    ...existingHeaders
  }

  return [
    `${request.method} ${requestTarget} HTTP/1.1`,
    ...Object.entries(headers).map(([name, value]) => `${name}: ${value}`),
    '',
    request.body ?? ''
  ].join('\n')
}

export const toPublicJwk = (privateKeyJwk: JsonWebKey): JsonWebKey => {
  const publicKeyJwk = { ...privateKeyJwk }

  delete publicKeyJwk.d

  return publicKeyJwk
}
