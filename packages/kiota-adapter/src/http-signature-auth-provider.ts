import type { JsonWebKey } from 'node:crypto'
import {
  signRequest,
  type PresetName,
  type SignedRequestResult
} from '@open-payments-devkit/core'

/**
 * Configuration for the HTTP Message Signatures authentication provider.
 */
export interface HttpSignatureAuthProviderOptions {
  /**
   * The Ed25519 private key in JWK format used to sign requests.
   */
  privateKeyJwk: JsonWebKey

  /**
   * The key identifier registered with the authorization server.
   * This value is included in the `keyid` parameter of Signature-Input.
   */
  keyId: string

  /**
   * Optional Open Payments preset name that determines which components
   * to include in the signature and how to handle body digests.
   *
   * Defaults to `'protected-request'` when not specified.
   */
  preset?: PresetName
}

/**
 * Describes the minimal request shape that the authentication provider
 * needs to sign a request. This is compatible with Kiota's RequestInformation
 * and standard fetch-like request objects.
 */
export interface SignableRequest {
  /** The HTTP method (GET, POST, etc.) */
  httpMethod?: string
  /** The full URL of the request */
  URL: string
  /** Request headers as an object with get/tryAdd methods or a plain record */
  headers: {
    tryAdd(key: string, value: string): void
    get(key: string): string[] | undefined
  }
  /** The request body as an ArrayBuffer, if present */
  content?: ArrayBuffer
}

/**
 * Extracts all headers from a Kiota Headers object into a plain Record.
 */
const extractHeaders = (headers: SignableRequest['headers']): Record<string, string> => {
  const result: Record<string, string> = {}

  // Kiota Headers exposes an iterator via Symbol.iterator
  const iterable = headers as unknown as Iterable<[string, string[]]>

  if (typeof iterable[Symbol.iterator] === 'function') {
    for (const [name, values] of iterable) {
      if (values.length > 0) {
        result[name.toLowerCase()] = values.join(', ')
      }
    }
  }

  return result
}

/**
 * Decodes an ArrayBuffer body into a UTF-8 string for signing purposes.
 */
const decodeBody = (content: ArrayBuffer | undefined): string | undefined => {
  if (!content || content.byteLength === 0) {
    return undefined
  }

  return new TextDecoder().decode(content)
}

/**
 * RFC 9421 HTTP Message Signatures authentication provider for
 * Kiota-generated Open Payments SDKs.
 *
 * This provider implements the Kiota `AuthenticationProvider` interface pattern
 * by mutating the `RequestInformation` object in-place to add:
 *
 * - `Content-Digest` header (when a body is present)
 * - `Signature-Input` header
 * - `Signature` header
 *
 * All signing logic is delegated to `@open-payments-devkit/core`.
 *
 * ## Usage with a Kiota-generated client
 *
 * ```typescript
 * import { HttpSignatureAuthProvider } from '@open-payments-devkit/kiota-adapter'
 * import { createClient } from './generated/client'
 *
 * const authProvider = new HttpSignatureAuthProvider({
 *   privateKeyJwk: myPrivateKey,
 *   keyId: 'my-key-id',
 *   preset: 'protected-request'
 * })
 *
 * // Use with Kiota's request adapter
 * const adapter = new FetchRequestAdapter(authProvider)
 * const client = createClient(adapter)
 * ```
 */
export class HttpSignatureAuthProvider {
  private readonly privateKeyJwk: JsonWebKey
  private readonly keyId: string
  private readonly preset: PresetName

  public constructor(options: HttpSignatureAuthProviderOptions) {
    if (!options.privateKeyJwk) {
      throw new Error('privateKeyJwk is required for HTTP signature authentication.')
    }

    if (!options.keyId) {
      throw new Error('keyId is required for HTTP signature authentication.')
    }

    this.privateKeyJwk = options.privateKeyJwk
    this.keyId = options.keyId
    this.preset = options.preset ?? 'protected-request'
  }

  /**
   * Signs an outgoing HTTP request by adding RFC 9421 signature headers.
   *
   * This method implements the Kiota `AuthenticationProvider.authenticateRequest`
   * contract: it receives a `RequestInformation` object and mutates it in-place
   * to include the necessary signature headers.
   *
   * @param request - The Kiota RequestInformation to sign.
   * @param _additionalAuthenticationContext - Reserved for future use.
   * @returns A promise that resolves when the request has been signed.
   */
  public async authenticateRequest(
    request: SignableRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    additionalAuthenticationContext?: Record<string, unknown>
  ): Promise<void> {
    const method = request.httpMethod ?? 'GET'
    const url = request.URL
    const existingHeaders = extractHeaders(request.headers)
    const body = decodeBody(request.content)

    const coreRequest = {
      method,
      url,
      headers: existingHeaders,
      ...(body !== undefined ? { body } : {})
    }

    const signed: SignedRequestResult = signRequest(coreRequest, {
      keyId: this.keyId,
      privateKeyJwk: this.privateKeyJwk,
      preset: this.preset
    })

    // Apply signature headers back to the Kiota request
    if (signed.contentDigest) {
      request.headers.tryAdd('content-digest', signed.contentDigest)
    }

    request.headers.tryAdd('signature-input', signed.signatureInput)
    request.headers.tryAdd('signature', signed.signature)
  }

  /**
   * Signs a plain request object and returns the full signing result.
   *
   * This is a convenience method for non-Kiota usage scenarios where
   * the caller wants the complete `SignedRequestResult` instead of
   * in-place header mutation.
   */
  public signPlainRequest(request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: string
  }): SignedRequestResult {
    return signRequest(request, {
      keyId: this.keyId,
      privateKeyJwk: this.privateKeyJwk,
      preset: this.preset
    })
  }
}
