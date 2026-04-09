from __future__ import annotations

from .types import DefaultTimestampPolicy, PresetDefinition, PresetName

PRESET_DEFINITIONS: dict[PresetName, PresetDefinition] = {
    "grant-request": PresetDefinition(
        name="grant-request",
        description=(
            "Initial access bootstrap requests. Covers the method and target URI, and adds "
            "Content-Digest whenever a body is present."
        ),
        base_components=["@method", "@target-uri"],
        require_authorization=False,
        include_digest_when_body=True,
        require_digest_for_body=True,
    ),
    "protected-request": PresetDefinition(
        name="protected-request",
        description=(
            "Token-bound Open Payments requests. Covers method, target URI, authorization, and "
            "the body digest when present."
        ),
        base_components=["@method", "@target-uri", "authorization"],
        require_authorization=True,
        include_digest_when_body=True,
        require_digest_for_body=True,
    ),
    "resource-write": PresetDefinition(
        name="resource-write",
        description=(
            "Protected write operations with stricter body digest expectations and default "
            "created/expires metadata."
        ),
        base_components=["@method", "@target-uri", "authorization"],
        require_authorization=True,
        include_digest_when_body=True,
        require_digest_for_body=True,
        default_timestamps=DefaultTimestampPolicy(add_created=True, ttl_seconds=300),
    ),
}


def get_preset(name: PresetName) -> PresetDefinition:
    return PRESET_DEFINITIONS[name]
