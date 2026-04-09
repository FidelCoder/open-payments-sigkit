from .errors import RequestComponentResolutionError
from .types import HttpRequest
from .utils import normalize_header_name


def resolve_component_value(request: HttpRequest, component_id: str) -> str:
    if component_id == "@method":
        return request.method

    if component_id == "@target-uri":
        return request.url

    header_name = normalize_header_name(component_id)
    value = (request.headers or {}).get(header_name)

    if value is None:
        raise RequestComponentResolutionError(
            component_id,
            f'The request did not include the covered component "{component_id}".',
        )

    return value
