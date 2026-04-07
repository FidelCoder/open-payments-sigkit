import { createHash } from 'node:crypto'
import { CONTENT_DIGEST_ALGORITHM } from '../constants/algorithms.js'
import { encodeBase64, encodeUtf8 } from '../utils/base64.js'

const CONTENT_DIGEST_PATTERN = /^([A-Za-z0-9_-]+)=:([^:]+):$/

/**
 * Creates an RFC 9530 Content-Digest header value for a request body.
 */
export const createContentDigest = (body: string): string => {
  const digest = createHash('sha256').update(encodeUtf8(body)).digest()
  return `${CONTENT_DIGEST_ALGORITHM}=:${encodeBase64(digest)}:`
}

export const verifyContentDigest = (body: string, headerValue: string): boolean => {
  const match = headerValue.trim().match(CONTENT_DIGEST_PATTERN)

  if (!match) {
    return false
  }

  const [, algorithm] = match

  if (!algorithm) {
    return false
  }

  if (algorithm.toLowerCase() !== CONTENT_DIGEST_ALGORITHM) {
    return false
  }

  return createContentDigest(body) === headerValue.trim()
}
