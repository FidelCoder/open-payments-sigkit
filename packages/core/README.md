# @open-payments-devkit/core

Typed TypeScript core utilities for Open Payments HTTP Message Signatures.

This package provides:

- `createContentDigest`
- `fetchRemoteJwks`
- `parseRawHttpRequest`
- `signRequest`
- `verifyRequest`
- `inspectRequestSignature`
- `parseSignatureInput`
- `parseSignature`
- `buildSignatureBase`
- `explainVerificationResult`
- `getPreset`

It is intended for server-safe Node.js usage and keeps Open Payments presets separate from the generic RFC 9421 parsing and canonicalization logic.

Within this repository, `@open-payments-devkit/core` is the reference implementation used by the CLI, docs app, and the current interoperability scripts.

`parseRawHttpRequest` is useful when you want to verify or inspect captured HTTP traffic directly instead of manually converting it into the shared request JSON shape first.

`fetchRemoteJwks` is an opt-in helper for manual interoperability and CLI workflows. It is not used automatically by `verifyRequest`, so the default core verification path remains deterministic and local-input driven.

See the workspace root README for setup and end-to-end examples.
