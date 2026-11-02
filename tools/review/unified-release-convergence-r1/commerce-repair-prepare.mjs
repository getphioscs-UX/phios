import fs from 'node:fs';import {execFileSync} from 'node:child_process';import path from 'node:path';
const wt='C:/phios/.worktrees/unified-release-convergence-r1',D='C:/phios/tools/review/unified-release-convergence-r1/r12/commerce-repair';fs.mkdirSync(D,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:wt,encoding:'utf8'});
for(const p of ['content/production-closure/shared-paid-report-delivery/P8-SECURITY-WATCHDOG-RESULT.json','content/production-closure/shared-paid-report-delivery/P8-TARGETED-CORE-RESULT.json']){
 const f=path.join(wt,p);fs.copyFileSync(f,path.join(D,path.basename(p)));fs.writeFileSync(f,execFileSync('git',['show','HEAD:'+p],{cwd:wt}));
}
for(const p of ['configuration-boundary.json','machine-results.json'])fs.copyFileSync(path.join(wt,'docs/qa/commerce-stripe-r1',p),path.join(D,p));
const old=git('show','d305a6ad:scripts/check-commerce-stripe-r1.mjs'),current=fs.readFileSync(path.join(wt,'scripts/check-commerce-stripe-r1.mjs'),'utf8');
const assertion="assert.equal(response.status,503,p.productId);assert.equal((await response.json()).error,p.qaPriceVerificationRequired?'stripe_qa_price_binding_mismatch':'stripe_qa_price_rebinding_required',p.productId);";
if(!old.includes(assertion)||!current.includes(assertion))throw Error('ORIGINAL_503_ASSERTION_CHANGED');
fs.writeFileSync(D+'/LOCAL-VERIFICATION.json',JSON.stringify({at:new Date().toISOString(),ownerContract:'Current Owner instruction preserves Commerce price-before-order binding and five-method admission. Source owners reconciled by historical Commerce registry/fixture contracts and unchanged Paid Report capability guard.',sourceOwnerEvidence:git('log','-3','--format=%h %an %s','--','functions/commerce/commerce-stripe-api.js'),old503AssertionUnchanged:true,commerceGroups:18,newFocusedCases:20,node22FocusedCases:20,sharedCore:11,security:12,refundWebhook:'PASS',previewScope:53,functionImportInvariant:'PASS',baziExistingDelivery:'Source hash unchanged; inherited 57 report handoff checks retained, no full report generation/reopen rerun',realStripeRequests:0,fullLocalCheckRun:false,previewDeploymentAuthorized:false},null,2));
console.log('Receipts captured; only this run’s generated tracked outputs restored to their original HEAD bytes.');
