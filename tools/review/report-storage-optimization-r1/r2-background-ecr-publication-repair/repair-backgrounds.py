import pathlib,json,sys,math,io,hashlib
from PIL import Image
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject,NumberObject,DictionaryObject,ArrayObject,DecodedStreamObject,StreamObject
import pypdf.generic._base as pdf_numbers
pdf_numbers.FLOAT_WRITE_PRECISION=17
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()))
from report_background_layout import plan_background,make_edge_extension,extend_pdf_page_background
from disk_space_guard import require_disk_space,reserve_render_slot
D=pathlib.Path(__file__).parent;R=D.parent;sys.path.insert(0,str(R.resolve()));from optimize import decode_image,identity
j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'));sha=lambda b:hashlib.sha256(b).hexdigest();save=lambda n,x:(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def repair(report,root):
 source=pathlib.Path(report['path']);raw=source.read_bytes();assert sha(raw)==report['sha256'];r=PdfReader(io.BytesIO(raw));w=PdfWriter(clone_from=r);changes=[]
 for row in [x for x in root if x['method']==report['method']]:
  page=w.pages[row['pdf_page']-1];W,H=row['page_dimensions'];policy=plan_background(row['source_dimensions'],[W,H],'FULL_BLEED_SAFE_EXTEND',main_box=row['image_rectangle']);im=Image.open(row['imagePreview']).convert('RGB');proof=extend_pdf_page_background(w,row['pdf_page']-1,im,policy,quality=87);changes.append({'page':row['pdf_page'],'policy':policy,'extensions':proof,'originalMainImageRectangleUnchanged':True,'originalDynamicContentStreamsRetained':True})
 target=pathlib.Path('output/pdf/r2-background-ecr-publication-repair')/(report['method']+'-FULL-BLEED-REVIEW.pdf');target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():
  assert sha(target.read_bytes())==EXPECTED_CANDIDATE_HASHES[report['method']],'CONCURRENT_CANDIDATE_DRIFT'
 w.add_metadata({'/PHIOSBackgroundRepairSourceSHA256':sha(raw),'/PHIOSBackgroundPolicy':'FULL_BLEED_SAFE_EXTEND_EDGE_COLOUR_ONLY_Q87','/PHIOSBackgroundAdmission':'LOCAL_HUMAN_REVIEW_PENDING'})
 with target.open('wb') as f:w.write(f)
 after=PdfReader(target);assert len(after.pages)==len(r.pages);assert identity(after)==identity(r);assert sha(source.read_bytes())==report['sha256'];return {'method':report['method'],'file':str(target).replace('\\','/'),'sha256':sha(target.read_bytes()),'bytes':target.stat().st_size,'pages':len(after.pages),'source':report,'changes':changes,'customerPublishable':False,'providerCalls':0}
if __name__=='__main__':
 require_disk_space('Three existing Q87 layout-only successors',400_000_000);release=reserve_render_slot('R2 full-bleed17 page layout repair')
 try:
  EXPECTED_CANDIDATE_HASHES={r['method']:r['sha256'] for r in j(D/'REPAIRED-PDF-MANIFEST.json')['results']};records=j(D/'FULL-BLEED-ROOT-CAUSE.json')['records'];reports=j(D/'BASELINE-REPORTS.json')['reports'];results=[]
  for r in reports:
   results.append(repair(r,records));save('REPAIRED-PDF-MANIFEST.json',{'results':results,'newManuscriptGenerated':False,'sourceR2Writes':0});print(results[-1]['method'],results[-1]['bytes'],flush=True)
 finally:release()
