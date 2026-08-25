import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createTarotRuntime,TAROT_RUNTIME_CODE} from '../functions/core-method-runtime/tarot-runtime.js';
import {createTarotCardProjector} from '../functions/core-method-runtime/tarot-card-projection-mapper.js';
import {bindTarotProductInterpretationProjections} from '../functions/interpretation-runtime/adapters/tarot-interpretation-adapter-v3.js';
import {createTarotReadingIR,TAROT_READING_IR_SCHEMA,TAROT_READING_IR_VERSION} from '../functions/interpretation-runtime/tarot-reading-ir-v2.js';
import {createTarotProductPublicViewModel} from '../functions/symbolic-method-public-ux/tarot-product-view-model-v2.js';
import {tarotAuthorities,manualOne,manualThree} from './lib/tarot/tarot-fixtures-v1.mjs';

const BASE='d157ed1ab58b728fb8c264ed7b11b1ab7da974a6';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const P={
 cards:'content/professional/core-method-runtime/tarot-card-registry-v1.json',
 visual:'content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json',
 visualLoc:'content/interpretation/tarot/registries/tarot-visual-evidence-locator-v1.json',
 sourceRegistry:'content/interpretation/tarot/registries/tarot-source-registry-v2.json',
 perspective:'content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v2.json',
 waite:'content/interpretation/tarot/corpus/tarot-waite-source-bound-corpus-v1.json',
 editorial:'content/interpretation/tarot/corpus/tarot-waite-editorial-paraphrase-corpus-v1.json',
 reflective:'content/interpretation/tarot/corpus/tarot-card-reflective-corpus-v1.json',
 composition:'content/interpretation/tarot/corpus/tarot-product-interpretation-composition-corpus-v1.json',
 coverage:'content/interpretation/tarot/coverage/tarot-product-interpretation-coverage-matrix-v1.json',
 contract:'content/interpretation/tarot/contracts/tarot-product-interpretation-completion-contract-v1.json',
 blend:'content/interpretation/tarot/contracts/tarot-no-source-blending-contract-v1.json',
 corpusFreeze:'content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json',
 freeze:'content/interpretation/tarot/freeze/tarot-product-interpretation-freeze-v1.json',
 acceptance:'content/interpretation/tarot/acceptance/tarot-product-interpretation-completion-acceptance-v1.json',
 successor:'content/interpretation/tarot/reconciliation/tarot-product-interpretation-current-successor-v1.json',
 prehuman:'content/production/symbolic-method/reconciliation/tarot-prehuman-current-successor-v2.json'
};
const authorities=Object.freeze({
 cardRegistry:read(P.cards),visualCorpus:read(P.visual),visualLocator:read(P.visualLoc),sourceRegistry:read(P.sourceRegistry),perspectiveRegistry:read(P.perspective),waiteCorpus:read(P.waite),editorialCorpus:read(P.editorial),cardReflectiveCorpus:read(P.reflective),productCompositionCorpus:read(P.composition),noSourceBlendingContract:read(P.blend),corpusFreeze:read(P.corpusFreeze),productInterpretationFreeze:read(P.freeze)
});
const coverage=read(P.coverage),contract=read(P.contract),freeze=read(P.freeze),acceptance=read(P.acceptance),successor=read(P.successor),prehuman=read(P.prehuman);

assert.equal(authorities.editorialCorpus.baselineCommit,BASE);assert.equal(authorities.cardReflectiveCorpus.baselineCommit,BASE);assert.equal(authorities.productCompositionCorpus.baselineCommit,BASE);
assert.equal(authorities.editorialCorpus.entries.length,78);assert.equal(authorities.cardReflectiveCorpus.entries.length,78);assert.equal(authorities.productCompositionCorpus.entries.length,78);
assert.equal(authorities.visualCorpus.entries.length,78);assert.equal(authorities.waiteCorpus.entries.length,78);
assert.equal(coverage.counts.missingEditorial,0);assert.equal(coverage.counts.missingReflective,0);assert.equal(coverage.counts.missingComposition,0);
assert.equal(contract.productionBoundary.runAllowed,false);assert.equal(contract.humanBoundary.machineEditorialCompletionMayCountAsHumanApproval,false);

const cards=authorities.cardRegistry.entries;const cardIds=new Set(cards.map(x=>x.cardId));
for(const [name,list] of [['editorial',authorities.editorialCorpus.entries],['reflective',authorities.cardReflectiveCorpus.entries],['composition',authorities.productCompositionCorpus.entries]]){
 assert.equal(new Set(list.map(x=>x.cardId)).size,78,`${name} card duplicate`);assert.deepEqual(new Set(list.map(x=>x.cardId)),cardIds,`${name} coverage drift`);
}
for(const e of authorities.editorialCorpus.entries){
 assert.equal(e.sourceId,'TAR-SRC-WAITE-PKT-1910');assert.equal(e.orientation,'UPRIGHT');assert.ok(e.paraphraseEn.length>=70,`${e.cardId} English paraphrase too thin`);assert.ok(e.paraphraseZhHans.length>=20,`${e.cardId} Chinese paraphrase too thin`);assert.ok(e.sourceUnitIds.length>=1);assert.equal(e.provenance.originalTextVendored,false);assert.equal(e.boundaries.universalMeaning,false);assert.equal(e.boundaries.realityTruth,false);assert.equal(e.boundaries.prediction,false);assert.equal(e.boundaries.diagnosis,false);assert.equal(e.boundaries.hiddenStateFact,false);assert.equal(e.boundaries.decisionAuthority,false);
}
for(const e of authorities.cardReflectiveCorpus.entries){
 assert.equal(e.prompts.length,3,`${e.cardId} prompt coverage`);assert.deepEqual(new Set(e.prompts.map(x=>x.focusId)),new Set(['ATTENTION','TENSION','NEXT_OBSERVATION']));
 for(const p of e.prompts){assert.ok(p.questionEn.endsWith('?'));assert.ok(p.questionZhHans.endsWith('？'));assert.equal(p.cardSpecific,true);assert.equal(p.requiresRealityCheck,true);assert.equal(p.mayAssertPresence,false);assert.equal(p.mayInferHiddenState,false);assert.equal(p.mayDiagnose,false);assert.equal(p.mayPredict,false);assert.equal(p.mayDirectDecision,false);}
}
for(const e of authorities.productCompositionCorpus.entries){assert.equal(e.compositionRules.visualObservationIsInterpretation,false);assert.equal(e.compositionRules.waiteParaphraseIsUniversalMeaning,false);assert.equal(e.compositionRules.reflectionMayCreateFact,false);assert.equal(e.compositionRules.realityComparisonRequired,true);assert.equal(e.compositionRules.decisionAuthority,'USER');assert.equal(e.reflectivePromptRefs.length,3);}

for(const [name,item] of Object.entries(freeze.artifacts)){assert.ok(fs.existsSync(item.path),`freeze artifact missing ${name}`);assert.equal(item.sha256,sha(item.path),`freeze drift ${name}`);}
assert.equal(acceptance.freeze.sha256,sha(P.freeze));assert.equal(acceptance.accepted.waiteEditorialParaphrase78,true);assert.equal(acceptance.accepted.productComposition78,true);assert.equal(acceptance.humanBoundary.humanUsefulnessAcceptanceClaimed,false);
assert.equal(successor.status,'CURRENT_78_CARD_PRODUCT_INTERPRETATION_COMPLETE_PRODUCT_EXECUTION_CLOSED');assert.equal(successor.productionBoundary.runAllowed,false);for(const item of Object.values(successor.current)){assert.equal(item.sha256,sha(item.path),`current successor drift ${item.path}`);}
assert.equal(prehuman.status,'PRODUCT_INTERPRETATION_78_OF_78_COMPLETE_PREVIOUS_HUMAN_PREFLIGHT_SUPERSEDED_REGENERATION_REQUIRED');assert.equal(prehuman.supersededHumanEvidence.mayBeSignedOffAgainstJ0Runtime,false);for(const [k,p] of Object.entries(prehuman.inputs))assert.equal(prehuman.inputDigests[k],sha(p),`prehuman input drift ${k}`);

async function projectionsFromEvidence(evidence,prefix){const results=await createTarotRuntime(tarotAuthorities).calculateSpread({runtimeCode:TAROT_RUNTIME_CODE,calculationIdPrefix:`${prefix}-CALC`,evidence});return createTarotCardProjector().projectSpread({calculationResults:results,projectionVersion:'1.0.0'});}
const compEvidence={generatedAt:'2026-08-24T16:00:00.000Z',authorityDigests:{corpusFreezeSha256:sha(P.corpusFreeze),productInterpretationFreezeSha256:sha(P.freeze)},boundaryContractVersions:{rcc:'1.0.0',agency:'1.0.0',uncertainty:'1.0.0',compositionEvidence:'1.0.0'}};
function makeIr(projections,question,realityEvidence={}){return createTarotReadingIR({question,contextDisclosure:{currentRealityContextUsed:false,contextUseWasExplicit:true},projections,authorities,realityEvidence,compositionEvidence:compEvidence});}

// W38A/B/C/D/E: every card must produce a substantive source-bound product interpretation.
const seen=new Set();const promptIds=new Set();
for(let i=0;i<cards.length;i++){
 const c=cards[i];const ev=await manualOne(c.cardId,`TPAJ0-ONE-${String(i+1).padStart(2,'0')}`);const projections=await projectionsFromEvidence(ev,`TPAJ0-ONE-${i+1}`);const binding=bindTarotProductInterpretationProjections(projections,authorities);
 const b=binding.cards[0],author=b.sourcePerspectives.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC'),reflective=b.sourcePerspectives.find(x=>x.perspectiveClass==='REFLECTIVE');
 assert.equal(author.availability,'SOURCE_LOCATOR_AND_EDITORIAL_PARAPHRASE_AVAILABLE');assert.equal(author.editorialClaims.length,1);assert.ok(author.editorialClaims[0].claimEn.length>=70);assert.equal(reflective.inquiryUnits.length,3);
 const ir=makeIr(projections,`What deserves attention around ${c.canonicalTitle}?`);assert.equal(ir.schemaVersion,TAROT_READING_IR_SCHEMA);assert.equal(ir.readingIrVersion,TAROT_READING_IR_VERSION);assert.equal(ir.productInterpretationComplete,true);assert.equal(ir.sourcePerspectives[0].productInterpretation.cardId,c.cardId);assert.equal(ir.sourcePerspectives[0].perspectives.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC').editorialClaims.length,1);
 assert.ok(!ir.uncertainty.states.some(x=>String(x.reason).includes('EDITORIAL_PARAPHRASE_NOT_INGESTED')),`${c.cardId} still reports missing editorial`);
 assert.equal(ir.reflectiveComposition.questions.length,1);assert.equal(ir.reflectiveComposition.questions[0].cardSpecificInquiry,true);promptIds.add(ir.reflectiveComposition.questions[0].promptId);
 const view=createTarotProductPublicViewModel(ir);assert.equal(view.production.productInterpretationComplete,true);assert.equal(view.production.runAllowed,false);assert.equal(view.tarotSurface.cards[0].waitePerspective.editorialClaims.length,1);assert.ok(view.tarotSurface.cards[0].productInterpretation.productLeadEn.length>40);seen.add(c.cardId);
}
assert.equal(seen.size,78);assert.equal(promptIds.size,78,'one-card ATTENTION prompts must remain card-specific');

// Product composition must also survive the governed three-card position grammar.
for(let i=0;i<26;i++){
 const group=cards.slice(i*3,i*3+3);const ev=await manualThree(group.map(x=>x.cardId),`TPAJ0-THREE-${String(i+1).padStart(2,'0')}`);const projections=await projectionsFromEvidence(ev,`TPAJ0-THREE-${i+1}`);const ir=makeIr(projections,`What should I examine before choosing a direction?`,{unknown:['The symbolic perspective does not establish the outcome.']});assert.equal(ir.cardObservations.length,3);assert.deepEqual(ir.reflectiveComposition.questions.map(x=>x.focusId),['ATTENTION','TENSION','NEXT_OBSERVATION']);assert.ok(ir.reflectiveComposition.questions.every(x=>x.cardSpecificInquiry===true));const view=createTarotProductPublicViewModel(ir);assert.equal(view.tarotSurface.cards.length,3);assert.ok(view.tarotSurface.cards.every(x=>x.waitePerspective.editorialClaims.length===1&&x.productInterpretation));
}

console.log('✓ TPA-J0 / W38A Waite 78/78 governed editorial paraphrase passed: every canonical card has a source-locator-bound bilingual paraphrase; no original Waite text is vendored and no universal meaning authority is created.');
console.log('✓ TPA-J0 / W38B Visual 78/78 continuity passed: canonical TAR-VIS remains meaning-free and is bound by card identity without mutation.');
console.log('✓ TPA-J0 / W38C Reflective 78/78 passed: 234 bilingual card-specific questions cover ATTENTION / TENSION / NEXT_OBSERVATION with RCC-required, no-diagnosis, no-prediction and no-hidden-state boundaries.');
console.log('✓ TPA-J0 / W38D Product composition 78/78 passed: all cards execute through adapter v3 → Reading IR v2 → Product View Model v2 with one Waite editorial perspective and card-specific governed reflection.');
console.log('✓ TPA-J0 / W38E completion freeze passed: machine product-interpretation coverage is complete; human usefulness approval, live browser, live SHA, PCM promotion and public runAllowed remain closed.');
console.log('  Previous 24-case Phase-J machine preflight is now superseded for sign-off and must be regenerated from this J0 successor before real human acceptance.');
