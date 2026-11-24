import {releaseR5Predecessor,registeredR5AssertionDocument} from './pr22-release-r5-exact-successor-r1.mjs';
import {auditPublicPredecessor} from './audit-r2-public-receiver-r2.mjs';
import {hdPrivateDecorationPredecessor,validateHdPrivateDecorationCurrent} from './hd-private-decorative-reception-r1.mjs';
import {bzrPublicFidelityPredecessor,validateBzrPublicFidelityCurrent} from './bzr-public-fidelity-reception-r1.mjs';
const convergenceChildBytes=(path,bytes)=>zwrChildBytes(path,bzrPublicFidelityPredecessor(path,hdPrivateDecorationPredecessor(path,auditPublicPredecessor(path,bytes))));
import {worldReadabilityPredecessor} from './world-readability-compatibility-r1.mjs';
import {convergenceChildBytes as zwrChildBytes,validateZwrReceptionCurrent} from './report-zwr-revision-reception-r1.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const CONVERGENCE_RECORD='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/PUBLIC-CUSTOMER-REPORT-CONVERGENCE-SUCCESSOR-R4.json';
export const CONVERGENCE_RECORD_SHA='fa3851f6fe02a4cbd1d879a5ca99117bda0e1f91f7eca882fa37a685015fab08';
export const CONVERGENCE_GOVERNANCE_RECORD='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/PUBLIC-CUSTOMER-REPORT-GOVERNANCE-SUCCESSOR-R2.json';
export const CONVERGENCE_GOVERNANCE_SHA='8139fcc68f91fd38370939234f05d7af8006d325abe47debee7948d8fc55d834';
export const convergenceHash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function readConvergenceRecord(recordBytes=fs.readFileSync(CONVERGENCE_RECORD)){
 assert.equal(convergenceHash(recordBytes),CONVERGENCE_RECORD_SHA,'CONVERGENCE_RECORD_DRIFT');
 const r=JSON.parse(recordBytes);
 assert.equal(r.schema,'PUBLIC_CUSTOMER_REPORT_CONVERGENCE_SUCCESSOR_R4');
 assert.equal(r.baseline,'58b4e464cf44bd3ec3b68ba5f4def1d0994ceb89');
 assert.equal(r.status,'EXACT_ENGINEERING_RECEPTION_PENDING_OWNER_VISUAL_AND_RELEASE_ACCEPTANCE');
 assert.equal(r.paths.length,41);assert.equal(new Set(r.paths.map(x=>x.path)).size,41);
 for(const v of Object.values(r.boundaries))assert.equal(v,false,'NO_INHERITED_ADMISSION_OR_RELEASE_AUTHORITY');
 assert.equal(convergenceHash(r.paths.map(x=>x.path+'\t'+x.sha256+'\n').join('')),r.sourceSetSHA256);
 for(const x of r.frozenRecords)assert.equal(convergenceHash(fs.readFileSync(x.path)),x.sha256,'HISTORICAL_FREEZE_REWRITTEN:'+x.path);
 return r;
}

// Historical assertions receive their exact preserved predecessor only after
// the current bytes prove the independently registered, path-specific child.
export function convergencePredecessor(path,expected,readCurrent=p=>fs.readFileSync(p)){
 const raw=readCurrent(path);if(convergenceHash(raw)===expected)return raw;
 const current=convergenceChildBytes(path,raw);if(convergenceHash(current)===expected)return current;
 const row=readConvergenceRecord().paths.find(x=>x.path===path);
 assert(row,'UNREGISTERED_CONVERGENCE_PATH:'+path);
 assert.equal(row.previousSHA256,expected,'CONVERGENCE_PREDECESSOR_IDENTITY:'+path);
 assert.equal(convergenceHash(current),row.sha256,'CONVERGENCE_CURRENT_DRIFT:'+path);
 assert.notEqual(row.previousBytesBase64,null,'NO_HISTORICAL_PREDECESSOR:'+path);
 const previous=Buffer.from(row.previousBytesBase64,'base64');
 assert.equal(convergenceHash(previous),expected,'CONVERGENCE_PREDECESSOR_BYTES:'+path);
 return previous;
}
export function readConvergenceGovernanceRecord(bytes=fs.readFileSync(CONVERGENCE_GOVERNANCE_RECORD)){
 assert.equal(convergenceHash(bytes),CONVERGENCE_GOVERNANCE_SHA,'CONVERGENCE_GOVERNANCE_RECORD_DRIFT');
 const r=JSON.parse(bytes);assert.equal(r.schema,'PUBLIC_CUSTOMER_REPORT_GOVERNANCE_SUCCESSOR_R2');
 assert.equal(r.baseline,'58b4e464cf44bd3ec3b68ba5f4def1d0994ceb89');
 assert.equal(r.status,'ENGINEERING_CHECKER_INHERITANCE_ONLY');
 assert.deepEqual(r.paths.map(x=>x.path),['scripts/lib/main-convergence-source-successor-r1.mjs','scripts/lib/final-world-release-successor.mjs']);
 assert.equal(r.previousGovernanceRecord.path,'content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/PUBLIC-CUSTOMER-REPORT-GOVERNANCE-SUCCESSOR-R1.json');
 assert.equal(r.previousGovernanceRecord.sha256,'2df9e23bbb32219d75e68234c1509fd86c8183f46b74133344e8d2ccab6b244e');
 assert.equal(convergenceHash(fs.readFileSync(r.previousGovernanceRecord.path)),r.previousGovernanceRecord.sha256);
 assert.equal(r.predecessorRecord.path,'content/civilization-atlas/maintenance/unified-country-consumer-reception-r1-successor.json');
 assert.equal(r.predecessorRecord.sha256,'55c4f46fd9630a1782d4b666e71d40d4db51bf435054f00a5361db330879e9be');
 assert.equal(convergenceHash(fs.readFileSync(r.predecessorRecord.path)),r.predecessorRecord.sha256);
 assert.equal(r.runtimeRecord.path,CONVERGENCE_RECORD);assert.equal(r.runtimeRecord.sha256,CONVERGENCE_RECORD_SHA);readConvergenceRecord();
 for(const flag of Object.values(r.boundaries))assert.equal(flag,false,'NO_GOVERNANCE_ADMISSION_PROMOTION');
 return r;
}
export function convergenceGovernancePredecessor(path,expected,readCurrent=p=>fs.readFileSync(p)){
 const current=worldReadabilityPredecessor(path,readCurrent(path));if(convergenceHash(current)===expected)return current;
 const row=readConvergenceGovernanceRecord().paths.find(x=>x.path===path);
 assert(row,'UNREGISTERED_CONVERGENCE_GOVERNANCE_PATH:'+path);
 assert.equal(row.previousSHA256,expected,'CONVERGENCE_GOVERNANCE_PREDECESSOR_IDENTITY');
 assert.equal(convergenceHash(current),row.sha256,'CONVERGENCE_GOVERNANCE_CURRENT_DRIFT');
 const previous=Buffer.from(row.previousBytesBase64,'base64');assert.equal(convergenceHash(previous),expected);
 return previous;
}
export function isConvergenceCurrent(path){
 const row=readConvergenceRecord().paths.find(x=>x.path===path);if(!row)return false;
 const actual=convergenceHash(convergenceChildBytes(path,fs.readFileSync(path)));
 if(actual===row.previousSHA256)return false;
 assert.equal(actual,row.sha256,'CONVERGENCE_CURRENT_DRIFT:'+path);return true;
}
export function convergenceRedirectTarget(file,previousTarget){
 const row=readConvergenceRecord().redirectSuccessors.find(x=>x.file===file);if(!row)return previousTarget;
 assert.equal(row.file,'explore/start/index.html');
 assert.equal(row.previousTarget,'/#start');assert.equal(row.target,'/#six-perspectives');
 assert.equal(previousTarget,row.previousTarget,'UNREGISTERED_REDIRECT_PREDECESSOR');
 assert(isConvergenceCurrent(file));return row.target;
}
export function validateConvergenceCurrent({recordBytes,readCurrent=p=>fs.readFileSync(p)}={}){const releaseRead=readCurrent;readCurrent=p=>releaseR5Predecessor(p,releaseRead(p));
 const r=readConvergenceRecord(recordBytes);validateZwrReceptionCurrent(readCurrent);validateBzrPublicFidelityCurrent(readCurrent);validateHdPrivateDecorationCurrent(readCurrent);
 for(const row of r.paths){
  assert.equal(convergenceHash(convergenceChildBytes(row.path,readCurrent(row.path))),row.sha256,'CONVERGENCE_CURRENT_DRIFT:'+row.path);
  if(row.previousSHA256!==null)assert.equal(convergenceHash(Buffer.from(row.previousBytesBase64,'base64')),row.previousSHA256);
  else assert.equal(row.previousBytesBase64,null);
 }
 return r;
}
export function assertConvergenceHome(document){document=registeredR5AssertionDocument(document);
 assert(isConvergenceCurrent('index.html'));
 for(const selector of ['[data-cir-root]','[data-cir-form]','#six-perspectives','#r3-continue','#r3-support'])assert(document.querySelector(selector),'R3_HOME_CONSUMER_MISSING:'+selector);
 assert.equal(document.querySelectorAll('[data-cir-form]').length,1,'ONE_ORIGINAL_HOME_ASK_ENTRY');
 const ask=document.querySelector('[data-cir-form]');
 assert.equal(ask.getAttribute('action'),'/knowledge/ask/','R3_NATIVE_ASK_DESTINATION');
 assert.equal(ask.getAttribute('method'),'get','R3_NATIVE_ASK_READONLY_GET');
 assert(ask.querySelector('input[name="q"][required][maxlength="500"]'),'R3_NATIVE_ASK_BOUNDED_INPUT');
 for(const subject of ['personal','family','team','business','institution','country']){
  const route='/subjects/'+subject+'/';assert.equal(document.querySelectorAll('main a[href="'+route+'"]').length,1,'R3_SUBJECT_ENTRY:'+subject);
  assert(isConvergenceCurrent('subjects/'+subject+'/index.html'));
 }
 for(const route of ['/knowledge/','/articles/','/books/','/search/','/reality/','/professional/','/about/founder/'])assert(document.querySelector('main a[href="'+route+'"]'),'R3_PRESERVED_DEEP_ENTRY:'+route);
 assert.equal(document.querySelectorAll('main h1').length,1);
}
