"""Read-only R25/R27 reference audit; never creates a new report PDF."""
import sys, json, io, hashlib, subprocess
from pathlib import Path
sys.path.insert(0, str(Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space, reserve_render_slot
from pypdf import PdfReader
from PIL import Image, ImageDraw
require_disk_space('R27 supplied reference comparison', 60000000)
release = reserve_render_slot('R27 supplied PDF read-only comparison')
try:
 root=Path('tools/review/numerology-r27')
 old=Path('C:/Users/Guest Account/Desktop/PHIOS_NUMEROLOGY_R25_33P_BILINGUAL_PREMIUM_REVIEW.pdf')
 new=Path('.tmp/numerology-r27/handoff/PHIOS_NUMEROLOGY_R27_33P_SCHOOL_TRANSPARENT_REVIEW.pdf')
 native=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
 fixed=[1,2,3,4,5,6,9,11,16,19,22,25,28,31]
 readers=[PdfReader(old),PdfReader(new)]
 assert all(len(r.pages)==33 for r in readers)
 sizes=all(abs(float(p.mediabox.width)-595.2756)<.2 and abs(float(p.mediabox.height)-841.8898)<.2 for r in readers for p in r.pages)
 checks=[];contact=Image.new('RGB',(1400,400),'#eee9de');draw=ImageDraw.Draw(contact)
 for index,page in enumerate(fixed):
  images=[]
  for path in [old,new]:
   result=subprocess.run([str(native),'-f',str(page),'-l',str(page),'-singlefile','-scale-to','600','-png',str(path)],capture_output=True,check=True)
   images.append(Image.open(io.BytesIO(result.stdout)).convert('RGB'))
  same=images[0].size==images[1].size and images[0].tobytes()==images[1].tobytes()
  checks.append({'physicalPage':page,'pixelEqualAt600px':same})
  image=images[1];image.thumbnail((94,170));contact.paste(image,((index%14)*100,25));draw.text(((index%14)*100+2,5),str(page),fill='#193442')
 contact.crop((0,0,1400,200)).save(root/'FIXED-REFERENCE-CONTACT.jpg',quality=90)
 a4=[{'path':str(path),'pages':len(reader.pages),'a4WithinPointTolerance':all(abs(float(pg.mediabox.width)-595.2756)<.2 and abs(float(pg.mediabox.height)-841.8898)<.2 for pg in reader.pages)} for path,reader in zip([old,new],readers)]
 report={'scope':'Supplied R25 vs supplied R27 only; no runtime PDF output verified','files':[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in [old,new]],'all33A4':sizes,'a4ByFile':a4,'note':'R25 body width rounds to 594.95999 pt (~0.11mm narrower); supplied R27 all 33 pages pass 0.2pt A4 tolerance.','fixedReferencePages':checks,'all14FixedPixelEqualAt600px':all(c['pixelEqualAt600px']for c in checks),'runtimePrintQa':'NOT_EXECUTED'}
 (root/'REFERENCE-PDF-AUDIT.json').write_text(json.dumps(report,indent=2),encoding='utf8')
 print(json.dumps({'all33A4':sizes,'fixedEqual':sum(c['pixelEqualAt600px']for c in checks)}))
finally:
 release()
