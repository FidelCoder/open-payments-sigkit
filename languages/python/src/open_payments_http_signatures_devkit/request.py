from __future__ import annotations

from collections.abc import Mapping
from urllib.parse import urlsplit

from .types import HttpRequest
from .utils import normalize_headers


def _coerce_request(request: HttpRequest | Mapping[str, object]) -> HttpRequest:
    if isinstance(request, HttpRequest):
        return request

    if not isinstance(request, Mapping):
        raise TypeError("Request must be an HttpRequest or mapping.")

    method = request.get("method")
    url = request.get("url")
    headers = request.get("headers")
    body = request.get("body")

    if not isinstance(method, str) or not isinstance(url, str):
        raise ValueError('Request must include string "method" and "url" values.')

    if headers is not None and not isinstance(headers, Mapping):
        raise ValueError('Request "headers" must be a mapping when provided.')

    if body is not None and not isinstance(body, str):
        raise ValueError('Request "body" must be a string when provided.')

    normalized_headers = (
        {str(name): str(value) for name, value in headers.items()} if isinstance(headers, Mapping) else None
    )

    return HttpRequest(method=method, url=url, headers=normalized_headers, body=body)


def normalize_request(request: HttpRequest | Mapping[str, object]) -> HttpRequest:
    parsed = _coerce_request(request)
    method = parsed.method.strip()

    if not method:
        raise ValueError("HTTP method must not be empty.")

    url = urlsplit(parsed.url)

    if not url.scheme or not url.netloc:
        raise ValueError('Request "url" must be an absolute URL.')

    return HttpRequest(
        method=method,
        url=url.geturl(),
        headers=normalize_headers(parsed.headers),
        body=parsed.body,
    )
