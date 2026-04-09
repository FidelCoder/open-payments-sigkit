from __future__ import annotations

from open_payments_http_signatures_devkit import sign_request, verify_request

from _shared import dump_output, read_fixture


def main() -> None:
    request = read_fixture("requests/grant-request.json")
    private_key = read_fixture("keys/ed25519-private.jwk.json")
    jwks = read_fixture("keys/jwks.json")
    signed = sign_request(
        request,
        {
            "created": 1735689600,
            "key_id": "fixture-primary-key",
            "preset": "grant-request",
            "private_key_jwk": private_key,
        },
    )
    result = verify_request(signed.request, {"jwks": jwks, "preset": "grant-request"})
    print(dump_output(result))


if __name__ == "__main__":
    main()
