import pathlib,json,hashlib,zipfile,os
ROOT=pathlib.Path.cwd().resolve();D=ROOT/'tools/review/phi-card-customer-experience-r2/r21';destination=ROOT/'artifacts/PHI-CARDS-R2-HUMAN-REVIEW-PACK.zip'
assert destination.parent.resolve()==ROOT/'artifacts'
names=['PHI-CARDS-R2-CONTENT-REVIEW.json','PHI-CARDS-R2-CONTENT-REVIEW-STANDALONE.html','PHI-CARDS-R2-SEMANTIC-AUDIT.csv','PHI-CARDS-R2-ASSET-LANGUAGE-AUDIT.json','PHI-CARDS-R2-ASSET-LANGUAGE-AUDIT.csv','SEMANTIC-FINDINGS.json','ASSET-REPAIR-OPTIONS.md','README-HUMAN-REVIEW.md','STATUS.json','BASELINE-SHA256.json','PRESERVATION-SHA256.json','STANDALONE-BROWSER-CHECKS.json','RUNTIME-BROWSER-CHECKS.json','REGRESSIONS.json','BOOK-DIRECT-REGRESSIONS.json','BASELINE-FAILURE-PROVENANCE.json','EXECUTION-RECORD.md','FULL-PAGES-BUILD.json','CONCURRENT-DRIFT.json']
files=[(D/n,n) for n in names]+[(ROOT/'content/ecr-phi-card/customer-reading-r2'/f'{g}-source.txt','sources/'+g+'-source.txt') for g in 'CDGTFP']
manifest={'scope':'Text-only author review; no images, customer identity, credential, birth input or live order artifacts.','entries':[{'name':n,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p,n in files]}
destination.parent.mkdir(exist_ok=True);temp=destination.with_suffix('.zip.tmp')
with zipfile.ZipFile(temp,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p,n in files:
  assert p.is_file() and p.suffix.lower() in ['.txt','.json','.html','.csv','.md']
  z.write(p,n)
 z.writestr('PACK-SHA256-MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
os.replace(temp,destination)
with zipfile.ZipFile(destination) as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(files)+1
 for row in manifest['entries']:assert hashlib.sha256(z.read(row['name'])).hexdigest()==row['sha256']
 assert not any(n.lower().endswith(('.webp','.png','.jpg','.pdf','.sqlite','.env','.pem')) for n in z.namelist())
result={'path':str(destination),'bytes':destination.stat().st_size,'sha256':hashlib.sha256(destination.read_bytes()).hexdigest(),'entries':len(files)+1,'manifestContentBytes':sum(r['bytes'] for r in manifest['entries']),'crcCheck':'PASS','entryHashChecks':'ALL_PASS','imagesIncluded':0,'customerDataIncluded':False}
(D/'PACK-VERIFICATION.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
