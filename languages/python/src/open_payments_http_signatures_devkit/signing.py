from __future__ import annotations

import time
from collections.abc import Mapping
from typing import Any

from ._constants import (
    AUTHORIZATION_HEADER,
    CONTENT_DIGEST_HEADER,
    DEFAULT_SIGNATURE_LABEL,
    SIGNATURE_HEADER,
    SIGNATURE_INPUT_HEADER,
)
from .crypto import sign_ed25519
from .digest import create_content_digest
from .presets import get_preset
from .request import normalize_request
from .signature_base import build_signature_base
from .signature_input import create_parsed_signature_input, serialize_signature_input
from .types import HttpRequest, SignRequestOptions, SignatureInputParameters, SignedRequestResult
from .utils import normalize_component_list


def _option_value(options: Mapping[str, object], snake_key: str, camel_key: str) -> object | None:
    if snake_key in options:
        return options[snake_key]

    return options.get(camel_key)


def _optional_int(value: object, field_name: str) -> int | None:
    if value is None:
        return None

    if not isinstance(value, int):
        raise ValueError(f'SignRequest option "{field_name}" must be an integer when provided.')

    return value


def _optional_str(value: object, field_name: str) -> str | None:
    if value is None:
        return None

    if not isinstance(value, str):
        raise ValueError(f'SignRequest option "{field_name}" must be a string when provided.')

    return value


def _coerce_sign_request_options(
    options: SignRequestOptions | Mapping[str, object]
) -> SignRequestOptions:
    if isinstance(options, SignRequestOptions):
        return options

    if not isinstance(options, Mapping):
        raise TypeError("SignRequest options must be a SignRequestOptions instance or mapping.")

    key_id = _option_value(options, "key_id", "keyId")
    private_key_jwk = _option_value(options, "private_key_jwk", "privateKeyJwk")

    if not isinstance(key_id, str) or not isinstance(private_key_jwk, Mapping):
        raise ValueError('SignRequest options must include "key_id" and "private_key_jwk".')

    components = _option_value(options, "components", "components")
    preset = _option_value(options, "preset", "preset")

    return SignRequestOptions(
        key_id=key_id,
        private_key_jwk=dict(private_key_jwk),
        preset=preset if isinstance(preset, str) else None,
        components=list(components) if isinstance(components, list) else None,
        created=_optional_int(_option_value(options, "created", "created"), "created"),
        expires=_optional_int(_option_value(options, "expires", "expires"), "expires"),
        nonce=_optional_str(_option_value(options, "nonce", "nonce"), "nonce"),
        tag=_optional_str(_option_value(options, "tag", "tag"), "tag"),
    )


def _resolve_covered_components(
    options: SignRequestOptions, has_body: bool
) -> tuple[list[str], object | None]:
    preset = get_preset(options.preset) if options.preset else None
    base_components = preset.base_components if preset else []
    configured_components = options.components or []
    dynamic_components = [CONTENT_DIGEST_HEADER] if has_body and (not preset or preset.include_digest_when_body) else []

    return normalize_component_list([*base_components, *configured_components, *dynamic_components]), preset


def _resolve_signature_input_parameters(
    options: SignRequestOptions, preset: object | None
) -> SignatureInputParameters:
    params = SignatureInputParameters(
        created=options.created,
        expires=options.expires,
        keyid=options.key_id,
        nonce=options.nonce,
        tag=options.tag,
    )

    if preset and preset.default_timestamps and preset.default_timestamps.add_created:
        created = params.created if params.created is not None else int(time.time())
        params.created = created
        params.expires = params.expires if params.expires is not None else created + preset.default_timestamps.ttl_seconds

    return params


def sign_request(
    request: HttpRequest | Mapping[str, Any], options: SignRequestOptions | Mapping[str, object]
) -> SignedRequestResult:
    normalized_request = normalize_request(request)
    parsed_options = _coerce_sign_request_options(options)
    headers = dict(normalized_request.headers or {})
    request_body = normalized_request.body
    has_body = request_body is not None

    if request_body is not None:
        headers[CONTENT_DIGEST_HEADER] = create_content_digest(request_body)

    covered_components, preset = _resolve_covered_components(parsed_options, has_body)

    if preset and preset.require_authorization and AUTHORIZATION_HEADER not in headers:
        raise ValueError(
            f'The "{preset.name}" preset requires an Authorization header on the request.'
        )

    params = _resolve_signature_input_parameters(parsed_options, preset)
    signature_input = serialize_signature_input(DEFAULT_SIGNATURE_LABEL, covered_components, params)
    request_to_sign = HttpRequest(
        method=normalized_request.method,
        url=normalized_request.url,
        headers=headers,
        body=normalized_request.body,
    )
    parsed_signature_input = create_parsed_signature_input(
        DEFAULT_SIGNATURE_LABEL, covered_components, params
    )
    signature_base = build_signature_base(request_to_sign, parsed_signature_input)
    signature_value = sign_ed25519(signature_base, parsed_options.private_key_jwk)
    signature = f"{DEFAULT_SIGNATURE_LABEL}=:{signature_value}:"

    signed_request = HttpRequest(
        method=request_to_sign.method,
        url=request_to_sign.url,
        body=request_to_sign.body,
        headers={
            **headers,
            SIGNATURE_HEADER: signature,
            SIGNATURE_INPUT_HEADER: signature_input,
        },
    )

    return SignedRequestResult(
        request=signed_request,
        content_digest=headers.get(CONTENT_DIGEST_HEADER),
        signature_input=signature_input,
        signature=signature,
        covered_components=covered_components,
        signature_base=signature_base,
    )
