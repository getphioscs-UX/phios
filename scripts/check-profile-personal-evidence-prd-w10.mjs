import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
const html=fs.readFileSync('perspectives/profile/index.html','utf8');
assert.ok(html.includes('Personal Evidence — PHI OS'));
assert.ok(html.includes('og:title'));
assert.ok(html.includes('data-prf-dossier'));
assert.equal((html.match(/data-prf-mode="/g)||[]).length,7);
assert.ok(fs.readFileSync('perspectives/personal/index.html','utf8').includes('Add Personal Evidence'));
for(const forbidden of ['Profile Full Report','Profile Method','Profile Reading','Profile & Assessment'])assert.ok(!html.includes(forbidden));
const client=fs.readFileSync('assets/customer-ui/js/surfaces/profile-progressive.js','utf8');
assert.ok(client.includes("$$('input[data-prf-handoff-signal]:checked')"));
assert.ok(client.includes('data-prf-domain-consent'));
await build({entryPoints:['functions/api/profile-progressive.js'],bundle:true,platform:'node',format:'esm',outfile:'.tmp/prd-w10-api-test.mjs',logLevel:'silent'});
const api=await import('../.tmp/prd-w10-api-test.mjs');
const get=mode=>api.onRequestGet({request:new Request(`https://fixture.invalid/api/profile-progressive?mode=${mode}`),env:{}});
for(const mode of ['QUICK_PROFILE','FULL_SELF_ASSESSMENT','BIG_FIVE','REASONING_TASKS','FINANCIAL_CAPABILITY','IMPORT_EXTERNAL_RESULT'])assert.equal((await get(mode)).status,200,mode);
const failedOnet=await get('CAREER_INTERESTS');assert.notEqual(failedOnet.status,200);assert.equal((await failedOnet.json()).error,'PRF_ONET_PROVIDER_NOT_CONFIGURED');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const instrument=read('content/professional/profile/assessment/self-assessment-instrument-v2.json');
const quick=read('content/profile/ux/profile-quick-profile-selection-v1.json');
const bank=read('content/profile/academic/reasoning/original-reasoning-task-bank-v1.json');
const tasks=read('content/profile/ux/profile-reasoning-review-set-v1.json');
const ipip=read('content/profile/academic/ipip/ipip-big-five-50-v1.json');
const financial=read('content/profile/academic/financial/phi-financial-capability-instrument-v1.json');
const bodies=[
 {mode:'QUICK_PROFILE',responses:Object.fromEntries(quick.itemIds.map(id=>[id,3]))},
 {mode:'FULL_SELF_ASSESSMENT',responses:Object.fromEntries(instrument.items.map(x=>[x.itemId,3]))},
 {mode:'REASONING_TASKS',responses:Object.fromEntries(bank.items.filter(x=>tasks.taskIds.includes(x.taskId)).map(x=>[x.taskId,x.options[0].optionId]))},
 {mode:'BIG_FIVE',responses:Object.fromEntries(ipip.items.map(x=>[x.itemId,3]))},
 {mode:'FINANCIAL_CAPABILITY',responses:Object.fromEntries(financial.items.map(x=>[x.itemId,x.response==='LIKERT_1_5'?3:(x.scoring?.options?.[0]??null)]))},
 {mode:'IMPORT_EXTERNAL_RESULT',providerFamily:'MBTI_OFFICIAL',providerName:'Official MBTI result import',resultLabel:'INFJ',resultDimensions:{}}
];
for(const locale of ['en','zh-Hans'])for(const body of bodies){
 const response=await api.onRequestPost({request:new Request('https://fixture.invalid/api/profile-progressive',{method:'POST',body:JSON.stringify({...body,participantRef:'PERSON-A',assessmentDate:'2026-10-04',asOfDate:'2026-10-04',locale,consent:true,sensitiveConsent:true,customerConfirmed:true})}),env:{}});
 const data=await response.json();assert.equal(response.status,200,`${body.mode} ${locale}: ${data.error}`);
 assert.equal(data.dossierReport.canonicalState,'APPROVED_UNRELEASED');
 assert.equal(data.dossierProjection.reportReference,data.dossierReport.reportReference);
 assert.equal(data.governance.automaticPersistence,false);
 assert.equal(data.publicationIr.locale,locale);
}
console.log('PRD_W10_CUSTOMER_CUTOVER = PASS (six offline modes × two locales; O*NET fail-closed; human browser gate pending)');
