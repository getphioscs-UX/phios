from pypdf import PdfReader
import hashlib
from pathlib import Path
r=Path('C:/phios/tools/review/ziwei-r1-3-final-delivery')
def images(p):
 seen=set();out=set()
 for page in PdfReader(p).pages:
  for x in page['/Resources'].get('/XObject',{}).values():
   o=x.get_object()
   if o.get('/Subtype')=='/Image':out.add(hashlib.sha256(o._data).hexdigest())
 return out
a=images('C:/phios/tools/review/r12-acceptance-ziwei-next/SYNTHETIC-ZWR-ACCEPTED-REFERENCE-NAV-Q87-COMPACT.pdf');b=images(r/'SYNTHETIC-ZWR-R13-FINAL-Q87-CANDIDATE.pdf');print(len(a),len(b),'missing originals',len(a-b),flush=True)
