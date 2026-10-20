from pathlib import Path
import json,hashlib,subprocess,datetime,re,ast
root=Path('C:/phios');base=root/'tools/review/reality-information-contract-r1';out=base/'L1'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,data):p.write_bytes(json.dumps(data,ensure_ascii=False,indent=2).encode('utf-8'))
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True,encoding='utf-8').rstrip()
now=datetime.datetime.now(datetime.timezone.utc).isoformat();pre=read(out/'PRECHECK.json');head=git('rev-parse','HEAD')
assert head==pre['head'],('HEAD_CHANGED_RECHECK_REQUIRED',head)
owner_drift=[r['path'] for r in pre['sharedOwners'] if sha(root/r['path'])!=r['sha256']]
assert not owner_drift,('SHARED_OWNER_DRIFT_STOP',owner_drift)
r0=read(base/'R0-FILE-SHA-MANIFEST.json');r0_drift=[r['path'] for r in r0['files'] if not (root/r['path']).is_file() or sha(root/r['path'])!=r['sha256']]
assert not r0_drift,('READ_DEPENDENCY_BASELINE_DRIFT_STOP',r0_drift)
accepted=read(out/'ACCEPTED-R2-DELIVERY-MANIFEST.json');allowed_successors={'RIC-HUMAN-REVIEW.html':'accepted-r2-review.html','RIC-MASTER-STATE.json':'accepted-r2-master-state.json'}
r2=[]
for row in accepted['files']:
 p=out/allowed_successors[row['path']] if row['path'] in allowed_successors else base/row['path']
 assert p.exists() and sha(p)==row['sha256'],('ACCEPTED_R2_DRIFT',row['path'])
 r2.append({'path':row['path'],'verifiedPath':p.relative_to(base).as_posix(),'sha256':row['sha256']})
assert sha(base/'DELIVERY-MANIFEST.json')==sha(out/'ACCEPTED-R2-DELIVERY-MANIFEST.json')
http_log=(out/'HTTP-TEST.log').read_text(encoding='utf-8-sig');assert re.search(r'tests 5',http_log) and re.search(r'pass 5',http_log) and re.search(r'fail 0',http_log)
browser=read(out/'BROWSER-EVIDENCE.json');assert browser['status']=='PASS_LOCAL_REAL_HTTP_BROWSER' and len(browser['records'])==4
for path,digest in browser['dependencyHashes'].items():assert sha(root/path)==digest,('BROWSER_INPUT_DRIFT',path)
compile=read(out/'COMPILE.json');assert compile['status']=='PASS_LOCAL_COMPILE';assert compile['sourceSHA256']==sha(root/compile['source'])
http=read(out/'HTTP-EVIDENCE.json');field=next(r for r in http['records'] if r.get('proof')=='FIELD_PRESERVATION')
matrix=[{'field':key,'before':value,'after':field['sourceAfter'].get(key),'status':'PRESERVED' if key in field['sourceAfter'] and value==field['sourceAfter'][key] else 'FAIL'} for key,value in field['sourceBefore'].items()]
assert all(r['status']=='PRESERVED' for r in matrix)
write(out/'SOURCE-FIELD-PRESERVATION.json',{'status':'PASS_REAL_HTTP_EXISTING_WORKSPACE','sourceFields':matrix,'permission':field['permission'],'unknowns':field['unknowns'],'limitations':field['limitations'],'derivedCalculationInputSources':3,'allThreeSourcesComparedInFourBrowserViews':True,'publishedAtNullPreserved':True,'originalNature':'PUBLIC_STATISTIC and separate DERIVED_CALCULATION; never a personal fact'})
status=git('status','--short');staged=git('diff','--cached','--name-status');source_paths=['functions/customer-projection/ric-world-session.js','assets/customer-ui/js/surfaces/ric-world-session-panel.js']
unrelated=[]
for line in status.splitlines():
 p=line[3:]
 if p.startswith('tools/review/reality-information-contract-r1/') or p in source_paths:continue
 file=root/p
 unrelated.append({'status':line[:2],'path':p,'sha256':sha(file) if file.is_file() else None,'handling':'UNTOUCHED_BY_RIC'})
prior_changes=[{'path':r['path'],'before':r['sha256'],'now':sha(root/r['path']) if (root/r['path']).is_file() else None} for r in pre['excluded']]
write(out/'OWNER-INTEGRITY.json',{'head':head,'sharedOwnerCount':len(pre['sharedOwners']),'sharedOwnerDrift':owner_drift,'sharedOwners':pre['sharedOwners'],'sourceBaselineFilesRechecked':len(r0['files']),'sourceBaselineDrift':r0_drift,'unrelatedWorktreeEntries':unrelated,'concurrentActivity':[r for r in prior_changes if r['before']!=r['now']],'indexAfter':staged,'gitStatus':status,'sourceWritesLimitedTo':source_paths,'sharedWorldBaZiFinanceOwnersEdited':False})
write(out/'R2-ACCEPTED-INTEGRITY.json',{'status':'PASS_ACCEPTED_BYTES_RETAINED','acceptedFiles':r2,'humanAcceptance':'Explicit R0-R2 LOCAL CANDIDATE acceptance in conversation','originalManifestPreserved':True,'R2OriginalTestsRerun':47,'R2RerunExitCode':0,'generatedResultRestoration':'Only the test-generated result was restored exactly to its accepted digest after recording the separate rerun; no assertion, test or frozen hash changed.'})
summary={'at':now,'status':'GATE_R3_L1_READY_FOR_HUMAN_REVIEW','head':head,'humanAcceptance':'R2_LOCAL_CANDIDATE_ACCEPTED_L1_PENDING','R2Tests':{'tests':47,'pass':47,'exitCode':0},'localHTTP':{'scenarioGroups':5,'pass':5,'exitCode':0},'browser':{'locales':['zh-Hans','en'],'widths':[1440,390],'fullFlows':4,'exitCode':0,'defaultNoSelection':True,'explicitRefusal':True,'purposeChangeDenied':True,'sessionIsolation':True,'revocation':True,'expiry':True,'refreshAndBack':True,'sourceReplacement':True,'transportFailure':True},'compile':'PASS_LOCAL_NOT_DEPLOYED','sourceFieldsPreserved':len(matrix),'sharedOwnerDrift':[],'production':'RUNTIME_UNVERIFIED_NOT_AUTHORIZED','persisted':False,'relationEdges':0,'history':'NO_VERIFIED_HISTORY','providerCalls':0,'costUSD':0,'productionD1R2Writes':0,'paymentsRefunds':[0,0],'commitPushDeploy':[0,0,0],'next':'STOP for R3-L1 Human Review; no official route activation, persistence, verified history, account access or production integration authorized.'}
write(out/'CHECKPOINT.json',summary)
write(out/'EXECUTION-RECEIPT.json',{'at':now,'commands':[{'command':'node --test tools/review/reality-information-contract-r1/tests/ric.test.mjs','exitCode':0,'tests':47,'phase':'Before product changes; accepted artifacts verified and preserved'},{'command':'node --import ./scripts/lib/pages-json-import-preload.mjs --test tools/review/reality-information-contract-r1/L1/integration.test.mjs','exitCode':0,'testGroups':5},{'command':'node --import ./scripts/lib/pages-json-import-preload.mjs tools/review/reality-information-contract-r1/L1/browser.mjs','exitCode':0,'fullBrowserFlows':4},{'command':'esbuild bundle functions/customer-projection/ric-world-session.js with write:false; node --check both new product modules','exitCode':0,'bundlePersisted':False},{'command':'git diff --check -- functions/customer-projection/ric-world-session.js assets/customer-ui/js/surfaces/ric-world-session-panel.js tools/review/reality-information-contract-r1','exitCode':0,'note':'Tracked diff check supplemented by executable tests and syntax checks of untracked files'}],'failedAttempts':[{'phase':'First local HTTP attempt','reason':'Windows sandbox EACCES on loopback socket','resolution':'Reran same local-only test in matching authorized execution context; no production fallback'},{'phase':'Read-only process inventory on resume','reason':'CIM inventory unavailable; own read-only diagnostic stopped','resolution':'Used actual test exits, bound evidence and local preview health instead'}],'boundedLimitations':['Anonymous local transport-session isolation, not production account authentication','Real 2024/2025 source/scope replacement, not a fabricated same-period revision','Ask reference owner invoked, not model synthesis or persistent Journey handoff'],'providerCalls':0,'costUSD':0,'productionMutation':0})
master=read(out/'accepted-r2-master-state.json');master.update(at=now,humanAcceptance='R0_R2_LOCAL_CANDIDATE_ACCEPTED_R3_L1_PENDING',R2='HUMAN_ACCEPTED_LOCAL_CANDIDATE',R3L1=summary['status'],status=summary['status'],productIntegrated='LOCAL_OPT_IN_CONSUMER_ONLY_NO_PRODUCTION_ROUTE',currentCheckpoint='L1/CHECKPOINT.json',next=summary['next']);write(base/'RIC-MASTER-STATE.json',master)
doc=out/'OWNER-AND-LIMITS.md';text=doc.read_text(encoding='utf-8')
addition='''

## Final successor binding

An answer version binds the exact original question, language and public source version. A separate sourceVersion is used for fresh public-source rechecks. Reusing the same sources for a different question or language does not carry prior selection forward; old answer/claim IDs are rejected. Five HTTP scenario groups pass, including this replay denial. Four complete bilingual viewport flows validate the actual API response and RDG state. The final compiled consumer is hash-bound in COMPILE.json; no bundle was written or deployed.

SOURCE-FIELD-PRESERVATION.json gives the before/after values for every retained source field. OWNER-INTEGRITY.json records unchanged shared owners and separately records concurrent external work without changing it. R2-ACCEPTED-INTEGRITY.json preserves the original accepted files; only the unique review and current master journal are successor updates, with original bytes archived.
'''
if '## Final successor binding' not in text:doc.write_text(text+addition,encoding='utf-8')
shots=[{'path':p.relative_to(base).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in out.glob('product-*.png')]
write(out/'SCREENSHOT-INVENTORY.json',{'newRepresentativeCount':len(shots),'bytes':sum(r['bytes'] for r in shots),'screenshots':shots,'references':'Unique RIC-HUMAN-REVIEW.html L1 section','archivePlan':'Retain these four final views and original accepted R2 views; no duplicate run archives, no deletion or cleanup performed.'})
paths=[root/x for x in source_paths]+[base/'RIC-HUMAN-REVIEW.html',base/'RIC-MASTER-STATE.json']+[p for p in out.rglob('*') if p.is_file() and p.name!='DELIVERY-MANIFEST.json']
files=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in paths]
write(out/'DELIVERY-MANIFEST.json',{'at':now,'status':summary['status'],'head':head,'files':files,'selfHashExcluded':True,'productionSourceFiles':source_paths,'newPersistentStore':False,'deployed':False})
print(json.dumps({'status':summary['status'],'head':head,'sharedOwnerDrift':owner_drift,'sourceFields':len(matrix),'files':len(files),'screenshots':len(shots),'screenshotBytes':sum(r['bytes'] for r in shots)}))
