from __future__ import annotations

from ._constants import SIGNATURE_HEADER, SIGNATURE_INPUT_HEADER
from .request import normalize_request
from .signature import parse_signature
from .signature_base import build_signature_base_parts
from .signature_input import parse_signature_input
from .types import InspectionResult, ParsedSignatureInputs, ParsedSignatures


def _select_inspection_label(
    parsed_signature_inputs: ParsedSignatureInputs, parsed_signatures: ParsedSignatures
) -> str | None:
    for label in parsed_signature_inputs:
        if label in parsed_signatures:
            return label

    return next(iter(parsed_signature_inputs.keys()), None)


def inspect_request_signature(request: object) -> InspectionResult:
    normalized_request = normalize_request(request)
    signature_input_header = (normalized_request.headers or {}).get(SIGNATURE_INPUT_HEADER)
    signature_header = (normalized_request.headers or {}).get(SIGNATURE_HEADER)
    parsed_signature_inputs = (
        parse_signature_input(signature_input_header) if signature_input_header else {}
    )
    parsed_signatures = parse_signature(signature_header) if signature_header else {}
    selected_label = _select_inspection_label(parsed_signature_inputs, parsed_signatures)

    if not selected_label:
        return InspectionResult(
            signature_input_header=signature_input_header,
            signature_header=signature_header,
            parsed_signature_inputs=parsed_signature_inputs,
            parsed_signatures=parsed_signatures,
        )

    selected_signature_input = parsed_signature_inputs.get(selected_label)

    if not selected_signature_input:
        raise ValueError(f'Unable to locate Signature-Input member "{selected_label}".')

    signature_base_parts = build_signature_base_parts(normalized_request, selected_signature_input)

    return InspectionResult(
        signature_input_header=signature_input_header,
        signature_header=signature_header,
        parsed_signature_inputs=parsed_signature_inputs,
        parsed_signatures=parsed_signatures,
        selected_label=selected_label,
        covered_components=selected_signature_input.components,
        canonical_components=signature_base_parts.canonical_components,
        signature_base=signature_base_parts.signature_base,
    )
