class UnsupportedAlgorithmError(ValueError):
    """Raised when a JWK or signature algorithm is not supported."""


class StructuredFieldParseError(ValueError):
    """Raised when a Signature or Signature-Input field cannot be parsed."""


class RequestComponentResolutionError(ValueError):
    """Raised when a covered component cannot be resolved from a request."""

    def __init__(self, component_id: str, message: str) -> None:
        super().__init__(message)
        self.component_id = component_id
