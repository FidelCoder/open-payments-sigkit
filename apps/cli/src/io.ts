import { readFile, writeFile } from 'node:fs/promises'
import type { HttpRequestShape } from '@open-payments-devkit/core'

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
