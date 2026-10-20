import json,subprocess
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
from pypdf import PdfReader
root=Path('tools/review/financial-publication-r3-1'); temp=Path('tmp/pdfs/financial-r3-1');temp.mkdir(parents=True,exist_ok=True)
pop=Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
for lang in ['en','zh-Hans']:
 pdf=Path('output/pdf/financial-r3-1')/('representative-complete-'+lang+'.pdf');r=PdfReader(pdf);assert len(r.pages)==5
 for i,n in enumerate([2,4,8,13,14]):
  subprocess.run([str(pop),'-f',str(i+1),'-l',str(i+1),'-scale-to','1123','-singlefile','-png',str(pdf),str(root/('representative-pdf-'+lang+'-p'+str(n).zfill(2)))],capture_output=True,check=True)
print('Rendered actual representative PDF pages')
