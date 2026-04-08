import type {
  JwksShape,
  RemoteJwksFetchErrorCode,
  RemoteJwksFetchOptions
} from '../types/public.js'
import { jwksSchema } from '../types/schemas.js'

type FetchLike = typeof fetch

const DEFAULT_REMOTE_JWKS_TIMEOUT_MS = 5_000

const clearTimer = (timer: ReturnType<typeof setTimeout> | undefined): void => {
  if (timer !== undefined) {
    clearTimeout(timer)
  }
}

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && (error.name === 'AbortError' || error.message === 'This operation was aborted')

/**
 * Error raised when an opt-in remote JWKS fetch fails.
 */
export class RemoteJwksFetchError extends Error {
  public readonly code: RemoteJwksFetchErrorCode
  public readonly details?: Record<string, unknown>

  public constructor(
    code: RemoteJwksFetchErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'RemoteJwksFetchError'
  }
}

/**
 * Fetches a JWKS document from a remote URL when the caller explicitly opts in.
 */
export const fetchRemoteJwks = async (
  url: string,
  options: RemoteJwksFetchOptions & { fetchImpl?: FetchLike } = {}
): Promise<JwksShape> => {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch

  if (!fetchImpl) {
    throw new RemoteJwksFetchError(
      'REMOTE_JWKS_NETWORK_ERROR',
      'Remote JWKS fetching requires a fetch implementation in this runtime.'
    )
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_REMOTE_JWKS_TIMEOUT_MS
  const controller = new globalThis.AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: 'application/jwk-set+json, application/json',
        ...options.headers
      },
      signal: controller.signal
    })

    if (!response.ok) {
      throw new RemoteJwksFetchError(
        'REMOTE_JWKS_HTTP_ERROR',
        `Unable to fetch JWKS from "${url}" (HTTP ${response.status}).`,
        {
          status: response.status,
          statusText: response.statusText,
          url
        }
      )
    }

    let payload: unknown

    try {
      payload = await response.json()
    } catch (error) {
      throw new RemoteJwksFetchError(
        'REMOTE_JWKS_INVALID',
        `The JWKS response from "${url}" was not valid JSON.`,
        {
          cause: error instanceof Error ? error.message : String(error),
          url
        }
      )
    }

    const parsed = jwksSchema.safeParse(payload)

    if (!parsed.success) {
      throw new RemoteJwksFetchError(
        'REMOTE_JWKS_INVALID',
        `The response from "${url}" was not a valid JWKS document.`,
        {
          issues: parsed.error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path.join('.')
          })),
          url
        }
      )
    }

    return parsed.data
  } catch (error) {
    if (error instanceof RemoteJwksFetchError) {
      throw error
    }

    if (isAbortError(error)) {
      throw new RemoteJwksFetchError(
        'REMOTE_JWKS_TIMEOUT',
        `Timed out fetching JWKS from "${url}" after ${timeoutMs}ms.`,
        {
          timeoutMs,
          url
        }
      )
    }

    throw new RemoteJwksFetchError(
      'REMOTE_JWKS_NETWORK_ERROR',
      `Unable to fetch JWKS from "${url}" due to a network error.`,
      {
        cause: error instanceof Error ? error.message : String(error),
        url
      }
    )
  } finally {
    clearTimer(timer)
  }
}
