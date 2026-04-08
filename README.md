# open-payments-http-signatures-devkit

`open-payments-http-signatures-devkit` is a focused TypeScript monorepo for building, signing, verifying, and inspecting Open Payments HTTP Message Signatures. It is designed as a clean foundation for serious developer tooling around RFC 9421, Ed25519 client keys, Content-Digest handling, Open Payments presets, and verification debugging.

It now supports both normalized JSON request input and captured raw HTTP request input so developers can validate real Open Payments traffic without manually reshaping it first.

## What It Is

- A strict TypeScript core library for Content-Digest, Signature-Input, signing, verification, parsing, and inspection
- An `op-sig` CLI that wraps the core package
- A minimal Next.js docs and demo app for signing, verification, and inspection workflows
- Deterministic fixtures and runnable examples for repeatable testing and onboarding
- A tidy monorepo foundation for future conformance and debugging tooling

## What It Is Not

- A full Open Payments SDK
- A full GNAP client
- A hosted SaaS
- A wallet server
- A browser extension
- A multi-language implementation

## Monorepo Layout

```text
open-payments-http-signatures-devkit/
  apps/
    cli/
    docs/
  packages/
    config/
    core/
    examples/
    fixtures/
  docs/
  .github/
```

## Requirements

- Node.js `20+`
- pnpm `10+`

The workspace currently declares `engines.node >= 20`. If you run it under Node 18, installs and local commands may warn even if some tasks still happen to work.

## Install

```bash
pnpm install
```

## Workspace Commands

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
pnpm dev
pnpm format
pnpm release:check
```

Useful package-scoped commands:

```bash
pnpm --filter @open-payments-devkit/core test
pnpm --filter @open-payments-devkit/docs dev
pnpm --filter @open-payments-devkit/cli build
pnpm --filter @open-payments-devkit/examples example:sign
```

## Library Example

```ts
import type { HttpRequestShape } from '@open-payments-devkit/core'
import { signRequest, verifyRequest } from '@open-payments-devkit/core'
import { keys, requests } from '@open-payments-devkit/fixtures'

const signed = signRequest(requests.quoteRequest as HttpRequestShape, {
  created: 1735689600,
  keyId: 'fixture-primary-key',
  preset: 'protected-request',
  privateKeyJwk: keys.privateKey
})

const verification = verifyRequest(signed.request, {
  jwks: keys.jwks,
  preset: 'protected-request'
})

console.log(signed.signatureBase)
console.log(verification)
```

## Public API

- `createContentDigest(body)`
- `signRequest(request, options)`
- `verifyRequest(request, options)`
- `inspectRequestSignature(request)`
- `parseSignatureInput(headerValue)`
- `parseSignature(headerValue)`
- `parseRawHttpRequest(rawRequest, options?)`
- `buildSignatureBase(request, parsedSignatureInput)`
- `explainVerificationResult(result)`
- `getPreset(name)`

## CLI

The CLI binary name is `op-sig`.

Release-facing notes:

- the CLI is built from [`apps/cli`](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/apps/cli)
- CLI integration coverage exercises `digest`, `preset`, `sign`, `verify`, and `inspect`
- `pnpm release:check` runs the full validation path before a push or tag

Example commands:

```bash
pnpm --filter @open-payments-devkit/cli build
node apps/cli/dist/index.js digest --body '{"hello":"world"}'
node apps/cli/dist/index.js preset protected-request
node apps/cli/dist/index.js example quote-request
node apps/cli/dist/index.js sign \
  --method POST \
  --url https://rs.example.com/quotes \
  --header 'authorization: GNAP access_token="quote-token"' \
  --header 'content-type: application/json' \
  --body '{"receiver":"https://wallet.example.com/bob"}' \
  --key-file packages/fixtures/keys/ed25519-private.jwk.json \
  --key-id fixture-primary-key \
  --preset protected-request
```

To verify from a JSON file:

```bash
node apps/cli/dist/index.js verify \
  --request-file ./signed-request.json \
  --jwks-file packages/fixtures/keys/jwks.json \
  --preset protected-request
```

To work from captured traffic directly:

```bash
node apps/cli/dist/index.js verify \
  --raw-request-file ./captured-request.http \
  --jwks-file ./client-keys.jwks.json \
  --preset protected-request \
  --default-scheme https
```

You can also sign a captured unsigned request file:

```bash
node apps/cli/dist/index.js sign \
  --raw-request-file ./unsigned-request.http \
  --key-file ./client-private-key.jwk.json \
  --key-id live-client-key \
  --preset protected-request \
  --json
```

## Docs App

The docs app lives in [`apps/docs`](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/apps/docs) and provides:

- `/` overview
- `/sign` signing workflow
- `/verify` verification workflow
- `/inspect` canonical base inspection
- `/examples` bundled example payloads with direct links into the signing, verification, and inspection tools

Start it with:

```bash
pnpm --filter @open-payments-devkit/docs dev
```

Each tool route supports both structured form fields and pasted raw HTTP requests, so you can inspect or verify captured Open Payments traffic directly.

## Presets

- `grant-request`: covers `@method`, `@target-uri`, and `content-digest` when a body exists
- `protected-request`: covers `@method`, `@target-uri`, `authorization`, and `content-digest` when a body exists
- `resource-write`: same as `protected-request`, requires digest handling for body-bearing writes, and can add default `created`/`expires`

More detail lives in [docs/presets.md](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/docs/presets.md).

## Development Notes

- The core package keeps RFC-oriented logic separate from Open Payments presets
- Crypto is isolated under [`packages/core/src/crypto`](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/packages/core/src/crypto)
- Verification returns stable codes and structured details for debugging
- Tests use deterministic fixtures from [`packages/fixtures`](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/packages/fixtures)
- Publish-facing metadata is defined on the core and fixtures packages for future release work
- GitHub Actions runs the same `pnpm release:check` validation path used for local release checks

## Testing

Run the full suite:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Core tests cover:

- digest generation
- Signature-Input serialization and parsing
- signature base reconstruction
- Ed25519 sign/verify
- deterministic signed reference vectors
- preset behavior
- header normalization
- sign/verify integration flows
- tamper and wrong-key failures
- fixture-driven verification matrix cases
- snapshot assertions for signature base and verification payloads
- captured raw HTTP request parsing and validation paths

## Interoperability Workflow

For real Open Payments traffic, the recommended local loop is:

1. Capture an outgoing request as raw HTTP or normalize it into the shared request JSON shape.
2. Run `op-sig verify` with a real public JWK or client-key JWKS.
3. Inspect the returned `signatureBase`, `coveredComponents`, and typed failure `code`.
4. If needed, use `/inspect` in the docs app to compare canonicalized components line-by-line.

## Additional Documentation

- [Architecture](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/docs/architecture.md)
- [Presets](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/docs/presets.md)
- [Verification Model](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/docs/verification-model.md)
- [Roadmap](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/docs/roadmap.md)
