import { explainVerificationResult, verifyRequest } from '@open-payments-devkit/core'
import { optionalString, parseComponentsText, parseHeadersText } from '../../../lib/form-helpers'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const result = verifyRequest(
      {
        ...(body.body ? { body: body.body } : {}),
        headers: parseHeadersText(body.headersText ?? ''),
        method: body.method,
        url: body.url
      },
      {
        jwks: body.jwksText?.trim() ? JSON.parse(body.jwksText) : undefined,
        preset: optionalString(body.preset ?? '') as never,
        publicKeyJwk: body.publicKeyJwkText?.trim() ? JSON.parse(body.publicKeyJwkText) : undefined,
        requireDigestForBody: Boolean(body.requireDigestForBody),
        requiredComponents: parseComponentsText(body.requiredComponentsText ?? '')
      }
    )

    return Response.json({
      explanation: explainVerificationResult(result),
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

