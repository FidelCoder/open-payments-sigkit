import type { HttpRequestShape } from '@open-payments-devkit/core'

export const formatJson = (value: unknown): string => JSON.stringify(value, null, 2)

export const formatRequestSummary = (request: HttpRequestShape) => [
  {
    label: 'Method',
    value: request.method || '—'
  },
  {
    label: 'URL',
    value: request.url || '—'
  },
  {
    label: 'Headers',
    value: String(Object.keys(request.headers ?? {}).length)
  },
  {
    label: 'Body',
    value: request.body ? `${request.body.length} chars` : 'No body'
  }
] as const

export const joinLines = (values: string[] | undefined, emptyLabel: string): string =>
  values && values.length > 0 ? values.join('\n') : emptyLabel
