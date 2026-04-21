# @open-payments-devkit/kiota-adapter

RFC 9421 HTTP Message Signatures authentication provider for [Kiota](https://github.com/microsoft/kiota)-generated Open Payments SDKs.

## Why

[Kiota](https://github.com/microsoft/kiota) generates well-structured SDKs from OpenAPI documents, but does not yet natively support [RFC 9421 HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html) ([microsoft/kiota#6907](https://github.com/microsoft/kiota/issues/6907)). Open Payments requires Ed25519 request signing for authenticated API access. This adapter bridges the gap by providing a `HttpSignatureAuthProvider` that plugs into Kiota's authentication pipeline.

## How It Works

The adapter implements Kiota's `AuthenticationProvider` interface:

1. Receives a `RequestInformation` object from the Kiota-generated client.
2. Extracts the HTTP method, URL, headers, and body.
3. Delegates to `@open-payments-devkit/core` for RFC 9421 signing (Content-Digest, Signature-Input, Signature).
4. Mutates the request headers in-place with the signature headers.

All cryptographic operations use Ed25519 via Node.js `crypto`. All signing logic is managed by the shared core library, so the adapter stays thin and maintainable.

## Usage

### With a Kiota-generated Open Payments client

```typescript
import { HttpSignatureAuthProvider } from '@open-payments-devkit/kiota-adapter'

const authProvider = new HttpSignatureAuthProvider({
  privateKeyJwk: {
    kty: 'OKP',
    crv: 'Ed25519',
    d: '...',
    x: '...'
  },
  keyId: 'my-registered-key-id',
  preset: 'protected-request'
})

// Use with Kiota's FetchRequestAdapter
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary'

const adapter = new FetchRequestAdapter(authProvider)
```

### Standalone signing (without Kiota)

```typescript
const result = authProvider.signPlainRequest({
  method: 'POST',
  url: 'https://wallet.example.com/quotes',
  headers: {
    'authorization': 'GNAP access_token="..."',
    'content-type': 'application/json'
  },
  body: JSON.stringify({ receiver: 'https://wallet.example.com/bob' })
})

console.log(result.signatureInput)
console.log(result.signature)
console.log(result.signatureBase)
```

## Open Payments Presets

The adapter supports the same Open Payments signing presets as `@open-payments-devkit/core`:

| Preset | Use case | Covered components |
|--------|----------|--------------------|
| `grant-request` | Unsigned grant bootstrapping | `@method`, `@target-uri` + digest |
| `protected-request` | Token-bound requests (default) | `@method`, `@target-uri`, `authorization` + digest |
| `resource-write` | Strict write operations | `@method`, `@target-uri`, `authorization` + digest, timestamps |

## Integration with Kiota SDK generation

This adapter is designed to be the HTTP signature layer for Kiota-generated Open Payments SDKs. When Kiota adds native RFC 9421 support, this adapter can serve as the reference implementation or be replaced by the built-in handler.

## API

### `HttpSignatureAuthProvider`

**Constructor options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `privateKeyJwk` | `JsonWebKey` | Yes | Ed25519 private key in JWK format |
| `keyId` | `string` | Yes | Key ID registered with the authorization server |
| `preset` | `PresetName` | No | Open Payments preset (defaults to `'protected-request'`) |

**Methods:**

| Method | Description |
|--------|-------------|
| `authenticateRequest(request, context?)` | Signs a Kiota `RequestInformation` in-place |
| `signPlainRequest(request)` | Signs a plain request object and returns the full result |
