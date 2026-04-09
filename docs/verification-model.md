# Verification Model

Verification is designed to be typed, deterministic, and useful for debugging.

## Verification Stages

1. Normalize the request.
2. Resolve preset and required component policy.
3. Check `Content-Digest` requirements and validate the body digest.
4. Parse `Signature` and `Signature-Input`.
5. Select a matching signature label.
6. Resolve the public key from an explicit JWK or a JWKS.
7. Rebuild the canonical signature base.
8. Verify the Ed25519 signature.

## Result Shape

Each verification returns:

- `ok`
- `code`
- `message`
- optional `details`
- optional `signatureBase`
- optional `coveredComponents`

## Failure Codes

- `MISSING_CONTENT_DIGEST`
- `INVALID_CONTENT_DIGEST`
- `MISSING_SIGNATURE`
- `MISSING_SIGNATURE_INPUT`
- `INVALID_SIGNATURE_INPUT`
- `UNSUPPORTED_ALGORITHM`
- `KEY_NOT_FOUND`
- `SIGNATURE_MISMATCH`
- `MISSING_REQUIRED_COMPONENT`
- `REQUEST_COMPONENT_MISMATCH`

## Debugging Strategy

The toolkit emphasizes failure explanations that are actionable:

- missing coverage failures identify which component was required
- digest failures make body tampering obvious
- key lookup failures point to `kid` and JWKS mismatches
- signature mismatch failures include the reconstructed signature base

This makes the toolkit useful for local debugging, SDK generation workflows, and future conformance testing across multiple language implementations.

## Reference Vectors

The fixture package now includes deterministic reference vectors under [`packages/fixtures/vectors`](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/packages/fixtures/vectors):

- signed grant-request output
- signed protected quote-request output
- signed resource-write incoming-payment output
- a verification matrix covering success and common failure modes

These vectors are consumed by the core conformance tests and are intended to be stable reference data for future CLI, docs, SDK-generation, and interoperability work.

The same fixture intent is also used by the Python preview package so the repository can compare behavior across language implementations without changing the core request scenarios.

## Captured Request Workflow

The verification pipeline can now start from either:

- the shared `HttpRequestShape` JSON model
- a captured raw HTTP request string parsed with `parseRawHttpRequest`

This makes it practical to validate real Open Payments traffic copied from:

- reverse-proxy logs
- HTTP debugging tools
- saved `.http` request files
- SDK integration traces

For origin-form request lines such as `POST /quotes HTTP/1.1`, the parser resolves the final request URL from `Host` and defaults to `https` unless a different scheme is supplied explicitly.

## Verification Matrix

The current matrix includes:

- happy-path grant, protected, and resource-write verification
- missing `content-digest`
- missing `signature`
- missing `signature-input`
- malformed `Signature-Input`
- signature label mismatch
- missing covered `authorization`
- unknown `keyid` in JWKS
- unsupported `alg`
- missing required covered component
- wrong public key
- multi-key JWKS without `keyid`

The matrix lives in [`packages/fixtures/vectors/verification-cases.json`](/home/core/Desktop/devkit/open-payments-http-signatures-devkit/packages/fixtures/vectors/verification-cases.json).
