from __future__ import annotations

import hashlib
import re

from ._constants import CONTENT_DIGEST_ALGORITHM
from .utils import encode_base64

CONTENT_DIGEST_PATTERN = re.compile(r"^([A-Za-z0-9_-]+)=:([^:]+):$")


def create_content_digest(body: str) -> str:
    digest = hashlib.sha256(body.encode("utf-8")).digest()
    return f"{CONTENT_DIGEST_ALGORITHM}=:{encode_base64(digest)}:"


def verify_content_digest(body: str, header_value: str) -> bool:
    match = CONTENT_DIGEST_PATTERN.match(header_value.strip())

    if not match:
        return False

    algorithm = match.group(1)

    if algorithm.lower() != CONTENT_DIGEST_ALGORITHM:
        return False

    return create_content_digest(body) == header_value.strip()
