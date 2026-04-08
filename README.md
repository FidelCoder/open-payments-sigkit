# open-payments-http-signatures-devkit

`open-payments-http-signatures-devkit` is a focused TypeScript monorepo for Open Payments HTTP Message Signatures. It helps developers sign requests, verify them, inspect the canonical signature base, debug failures, and work with Open Payments-specific request presets without having to stitch together generic RFC 9421 tooling by hand.

## Why This Exists

Open Payments depends on HTTP Message Signatures, client keys, and JWKS-driven verification, but the developer experience is still fragmented:

- generic RFC 9421 libraries usually stop at signing primitives
- Open Payments SDKs do not always give developers a dedicated signing-debugging surface
- real integration work often starts from captured raw HTTP requests, not idealized objects
- verification failures are hard to diagnose without signature-base reconstruction and stable error codes

This repository fills that gap with a standards-focused toolkit that is intentionally narrower than a full SDK and more useful than a generic signing helper.

## What The Toolkit Provides

- Ed25519 request signing for Open Payments-style HTTP requests
- Content-Digest generation and verification
- Signature-Input construction and parsing
- Signature header parsing
- canonical signature-base reconstruction for inspection and debugging
- typed verification results with stable failure codes
- human-readable verification explanations
- Open Payments presets for common request types
- raw HTTP request ingestion for captured traces
- CLI and docs/demo wrappers over the same core implementation

## What Is Working Today

The current repository already includes:

- a strict TypeScript core library in `packages/core`
- a working `op-sig` CLI in `apps/cli`
- a working Next.js docs/demo app in `apps/docs`
- deterministic request/key fixtures in `packages/fixtures`
- deterministic signed vectors and verification matrices
- unit, integration, and conformance tests
- CI that runs the same `pnpm release:check` path used locally
- opt-in remote JWKS fetching helpers
- manual interoperability workflows for captured traces and live endpoint validation

## Why This Matters For The Interledger Open Payments SDK Grant

This repo is aligned with the SDK grant theme described for Open Payments security and generated SDK tooling:

- it improves developer experience around RFC 9421 HTTP Message Signatures
- it provides dedicated tooling around client keys and JWKS verification
- it focuses on debugging and inspection, not only happy-path signing
- it supports trace-based interoperability work, which is critical for real SDK integration
- it is intentionally positioned as reusable dev tooling rather than a competing full SDK

## What This Repo Is Not

- not a full Open Payments SDK
- not a GNAP client
- not a wallet server
- not a hosted SaaS
- not a browser extension
- not a multi-language implementation

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

## Quick Start

Requirements:

- Node.js `20+`
- pnpm `10+`

Install:

```bash
corepack enable
corepack prepare pnpm@10.24.0 --activate
pnpm install
```

Run the full validation path:

```bash
pnpm release:check
```

Run the docs app:

```bash
pnpm --filter @open-payments-devkit/docs dev
```

Build the CLI:

```bash
pnpm --filter @open-payments-devkit/cli build
```

## Core API

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

Verify using an opt-in remote JWKS URL:

```bash
node apps/cli/dist/index.js verify \
  --raw-request-file ./captured-request.http \
  --jwks-url https://keys.example.com/jwks.json \
  --jwks-timeout-ms 5000 \
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

## Interoperability Workflows

The repo now includes two opt-in manual interoperability workflows:

1. Trace verification
   Use this when you have a captured real request and want pass/fail diagnostics.

```bash
pnpm interop:trace -- \
  --raw-request-file ./captured-request.http \
  --jwks-file ./client-keys.jwks.json \
  --preset protected-request \
  --default-scheme https
```

2. Live request preparation and optional dispatch
   Use this when you want to sign a real request locally, optionally send it to a manually configured endpoint, and record the signed request/response artifacts.

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

Each tool supports both:

- structured request input
- pasted raw HTTP request input

This makes the docs app useful for both onboarding and real trace inspection.

## Screenshot Placeholders

Actual screenshots have not been committed yet. Recommended reviewer-facing screenshots:

- Placeholder: `/sign` using raw HTTP request mode with generated `Content-Digest`, `Signature-Input`, and `Signature`
- Placeholder: `/verify` showing a typed verification failure and reconstructed signature base
- Placeholder: CLI trace verification against a captured Open Payments request

## Current Validation Status

Validated today:

- deterministic fixture-based signing and verification
- raw HTTP parsing and verification
- CLI signing, verification, and inspection workflows
- docs app build, lint, and typecheck
- conformance vectors and failure matrix
- optional remote JWKS resolution helper tests with mocked fetch behavior

Still intentionally manual:

- live endpoint interoperability checks
- browser E2E coverage for the docs UI
- release publishing automation

## Planned Next Work

Planned, but not yet completed:

- deeper interoperability validation against real Open Payments environments
- expanded reviewer-facing screenshots and examples
- optional upstream integration and broader conformance support
- release/publishing automation once the interop story is stable

## Useful Commands

Workspace:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
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
