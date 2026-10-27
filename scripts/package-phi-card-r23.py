import pathlib,zipfile,json,hashlib,os
root=pathlib.Path.cwd().resolve();d=root/'tools/review/phi-card-customer-experience-r2/r23';target=root/'artifacts/PHI-CARDS-R23-FINAL-REVIEW-PACK.zip';assert target.parent.resolve()==root/'artifacts'
names=['STATUS.json','BASELINE.json','PRESERVATION.json','IMAGE-APPROVAL-PROOF.json','PHI-CARDS-R23-CONTENT-REVIEW.json','PHI-CARDS-R23-CONTENT-REVIEW-STANDALONE.html','BEFORE-AFTER-EDITORIAL.html','FORMAT-CHANGES.json','CONTENT-HASH-DIFFS.json','C01-PROVENANCE.json','PHASE-DISPLAY-CHANGES.json','NUMBERING-SOURCE-CHECKS.json','BROWSER-CHECKS.json','STANDALONE-CHECKS.json','ACCOUNT-BRIDGE.json','FINAL-REGRESSIONS.json','CROSS-PRODUCT-CLOSURE.json','BOOK1-REPAIR.json','FULL-PAGES-BUILD.json','INTEGRATION-MANIFEST.json','EXECUTION-RECORD.md']
files=[(d/n,n) for n in names]
files += [(root/'content/ecr-phi-card/customer-reading-r2'/f'{g}-source.txt','original-sources/'+g+'-source.txt') for g in 'CDGTFP']
files += [(root/'content/ecr-phi-card/customer-reading-r2/editorial-deltas-r23.json','editorial-deltas-r23.json'),(root/'content/ecr-phi-card/admission/ecr-phi-card-r2-author-acceptance-r23.json','R2-AUTHOR-APPROVAL.json')]
manifest={'policy':'Text-only evidence; no WebP/PNG/PDF, customer data, token, DB or credential. Approved baseline and unapproved editorial deltas remain separate.','entries':[{'name':n,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p,n in files]}
temp=target.with_suffix('.zip.tmp');target.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p,n in files:z.write(p,n)
 z.writestr('PACK-SHA256-MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
os.replace(temp,target)
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for row in manifest['entries']:assert hashlib.sha256(z.read(row['name'])).hexdigest()==row['sha256']
 assert not any(n.lower().endswith(('.png','.webp','.jpg','.pdf','.sqlite','.env','.pem')) for n in z.namelist())
result={'path':str(target),'bytes':target.stat().st_size,'entries':len(files)+1,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'crcAndEntryHashes':'PASS','imagesIncluded':0}
(d/'PACK-VERIFICATION.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
