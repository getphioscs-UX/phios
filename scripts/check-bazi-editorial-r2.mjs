import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base='';
const registry=JSON.parse(fs.readFileSync(base+'content/reports/bazi/bcr/accepted-candidate-registry.json'));
const builder=fs.readFileSync(base+'scripts/build-bazi-bcr-w00-w06.mjs','utf8');
const currentAccepted=vm.runInNewContext(builder.match(/const currentAccepted=([^;]+);/)[1]);
assert.equal(registry.entries.filter(currentAccepted).length,0);
assert.equal(currentAccepted({decision:'ACCEPT'}),false);
assert.equal(currentAccepted({decision:'ACCEPT',editorialAdmission:'REOPENED_PENDING_HUMAN_REVIEW'}),false);
assert.equal(currentAccepted({decision:'PENDING',editorialAdmission:'ACCEPTED'}),false);
assert.equal(currentAccepted({decision:'ACCEPT',editorialAdmission:'ACCEPTED'}),true);
const contract=JSON.parse(fs.readFileSync(base+'content/reports/bazi/bcr/editorial-contract-r2.json'));
assert.equal(contract.humanDecisionRequired,true);
assert.equal(contract.productionCandidate,false);
const statusSource=builder.split('\n').find(l=>l.startsWith("write('docs/acceptance/bazi-paid-report/bcr-w00-w06/STATUS.json'"));
function rebuildStatus(entries){
 let result;
 vm.runInNewContext(statusSource,{out:'content/reports/bazi/bcr',currentAccepted,
  fs:{existsSync:()=>true,readFileSync:()=>JSON.stringify({entries})},
  write:(path,data)=>{result=data;}});
 return JSON.parse(JSON.stringify(result));
}
const generated=rebuildStatus(registry.entries);
assert.deepEqual(generated.acceptedCandidates,[]);
assert.equal(generated.humanAcceptanceCreated,true);
assert.equal(generated.currentHumanAcceptanceCreated,false);
assert.equal(generated.productionAdmission,false);
assert.deepEqual(generated,rebuildStatus(registry.entries));
const afterAccept=rebuildStatus([...registry.entries,{candidateId:'NEW-EXPLICIT-ACCEPT',decision:'ACCEPT',editorialAdmission:'ACCEPTED'}]);
assert.deepEqual(afterAccept.acceptedCandidates,['NEW-EXPLICIT-ACCEPT']);
const state=JSON.parse(fs.readFileSync(base+'content/reports/bazi/bcr/editorial-review-state.json'));
let publication=fs.readFileSync(base+'functions/personal-reading/bazi-customer-publication.js','utf8');
publication=publication.replace(/^import .*;\n/gm,'').replace(/export /g,'');
const context=vm.createContext({BAZI_EDITORIAL_REVIEW_STATE:state,
 projectBaziSectionPublication:async()=>({pages:[{primaryVisualRef:'REVIEW'}],legacy:{reports:[{pages:[{pageNumber:6}]}]},internalSections:[]}),
 visualModules:{modules:[]},REPORT_EDITORIAL_ASSETS:[],SECTION_LAYOUT:{},
 resolveReportEditorialAsset:()=>({src:'INERT_ASSET_REFERENCE'}),renderFrozenBaziIntro:()=>'<p>review</p>',
 assemblePublicationSnapshot:()=>({customer:{customerPublishable:true,pages:[]}}),
 composeBaziPhysicalPages:()=>({pages:[{pageNumber:7}]})});
vm.runInContext(publication,context);
const args={reading:{publicationDecision:{customerPublishable:true}},locale:'zh-Hans',temporalSnapshot:{generatedAt:'FIXED'},full:true};
await assert.rejects(()=>context.buildBaziCustomerPublication(args),/BCR_HISTORICAL_REFERENCE_NOT_PRODUCTION_ADMITTED/);
for(const compositionR1 of [false,true]){
 const review=await context.buildBaziCustomerPublication({...args,historicalReferenceReview:true,compositionR1});
 assert.equal(review.customerPublishable,false);
 assert.equal(review.editorialHumanAcceptanceCurrent,false);
 assert.equal(review.editorialReviewStatus,'REOPENED_PENDING_HUMAN_REVIEW');
}
await assert.rejects(()=>context.buildBaziCustomerPublication({...args,historicalReferenceReview:true,reportSubjectPresentation:{name:'REAL SUBJECT'}}),/BCR_HISTORICAL_REFERENCE_NOT_PRODUCTION_ADMITTED/);
console.log('PASS: historical ACCEPT cannot revive editorial admission; explicit new editorial ACCEPT required; repeated status deterministic; default production and subject overlay blocked; both reference composition paths explicitly marked reopened.');
