import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,measureDepth,BASELINE,RESEARCH} from './audit-cx-smr-enrichment-depth.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export function loadW01(root=process.cwd()){
 const r=name=>read(path.join(root,RESEARCH,name));
 return {baseline:r('w0-baseline-provenance-v1.json'),audit:r('w0-authority-audit-v1.json'),metrics:r('w0-report-depth-metrics-v1.json'),registry:r('w1-external-reference-manuscript-registry-v1.json'),contract:r('w2-checkpoint-contract-v1.json')};
}
export function validateW01(d){
 for(const [key,v] of Object.entries(d)){
  assert.equal(v.baselineCommit,BASELINE);
  if(key!=='metrics'){assert.equal(v.status,'RESEARCH_ONLY_NOT_PRODUCTION');assert.equal(v.productionAllowed,false);assert.equal(v.customerCutoverAllowed,false);}
 }
 assert.equal(d.baseline.protectedFileCount,d.baseline.protectedFiles.length);
 assert.equal(new Set(d.baseline.protectedFiles.map(f=>f.path)).size,d.baseline.protectedFiles.length);
 assert.equal(d.baseline.changeFromPrevious.files.length,21);
 assert.equal(d.audit.findings.length,9);assert.equal(d.audit.astMappingSnapshot.count,41);assert.equal(d.audit.newRuntimeCreated,false);
 assert.deepEqual(d.audit.gates,{humanAccepted:0,humanRejected:0,humanPending:48,productionAllowed:false,customerCutoverAllowed:false});
 assert.equal(d.registry.sourceCount,5);assert.equal(d.registry.sources.length,5);
 assert.equal(new Set(d.registry.sources.map(s=>s.sourceId)).size,5);
 assert.equal(d.registry.totalPdfPages,1934);assert.equal(d.registry.sources.reduce((n,s)=>n+s.sourceObject.pdfPageCount,0),1934);
 for(const s of d.registry.sources){
  assert.equal(s.sourceType,'EXTERNAL_REFERENCE_MANUSCRIPT');assert.equal(s.registrationStatus,'RESEARCH_REGISTERED');
  assert.equal(s.rights.status,'NOT_ESTABLISHED');assert.equal(s.rights.productionUseAllowed,false);assert.equal(s.rights.publicRedistributionAllowed,false);assert.equal(s.rights.licenseEvidenceRef,null);
  assert.equal(s.authority.canonicalMeaningAuthority,false);assert.equal(s.authority.completedManuscript,false);assert.equal(s.authority.productionAdmitted,false);assert.equal(s.authority.runtimeBinding,null);assert.equal(s.authority.specialistReview,'PENDING');
  assert.equal(s.rawPdfBundled,false);assert.equal(s.rawOcrBundled,false);assert.equal(s.w2CheckpointState,'PENDING_SEPARATE_BOOK_PACKAGE');
  assert.equal(s.bibliographicEvidence.status,'ASSISTANT_VISUAL_COPYRIGHT_PAGE_VERIFIED');assert.equal(s.bibliographicEvidence.humanReviewerRef,null);
  assert(Number.isInteger(s.bibliographicEvidence.pdfPage)&&s.bibliographicEvidence.pdfPage>0&&s.bibliographicEvidence.pdfPage<=s.sourceObject.pdfPageCount);
  assert.match(s.bibliographicEvidence.rasterSha256,/^[a-f0-9]{64}$/);assert.match(s.sourceObject.sha256,/^[a-f0-9]{64}$/);
  assert.match(s.isbn,/^\d{13}$/);assert.equal([...s.isbn].reduce((n,v,i)=>n+Number(v)*(i%2?3:1),0)%10,0);
  assert.equal(s.sourceObject.hashReverifiedThisBatch,true);assert(s.sourceObject.url.includes(s.sourceObject.driveFileId));
 }
 assert.equal(d.registry.sources.find(s=>s.sourceId==='AST-S04').authors.length,2);
 assert.equal(d.contract.w3Allowed,false);assert.equal(d.contract.saveEachBookBeforeStartingNext,true);assert.equal(d.contract.plannedTotalCards,25);
 assert(d.contract.statesAtThisCheckpoint.every(s=>s.state==='PENDING_SEPARATE_BOOK_PACKAGE'));
 assert.equal(d.metrics.caseCount,48);assert.equal(d.metrics.groups.length,8);assert(d.metrics.groups.every(g=>g.intentCount===6&&g.distinctBodyCount===1));
 return true;
}
export function checkW01(root=process.cwd()){
 const d=loadW01(root);validateW01(d);
 for(const f of d.baseline.protectedFiles){const raw=fs.readFileSync(path.join(root,f.path),'utf8');assert.equal(hash(raw.replace(/\r\n/g,'\n')),f.lfNormalizedSha256,`Protected baseline changed: ${f.path}`);}
 assert.deepEqual(d.metrics,measureDepth(root));
 const actual=read(path.join(root,'content/customer-experience-rebuild/r12r4b/smr/admission/smr-production-admission-v1.json'));
 assert.equal(actual.productionAllowed,false);assert.equal(actual.customerCutoverAllowed,false);
 const human=read(path.join(root,'content/customer-experience-rebuild/r12r4b/smr/review/smr-human-review-results-v1.json'));
 assert.equal(human.accepted,0);assert.equal(human.rejected,0);assert.equal(human.pending,48);
 const mutate=[x=>x.registry.productionAllowed=true,x=>x.registry.sources[0].sourceType='COMPLETED_MANUSCRIPT',x=>x.registry.sources[0].rights.productionUseAllowed=true,x=>x.registry.sources[0].bibliographicEvidence.pdfPage=9999,x=>x.registry.sources[1].sourceId=x.registry.sources[0].sourceId,x=>x.registry.sources[0].isbn='0000000000001',x=>x.audit.gates.humanAccepted=48,x=>x.contract.w3Allowed=true];
 for(const change of mutate){const copy=structuredClone(d);change(copy);assert.throws(()=>validateW01(copy));}
 return {status:'PASS',stage:'W0_W1_ONLY',protectedFiles:d.baseline.protectedFileCount,sources:5,sourcePdfPages:1934,findings:9,humanPending:48,negativeChecks:mutate.length,productionAllowed:false,wholeBookExtraction:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(checkW01(),null,2));
