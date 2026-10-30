from pathlib import Path
import json,hashlib,subprocess,sys
from pypdf import PdfReader
from PIL import Image,ImageOps,ImageDraw
sys.path.insert(0,str(Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('R611B six small TOC diagnostic pages',15_000_000);release=reserve_render_slot('R611B six small synthetic TOC pages')
D=Path('tools/review/hd-r6/import-20261027/r611b');T=Path('.tmp/hd-r611b');j=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'));proof=j(D/'PDF-MECHANICS-TESTS.json');rows=[];thumbs=[]
try:
 for item in proof['PDFs']:
  f=Path(item['file']);r=PdfReader(f);assert hashlib.sha256(f.read_bytes()).hexdigest()==item['sha256'];assert len(r.pages)==item['changedPageCount'];toc=r.pages[5];annots=[x.get_object() for x in toc['/Annots']];assert len(annots)==len(r.outline)==3
  text=toc.extract_text();numbers=[]
  for slot,annotation,outline in zip(item['plan']['rows'],annots,r.outline):
   target=annotation['/Dest'][0];index=next(i for i,p in enumerate(r.pages) if p.indirect_reference==target);assert index==slot['targetPageIndex0'];assert r.get_destination_page_number(outline)==index;assert slot['sectionId'] in r.pages[index].extract_text();assert str(index+1) in text;numbers.append(index+1)
  # Text is a PDF text layer; it is not baked into the synthetic image.
  assert len(toc.images)==1
  image=toc.images[0].image.convert('RGB');expected=Image.open(T/'synthetic-contents.png').convert('RGB');assert image.size==expected.size and image.tobytes()==expected.tobytes()
  out=T/(item['methodId']+'-toc');cmd=['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe','-f','6','-l','6','-scale-to','1000','-png','-singlefile',str(f),str(out)]
  subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
  im=Image.open(str(out)+'.png').convert('RGB');im.thumbnail((300,425));panel=Image.new('RGB',(320,455),'#eef2f1');panel.paste(im,((320-im.width)//2,25));ImageDraw.Draw(panel).text((10,8),item['methodId']+' / SYNTHETIC ONLY',fill='#102b3c');thumbs.append(panel)
  rows.append({'methodId':item['methodId'],'status':'PASS_SYNTHETIC_PDF_MECHANICS','beforePages':item['baselinePageCount'],'afterPages':len(r.pages),'actualPrintedPageNumbers':numbers,'linksToActualSectionOpeners':3,'bookmarksToSameActualPages':3,'embeddedSyntheticBackgroundPixelIdentical':True,'realR2ArtworkVerified':False,'fullCustomerReportAccepted':False})
 before=PdfReader(T/'default-before.pdf');after=PdfReader(T/'default-after.pdf');assert len(before.pages)==len(after.pages);assert [p.extract_text() for p in before.pages]==[p.extract_text() for p in after.pages]
 sheet=Image.new('RGB',(960,910),'white')
 for i,im in enumerate(thumbs):sheet.paste(im,((i%3)*320,(i//3)*455))
 sheet.save(D/'SYNTHETIC-TOC-MECHANICS-CONTACT.jpg',quality=90)
 (D/'PDF-NAVIGATION-QA.json').write_text(json.dumps({'status':'PASS_SYNTHETIC_MECHANICS_ONLY','rows':rows,'defaultExistingRendererTextAndPageCountUnchanged':True,'remoteAssetVisualAcceptance':'R2_REMOTE_BYTES_UNVERIFIED','humanReviewOfActualP06':'PENDING_REAL_BYTES'},indent=2)+'\n')
 print('Six real diagnostic PDFs: 18 actual links/bookmarks/numerals, six image pixel identities, default renderer compatibility PASS')
finally:release()
