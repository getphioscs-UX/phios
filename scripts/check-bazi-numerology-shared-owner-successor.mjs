import fs from 'node:fs';
import assert from 'node:assert/strict';
import {readBaziSharedOwnerPredecessor,restoreExactSharedPredecessor,assertNumerologyOnlySharedDelta} from './lib/bazi-numerology-shared-owner-successor.mjs';
const r=JSON.parse(fs.readFileSync('docs/commerce/economics-20261009/bazi-numerology-shared-owner-successor-v4.json'));
const tests=[];
function check(name,fn){fn();tests.push({name,status:'PASS'});}
const previous=new Map();
for(const e of r.entries){
 check('Exact predecessor: '+e.path,()=>previous.set(e.path,readBaziSharedOwnerPredecessor(e.path,e.predecessorSha256)));
 check('Unknown byte denied: '+e.path,()=>assert.throws(()=>restoreExactSharedPredecessor(e,Buffer.concat([fs.readFileSync(e.path),Buffer.from(' ')]))));
 check('Wrong predecessor denied: '+e.path,()=>assert.throws(()=>restoreExactSharedPredecessor({...e,predecessorSha256:'0'.repeat(64)},fs.readFileSync(e.path))));
}
const registry=r.entries.find(e=>e.path.endsWith('registry.js'));
const source=fs.readFileSync(registry.path,'utf8');
const match=source.match(/export const REPORT_CONTENTS_ASSETS=Object\.freeze\((\[[\s\S]*?\])\.map\(Object\.freeze\)\);/);
const rows=JSON.parse(match[1]);
for(const [name,mutation] of [
 ['Another method activation',a=>a.find(x=>x.methodId==='BZR').active=true],
 ['NUM identity replacement',a=>a.find(x=>x.methodId==='NUM').sha256='0'.repeat(64)],
 ['NUM customer publication',a=>a.find(x=>x.methodId==='NUM').customerPublishable=true],
 ['Unregistered P06 field',a=>a.find(x=>x.methodId==='NUM').unregistered=true]
])check(name+' denied',()=>{const a=structuredClone(rows);mutation(a);assert.throws(()=>assertNumerologyOnlySharedDelta(registry.path,previous.get(registry.path),source.replace(match[1],JSON.stringify(a,null,1))));});
check('Registry executable change denied',()=>assert.throws(()=>assertNumerologyOnlySharedDelta(registry.path,previous.get(registry.path),source+'\nexport const unsafe=true;\n')));
const asset=r.entries.find(e=>e.path.endsWith('.json')),current=JSON.parse(fs.readFileSync(asset.path));
for(const [name,mutation] of [
 ['Non-NUM asset',a=>a.assets.find(x=>x.methodId==='ECR').approval='MUTATED'],
 ['ECR publication metadata',a=>a.reports.ECR.blockers=[]],
 ['Global inventory revision',a=>a.revision='MUTATED'],
 ['Historical NUM source',a=>a.historicalAssetBindings.NUM_R20.assets[0].sha256='0'.repeat(64)],
 ['NUM section order',a=>a.reports.NUM.sections.reverse()],
 ['NUM commercial admission',a=>a.assets.find(x=>x.methodId==='NUM').customerPublishable=true]
])check(name+' denied',()=>{const a=structuredClone(current);mutation(a);assert.throws(()=>assertNumerologyOnlySharedDelta(asset.path,previous.get(asset.path),JSON.stringify(a)));});
const out='docs/acceptance/bazi-paid-report/deep-manuscript-r2/PRELIVE-SHARED-SUCCESSOR-CHECKS-current.json';
fs.writeFileSync(out,JSON.stringify({status:'PASS',tests,groups:tests.length,providerCalls:0,actualCost:0,historicalEvidenceRewritten:false,humanAcceptanceGranted:false,currentRendererFitAccepted:false},null,2)+'\n');
console.log(`PASS ${tests.length} shared-owner positive/negative checks; providerCalls=0`);
