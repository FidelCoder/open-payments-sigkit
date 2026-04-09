from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, TypeAlias

JsonWebKey: TypeAlias = dict[str, Any]
JwksShape: TypeAlias = dict[str, list[JsonWebKey]]
PresetName: TypeAlias = Literal["grant-request", "protected-request", "resource-write"]
VerificationCode: TypeAlias = Literal[
    "OK",
    "MISSING_CONTENT_DIGEST",
    "INVALID_CONTENT_DIGEST",
    "MISSING_SIGNATURE",
    "MISSING_SIGNATURE_INPUT",
    "INVALID_SIGNATURE_INPUT",
    "UNSUPPORTED_ALGORITHM",
    "KEY_NOT_FOUND",
    "SIGNATURE_MISMATCH",
    "MISSING_REQUIRED_COMPONENT",
    "REQUEST_COMPONENT_MISMATCH",
]


@dataclass(slots=True)
class HttpRequest:
    method: str
    url: str
    headers: dict[str, str] | None = None
    body: str | None = None


@dataclass(slots=True)
class SignatureInputParameters:
    created: int | None = None
    expires: int | None = None
    keyid: str | None = None
    alg: str | None = None
    nonce: str | None = None
    tag: str | None = None


@dataclass(slots=True)
class ParsedSignatureInput:
    label: str
    components: list[str]
    params: SignatureInputParameters
    raw: str


ParsedSignatureInputs: TypeAlias = dict[str, ParsedSignatureInput]


@dataclass(slots=True)
class ParsedSignature:
    label: str
    value: str
    raw: str


ParsedSignatures: TypeAlias = dict[str, ParsedSignature]


@dataclass(slots=True)
class CanonicalComponent:
    id: str
    value: str
    line: str


@dataclass(slots=True)
class SignedRequestResult:
    request: HttpRequest
    content_digest: str | None
    signature_input: str
    signature: str
    covered_components: list[str]
    signature_base: str


@dataclass(slots=True)
class VerificationResult:
    ok: bool
    code: VerificationCode
    message: str
    details: dict[str, Any] | None = None
    signature_base: str | None = None
    covered_components: list[str] | None = None


@dataclass(slots=True)
class InspectionResult:
    signature_input_header: str | None = None
    signature_header: str | None = None
    parsed_signature_inputs: ParsedSignatureInputs = field(default_factory=dict)
    parsed_signatures: ParsedSignatures = field(default_factory=dict)
    selected_label: str | None = None
    covered_components: list[str] = field(default_factory=list)
    canonical_components: list[CanonicalComponent] = field(default_factory=list)
    signature_base: str | None = None


@dataclass(slots=True, frozen=True)
class DefaultTimestampPolicy:
    add_created: bool
    ttl_seconds: int


@dataclass(slots=True, frozen=True)
class PresetDefinition:
    name: PresetName
    description: str
    base_components: list[str]
    require_authorization: bool
    include_digest_when_body: bool
    require_digest_for_body: bool
    default_timestamps: DefaultTimestampPolicy | None = None


@dataclass(slots=True)
class SignRequestOptions:
    key_id: str
    private_key_jwk: JsonWebKey
    preset: PresetName | None = None
    components: list[str] | None = None
    created: int | None = None
    expires: int | None = None
    nonce: str | None = None
    tag: str | None = None


@dataclass(slots=True)
class VerifyRequestOptions:
    public_key_jwk: JsonWebKey | None = None
    jwks: JwksShape | None = None
    require_digest_for_body: bool | None = None
    required_components: list[str] | None = None
    preset: PresetName | None = None
