"""Re-encode embedded raster images, retaining PDF text, geometry and annotations."""
import sys
from pathlib import Path
from pypdf import PdfReader, PdfWriter

for arg in sys.argv[1:]:
    path = Path(arg)
    if path.stat().st_size <= 25 * 1024 * 1024:
        print(f'{path}: already within Pages limit; unchanged')
        continue
    original = PdfReader(path)
    texts = [p.extract_text() for p in original.pages]
    writer = PdfWriter(clone_from=original)
    seen = set()
    for page in writer.pages:
        for image in page.images:
            ref = image.indirect_reference
            if ref.idnum in seen:
                continue
            seen.add(ref.idnum)
            if len(image.data) > 100_000 and image.image.mode == 'RGB':
                image.replace(image.image, quality=90, optimize=True)
    writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)
    target = path.with_suffix('.optimized.pdf')
    writer.write(target)
    result = PdfReader(target)
    assert [p.extract_text() for p in result.pages] == texts
    assert len(result.pages) == len(original.pages)
    assert target.stat().st_size < 25 * 1024 * 1024
    size_before = path.stat().st_size
    target.replace(path)
    print(f'{path}: {size_before} -> {path.stat().st_size} bytes; {len(result.pages)} pages, text unchanged')
