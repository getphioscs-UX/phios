import pypdfium2 as p
from pathlib import Path
r=Path('C:/phios/tools/review/ziwei-r1-3-final-delivery');d=p.PdfDocument(r/'LOCAL-WORKER-PDF.pdf');page=d[0];b=page.render(scale=1.4);b.to_pil().save(r/'ACCOUNT-COVER.png');b.close();page.close();d.close()
