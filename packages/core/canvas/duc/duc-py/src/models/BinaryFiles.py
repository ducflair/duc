from typing import Dict, Optional
from dataclasses import dataclass

@dataclass
class BinaryFileData:
    mime_type: str
    id: str
    data: bytes
    created: int  # Epoch timestamp in milliseconds
    last_retrieved: Optional[int] = None  # Epoch timestamp in milliseconds

BinaryFiles = Dict[str, BinaryFileData]