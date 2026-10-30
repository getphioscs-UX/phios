from pathlib import Path
import json,hashlib
D=Path('tools/review/ecr-flagship-visual-r1/r2'); S=Path('assets/customer-ui/js/surfaces/ecr-flagship-r1.js'); C=Path('assets/customer-ui/surfaces/ecr-flagship-r1.css'); P=Path('assets/customer-ui/media/ecr-flagship-r1/presentation.json')
baseline=json.loads((D/'BASELINE.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
for p in [S,C,P]:
 row=next(x for x in baseline['sources'] if x['path']==str(p).replace('\\','/'))
 if sha(p.read_bytes())!=row['sha256']:raise Exception('CONCURRENT_SOURCE_DRIFT:'+str(p))
reads=json.loads((D/'PUBLIC-READS.json').read_text());assert len(reads['rows'])==4 and all(x.get('decode')=='PASS' for x in reads['rows'])
for x in reads['rows']:x['visualReview']='CONTACT_INSPECTED: correct identity, no flat white/transparent edge band; full artwork preserved'
(D/'PUBLIC-READS.json').write_text(json.dumps(reads,indent=2))
figures=[]
for code,name in [('P03','METHOD-ORIGINS'),('P04','READING-LAYERS'),('P07','REALITY-COMPARISON')]:
 p=Path(f'assets/customer-ui/media/ecr-flagship-r2/VIS-PREENTRY-ECR-{code}-{name}.svg')
 if code=='P04':p.write_text(p.read_text().replace('<g stroke=', '<g id="reading-visual" stroke=',1))
 figures.append({'id':f'VIS-PREENTRY-ECR-{code}-{name}','section':code,'path':str(p).replace('\\','/'),'url':'/'+str(p).replace('\\','/'),'sha256':sha(p.read_bytes()),'owner':'PHI OS page-native editorial SVG','languages':['en','zh-Hans'],'visibleText':False,'humanVisualAcceptance':'PENDING'})
projection={'version':'ECR-FLAGSHIP-VISUAL-R2','hero':reads['rows'][0],'scenes':reads['rows'][1:],'figures':figures}
record={'registry':'PHI-OS-CLIENT-VISUAL-ECR-FLAGSHIP-R2','extends':'content/web-production/registries/client-visual-asset-registry-v1.8.json','status':'OWNER_REQUESTED_LOCAL_PRESENTATION_SUCCESSOR_PENDING_VISUAL_REVIEW','consumer':'/perspectives/phi-configuration/','authority':'Presentation only; no calculation/meaning/commerce change','assets':reads['rows']+figures,'independentR2ObjectSHA':'UNVERIFIED_PUBLIC_ENDPOINT_BYTES_ONLY','productionWrites':0}
Path('content/web-production/registries/ecr-flagship-visual-r2-successor.json').write_text(json.dumps(record,indent=2))
data=json.loads(P.read_text());data['visualSuccessor']=projection
text=S.read_text();old=text
def replace(a,b):
 global text
 assert text.count(a)==1,(a[:90],text.count(a));text=text.replace(a,b,1)
replace('function renderScene(){', '''function visualImage(asset,alt,hero=false){return `<img src="${esc(asset.url)}" width="${asset.width}" height="${asset.height}" alt="${esc(alt)}" decoding="async" loading="${hero?'eager':'lazy'}" ${hero?'fetchpriority="high"':''} data-ef-r2-image="${esc(asset.id)}">`;}
function editorialFigure(code,label){const a=presentation.visualSuccessor?.figures.find(x=>x.section===code);return a?`<figure class="ef-editorial-figure ef-editorial-${code}"><img src="${esc(a.url)}" width="1200" height="${code==='P03'?460:code==='P04'?540:675}" alt="${esc(label)}" loading="lazy" decoding="async"><figcaption>${label}</figcaption></figure>`:'';}
function renderScene(){''')
replace('${sceneArt(state.scene)}</div>', '''${presentation.visualSuccessor?.scenes[state.scene]?visualImage(presentation.visualSuccessor.scenes[state.scene],t(['工作环境示意','沟通环境示意','资源条件示意'][state.scene],['Illustrative work environment','Illustrative communication environment','Illustrative resource conditions'][state.scene])):''}<div data-ef-scene-fallback ${presentation.visualSuccessor?.scenes[state.scene]?'hidden':''}>${sceneArt(state.scene)}</div></div>''')
replace('<div class="ef-hero-art cx-ecr-mandala" data-ef-hero-art aria-hidden="true" inert></div>', '''<div class="ef-hero-visual">${presentation.visualSuccessor?visualImage(presentation.visualSuccessor.hero,t('以玻璃层、轨道与金色连接呈现构型关系的品牌插画','Brand illustration of configuration relationships in glass layers, orbits and gold connections'),true):''}<div class="ef-hero-art cx-ecr-mandala" data-ef-hero-art aria-hidden="true" inert ${presentation.visualSuccessor?'hidden':''}></div></div>''')
replace('`<div class="ef-origin-map">', '''`${editorialFigure('P03',t('书籍框架 → PHI 构型 → 阅读与观察','Book framework → PHI Configuration → reading and observation'))}<div class="ef-origin-map">''')
replace('`<ol class="ef-reading-flow">', '''`${editorialFigure('P04',t('五步阅读次序，不表示因果证明','Five reading stages, not a proof of causation'))}<ol class="ef-reading-flow">''')
replace('<li><span>0${i+1}</span><h3>${title}', '''<li>${presentation.visualSuccessor?`<svg class="ef-flow-icon" viewBox="${i*240} 150 240 240" aria-hidden="true"><use href="${esc(presentation.visualSuccessor.figures.find(x=>x.section==='P04').url)}#reading-visual"/></svg>`:''}<span>0${i+1}</span><h3>${title}''')
replace('`<div class="ef-comparison">', '''`${editorialFigure('P07',t('模型与生活经验保持独立，由本人对照','Model and lived experience remain distinct, compared by you'))}<div class="ef-comparison">''')
replace("const im=e.target;im.hidden=true;", "const im=e.target;im.hidden=true;if(im.dataset.efR2Image){const fallback=im.parentElement.querySelector('[data-ef-scene-fallback],[data-ef-hero-art]');if(fallback){fallback.hidden=false;return;}}")
assert S.read_text()==old
S.write_text(text)
css='''
/* R2 presentation successor — page scope only; full source artworks remain intact. */
.ecr-flagship .ef-hero{background:var(--ef-paper);color:var(--ef-ink);padding:60px 0 64px}.ecr-flagship .ef-hero h1{color:var(--ef-ink)}.ecr-flagship .ef-hero .ef-kicker{color:#816331}.ecr-flagship .ef-hero .ef-hero-caption{color:#526866}.ecr-flagship .ef-hero .ef-button{color:var(--ef-teal);border-color:var(--ef-teal)}.ecr-flagship .ef-hero a.ef-button.ef-button--primary{background:var(--ef-teal);color:#fff!important}.ecr-flagship .ef-hero-visual{min-width:0;align-self:center}.ecr-flagship .ef-hero-visual>img{display:block;width:100%;height:auto;object-fit:contain;border-radius:10px}.ecr-flagship .ef-hero-art{filter:none}.ecr-flagship .ef-editorial-figure{margin:12px 0 26px;background:linear-gradient(120deg,#fcfaf4,#eaf0e9);border-radius:12px;padding:12px 26px;overflow:hidden}.ecr-flagship .ef-editorial-figure>img{display:block;width:100%;height:auto;object-fit:contain}.ecr-flagship .ef-editorial-figure figcaption{text-align:center;font-size:13px;color:#526866;padding:0 0 12px}.ecr-flagship .ef-editorial-P04>img{max-height:310px}.ecr-flagship .ef-editorial-P07>img{max-height:420px}.ecr-flagship .ef-origin-map{margin-top:20px}.ecr-flagship .ef-source-node{background:transparent!important;box-shadow:none!important}.ecr-flagship .ef-context{background:#eeeae0;color:var(--ef-ink)}.ecr-flagship .ef-context h2{color:var(--ef-ink)}.ecr-flagship .ef-context .ef-kicker{color:#816331}.ecr-flagship .ef-context .ef-button{color:var(--ef-teal);border-color:#7f9991}.ecr-flagship .ef-context .ef-button[aria-pressed=true]{background:var(--ef-teal);color:#fff}.ecr-flagship .ef-scene-art{width:100%;aspect-ratio:4/3;position:relative;display:flex;align-items:center;justify-content:center;background:#e5e8df;border-radius:10px;overflow:hidden}.ecr-flagship .ef-scene-art>img{display:block;width:100%;height:100%;object-fit:contain}.ecr-flagship .ef-scene-copy{border-color:#b7c5b9}.ecr-flagship .ef-scene-copy strong{color:#305b57}.ecr-flagship .ef-flow-icon{display:none}.ecr-flagship .ef-reading-flow{margin-top:0}.ecr-flagship .ef-editorial-P03 img{max-height:370px}
@media(max-width:1000px){.ecr-flagship .ef-hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px}.ecr-flagship .ef-hero h1{font-size:42px}}
@media(max-width:620px){.ecr-flagship .ef-hero-grid{grid-template-columns:minmax(0,1fr)}.ecr-flagship .ef-hero{padding:36px 0 40px}.ecr-flagship .ef-hero h1{font-size:38px}.ecr-flagship .ef-hero-visual{margin-top:8px}.ecr-flagship .ef-editorial-figure{padding:10px 2px}.ecr-flagship .ef-editorial-P04{display:none}.ecr-flagship .ef-flow-icon{display:block;width:120px;height:120px;float:right;margin:-6px -8px 8px 12px}.ecr-flagship .ef-reading-flow li{min-height:132px}.ecr-flagship .ef-reading-flow li:after{content:'';display:block;clear:both}.ecr-flagship .ef-scene-copy{padding:12px 0}.ecr-flagship .ef-comparison{margin-top:12px}}
@media print{.ecr-flagship .ef-hero,.ecr-flagship .ef-context,.ecr-flagship .ef-editorial-figure{print-color-adjust:exact}.ecr-flagship .ef-editorial-figure{break-inside:avoid}.ecr-flagship .ef-hero-visual img{max-height:300px}.ecr-flagship .ef-flow-icon{display:none}.ecr-flagship .ef-editorial-P04{display:block}}
'''
C.write_bytes(C.read_bytes()+css.encode())
P.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print('Integrated 4 verified public WebPs and 3 native SVGs; renderer, existing card/preview authorities unchanged')
