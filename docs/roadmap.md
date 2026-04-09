# Roadmap

This roadmap is product-oriented and centered on a clean multi-language evolution path for the Open Payments HTTP Signatures toolkit.

## Current Capabilities

- TypeScript reference implementation for signing, verification, parsing, inspection, and debugging
- `op-sig` CLI and Next.js docs/demo app backed by the same core logic
- deterministic fixtures, signed vectors, and conformance tests
- manual interoperability workflows for captured traces and optional live dispatch
- Python library preview for core digest, signature input, signature base, Ed25519 sign/verify, presets, and inspection

## Near-Term Priorities

Focus:

- keep the TypeScript reference implementation stable
- grow Python support without introducing parity claims the repo cannot yet back up
- preserve deterministic behavior and thin wrappers across languages

Deliverables:

- stable TypeScript core, CLI, docs app, and fixture set
- Python package refinement around request parsing, signing, verification, and inspection
- consistent documentation for supported surfaces and unsupported areas

Success criteria:

- `pnpm release:check` remains reliable
- Python tests pass locally and in CI
- the repository clearly communicates what is production-ready today versus what is still expanding

## Multi-Language Support Plan

Focus:

- keep TypeScript as the most complete implementation while expanding language support through well-bounded packages
- isolate language-specific logic under dedicated top-level areas
- align public behavior across languages without forcing identical ergonomics

Deliverables:

- `languages/python` as the first non-TypeScript implementation area
- aligned presets, result codes, and signing/verification flow in Python
- shared fixture intent across TypeScript and Python tests/examples
- language maturity documentation in the root README and package READMEs

Success criteria:

- developers can understand the role and maturity of each language at a glance
- adding another language later does not require restructuring the TypeScript core
- cross-language behavior remains comparable on shared fixture cases

## Interoperability And Conformance Work

Focus:

- strengthen confidence with captured traces and real operator workflows
- continue expanding deterministic conformance evidence
- keep live interoperability opt-in and operator-controlled

Deliverables:

- broader captured trace packs
- additional conformance vectors and negative cases
- clearer interop status and comparison notes across languages
- potential Python-side parity for trace ingestion after the current library scope matures

Success criteria:

- the toolkit can explain and reproduce real request failures from captured traffic
- interoperability claims are backed by stored traces, vectors, or repeatable manual workflows
- the deterministic fixture set remains the reference backbone for language alignment

## Tooling Improvements

Focus:

- keep local setup straightforward across Node.js and Python
- improve validation coverage without bloating the repo
- make package-level workflows predictable

Deliverables:

- Python test execution as part of the main validation path
- clearer local setup and example commands
- release and packaging improvements for both ecosystems

Success criteria:

- contributors can validate TypeScript and Python locally with documented commands
- CI covers the supported language surfaces that claim implementation status
- packaging metadata stays clean and publishable

## UI/UX Improvements

Focus:

- keep the docs app polished, technical, and workflow-first
- reflect the current language support honestly without turning the site into a marketing surface
- preserve the docs app as a practical debugging workspace

Deliverables:

- continued refinement of the sign, verify, inspect, and examples workflows
- clearer representation of supported languages and maturity
- improved artifact viewing, copy flows, and debugging ergonomics

Success criteria:

- the docs app remains fast, cohesive, and useful during real debugging work
- TypeScript-first capabilities are obvious without hiding the Python direction
- UI improvements do not leak product logic out of the stable core

## Long-Term Extensibility

Focus:

- support additional languages only when they can reuse proven fixture intent and product semantics
- keep the toolkit open to future algorithms, transport helpers, and conformance work
- avoid lock-in to a single wrapper or runtime surface

Deliverables:

- clearer language boundary conventions
- future-language scaffolding patterns based on the Python path
- optional expansion toward richer conformance tooling and language-specific wrappers

Success criteria:

- the repository remains understandable as it grows
- new language work can start from shared product semantics instead of reinterpreting the tool
- extensibility does not erode the stability of the existing TypeScript implementation
