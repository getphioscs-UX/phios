import assert from 'node:assert/strict';import fs from 'node:fs';
import {onRequestPost} from '../functions/api/customer-personal-reality.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const t=p=>fs.readFileSync(p,'utf8');
const state=j('content/professional/num-production/customer/contracts/num-cx-reading-state-contract-v1.json');
const responsive=j('content/professional/num-production/customer/contracts/num-cx-responsive-contract-v1.json');
const boundary=j('content/professional/num-production/customer/contracts/num-cx-content-boundary-contract-v1.json');
const handoff=j('content/professional/num-production/customer/contracts/num-cx-handoff-contract-v1.json');
assert.equal(state.work,'NUM-CX-W10');assert.equal(responsive.work,'NUM-CX-W11');assert.equal(boundary.work,'NUM-CX-W12');assert.equal(handoff.work,'NUM-CX-W13');
const client=t('assets/customer-ui/js/surfaces/personal-reality.js'),css=t('assets/customer-ui/surfaces/personal-reality.css'),numCss=t('assets/customer-ui/surfaces/numerology-reading.css');
for(const token of ['NOT_REQUIRED','SINGLE_METHOD_INTEGRATED_READING','Customer report'])assert(t('functions/api/customer-personal-reality.js').includes(token),token);
assert(client.includes('buildGovernedHandoffView'));assert(client.includes('renderNumerologyReading(view)'));assert(!client.includes("viewModel:{...view,realityResponse"));
assert(css.includes('NUM-CX-W10–W12'));assert(numCss.includes('NUM-CX-W11–W12'));
async function run(body){const r=await onRequestPost({request:new Request('https://phios.local/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env:{}});const p=await r.json();assert.equal(r.status,200,JSON.stringify(p));return p.view}
const v=await run({birthDate:'1989-11-15',birthTimeUnknown:true,methods:['numeric'],consent:true,locale:'zh-Hans',numerologyTargetDate:'2025-05-15'});
const m=new Map(v.reading.map.map(x=>[x.stageId,x]));
assert.equal(m.get('SINGLE_METHOD_INTEGRATED_READING').state,'READABLE');assert.equal(m.get('CROSS_METHOD_COMPOSITION').state,'NOT_REQUIRED');assert.equal(m.get('REPORT').state,'READABLE');
assert(!v.reading.map.some(x=>x.stageId==='FULL_REPORT'&&x.state==='NOT_STARTED'));assert.equal(v.reading.governance.numerologyIntegratedReadingAvailable,true);
console.log('✓ NUM-CX-W10–W13 reading-state, responsive and governed handoff passed.');
