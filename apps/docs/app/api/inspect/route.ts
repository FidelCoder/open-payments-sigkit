import { inspectRequestSignature } from '@open-payments-devkit/core'
import { parseHeadersText } from '../../../lib/form-helpers'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const result = inspectRequestSignature({
      ...(body.body ? { body: body.body } : {}),
      headers: parseHeadersText(body.headersText ?? ''),
      method: body.method,
      url: body.url
    })

    return Response.json({ result })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to inspect request.'
      },
      { status: 400 }
    )
  }
}
