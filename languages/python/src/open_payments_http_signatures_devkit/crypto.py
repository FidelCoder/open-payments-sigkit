from __future__ import annotations

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from ._constants import ED25519_CURVE, SUPPORTED_JWK_ALGORITHMS, SUPPORTED_SIGNATURE_ALGORITHM_TOKENS
from .errors import UnsupportedAlgorithmError
from .types import JsonWebKey
from .utils import decode_base64, decode_base64url, encode_base64


def _assert_common_jwk_shape(jwk: JsonWebKey) -> None:
    if jwk.get("kty") != "OKP" or jwk.get("crv") != ED25519_CURVE or not isinstance(
        jwk.get("x"), str
    ):
        raise UnsupportedAlgorithmError(
            "Only Ed25519 OKP JSON Web Keys are supported by this toolkit."
        )

    if isinstance(jwk.get("alg"), str) and jwk["alg"] not in SUPPORTED_JWK_ALGORITHMS:
        raise UnsupportedAlgorithmError(
            f'Unsupported JWK algorithm "{jwk["alg"]}". Expected EdDSA or Ed25519.'
        )


def _public_key_bytes(jwk: JsonWebKey) -> bytes:
    _assert_common_jwk_shape(jwk)
    public_bytes = decode_base64url(str(jwk["x"]))

    if len(public_bytes) != 32:
        raise UnsupportedAlgorithmError(
            'The public Ed25519 JWK "x" parameter must decode to 32 bytes.'
        )

    return public_bytes


def assert_supported_public_jwk(jwk: JsonWebKey) -> None:
    _public_key_bytes(jwk)


def assert_supported_private_jwk(jwk: JsonWebKey) -> None:
    _assert_common_jwk_shape(jwk)

    if not isinstance(jwk.get("d"), str):
        raise UnsupportedAlgorithmError('The private Ed25519 JWK is missing its "d" parameter.')

    private_bytes = decode_base64url(str(jwk["d"]))

    if len(private_bytes) != 32:
        raise UnsupportedAlgorithmError(
            'The private Ed25519 JWK "d" parameter must decode to 32 bytes.'
        )

    derived_public_bytes = (
        Ed25519PrivateKey.from_private_bytes(private_bytes)
        .public_key()
        .public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
    )

    if derived_public_bytes != _public_key_bytes(jwk):
        raise UnsupportedAlgorithmError(
            'The private Ed25519 JWK did not match its public "x" parameter.'
        )


def is_supported_signature_algorithm(value: str | None = None) -> bool:
    return value is None or value.lower() in SUPPORTED_SIGNATURE_ALGORITHM_TOKENS


def sign_ed25519(signature_base: str, private_key_jwk: JsonWebKey) -> str:
    assert_supported_private_jwk(private_key_jwk)
    private_bytes = decode_base64url(str(private_key_jwk["d"]))
    key = Ed25519PrivateKey.from_private_bytes(private_bytes)
    signature_bytes = key.sign(signature_base.encode("utf-8"))
    return encode_base64(signature_bytes)


def verify_ed25519(signature_base: str, signature: str, public_key_jwk: JsonWebKey) -> bool:
    assert_supported_public_jwk(public_key_jwk)
    public_bytes = _public_key_bytes(public_key_jwk)
    key = Ed25519PublicKey.from_public_bytes(public_bytes)

    try:
        key.verify(decode_base64(signature), signature_base.encode("utf-8"))
    except InvalidSignature:
        return False

    return True
