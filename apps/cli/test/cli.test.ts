import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const cliRoot = fileURLToPath(new URL('..', import.meta.url))
const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url))
const cliEntrypoint = resolve(cliRoot, 'dist/index.js')

const runCli = (args: string[]): string =>
  execFileSync('node', [cliEntrypoint, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8'
  }).trim()

describe('op-sig cli', () => {
  it('computes a digest in JSON mode', () => {
    const output = JSON.parse(runCli(['digest', '--body', '{"hello":"world"}', '--json']))

    expect(output).toEqual({
      body: '{"hello":"world"}',
      digest: 'sha-256=:k6I5cakU5erL8KjSUVTNownDwccvu5kU1Hxg88toFYg=:'
    })
  })

  it('prints preset metadata in JSON mode', () => {
    const output = JSON.parse(runCli(['preset', 'resource-write', '--json']))

    expect(output).toMatchObject({
      baseComponents: ['@method', '@target-uri', 'authorization'],
      defaultTimestamps: {
        addCreated: true,
        ttlSeconds: 300
      },
      name: 'resource-write'
    })
  })

  it('signs and verifies a request using fixture keys', () => {
    const signed = JSON.parse(
      runCli([
        'sign',
        '--method',
        'POST',
        '--url',
        'https://rs.example.com/quotes',
        '--header',
        'authorization: GNAP access_token="quote-token"',
        '--header',
        'content-type: application/json',
        '--header',
        'accept: application/json',
        '--body',
        '{"receiver":"https://wallet.example.com/bob","method":"ilp","sourceAmount":{"assetCode":"USD","assetScale":2,"value":"1250"}}',
        '--key-file',
        'packages/fixtures/keys/ed25519-private.jwk.json',
        '--key-id',
        'fixture-primary-key',
        '--preset',
        'protected-request',
        '--created',
        '1735689600',
        '--json'
      ])
    )

    const tempDirectory = mkdtempSync(resolve(tmpdir(), 'op-sig-cli-'))
    const requestFile = resolve(tempDirectory, 'signed-request.json')
    writeFileSync(requestFile, JSON.stringify(signed.request, null, 2), 'utf8')

    const verification = JSON.parse(
      runCli([
        'verify',
        '--request-file',
        requestFile,
        '--jwks-file',
        'packages/fixtures/keys/jwks.json',
        '--preset',
        'protected-request',
        '--json'
      ])
    )

    expect(verification.result).toMatchObject({
      code: 'OK',
      ok: true
    })
    expect(verification.result.signatureBase).toBe(signed.signatureBase)
  })

  it('inspects a bundled signed request', () => {
    const fixture = JSON.parse(
      readFileSync(
        resolve(workspaceRoot, 'packages/fixtures/vectors/signed/protected-quote-request.json'),
        'utf8'
      )
    ) as { request: Record<string, unknown> }
    const tempDirectory = mkdtempSync(resolve(tmpdir(), 'op-sig-inspect-'))
    const requestFile = resolve(tempDirectory, 'inspect-request.json')
    writeFileSync(requestFile, JSON.stringify(fixture.request, null, 2), 'utf8')

    const inspection = JSON.parse(runCli(['inspect', '--request-file', requestFile, '--json']))

    expect(inspection.coveredComponents).toEqual([
      '@method',
      '@target-uri',
      'authorization',
      'content-digest'
    ])
    expect(inspection.signatureBase).toContain('"authorization": GNAP access_token="quote-token"')
  })

  it('signs and verifies a captured raw HTTP request file', () => {
    const tempDirectory = mkdtempSync(resolve(tmpdir(), 'op-sig-raw-'))
    const rawRequestFile = resolve(tempDirectory, 'quote-request.http')
    writeFileSync(
      rawRequestFile,
      `POST /quotes HTTP/1.1
Host: rs.example.com
Authorization: GNAP access_token="quote-token"
Content-Type: application/json

{"receiver":"https://wallet.example.com/bob","method":"ilp","sourceAmount":{"assetCode":"USD","assetScale":2,"value":"1250"}}`,
      'utf8'
    )

    const signed = JSON.parse(
      runCli([
        'sign',
        '--raw-request-file',
        rawRequestFile,
        '--key-file',
        'packages/fixtures/keys/ed25519-private.jwk.json',
        '--key-id',
        'fixture-primary-key',
        '--preset',
        'protected-request',
        '--created',
        '1735689600',
        '--json'
      ])
    )

    const signedRawRequestFile = resolve(tempDirectory, 'signed-quote-request.http')
    writeFileSync(
      signedRawRequestFile,
      `POST /quotes HTTP/1.1
host: rs.example.com
authorization: GNAP access_token="quote-token"
content-type: application/json
content-digest: ${signed.contentDigest}
signature: ${signed.signature}
signature-input: ${signed.signatureInput}

${signed.request.body ?? ''}`,
      'utf8'
    )

    const verification = JSON.parse(
      runCli([
        'verify',
        '--raw-request-file',
        signedRawRequestFile,
        '--jwks-file',
        'packages/fixtures/keys/jwks.json',
        '--preset',
        'protected-request',
        '--json'
      ])
    )

    expect(verification.result).toMatchObject({
      code: 'OK',
      ok: true,
      signatureBase: signed.signatureBase
    })
  })
})
