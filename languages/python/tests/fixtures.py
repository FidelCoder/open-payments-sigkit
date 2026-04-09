from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURES_ROOT = REPO_ROOT / "packages" / "fixtures"


def read_json(relative_path: str) -> Any:
    return json.loads((FIXTURES_ROOT / relative_path).read_text())


PRIVATE_KEY = read_json("keys/ed25519-private.jwk.json")
PUBLIC_KEY = read_json("keys/ed25519-public.jwk.json")
JWKS = read_json("keys/jwks.json")
GRANT_REQUEST = read_json("requests/grant-request.json")
SIGNED_GRANT_VECTOR = read_json("vectors/signed/grant-request.json")
