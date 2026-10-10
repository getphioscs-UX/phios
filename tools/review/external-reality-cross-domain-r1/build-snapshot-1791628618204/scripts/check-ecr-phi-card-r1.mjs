import fs from 'node:fs';import assert from 'node:assert/strict';import {selectEcrPhiCards} from '../functions/ecr-phi-card/ecr-card-selector.js';import {composeEcrPhiCardSpread} from '../functions/ecr-phi-card/ecr-card-reading.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
const deck=read('content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json');
const copy=read('content/ecr-phi-card/ecr-phi-card-copy-contract-v2.json');
const mapping=read('content/ecr-phi-card/ecr-result-to-phi-card-mapping-matrix-v2.json');
const assets=read('content/ecr-phi-card/ecr-phi-card-asset-registry-v1.json');
const visual=read('content/ecr-phi-card/ecr-phi-card-visual-production-ledger-v1.json');
const bench=read('content/ecr-phi-card/benchmark/ecr-phi-card-benchmark-v1.json');
const results=read('content/ecr-phi-card/review/ecr-phi-card-human-review-results-v1.json');
const admission=read('content/ecr-phi-card/admission/ecr-phi-card-customer-admission-v1.json');
const source=read('content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-human-review-cases-v1.json').cases;

assert.equal(deck.fixedCardCount,48);assert.equal(deck.cards.length,48);assert.equal(new Set(deck.cards.map(c=>c.cardId)).size,48);assert.deepEqual(deck.groups.map(g=>g.groupId),['CORE','DRIVER','GIFT','TENSION','FIELD','PHASE']);for(const g of deck.groups)assert.equal(g.cardIds.length,8);
assert.equal(deck.cards.find(c=>c.cardId==='ECR-PC-D08').title.en,'CALLING');assert.equal(deck.cards.find(c=>c.cardId==='ECR-PC-D08').title['zh-Hans'],'召唤');assert.equal(deck.cards.find(c=>c.cardId==='ECR-PC-T07').title.en,'WITHDRAWAL');assert.equal(deck.cards.find(c=>c.cardId==='ECR-PC-G07').title['zh-Hans'],'调整');
assert.equal(new Set(deck.cards.map(c=>c.title.en)).size,48,'English card titles must be unique');
for(const c of deck.cards){for(const f of copy.requiredCardFields)assert.ok(c[f],`${c.cardId}:${f}`);assert.equal(c.illustrationStatus,'CUSTOMER_VISUAL_COMPLETE');assert.ok(c.assetRef)}
assert.equal(assets.assetCount,48);assert.equal(assets.assets.length,48);assert.equal(new Set(assets.assets.map(a=>a.assetId)).size,48);assert.equal(new Set(assets.assets.map(a=>a.objectKey)).size,48);for(const a of assets.assets){assert.match(a.objectKey,/^images\/phi-cards\/phi-card-[cdgtfp]\d{2}-[a-z0-9-]+-v1\.webp$/);assert.equal(a.format,'webp');assert.equal(a.illustrationStatus,'COMPLETE')}
assert.equal(assets.bucketBinding.networkVerificationRequiredByThisWork,false);assert.equal(visual.r2Verification.required,false);assert.equal(visual.milestones.find(x=>x.work==='ECR-PC-R1-S6').assetCount,48);
assert.equal(mapping.boundaries.randomSelection,false);assert.equal(mapping.boundaries.mappingCreatesNewMeaning,false);
for(const c of source){const x=selectEcrPhiCards({coordinate:c.coordinate,interpretationUnits:c.interpretationUnits,customerPublishable:true},mapping,deck);for(const g of ['CORE','DRIVER','GIFT','TENSION','FIELD','PHASE'])assert.ok(x.groups[g]?.cardId,`${c.caseId}:${g}`)}
const sample=source[0];const spreadA=composeEcrPhiCardSpread({coordinate:sample.coordinate,interpretationUnits:sample.interpretationUnits,customerPublishable:true,locale:sample.locale},mapping,deck,assets);const spreadB=composeEcrPhiCardSpread({coordinate:sample.coordinate,interpretationUnits:sample.interpretationUnits,customerPublishable:true,locale:sample.locale},mapping,deck,assets);assert.deepEqual(spreadA,spreadB);assert.equal(spreadA.cards.length,6);assert.equal(spreadA.fullEcrReportStillAuthoritative,true);
const visible=JSON.stringify(spreadA.cards.map(c=>({title:c.title,subtitle:c.subtitle,keywords:c.keywords,oneLineInsight:c.oneLineInsight,canonicalCustomerMeaning:c.canonicalCustomerMeaning,flowingExpression:c.flowingExpression,strainedExpression:c.strainedExpression,observationPrompt:c.observationPrompt,contextualEvidence:c.contextualEvidence})));for(const bad of copy.customerLanguageRules.internalCodesForbiddenOnDefaultSurface)assert.ok(!visible.includes(bad),`customer-visible internal code:${bad}`);
assert.equal(bench.requiredCaseCount,12);assert.equal(bench.cases.length,12);assert.equal(bench.cases.filter(c=>c.locale==='en').length,6);assert.equal(bench.cases.filter(c=>c.locale==='zh-Hans').length,6);for(const c of bench.cases){assert.equal(c.spread.cards.length,6);for(const card of c.spread.cards){assert.ok(card.asset?.objectKey);assert.equal(card.boundaries.replacesFullEcrReport,false)}}
assert.equal(results.requiredCaseCount,12);assert.equal(results.results.length,12);const accepted=results.results.filter(r=>r.decision==='ACCEPTED').length;const rejected=results.results.filter(r=>r.decision==='REJECTED').length;const pending=results.results.filter(r=>r.decision==='PENDING').length;assert.equal(results.acceptedCount,accepted);assert.equal(results.rejectedCount,rejected);assert.equal(results.pendingCount,pending);assert.equal(accepted+rejected+pending,12);
if(accepted===12&&rejected===0&&pending===0){assert.equal(admission.customerAdmission,true);assert.match(admission.status,/ADMITTED/)}else{assert.equal(admission.customerAdmission,false);assert.notEqual(admission.status,'CUSTOMER_ADMITTED')}
console.log('✓ ECR-PC-R1 S1–S3 current authority: 48 unique cards, customer copy, deterministic mapping.');
console.log('✓ ECR-PC-R1 S4–S6 visual production ledger + 48 canonical WebP object keys passed (network/R2 verification intentionally out of scope).');
console.log('✓ ECR-PC-R1 S7 generated 12 deterministic six-card benchmark spreads (6 en + 6 zh-Hans) with runtime reading copy.');
console.log(`✓ Human review state: ${accepted}/12 accepted, ${rejected} rejected, ${pending} pending; customer admission remains ${admission.customerAdmission?'OPEN':'FAIL-CLOSED'}.`);
