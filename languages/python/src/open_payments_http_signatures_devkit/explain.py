"""Human-readable explanations for verification results.

Provides the same remediation guidance as the TypeScript
``explainVerificationResult`` helper, ensuring consistent
developer experience across both language implementations.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .types import VerificationResult


@dataclass(slots=True, frozen=True)
class VerificationExplanation:
    """Human-readable explanation for a verification result."""

    title: str
    summary: str
    next_steps: list[str] = field(default_factory=list)


_EXPLANATIONS: dict[str, VerificationExplanation] = {
    "OK": VerificationExplanation(
        title="Verification succeeded",
        summary=(
            "The request digest, covered components, and Ed25519 signature "
            "all verified successfully."
        ),
        next_steps=[
            "Inspect the signature base if you need to compare canonicalization "
            "across implementations."
        ],
    ),
    "MISSING_CONTENT_DIGEST": VerificationExplanation(
        title="Missing Content-Digest",
        summary=(
            "The request has a body, but it does not include a Content-Digest "
            "header that the verifier can validate."
        ),
        next_steps=[
            "Add a Content-Digest header for requests with bodies.",
            "Make sure the covered components include content-digest "
            "when using Open Payments presets.",
        ],
    ),
    "INVALID_CONTENT_DIGEST": VerificationExplanation(
        title="Content-Digest mismatch",
        summary=(
            "The Content-Digest header does not match the supplied body, "
            "so the body was modified or the digest was computed incorrectly."
        ),
        next_steps=[
            "Recalculate Content-Digest from the exact request body bytes.",
            "Confirm the body was not reformatted or re-encoded after signing.",
        ],
    ),
    "MISSING_SIGNATURE": VerificationExplanation(
        title="Missing Signature header",
        summary="The request did not include a usable Signature header.",
        next_steps=[
            "Add the Signature header to the request.",
            "Ensure the Signature header label matches the Signature-Input label.",
        ],
    ),
    "MISSING_SIGNATURE_INPUT": VerificationExplanation(
        title="Missing Signature-Input header",
        summary=(
            "The request did not include a Signature-Input header for the "
            "verifier to reconstruct."
        ),
        next_steps=[
            "Add the Signature-Input header alongside the Signature header.",
            "Ensure the request preserves both signature headers end-to-end.",
        ],
    ),
    "INVALID_SIGNATURE_INPUT": VerificationExplanation(
        title="Invalid Signature-Input",
        summary=(
            "The Signature-Input header could not be parsed or contained "
            "invalid parameter semantics."
        ),
        next_steps=[
            "Check the Signature-Input structured field syntax.",
            "Ensure component identifiers and parameters are serialized "
            "exactly once and with valid types.",
        ],
    ),
    "UNSUPPORTED_ALGORITHM": VerificationExplanation(
        title="Unsupported signing algorithm",
        summary=(
            "The request references an algorithm that this toolkit does not "
            "support for Open Payments signatures."
        ),
        next_steps=[
            "Use an Ed25519 OKP JWK with alg=EdDSA when declaring an algorithm.",
            "Remove unsupported alg parameters from Signature-Input.",
        ],
    ),
    "KEY_NOT_FOUND": VerificationExplanation(
        title="Verification key not found",
        summary=(
            "The verifier could not locate a public key for the signature "
            "key ID, so cryptographic verification could not proceed."
        ),
        next_steps=[
            "Confirm the key ID in Signature-Input matches a key "
            "in the provided JWK or JWKS.",
            "Verify the correct key registry was supplied to the verifier.",
        ],
    ),
    "MISSING_REQUIRED_COMPONENT": VerificationExplanation(
        title="Missing covered component",
        summary=(
            "The signature did not cover one or more components required by "
            "the selected preset or verification policy."
        ),
        next_steps=[
            "Add the missing covered component to Signature-Input.",
            "Use an Open Payments preset if you want the required component "
            "set applied automatically.",
        ],
    ),
    "SIGNATURE_MISMATCH": VerificationExplanation(
        title="Signature mismatch",
        summary=(
            "The Ed25519 signature did not validate against the reconstructed "
            "signature base."
        ),
        next_steps=[
            "Compare the reconstructed signature base against the signer\u2019s "
            "canonical view.",
            "Confirm the matching Ed25519 key was used and the request "
            "was not modified after signing.",
        ],
    ),
    "REQUEST_COMPONENT_MISMATCH": VerificationExplanation(
        title="Covered request component mismatch",
        summary=(
            "The verifier could not reconstruct one of the covered request "
            "components from the supplied HTTP request."
        ),
        next_steps=[
            "Check the request method, target URI, and covered headers "
            "against the signed values.",
            "Ensure intermediaries did not remove or rewrite covered headers.",
        ],
    ),
}


def explain_verification_result(result: VerificationResult) -> VerificationExplanation:
    """Convert a verification result into stable remediation guidance.

    Args:
        result: A :class:`VerificationResult` returned by :func:`verify_request`.

    Returns:
        A :class:`VerificationExplanation` with a human-readable title,
        summary, and next steps.

    Raises:
        KeyError: If the result code is not recognized.
    """
    return _EXPLANATIONS[result.code]
