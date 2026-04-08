import { inspectRequestSignature } from '@open-payments-devkit/core'
import { buildRequestFromFormInput } from '../../../lib/form-helpers'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const parsedRequest = buildRequestFromFormInput(body)
    const result = inspectRequestSignature(parsedRequest)

    return Response.json({
      request: parsedRequest,
      result
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to inspect request.'
      },
      { status: 400 }
    )
  }
}
