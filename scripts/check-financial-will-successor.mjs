import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runFinancialProduct} from '../functions/financial/product-activation/financial-product-runtime.js';
import {buildCustomerInventorySnapshot} from '../functions/financial/product-activation/customer-inventory-adapter.js';
import {projectFinancialForCustomer} from '../functions/customer-projection/financial-customer-projection.js';
import {onRequestPost,onRequestGet} from '../functions/api/customer-estate-planning.js';

const amount=(value,extra={})=>({label:'Declared item',value,representation:'EXACT',disclosureState:'SELF_REPORTED',currency:'MYR',...extra});
const base={asOfDate:'2026-09-21',baseCurrency:'MYR',inventory:{people:[{personId:'P1',label:'Person A'}],assets:[amount(50000,{type:'BANK_ACCOUNT',ownershipMode:'SOLE',ownerReferences:['P1']})],liabilities:[amount(10000)],incomeStreams:[amount(8000,{frequency:'MONTHLY'})],expenses:[amount(5000,{frequency:'MONTHLY'})],guarantees:[amount(200000,{type:'PERSONAL_GUARANTEE'})],policies:[],goals:[],disclosure:{}}};
const result=await runFinancialProduct({input:base});
assert.equal(result.calculation.metrics.netWorth,40000);
assert.equal(result.calculation.metrics.totalLiabilities,10000);
assert.equal(result.calculation.metrics.monthlyIncome,8000);
assert.equal(result.calculation.metrics.monthlyExpenses,5000);
assert.equal(result.calculation.metrics.cashFlowSurplus,null,'missing tax assumptions cannot silently become zero tax');
assert.equal(result.navigationCandidate.sections.length,22);
assert.equal(result.snapshot.persisted,false);
for(const lang of ['en','zh-Hans']){
 const view=projectFinancialForCustomer(result,{intake:base,locale:lang});
 assert.equal(view.navigation.sections.length,22);assert.equal(view.report.state,'NOT_RELEASED');assert.equal(view.navigation.released,false);assert.equal(view.authorityLayers.professionalRecommendation.present,false);
 assert(!JSON.stringify(view.navigation).includes('FCR-'));assert(!JSON.stringify(view.navigation).includes('rawUserInput'));
}
const tests=[];
for(const [name,edit,verify] of [
 ['missing assets',i=>i.assets=[],r=>assert.equal(r.calculation.metrics.netWorth,null)],
 ['explicit zero debt',i=>i.liabilities=[amount(0)],r=>assert.equal(r.calculation.metrics.netWorth,50000)],
 ['missing debt',i=>i.liabilities=[],r=>assert.equal(r.calculation.metrics.netWorth,null)],
 ['declined value',i=>i.assets[0].disclosureState='DECLINED_TO_PROVIDE',r=>assert.equal(r.calculation.metrics.netWorth,null)],
 ['range value',i=>i.assets[0]={...i.assets[0],representation:'RANGE',min:40000,max:60000},r=>assert.deepEqual(r.calculation.metrics.netWorth,{min:30000,max:50000})],
 ['cross-border missing FX',i=>i.assets[0].currency='SGD',r=>assert.equal(r.calculation.metrics.netWorth,null)],
 ['large guarantee separate from debt',i=>i.guarantees=[amount(9000000)],r=>assert.equal(r.calculation.metrics.netWorth,40000)],
 ['missing income',i=>i.incomeStreams=[],r=>assert.equal(r.calculation.metrics.monthlyIncome,null)],
 ['annual income',i=>i.incomeStreams=[amount(96000,{frequency:'ANNUAL'})],r=>assert(Math.abs(r.calculation.metrics.monthlyIncome-8000)<0.005)],
 ['unsupported irregular frequency',i=>i.incomeStreams[0].frequency='IRREGULAR',r=>assert.equal(r.calculation.metrics.monthlyIncome,null)],
 ['unknown ownership retained',i=>i.assets[0].ownershipMode='UNKNOWN',r=>assert.equal(r.inventorySnapshot.snapshotPayload.assets[0].ownership.ownershipMode,'UNKNOWN')]
]){const input=structuredClone(base);edit(input.inventory);const r=await runFinancialProduct({input});verify(r);tests.push(name);}
const bad=structuredClone(base);bad.inventory.assets[0].ownerReferences=['UNDECLARED'];await assert.rejects(()=>buildCustomerInventorySnapshot(bad),/UNDECLARED_PERSON/);
const quick=await runFinancialProduct({input:{asOfDate:base.asOfDate,baseCurrency:'MYR',liquidAssets:10}});assert.equal(quick.calculation.metrics.netWorth,null);
const will={consent:true,confirmedForReview:true,dataDate:'2026-09-21',currency:'MYR',jurisdiction:'MY',sections:{identity:{status:'KNOWN',items:[{personId:'P1',label:'Person A'}]},family:{status:'KNOWN',items:[{personId:'P2',label:'Person B'}]},executors:{status:'KNOWN',items:[{personId:'P2'}]},beneficiaries:{status:'KNOWN',items:[{personId:'P2'}]},assets:{status:'KNOWN',items:[{label:'Declared bank balance',value:50000,currency:'MYR',estateInclusion:'INCLUDED'}]},liabilities:{status:'KNOWN',items:[{label:'No debt declared',value:0}]},gifts:{status:'KNOWN',items:[{category:'RESIDUE_SHARE',beneficiaryPersonId:'P2',percentage:100}]}}};
const call=body=>onRequestPost({request:new Request('http://localhost/api/customer-estate-planning',{method:'POST',body:JSON.stringify(body)})});
const complete=await (await call(will)).json();assert(complete.ok);assert.equal(complete.view.calculation.netEstateBeforeTaxFeesAndDistribution,50000);assert.equal(complete.view.executedInstrument,false);assert.equal(complete.view.legalValidityDetermined,false);assert.equal(complete.view.persisted,false);
const unknown=structuredClone(will);unknown.sections.assets.items.push({label:'Insurance nomination unresolved',value:100000,estateInclusion:'UNKNOWN'});assert.equal((await (await call(unknown)).json()).view.calculation,null,'never publish partial estate totals');
const fx=structuredClone(will);fx.sections.assets.items[0].currency='USD';assert.equal((await (await call(fx)).json()).view.calculation,null);
const consent=structuredClone(will);consent.consent=false;assert.equal((await call(consent)).status,403);
const transfer=structuredClone(will);transfer.financialImport=true;assert.equal((await call(transfer)).status,403);
const ref=structuredClone(will);ref.sections.executors.items[0].personId='UNDECLARED';assert.equal((await call(ref)).status,400);
const percent=structuredClone(will);percent.sections.gifts.items[0].percentage=90;const pv=(await (await call(percent)).json()).view;assert.equal(pv.distribution.requiresReview,true);assert.equal(pv.distribution.percentagesRebalanced,false);
assert.equal((await onRequestGet()).status,405);
fs.mkdirSync('docs/financial-will-successor-r1',{recursive:true});
fs.writeFileSync('docs/financial-will-successor-r1/contract-evidence.json',JSON.stringify({machinePass:true,financialCases:tests,willCases:['confirmed inventory','unknown estate inclusion','foreign currency','consent required','separate transfer consent','undeclared roles','unbalanced distribution'],fullAttachmentAccepted:false},null,2)+'\n');
console.log('PASS financial inventory, existing FCR/HFP integration, customer projection, consent, estate unknowns and existing testamentary authority. Full production acceptance is not implied.');
