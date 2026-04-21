"""Tests for verification result explanation."""

import unittest

from open_payments_http_signatures_devkit.explain import (
    VerificationExplanation,
    explain_verification_result,
)
from open_payments_http_signatures_devkit.types import VerificationResult


class TestExplainVerificationResult(unittest.TestCase):
    def test_ok_explanation(self):
        result = VerificationResult(
            ok=True, code="OK", message="Success"
        )
        explanation = explain_verification_result(result)

        self.assertIsInstance(explanation, VerificationExplanation)
        self.assertEqual(explanation.title, "Verification succeeded")
        self.assertIn("verified successfully", explanation.summary)
        self.assertTrue(len(explanation.next_steps) > 0)

    def test_missing_signature_explanation(self):
        result = VerificationResult(
            ok=False, code="MISSING_SIGNATURE", message="Missing"
        )
        explanation = explain_verification_result(result)

        self.assertEqual(explanation.title, "Missing Signature header")
        self.assertIn("Signature header", explanation.next_steps[0])

    def test_signature_mismatch_explanation(self):
        result = VerificationResult(
            ok=False, code="SIGNATURE_MISMATCH", message="Mismatch"
        )
        explanation = explain_verification_result(result)

        self.assertEqual(explanation.title, "Signature mismatch")
        self.assertIn("Ed25519", explanation.summary)

    def test_key_not_found_explanation(self):
        result = VerificationResult(
            ok=False, code="KEY_NOT_FOUND", message="Not found"
        )
        explanation = explain_verification_result(result)

        self.assertEqual(explanation.title, "Verification key not found")

    def test_all_codes_have_explanations(self):
        codes = [
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

        for code in codes:
            result = VerificationResult(
                ok=code == "OK", code=code, message=f"Test {code}"
            )
            explanation = explain_verification_result(result)
            self.assertIsInstance(explanation, VerificationExplanation)
            self.assertTrue(len(explanation.title) > 0, f"Missing title for {code}")
            self.assertTrue(len(explanation.summary) > 0, f"Missing summary for {code}")
            self.assertTrue(
                len(explanation.next_steps) > 0, f"Missing next_steps for {code}"
            )

    def test_explanation_is_frozen(self):
        result = VerificationResult(
            ok=True, code="OK", message="Success"
        )
        explanation = explain_verification_result(result)

        with self.assertRaises(AttributeError):
            explanation.title = "Hacked"  # type: ignore[misc]


if __name__ == "__main__":
    unittest.main()
