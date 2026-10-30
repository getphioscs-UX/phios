from pathlib import Path
import subprocess,os,json,hashlib,datetime
folder=Path(__file__).parent
root=Path('C:/phios/.worktrees/world-release-main')
head='0d9089af4d0227f19867777a30eccd2c4515eb88'
node='C:/phios/.tmp/world-release-runtime/node.exe'
npm='C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js'
def git(*args):return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
assert git('rev-parse','HEAD')==head and git('rev-parse','origin/main')==head
assert git('rev-parse',head+'^{tree}')==git('rev-parse','cfe44e808e405c038a29e127198e384ccbeed424^{tree}')
assert not git('diff','--name-only')
assert (root/'package-lock.json').read_bytes()==Path('C:/phios/package-lock.json').read_bytes()
assert hashlib.sha256(Path(node).read_bytes()).hexdigest()=='c5ff4c736112dd483c750fd4149d30c8a116db1a49b8b3ec88be4b65e6c86c19'
env=os.environ.copy();env.update({'PATH':str(Path(node).parent)+';'+env['PATH'],'CF_PAGES_BRANCH':'main','CF_PAGES_COMMIT_SHA':head,'REPORT_PROVIDER_LIVE_ALLOWED':'false','WRANGLER_SEND_METRICS':'false','NODE_OPTIONS':'','WRANGLER_LOG_PATH':str(folder/'BUILD-WRANGLER.log')})
receipt={'head':head,'node':'v22.16.0','startedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sameAcceptedPRTree':True,'commands':[],'paidProviderCalls':0,'productionBusinessDataWrites':0}
try:
    for script,log in [('build:pages','BUILD.log'),('check:pages-build','CHECK-PAGES.log')]:
        print('Exact merged main starting '+script,flush=True)
        with (folder/log).open('wb') as output:
            result=subprocess.run([node,npm,'run',script],cwd=root,env=env,stdout=output,stderr=subprocess.STDOUT)
        receipt['commands'].append({'script':script,'exitCode':result.returncode,'log':log})
        assert result.returncode==0,script+' failed; see '+log
        print(script+' PASS',flush=True)
    receipt['trackedDiff']=git('diff','--name-only').splitlines()
    assert not receipt['trackedDiff'],'Unexpected source drift'
    receipt['artifacts']={name:{'bytes':(root/'.pages-output'/name).stat().st_size,'sha256':hashlib.sha256((root/'.pages-output'/name).read_bytes()).hexdigest()}for name in ['_worker.js','_routes.json']}
    receipt['status']='PASS'
finally:
    receipt['finishedUtc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    (folder/'BUILD-VALIDATION.json').write_bytes((json.dumps(receipt,indent=2)+'\n').encode())
