import type { HttpRequestShape } from '../types/public.js'
import { httpRequestShapeSchema } from '../types/schemas.js'
import { normalizeHeaders } from './headers.js'

export type NormalizedRequest = HttpRequestShape & {
  headers: Record<string, string>
}

export const normalizeRequest = (request: HttpRequestShape): NormalizedRequest => {
  const parsed = httpRequestShapeSchema.parse(request)
  const method = parsed.method.trim()

  if (!method) {
    throw new Error('HTTP method must not be empty.')
  }

  return {
    body: parsed.body,
    headers: normalizeHeaders(parsed.headers),
    method,
    url: new URL(parsed.url).toString()
  }
}

