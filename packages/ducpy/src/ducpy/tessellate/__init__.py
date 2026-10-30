"""CAD and BIM model tessellation subpackage for ducpy."""

from ducpy.tessellate.runner import (
    tessellate_duc_element,
    tessellate_external_file,
    tessellate_model_code,
)
from ducpy.tessellate.shims import (
    scopture_collect_ifc_preview,
    scopture_collect_model_file,
    scopture_flatten_candidates,
    scopture_tessellate_to_buffer_json,
)

__all__ = [
    "tessellate_duc_element",
    "tessellate_external_file",
    "tessellate_model_code",
    "scopture_collect_ifc_preview",
    "scopture_collect_model_file",
    "scopture_flatten_candidates",
    "scopture_tessellate_to_buffer_json",
]
