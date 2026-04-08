import { explainVerificationResult, fetchRemoteJwks, verifyRequest } from '@open-payments-devkit/core'
import {
  buildRequestFromFormInput,
  optionalNumber,
  optionalString,
  parseComponentsText
} from '../../../lib/form-helpers'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const parsedRequest = buildRequestFromFormInput(body)
    const remoteJwksUrl = optionalString(body.jwksUrl ?? '')
    const jwks =
      remoteJwksUrl
        ? await fetchRemoteJwks(remoteJwksUrl, {
            timeoutMs: optionalNumber(body.jwksTimeoutMs ?? '')
          })
        : body.jwksText?.trim()
          ? JSON.parse(body.jwksText)
          : undefined

    const result = verifyRequest(parsedRequest, {
      jwks,
      preset: optionalString(body.preset ?? '') as never,
      publicKeyJwk: body.publicKeyJwkText?.trim() ? JSON.parse(body.publicKeyJwkText) : undefined,
      requireDigestForBody: Boolean(body.requireDigestForBody),
      requiredComponents: parseComponentsText(body.requiredComponentsText ?? '')
    })

    return Response.json({
      explanation: explainVerificationResult(result),
      request: parsedRequest,
      result
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to verify request.'
      },
      { status: 400 }
    )
  }
}
