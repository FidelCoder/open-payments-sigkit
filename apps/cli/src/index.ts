#!/usr/bin/env node
import type { JsonWebKey } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import {
  createContentDigest,
  explainVerificationResult,
  getPreset,
  inspectRequestSignature,
  signRequest,
  verifyRequest
} from '@open-payments-devkit/core'
import { fixturePaths } from '@open-payments-devkit/fixtures'
import { Command } from 'commander'
import { buildRequestFromOptions, collect, readJsonFile, readTextInput } from './io.js'
import {
  renderInspection,
  renderPreset,
  renderSignedRequest,
  renderVerification
} from './output.js'

const program = new Command()

const print = (value: unknown, asJson: boolean): void => {
  console.log(asJson ? JSON.stringify(value, null, 2) : String(value))
}

program
  .name('op-sig')
  .description('Open Payments HTTP Message Signatures developer toolkit')
  .showHelpAfterError()

program
  .command('digest')
  .description('Compute a Content-Digest value for a request body')
  .option('--body <body>', 'Inline body string')
  .option('--body-file <path>', 'Path to a file containing the body')
  .option('--json', 'Print JSON output')
  .action(async (options) => {
    const body = await readTextInput(options.body, options.bodyFile)

    if (body === undefined) {
      throw new Error('Provide either --body or --body-file.')
    }

    const digest = createContentDigest(body)

    if (options.json) {
      print({ body, digest }, true)
      return
    }

    print(digest, false)
  })

program
  .command('sign')
  .description('Sign an HTTP request with Ed25519')
  .requiredOption('--method <method>', 'HTTP method')
  .requiredOption('--url <url>', 'Request URL')
  .requiredOption('--key-file <path>', 'Path to a private JWK file')
  .requiredOption('--key-id <keyId>', 'Key ID to place in Signature-Input')
  .option('--header <header>', 'Header formatted as "Name: value"', collect, [])
  .option('--body <body>', 'Inline body string')
  .option('--body-file <path>', 'Path to a file containing the body')
  .option('--preset <preset>', 'Open Payments preset')
  .option('--component <component>', 'Additional covered component', collect, [])
  .option('--created <timestamp>', 'Created timestamp', Number)
  .option('--expires <timestamp>', 'Expires timestamp', Number)
  .option('--nonce <nonce>', 'Nonce parameter')
  .option('--tag <tag>', 'Tag parameter')
  .option('--json', 'Print JSON output')
  .action(async (options) => {
    const privateKeyJwk = await readJsonFile<JsonWebKey>(options.keyFile)
    const request = await buildRequestFromOptions(options)
    const result = signRequest(request, {
      components: options.component.length > 0 ? options.component : undefined,
      created: options.created,
      expires: options.expires,
      keyId: options.keyId,
      nonce: options.nonce,
      preset: options.preset,
      privateKeyJwk,
      tag: options.tag
    })

    print(options.json ? result : renderSignedRequest(result), options.json)
  })

program
  .command('verify')
  .description('Verify a signed request against a public key or JWKS')
  .requiredOption('--request-file <path>', 'Path to a signed request JSON file')
  .option('--public-key-file <path>', 'Path to a public JWK file')
  .option('--jwks-file <path>', 'Path to a JWKS file')
  .option('--preset <preset>', 'Open Payments preset')
  .option('--required-component <component>', 'Required covered component', collect, [])
  .option('--require-digest-for-body', 'Require Content-Digest whenever a body exists')
  .option('--json', 'Print JSON output')
  .action(async (options) => {
    const request = await readJsonFile(options.requestFile)
    const publicKeyJwk = options.publicKeyFile
      ? await readJsonFile<JsonWebKey>(options.publicKeyFile)
      : undefined
    const jwks = options.jwksFile
      ? await readJsonFile<{ keys: JsonWebKey[] }>(options.jwksFile)
      : undefined
    const result = verifyRequest(request, {
      jwks,
      preset: options.preset,
      publicKeyJwk,
      requireDigestForBody: options.requireDigestForBody ? true : undefined,
      requiredComponents:
        options.requiredComponent.length > 0 ? options.requiredComponent : undefined
    })
    const explanation = explainVerificationResult(result)

    print(
      options.json ? { explanation, result } : renderVerification(result, explanation),
      options.json
    )
  })

program
  .command('inspect')
  .description('Inspect canonicalized signature inputs and the signature base')
  .requiredOption('--request-file <path>', 'Path to a signed request JSON file')
  .option('--json', 'Print JSON output')
  .action(async (options) => {
    const request = await readJsonFile(options.requestFile)
    const inspection = inspectRequestSignature(request)

    print(options.json ? inspection : renderInspection(inspection), options.json)
  })

program
  .command('preset')
  .description('Print Open Payments preset rules')
  .argument('[name]', 'Preset name')
  .option('--json', 'Print JSON output')
  .action((name, options) => {
    if (name) {
      const preset = getPreset(name)
      print(options.json ? preset : renderPreset(preset), options.json)
      return
    }

    const presets = ['grant-request', 'protected-request', 'resource-write'].map((presetName) =>
      getPreset(presetName as never)
    )

    print(options.json ? presets : presets.map(renderPreset).join('\n\n'), options.json)
  })

program
  .command('example')
  .description('Print or save bundled example request payloads')
  .argument('[name]', 'Example name')
  .option('--save <path>', 'Write the selected example to a file')
  .option('--json', 'Print JSON output')
  .action(async (name, options) => {
    const examples = {
      'grant-request': fixturePaths.requests.grantRequest,
      'incoming-payment': fixturePaths.requests.incomingPayment,
      'outgoing-payment': fixturePaths.requests.outgoingPayment,
      'quote-request': fixturePaths.requests.quoteRequest
    }

    if (!name) {
      print(options.json ? Object.keys(examples) : Object.keys(examples).join('\n'), options.json)
      return
    }

    const filePath = examples[name as keyof typeof examples]

    if (!filePath) {
      throw new Error(`Unknown example "${name}".`)
    }

    const payload = await readJsonFile(filePath)
    const serialized = JSON.stringify(payload, null, 2)

    if (options.save) {
      await writeFile(options.save, serialized, 'utf8')
    }

    print(options.json ? payload : serialized, options.json)
  })

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unexpected CLI error.'
  console.error(message)
  process.exitCode = 1
})
