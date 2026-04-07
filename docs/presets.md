# Presets

The devkit keeps generic RFC 9421 mechanics separate from Open Payments-specific request profiles. Presets define the default covered components and policy expectations for common request types.

## `grant-request`

Intended for initial grant creation requests.

- Covers `@method`
- Covers `@target-uri`
- Covers `content-digest` when a body exists
- Does not require `authorization`

## `protected-request`

Intended for token-bound requests where the access token is tied to the signing key.

- Covers `@method`
- Covers `@target-uri`
- Covers `authorization`
- Covers `content-digest` when a body exists
- Requires `authorization` to be present and covered

## `resource-write`

Intended for body-bearing protected writes such as incoming or outgoing payment creation.

- Starts with the same covered components as `protected-request`
- Enforces digest expectations for body-bearing writes
- Can add default `created` and `expires` metadata during signing

## Why Presets Matter

- They encode Open Payments expectations without mixing them into the generic parser and signature-base logic.
- They reduce footguns for common request classes.
- They let verification return precise failures like missing `authorization` coverage or absent `content-digest`.

## Custom Components

Callers can still add additional covered components on top of a preset. The core library normalizes component identifiers and preserves deterministic ordering.

