/** Broader TEST_ONLY stress source through existing encrypted save/grant/FDR/FCR owners. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import {withSaved} from './build-financial-publication-r3-1.mjs';
import {createFinancialGrant,revokeFinancialGrant} from '../functions/professional/consent/financial-purpose-grants.js';
import {buildFinancialReportEvidence} from '../functions/financial/holistic-planning-product/factual-report-job.js';
import {compileFinancialPublicationR31,FINANCE_R31_VERSION} from '../functions/financial/holistic-planning-product/publication-r3-1-projection.js';
const root='tools/review/financial-publication-merged/correction-r3',target=root+'/long-saved-base.projection.json';
if(fs.existsSync(target))throw Error('Frozen stress source already exists; do not silently regenerate its saved identity');
const people=Array.from({length:11},(_,i)=>'TEST_MEMBER_'+(i+2));
let receipt;
await withSaved('complete',async({saved,ctx})=>{
 const context=ctx();context.data.syntheticAdmittedSubjectIds=people;
 const grant=await createFinancialGrant(context,{source:saved.savedDraftRef,purpose:'REPORT',language:'en',scopes:['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions'],expiresAt:saved.expiresAt});
 const request={savedDraftRef:saved.savedDraftRef,grantId:grant.grantId,language:'en',publicationVersion:FINANCE_R31_VERSION,reportTier:'PAID'};
 const evidence=await buildFinancialReportEvidence(context,request),p=compileFinancialPublicationR31(evidence);
 assert.equal(p.allowedSubjectCount,12);assert(p.assets.length>=29);assert(p.policyEvents.length>=24);assert(p.expenseFacts.length>=32);
 fs.writeFileSync(target,JSON.stringify(p,null,2));
 await revokeFinancialGrant(context,grant.grantId);
 await assert.rejects(buildFinancialReportEvidence(context,request),{code:'PURPOSE_GRANT_INACTIVE'});
 receipt={testOnly:true,sourceKind:'ACTUAL_LOCAL_ENCRYPTED_SAVE_GRANT_AND_FCR',people:p.allowedSubjectCount,assets:p.assets.length,policyEvents:p.policyEvents.length,expenses:p.expenseFacts.length,sourceDigest:p.source.contentDigest,calculationDigest:p.calculationDigest,authorizationRevocation:'PASS',providerCalls:0,productionDatabaseTouched:false};
},p=>{
 p.inventory.people.push(...people.map(personId=>({personId,label:'TEST_ONLY'})));
 for(let i=0;i<24;i++){
  const assetId='TEST_BANK_'+i;p.inventory.assets.push({...structuredClone(p.inventory.assets[0]),assetId,value:1000+i*10});
  p.publicationFacts.assets.push({ref:assetId,valueBasis:'OWNED_INTEREST',costBasis:'OWNED_INTEREST',sharePct:100,access:'IMMEDIATE',valuationDate:p.asOfDate});
 }
 for(let i=0;i<22;i++){
  const policyId='TEST_POLICY_'+i,person=people[i%people.length];p.inventory.policies.push({...structuredClone(p.inventory.policies[0]),policyId,value:10000+i*100});
  p.publicationFacts.policies.push({policyRef:policyId,ref:'TEST_EVENT_'+i,insuredRef:person,holderRef:person,payerRef:'SELF',event:i%2?'MEDICAL':'DEATH',coverage:10000+i*100,coverageState:'EXACT',premium:30+i,premiumState:'EXACT',frequency:'MONTHLY',expiryDate:'2040-12-31',nominationState:'UNKNOWN'});
 }
 for(let i=0;i<28;i++){
  p.inventory.expenses.push({...structuredClone(p.inventory.expenses[0]),value:50+i});
  p.publicationFacts.expenses.push({ref:'expenses-'+p.inventory.expenses.length,personRef:people[i%people.length],classification:'DECLARED_ESSENTIAL',paymentState:i%3?'PAID':'UNKNOWN'});
 }
 p.publicationFacts.appendices=['FIN-A-BANK','FIN-A-POLICIES','FIN-A-CASHFLOW'];return p;
});
fs.writeFileSync(root+'/long-saved-source-receipt.json',JSON.stringify(receipt,null,2));console.log(receipt);

