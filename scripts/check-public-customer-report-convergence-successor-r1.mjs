import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {CONVERGENCE_RECORD,readConvergenceRecord,validateConvergenceCurrent,convergencePredecessor,assertConvergenceHome,CONVERGENCE_GOVERNANCE_RECORD,readConvergenceGovernanceRecord,convergenceGovernancePredecessor,convergenceHash} from './lib/public-customer-report-convergence-successor-r1.mjs';
const r=validateConvergenceCurrent(),record=fs.readFileSync(CONVERGENCE_RECORD);
let negative=0;
const refuses=f=>{assert.throws(f);negative++;};
for(const row of r.paths){
 refuses(()=>validateConvergenceCurrent({readCurrent:path=>path===row.path?Buffer.from('unregistered drift'):fs.readFileSync(path)}));
 if(row.previousSHA256!==null){
  const previous=convergencePredecessor(row.path,row.previousSHA256);
  assert(previous.equals(Buffer.from(row.previousBytesBase64,'base64')));
  refuses(()=>convergencePredecessor(row.path,'0'.repeat(64)));
 }
}
for(const change of [x=>{x.paths.push({...x.paths[0],path:'extra-unapproved.js'});},x=>{x.baseline='0'.repeat(40);},x=>{x.paths[0].previousSHA256='0'.repeat(64);},x=>{x.boundaries.productionActivated=true;}]){
 const forged=JSON.parse(record);change(forged);refuses(()=>readConvergenceRecord(Buffer.from(JSON.stringify(forged))));
}
refuses(()=>convergencePredecessor('unregistered-extra-path.js','0'.repeat(64),()=>Buffer.from('unregistered bytes')));
const home=fs.readFileSync('index.html','utf8');assertConvergenceHome(parseHTML(home).document);
for(const selector of ['[data-cir-form]','#six-perspectives','#r3-continue','#r3-support','a[href="/subjects/institution/"]','a[href="/books/"]']){
 const {document}=parseHTML(home);document.querySelector(selector).remove();refuses(()=>assertConvergenceHome(document));
}
for(const [name,value]of [['action','/unregistered/'],['method','post']]){
 const {document}=parseHTML(home);document.querySelector('[data-cir-form]').setAttribute(name,value);refuses(()=>assertConvergenceHome(document));
}
{const {document}=parseHTML(home);document.querySelector('[data-cir-form] input').removeAttribute('maxlength');refuses(()=>assertConvergenceHome(document));}
const governance=readConvergenceGovernanceRecord(),governanceBytes=fs.readFileSync(CONVERGENCE_GOVERNANCE_RECORD),checker=governance.paths[0];
assert.equal(convergenceHash(convergenceGovernancePredecessor(checker.path,checker.previousSHA256)),checker.previousSHA256);
for(const row of governance.paths.slice(1)){
 assert.equal(convergenceHash(convergenceGovernancePredecessor(row.path,row.previousSHA256)),row.previousSHA256);
 refuses(()=>convergenceGovernancePredecessor(row.path,row.previousSHA256,()=>Buffer.from('unregistered second checker drift')));
 refuses(()=>convergenceGovernancePredecessor(row.path,'0'.repeat(64)));
}
refuses(()=>convergenceGovernancePredecessor(checker.path,checker.previousSHA256,()=>Buffer.from('unregistered checker drift')));
refuses(()=>convergenceGovernancePredecessor(checker.path,'0'.repeat(64)));
refuses(()=>convergenceGovernancePredecessor('scripts/unregistered-checker.mjs','0'.repeat(64),()=>Buffer.from('extra')));
for(const change of [x=>x.paths.push({...x.paths[0],path:'extra.mjs'}),x=>x.paths[0].previousSHA256='0'.repeat(64),x=>x.paths[0].sha256='0'.repeat(64),x=>x.paths[0].previousBytesBase64=Buffer.from('wrong').toString('base64'),x=>x.predecessorRecord.sha256='0'.repeat(64),x=>x.boundaries.checksumValidationRelaxed=true]){
 const forged=JSON.parse(governanceBytes);change(forged);refuses(()=>readConvergenceGovernanceRecord(Buffer.from(JSON.stringify(forged))));
}
console.log(JSON.stringify({status:'STRICT_CONVERGENCE_SUCCESSOR_PASS',paths:r.paths.length,sourceSet:r.sourceSetSHA256,negative,historicalFreezesUnchanged:true,releaseAuthorityGranted:false}));
