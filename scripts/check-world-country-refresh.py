from pathlib import Path
import importlib.util,json,tempfile,subprocess,sys,hashlib,os
sys.dont_write_bytecode=True
root=Path(__file__).resolve().parents[1];qa=Path(os.environ.get('PHIOS_QA_TEMP_ROOT','D:/PHIOS/QA-TEMP'))/'COUNTRY-WORLD-LIFE-R4';qa.mkdir(parents=True,exist_ok=True);script=root/'scripts/refresh-world-country-evidence.py';spec=importlib.util.spec_from_file_location('refresh',script);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);pointer=json.loads((root/m.POINTER).read_text(encoding='utf-8'));candidate=json.loads((root/pointer['snapshotPath']).read_text(encoding='utf-8'));results=[]
# This suite tests promotion mechanics, not whether a live failed indicator is acceptable.
# Keep the actual live failure intact; use a clearly isolated source-success fixture.
candidate['sourceFailures']=[]
for series in candidate['series']:
 series['readStatus']='SUCCESS';series['readError']=None
 series['observations']=[max([r for r in series['observations']if r['countryCode']==code and r.get('value')is not None],key=lambda r:r['period'])for code in ['MYS','SGP','IDN']if any(r['countryCode']==code and r.get('value')is not None for r in series['observations'])]
def check(name,test):
 assert test,name
 results.append({'name':name,'status':'PASS'})
with tempfile.TemporaryDirectory(prefix='country-refresh-',dir=str(qa))as td:
 r=Path(td);(r/'content/world').mkdir(parents=True);(r/'scripts/lib').mkdir(parents=True);(r/'content/civilization-atlas/reconfiguration').mkdir(parents=True)
 initial=json.loads(json.dumps(candidate));next(x for x in initial['series'][0]['observations']if x['value']is not None)['value']-=1
 base=json.dumps(initial,ensure_ascii=False).encode();(r/m.BASELINE).write_bytes(base)
 changed=m.apply_candidate(r,candidate,True,lambda c:None);check('new successor retains original snapshot',changed['status']=='LOCAL_SUCCESSOR_APPLIED'and(r/m.BASELINE).read_bytes()==base)
 pointer=(r/m.POINTER).read_bytes();snap=(r/changed['snapshotPath']).read_bytes();m.write_atomic(r/m.STATUS,{'status':'FAILED'})
 again=m.apply_candidate(r,candidate,True,lambda c:None);check('duplicate refresh creates no new source version',again['status']=='UNCHANGED'and(r/m.POINTER).read_bytes()==pointer and(r/changed['snapshotPath']).read_bytes()==snap);check('successful unchanged refresh clears previous failure',json.loads((r/m.STATUS).read_text())['status']=='SUCCESS')
 bad=json.loads(json.dumps(candidate));bad['series'][0]['licenseStatus']='RIGHTS_PENDING'
 try:m.apply_candidate(r,bad,True);raise AssertionError('missing license accepted')
 except ValueError:check('unlicensed source fails without pointer overwrite',(r/m.POINTER).read_bytes()==pointer)
 (r/'scripts/refresh-world-country-evidence.py').write_bytes(script.read_bytes());(r/'scripts/lib/pages-json-import-preload.mjs').write_text('');(r/'scripts/validate-world-country-refresh.mjs').write_text('');(r/'scripts/build-world-country-observation-p2.mjs').write_text("throw Error('INTENTIONAL_ISOLATED_GENERATOR_FAILURE');")
 projection=r/'content/civilization-atlas/reconfiguration/world-observation-projection-v1.json';projection.write_bytes(b'old-projection');new=json.loads(json.dumps(candidate));next(x for x in new['series'][0]['observations']if x['value']is not None)['value']+=1;f=r/'candidate.json';f.write_text(json.dumps(new));run=subprocess.run([sys.executable,str(r/'scripts/refresh-world-country-evidence.py'),'--full-scope','--candidate',str(f),'--apply-local','--work-dir',str(r/'qa'),'--node',str(root/'.tmp/world-release-runtime/node.exe') if (root/'.tmp/world-release-runtime/node.exe').exists() else 'node'],capture_output=True,text=True)
 check('projection generation failure explicitly fails',run.returncode==1)
 check('failed promotion restores active pointer exactly',(r/m.POINTER).read_bytes()==pointer)
 check('failed promotion preserves original projection',projection.read_bytes()==b'old-projection')
 check('failure remains explicit for latest API',json.loads((r/m.STATUS).read_text())['status']=='FAILED')
 check('refresh lock released after failure',not(r/'.tmp/world-country-refresh.lock').exists())
 check('original historical source SHA unchanged',hashlib.sha256((root/m.BASELINE).read_bytes()).hexdigest()=='25e88c61784ecd51aaa94da18b6829fa706e4a16521b4133f518c871a5f5bace')
out={'status':'PASS','passed':len(results),'results':results,'fixture':'ISOLATED_SYNTHETIC_FAILURE_ONLY_NO_NETWORK','providerCalls':0,'productionWrites':0};(qa/'world-country-refresh-tests.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
