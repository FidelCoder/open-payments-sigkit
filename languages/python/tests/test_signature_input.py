from __future__ import annotations

import unittest

from open_payments_http_signatures_devkit import (
    HttpRequest,
    SignatureInputParameters,
    build_signature_base,
    parse_signature_input,
    serialize_signature_input,
)

from fixtures import SIGNED_GRANT_VECTOR


class SignatureInputTests(unittest.TestCase):
    def test_serialize_signature_input_matches_vector(self) -> None:
        serialized = serialize_signature_input(
            "sig",
            ["@method", "@target-uri", "content-digest"],
            SignatureInputParameters(created=1735689600, keyid="fixture-primary-key"),
        )

        self.assertEqual(serialized, SIGNED_GRANT_VECTOR["signatureInput"])

    def test_parse_signature_input_reads_components_and_params(self) -> None:
        parsed = parse_signature_input(SIGNED_GRANT_VECTOR["signatureInput"])
        member = parsed["sig"]

        self.assertEqual(member.components, ["@method", "@target-uri", "content-digest"])
        self.assertEqual(member.params.created, 1735689600)
        self.assertEqual(member.params.keyid, "fixture-primary-key")

    def test_build_signature_base_matches_vector(self) -> None:
        request = HttpRequest(**SIGNED_GRANT_VECTOR["request"])
        parsed = parse_signature_input(SIGNED_GRANT_VECTOR["signatureInput"])

        self.assertEqual(
            build_signature_base(request, parsed["sig"]),
            SIGNED_GRANT_VECTOR["signatureBase"],
        )


if __name__ == "__main__":
    unittest.main()
