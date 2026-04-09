from __future__ import annotations

import json
import re

from .errors import StructuredFieldParseError
from .types import ParsedSignatureInput, ParsedSignatureInputs, SignatureInputParameters

LABEL_PATTERN = re.compile(r"^[A-Za-z*][A-Za-z0-9_.*-]*$")
PARAMETER_ORDER = ("created", "expires", "nonce", "keyid", "alg", "tag")


def split_dictionary_members(value: str) -> list[str]:
    members: list[str] = []
    current: list[str] = []
    depth = 0
    in_string = False

    for index, char in enumerate(value):
        previous = value[index - 1] if index > 0 else ""

        if char == '"' and previous != "\\":
            in_string = not in_string

        if not in_string:
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
            elif char == "," and depth == 0:
                member = "".join(current).strip()

                if member:
                    members.append(member)

                current = []
                continue

        current.append(char)

    final_member = "".join(current).strip()

    if final_member:
        members.append(final_member)

    return members


def unquote_structured_string(value: str) -> str:
    if not value.startswith('"') or not value.endswith('"'):
        raise StructuredFieldParseError(f'Expected a quoted string, received "{value}".')

    return value[1:-1].replace('\\"', '"').replace("\\\\", "\\")


def parse_parameter_bag(value: str) -> dict[str, int | str | bool]:
    params: dict[str, int | str | bool] = {}
    segments = [segment.strip() for segment in value.split(";") if segment.strip()]

    for segment in segments:
        equals_index = segment.find("=")

        if equals_index == -1:
            params[segment] = True
            continue

        key = segment[:equals_index].strip()
        raw_value = segment[equals_index + 1 :].strip()

        if not key:
            raise StructuredFieldParseError("Encountered an empty parameter name.")

        if raw_value.startswith('"'):
            params[key] = unquote_structured_string(raw_value)
        elif re.fullmatch(r"-?\d+", raw_value):
            params[key] = int(raw_value)
        else:
            params[key] = raw_value

    return params


def _serialize_parameter_value(name: str, value: int | str) -> str:
    if name in {"created", "expires"}:
        return str(value)

    return json.dumps(value)


def serialize_signature_parameters(
    components: list[str], params: SignatureInputParameters
) -> str:
    serialized_components = " ".join(json.dumps(component) for component in components)
    serialized_params = ""

    for name in PARAMETER_ORDER:
        value = getattr(params, name)

        if value is None:
            continue

        serialized_params += f";{name}={_serialize_parameter_value(name, value)}"

    return f"({serialized_components}){serialized_params}"


def create_parsed_signature_input(
    label: str, components: list[str], params: SignatureInputParameters
) -> ParsedSignatureInput:
    return ParsedSignatureInput(
        label=label,
        components=components,
        params=params,
        raw=f"{label}={serialize_signature_parameters(components, params)}",
    )


def serialize_signature_input(
    label: str, components: list[str], params: SignatureInputParameters
) -> str:
    return f"{label}={serialize_signature_parameters(components, params)}"


def _find_closing_parenthesis(value: str) -> int:
    depth = 0
    in_string = False

    for index, char in enumerate(value):
        previous = value[index - 1] if index > 0 else ""

        if char == '"' and previous != "\\":
            in_string = not in_string

        if in_string:
            continue

        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1

            if depth == 0:
                return index

    return -1


def _parse_inner_list(value: str) -> list[str]:
    components: list[str] = []
    remaining = value.strip()

    while remaining:
        if not remaining.startswith('"'):
            raise StructuredFieldParseError(
                f'Expected a quoted covered component, received "{remaining}".'
            )

        closing_index = remaining.find('"', 1)

        if closing_index == -1:
            raise StructuredFieldParseError("Encountered an unterminated quoted component.")

        token = remaining[: closing_index + 1]
        components.append(unquote_structured_string(token))
        remaining = remaining[closing_index + 1 :].strip()

    return components


def _to_signature_input_parameters(
    values: dict[str, int | str | bool]
) -> SignatureInputParameters:
    params = SignatureInputParameters()

    for name, value in values.items():
        if value is True:
            raise StructuredFieldParseError(
                f'The "{name}" signature parameter must include an explicit value.'
            )

        if name in {"created", "expires"}:
            if not isinstance(value, int):
                raise StructuredFieldParseError(f'The "{name}" parameter must be an integer.')

            setattr(params, name, value)
        elif name in {"alg", "keyid", "nonce", "tag"}:
            if not isinstance(value, str):
                raise StructuredFieldParseError(f'The "{name}" parameter must be a string.')

            setattr(params, name, value)

    return params


def parse_signature_input(header_value: str) -> ParsedSignatureInputs:
    members = split_dictionary_members(header_value)

    if not members:
        raise StructuredFieldParseError("The Signature-Input header was empty.")

    parsed: ParsedSignatureInputs = {}

    for member in members:
        equals_index = member.find("=")

        if equals_index == -1:
            raise StructuredFieldParseError(
                f'Missing "=" in Signature-Input member "{member}".'
            )

        label = member[:equals_index].strip()
        raw_value = member[equals_index + 1 :].strip()

        if not LABEL_PATTERN.fullmatch(label):
            raise StructuredFieldParseError(f'Invalid Signature-Input label "{label}".')

        if not raw_value.startswith("("):
            raise StructuredFieldParseError(
                f'Signature-Input member "{label}" must start with an inner list.'
            )

        closing_parenthesis = _find_closing_parenthesis(raw_value)

        if closing_parenthesis == -1:
            raise StructuredFieldParseError(
                f'Signature-Input member "{label}" has an unterminated inner list.'
            )

        inner_list = raw_value[1:closing_parenthesis]
        parameter_bag = raw_value[closing_parenthesis + 1 :]
        components = _parse_inner_list(inner_list)
        params = _to_signature_input_parameters(parse_parameter_bag(parameter_bag))

        parsed[label] = ParsedSignatureInput(
            label=label,
            components=components,
            params=params,
            raw=member,
        )

    return parsed
