# open-payments-http-signatures-devkit

`open-payments-http-signatures-devkit` is an open-source toolkit for Open Payments HTTP Message Signatures. It is built for developers who need more than a low-level RFC 9421 helper: signing, verification, canonicalization inspection, debugging, Open Payments presets, and workflows that start from real captured HTTP requests.

## Why This Exists

Open Payments integrations depend on HTTP Message Signatures, client keys, and JWKS-driven verification, but the day-to-day developer experience is still fragmented:

- generic RFC 9421 libraries often stop at signing primitives
- SDKs do not always expose a dedicated signature debugging surface
- real integration work frequently starts from captured raw HTTP traffic
- verification failures are difficult to diagnose without canonical signature-base reconstruction

This repository fills that gap with a focused developer toolchain rather than a full SDK.

## What The Toolkit Provides

- Ed25519 request signing for Open Payments-style HTTP requests
- `Content-Digest` generation and verification
- `Signature-Input` construction and parsing
- `Signature` header parsing
- canonical signature-base reconstruction for inspection and debugging
- typed verification results with stable failure codes
- human-readable verification explanations in the TypeScript package
- Open Payments presets for common request types
- raw HTTP request ingestion in the TypeScript package for captured traces
- CLI and docs/demo wrappers over the same TypeScript core

## Supported Languages

### TypeScript

Current maturity: stable reference implementation

Included today:

- core library in `packages/core`
- Kiota SDK authentication provider in `packages/kiota-adapter`
- CLI in `apps/cli`
- docs/demo app in `apps/docs`
- interoperability scripts in `packages/examples`
- deterministic fixtures, vectors, and conformance tests

### Python

Current maturity: library with core signing, verification, and debugging coverage

Included today:

- request model
- `Content-Digest` creation and validation
- `Signature-Input` serialization and parsing
- `Signature` parsing
- canonical signature-base construction
- Ed25519 JWK signing and verification
- `sign_request`
- `verify_request`
- `inspect_request_signature`
- raw HTTP request parsing for captured traces
- remote JWKS fetching
- human-readable verification result explanations
- Open Payments presets
- fixture-backed unit tests and examples

Not yet included in Python:

- CLI wrapper
- docs app integration
- full parity with the TypeScript interop harness

## What Is Working Today

- strict TypeScript core library in `packages/core`
- Kiota SDK authentication provider adapter in `packages/kiota-adapter`
- working `op-sig` CLI in `apps/cli`
- working Next.js docs/demo app in `apps/docs`
- deterministic request/key fixtures in `packages/fixtures`
- deterministic signed vectors and verification matrices
- unit, integration, and conformance tests
- CI that runs the same `pnpm release:check` path used locally
- opt-in remote JWKS helpers in both TypeScript and Python packages
- manual interoperability workflows for captured traces and live endpoint validation
- a Python package with core signing, verification, inspection, raw HTTP parsing, and debugging coverage

## What This Repo Is Not

- not a full Open Payments SDK
- not a GNAP client
- not a wallet server
- not a hosted SaaS
- not a browser extension
- not a full cross-language parity suite yet

## Monorepo Layout

```text
open-payments-http-signatures-devkit/
  apps/
    cli/
    docs/
  languages/
    python/
  packages/
    config/
    core/
    examples/
    fixtures/
    kiota-adapter/
  docs/
  .github/
```

## Quick Start

Requirements:

- Node.js `20+`
- pnpm `10+`
- Python `3.10+` for the Python package

Install JavaScript dependencies:

```bash
corepack enable
corepack prepare pnpm@10.24.0 --activate
pnpm install
```

Run the full validation path:

```bash
pnpm release:check
```

Start the docs app:

```bash
pnpm --filter @open-payments-devkit/docs dev
```

Build the CLI:

```bash
pnpm --filter @open-payments-devkit/cli build
```

## Vercel Deployment

The docs app is set up to deploy on Vercel as the web surface for this repository.

Recommended Vercel project settings:

- Framework: `Next.js`
- Root Directory: `apps/docs`
- Node.js version: `20.x` or `22.x`
- Install Command: use the default Vercel pnpm install flow
- Build Command: use the checked-in `apps/docs/vercel.json` configuration

Why the docs app needs dedicated setup:

- the repository is a pnpm monorepo
- the deployable web app lives in `apps/docs`
- the docs app imports workspace packages from outside its directory

The repository already includes:

- `apps/docs/vercel.json` for the docs project commands
- `outputFileTracingRoot` in `apps/docs/next.config.mjs` so Vercel can trace workspace packages correctly
- `packageManager` and `engines.node` in `apps/docs/package.json` so the deploy target advertises pnpm and Node `>=20`

After importing the repository into Vercel, set the project root to `apps/docs` and deploy.

If the project was created with a newer default Node.js version in Vercel, switch it to `20.x` or `22.x` in the Vercel project settings before deploying.

## Kiota SDK Integration

The `packages/kiota-adapter` package provides an `HttpSignatureAuthProvider` that implements the Kiota `AuthenticationProvider` interface for RFC 9421 HTTP Message Signatures. This allows Kiota-generated Open Payments SDKs to sign requests automatically.

```typescript
import { HttpSignatureAuthProvider } from '@open-payments-devkit/kiota-adapter'
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary'

const authProvider = new HttpSignatureAuthProvider({
  privateKeyJwk: myPrivateKey,
  keyId: 'my-key-id',
  preset: 'protected-request'
})

const adapter = new FetchRequestAdapter(authProvider)
```

This adapter bridges the gap until Kiota adds native RFC 9421 support ([microsoft/kiota#6907](https://github.com/microsoft/kiota/issues/6907)). See `packages/kiota-adapter/README.md` for full details.

## TypeScript API

Current public API:

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
- `fetchRemoteJwks(url, options?)`

## Python API

Current public API:

- `create_content_digest(body)`
- `verify_content_digest(body, header_value)`
- `sign_request(request, options)`
- `verify_request(request, options=None)`
- `inspect_request_signature(request)`
- `parse_signature_input(header_value)`
- `parse_signature(header_value)`
- `serialize_signature_input(label, components, params)`
- `build_signature_base(request, parsed_signature_input)`
- `parse_raw_http_request(raw_request, default_scheme?)`
- `explain_verification_result(result)`
- `fetch_remote_jwks(url, options?)`
- `get_preset(name)`

See `languages/python/README.md` for Python package details.

## CLI Examples

Digest:

```bash
node apps/cli/dist/index.js digest --body '{"hello":"world"}'
```

Sign a structured request:

```bash
node apps/cli/dist/index.js sign \
  --method POST \
  --url https://rs.example.com/quotes \
  --header 'authorization: GNAP access_token="quote-token"' \
  --header 'content-type: application/json' \
  --body '{"receiver":"https://wallet.example.com/bob"}' \
  --key-file packages/fixtures/keys/ed25519-private.jwk.json \
  --key-id fixture-primary-key \
  --preset protected-request \
  --json
```

Verify a captured raw HTTP request against a local JWKS:

```bash
node apps/cli/dist/index.js verify \
  --raw-request-file ./captured-request.http \
  --jwks-file ./client-keys.jwks.json \
  --preset protected-request \
  --default-scheme https \
  --json
```

Inspect a signed request:

```bash
node apps/cli/dist/index.js inspect \
  --raw-request-file ./captured-request.http \
  --default-scheme https
```

## Python Examples

Run from the repo root:

```bash
pnpm python:example:sign
pnpm python:example:verify
pnpm python:example:inspect
```

Run the Python tests:

```bash
pnpm python:test
```

## Interoperability Workflows

The TypeScript toolchain currently includes two manual interoperability workflows:

1. Trace verification for captured real requests
2. Live request preparation and optional dispatch

Trace verification:

```bash
pnpm interop:trace -- \
  --raw-request-file ./captured-request.http \
  --jwks-file ./client-keys.jwks.json \
  --preset protected-request \
  --default-scheme https
```

Live request preparation and optional dispatch:

```bash
pnpm interop:live -- \
  --method POST \
  --url https://op.example.com/quotes \
  --header 'authorization: GNAP access_token="..."' \
  --header 'content-type: application/json' \
  --body '{"receiver":"https://wallet.example.com/bob"}' \
  --key-file ./client-private-key.jwk.json \
  --key-id live-client-key \
  --preset protected-request \
  --dispatch \
  --expected-status 200 \
  --save-request ./signed-request.json \
  --save-raw-request ./signed-request.http \
  --save-response ./response.json
```

These flows are manual by design:

- no secrets are hardcoded
- no live network validation runs in CI by default
- local JWK/JWKS verification remains the default path
- remote JWKS fetching only happens when explicitly requested

## Docs App

The docs app provides:

- `/` overview
- `/sign` signing workflow
- `/verify` verification workflow
- `/inspect` canonical signature-base inspection
- `/examples` bundled fixture flows

Each tool supports both structured request input and pasted raw HTTP request input.

The docs site is currently TypeScript-backed. Python support is provided as a library package and examples, not yet as a second docs UI.

## Suggested Screenshots

Actual screenshots have not been committed yet. Suggested product screenshots:

- `/sign` using raw HTTP request mode with generated `Content-Digest`, `Signature-Input`, and `Signature`
- `/verify` showing a typed verification failure and reconstructed signature base
- the examples gallery loading a deterministic request into a workflow

## Planned Next Work

- deepen interoperability validation against real Open Payments environments
- expand Python coverage toward feature parity with the TypeScript reference implementation
- broaden conformance vectors and captured trace packs
- improve release and publishing automation
- continue refining the docs experience for real debugging workflows

## Useful Commands

Workspace:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
pnpm python:test
pnpm release:check
```

Package-scoped:

```bash
pnpm --filter @open-payments-devkit/core test
pnpm --filter @open-payments-devkit/cli build
pnpm --filter @open-payments-devkit/docs dev
pnpm --filter @open-payments-devkit/examples example:sign
pnpm interop:trace -- --help
pnpm interop:live -- --help
```

## Additional Documentation

- `docs/architecture.md`
- `docs/presets.md`
- `docs/verification-model.md`
- `docs/interop-guide.md`
- `docs/interop-status.md`
- `docs/roadmap.md`
- `languages/python/README.md`
