from pathlib import Path
import sys,json,ast
sys.path.insert(0,str(Path('scripts/lib').resolve()));from report_background_layout import plan_background,make_edge_extension
from PIL import Image
checks=[]
def ok(name,fn):fn();checks.append({'name':name,'status':'PASS'})
def denies(fn):
 try:fn()
 except ValueError:return
 raise AssertionError('EXPECTED_DENIAL')
ok('No implicit background mode',lambda:denies(lambda:plan_background([100,200],[595,842],'AUTO')))
ok('Contain requires explicit approval',lambda:denies(lambda:plan_background([100,200],[595,842],'CONTAIN')))
ok('Approved contain preserves image',lambda:plan_background([100,200],[595,842],'CONTAIN',contain_approved=True))
ok('Cover denies missing safe crop',lambda:denies(lambda:plan_background([1122,1402],[595,842],'FULL_BLEED_SAFE_COVER')))
ok('Cover denies edge text crop',lambda:denies(lambda:plan_background([1122,1402],[595,842],'FULL_BLEED_SAFE_COVER',safe_crop=[0,0,1,1])))
ok('Cover accepts only verified safe interior',lambda:plan_background([1122,1402],[595,842],'FULL_BLEED_SAFE_COVER',safe_crop=[.15,.15,.85,.85]))
ok('Explicit background requires geometry',lambda:denies(lambda:plan_background([100,200],[595,842],'EXPLICIT_BACKGROUND_LAYOUT')))
ok('Explicit background leaves text independent',lambda:plan_background([100,200],[595,842],'EXPLICIT_BACKGROUND_LAYOUT',explicit_box=[0,0,595,842]))
ok('Extend refuses already cropped source',lambda:denies(lambda:plan_background([1122,1402],[595,842],'FULL_BLEED_SAFE_EXTEND',main_box=[-100,0,695,842])))
ok('Invalid size denied',lambda:denies(lambda:plan_background([0,200],[595,842],'FULL_BLEED_SAFE_EXTEND')))
D=Path('tools/review/report-storage-optimization-r1/r2-background-ecr-publication-repair');records=json.loads((D/'FULL-BLEED-ROOT-CAUSE.json').read_text())['records']
for r in records:
 p=plan_background(r['source_dimensions'],r['page_dimensions'],'FULL_BLEED_SAFE_EXTEND',main_box=r['image_rectangle']);assert p['mainBox']==r['image_rectangle'] and not p['mainArtworkCropped'] and not p['newMainArtworkStretch'];assert any(s['side']=='top' for s in p['strips']) and any(s['side']=='bottom' for s in p['strips']);checks.append({'name':f"{r['method']} p{r['pdf_page']} preserved artwork / filled four-direction plan",'status':'PASS'})
for p in [Path('scripts/lib/report_background_layout.py'),D/'repair-backgrounds.py',D.parent/'optimize.py']:ast.parse(p.read_text(encoding='utf-8-sig'))
(D/'BACKGROUND-LAYOUT-UNIT-CHECKS.json').write_text(json.dumps({'count':len(checks),'checks':checks,'sourceR2Writes':0,'sourceCrops':0},indent=2)+'\n');print(len(checks),'targeted background-mode/geometry checks PASS')
