from __future__ import annotations

import unittest

from open_payments_http_signatures_devkit import create_content_digest, verify_content_digest

from fixtures import SIGNED_GRANT_VECTOR


class ContentDigestTests(unittest.TestCase):
    def test_create_content_digest_matches_fixture_vector(self) -> None:
        body = SIGNED_GRANT_VECTOR["request"]["body"]
        expected = SIGNED_GRANT_VECTOR["contentDigest"]

        self.assertEqual(create_content_digest(body), expected)

    def test_verify_content_digest_rejects_tampered_body(self) -> None:
        header_value = SIGNED_GRANT_VECTOR["contentDigest"]

        self.assertTrue(
            verify_content_digest(SIGNED_GRANT_VECTOR["request"]["body"], header_value)
        )
        self.assertFalse(verify_content_digest('{"tampered":true}', header_value))


if __name__ == "__main__":
    unittest.main()
