from __future__ import annotations

from dataclasses import dataclass

from .http_components import resolve_component_value
from .request import normalize_request
from .signature_input import serialize_signature_parameters
from .types import CanonicalComponent, HttpRequest, ParsedSignatureInput


@dataclass(slots=True)
class SignatureBaseParts:
    canonical_components: list[CanonicalComponent]
    signature_base: str


def build_signature_base_parts(
    request: HttpRequest | dict[str, object],
    parsed_signature_input: ParsedSignatureInput,
) -> SignatureBaseParts:
    normalized_request = normalize_request(request)
    canonical_components: list[CanonicalComponent] = []

    for component_id in parsed_signature_input.components:
        value = resolve_component_value(normalized_request, component_id)
        line = f'"{component_id}": {value}'
        canonical_components.append(CanonicalComponent(id=component_id, value=value, line=line))

    signature_params_line = (
        '"@signature-params": '
        f"{serialize_signature_parameters(parsed_signature_input.components, parsed_signature_input.params)}"
    )

    return SignatureBaseParts(
        canonical_components=canonical_components,
        signature_base="\n".join([*(entry.line for entry in canonical_components), signature_params_line]),
    )


def build_signature_base(
    request: HttpRequest | dict[str, object],
    parsed_signature_input: ParsedSignatureInput,
) -> str:
    return build_signature_base_parts(request, parsed_signature_input).signature_base
