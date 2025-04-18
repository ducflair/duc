import flatbuffers
from flatbuffers import Builder
from ..Duc.ExportedDataState import ExportedDataState
from .parse_duc_element import parse_duc_element
from .parse_app_state import parse_app_state
from .parse_binary_files import parse_binary_files
from ..classes.AppStateClass import AppState
from ..classes.DucElementClass import DucElementUnion
from ..classes.BinaryFilesClass import BinaryFiles
from typing import IO, Dict

def parse_duc_flatbuffers(blob: IO[bytes]) -> Dict:
    buffer = blob.read()
    builder = Builder(0)
    builder.Bytes = buffer
    buf = builder.Bytes
    data = ExportedDataState.GetRootAsExportedDataState(buf, 0)

    elements: list[DucElementUnion] = [parse_duc_element(data.Elements(i)) for i in range(data.ElementsLength())]
    app_state: AppState = parse_app_state(data.AppState())
    files: BinaryFiles = parse_binary_files(data.Files())
    
    
    

    return {
        'elements': elements,
        'appState': app_state,
        'files': files,
        'type': data.Type().decode('utf-8') if data.Type() else None,
        'version': data.Version(),
        'source': data.Source().decode('utf-8') if data.Source() else None,
    }
