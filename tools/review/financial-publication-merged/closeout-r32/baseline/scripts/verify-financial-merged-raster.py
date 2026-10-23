from pathlib import Path
import json,hashlib
from PIL import Image,ImageChops,ImageStat
from pypdf import PdfReader
import pdfplumber
root=Path('tools/review/financial-publication-merged')
J=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'))
receipt=J(root/'correction-r3/pdf-navigation.json')
path=next(r['path'] for r in receipt['results'] if r['stem']=='complete')
reader=PdfReader(path,strict=True);assets=J(root/'approved-assets.json');rows=[]
for page,index in [(1,0),(2,1),(3,2),(4,3),(5,4),(21,5),(22,6),(6,7)]:
    images=[i.image.convert('RGB') for i in reader.pages[page-1].images]
    expected=Image.open(assets[index]['path']).convert('RGB')
    matching=[i for i in images if i.size==expected.size]
    assert matching,(page,'Full-size asset absent')
    image=matching[0];difference=sum(ImageStat.Stat(ImageChops.difference(image,expected)).mean)/3
    assert difference<2,(page,difference)
    rows.append({'page':page,'key':assets[index]['key'],'sourceFileSha256':assets[index]['sha256'],'sourceDecodedRgbSha256':hashlib.sha256(expected.tobytes()).hexdigest(),'pdfDecodedRgbSha256':hashlib.sha256(image.tobytes()).hexdigest(),'exactDecodedRgbMatch':image.tobytes()==expected.tobytes(),'meanChannelDifference':difference,'dimensions':list(image.size),'effectiveDpi':[image.width/(float(reader.pages[page-1].mediabox.width)/72),image.height/(float(reader.pages[page-1].mediabox.height)/72)]})
fonts=[]
with pdfplumber.open(path) as pdf:
    for n,p in enumerate(pdf.pages,1):
        chars=[c for c in p.chars if c['text'].strip()]
        fonts.append({'page':n,'nativeCharacters':len(chars),'minNativeFontPt':min((c['size'] for c in chars),default=None),'nativeCharactersBelow8Pt':sum(c['size']<8 for c in chars)})
assert all(f['nativeCharactersBelow8Pt']==0 for f in fonts), 'Native generated text below8pt'
allFinal=[]
for r in receipt['results']:
    p=PdfReader(r['path'],strict=True)
    assert len(p.pages)==r['pages'];assert len(p.outline)==r['pages']
    for page in p.pages:
        for a in page.get('/Annots',[]):
            annot=a.get_object()
            if annot.get('/Subtype')!='/Link':continue
            assert '/Dest' in annot or '/A' in annot
    allFinal.append({'stem':r['stem'],'strictPdfRead':'PASS','bookmarkCount':len(p.outline)})
out={'status':'PASS_ASSET_EMBEDDING_AND_NAVIGATION_ONLY','printAdmission':'BLOCKED_APPROVED_HIGH_RES_SOURCE_AND_PHYSICAL_A4_REVIEW','methodVersion':'BLOCKED_APPROVED_EMPTY_SLOT_ASSET_UNAVAILABLE','completePdf':path,'assets':rows,'nativeFonts':fonts,'minimumNativeFontPt':min(f['minNativeFontPt'] for f in fonts if f['minNativeFontPt'] is not None),'nativeTextBelow8Pt':False,'finalPdfReads':allFinal,'rasterTextHasFullOcr':False,'accessibleHtml':'tools/review/financial-publication-merged/fixed-content-accessible.html','physicalPrintRun':False,'providerCalls':0}
(root/'correction-r3/pdf-raster-audit.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print('PASS8 approved rasters compared against actual PDF decoded pixels; strict final PDFs/bookmarks verified. Print remains BLOCKED.')
