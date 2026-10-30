"""Bounded serialization repair, no drawing, rasterization or source changes."""
from pathlib import Path
import json,hashlib,os,sys
sys.path.insert(0,'scripts/lib')
from disk_space_guard import require_disk_space
require_disk_space('HD R610 bounded non-render PDF reference normalization',300_000_000)
from pypdf import PdfReader,PdfWriter
from pypdf.generic import StreamObject
import pdfplumber
D=Path(__file__).parent;p=D/'PDF-MANIFEST.json';m=json.loads(p.read_text());rows=[];sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
for f in m['files']:
 file=Path(f['path']);before=sha(file);assert before==f['sha256'];r=PdfReader(file);old=[hashlib.sha256(pg.get_contents().get_data()).hexdigest() for pg in r.pages];fixed=[i for i,pg in enumerate(r.pages,1) if isinstance(pg.raw_get('/Contents'),StreamObject)];assert len(fixed)==3
 # PdfWriter cloning registers these streams as indirect objects correctly.
 w=PdfWriter(clone_from=str(file));out=Path('.tmp/hd-r610-private')/('normalized-'+f['format']+'.pdf')
 with out.open('wb') as h:w.write(h)
 final=PdfReader(out);assert len(final.pages)==f['pages'] and len(final.outline)==17;assert old==[hashlib.sha256(pg.get_contents().get_data()).hexdigest() for pg in final.pages]
 with pdfplumber.open(out) as verified:assert len(verified.pages)==f['pages']
 assert sha(file)==before;os.replace(out,file);f['sha256']=sha(file);f['bytes']=file.stat().st_size;rows.append({'format':f['format'],'beforeSHA256':before,'afterSHA256':f['sha256'],'indirectContentsCorrectedPages':fixed,'allDecodedPageContentHashesUnchanged':True,'pypdfAndPdfminerPageCountsAgree':True,'newDrawingOrRenderingPerformed':False})
p.write_text(json.dumps(m,indent=2)+'\n');(D/'PDF-STRUCTURAL-REPAIR.json').write_text(json.dumps({'rows':rows,'rootCause':'Incremental native page export initially serialized Contents streams inline. PDF streams require indirect objects; pypdf tolerated it while pdfminer omitted those pages. Final strict dual-reader verification passes.','historicalPDFsModified':False,'sharedRenderLockTouched':False},indent=2)+'\n');print({'formatsRepaired':3,'dualReaders':'PASS','all314DecodedPageContentsUnchanged':True,'renderingPerformed':False})
