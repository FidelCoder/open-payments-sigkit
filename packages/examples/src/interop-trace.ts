import type { JsonWebKey } from 'node:crypto'
import { parseArgs } from 'node:util'
import {
  explainVerificationResult,
  fetchRemoteJwks,
  type JwksShape,
  verifyRequest
} from '@open-payments-devkit/core'
import { loadRequestInput, readJsonFile } from './interop-shared.js'

const { values } = parseArgs({
  options: {
    'default-scheme': { type: 'string' },
    help: { short: 'h', type: 'boolean' },
    'jwks-file': { type: 'string' },
    'jwks-timeout-ms': { type: 'string' },
    'jwks-url': { type: 'string' },
    json: { type: 'boolean' },
    preset: { type: 'string' },
    'public-key-file': { type: 'string' },
    'raw-request-file': { type: 'string' },
    'request-file': { type: 'string' },
    'require-digest-for-body': { type: 'boolean' },
    'required-component': { multiple: true, type: 'string' }
  },
  strict: true
})

if (values.help) {
  console.log(`Usage:
  pnpm interop:trace -- --raw-request-file ./captured-request.http --jwks-file ./client-keys.jwks.json --preset protected-request

Options:
  --request-file <path>        Signed request in JSON form
  --raw-request-file <path>    Signed raw HTTP request file
  --public-key-file <path>     Public JWK file
  --jwks-file <path>           Local JWKS file
  --jwks-url <url>             Remote JWKS URL
  --jwks-timeout-ms <ms>       Remote JWKS fetch timeout
  --preset <name>              Open Payments preset
  --required-component <id>    Additional required covered component
  --require-digest-for-body    Require Content-Digest when a body exists
  --default-scheme <scheme>    Scheme used for origin-form raw requests
  --json                       Emit JSON output`)
  process.exit(0)
}

const configuredVerificationSources = [
  values['public-key-file'] ? '--public-key-file' : undefined,
  values['jwks-file'] ? '--jwks-file' : undefined,
  values['jwks-url'] ? '--jwks-url' : undefined
].filter((source): source is string => Boolean(source))

if (configuredVerificationSources.length > 1) {
  throw new Error(
    `Choose one verification source: ${configuredVerificationSources.join(', ')}. These options are mutually exclusive.`
  )
}

const request = await loadRequestInput({
  defaultScheme: values['default-scheme'] ?? 'https',
  rawRequestFile: values['raw-request-file'],
  requestFile: values['request-file']
})

const publicKeyJwk = values['public-key-file']
  ? await readJsonFile<JsonWebKey>(values['public-key-file'])
  : undefined
const jwks = values['jwks-file']
  ? await readJsonFile<JwksShape>(values['jwks-file'])
  : values['jwks-url']
    ? await fetchRemoteJwks(values['jwks-url'], {
        timeoutMs: values['jwks-timeout-ms']
          ? Number.parseInt(values['jwks-timeout-ms'], 10)
          : undefined
      })
    : undefined

const result = verifyRequest(request, {
  jwks,
  preset: values.preset as never,
  publicKeyJwk,
  requireDigestForBody: values['require-digest-for-body'] || undefined,
  requiredComponents: values['required-component']
})
const explanation = explainVerificationResult(result)
const output = {
  explanation,
  mode: 'trace',
  ok: result.ok,
  request: {
    method: request.method,
    url: request.url
  },
  result,
  verificationSource: values['public-key-file']
    ? { type: 'public-key-file', value: values['public-key-file'] }
    : values['jwks-file']
      ? { type: 'jwks-file', value: values['jwks-file'] }
      : values['jwks-url']
        ? { type: 'jwks-url', value: values['jwks-url'] }
        : { type: 'none' }
}

if (values.json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(result.ok ? 'INTEROP TRACE: PASS' : 'INTEROP TRACE: FAIL')
  console.log(`Verification code: ${result.code}`)
  console.log(result.message)
  console.log(explanation.summary)

  if (explanation.nextSteps.length > 0) {
    console.log(`Next steps: ${explanation.nextSteps.join(' | ')}`)
  }

  if (result.signatureBase) {
    console.log('Signature base:')
    console.log(result.signatureBase)
  }
}

process.exitCode = result.ok ? 0 : 1
