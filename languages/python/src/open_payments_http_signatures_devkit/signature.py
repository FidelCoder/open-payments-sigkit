from __future__ import annotations

import re

from .errors import StructuredFieldParseError
from .signature_input import split_dictionary_members
from .types import ParsedSignature, ParsedSignatures

LABEL_PATTERN = re.compile(r"^[A-Za-z*][A-Za-z0-9_.*-]*$")


def parse_signature(header_value: str) -> ParsedSignatures:
    members = split_dictionary_members(header_value)

    if not members:
        raise StructuredFieldParseError("The Signature header was empty.")

    parsed: ParsedSignatures = {}

    for member in members:
        equals_index = member.find("=")

        if equals_index == -1:
            raise StructuredFieldParseError(f'Missing "=" in Signature member "{member}".')

        label = member[:equals_index].strip()
        raw_value = member[equals_index + 1 :].strip()
        match = re.fullmatch(r":([^:]+):", raw_value)

        if not LABEL_PATTERN.fullmatch(label):
            raise StructuredFieldParseError(f'Invalid Signature label "{label}".')

        if not match:
            raise StructuredFieldParseError(
                f'Signature member "{label}" must be encoded as an RFC 8941 byte sequence.'
            )

        value = match.group(1)

        if not value:
            raise StructuredFieldParseError(
                f'Signature member "{label}" contained an empty value.'
            )

        parsed[label] = ParsedSignature(label=label, value=value, raw=member)

    return parsed
