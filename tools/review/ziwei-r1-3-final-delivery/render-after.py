import pypdfium2 as p
from pathlib import Path
r=Path('C:/phios/tools/review/ziwei-r1-3-final-delivery');d=p.PdfDocument(r/'SYNTHETIC-ZWR-R13-FINAL-Q87-CANDIDATE.pdf')
for n in [47,52,58]:
 page=d[n-1];b=page.render(scale=1.4);b.to_pil().save(r/f'after-{n}.png');b.close();page.close()
d.close()
