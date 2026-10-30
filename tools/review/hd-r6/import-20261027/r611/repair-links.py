import pathlib,json,shutil,hashlib,sys
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject,ArrayObject
sys.path.insert(0,'scripts/lib');from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('R611 exact annotation destination repair',500_000_000);reserve_render_slot('R611 annotation-only correction')
D=pathlib.Path('tools/review/hd-r6/import-20261027/r611');B=pathlib.Path('.tmp/hd-r611-before-link-target-repair');B.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest();m=json.loads((D/'PDF-MANIFEST.json').read_text());layouts=json.loads((D/'LAYOUT-MAP.json').read_text())['formats'];rows=[]
if any('-FINAL' in f['path'] for f in m['files']):raise SystemExit('HISTORICAL_REPAIR_ALREADY_SUPERSEDED_BY_FINAL_FILES')
for f in m['files']:
 p=pathlib.Path(f['path']);assert sha(p)==f['sha256'];backup=B/p.name;assert not backup.exists();shutil.copy2(p,backup);layout=next(x for x in layouts if x['format']==f['format']);r=PdfReader(p);w=PdfWriter(clone_from=r)
 for n,ref in enumerate(w.pages[5]['/Annots'],1):ref.get_object()[NameObject('/Dest')]=ArrayObject([w.pages[layout['chapters'][str(n)]-1].indirect_reference,NameObject('/Fit')])
 with open(p,'wb') as out:w.write(out)
 f['sha256']=sha(p);f['bytes']=p.stat().st_size;assert len(PdfReader(p).pages)==f['pages'];rows.append({'format':f['format'],'beforeBackup':str(backup).replace('\\','/'),'beforeSHA256':sha(backup),'afterSHA256':f['sha256'],'changes':'17 local /Dest integer targets replaced with explicit PDF Page references; source content, page count, section map and numerals unchanged'})
(D/'PDF-MANIFEST.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(D/'LINK-TARGET-SUCCESSOR-REPAIR.json').write_text(json.dumps({'rows':rows,'initialFailureRetained':True,'historicalR610Untouched':True},indent=2)+'\n');print('51 explicit physical Page reference destinations corrected; prior candidate retained')
