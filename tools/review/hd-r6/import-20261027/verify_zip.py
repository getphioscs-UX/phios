from pathlib import Path,PurePosixPath
import zipfile,hashlib,json,subprocess,sys,stat
zip_path=Path('C:/Users/Guest Account/Desktop/PHIOS-HD-R6-FOUR-SECTION-AUTHORING-HANDOFF-20261027.zip')
out=Path('tools/review/hd-r6/import-20261027'); isolated=Path('.tmp/hd-r6-import-20261027/raw').resolve()
if isolated.exists(): raise RuntimeError('ISOLATED_INPUT_ALREADY_EXISTS_VERIFY_BEFORE_REUSE')
archive=zipfile.ZipFile(zip_path)
bad=archive.testzip()
if bad: raise RuntimeError('ZIP_CRC_FAILED:'+bad)
names=archive.namelist()
if len(names)!=len(set(names)): raise RuntimeError('DUPLICATE_ARCHIVE_PATH')
if sum(i.file_size for i in archive.infolist())>10*1024*1024: raise RuntimeError('UNEXPECTED_ARCHIVE_SIZE')
for entry in archive.infolist():
    p=PurePosixPath(entry.filename)
    if p.is_absolute() or '..' in p.parts or '\\' in entry.filename or ':' in entry.filename or stat.S_ISLNK(entry.external_attr>>16): raise RuntimeError('UNSAFE_ZIP_PATH')
roots={n.split('/')[0] for n in names}
if len(roots)!=1:raise RuntimeError('MULTIPLE_PACKAGE_ROOTS')
root=next(iter(roots))+'/'
manifest=json.loads(archive.read(root+'manifest.json'))
rows=[]
for item in manifest['files']:
    b=archive.read(root+item['path']); actual=hashlib.sha256(b).hexdigest()
    rows.append({'path':item['path'],'expectedSHA256':item['sha256'],'actualSHA256':actual,'bytes':len(b),'match':actual==item['sha256'] and len(b)==item['sizeBytes']})
result={'status':'PASS' if all(r['match'] for r in rows) else 'FAIL','zipSHA256':hashlib.file_digest(zip_path.open('rb'),'sha256').hexdigest(),'zipCRC':'PASS','zipBytes':zip_path.stat().st_size,'packageId':manifest['packageId'],'internalRoot':root,'manifestFileSHA256':hashlib.sha256(archive.read(root+'manifest.json')).hexdigest(),'files':rows,'manifestUnlistedFiles':[n[len(root):] for n in names if n[len(root):] not in {x['path'] for x in manifest['files']}],'unlistedEvidencePolicy':'manifest self and bundled qa result are independently hashed; old qa result is not this-machine evidence','allEntryHashes':[{'path':n[len(root):],'sha256':hashlib.sha256(archive.read(n)).hexdigest(),'bytes':len(archive.read(n))} for n in names]}
(out/'ZIP-VERIFICATION.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if result['status']!='PASS':raise RuntimeError('MANIFEST_HASH_MISMATCH')
isolated.mkdir(parents=True)
archive.extractall(isolated)
base=isolated/root
# Script was read and inspected before execution: stdlib only, offline checks, no mutations.
run=subprocess.run([sys.executable,'-I',str(base/'qa/check_package.py')],cwd=base,capture_output=True,text=True,encoding='utf-8',env={'PYTHONIOENCODING':'utf-8','SYSTEMROOT':'C:/Windows'})
(out/'PACKAGE-QA.log').write_text(run.stdout+'\n'+run.stderr,encoding='utf-8')
(out/'PACKAGE-QA-COMMAND.json').write_text(json.dumps({'command':'python -I <isolated>/qa/check_package.py','exitCode':run.returncode,'scope':'Offline package structural QA only; not semantic/rights/consumer validation','isolatedRoot':str(base),'noSourceOrHistoricalReceiptWrites':True},indent=2),encoding='utf-8')
print(json.dumps({'manifest':result['status'],'verifiedFiles':len(rows),'crc':result['zipCRC'],'packageQAExitCode':run.returncode,'isolatedRoot':str(base)}))
if run.returncode:raise SystemExit(run.returncode)
