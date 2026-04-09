from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from ._constants import CONTENT_DIGEST_HEADER, SIGNATURE_HEADER, SIGNATURE_INPUT_HEADER
from .crypto import (
    UnsupportedAlgorithmError,
    assert_supported_public_jwk,
    is_supported_signature_algorithm,
    verify_ed25519,
)
from .digest import verify_content_digest
from .errors import RequestComponentResolutionError, StructuredFieldParseError
from .key_resolution import resolve_verification_key
from .presets import get_preset
from .request import normalize_request
from .signature import parse_signature
from .signature_base import build_signature_base
from .signature_input import parse_signature_input
from .types import (
    ParsedSignatureInput,
    VerificationCode,
    VerificationResult,
    VerifyRequestOptions,
)
from .utils import normalize_component_list


def _option_value(options: Mapping[str, object], snake_key: str, camel_key: str) -> object | None:
    if snake_key in options:
        return options[snake_key]

    return options.get(camel_key)


def _coerce_verify_request_options(
    options: VerifyRequestOptions | Mapping[str, object] | None
) -> VerifyRequestOptions:
    if options is None:
        return VerifyRequestOptions()

    if isinstance(options, VerifyRequestOptions):
        return options

    if not isinstance(options, Mapping):
        raise TypeError("VerifyRequest options must be a VerifyRequestOptions instance or mapping.")

    public_key_jwk = _option_value(options, "public_key_jwk", "publicKeyJwk")
    jwks = _option_value(options, "jwks", "jwks")
    required_components = _option_value(options, "required_components", "requiredComponents")
    preset = _option_value(options, "preset", "preset")
    require_digest_for_body = _option_value(
        options, "require_digest_for_body", "requireDigestForBody"
    )

    return VerifyRequestOptions(
        public_key_jwk=dict(public_key_jwk) if isinstance(public_key_jwk, Mapping) else None,
        jwks={"keys": [dict(key) for key in jwks.get("keys", [])]} if isinstance(jwks, Mapping) else None,
        require_digest_for_body=require_digest_for_body
        if isinstance(require_digest_for_body, bool)
        else None,
        required_components=list(required_components) if isinstance(required_components, list) else None,
        preset=preset if isinstance(preset, str) else None,
    )


def _create_failure(
    code: VerificationCode,
    message: str,
    details: dict[str, Any] | None = None,
    covered_components: list[str] | None = None,
    signature_base: str | None = None,
) -> VerificationResult:
    return VerificationResult(
        ok=False,
        code=code,
        message=message,
        details=details,
        covered_components=covered_components,
        signature_base=signature_base,
    )


def _find_matching_signature_label(
    signature_input_members: dict[str, ParsedSignatureInput],
    signature_members: dict[str, object],
) -> str | None:
    for label in signature_input_members:
        if label in signature_members:
            return label

    return None


def _resolve_required_components(
    options: VerifyRequestOptions, has_body: bool, require_digest_for_body: bool
) -> tuple[list[str], object | None]:
    preset = get_preset(options.preset) if options.preset else None
    preset_components = preset.base_components if preset else []
    configured_components = options.required_components or []
    dynamic_components = [CONTENT_DIGEST_HEADER] if has_body and require_digest_for_body else []

    return normalize_component_list([*preset_components, *configured_components, *dynamic_components]), preset


def verify_request(
    request: object, options: VerifyRequestOptions | Mapping[str, object] | None = None
) -> VerificationResult:
    normalized_request = normalize_request(request)
    parsed_options = _coerce_verify_request_options(options)
    request_body = normalized_request.body
    has_body = request_body is not None
    preset = get_preset(parsed_options.preset) if parsed_options.preset else None
    require_digest_for_body = (
        parsed_options.require_digest_for_body
        if parsed_options.require_digest_for_body is not None
        else preset.require_digest_for_body
        if preset is not None
        else has_body
    )
    required_components, _ = _resolve_required_components(
        parsed_options, has_body, require_digest_for_body
    )
    content_digest = (normalized_request.headers or {}).get(CONTENT_DIGEST_HEADER)

    if has_body and require_digest_for_body and not content_digest:
        return _create_failure(
            "MISSING_CONTENT_DIGEST",
            "The request body is present but the Content-Digest header is missing.",
            {"header": CONTENT_DIGEST_HEADER},
        )

    if request_body is not None and content_digest and not verify_content_digest(
        request_body, content_digest
    ):
        return _create_failure(
            "INVALID_CONTENT_DIGEST",
            "The Content-Digest header does not match the supplied request body.",
            {
                "header": CONTENT_DIGEST_HEADER,
                "expected": "sha-256 digest of request body",
                "received": content_digest,
            },
        )

    signature_header = (normalized_request.headers or {}).get(SIGNATURE_HEADER)

    if not signature_header:
        return _create_failure(
            "MISSING_SIGNATURE", "The Signature header is missing from the request."
        )

    signature_input_header = (normalized_request.headers or {}).get(SIGNATURE_INPUT_HEADER)

    if not signature_input_header:
        return _create_failure(
            "MISSING_SIGNATURE_INPUT",
            "The Signature-Input header is missing from the request.",
        )

    try:
        parsed_signature_inputs = parse_signature_input(signature_input_header)
        parsed_signatures = parse_signature(signature_header)
        label = _find_matching_signature_label(parsed_signature_inputs, parsed_signatures)

        if not label:
            return _create_failure(
                "MISSING_SIGNATURE",
                "The Signature and Signature-Input headers did not contain a matching label.",
                {
                    "signatureInputLabels": list(parsed_signature_inputs.keys()),
                    "signatureLabels": list(parsed_signatures.keys()),
                },
            )

        parsed_signature_input = parsed_signature_inputs.get(label)
        parsed_signature = parsed_signatures.get(label)

        if not parsed_signature_input or not parsed_signature:
            return _create_failure(
                "INVALID_SIGNATURE_INPUT",
                f'The selected signature label "{label}" was not available in both signature headers.',
            )

        if parsed_signature_input.params.alg and not is_supported_signature_algorithm(
            parsed_signature_input.params.alg
        ):
            return _create_failure(
                "UNSUPPORTED_ALGORITHM",
                f'The Signature-Input alg parameter "{parsed_signature_input.params.alg}" is not supported.',
                {"alg": parsed_signature_input.params.alg},
                covered_components=parsed_signature_input.components,
            )

        missing_components = [
            component
            for component in required_components
            if component not in parsed_signature_input.components
        ]

        if missing_components:
            return _create_failure(
                "MISSING_REQUIRED_COMPONENT",
                "The signature did not cover the components required by the verification policy.",
                {"missingComponents": missing_components},
                covered_components=parsed_signature_input.components,
            )

        key_resolution = resolve_verification_key(parsed_signature_input.params.keyid, parsed_options)
        public_key_jwk = key_resolution.key

        if not public_key_jwk:
            return _create_failure(
                "KEY_NOT_FOUND",
                key_resolution.message
                or "The verifier could not locate a public key for the signature key ID.",
                key_resolution.details,
                covered_components=parsed_signature_input.components,
            )

        assert_supported_public_jwk(public_key_jwk)
        signature_base = build_signature_base(normalized_request, parsed_signature_input)

        if not verify_ed25519(signature_base, parsed_signature.value, public_key_jwk):
            return _create_failure(
                "SIGNATURE_MISMATCH",
                "The signature did not match the reconstructed signature base.",
                {"keyId": parsed_signature_input.params.keyid, "label": label},
                covered_components=parsed_signature_input.components,
                signature_base=signature_base,
            )

        return VerificationResult(
            ok=True,
            code="OK",
            message="The request signature and covered components verified successfully.",
            covered_components=parsed_signature_input.components,
            signature_base=signature_base,
        )
    except UnsupportedAlgorithmError as error:
        return _create_failure("UNSUPPORTED_ALGORITHM", str(error))
    except RequestComponentResolutionError as error:
        return _create_failure(
            "REQUEST_COMPONENT_MISMATCH",
            str(error),
            {"component": error.component_id},
        )
    except (StructuredFieldParseError, ValueError) as error:
        return _create_failure("INVALID_SIGNATURE_INPUT", str(error))
