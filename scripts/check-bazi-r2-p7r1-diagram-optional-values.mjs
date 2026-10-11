import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadBaziReviewAuthority,ROOT} from './lib/bazi-deep-manuscript-review.mjs';
import {compileBaziDeepPublication} from '../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js';
import {enrichBaziDiagram,inspectBaziDiagramFidelity} from '../functions/personal-reading/publication-fit/bazi-diagram-fidelity.js';
const dir='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(n,v)=>fs.writeFileSync(dir+n,JSON.stringify(v,null,2)+'\n');
globalThis.fetch=async()=>{throw Error('P7R1_NETWORK_FORBIDDEN');};
const baseline=read(dir+'P7R1-BEFORE.json'),owner=baseline.productionOwner;
const result={status:'RUNNING',productionOwner:owner,beforeSha256:baseline.ownerSha256,afterSha256:sha(fs.readFileSync(owner)),authorizedScope:'Only D04/D14/D15 optional display values; no Authority/topology/version changes',providerCalls:0,providerCostUSD:0,providerNetworkCalls:0,targetedRendererStatus:'NOT_RUN',targetedRendererHttpStatus:null,remainingBlocker:null};
try{
 const pack=await loadBaziReviewAuthority(),snapshot=read(ROOT+'LIVE-MANUSCRIPT-SNAPSHOT-R2-CLOSURE.json');
 result.gengParity={};let supplied;
 for(const mode of ['BILINGUAL','EN','ZH_HANS']){
  const ir=await compileBaziDeepPublication({snapshot,pack,presentationMode:mode,recomposePass:0});
  const accepted=read(ROOT+'LIVE-PUBLICATION-IR-R2-CLOSURE-'+mode+'.json');
  assert.deepEqual(ir.technical.diagrams,accepted.technical.diagrams,'GENG_ACCEPTED_DIAGRAM_PARITY_CHANGED');
  assert.equal(inspectBaziDiagramFidelity(ir.technical.diagrams).filter(x=>x.status==='PASS').length,15);
  result.gengParity[mode]='PASS'; supplied=ir.technical.diagrams;
 }
 const val=(ds,id,node)=>ds.find(d=>d.id===id).graph.nodes.find(n=>n.id===node).value;
 const cases=[];
 for(const name of ['A','B','C','D']){
  const p=structuredClone(pack);
  if(name==='B'){delete p.globalVerdict.usefulGod;delete p.timing.daYun;delete p.timing.annual;}
  if(name==='C')p.timing={...p.timing,annual:undefined};
  if(name==='D')delete p.globalVerdict.usefulGod.secondary;
  const ds=supplied.map(d=>enrichBaziDiagram(structuredClone(d),p));
  const fidelity=inspectBaziDiagramFidelity(ds);assert(fidelity.every(f=>f.status==='PASS'));
  const values=ds.flatMap(d=>d.graph.nodes.map(n=>String(n.value)));
  assert(!values.some(v=>/\b(undefined|null|NaN)\b/.test(v)));
  const valuesRow={name,d04:val(ds,'D04','support'),d14DaYun:val(ds,'D14','dayun'),d14Annual:val(ds,'D14','annual'),d15:val(ds,'D15','timing'),fidelityPass:15};
  if(name==='A'){assert.deepEqual(ds,supplied);}
  if(name==='B')for(const k of ['d04','d14DaYun','d14Annual','d15'])assert.equal(valuesRow[k],'—');
  if(name==='C')assert.equal(valuesRow.d15,pack.timing.daYun);
  if(name==='D')assert.equal(valuesRow.d04,pack.globalVerdict.usefulGod.primary.zh);
  cases.push(valuesRow);
 }
 result.cases=cases;result.d04={suppliedParity:'PASS',missingValue:cases[1].d04,partialValue:cases[3].d04};result.d14={suppliedParity:'PASS',missingDaYun:cases[1].d14DaYun,missingAnnual:cases[1].d14Annual};result.d15={suppliedParity:'PASS',missingValue:cases[1].d15,partialValue:cases[2].d15};result.undefinedVisibleTerms=0;result.nullVisibleTerms=0;result.diagramFidelityCount=15;result.diagramFidelityPass=15;
 result.protectedBaselineUnchanged=Object.entries(baseline.protectedHashes).every(([p,h])=>sha(fs.readFileSync(p))===h);assert(result.protectedBaselineUnchanged);
 result.status='PASS_LOCAL';write('P7R1-DIAGRAM-OPTIONAL-VALUE-REPAIR.json',result);console.log('P7R1 null-safety + three-locale GENG exact parity PASS_LOCAL');
}catch(error){
 result.status='FAIL';result.remainingBlocker=error.message;
 if(error.message.includes('GENG_ACCEPTED_DIAGRAM_PARITY_CHANGED')){assert.equal(sha(fs.readFileSync(owner)),result.afterSha256);fs.writeFileSync(owner,fs.readFileSync(dir+'P7R1-OWNER-BEFORE.js'));result.status='FAIL_ROLLED_BACK';}
 write('P7R1-DIAGRAM-OPTIONAL-VALUE-REPAIR.json',result);throw error;
}
