"""Convert various document formats to Markdown using MarkItDown."""
from __future__ import annotations

import io
import tempfile
from pathlib import Path
from typing import BinaryIO, Optional, Union

try:
    from markitdown import MarkItDown
except ImportError:
    MarkItDown = None  # type: ignore


def convert_to_markdown(
    source: Union[str, Path, BinaryIO, bytes],
    filename: Optional[str] = None,
) -> str:
    """
    Convert a document (file path, file-like, or bytes) to Markdown.

    Supports PDF, DOCX, PPTX, XLSX, HTML, images (OCR via MarkItDown), etc.
    """
    if MarkItDown is None:
        raise RuntimeError("markitdown is not installed. Run: pip install markitdown")

    md = MarkItDown()
    if isinstance(source, (str, Path)):
        result = md.convert(str(source))
    elif isinstance(source, bytes):
        with tempfile.NamedTemporaryFile(suffix=Path(filename or "doc.bin").suffix, delete=False) as tmp:
            tmp.write(source)
            tmp_path = tmp.name
        try:
            result = md.convert(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)
    else:
        # file-like
        data = source.read()
        return convert_to_markdown(data, filename=filename)

    return result.text_content or ""
