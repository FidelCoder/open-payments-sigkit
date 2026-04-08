# Roadmap

This roadmap is written as a practical execution plan for a focused Open Payments developer tooling effort. It assumes the project remains tightly scoped around signing, verification, inspection, debugging, and interoperability support for HTTP Message Signatures.

## Milestone 1: Stabilize And Document The Current TypeScript Toolkit

Scope:

- keep the core signing and verification APIs stable
- maintain strict TypeScript, lint, test, and build coverage
- ensure CLI and docs wrappers remain thin and consistent with the core
- provide reviewer-friendly documentation of what already works

Deliverables:

- stable `packages/core` API for signing, verification, parsing, and inspection
- working `op-sig` CLI
- working docs/demo app
- deterministic fixtures, signed vectors, and conformance tests
- clear root README and architecture/presets/verification docs

Success criteria:

- `pnpm release:check` passes reliably
- a reviewer can understand the problem, scope, and current capability within a few minutes
- the repo reads as a serious devtools foundation rather than a one-off prototype

## Milestone 2: Interoperability Validation And Trace-Based Verification

Scope:

- support real captured request traces, not only synthetic object fixtures
- provide a clear manual workflow for validating interoperability without hardcoded secrets
- prove that local verification/debugging works against raw HTTP inputs

Deliverables:

- raw HTTP request ingestion in the core toolkit
- trace-oriented interop scripts for captured request validation
- interop guide and interop status documentation
- saved signed-request artifacts and clear pass/fail diagnostics for manual runs

Success criteria:

- a developer can take a captured Open Payments request and verify it locally
- the toolkit can explain why a real request passes or fails
- the repo contains an honest status document showing what has and has not been validated

## Milestone 3: Improved Docs, Examples, And Optional JWKS Support

Scope:

- improve operator ergonomics around verification inputs
- support remote JWKS resolution only when explicitly requested
- make reviewer-facing docs easier to scan and trust

Deliverables:

- opt-in remote JWKS fetch helper with timeout and typed errors
- CLI support for remote JWKS verification
- improved README positioning for grant reviewers
- stronger examples and interop documentation

Success criteria:

- local JWK/JWKS verification remains the default path
- remote JWKS resolution can be exercised manually without changing the deterministic core flow
- reviewers can see a credible path from local tooling to real interoperability work

## Milestone 4: Optional Upstream Integration And Expanded Conformance Support

Scope:

- deepen interoperability confidence only after the current toolkit is stable
- explore broader conformance fixtures and possible upstream integration hooks
- evaluate whether additional browser automation is worth the maintenance cost

Deliverables:

- captured trace packs from real integrations
- broader conformance vectors and diagnostics
- optional browser E2E coverage if it can be added cleanly
- documented upstream integration path or contributor guide for expanding compatibility coverage

Success criteria:

- the repo is useful as both a debugging tool and a reference implementation aid
- interoperability claims are backed by documented trace-based evidence
- new automation does not destabilize the core signing and verification workflows
