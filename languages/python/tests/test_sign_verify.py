from __future__ import annotations

import copy
import unittest

from open_payments_http_signatures_devkit import inspect_request_signature, sign_request, verify_request

from fixtures import GRANT_REQUEST, JWKS, PRIVATE_KEY, SIGNED_GRANT_VECTOR


class SignVerifyTests(unittest.TestCase):
    def test_sign_request_matches_stored_vector(self) -> None:
        result = sign_request(
            GRANT_REQUEST,
            {
                "created": 1735689600,
                "key_id": "fixture-primary-key",
                "preset": "grant-request",
                "private_key_jwk": PRIVATE_KEY,
            },
        )

        self.assertEqual(result.content_digest, SIGNED_GRANT_VECTOR["contentDigest"])
        self.assertEqual(result.signature_input, SIGNED_GRANT_VECTOR["signatureInput"])
        self.assertEqual(result.signature, SIGNED_GRANT_VECTOR["signature"])
        self.assertEqual(result.signature_base, SIGNED_GRANT_VECTOR["signatureBase"])
        self.assertEqual(result.covered_components, SIGNED_GRANT_VECTOR["coveredComponents"])
        self.assertEqual(result.request.headers, SIGNED_GRANT_VECTOR["request"]["headers"])

    def test_verify_request_returns_ok_for_signed_vector(self) -> None:
        result = verify_request(
            SIGNED_GRANT_VECTOR["request"],
            {"jwks": JWKS, "preset": "grant-request"},
        )

        self.assertTrue(result.ok)
        self.assertEqual(result.code, "OK")
        self.assertEqual(result.signature_base, SIGNED_GRANT_VECTOR["signatureBase"])
        self.assertEqual(result.covered_components, SIGNED_GRANT_VECTOR["coveredComponents"])

    def test_verify_request_detects_tampered_body(self) -> None:
        tampered = copy.deepcopy(SIGNED_GRANT_VECTOR["request"])
        tampered["body"] = '{"tampered":true}'

        result = verify_request(tampered, {"jwks": JWKS, "preset": "grant-request"})

        self.assertFalse(result.ok)
        self.assertEqual(result.code, "INVALID_CONTENT_DIGEST")

    def test_verify_request_detects_wrong_key_material(self) -> None:
        wrong_public_key = copy.deepcopy(JWKS["keys"][1])
        wrong_public_key["kid"] = "fixture-primary-key"

        result = verify_request(
            SIGNED_GRANT_VECTOR["request"],
            {"public_key_jwk": wrong_public_key, "preset": "grant-request"},
        )

        self.assertFalse(result.ok)
        self.assertEqual(result.code, "SIGNATURE_MISMATCH")

    def test_inspect_request_signature_reconstructs_signature_base(self) -> None:
        inspection = inspect_request_signature(SIGNED_GRANT_VECTOR["request"])

        self.assertEqual(inspection.selected_label, "sig")
        self.assertEqual(inspection.covered_components, SIGNED_GRANT_VECTOR["coveredComponents"])
        self.assertEqual(inspection.signature_base, SIGNED_GRANT_VECTOR["signatureBase"])
        self.assertEqual(len(inspection.canonical_components), 3)


if __name__ == "__main__":
    unittest.main()
