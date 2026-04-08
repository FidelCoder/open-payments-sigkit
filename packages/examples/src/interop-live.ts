import type { JsonWebKey } from 'node:crypto'
import { parseArgs } from 'node:util'
import type { SignedRequestResult, VerificationResult } from '@open-payments-devkit/core'
import { signRequest, verifyRequest } from '@open-payments-devkit/core'
import {
  loadRequestInput,
  readJsonFile,
  serializeRawHttpRequest,
  toPublicJwk,
  writeMaybe
} from './interop-shared.js'

type LiveInteropOutput = {
  dispatch: boolean
  localVerification: VerificationResult
  mode: 'live'
  ok: boolean
  request: {
    method: string
    url: string
  }
  response?: {
    body: string
    headers: Record<string, string>
    status: number
    statusText: string
  }
  responseError?: string
  signedRequest: SignedRequestResult
}

const { values } = parseArgs({
  options: {
    body: { type: 'string' },
    'body-file': { type: 'string' },
    component: { multiple: true, type: 'string' },
    created: { type: 'string' },
    dispatch: { type: 'boolean' },
    'default-scheme': { type: 'string' },
    'expected-status': { multiple: true, type: 'string' },
    expires: { type: 'string' },
    header: { multiple: true, type: 'string' },
    help: { short: 'h', type: 'boolean' },
    json: { type: 'boolean' },
    'key-file': { type: 'string' },
    'key-id': { type: 'string' },
    method: { type: 'string' },
    nonce: { type: 'string' },
    preset: { type: 'string' },
    'raw-request-file': { type: 'string' },
    'request-file': { type: 'string' },
    'save-raw-request': { type: 'string' },
    'save-request': { type: 'string' },
    'save-response': { type: 'string' },
    tag: { type: 'string' },
    'timeout-ms': { type: 'string' },
    url: { type: 'string' }
  },
  strict: true
})

if (values.help) {
  console.log(`Usage:
  pnpm interop:live -- --method POST --url https://op.example.com/quotes --header 'authorization: GNAP access_token="..."' --key-file ./client-private-key.jwk.json --key-id live-client-key --preset protected-request

Options:
  --request-file <path>        Unsigned request in JSON form
  --raw-request-file <path>    Unsigned raw HTTP request file
  --method <value>             HTTP method for inline request construction
  --url <value>                Request URL for inline request construction
  --header <name:value>        Repeatable inline headers
  --body <value>               Inline body string
  --body-file <path>           Body file path
  --key-file <path>            Private JWK file
  --key-id <value>             Signature key ID
  --preset <name>              Open Payments preset
  --component <id>             Additional covered component
  --created <ts>               Signature created timestamp
  --expires <ts>               Signature expires timestamp
  --nonce <value>              Signature nonce
  --tag <value>                Signature tag
  --dispatch                   Send the signed request to the configured URL
  --expected-status <code>     Repeatable expected HTTP status
  --save-request <path>        Save signed request JSON
  --save-raw-request <path>    Save signed request as raw HTTP text
  --save-response <path>       Save remote response JSON
  --timeout-ms <ms>            Dispatch timeout
  --default-scheme <scheme>    Scheme used for origin-form raw requests
  --json                       Emit JSON output`)
  process.exit(0)
}

if (!values['key-file'] || !values['key-id']) {
  throw new Error('Provide both --key-file and --key-id for live interoperability signing.')
}

const request = await loadRequestInput({
  body: values.body,
  bodyFile: values['body-file'],
  defaultScheme: values['default-scheme'] ?? 'https',
  headers: values.header,
  method: values.method,
  rawRequestFile: values['raw-request-file'],
  requestFile: values['request-file'],
  url: values.url
})
const privateKeyJwk = await readJsonFile<JsonWebKey>(values['key-file'])
const signed = signRequest(request, {
  components: values.component,
  created: values.created ? Number.parseInt(values.created, 10) : undefined,
  expires: values.expires ? Number.parseInt(values.expires, 10) : undefined,
  keyId: values['key-id'],
  nonce: values.nonce,
  preset: values.preset as never,
  privateKeyJwk,
  tag: values.tag
})
const localVerification = verifyRequest(signed.request, {
  preset: values.preset as never,
  publicKeyJwk: toPublicJwk(privateKeyJwk)
})

if (!localVerification.ok) {
  console.error('INTEROP LIVE: FAIL')
  console.error('Local post-sign verification failed before dispatch.')
  console.error(JSON.stringify(localVerification, null, 2))
  process.exit(1)
}

await writeMaybe(values['save-request'], JSON.stringify(signed.request, null, 2))
await writeMaybe(values['save-raw-request'], serializeRawHttpRequest(signed.request))

const output: LiveInteropOutput = {
  dispatch: false,
  localVerification,
  mode: 'live',
  ok: true,
  request: {
    method: signed.request.method,
    url: signed.request.url
  },
  signedRequest: signed
}

if (values.dispatch) {
  const timeoutMs = values['timeout-ms'] ? Number.parseInt(values['timeout-ms'], 10) : 10_000
  const controller = new globalThis.AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    try {
      const response = await fetch(signed.request.url, {
        body: signed.request.body,
        headers: signed.request.headers,
        method: signed.request.method,
        signal: controller.signal
      })
      const responseText = await response.text()
      const responseHeaders: Record<string, string> = {}

      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const expectedStatuses =
        values['expected-status']
          ?.map((status) => Number.parseInt(status, 10))
          .filter(Number.isFinite) ?? []
      const dispatchOk =
        expectedStatuses.length > 0 ? expectedStatuses.includes(response.status) : response.ok

      output.dispatch = true
      output.ok = dispatchOk
      output.response = {
        body: responseText,
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText
      }

      await writeMaybe(values['save-response'], JSON.stringify(output.response, null, 2))
    } catch (error) {
      output.dispatch = true
      output.ok = false
      output.responseError =
        error instanceof Error && error.name === 'AbortError'
          ? `Timed out waiting for the remote endpoint after ${timeoutMs}ms.`
          : error instanceof Error
            ? error.message
            : String(error)
    }
  } finally {
    clearTimeout(timer)
  }
}

if (values.json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(output.ok ? 'INTEROP LIVE: PASS' : 'INTEROP LIVE: FAIL')
  console.log('Local signing verification succeeded.')

  if (values.dispatch) {
    if (output.response) {
      console.log(`Remote response: ${output.response.status} ${output.response.statusText}`)
    } else if (output.responseError) {
      console.log(`Remote response error: ${output.responseError}`)
    }
  } else {
    console.log('Dispatch was not requested. Signed request prepared for manual submission.')
  }
}

process.exitCode = output.ok ? 0 : 1
