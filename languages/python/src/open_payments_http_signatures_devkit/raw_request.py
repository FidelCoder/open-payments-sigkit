"""Raw HTTP request parsing for captured traces.

Parses a raw HTTP request string (as captured from tools like curl --trace,
tcpdump, or proxy logs) into the shared HttpRequest model used by the toolkit.
"""

from __future__ import annotations

import re
from urllib.parse import urljoin

from .request import normalize_request
from .types import HttpRequest
from .utils import normalize_headers

_REQUEST_LINE_RE = re.compile(r"^(\S+)\s+(\S+)(?:\s+HTTP/\d(?:\.\d)?)?$")


def _resolve_raw_request_url(
    target: str,
    headers: dict[str, str],
    default_scheme: str,
) -> str:
    if re.match(r"^https?://", target, re.IGNORECASE):
        return target

    authority = headers.get("host") or headers.get(":authority")

    if not authority:
        raise ValueError(
            "A raw HTTP request with a relative request target must include "
            "a Host header or use an absolute target URL."
        )

    base = f"{default_scheme}://{authority}"
    return urljoin(base, target)


def parse_raw_http_request(
    raw_request: str,
    *,
    default_scheme: str = "https",
) -> HttpRequest:
    """Parse a captured raw HTTP request string into an HttpRequest.

    Supports both ``\\r\\n`` and ``\\n`` line endings. A blank line separates
    headers from the optional body.  Continuation lines (starting with
    whitespace) are folded into the preceding header value.

    Args:
        raw_request: The raw HTTP request text.
        default_scheme: Scheme to use when the request target is relative
            and a Host header is present.  Defaults to ``"https"``.

    Returns:
        An :class:`HttpRequest` with the parsed method, URL, headers, and body.

    Raises:
        ValueError: If the input is empty or the request line is malformed.
    """
    normalized_input = raw_request.replace("\r\n", "\n").strip()

    if not normalized_input:
        raise ValueError("A raw HTTP request is required.")

    separator_index = normalized_input.find("\n\n")

    if separator_index == -1:
        head = normalized_input
        body = ""
    else:
        head = normalized_input[:separator_index]
        body = normalized_input[separator_index + 2 :]

    lines = head.split("\n")
    request_line = lines.pop(0).strip() if lines else ""

    if not request_line:
        raise ValueError("The raw HTTP request is missing a request line.")

    match = _REQUEST_LINE_RE.match(request_line)

    if not match:
        raise ValueError(
            'The raw HTTP request line must be formatted as '
            '"METHOD /path HTTP/1.1" or use an absolute target URL.'
        )

    method = match.group(1)
    target = match.group(2)

    if not method or not target:
        raise ValueError(
            "The raw HTTP request line must include both an HTTP method "
            "and a request target."
        )

    headers: dict[str, str] = {}
    current_header_name: str | None = None

    for raw_line in lines:
        if not raw_line.strip():
            continue

        # Continuation line (obs-fold)
        if raw_line[0] in (" ", "\t") and current_header_name:
            headers[current_header_name] = (
                f"{headers[current_header_name]} {raw_line.strip()}"
            )
            continue

        colon_index = raw_line.find(":")

        if colon_index == -1:
            raise ValueError(
                f'The raw HTTP header line "{raw_line}" must be formatted '
                'as "Name: value".'
            )

        name = raw_line[:colon_index].strip().lower()
        value = raw_line[colon_index + 1 :].strip()

        if not name or not value:
            raise ValueError(
                f'The raw HTTP header line "{raw_line}" must include '
                "both a name and a value."
            )

        if name in headers:
            headers[name] = f"{headers[name]}, {value}"
        else:
            headers[name] = value

        current_header_name = name

    url = _resolve_raw_request_url(target, headers, default_scheme)

    result = HttpRequest(
        method=method,
        url=url,
        headers=headers if headers else None,
        body=body if body else None,
    )

    return result
