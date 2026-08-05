"""Internal helpers for reading model-linked external files from DUC data."""

from __future__ import annotations

import logging
from pathlib import Path

from ..parse import list_external_files, stream_external_file_revision_to_path

logger = logging.getLogger(__name__)


def stream_active_external_file_to_path(
    duc_source: str | Path,
    file_id: str,
    output_path: str | Path,
) -> int:
    """Stream a model-linked file's active revision to a caller-owned path."""

    try:
        file_meta = next(
            (item for item in list_external_files(duc_source) if item.id == str(file_id)),
            None,
        )
        revision_id = file_meta.active_revision_id if file_meta else None
        if not revision_id:
            return 0
        return stream_external_file_revision_to_path(
            duc_source,
            revision_id,
            output_path,
        )
    except Exception as exc:
        logger.debug("Failed to stream external file %s: %s", file_id, exc)
        return 0
