"""Python shim for the compiled :mod:`ducpy_native` extension.

When built with maturin (``module-name = \"ducpy_native\"`` and
``python-source = \"src\"``), the compiled extension is emitted as the
submodule ``ducpy_native.ducpy_native``. Re-export the extension symbols at the
package root so existing imports like ``import ducpy_native`` continue to work.
"""

from .ducpy_native import (get_external_file,  # type: ignore[attr-defined]
                           list_external_files, parse_duc, parse_duc_lazy,
                           serialize_duc)

__all__ = [
	"parse_duc",
	"parse_duc_lazy",
	"serialize_duc",
	"get_external_file",
	"list_external_files",
]
