# Python Support

`languages/python` contains the Python package for `open-payments-http-signatures-devkit`.

Current maturity:

- TypeScript remains the most complete implementation in this repository.
- Python is a focused library preview for core signing, verification, and inspection flows.
- The Python package is structured to grow cleanly without mixing language-specific logic into the TypeScript core.

What Python supports today:

- shared HTTP request model
- `Content-Digest` creation and validation
- `Signature-Input` serialization and parsing
- `Signature` parsing
- canonical signature-base construction
- Ed25519 JWK signing and verification
- `sign_request`
- `verify_request`
- `inspect_request_signature`
- Open Payments presets:
  - `grant-request`
  - `protected-request`
  - `resource-write`

What Python does not support yet:

- raw HTTP request parsing
- remote JWKS fetching
- a Python CLI
- the richer verification explainer helpers from the TypeScript package
- full parity with the TypeScript docs app and interoperability harness

## Package Layout

```text
languages/python/
  pyproject.toml
  README.md
  src/
    open_payments_http_signatures_devkit/
  tests/
  examples/
```

## Local Setup

Create a virtual environment if you want an isolated Python install:

```bash
cd languages/python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

Run the Python test suite from the repo root:

```bash
pnpm python:test
```

Run the example scripts from the repo root:

```bash
pnpm python:example:sign
pnpm python:example:verify
pnpm python:example:inspect
```

The examples and tests reuse the fixture intent from `packages/fixtures` so the Python implementation can be compared against the same requests, keys, and signature vectors used by the TypeScript package.
