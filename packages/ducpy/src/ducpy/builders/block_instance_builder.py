from typing import List, Optional

from ducpy.classes.ElementsClass import (DucBlockDuplicationArray,
                                         DucBlockInstance, StringValueEntry)
from ducpy.utils.rand_utils import random_versioning


class BlockInstanceBuilder:
    def __init__(self, id: str, block_id: str, version: int):
        self._id = id
        self._block_id = block_id
        self._version = version
        self._element_overrides: List[StringValueEntry] = []
        self._duplication_array: Optional[DucBlockDuplicationArray] = None

    def with_element_override(self, key: str, value: str) -> 'BlockInstanceBuilder':
        self._element_overrides.append(StringValueEntry(key=key, value=value))
        return self

    def with_duplication_array(self, rows: int, cols: int, row_spacing: float, col_spacing: float) -> 'BlockInstanceBuilder':
        self._duplication_array = DucBlockDuplicationArray(
            rows=rows,
            cols=cols,
            row_spacing=row_spacing,
            col_spacing=col_spacing
        )
        return self

    def build(self) -> DucBlockInstance:
        return DucBlockInstance(
            id=self._id,
            block_id=self._block_id,
            version=self._version,
            element_overrides=self._element_overrides if self._element_overrides else None,
            duplication_array=self._duplication_array
        )
