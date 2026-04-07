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

This makes the toolkit useful for local debugging, SDK generation workflows, and future conformance testing.

