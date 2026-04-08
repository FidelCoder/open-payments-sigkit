# Interoperability Guide

This project now supports two manual interoperability workflows:

1. trace-based verification for captured Open Payments traffic
2. live request preparation and optional dispatch for manual endpoint testing

These workflows are intentionally opt-in:

- no secrets are committed to the repo
- no live network path runs in CI by default
- local JWK/JWKS verification remains the default verification mode
- remote JWKS fetching only happens when explicitly requested

## When To Use Which Flow

Use trace verification when:

- you already have a captured request from logs, a proxy, or an HTTP client
- you want to prove whether a request verifies under your current key material
- you want signature-base and failure diagnostics

Use live request mode when:

- you need to sign a request locally with real client key material
- you want to save the final signed request as JSON and/or raw HTTP
- you optionally want to dispatch that request to a manually configured Open Payments-compatible endpoint

## Trace Verification

### Verify Against A Local JWKS File

```bash
pnpm interop:trace -- \
  --raw-request-file ./captured-request.http \
  --jwks-file ./client-keys.jwks.json \
  --preset protected-request \
  --default-scheme https
```

### Verify Against A Local Public JWK

```bash
pnpm interop:trace -- \
  --raw-request-file ./captured-request.http \
  --public-key-file ./client-public-key.jwk.json \
  --preset protected-request \
  --default-scheme https
```

### Verify Against A Remote JWKS URL

```bash
pnpm interop:trace -- \
  --raw-request-file ./captured-request.http \
  --jwks-url https://keys.example.com/jwks.json \
  --jwks-timeout-ms 5000 \
  --preset protected-request \
  --default-scheme https
```

### JSON Output

```bash
pnpm interop:trace -- \
  --raw-request-file ./captured-request.http \
  --jwks-file ./client-keys.jwks.json \
  --preset protected-request \
  --json
```

The trace workflow exits non-zero on verification failure and prints:

- pass/fail status
- verification code
- human-readable message
- explainer summary
- signature base when available

## Live Request Workflow

This workflow signs a real request locally and performs local post-sign verification before any network dispatch happens.

### Prepare A Signed Request Without Sending It

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
  --save-request ./signed-request.json \
  --save-raw-request ./signed-request.http
```

### Prepare And Dispatch A Signed Request

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

### Notes On Live Dispatch

- the script always performs local verification of the signed request first
- dispatch is only attempted when `--dispatch` is supplied
- expected remote status is optional but strongly recommended
- if `--expected-status` is omitted, the script treats an HTTP `2xx` response as success
- response bodies and headers can be written to disk for traceability

## Raw HTTP Request Expectations

For raw HTTP request input:

- absolute-form request lines are supported
- origin-form request lines are supported if a `Host` header is present
- `https` is assumed unless `--default-scheme` is set explicitly

Example:

```http
POST /quotes HTTP/1.1
Host: rs.example.com
Authorization: GNAP access_token="..."
Content-Type: application/json

{"receiver":"https://wallet.example.com/bob"}
```

## Recommended Reviewer Demo Flow

For a short manual reviewer demo:

1. verify a captured request with `pnpm interop:trace`
2. show the resulting pass/fail diagnostics and signature base
3. prepare a signed live request with `pnpm interop:live`
4. save the signed request artifacts to disk

This demonstrates that the project is useful for more than fixture-only local development while still avoiding unsafe assumptions about live credentials or environments.
