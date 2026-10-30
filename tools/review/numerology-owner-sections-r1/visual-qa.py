from pathlib import Path
import json,sys,subprocess
from PIL import Image,ImageDraw
sys.path.insert(0,'scripts/lib')
from disk_space_guard import require_disk_space,reserve_render_slot
R=Path('tools/review/numerology-owner-sections-r1');V=R/'visual';V.mkdir(exist_ok=True)
exe='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
require_disk_space('NUM owner targeted actual PDF raster proof',200_000_000)
release=reserve_render_slot('NUM owner sections actual PDF targeted visual QA')
try:
    groups={};records=[]
    for locale in ['zh-Hans','en','bilingual']:
        folder=Path('output/pdf/numerology-owner-sections-r1')/locale;pdf=next(folder.glob('*.pdf'));plan=json.loads((folder/'PAGE-MAP.json').read_text())
        selected=[e for e in plan if e.get('logicalPageId','') and e['logicalPageId'].startswith('I') or locale=='bilingual' and (e['pageRole']=='FIXED_MASTER_SECTION' or e.get('logicalPageId') in ['P10','P12','P19','P20'])]
        for e in selected:
            n=e['physicalPageNumber'];label=e.get('sectionId') if e['pageRole']=='FIXED_MASTER_SECTION' else e['logicalPageId'];prefix=V/f'{locale}-{label}-p{n:02}'
            subprocess.run([exe,'-f',str(n),'-l',str(n),'-singlefile','-scale-to','1400','-png',str(pdf),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
            group='posters' if e['pageRole']=='FIXED_MASTER_SECTION' else locale+'-integration' if label.startswith('I') else 'native-four';groups.setdefault(group,[]).append((str(prefix)+'.png',label+' / physical '+str(n)));records.append(dict(locale=locale,page=n,label=label,png=str(prefix)+'.png'))
            print(locale,label,n,flush=True)
    for group,items in groups.items():
        cols=5 if group=='posters' else 2;w=375 if group=='posters' else 575;h=int(w*297/210)+30;canvas=Image.new('RGB',(w*cols,h*((len(items)+cols-1)//cols)),(230,230,225));draw=ImageDraw.Draw(canvas)
        for i,(file,label) in enumerate(items):
            im=Image.open(file).convert('RGB');im.thumbnail((w-8,h-36));x=(i%cols)*w;y=(i//cols)*h;canvas.paste(im,(x+4,y+28));draw.text((x+6,y+8),label,fill='black')
        canvas.save(V/(group+'-CONTACT.jpg'),quality=92)
    (R/'VISUAL-EVIDENCE.json').write_text(json.dumps(dict(actualPdfRenders=records,renderedPageCount=len(records),p06ContentReinspection=False,visualReviewStatus='PENDING_CODEX_VISUAL_INSPECTION_NOT_OWNER_ACCEPTANCE'),indent=2),encoding='utf8')
finally:
    release()
