import type { HttpRequestShape } from '../types/public.js'
import { normalizeHeaderName } from './headers.js'

export class RequestComponentResolutionError extends Error {
  public readonly componentId: string

  public constructor(componentId: string, message: string) {
    super(message)
    this.componentId = componentId
    this.name = 'RequestComponentResolutionError'
  }
}

export const resolveComponentValue = (request: HttpRequestShape, componentId: string): string => {
  switch (componentId) {
    case '@method':
      return request.method
    case '@target-uri':
      return new URL(request.url).toString()
    default: {
      const headerName = normalizeHeaderName(componentId)
      const value = request.headers?.[headerName]

      if (value === undefined) {
        throw new RequestComponentResolutionError(
          componentId,
          `The request did not include the covered component "${componentId}".`
        )
      }

      return value
    }
  }
}

