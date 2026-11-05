"""Read-only PDF/receipt reconciliation; never generates or edits report bytes."""
import hashlib,json,sys,pathlib
from pypdf import PdfReader
root=pathlib.Path(sys.argv[1])
assert str(root).replace('\\','/').startswith('D:/PHIOS/QA-TEMP/SIX-METHOD-R2/')
result=json.loads((root/'NATIVE-DELIVERY-RESULT.json').read_text(encoding='utf-8'))
cold={r['method']:r for r in result['coldReopen']['rows']}
def identity(p):
 b=p.read_bytes()
 return {'path':str(p),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def outlines(items):
 return sum(outlines(v) if isinstance(v,list) else 1 for v in items)
rows=[]
for r in result['rows']:
 m=r['method'];pdf=root/(m+'-SYNTHETIC-DELIVERY.pdf');fid=identity(pdf)
 assert fid['sha256']==r['pdfSHA256']==cold[m]['pdfSHA256']==r['output']['outputDigest']
 assert r['jobId']==r['reportId']==cold[m]['jobId']==cold[m]['reportId']
 reader=PdfReader(pdf);text='\n'.join(p.extract_text() or '' for p in reader.pages)
 assert r['orderId'] in text and r['personId'] in text and r['jobId'] in text
 assert 'NOT CUSTOMER PUBLICATION' in text and r['pdfRenders']==1
 pub=json.loads((root/(m+'-PUBLICATION.json')).read_text(encoding='utf-8'))
 assert pub['composerFixture'] is True and pub['customerPublishable'] is False
 for k in ['orderId','purchaseId','personId','jobId','reportId','authorityDigest','inputDigest']:assert pub[k]==r[k]
 n=17 if m=='HD' else 10
 assert len(pub['sections'])==n
 for i in range(1,n+1):assert f'{m} synthetic chapter {i}' in text
 if m=='AST':assert len(pub['diagrams'])==13
 rows.append({'method':m,'pdf':fid,'pages':len(reader.pages),'bookmarksRecursive':outlines(reader.outline),'chapterCount':n,'nativeDiagramCount':len(pub['diagrams']),'sameOrderSubjectJobAndColdFile':True,'scope':'COMPOSER_FIXTURE_ONLY_NOT_OWNER_PUBLICATION_ACCEPT'})
base=pathlib.Path('C:/phios/tools/review')
zwr=[]
for label,p,expected in [
 ('R13_REFERENCE_VISUAL',base/'ziwei-r1-3-final-delivery/SYNTHETIC-ZWR-R13-FINAL-Q87-CANDIDATE.pdf','2dd6e0b3a4c6fba2a5ab7305afdb1cd2a1d4e9c72b56c63f8ca3677275d578b4'),
 ('R14_WATERMARK_V2',base/'ziwei-r1-4-final-artifact-handoff/SYNTHETIC-ZWR-R14-PERSONALIZED-WATERMARK-V2-CANDIDATE.pdf','7babe9af729f3f82704dfaaa7265f8019066d8c271fc3f27023ded0bd1950d72')]:
 fid=identity(p);assert fid['sha256']==expected;reader=PdfReader(p);assert len(reader.pages)==68
 zwr.append({'role':label,'pdf':fid,'pages':len(reader.pages),'bookmarksRecursive':outlines(reader.outline),'ownerDecision':'PENDING_OWNER_NOT_INFERRED'})
num=identity(pathlib.Path('D:/PHIOS/QA-TEMP/SIX-METHOD-R2/r28-num-publication-1793702473010/NUM-R28-PUBLICATION-OPTIMIZED.pdf'))
assert num['sha256']=='9c74e7cc3fddfed81cc73ba5fba25ff910ef411814d6c2c4c23d2d638942e701'
out={'status':'PASS_ACTUAL_PDF_IDENTITY_AND_RECEIPT_RECONCILIATION','localFixtureRows':rows,'zwrActualReviewFiles':zwr,'numAcceptedFrozen':num,'numRerendered':False,'providerCalls':0,'usd':0}
dest=root/'PDF-IDENTITY-VERIFICATION.json';assert not dest.exists();dest.write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':out['status'],'rows':[{k:r[k] for k in ['method','pages','chapterCount','bookmarksRecursive']} for r in rows],'zwr':[{k:r[k] for k in ['role','pages','bookmarksRecursive']} for r in zwr]},ensure_ascii=False))
