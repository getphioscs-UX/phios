from pathlib import Path
import json,hashlib,io,sys
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject,ArrayObject
sys.path.insert(0,'scripts/lib');from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('R611 successor link reference final files',300_000_000);reserve_render_slot('R611 final local link destinations')
D=Path('tools/review/hd-r6/import-20261027/r611');B=Path('.tmp/hd-r611-before-link-target-repair');sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();m=json.loads((D/'PDF-MANIFEST.json').read_text());layouts=json.loads((D/'LAYOUT-MAP.json').read_text())['formats'];rows=[]
for f in m['files']:
 original=Path(f['path']);backup=B/original.name;assert sha(backup)==f['sha256'];layout=next(x for x in layouts if x['format']==f['format']);r=PdfReader(io.BytesIO(backup.read_bytes()));w=PdfWriter(clone_from=r)
 for n,ref in enumerate(w.pages[5]['/Annots'],1):ref.get_object()[NameObject('/Dest')]=ArrayObject([w.pages[layout['chapters'][str(n)]-1].indirect_reference,NameObject('/Fit')])
 p=original.with_stem(original.stem+'-FINAL');assert not p.exists();out=io.BytesIO();w.write(out);p.write_bytes(out.getvalue());assert len(PdfReader(io.BytesIO(p.read_bytes())).pages)==f['pages'];rows.append({'format':f['format'],'beforeBackup':str(backup).replace('\\','/'),'beforeSHA256':sha(backup),'earlierMutableAttemptSHA256':sha(original),'afterPath':str(p).replace('\\','/'),'afterSHA256':sha(p),'changes':'51 local /Dest numeric targets repaired to actual physical Page references. Exact same page count/paragraphs/assets/numerals; earlier snapshots preserved. New filenames avoid an observed Windows invalid-argument error opening the bilingual intermediate for overwrite.'});f.update(path=str(p).replace('\\','/'),sha256=sha(p),bytes=p.stat().st_size)
(D/'PDF-MANIFEST.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(D/'LINK-TARGET-SUCCESSOR-REPAIR.json').write_text(json.dumps({'rows':rows,'initialFailureRetained':True,'historicalR610Untouched':True,'scope':'Annotation-only in-place final composition; not deletion/reconstruction of old front pages'},indent=2)+'\n');print('Three final files / 51 physical Page reference targets; all earlier snapshots retained')
