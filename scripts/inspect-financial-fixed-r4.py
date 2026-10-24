from pathlib import Path
import json,hashlib,re,unicodedata,subprocess,struct,logging
from PIL import Image,ImageDraw
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject
import pdfplumber

root=Path('tools/review/financial-publication-merged');out=root/'fixed-editorial-r4';J=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'));H=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();pdf=Path('output/pdf/financial-merged/fixed-native-r4-six-pages.pdf');pages=[2,3,4,5,21,22]
logging.getLogger('pdfminer.pdffont').setLevel(logging.ERROR)
r=PdfReader(pdf);w=PdfWriter();w.clone_document_from_reader(r);w._root_object.pop(NameObject('/Outlines'),None)
for i,n in enumerate(pages):w.add_outline_item(f'P{n:02} / R4 fixed-page local candidate',i)
w.add_metadata({'/Title':'PHIOS Fixed Editorial R4 | Six-page Local Candidate | Not Accepted','/Subject':'Fixed visual/native proof only; source reports remain37/37/22/80/22; P03/P21/print/human gates pending'})
temp=pdf.with_suffix('.tmp.pdf')
with temp.open('wb') as f:w.write(f)
temp.replace(pdf);r=PdfReader(pdf,strict=True);assert len(r.pages)==6 and len(r.outline)==6
ledger=J(out/'native-text-ledger.json');normalize=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
iconnames={'doc','cash','chart','shield','target','family','self','gear','law','tax','calendar','check','alert','search','arrow','home','education','clock','minus','cross','bulb'}
def strings(value,path=''):
 if isinstance(value,str):
  if value not in iconnames:yield path,value
 elif isinstance(value,list):
  for i,x in enumerate(value):yield from strings(x,path+'/'+str(i))
 elif isinstance(value,dict):
  for k,x in value.items():yield from strings(x,path+'/'+k)
copychecks=[];stats=[]
with pdfplumber.open(pdf) as measured:
 for i,n in enumerate(pages):
  page=r.pages[i];assert abs(float(page.mediabox.width)-595.28)<1 and abs(float(page.mediabox.height)-841.89)<1
  text=normalize(page.extract_text() or '');assert '\ufffd' not in text
  expected=list(strings(ledger['sourceCopy'][str(n)],f'P{n}'));missing=[(p,t) for p,t in expected if normalize(t) not in text];assert not missing,(n,missing)
  for path,t in expected:copychecks.append({'id':path,'text':t,'pdfPage':i+1,'reportPage':n,'nativePdfContainsExactText':True,'sourceAuthority':'Digest-bound poster manual transcription; independent signed text revision absent','humanSentenceApproval':None,'copyStatus':'PROPOSED_FIXED_REVISION' if n==21 else 'TRANSCRIPTION_MATCH_SOURCE_EDITORIAL_CHECK_PENDING'})
  if n==21:assert not re.search(r'2026-10-20|Saved\s*Version|\bMYR\b|Base\s*/\s*Scenario|Local\s*review:|Confirmownership|Validaterecurring|Setretirementtargets',text)
  p=measured.pages[i];chars=[c for c in p.chars if c['text'].strip()];bodychars=[c for c in chars if 76<c['top']<797];assert min(c['size'] for c in bodychars)>=8
  imageinfo=[]
  for im in p.images:
   sw,sh=im['srcsize'];width=abs(im['x1']-im['x0']);height=abs(im['bottom']-im['top']);imageinfo.append({'pixels':[sw,sh],'drawnBBoxPt':[im['x0'],im['top'],im['x1'],im['bottom']],'effectiveDpi':[sw/width*72,sh/height*72],'note':'Draw-transform DPI; clipped decorative crops may have bounds beyond visible viewport. Not an A4 high-res source claim.'})
  operations=page.get_contents().operations;vector=sum(op in [b'm',b'l',b'c',b're',b'S',b'f',b'f*',b's',b'B'] for _,op in operations);images=sum(op==b'Do' for _,op in operations);textops=sum(op in [b'Tj',b'TJ'] for _,op in operations)
  stats.append({'reportPage':n,'pdfPage':i+1,'a4':True,'nativeChars':len(chars),'nativeFonts':sorted(set(c['fontname'] for c in chars)),'minNativeFontPt':min(c['size'] for c in chars),'minBodyNativeFontPt':min(c['size'] for c in bodychars),'microcopyBelow8Pt':'Header brand motto and footer only; retained as explicit print-review concern','sourceCopyStrings':len(expected),'selectableCoverageOfRecordedBodyCopy':1.0,'coverageCaveat':'Recorded body-copy strings only; raster brand identity/microcopy is excluded. Does not certify all original poster copy.','vectorPathOperatorCount':vector,'imageDrawOperatorCount':images,'textDrawOperatorCount':textops,'vectorVsImageOperatorRatio':vector/(vector+images) if vector+images else None,'ratioCaveat':'Operator-count proxy, not visual area or whole-page percentage. Native SVG Form XObjects may contain further paths.','images':imageinfo,'safeAreaCssPx':[43,105 if n in [3,5,21,22] else 110,751,1061],'physicalPrint':'NOT_RUN'})
fontfiles=['C:/Windows/Fonts/simsun.ttc','C:/Windows/Fonts/times.ttf','C:/Windows/Fonts/georgia.ttf','C:/Windows/Fonts/segoeui.ttf'];rights=[]
for path in fontfiles:
 if not Path(path).exists():rights.append({'path':path,'status':'UNAVAILABLE'});continue
 data=Path(path).read_bytes()
 offsets=[struct.unpack_from('>I',data,12+i*4)[0] for i in range(struct.unpack_from('>I',data,8)[0])] if data[:4]==b'ttcf' else [0]
 for offset in offsets:
  count=struct.unpack_from('>H',data,offset+4)[0];bits=None
  for i in range(count):
   pos=offset+12+i*16
   if data[pos:pos+4]==b'OS/2':
    table=struct.unpack_from('>I',data,pos+8)[0];bits=struct.unpack_from('>H',data,table+8)[0]
  rights.append({'systemFontPath':path,'fsType':bits,'restrictedLicenseEmbeddingBit':bool(bits&2) if bits is not None else None,'fontCopiedToRepo':False,'fullLicenseClaim':'OS/2 embedding flags observed only; not independent legal clearance'})
# Match every dynamic source-directory range to the actual unchanged source PDF/bookmarks.
runtime=J(out/'runtime-verification.json');catalogue=[]
for case in runtime['results']:
 source=Path(case['sourcePdf']['path']);sr=PdfReader(source,strict=True);assert len(sr.pages)==case['totalPages'];assert H(source)==case['sourcePdf']['sha256']
 outlines={sr.get_destination_page_number(x)+1:str(x['/Title']) for x in sr.outline if isinstance(x,dict)}
 for entry in case['entries']:
  if not entry['checked']:continue
  first,last=int(entry['start']),int(entry['end'])
  for n in range(first,last+1):assert entry['id'] in outlines[n],(case['stem'],entry['id'],n,outlines[n])
  catalogue.append({'stem':case['stem'],'category':entry['id'],'first':first,'last':last,'everyPageMatchesActualBookmark':True})
# Type3 CJK subsets produced by Edge are vector char procedures with ToUnicode, not bitmap letters.
type3=[]
for page in r.pages:
 for ref in page['/Resources'].get('/Font',{}).get_object().values():
  font=ref.get_object()
  if font.get('/Subtype')!='/Type3':continue
  assert '/ToUnicode' in font
  streams=[v.get_object().get_data() for v in font['/CharProcs'].get_object().values()]
  assert all(b' Do' not in stream and b'BI' not in stream for stream in streams)
  type3.append({'glyphProcedures':len(streams),'toUnicode':True,'bitmapDrawsDetected':False})
(out/'directory-pdf-reconciliation.json').write_text(json.dumps({'status':'PASS_EXISTING_FINAL_PDF_BOOKMARKS','ranges':catalogue,'nativePackLinks':'External local source-PDF file links with #page; six-page proof does not contain source appendices','type3GlyphsAreVector':type3,'warning':'pdfminer may warn about optional Type3 FontDescriptor FontBBox; glyph procedures and actual render inspected'},indent=2),encoding='utf-8')
(out/'sentence-copy-checks.json').write_text(json.dumps({'sentences':copychecks,'allRecordedStringsInActualPdf':True,'formalCopyApproval':False},ensure_ascii=False,indent=2),encoding='utf-8')
sourceDimensions=[{'path':a['livePath'],'sha256':H(a['livePath']),'width':Image.open(a['livePath']).width,'height':Image.open(a['livePath']).height} for a in J(out/'source-manifest.json')['assets']]
(out/'print-evidence.json').write_text(json.dumps({'pdf':str(pdf).replace('\\','/'),'sha256':H(pdf),'pages':stats,'sourceAssetDimensions':sourceDimensions,'fontEmbeddingObservations':rights,'fontFilesDelivered':False,'printGate':'PRINT_HUMAN_GATE_PENDING','highResGate':'HIGH_RES_DECORATIVE_SOURCE_PENDING','visualApproval':False,'providerCalls':0},indent=2),encoding='utf-8')
pop='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
subprocess.run([pop,'-png','-scale-to','1123',str(pdf),str(out/'actual-r4')],check=True,capture_output=True)
sources=J(out/'source-manifest.json')['assets'];mapping={2:1,3:2,4:3,5:4,21:5,22:6}
for i,n in enumerate(pages):
 a=sources[mapping[n]];frozen=Image.open(a['frozenPath']).convert('RGB');live=Image.open(a['livePath']).convert('RGB');native=Image.open(out/f'actual-r4-{i+1}.png').convert('RGB');assert native.size==(794,1123)
 canvas=Image.new('RGB',(2422,1173),'#e4e7de');d=ImageDraw.Draw(canvas)
 for j,(im,label) in enumerate([(frozen,'PREVIOUS FROZEN'),(live,'LIVE R2 / APPROVAL IDENTITY SEPARATE'),(native,'NATIVE R4 LOCAL CANDIDATE')]):canvas.paste(im.resize((794,1123)),(j*814,50));d.text((j*814+8,10),f'P{n:02} / '+label,fill='black')
 canvas.save(out/f'compare-three-p{n:02}.png')
print('PASS actual6 A4 pages, all recorded body strings, >=8pt native type, P21 sample absence; six actual-PDF3-way comparisons. Print remains pending.')
