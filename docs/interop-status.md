# Interop Status

This document describes what has been validated, what remains manual, and what still needs to be proven before treating this repository as a stronger interoperability reference.

## Validated Locally

The following has been validated locally in this repository:

- core request signing with Ed25519
- core request verification with local public JWK input
- core request verification with local JWKS input
- canonical signature-base reconstruction
- Content-Digest generation and verification
- Open Payments preset enforcement
- raw HTTP request parsing into the shared request model
- CLI sign, verify, and inspect workflows
- docs app build/typecheck/lint paths
- deterministic conformance vectors and failure matrices
- opt-in remote JWKS fetch helper behavior with mocked fetch tests
- Python preview tests for digest creation, signature input parsing, signature-base construction, signing, verification, and inspection

## Validated With Deterministic Fixtures

Deterministic validation currently covers:

- `grant-request` preset signing and verification
- protected request signing and verification
- resource-write signing and verification
- tampered body failures
- tampered method failures
- tampered URL failures
- missing required covered component failures
- wrong-key failures
- malformed signature input failures
- fixed signed-vector comparisons
- captured raw HTTP request verification after parsing

## Manual Interop Paths Available

The repository supports manual interoperability workflows for:

- captured raw HTTP traces
- locally prepared signed requests for manual endpoint dispatch
- verification using either local JWKS material or an explicitly requested remote JWKS URL

These workflows are documented in `docs/interop-guide.md` and intentionally remain opt-in.

The current manual harnesses are TypeScript-based. Python support is presently focused on local core behavior rather than live or trace-based operator workflows.

## Not Yet Validated

The following areas are not yet proven automatically:

- acceptance against a publicly documented Open Payments test environment
- repeated live interoperability checks across multiple independent servers
- automated browser E2E coverage for the docs app
- remote JWKS verification exercised in CI against a live endpoint
- HAR/cURL import workflows

## Current Limitations

- request bodies are modeled as strings, not streams or binary payloads
- remote JWKS fetching is opt-in and not wired into the default verification path
- the docs app currently prefers pasted request data over file upload flows
- live interop remains a manual operator workflow because secrets and environment-specific inputs are not committed

## Deferred Intentionally

Browser E2E testing for the docs UI was deferred in this pass.

Reason:

- the highest-value remaining gap was interoperability proof, not additional browser infrastructure
- a browser runner would add new runtime/tooling complexity to a repo whose critical value is the signing, verification, and debugging path
- the current docs app is already covered by build/typecheck/lint and shares logic with the validated core

This should still be revisited later, but it was intentionally not prioritized over interop tooling and core product validation.

## How To Run Manual Interop Checks

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
  --expected-status 200
```

## Next Milestones

Near-term interoperability milestones:

- validate captured requests from a real Open Payments integration trace set
- capture artifact examples and working traces from successful manual runs
- document at least one successful manual live endpoint run
- decide whether browser E2E is worth the maintenance cost after the interop workflows stabilize
