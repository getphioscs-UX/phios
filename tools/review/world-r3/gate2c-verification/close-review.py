import json,pathlib,hashlib,datetime,html,subprocess,re,urllib.parse
from html.parser import HTMLParser
D=pathlib.Path('tools/review/world-r3/gate2c-verification'); ROOT=pathlib.Path('tools/review/world-r3/WORLD-R3-HUMAN-REVIEW.html');rd=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'));sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest();base=rd(D/'BASELINE-AND-OWNER-SNAPSHOT.json');now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def js(n,v):(D/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def md(n,v):(D/n).write_text(v.strip()+'\n',encoding='utf-8')
oldShots=[x for x in base['historicalFiles'] if x['path'].startswith('tools/review/world-r3/gate2c/') and re.search(r'Q(?:02|05|16|11)-(?:zh-Hans|en)-(?:390|1440)\.png$',x['path'])];assert len(oldShots)==16,len(oldShots)
newShots=[{'path':str(p).replace('\\','/'),'bytes':p.stat().st_size,'sha256':sha(p),'mode':'OFFLINE_PREVIEW' if not p.name.startswith('ACTUAL') else 'LOCAL_FIXTURE_EXISTING_PRODUCT'} for p in D.glob('*.png')]
js('SCREENSHOT-REFERENCES.json',{'oldFinal':oldShots,'oldCount':16,'oldBytes':sum(x['bytes'] for x in oldShots),'newFinal':newShots,'newCount':len(newShots),'newBytes':sum(x['bytes'] for x in newShots),'policy':'Only failed-stage evidence and representative final captures; no deletion or archive mutation. Existing 16 final and old failures remain unchanged. New null/error screenshots are contract specimens, not product implementation.'})
md('UX-AND-ACCESSIBILITY-REVIEW.md','''# REVIEW_ONLY / PRODUCTION_UNTESTED
Fresh browser: existing World/Search 16 unseen query observations; preserved prototype390/1440×zh/en four views. No page exceptions; zero document horizontal overflow or broken images in these four prototype views; country/year controls labelled. Direct answer begins at388–455px, visible in first900px view. Refresh, region/year and back URLs retain tested scope. Keyboard Tab exercised; screen-reader audit and physical iPhone safe-area testing NOT_PERFORMED (viewport-fit/safe-area CSS inspected only). This is not WCAG certification.

16 prior final screenshots hashed and referenced in SCREENSHOT-REFERENCES.json, retained without deletion;12 new prototype/review state specimens plus2 actual World captures. New values show actual downloaded facts; null says approval probability not measurable; error specimen explicitly rejects country/metric mismatch. No old gallery or new visual assets.

Existing prototype remains separate from production R2 and actual Ask. Existing prototype bilingual rendering, three scales, consent and handoff design have prior behavior evidence; do not call it current product state. Current R2 free question context is not fully preserved on refresh/handoff per existing audit; no source change allowed here. Actual World still shows fixed guide links and generic readings on unrelated questions; keep as Gate3 defect. Ask source insufficient/irrelevant result retained. No duplicate page architecture created: VERIFICATION-REVIEW.html is an evidence board linking the retained prototype and JSON, not a new World prototype.

Language purity is PARTIAL: new technical evidence board intentionally bilingual with metric IDs/units for audit, not customer copy. Preserved prototype tested per-language. Full error messaging, screenreader order and real-device safe areas must be verified on the eventual accepted product diff. One local selector ambiguity failed before country switch; failure record retained, select-specific harness repair only. All visual conclusions limited to checked views.
''')
md('HUMAN-REVIEW-DECISION.md','''# READY_FOR_SCOPED_HUMAN_REVIEW · PARTIAL / EVIDENCE_GAPS_OPEN
Gate1 HUMAN_ACCEPTED retained. Gate2/2B/2C historic files unchanged. No Gate3 acceptance inferred. Do not declare GATE3_PRODUCTION_READY or a working free-form answer product.

VERIFIED:97/97 prior manifest file hashes;70 independently reproduced values plus one explicit unknown; defined HMDA numerators/denominators; SLOOS standards vs demand; FHFA2024 historical workbook; four bilingual curated evidence objects; actual16 unseen UI/local handler observations;17 review-contract tests. Browser checks are independent of economic answer success.

CORRECTION: BNM saved HTTP403 is MHS directory/document page; exact XLS HTTP status remains UNVERIFIED. Dashboard download is a separate source. Original negative evidence remains intact. Older NOT_COLLECTED records for2025HMDA/2024FHFA/MYflows were legitimately superseded by raw snapshots, not copied as current blockers.

PARTIAL: original per-observation publication and revision dates, MY financial-institution/product coverage, dynamic HMDA cache-vs-release lineage, specific global numeric licences. No cross-country approval ranking. Source licence conditions do not imply production admission.

BLOCKED actual chain: World question → specific admitted source facts/paragraphs → correct scoped answer is not implemented. Local Ask produced15 insufficient responses and1 irrelevant English passage,0 evidence-complete answers. Zero-provider source composition remains a feasible Gate3 local candidate; it is not implemented this round.

Next Human decisions: accept or reject evidence corrections/bounded claims; accept first deterministic MY local candidate scope (3owner domains/4existingfiles/1existingGETAPI/2JSON objects). Only an explicit new Human ACCEPT authorises that local implementation. Full public scope handoff requires additional existing context-owner changes; any production release, paid synthesis and scheduler remain separate.

Production identity/runtime source match, D1 isolation and global provider accounting are UNVERIFIED. This task invoked no production APIs, D1 operations, provider model/payment/refund, commit/push/deploy or asset deletion. Provider calls/cost attributable to this task=0/USD0; this is not an audit of account-wide historic spend.
''')
md('CHECKPOINT.md',f'''# Recoverable checkpoint
At {now}; baseline HEAD {base['head']}. Run scripts only within gate2c-verification; no product implementation. Reproduction command: bundled Python reproduce-sources.py; read-only raw files. Browser evidence and final node handler responses are saved; do not rerun old builders that overwrite gate2c history. Completed: chain audit, MY/US reproduction, rights stages, eight evidence objects,16 unseen observations,17 contract assertions, representative preview.

Next uncompleted external decision: Human evidence review and separate Gate3 local authorisation. Next technical scope only after acceptance: GATE3-MINIMAL-SCOPED-PLAN.md. Keep current zero-call/no-production boundary. Final source/history preservation proof in FINAL-INTEGRITY.json. No pending paid/remote mutation task exists.
''')
required=['BASELINE-AND-OWNER-SNAPSHOT.json','REVIEW-LINK-INTEGRITY.json','EVIDENCE-CHAIN-RECONCILIATION.json','CLAIM-BY-CLAIM-VERDICT.md','MY-SOURCE-REPRODUCTION.json','MY-MORTGAGE-CLAIMS.md','MY-UNMEASURABLE-GAPS.md','US-HMDA-METHOD-REPRODUCTION.json','US-SLOOS-SCOPE-CHECK.md','US-FHFA-COVERAGE-CHECK.md','GLOBAL-SOURCE-READINESS.json','COMPARABILITY-COUNTEREXAMPLES.md','LICENSE-BLOCKERS.md','EVIDENCED-ANSWERS/REVIEW.json','UNSEEN-QUESTION-EVALUATION.json','ANSWER-CAPABILITY-MATRIX.md','GATE3-MINIMAL-SCOPED-PLAN.md','GATE3-FILE-OWNER-MAP.json','GATE3-GO-NOGO-CRITERIA.md','DATA-QUALITY-RELEASE-CONTRACT.md','REVISION-AND-FAILURE-TESTS.json','UX-AND-ACCESSIBILITY-REVIEW.md','QUESTION-TO-ANSWER-BROWSER-EVIDENCE.json','HUMAN-REVIEW-DECISION.md']
# Missing integrity file is created below; links validated after append.
start='<!-- WORLD_R3_GATE2C_VERIFICATION_START -->';end='<!-- WORLD_R3_GATE2C_VERIFICATION_END -->';current=ROOT.read_bytes();
if start.encode() in current:
 a=current.index(start.encode());b=current.index(end.encode(),a)+len(end.encode())
 if current[b:b+1]==b'\n':b+=1
 current=current[:a]+current[b:]
prior=next(x for x in base['historicalFiles'] if x['path']==str(ROOT).replace('\\','/'))['sha256'];assert hashlib.sha256(current).hexdigest()==prior,'Review changed concurrently; do not overwrite'
section=start+'\n<section style="padding:24px;border:3px solid #266768;background:#f6f3eb;color:#102d42;margin:20px 0"><h2>Gate 2C Verification · Evidence Closure &amp; Gate 3 Readiness</h2><p><strong>READY_FOR_SCOPED_HUMAN_REVIEW · PARTIAL · GATE3_NOT_AUTHORIZED</strong></p><p>97份原材料摘要匹配；70项数值独立复算。MY金额不可推获批概率；BNM目录页403与XLS未取得分开记录。HMDA为限定行动记录拒绝占比，SLOOS为银行调查。16次陌生问题本地Ask：15来源不足、1不相关段落、0完整答案。</p><p><a href="gate2c-verification/VERIFICATION-REVIEW.html">打开实值、空值、错误拒绝及四个双语证据样板</a> · <a href="gate2c/WORLD-R3-GMCH-PROTOTYPE.html">保留原型</a></p><p>原Gate1/2/2B/2C及负面记录全部保留；没有产品源码修改、生产调用、付费模型、提交、推送或部署。生产身份及D1隔离仍未核验。</p><details open><summary>本轮全部交付</summary><ul>'+''.join('<li><a href="gate2c-verification/'+f+'">'+f+'</a></li>' for f in required)+'</ul></details><p><a href="gate2c-verification/SCREENSHOT-REFERENCES.json">原16张与新增截图：路径、数量、大小和SHA</a> · <a href="gate2c-verification/REPRESENTATIVE-BROWSER-REVIEW.json">本轮浏览器记录</a> · <a href="gate2c-verification/FINAL-INTEGRITY.json">最终保护与范围核对</a></p><p><a href="gate2c-verification/RETAINED-VALUES-390-zh-Hans.png">手机实值画面</a> · <a href="gate2c-verification/EVIDENCE-null-390-zh-Hans.png">空值画面</a> · <a href="gate2c-verification/EVIDENCE-error-1440-en.png">错误拒绝画面</a></p><p>下一决定：审核本轮证据；如接受，再明确授权Gate3最小本地候选。最小第一链拟复用3个owner域、4个既有文件、1个GET API、2个JSON对象；费用上限0。</p></section>\n'+end+'\n'
# Insert at beginning of body without altering a single old byte.
m=re.search(br'<body[^>]*>',current,re.I);pos=m.end() if m else current.find(b'<!-- WORLD_R3_GATE2C_START -->');assert pos>=0
ROOT.write_bytes(current[:pos]+section.encode('utf-8')+current[pos:]);assert ROOT.read_bytes().replace(section.encode('utf-8'),b'',1)==current
# Every relative HTML href/src in original review and its old/new linked review HTMLs.
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ['href','src'] and v:self.links.append((tag,k,v))
rows=[]
for p in pathlib.Path('tools/review/world-r3').rglob('*.html'):
 if 'WORLD-R3-GMCH-PILOT-SNAPSHOTS' in str(p):continue # downloaded remote HTML is source bytes, not locally bundled site navigation
 parser=Links();parser.feed(p.read_text(encoding='utf-8-sig')); 
 for tag,attr,url in parser.links:
  u=urllib.parse.urlsplit(url)
  if u.scheme in ['http','https','data','mailto','javascript']:rows.append({'page':str(p),'url':url,'state':'EXTERNAL_OR_INLINE_NOT_FILE_EXISTENCE_ASSERTION'});continue
  if not u.path:continue
  f=pathlib.Path('.'+urllib.parse.unquote(u.path)) if u.path.startswith('/') else p.parent/urllib.parse.unquote(u.path)
  f=f.resolve()
  if f.is_dir():f=f/'index.html'
  exists=f.is_file();rows.append({'page':str(p).replace('\\','/'),'url':url,'relativeResolved':str(f),'exists':exists,'sha256':sha(f) if exists else None,'mtime':datetime.datetime.fromtimestamp(f.stat().st_mtime,datetime.timezone.utc).isoformat() if exists else None,'classification':'IMAGE' if f.suffix=='.png' else 'DATA' if f.suffix=='.json' else 'REVIEW_OR_NAVIGATION','state':'VERIFIED_LOCAL_LINK' if exists else 'MISSING_LOCAL_LINK'})
# Integrity references to this file and FINAL-INTEGRITY are self/final references; existence resolved after writes.
for row in rows:
 if row.get('relativeResolved','').endswith(('REVIEW-LINK-INTEGRITY.json','FINAL-INTEGRITY.json')):row.update(exists=True,state='FINAL_WRITE_TARGET_SELF_REFERENCE',sha256=None,mtime=None)
js('REVIEW-LINK-INTEGRITY.json',{'at':now,'links':rows,'missing':[r for r in rows if r.get('exists') is False],'hashCaveat':'Self/final manifests excluded from recursive hash; report links are local resolution only, external HTTP not implied.'})
for p in D.rglob('*.json'):rd(p)
protected=[]
for item in base['historicalFiles']:
 if item['path']==str(ROOT).replace('\\','/'):continue
 protected.append({'path':item['path'],'unchanged':pathlib.Path(item['path']).exists() and sha(item['path'])==item['sha256']})
products=[{**x,'unchanged':sha(x['path'])==x['sha256']} for x in base['productFiles']];concurrent=[{**x,'currentSha256':sha(x['path']),'unchanged':sha(x['path'])==x['sha256'],'writtenByThisTask':False} for x in base['dirtyOwners']]
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();status=subprocess.check_output(['git','status','--short'],text=True);index=subprocess.check_output(['git','diff','--cached','--name-only'],text=True)
js('FINAL-INTEGRITY.json',{'at':now,'head':head,'baselineHead':base['head'],'headUnchanged':head==base['head'],'originalReviewBytesPreservedByExactAppendRemoval':True,'historicalFiles':protected,'productFiles':products,'concurrentFiles':concurrent,'concurrentDriftNote':'BaZi evidence bytes changed during review; an additional financial checker became dirty. Task did not write either. Preserve observed concurrent work; do not assert frozen unrelated worktree.','statusAfter':status,'stagingArea':index,'providerCalls':0,'costUSD':0,'productionMutations':0,'commitPushDeploy':0,'requiredFilesExist':all((D/f).exists() for f in required),'JSONParse':'PASS','productionIdentity':'UNVERIFIED','D1Isolation':'UNVERIFIED','writesOnly':'gate2c-verification plus exact additive review block'})
assert all(x['unchanged'] for x in protected+products);assert head==base['head'];assert not index;assert all((D/f).exists() for f in required)
print(json.dumps({'oldScreenshots':len(oldShots),'newScreenshots':len(newShots),'newBytes':sum(x['bytes'] for x in newShots),'historicalFilesUnchanged':len(protected),'productFilesUnchanged':len(products),'missingLinks':len([r for r in rows if r.get('exists') is False]),'requiredFiles':len(required),'headUnchanged':True}))
