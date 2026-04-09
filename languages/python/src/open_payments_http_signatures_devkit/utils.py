from __future__ import annotations

import base64
from typing import Iterable


def encode_base64(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii")


def decode_base64(value: str) -> bytes:
    return base64.b64decode(value.encode("ascii"))


def decode_base64url(value: str) -> bytes:
    padding = "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("ascii"))


def normalize_header_name(value: str) -> str:
    return value.strip().lower()


def normalize_headers(headers: dict[str, str] | None) -> dict[str, str]:
    if not headers:
        return {}

    normalized: dict[str, str] = {}

    for name, value in headers.items():
        normalized[normalize_header_name(str(name))] = str(value).strip()

    return normalized


def normalize_component_id(value: str) -> str:
    trimmed = value.strip().removeprefix('"').removesuffix('"')
    return trimmed if trimmed.startswith("@") else trimmed.lower()


def normalize_component_list(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []

    for value in values:
        component = normalize_component_id(value)

        if component and component not in seen:
            seen.add(component)
            normalized.append(component)

    return normalized
