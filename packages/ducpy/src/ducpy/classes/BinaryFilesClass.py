from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class BinaryFiles:
    """
    Represents a collection of binary files with their associated metadata.
    """
    id: str
    mimeType: str
    created: int  # epoch ms
    dataURL: Optional[str] = None
    encoding: Optional[str] = None
    lastRetrieved: Optional[int] = None  # epoch ms
    pending: bool = False
    status: str = "pending"  # "pending" | "saved" | "error"
    objectUrl: Optional[str] = None
    hasSyncedToServer: bool = False
    savedToFileSystem: bool = False