from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw
root=Path('tools/review/financial-publication-merged');out=root/'closeout-r32';J=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'))
old=J(out/'baseline/tools/review/financial-publication-merged/build-state.json')['outputs'][0];new=J(root/'build-state.json')['outputs'][0]
oldImages=sorted((root/'correction-r3/visual'/('complete-'+old['htmlSha256'][:10])).glob('page-*.png'));newImages=sorted((root/'correction-r3/visual'/('complete-'+new['htmlSha256'][:10])).glob('page-*.png'))
assert len(oldImages)==44 and len(newImages)==new['totalPages']
matches=[];folder=out/'before-after';folder.mkdir(exist_ok=True)
for n in range(1,old['totalPages']+1):
 if n<=22:targets=[n]
 else:
  a=next(x for x in old['appendixManifest'] if x['page']==n)
  candidates=[x for x in new['appendixManifest'] if x['kind']==a['kind'] and x['category']==a['category'] and x['modelId']==a['modelId']]
  if a['kind']=='YEARLY':
   oldCount=8 if a['modelId']=='RETIREMENT_NEEDS' else 5 if a['modelId']=='EDUCATION_COST' else 4;newCount=5 if a['modelId']=='EDUCATION_COST' else 10
   candidates=[x for x in candidates if x['offset']<a['offset']+oldCount and x['offset']+newCount>a['offset']]
  elif a['kind']=='SOURCES':candidates=[candidates[0]]
  else:candidates=[x for x in candidates if x['offset']==a['offset']]
  targets=[x['page'] for x in candidates]
 assert targets,('no source mapping',n)
 for m in targets:
  left=Image.open(oldImages[n-1]);right=Image.open(newImages[m-1]);assert left.size==right.size
  im=Image.new('RGB',(left.width*2+20,left.height+45),'#e6e8df');im.paste(left,(0,45));im.paste(right,(left.width+20,45));d=ImageDraw.Draw(im);d.text((10,10),f'PRE-CLOSEOUT 44 / P{n}',fill='black');d.text((left.width+30,10),f'CLOSEOUT {new["totalPages"]} / P{m} / SAME A4 SCALE',fill='black');path=folder/f'old{n:02}-new{m:02}.png';im.save(path);matches.append({'oldPage':n,'newPage':m,'path':str(path).replace('\\','/')})
assert set(x['newPage'] for x in matches)==set(range(1,new['totalPages']+1))
(out/'before-after.json').write_text(json.dumps({'oldPages':44,'newPages':new['totalPages'],'sameScale':True,'everyOldPageMapped':True,'everyNewPageCovered':True,'comparisons':matches},indent=2),encoding='utf-8');print('PASS closeout44-to-37 actual PDF comparisons',len(matches))
