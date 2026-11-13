import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const MAIN_CONVERGENCE_RECORD='content/civilization-atlas/maintenance/main-convergence-r1-successor.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const FREE_COUNTRY_SUCCESSOR_RECORD='content/civilization-atlas/maintenance/free-country-r1-source-successor.json';
const FREE_COUNTRY_RECORD_SHA256='7894fc8afe14507657198754531f2a94be7f1a49c35b98eea0daa60d10c11eed';
const ORIGINAL_RECORD_SHA256='552e26c15384d0d2d5f2fd41b514315feb3ce2363dbe002f5aa68cbed0cc4144';
const FREE_COUNTRY_PATHS=Object.freeze([
 'functions/_middleware.js','scripts/build-cloudflare-pages.mjs',
 'assets/js/pages/civilization-atlas/world-history-coverage-r1.js',
 'assets/js/pages/civilization-atlas/world-history-sources.generated.js',
 'content/civilization-atlas/evidence/country-history-source-bindings-r1.json'
]);
const gitSource=(ref,file)=>execFileSync('git',['show',ref+':'+file],{maxBuffer:32*1024*1024});
// Registered engineering bytes only. Checker callers always use the default readers.
export function validateFreeCountrySourceSuccessor({
 recordBytes=fs.readFileSync(FREE_COUNTRY_SUCCESSOR_RECORD),
 frozenBytes=fs.readFileSync(MAIN_CONVERGENCE_RECORD),
 readGit=gitSource,readCurrent=file=>fs.readFileSync(file)
}={}){
 assert.equal(sha(recordBytes),FREE_COUNTRY_RECORD_SHA256,'Immutable PR19 source successor record');
 assert.equal(sha(frozenBytes),ORIGINAL_RECORD_SHA256,'Original convergence freeze must remain unchanged');
 const record=JSON.parse(recordBytes),frozen=JSON.parse(frozenBytes);
 assert.equal(record.work,'FREE_COUNTRY_R1_SOURCE_SUCCESSOR');
 assert.equal(record.status,'ENGINEERING_SUCCESSOR_PENDING_OWNER_RELEASE_ACCEPT');
 assert.equal(record.humanDecision,'PENDING');
 assert.equal(record.predecessorRecord.path,MAIN_CONVERGENCE_RECORD);
 assert.equal(record.predecessorRecord.sha256,ORIGINAL_RECORD_SHA256);
 assert.equal(record.baseline,'2166de8e1bf2cc5e5a33926145c8d7f4bbbe68ae');
 assert.equal(record.sourceCommit,'098342bfb62668e703f4924880c91e10d47600f9');
 assert.equal(frozen.baseline,'2391e4e104269b30d95987dda7f82a00e580227b');
 assert.deepEqual(record.changes.map(row=>row.path),FREE_COUNTRY_PATHS,'Exactly five safe, deduplicated registered paths');
 for(const key of ['historicalFreezeRewritten','checksumValidationRelaxed','humanAcceptanceGranted','canonicalKnowledgeCreated','secondAskRuntimeCreated','commercialAdmissionGranted','newPublicHistoryAdmissionGranted','privateSubjectAdmissionChanged','productionDeployed','providerLiveEnabled'])assert.equal(record.boundaries[key],false);
 const result=new Map();
 for(const row of record.changes){
  for(const value of [row.predecessorSha256,row.baselineSha256,row.successorSha256])assert.match(value,/^[a-f0-9]{64}$/);
  assert.ok(typeof row.owner==='string'&&row.owner.length>0);
  const original=frozen.changes.find(change=>change.path===row.path);
  assert.ok(original,row.path+' must already belong to the original convergence chain');
  assert.equal(sha(readGit(frozen.baseline,row.path)),original.predecessorSha256,row.path+' immutable 2391 predecessor');
  assert.equal(row.predecessorSha256,original.successorSha256,row.path+' original frozen successor');
  assert.equal(sha(readGit(record.baseline,row.path)),row.baselineSha256,row.path+' immutable Main2166 endpoint');
  assert.equal(row.baselineSha256,row.predecessorSha256,row.path+' Main and original successor identity');
  assert.equal(sha(readGit(record.sourceCommit,row.path)),row.successorSha256,row.path+' exact approved PR19 source commit');
  assert.equal(sha(readCurrent(row.path)),row.successorSha256,row.path+' unregistered PR19 source drift');
  result.set(row.path,row.successorSha256);
 }
 return result;
}


export const TECHNICAL_ASK_SUCCESSOR_RECORD='content/civilization-atlas/maintenance/technical-release-ask-r1-source-successor.json';
const TECHNICAL_ASK_RECORD_SHA256='13884b0ec0ad1a2db9cf521d286daeea3c131e12cc2e3f6948bf287f775c8bb8';
export function validateTechnicalAskSourceSuccessor({recordBytes=fs.readFileSync(TECHNICAL_ASK_SUCCESSOR_RECORD),readGit=gitSource,readCurrent=file=>fs.readFileSync(file)}={}){
 assert.equal(sha(recordBytes),TECHNICAL_ASK_RECORD_SHA256,'Immutable technical Ask successor');
 const doc=JSON.parse(recordBytes);assert.equal(doc.work,'TECHNICAL_RELEASE_ASK_R1_SOURCE_SUCCESSOR');assert.equal(doc.status,'ENGINEERING_SUCCESSOR_PENDING_RELEASE_ACCEPTANCE');assert.equal(doc.ownerAuthorization,'OWNER_TECHNICAL_RELEASE_CLOSURE_20261113');assert.equal(doc.humanDecision,'PENDING');assert.equal(doc.baseline,'096b22df9e43d2bed0a82ba5bb010b2eea337ca3');assert.equal(doc.sourceSetB,'9fed06918c9faf8658ab281e28693eaaf0d4ea5cbd6ffb6a6eb33522879079c2');
 assert.deepEqual(doc.changes.map(r=>r.path),['assets/js/pages/public-entry-answer.js'],'Exactly one approved Main-compatible consumer');
 assert.equal(doc.predecessorRecord.path,MAIN_CONVERGENCE_RECORD);assert.equal(doc.predecessorRecord.sha256,ORIGINAL_RECORD_SHA256);
 assert.equal(sha(readGit(doc.baseline,MAIN_CONVERGENCE_RECORD)),ORIGINAL_RECORD_SHA256,'Immutable Main freeze');assert.equal(sha(readCurrent(MAIN_CONVERGENCE_RECORD)),ORIGINAL_RECORD_SHA256,'Old freeze unchanged');
 for(const value of Object.values(doc.boundaries))assert.equal(value,false,'No inherited release or extra path authority');
 const result=new Map();for(const row of doc.changes){assert.equal(sha(readGit(doc.baseline,row.path)),row.predecessorSha256,'Immutable Main predecessor');assert.equal(sha(readCurrent(row.path)),row.successorSha256,'Exact Owner source successor');result.set(row.path,row.successorSha256);}return result;
}


export const TECHNICAL_COUNTRY_REPORT_SUCCESSOR_RECORD='content/civilization-atlas/maintenance/technical-release-country-report-r1-source-successor.json';
const TECHNICAL_COUNTRY_REPORT_RECORD_SHA256='1f2906f2e40e1ba57580e2f4aa6d40a279de362a736a3d060f02228833970c6e';
export function validateTechnicalCountryReportSourceSuccessor({recordBytes=fs.readFileSync(TECHNICAL_COUNTRY_REPORT_SUCCESSOR_RECORD),readGit=gitSource,readCurrent=file=>fs.readFileSync(file)}={}){
 assert.equal(sha(recordBytes),TECHNICAL_COUNTRY_REPORT_RECORD_SHA256,'Immutable two-hook technical successor');
 const doc=JSON.parse(recordBytes);assert.equal(doc.work,'TECHNICAL_RELEASE_COUNTRY_REPORT_R1_SOURCE_SUCCESSOR');assert.equal(doc.status,'ENGINEERING_SUCCESSOR_PENDING_OWNER_APPROVAL');assert.equal(doc.humanDecision,'PENDING');assert.equal(doc.baseline,'096b22df9e43d2bed0a82ba5bb010b2eea337ca3');
 assert.deepEqual(doc.frozenCandidate,{head:'fa0926cfddd775796f42290caf00a14c2a07b936',sourceSetSHA256:'0a1843677fd3b015b88058aff790c380e000d000d0eb4593c09d023ae86f7ee9'});
 assert.deepEqual(doc.predecessorRecords,[{"path":"content/civilization-atlas/maintenance/main-convergence-r1-successor.json","sha256":"552e26c15384d0d2d5f2fd41b514315feb3ce2363dbe002f5aa68cbed0cc4144"},{"path":"content/civilization-atlas/maintenance/technical-release-ask-r1-source-successor.json","sha256":"13884b0ec0ad1a2db9cf521d286daeea3c131e12cc2e3f6948bf287f775c8bb8"}]);
 assert.deepEqual(doc.changes.map(row=>row.path),["assets/customer-ui/js/surfaces/profile-country-r1.js","functions/account/ziwei-pdf-delivery.js"],'Only two existing frozen runtime deltas');
 for(const prior of doc.predecessorRecords)assert.equal(sha(readCurrent(prior.path)),prior.sha256,'Immutable predecessor record');
 for(const flag of Object.values(doc.boundaries))assert.equal(flag,false,'No additional authority');
 const result=new Map();for(const row of doc.changes){assert.equal(sha(readGit(doc.baseline,row.path)),row.predecessorSha256,'Exact Main096 predecessor');assert.equal(sha(readCurrent(row.path)),row.successorSha256,'Exact approved existing runtime successor');result.set(row.path,row.successorSha256);}return result;
}

export function mainConvergencePredecessors({paths=null}={}){
 const doc=JSON.parse(fs.readFileSync(MAIN_CONVERGENCE_RECORD,'utf8'));
 assert.equal(doc.work,'UNIFIED_MAIN_CONVERGENCE_R1');
 assert.equal(doc.status,'LOCAL_INTEGRATION_PENDING_OWNER_CHECK');
 assert.equal(doc.humanDecision,'PENDING');
 assert.equal(doc.baseline,'2391e4e104269b30d95987dda7f82a00e580227b');
 for(const k of ['historicalFreezeRewritten','checksumValidationRelaxed','canonicalKnowledgeCreated','secondAskRuntimeCreated','commercialAdmissionGranted','productionDeployed','providerLiveEnabled'])assert.equal(doc.boundaries[k],false);
 assert.equal(new Set(doc.changes.map(c=>c.path)).size,doc.changes.length);
 const currentSuccessors=validateFreeCountrySourceSuccessor();
 for(const [file,digest]of validateTechnicalAskSourceSuccessor())currentSuccessors.set(file,digest);
 for(const [file,digest]of validateTechnicalCountryReportSourceSuccessor())currentSuccessors.set(file,digest);
 const result=new Map();
 for(const c of doc.changes){
  if(paths&&!paths.includes(c.path))continue;
  assert.ok(!c.path.startsWith('/')&&!c.path.split('/').includes('..'));
  const previous=execFileSync('git',['show',doc.baseline+':'+c.path],{maxBuffer:32*1024*1024});
  assert.equal(sha(previous),c.predecessorSha256,c.path+' immutable convergence predecessor');
  assert.equal(sha(fs.readFileSync(c.path)),currentSuccessors.get(c.path)??c.successorSha256,c.path+' unregistered convergence source drift');
  result.set(c.path,previous);
 }
 return result;
}
// These successors already exist on main. Preserve the older SPW freeze
// using immutable Git parents, while still checking the actual candidate bytes.
export function mainHistoricalPredecessors(){
 const doc=JSON.parse(fs.readFileSync(MAIN_CONVERGENCE_RECORD,'utf8')),rows=doc.inheritedAlreadyInMain;
 assert.deepEqual(rows.map(r=>r.path),['assets/js/pages/civilization-atlas/world-integrated-r42.js','functions/_lib/world-country-evidence.js','assets/customer-ui/surfaces/profile-country-r1.css','assets/js/pages/civilization-atlas/world-country-search.js','assets/js/pages/civilization-atlas/world-company-analysis.js','assets/js/pages/client-intent-router.js','assets/js/ask-entry-ui.js','functions/public/client-intent-router.js']);
 const currentSuccessors=validateFreeCountrySourceSuccessor();
 for(const [file,digest]of validateTechnicalAskSourceSuccessor())currentSuccessors.set(file,digest);
 for(const [file,digest]of validateTechnicalCountryReportSourceSuccessor())currentSuccessors.set(file,digest);
 const result=new Map();
 for(const r of rows){
  assert(['419357257da40bca7bdf9579bcf82d785e29d151','400ac5eed99fb73d7db085e1df3394933dd2fb57'].includes(r.previousGitRevision));
  const current=execFileSync('git',['show',doc.baseline+':'+r.path]);assert.equal(sha(current),r.successorSha256);
  const expected=currentSuccessors.get(r.path)??(doc.changes.find(c=>c.path===r.path)?.successorSha256||r.successorSha256);assert.equal(sha(fs.readFileSync(r.path)),expected,r.path+' unregistered current source');
  const prior=execFileSync('git',['show',r.previousGitRevision+':'+r.path]);assert.equal(sha(prior),r.previousSha256);
  result.set(r.path,prior);
 }
 return result;
}
