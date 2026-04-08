# @open-payments-devkit/core

Typed core utilities for Open Payments HTTP Message Signatures.

This package provides:

- `createContentDigest`
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

`parseRawHttpRequest` is useful when you want to verify or inspect captured HTTP traffic directly instead of manually converting it into the shared request JSON shape first.

See the workspace root README for setup and end-to-end examples.
