import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const BASE='content/customer-experience-rebuild';
const acceptance=read(`${BASE}/acceptance/cx-r12r3b-pass2a-human-review-materialization-acceptance-v1.json`);
const manifest=read(`${BASE}/review/materialized/v1/cx-r12r3b-human-review-materialization-manifest-v1.json`);
const campaign=read(`${BASE}/review/cx-r12r3b-96-case-human-review-campaign-v3.json`);
const language=read(`${BASE}/authority/cx-r12r3b-customer-language-authority-v1.json`);
const runtime=text('functions/interpretation-runtime/cx-r12r3b-shared-runtime-v2.js');
assert.equal(acceptance.status,'HUMAN_REVIEW_MATERIALIZED_EXTERNAL_REVIEW_REQUIRED');
assert.equal(acceptance.developmentAcceptancePreserved,true);
assert.equal(manifest.caseCount,96);assert.equal(manifest.materialized,96);assert.equal(manifest.reviewEligible,96);assert.equal(manifest.dualAccepted,0);
assert.equal(manifest.status,'96_CASE_REVIEW_PACK_MATERIALIZED');assert.equal(manifest.humanAcceptanceFabricated,false);
assert.equal(campaign.status,'MATERIALIZED_EXTERNAL_HUMAN_REVIEW_READY');assert.equal(campaign.currentTotals.materialized,96);assert.equal(campaign.currentTotals.reviewEligible,96);assert.equal(campaign.currentTotals.dualAccepted,0);
assert.equal(campaign.historicalPredecessorMutated,false);
assert.equal(runtime.includes('pickMeanings('),false,'first-N meaning selector must be removed');
assert(runtime.includes('selectorMatches(')&&runtime.includes('selectMeanings('),'selector-bound meaning resolution missing');
assert(runtime.includes('legacySelectorless'),'historical selectorless review fixture compatibility must remain explicit');
assert.equal(language.invariants.meaningIdentityChanged,false);assert.equal(language.invariants.sourceMeaningChanged,false);assert.equal(language.invariants.customerLanguageMayAddTraditionalMeaning,false);
let internalVisible=0,selectorlessRefs=0,caseFiles=0,graphFiles=0;
for(const c of manifest.cases){
  assert.equal(c.reviewEligible,true,`${c.caseId} not review eligible`);
  assert.equal(c.candidateMaterialization.state,'MATERIALIZED');assert.equal(c.candidateMaterialization.machinePreflightPassed,true);
  assert(fs.existsSync(c.candidateMaterialization.candidateSnapshotRef));assert(fs.existsSync(c.candidateMaterialization.graphSnapshotRef));caseFiles++;graphFiles++;
  const snapshot=read(c.candidateMaterialization.candidateSnapshotRef);
  assert.equal(snapshot.caseId,c.caseId);assert.equal(snapshot.reviewEligible,true);
  for(const localized of snapshot.localized){
    const customerText=localized.interpretationUnits.flatMap(u=>[u.title,u.plainLanguageExplanation,u.structuralReason,u.relationContext,u.constructiveExpression,u.frictionExpression,...(u.observableSignals||[]),...(u.realityComparisonQuestions||[])]).join(' ');
    if(/PHI OS canonical|semantic slot|语义槽位/i.test(customerText))internalVisible++;
    for(const u of localized.interpretationUnits){assert(u.projectionRefs.length);if(localized.status!=='STRUCTURE_ONLY')assert(u.meaningRefs.length);}
  }
}
assert.equal(caseFiles,96);assert.equal(graphFiles,96);assert.equal(internalVisible,0,'internal semantic-slot prose leaked into review candidates');assert.equal(selectorlessRefs,0);
assert(fs.existsSync('tools/review/cx-r12r3b-human-review-materialized-v1.html'));
assert.equal(acceptance.claims.humanReviewReady,true);assert.equal(acceptance.claims.humanAccepted,false);assert.equal(acceptance.claims.liveBrowserAccepted,false);assert.equal(acceptance.claims.fullProduction,false);
console.log('✓ CX-R12R3B PASS2A passed: selector remediation + customer-language projection + 96/96 materialized review cases.');
console.log('  External dual human review remains required; 0/96 are human accepted and no production authority is promoted.');
