from pathlib import Path
import json,hashlib,subprocess,sys
from pypdf import PdfReader
from PIL import Image,ImageDraw
import pdfplumber
sys.path.insert(0,str(Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('R611B actual six P06 diagnostic page visual QA',20_000_000);release=reserve_render_slot('R611B actual P06 six-page QA')
D=Path('tools/review/hd-r6/import-20261027/r611b');T=Path('.tmp/hd-r611b');source=json.loads((D/'ACTUAL-P06-BINDING-PDFS.json').read_text());rows=[];thumbs=[]
try:
 for a in source['PDFs']:
  f=Path(a['file']);assert hashlib.sha256(f.read_bytes()).hexdigest()==a['sha256'];r=PdfReader(f);assert len(r.pages)==a['finalLayout']['pageCount'];p=r.pages[5];annots=[x.get_object() for x in p['/Annots']];assert len(annots)==len(r.outline)==len(a['plan']['rows']);assert len(p.images)==1
  actual=p.images[0].image.convert('RGB');expected=Image.open(a['source']['file']).convert('RGB');assert actual.size==expected.size and actual.tobytes()==expected.tobytes()
  links=[]
  with pdfplumber.open(f) as pl:
   pp=pl.pages[5];assert 'Diagnostic reserved page' not in pp.extract_text()
   for row,annotation,outline in zip(a['plan']['rows'],annots,r.outline):
    ref=annotation['/Dest'][0];i=next(i for i,page in enumerate(r.pages) if page.indirect_reference==ref);assert i==row['targetPageIndex0']==r.get_destination_page_number(outline);assert row['sectionId'] in r.pages[i].extract_text()
    rect=[float(x) for x in annotation['/Rect']];printed=pp.within_bbox((rect[0],pp.height-rect[3],rect[2],pp.height-rect[1])).extract_text() or '';assert printed.strip()==str(i+1),(a['methodId'],row,printed)
    links.append({'visualItemId':row['sectionId'],'actualPage1':i+1,'nativeLayoutEvent':a['finalLayout']['sectionOpeners'][len(links)]['physicalPageIndex0']+1,'printedInMeasuredBlankSlot':printed})
  out=T/(a['methodId']+'-actual-bound-toc');subprocess.run(['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe','-f','6','-l','6','-scale-to','1500','-singlefile','-png',str(f),str(out)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
  im=Image.open(str(out)+'.png').convert('RGB');im.thumbnail((390,550));panel=Image.new('RGB',(410,585),'#edf2f0');panel.paste(im,((410-im.width)//2,30));ImageDraw.Draw(panel).text((8,7),a['methodId']+' / REAL R2 IMAGE + TEST PAGE NUMBERS',fill='black');thumbs.append(panel)
  rows.append({'methodId':a['methodId'],'status':'PASS_ACTUAL_PICTURE_LOCAL_LAYOUT_BINDING_NOT_CUSTOMER_CONTENT','sourceSHA256':a['source']['sha256'],'PDFSHA256':a['sha256'],'pages':len(r.pages),'embeddedSourceRGBPixelsIdentical':True,'numbersAreDynamicText':True,'noStaleSlotTextRetained':True,'linksAndBookmarks':len(links),'slots':links,'customerSemanticsValidated':False,'ownerVisualAcceptance':False})
 sheet=Image.new('RGB',(1230,1170),'white')
 for i,im in enumerate(thumbs):sheet.paste(im,((i%3)*410,(i//3)*585))
 sheet.save(D/'ACTUAL-P06-BOUND-CONTACT.jpg',quality=94)
 (D/'ACTUAL-P06-PDF-QA.json').write_text(json.dumps({'status':'PASS_ACTUAL_ASSET_DIAGNOSTIC_BINDING','totalLinksNumbersBookmarks':sum(x['linksAndBookmarks'] for x in rows),'rows':rows,'allSixActualSourceImages':True,'fullCustomerReports':0,'ownerAcceptance':'PENDING_WITH_TITLE_ISSUES'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Six actual source pictures, 70 measured-slot numerals / real links / outlines PASS; not customer full-report acceptance')
finally:release()
