from __future__ import annotations

import json
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURES_ROOT = REPO_ROOT / "packages" / "fixtures"


def read_fixture(relative_path: str) -> Any:
    return json.loads((FIXTURES_ROOT / relative_path).read_text())


def dump_output(payload: Any) -> str:
    if is_dataclass(payload):
        return json.dumps(asdict(payload), indent=2)

    return json.dumps(payload, indent=2)
