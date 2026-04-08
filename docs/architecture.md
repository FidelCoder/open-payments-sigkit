# Architecture

## Principles

- Functional core, thin wrappers
- Deterministic behavior
- Small focused files
- RFC-oriented logic separate from Open Payments presets
- Server-safe implementation for core signing and verification

## Packages

## `packages/core`

The core package owns:

- request normalization
- raw captured HTTP request parsing
- opt-in remote JWKS fetching helpers
- Content-Digest creation and validation
- structured field parsing for `Signature` and `Signature-Input`
- canonical signature base reconstruction
- Ed25519 sign and verify operations
- JWK and JWKS lookup
- Open Payments presets
- verification explainers

Internal source layout:

- `constants/`
- `crypto/`
- `http/`
- `structured-fields/`
- `signatures/`
- `presets/`
- `explain/`
- `jwk/`
- `types/`
- `utils/`

## `apps/cli`

The CLI is intentionally thin. It parses terminal input, reads files, formats terminal output, and delegates all signing and verification logic to `@open-payments-devkit/core`.

It now accepts both normalized JSON request files and raw captured HTTP request files for sign, verify, and inspect flows.

## `apps/docs`

The docs app is a server-backed Next.js App Router interface. Route handlers call the core library directly so the browser UI reflects the same behavior as the CLI and programmatic API.

The request editor supports two modes:

- structured request fields for deliberate request construction
- raw HTTP request input for validating captured Open Payments traffic directly

## `packages/fixtures`

Fixtures provide stable request payloads and Ed25519 JWK material for tests, examples, demos, and reproducible debugging.

The fixture package now also carries deterministic signed vectors and a verification-case matrix so higher-level tools can validate against the same canonical Open Payments examples.

## `packages/examples`

Examples are runnable scripts that demonstrate how the library behaves in common Open Payments scenarios.

They now also include manual interoperability harnesses for:

- trace-based verification of captured requests
- local request signing plus optional live endpoint dispatch

## Data Flow

1. Normalize request method, URL, and headers.
2. Apply preset rules and covered component requirements.
3. Generate or verify `Content-Digest`.
4. Parse or serialize `Signature-Input`.
5. Reconstruct the canonical signature base.
6. Resolve the verification key from a JWK or JWKS.
7. Perform Ed25519 verification.
8. Return a typed result with stable codes and developer-facing context.

## Extensibility

- Additional algorithms can be added by extending `crypto/` without rewriting request parsing or preset logic.
- More Open Payments request profiles can be added as new preset definitions.
- Conformance and fixture expansions can grow independently of the core cryptographic flow.
