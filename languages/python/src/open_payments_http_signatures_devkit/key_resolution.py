from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .types import JsonWebKey, VerifyRequestOptions


@dataclass(slots=True)
class VerificationKeyResolution:
    key: JsonWebKey | None
    message: str | None = None
    details: dict[str, Any] | None = None


def get_jwk_kid(jwk: JsonWebKey) -> str | None:
    kid = jwk.get("kid")
    return kid if isinstance(kid, str) else None


def _list_available_key_ids(jwks: dict[str, list[JsonWebKey]]) -> list[str]:
    return [kid for key in jwks.get("keys", []) if (kid := get_jwk_kid(key))]


def resolve_verification_key(
    key_id: str | None, options: VerifyRequestOptions
) -> VerificationKeyResolution:
    if options.public_key_jwk:
        candidate_kid = get_jwk_kid(options.public_key_jwk)

        if key_id and candidate_kid and candidate_kid != key_id:
            return VerificationKeyResolution(
                key=None,
                message="The provided public key did not match the signature key ID.",
                details={
                    "keyId": key_id,
                    "providedKeyId": candidate_kid,
                    "reason": "public-key-kid-mismatch",
                    "source": "public-key",
                },
            )

        return VerificationKeyResolution(key=options.public_key_jwk)

    if not options.jwks:
        return VerificationKeyResolution(
            key=None,
            message="No public JWK or JWKS was supplied to the verifier.",
            details={"reason": "no-verification-key-material"},
        )

    keys = options.jwks.get("keys", [])

    if key_id:
        resolved = next((key for key in keys if get_jwk_kid(key) == key_id), None)

        if resolved:
            return VerificationKeyResolution(key=resolved)

        return VerificationKeyResolution(
            key=None,
            message="The verifier could not find the signature key ID in the supplied JWKS.",
            details={
                "availableKeyIds": _list_available_key_ids(options.jwks),
                "jwksKeyCount": len(keys),
                "keyId": key_id,
                "reason": "keyid-not-found-in-jwks",
                "source": "jwks",
            },
        )

    if len(keys) == 1:
        return VerificationKeyResolution(key=keys[0])

    return VerificationKeyResolution(
        key=None,
        message=(
            "The signature key ID was missing, and the supplied JWKS contains multiple candidate keys."
        ),
        details={
            "availableKeyIds": _list_available_key_ids(options.jwks),
            "jwksKeyCount": len(keys),
            "reason": "missing-keyid-for-multi-key-jwks",
            "source": "jwks",
        },
    )
