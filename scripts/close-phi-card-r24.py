import pathlib,json,hashlib,subprocess,datetime,zipfile,os,re
root=pathlib.Path.cwd();d=root/'tools/review/phi-card-customer-experience-r2/r24'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,v):(d/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def git(*args):return subprocess.check_output(['git',*args],text=True,encoding='utf-8').strip()
baseline=read(d/'BASELINE.json');preserved=[dict(x,actualSha256=sha(root/x['path']),status='PASS' if sha(root/x['path'])==x['sha256'] else 'FAIL') for x in baseline['protected']];assert all(x['status']=='PASS' for x in preserved)
write('PRESERVATION.json',{'status':'PASS','files':preserved,'count':len(preserved)})
browser=read(d/'BROWSER-CHECKS.json');offline=read(d/'STANDALONE-CHECKS.json');editorial=read(d/'EDITORIAL-BROWSER-CHECKS.json');reg=read(d/'REGRESSIONS.json');build=read(d/'FULL-PAGES-BUILD.json');account=read(d/'ACCOUNT-BRIDGE.json')
assert browser['passed']==192 and offline['passed']==96 and editorial['status']=='PASS' and len(reg['rows'])==14 and all(x['status']=='PASS' for x in reg['rows']) and build['exitCode']==0
images=read(root/'tools/review/phi-card-customer-experience-r2/r23/IMAGE-APPROVAL-PROOF.json')
for x in images['images']:assert sha(root/('.tmp/phi-card-customer-experience-r1/assets/'+x['cardId']+'.webp'))==x['sha256']
write('IMAGE-APPROVAL-PROOF.json',images)
deltaPath=root/'content/ecr-phi-card/customer-reading-r2/editorial-deltas-r24.json';deltas=read(deltaPath)
status={'status':'PARTIAL','reason':'20 targeted semantic deltas remain editorial recommendations, not user-approved prose. Production Account not verified; final externally merged HEAD build not rerun.','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'cards':48,'localeVersions':96,'targetedDeltas':20,'targetedApproval':'TARGETED_DELTA_REVIEW_REQUIRED','approvedBaseline':'R2_BASELINE_CONTENT_APPROVED','bilingualImages':'BILINGUAL_IMAGE_USER_APPROVED','runtimeBrowser':192,'standalone':96,'editorialBrowser':20,'crossProductRegressions':'14/14 PASS','fullPagesBuild':'PASS','account':'PASS_ISOLATED_SIGNED_OIDC','productionAccount':'NOT_RUN_NOT_LIVE_CUSTOMER_VERIFIED','providerCalls':0,'productionWrites':0,'stripeChanges':0,'commit':False,'push':False,'deploy':False}
write('STATUS.json',status)
head=git('rev-parse','HEAD');remote=git('rev-parse','origin/main');remoteFiles=git('diff','--name-status',baseline['head']+'..origin/main').splitlines();branches=git('branch','--no-merged').splitlines()
own=['scripts/prepare-phi-card-r24.mjs','scripts/check-phi-card-r24-editorial.mjs','scripts/close-phi-card-r24.py','scripts/check-phi-card-r23.mjs','scripts/check-phi-card-r23-offline.mjs','scripts/check-phi-card-r23-account.mjs','scripts/check-phi-card-r23-regressions.mjs','scripts/export-phi-card-r23-review.mjs','scripts/lib/phi-card-r23-evidence-redirect.mjs','scripts/lib/phi-card-customer-local.mjs','content/ecr-phi-card/customer-reading-r2/editorial-deltas-r24.json']
manifest={'localBranch':git('branch','--show-current'),'localHead':head,'remoteMainVerifiedByLsRemote':'bfc5c5ab5393a0c5621e8dcac8f37e9f891dd1fa','localOriginTracking':remote,'headAheadBehind':git('rev-list','--left-right','--count','HEAD...origin/main'),'remoteChangedFiles':remoteFiles,'directPathOverlapWithPhiCards':False,'notMergedBranches':branches,'branchesNotModified':True,'scopeFiles':[{'path':p,'sha256':sha(root/p)} for p in own],'evidenceDirectory':str(d.relative_to(root)),'parentCandidateManifest':'tools/review/phi-card-customer-experience-r2/r23/INTEGRATION-MANIFEST.json','parentIntegrationRequired':'R24 extends R23; shared workspace received external commits during execution. Check which scoped files already exist at final HEAD; do not recreate or overwrite those commits.','sharedHunkReview':['.gitignore','content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html'],'protectedPreexistingChanges':baseline['dirty'],'plan':['Keep R23/R1 records, Frozen Registry, approved 96 baseline texts and original images intact.','Review only listed R24 changes and shared-file hunks; never stage all dirty files.','Initial remote Figure Story Deck delta affected 7 other paths (initial ancestry 0 local / 15 remote). External commits/merge changed local HEAD during execution; this task did not commit or merge.','Keep all 20 deltas pending; explicit semantic acceptance required before applying to approved runtime prose.','Do not commit, push, deploy, change Stripe, paid Provider or production storage without new authorization.'],'commit':False,'push':False,'deploy':False}
status['finalGitObservation']={'initialHead':baseline['head'],'finalHead':head,'changedExternallyDuringExecution':head!=baseline['head'],'taskCommitMergePushDeploy':False,'fullBuildScope':'Completed local candidate before external merge; final merged HEAD full build NOT_RUN'}
write('STATUS.json',status)
manifest['finalGitObservation']=status['finalGitObservation']
write('INTEGRATION-MANIFEST.json',manifest)
source=pathlib.Path('C:/Users/Guest Account/Desktop/PHI-CARDS-R23-EDITORIAL-REVIEW-DECISION-AND-CODEX-STEP.md');(d/'EDITORIAL-RECOMMENDATION-SOURCE.md').write_bytes(source.read_bytes())
record='''# PHI Cards R2.4 targeted editorial continuation

Attachment fully read; explicitly EDITORIAL_RECOMMENDATION, not user acceptance. No targeted delta was approved automatically.

F05 both original R23 additions preserved exactly and moved into the Work example, before Family. F07 English unchanged from R23 candidate, Chinese exact refined attachment text. Eight Phase bilingual boundaries extracted verbatim from attachment, individually retained. Technical lineage and current approved prose unchanged. All 20 remain TARGETED_DELTA_REVIEW_REQUIRED. Runtime disclosure exposes selected-locale candidates only; pending content is not adopted as approved prose.

Reused existing reader, locale control, ECR selection, Account, tests and Pages builder. Test/export scripts accept a scoped output directory so previous R23 receipts remain separate. R23 full-text JSON/HTML reproduced byte-identically to previous ZIP after correcting an initial local output-directory harness setup issue; no historical content changes remain. Original six source files, Frozen authorities and R1 records hash-verified unchanged.

192 runtime browser checks, 96 offline checks and 20 exact candidate/placement checks PASS. Fourteen regressions including signed isolated OIDC Account, ECR mapping, Books, local Stripe, entitlement and delivery PASS. First candidate test had a case-sensitive UI-label assertion; only the test was corrected, then fully rerun PASS. No ignored test failures. Existing R23 source Book1 fixes retained. Old unrelated R3.1 membership recharge failure is not claimed fixed by these 14 scoped tests.

Desktop/mobile screenshots retained at stable current filenames. F07 Chinese work-example placement and P07 English before/after visually inspected: readable, no horizontal clipping. Viewport screenshots naturally require scrolling for full long prose. Semantic acceptance is still human-only.

Complete local Pages build PASS; raw log retained. Live production login NOT_RUN. No Live Stripe, paid model, production D1/R2 or deployment used. Other-window dirty changes preserved; no branch checkout, merge, commit, push, clean or reset performed.

Local main 659d7b0d; remote main bfc5c5ab, 15 commits ahead across 7 Figure Story Deck paths. Read-only comparison showed no direct overlap with scoped PHI Cards paths. Remote integration still requires review in the dirty shared workspace.

Outcome PARTIAL: 20 semantic deltas require targeted user acceptance; production customer verification remains unperformed. No additional baseline copy approval or monolingual image assets required.
'''
record+='\n## Concurrent Git change\nInitial HEAD '+baseline['head']+'; final observed HEAD '+head+'. External commit/merge occurred during this task, not initiated here. Earlier initial ancestry/remote statements describe the starting audit only. All test results and completed build apply to the tested local candidate before that merge. Final merged HEAD full Pages build NOT_RUN. No rollback or overwrite performed.\n'
(d/'EXECUTION-RECORD.md').write_text(record,encoding='utf-8')
master=root/'content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';html=master.read_text(encoding='utf-8');prefix='../../../tools/review/phi-card-customer-experience-r2/r24/'
links=[('BEFORE-AFTER-EDITORIAL.html','20 precise before/after candidates — 待批准'),('PHI-CARDS-R23-CONTENT-REVIEW-STANDALONE.html','48-card / 96-language standalone current reading'),('EDITORIAL-CHECKS.json','20 individual statuses and SHA256'),('EDITORIAL-BROWSER-CHECKS.json','20 rendered candidate checks'),('BROWSER-CHECKS.json','192 live local browser checks'),('STANDALONE-CHECKS.json','96 offline checks'),('REGRESSIONS.json','14 scoped regressions'),('ACCOUNT-BRIDGE.json','Isolated signed OIDC Account'),('FULL-PAGES-BUILD.log','Actual full Pages build log'),('PRESERVATION.json','17 protected file hashes'),('INTEGRATION-MANIFEST.json','Remote differences / safe integration'),('STATUS.json','Actual current status'),('EXECUTION-RECORD.md','Execution record')]
block='<!-- PHI-CARDS-R24-BEGIN --><div id="phi-cards-r24-editorial"><h3>R2.4 latest targeted editorial review · PARTIAL</h3><p>20/20 TARGETED_DELTA_REVIEW_REQUIRED. Attachment is an editorial recommendation, not user approval. F05/F07 insertions are placed under Work; all 16 Phase boundaries are individual exact candidates. Approved 96 baseline texts remain unchanged. Images remain BILINGUAL_IMAGE_USER_APPROVED.</p><p>'+ ' · '.join('<a href="'+prefix+p+'">'+label+'</a>' for p,label in links)+'</p><p>PASS: runtime 192/192; offline 96/96; editorial 20/20; regressions 14/14; full Pages build; isolated signed OIDC Account. Live production Account NOT_RUN. Initial local 659d7b0d / remote bfc5c5ab. Shared workspace externally committed/merged during execution; final observed local HEAD '+head[:8]+'. No Git mutation initiated by this task. Completed build applies to pre-merge candidate; final merged HEAD build NOT_RUN. Provider 0; no production writes, Stripe changes, commit, push or deploy.</p><details><summary>Current actual screenshots / 当前实际截图</summary>'+''.join('<a href="'+prefix+p.name+'">'+p.stem+'</a> · ' for p in sorted(d.glob('*.png')))+'</details><p><a href="../../../artifacts/PHI-CARDS-R24-EDITORIAL-REVIEW-PACK.zip">R24 lightweight full-text evidence ZIP</a></p></div><!-- PHI-CARDS-R24-END -->'
if '<!-- PHI-CARDS-R24-BEGIN -->' in html:html=re.sub(r'<!-- PHI-CARDS-R24-BEGIN -->.*?<!-- PHI-CARDS-R24-END -->',lambda _:block,html,flags=re.S)
else:
 start=html.index('id="phi-cards-r23-final-closure"');end=html.index('</section>',start);html=html[:end]+block+html[end:]
master.write_bytes(html.encode('utf-8'))
ignore=root/'.gitignore';s=ignore.read_text(encoding='utf-8');rule='/artifacts/PHI-CARDS-R24-EDITORIAL-REVIEW-PACK.zip';
if rule not in s:ignore.write_bytes((s+'\n'+rule+'\n').encode('utf-8'))
target=root/'artifacts/PHI-CARDS-R24-EDITORIAL-REVIEW-PACK.zip';files=[(p,p.name) for p in sorted(d.iterdir()) if p.is_file() and p.suffix in ['.json','.html','.md','.log'] and p.name!='PACK-VERIFICATION.json'];files.append((deltaPath,'editorial-deltas-r24.json'))
temp=target.with_suffix('.zip.tmp')
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p,n in files:z.write(p,n)
 z.writestr('SHA256-MANIFEST.json',json.dumps([{'name':n,'sha256':sha(p)} for p,n in files],indent=2))
os.replace(temp,target)
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for p,n in files:assert hashlib.sha256(z.read(n)).hexdigest()==sha(p)
write('PACK-VERIFICATION.json',{'path':str(target),'bytes':target.stat().st_size,'sha256':sha(target),'crcAndHashes':'PASS','imagesIncluded':0})
for p,_ in links:assert (d/p).exists()
print(json.dumps({'status':'PARTIAL','preserved':len(preserved),'deltas':20,'runtime':192,'offline':96,'regressions':14,'build':'PASS','zipBytes':target.stat().st_size}))
