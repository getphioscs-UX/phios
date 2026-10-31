from pathlib import Path
import json,hashlib,subprocess,re,difflib
root=Path('C:/phios');w=root/'.worktrees/five-method-paid-report-production-r1';out=root/'tools/review/report-production-closure-r1-2';old=root/'tools/review/bazi-r1-1-publication-closure'
receipt=json.loads((old/'R1-1-SOURCE-CHANGE-RECEIPT.json').read_text(encoding='utf8'));patch=(old/'R1-1-PUBLICATION-CHANGES.patch').read_text(encoding='utf8');sha=lambda b:hashlib.sha256(b).hexdigest();records=[];delta=[]
parts=re.split(r'(?=^diff --git )',patch,flags=re.M)
for row in receipt['sourceFiles']:
 file=row['file'];chunk=next(x for x in parts if x.startswith('diff --git a/'+file+' b/'+file+'\n'))
 try:base=subprocess.check_output(['git','show',receipt['base']+':'+file],cwd=w,stderr=subprocess.DEVNULL).decode('utf8').splitlines(keepends=True)
 except subprocess.CalledProcessError:base=[]
 lines=chunk.splitlines(keepends=True);i=0;cursor=0;result=[]
 while i<len(lines):
  m=re.match(r'@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@',lines[i])
  if not m:i+=1;continue
  start=max(0,int(m[1])-1);result.extend(base[cursor:start]);cursor=start;i+=1
  while i<len(lines)and not lines[i].startswith('@@ '):
   line=lines[i];i+=1
   if line.startswith('\\ No newline'):continue
   if not line or line[0]not in ' +-':break
   if line[0]in ' -':assert base[cursor].rstrip('\r\n')==line[1:].rstrip('\r\n'),(file,cursor);cursor+=1
   if line[0]in ' +':result.append(line[1:])
 result.extend(base[cursor:]);before=''.join(result).encode('utf8')
 candidates=[before,before.replace(b'\n',b'\r\n'),before.rstrip(b'\n')]
 before=next((b for b in candidates if sha(b)==row['sha256']),None);assert before is not None,('R1.1_BASELINE_RECONSTRUCTION_SHA_FAILED',file)
 after=(w/file).read_bytes();dest=out/'source-baseline-r1-1'/file;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(before)
 changed=sha(before)!=sha(after);records.append({'file':file,'R1_1SHA':sha(before),'R1_2SHA':sha(after),'changed':changed,'baselineByteVerified':True})
 if changed:delta.extend(difflib.unified_diff(before.decode('utf8').splitlines(keepends=True),after.decode('utf8').splitlines(keepends=True),fromfile='a/'+file,tofile='b/'+file))
(out/'R1-1-TO-R1-2-MINIMAL.patch').write_text(''.join(delta),encoding='utf8')
(out/'SOURCE-CHANGE-RECEIPT.json').write_text(json.dumps({'sourceFiles':records,'changedFiles':sum(r['changed']for r in records),'acceptedCopyFilesModified':0,'R2AssetsModified':0,'deliveryOwnerFilesModified':0,'newNarrativeRuntime':False,'newOptimizer':False},indent=2),encoding='utf8')
print('SHA-verified R1.1 baseline reconstructed; minimal R1.2 patch for',sum(r['changed']for r in records),'files')
