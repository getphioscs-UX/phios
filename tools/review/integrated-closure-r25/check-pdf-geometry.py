import pathlib,json,pdfplumber
from PIL import Image,ImageDraw
root=pathlib.Path.cwd();private=root/'.tmp/integrated-closure-r25/private/ecr';safe=root/'tools/review/integrated-closure-r25';receipt=json.loads((private/'PDF-RESULTS.json').read_text(encoding='utf8'));results=[]
for r in receipt['results']:
 maps=json.loads((pathlib.Path(r['file']).parent/'page-map.json').read_text(encoding='utf8'));bad=[];characters=0
 with pdfplumber.open(r['file']) as pdf:
  for p,m in zip(pdf.pages,maps):
   if m['kind']!='BODY_TEXT' and m.get('sectionId')!='APPENDIX':continue
   for c in p.chars:
    if not c.get('text','').strip():continue
    characters+=1
    if c['x0'] < -1 or c['x1']>p.width+1 or c['top'] < -1 or c['bottom']>p.height+1:bad.append({'page':p.page_number,'bbox':[c['x0'],c['top'],c['x1'],c['bottom']]})
   p.close()
 assert not bad,(r['locale'],bad[:5]);results.append({'locale':r['locale'],'bodyAndAppendixVisibleGlyphsChecked':characters,'outOfPageGlyphs':0,'status':'PASS'})
 paths=sorted((pathlib.Path(r['file']).parent/'pages').glob('page-*.png'));cols=8;tw=150;th=235;sheet=Image.new('RGB',(cols*tw,((len(paths)+cols-1)//cols)*th),'#b9b9b9');draw=ImageDraw.Draw(sheet)
 for i,p in enumerate(paths):
  im=Image.open(p).convert('RGB');im.thumbnail((140,209));x=(i%cols)*tw+5;y=(i//cols)*th;sheet.paste(im,(x,y));draw.text((x,y+211),str(i+1),fill='black')
 sheet.save(pathlib.Path(r['file']).parent/'contact-sheet.jpg',quality=80)
(safe/'PDF-GEOMETRY.json').write_text(json.dumps({'results':results,'scope':'Every BODY and customer appendix glyph bounding box within physical A4; all-page contact sheets retained privately','humanPrintAcceptance':False},indent=2),encoding='utf8');print('PASS all BODY/customer appendix glyph page bounds')
