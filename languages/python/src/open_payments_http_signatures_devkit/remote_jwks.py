"""Optional remote JWKS fetching helper.

Fetches a JWKS document from a remote URL when the caller explicitly opts in.
This mirrors the TypeScript ``fetchRemoteJwks`` helper in
``packages/core/src/jwk/remote-jwks.ts``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

RemoteJwksFetchErrorCode = Literal[
    "REMOTE_JWKS_TIMEOUT",
    "REMOTE_JWKS_HTTP_ERROR",
    "REMOTE_JWKS_INVALID",
    "REMOTE_JWKS_NETWORK_ERROR",
]

DEFAULT_REMOTE_JWKS_TIMEOUT_SECONDS = 5


class RemoteJwksFetchError(Exception):
    """Error raised when an opt-in remote JWKS fetch fails."""

    def __init__(
        self,
        code: RemoteJwksFetchErrorCode,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.details = details or {}


@dataclass(slots=True)
class RemoteJwksFetchOptions:
    """Options for fetching a remote JWKS document."""

    timeout_seconds: float = DEFAULT_REMOTE_JWKS_TIMEOUT_SECONDS
    headers: dict[str, str] = field(default_factory=dict)


def fetch_remote_jwks(
    url: str,
    options: RemoteJwksFetchOptions | None = None,
) -> dict[str, list[dict[str, Any]]]:
    """Fetch a JWKS document from a remote URL.

    This function uses ``urllib`` from the standard library so that no
    additional dependencies are required.  For production usage with
    advanced requirements (connection pooling, async, etc.), callers
    should use their own HTTP client and pass the parsed JWKS to
    :func:`verify_request` directly.

    Args:
        url: The JWKS endpoint URL.
        options: Optional fetch configuration.

    Returns:
        A parsed JWKS dictionary with a ``keys`` list.

    Raises:
        RemoteJwksFetchError: If the fetch fails for any reason.
    """
    opts = options or RemoteJwksFetchOptions()

    request_headers = {
        "Accept": "application/jwk-set+json, application/json",
        **opts.headers,
    }

    req = Request(url, headers=request_headers, method="GET")

    try:
        with urlopen(req, timeout=opts.timeout_seconds) as response:
            raw = response.read()
    except HTTPError as exc:
        raise RemoteJwksFetchError(
            "REMOTE_JWKS_HTTP_ERROR",
            f'Unable to fetch JWKS from "{url}" (HTTP {exc.code}).',
            {"status": exc.code, "url": url},
        ) from exc
    except TimeoutError as exc:
        raise RemoteJwksFetchError(
            "REMOTE_JWKS_TIMEOUT",
            f'Timed out fetching JWKS from "{url}" after {opts.timeout_seconds}s.',
            {"timeout_seconds": opts.timeout_seconds, "url": url},
        ) from exc
    except URLError as exc:
        raise RemoteJwksFetchError(
            "REMOTE_JWKS_NETWORK_ERROR",
            f'Unable to fetch JWKS from "{url}" due to a network error.',
            {"cause": str(exc.reason), "url": url},
        ) from exc

    try:
        payload = json.loads(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        raise RemoteJwksFetchError(
            "REMOTE_JWKS_INVALID",
            f'The JWKS response from "{url}" was not valid JSON.',
            {"cause": str(exc), "url": url},
        ) from exc

    if not isinstance(payload, dict) or "keys" not in payload:
        raise RemoteJwksFetchError(
            "REMOTE_JWKS_INVALID",
            f'The response from "{url}" was not a valid JWKS document.',
            {"url": url},
        )

    keys = payload["keys"]

    if not isinstance(keys, list):
        raise RemoteJwksFetchError(
            "REMOTE_JWKS_INVALID",
            f'The "keys" field in the JWKS from "{url}" is not an array.',
            {"url": url},
        )

    return {"keys": keys}
