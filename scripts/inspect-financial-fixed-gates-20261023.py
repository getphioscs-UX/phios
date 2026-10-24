"""Read-only inspection of existing proof and fresh R2 bytes; no PDF authoring."""
from pathlib import Path
import json,hashlib,statistics,re
from PIL import Image,ImageDraw,ImageOps,ImageChops
from pypdf import PdfReader
import pdfplumber
root=Path('tools/review/financial-publication-merged');out=root/'fixed-gates-2026-10-23';J=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'));h=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
receipt=J(out/'r2-object-receipt.json');assets=J(root/'approved-assets.json');images=[]
for a in receipt['results']:
 if 'path' not in a:continue
 im=Image.open(a['path']);w,hh=im.size
 images.append({**a,'actualDimensions':[w,hh],'a4EffectiveDpi':[w/(210/25.4),hh/(297/25.4)],'true300DpiA4':w>=2481 and hh>=3508,'resolutionStatus':'BELOW_300DPI_A4','upscaledForPrint':False})
(out/'resolution-and-version.json').write_text(json.dumps({'assets':images,'a4Mm':[210,297],'reference300dpiPixels':[2481,3508],'nativeTextIsIndependentOfBitmapDpi':True,'publicVersionHistory':'NOT_AVAILABLE_FROM_PUBLIC_GET','providerCalls':0},indent=2),encoding='utf-8')
proof=Path('output/pdf/financial-merged/fixed-copy-native-print-proof.pdf');reader=PdfReader(proof);assert len(reader.pages)==6
mapping=[(2,1),(3,2),(4,3),(5,4),(21,5),(22,6)];fontStats=[]
with pdfplumber.open(proof) as pdf:
 for p in pdf.pages:
  fonts={}
  for c in p.chars:
   if not c['text'].strip():continue
   key=(c['fontname'],round(c['size'],3));fonts[key]=fonts.get(key,0)+1
  # Read actual baseline pitch of normal English body text, not CSS alone.
  tops=sorted(set(round(c['top'],2) for c in p.chars if 'SegoeUI' in c['fontname'] and 8.5<c['size']<9 and c['x0']<297))
  pitches=[round(b-a,2) for a,b in zip(tops,tops[1:]) if 9<b-a<17]
  fontStats.append({'fonts':[{'font':n,'pointSize':s,'chars':v} for (n,s),v in fonts.items()],'bodyLinePitchPtSamples':pitches[:12]})
comparisons=[]
for core,n in mapping:
 assetIndex={2:1,3:2,4:3,5:4,21:5,22:6}[core];a=assets[assetIndex];fresh=out/a['name'];assert fresh.exists()
 left=Image.open(fresh).convert('RGB');right=Image.open(out/f'proof-{n}.png').convert('RGB');size=(794,1123)
 # Preview-scale interpolation only; never exported as a high-res approved source.
 pair=Image.new('RGB',(size[0]*2+20,size[1]+50),'#e5e7df');pair.paste(left.resize(size),(0,50));pair.paste(right.resize(size),(814,50));d=ImageDraw.Draw(pair);d.text((10,10),f'LIVE R2 P{core:02} / NOT AUTOMATIC APPROVAL',fill='black');d.text((824,10),f'EXISTING NATIVE PROOF / PAGE {n} / SAME A4 SCALE',fill='black');path=out/f'compare-p{core:02}.png';pair.save(path)
 text=reader.pages[n-1].extract_text() or ''
 comparisons.append({'reportPage':core,'proofPage':n,'sourcePath':str(fresh).replace('\\','/'),'sourceSha256':h(fresh),'comparison':str(path).replace('\\','/'),'proofTextChars':len(text),'selectableBilingual':any('\u4e00'<=c<='\u9fff' for c in text) and bool(re.search('[A-Za-z]{4}',text)),'a4':abs(float(reader.pages[n-1].mediabox.width)-595.28)<1 and abs(float(reader.pages[n-1].mediabox.height)-841.89)<1,'actualFontsAndPitch':fontStats[n-1],'sourceFontFiles':'UNAVAILABLE_RASTER_ONLY','editorialStatus':'NOT_VISUALLY_EQUIVALENT_HUMAN_APPROVAL_REQUIRED'})
old=Image.open(assets[2]['path']).convert('RGB');new=Image.open(out/assets[2]['name']).convert('RGB');assert old.size==new.size
pair=Image.new('RGB',(1608,1173),'#e5e7df');pair.paste(old.resize((794,1123)),(0,50));pair.paste(new.resize((794,1123)),(814,50));d=ImageDraw.Draw(pair);d.text((10,10),'PINNED P03 / CURRENT REPORT SOURCE',fill='black');d.text((824,10),'LIVE R2 P03 / APPROVAL IDENTITY UNCONFIRMED',fill='black');pair.save(out/'p03-pinned-vs-live.png')
payload={'proofPath':str(proof).replace('\\','/'),'proofSha256':h(proof),'comparisons':comparisons,'p03Drift':{'oldSha256':h(assets[2]['path']),'newSha256':h(out/assets[2]['name']),'changedPixels':sum(1 for p in ImageChops.difference(old,new).getdata() if p!=(0,0,0)),'action':'Retain pinned bytes; do not update contract or report without explicit source approval'},'visualAcceptance':False,'physicalPrint':'PENDING_PHYSICAL_PRINT','mainReportFixedCopyUnchanged':True,'providerCalls':0}
(out/'fixed-proof-inspection-v2.json').write_text(json.dumps(payload,indent=2),encoding='utf-8')
print('Inspected6 existing proof pages; source dimensions, font metrics and same-A4 comparisons saved; no PDF modified.')
