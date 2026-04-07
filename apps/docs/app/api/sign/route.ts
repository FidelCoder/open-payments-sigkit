import { signRequest } from '@open-payments-devkit/core'
import { optionalNumber, optionalString, parseComponentsText, parseHeadersText } from '../../../lib/form-helpers'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const result = signRequest(
      {
        ...(body.body ? { body: body.body } : {}),
        headers: parseHeadersText(body.headersText ?? ''),
        method: body.method,
        url: body.url
      },
      {
        components: parseComponentsText(body.componentsText ?? ''),
        created: optionalNumber(body.created ?? ''),
        expires: optionalNumber(body.expires ?? ''),
        keyId: body.keyId,
        nonce: optionalString(body.nonce ?? ''),
        preset: optionalString(body.preset ?? '') as never,
        privateKeyJwk: JSON.parse(body.privateKeyJwkText),
        tag: optionalString(body.tag ?? '')
      }
    )

    return Response.json({ result })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to sign request.'
      },
      { status: 400 }
    )
  }
}

