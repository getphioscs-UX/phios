from pypdf import PdfReader
from collections import Counter
r='C:/phios/tools/review/ziwei-r1-3-final-delivery/'
a=PdfReader('C:/phios/tools/review/r12-acceptance-ziwei-next/SYNTHETIC-ZWR-ACCEPTED-REFERENCE-NAV-Q87-COMPACT.pdf');b=PdfReader(r+'SYNTHETIC-ZWR-R13-FINAL-Q87-CANDIDATE.pdf')
for n in [47,52,58]:
 x=Counter(''.join(a.pages[n-1].extract_text().split()));y=Counter(''.join(b.pages[n-1].extract_text().split()));print(n,'missing',x-y,'extra',y-x)
