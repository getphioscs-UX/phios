import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const ROOT=process.cwd();
const BASE='f10a0bc30526b5551ca00ffa9c674f2798d7fd7e';
const readJson=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const exists=p=>assert.ok(fs.existsSync(path.join(ROOT,p)),`missing ${p}`);
const P={
 cards:'content/professional/core-method-runtime/tarot-card-registry-v1.json',
 visual:'content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json',
 visualLoc:'content/interpretation/tarot/registries/tarot-visual-evidence-locator-v1.json',
 waite:'content/interpretation/tarot/corpus/tarot-waite-source-bound-corpus-v1.json',
 min:'content/interpretation/tarot/corpus/tarot-minimum-source-bound-corpus-v1.json',
 privateCoverage:'content/interpretation/tarot/research/tarot-private-reference-coverage-v1.json',
 lens:'content/interpretation/tarot/registries/tarot-reflective-lens-registry-v1.json',
 perspectiveV1:'content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v1.json',
 perspectiveV2:'content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v2.json',
 blend:'content/interpretation/tarot/contracts/tarot-no-source-blending-contract-v1.json',
 coverage:'content/interpretation/tarot/coverage/tarot-corpus-coverage-matrix-v1.json',
 acceptance:'content/interpretation/tarot/acceptance/tarot-corpus-acceptance-v1.json',
 freeze:'content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json',
 successor:'content/interpretation/tarot/reconciliation/tarot-corpus-current-successor-v1.json',
 tiers:'content/interpretation/tarot/registries/tarot-source-tier-registry-v1.json',
 pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
 publicCatalog:'content/web-production/px2/successors/public-method-catalog-v2.json'
};
for(const p of Object.values(P)) exists(p);
const cards=readJson(P.cards), visual=readJson(P.visual), visualLoc=readJson(P.visualLoc), waite=readJson(P.waite), min=readJson(P.min), priv=readJson(P.privateCoverage), lens=readJson(P.lens), p1=readJson(P.perspectiveV1), p2=readJson(P.perspectiveV2), blend=readJson(P.blend), cov=readJson(P.coverage), acc=readJson(P.acceptance), freeze=readJson(P.freeze), succ=readJson(P.successor), tiers=readJson(P.tiers);

// W16 — governed reflective lens is question scaffolding, never card meaning or clinical authority.
assert.equal(lens.baselineCommit,BASE); assert.equal(lens.status,'ACTIVE_GOVERNED_REFLECTIVE_INQUIRY_NO_CARD_MEANING_AUTHORITY'); assert.equal(lens.authorityTier,'T2'); assert.equal(lens.lensUnits.length,16);
assert.equal(lens.globalRules.cardSpecificMeaningMappingAllowed,false); assert.equal(lens.globalRules.universalCardTruthAllowed,false); assert.equal(lens.globalRules.diagnosisAllowed,false); assert.equal(lens.globalRules.unconsciousHiddenStateCertaintyAllowed,false); assert.equal(lens.globalRules.thirdPartyHiddenStateInferenceAllowed,false); assert.equal(lens.globalRules.futurePredictionAllowed,false); assert.equal(lens.globalRules.professionalDecisionDirectiveAllowed,false); assert.equal(lens.globalRules.reflectionMustRemainQuestionOrPossibility,true); assert.equal(lens.globalRules.realityEvidenceMayContradictReflection,true); assert.equal(lens.globalRules.sourceTextCopied,false); assert.equal(lens.runtimeBinding.tariRuntimeConsumerRebound,false); assert.equal(lens.runtimeBinding.rebindRequiredAt,'TPA-W21');
const focus=new Set();
for(const u of lens.lensUnits){ assert.ok(!focus.has(u.focusId),`duplicate lens focus ${u.focusId}`); focus.add(u.focusId); assert.ok(u.questionEn.endsWith('?')||u.questionEn.endsWith('.')); assert.ok(u.questionZhHans.length>0); assert.equal(u.mayAssertPresence,false); assert.equal(u.mayInferHiddenState,false); assert.equal(u.mayDiagnose,false); assert.equal(u.mayPredict,false); assert.equal(u.requiresRealityCheck,true); assert.ok(Array.isArray(u.eligiblePerspectiveClasses)&&u.eligiblePerspectiveClasses.length>0); for(const c of u.eligiblePerspectiveClasses) assert.ok(['REFLECTIVE','PSYCHOLOGICAL'].includes(c)); assert.ok(!('cardId' in u)); assert.ok(!('meaning' in u)); }
assert.equal(focus.size,16);

// W17 — perspective classes preserved, availability explicit, psychological means non-diagnostic reflective inquiry only.
assert.equal(p2.baselineCommit,BASE); assert.equal(p2.status,'ACTIVE_PERSPECTIVE_AVAILABILITY_SUCCESSOR_RUNTIME_REBIND_DEFERRED'); assert.equal(p2.predecessor.path,P.perspectiveV1); assert.equal(p2.predecessor.sha256,sha256(P.perspectiveV1)); assert.deepEqual(p2.allowedPerspectiveClasses,p1.allowedPerspectiveClasses); assert.deepEqual(p2.availabilityStates,['AVAILABLE','PARTIAL','NOT_INGESTED','SOURCE_RESTRICTED','UNKNOWN']);
assert.deepEqual(new Set(p2.perspectives.map(x=>x.perspectiveClass)),new Set(p2.allowedPerspectiveClasses));
const byClass=new Map(p2.perspectives.map(x=>[x.perspectiveClass,x]));
const wa=byClass.get('AUTHOR_SPECIFIC'); assert.equal(wa.availability,'PARTIAL'); assert.equal(wa.sourceLocatorCardCoverage,78); assert.equal(wa.sourceLocatorUnitCount,100); assert.equal(wa.editorialRuntimeCardCoverage,3); assert.equal(wa.mayClaimUniversalMeaning,false); assert.equal(wa.mayClaimRealityTruth,false);
const ref=byClass.get('REFLECTIVE'); assert.equal(ref.availability,'AVAILABLE'); assert.equal(ref.authorityTier,'T2'); assert.equal(ref.cardSpecificMeaningCoverage,0); assert.equal(ref.mayInferHiddenState,false); assert.equal(ref.mayDiagnose,false);
const psy=byClass.get('PSYCHOLOGICAL'); assert.equal(psy.availability,'AVAILABLE'); assert.equal(psy.authorityTier,'T2'); assert.equal(psy.cardSpecificMeaningCoverage,0); assert.equal(psy.mayInferHiddenState,false); assert.equal(psy.mayDiagnose,false); assert.ok(psy.forbiddenClaims.includes('MENTAL_HEALTH_DIAGNOSIS')); assert.ok(psy.forbiddenClaims.includes('THIRD_PARTY_HIDDEN_STATE_CERTAINTY'));
const trad=byClass.get('TRADITIONAL'); assert.equal(trad.availability,'NOT_INGESTED'); assert.equal(trad.cardSpecificMeaningCoverage,0);
assert.equal(p2.displayPolicy.missingPerspectiveMayBeInvented,false); assert.equal(p2.displayPolicy.unavailablePerspectiveMustRemainUnavailable,true); assert.equal(p2.displayPolicy.crossSourceFusionIntoTrueMeaningAllowed,false); assert.equal(p2.displayPolicy.psychologicalLabelDoesNotGrantClinicalAuthority,true); assert.equal(p2.runtimeBinding.tariRuntimeConsumerRebound,false);

// W18 — no source blending, no voting, no private/web runtime leakage.
assert.equal(blend.baselineCommit,BASE); assert.equal(blend.status,'FROZEN_PARALLEL_ORIGIN_PRESERVATION_NO_UNIVERSAL_SYNTHESIS'); assert.equal(blend.predecessor.sha256,sha256(blend.predecessor.path)); assert.deepEqual(blend.originLayers.map(x=>x.authorityTier),['T0','T1','T2','T3','T4','T5']);
assert.equal(blend.comparisonRules.parallelPresentationAllowed,true); assert.equal(blend.comparisonRules.convergenceMayBeDescribed,true); assert.equal(blend.comparisonRules.divergenceMayBeDescribed,true); assert.equal(blend.comparisonRules.provenanceRequiredForSourceClaims,true); assert.equal(blend.comparisonRules.visualObservationMustRemainMeaningFree,true);
for(const [k,v] of Object.entries(blend.forbidden)) assert.equal(v,true,`${k} must remain forbidden`);
assert.equal(blend.originLayers.find(x=>x.authorityTier==='T4').runtimeAllowed,false); assert.equal(blend.originLayers.find(x=>x.authorityTier==='T5').runtimeAllowed,false); assert.equal(blend.runtimeBinding.tariRuntimeConsumerRebound,false);

// W19 — coverage matrix reflects actual corpus, including intentional gaps.
assert.equal(cov.baselineCommit,BASE); assert.equal(cards.entries.length,78); assert.equal(visual.entries.length,78); assert.equal(visualLoc.entries.length,78); assert.equal(waite.entries.length,78); assert.equal(waite.coverage.totalSourceUnits,100); assert.equal(min.entries.length,3); assert.equal(priv.sources.length,3);
assert.deepEqual(cov.coverage,{canonicalCards:78,majorArcana:22,minorArcana:56,visualObservationCards:78,visualEvidenceLocators:78,waiteSourceMappedCards:78,waiteSourceUnits:100,waiteEditorialRuntimeCardsFromFrozenPredecessor:3,reflectiveLensUnits:16,perspectiveClasses:4,privateReferenceSources:3,licensedModernSourcesAdmitted:0,webDiscoverySourcesPromoted:0});
const covClass=new Map(cov.perspectiveCoverage.map(x=>[x.perspectiveClass,x])); assert.equal(covClass.get('AUTHOR_SPECIFIC').availability,'PARTIAL'); assert.equal(covClass.get('AUTHOR_SPECIFIC').sourceLocatorCards,78); assert.equal(covClass.get('AUTHOR_SPECIFIC').editorialRuntimeCards,3); assert.equal(covClass.get('REFLECTIVE').availability,'AVAILABLE'); assert.equal(covClass.get('REFLECTIVE').cardSpecificMeaningEntries,0); assert.equal(covClass.get('PSYCHOLOGICAL').availability,'AVAILABLE'); assert.equal(covClass.get('PSYCHOLOGICAL').clinicalAuthority,false); assert.equal(covClass.get('TRADITIONAL').availability,'NOT_INGESTED');
for(const v of Object.values(cov.coverageRules)) assert.equal(v,true);

// W20 — acceptance/freeze pin corpus authority without activating runtime or product.
assert.equal(acc.baselineCommit,BASE); assert.equal(acc.status,'ACCEPTED_CANONICAL_CORPUS_READY_FOR_TARI_REBIND_NOT_PRODUCT_ACTIVATED'); for(const [k,v] of Object.entries(acc.accepted)) assert.equal(v,true,`${k} not accepted`); assert.equal(acc.productionBoundary.tariRuntimeConsumerRebound,false); assert.equal(acc.productionBoundary.rebindRequiredAt,'TPA-W21');
assert.equal(freeze.baselineCommit,BASE); assert.equal(freeze.status,'FROZEN_CANONICAL_CORPUS_READY_FOR_TARI_REBIND_NOT_PRODUCT_ACTIVATED'); for(const [name,item] of Object.entries(freeze.frozenArtifacts)){ exists(item.path); assert.equal(sha256(item.path),item.sha256,`freeze drift ${name}: ${item.path}`); } for(const v of Object.values(freeze.invariants)) assert.equal(v,true);
assert.equal(succ.baselineCommit,BASE); assert.equal(succ.status,'CANONICAL_CORPUS_FROZEN_TARI_REBIND_DEFERRED'); assert.equal(succ.currentAuthority.freeze,P.freeze); assert.equal(succ.currentAuthority.freezeSha256,sha256(P.freeze)); for(const item of Object.values(succ.preservedPredecessors)) assert.equal(item.sha256,sha256(item.path),`predecessor drift ${item.path}`); assert.equal(succ.runtimeBinding.tariRuntimeConsumerRebound,false); assert.equal(succ.runtimeBinding.rebindRequiredAt,'TPA-W21'); assert.equal(succ.runtimeBinding.newPerspectiveRegistryMayNotBeConsumedBeforeRebind,true);
for(const k of ['runAllowedChanged','productionCapabilityPromoted','persistenceActivated','humanAcceptanceClaimed','liveBrowserAcceptanceClaimed','liveProductionShaAlignmentClaimed']) assert.equal(succ.productionBoundary[k],false,`${k} must remain false`);
const t2=tiers.tiers.find(x=>x.tier==='T2'); assert.ok(t2); assert.ok(t2.allowedRole.includes('REFLECTIVE_PERSPECTIVE')); assert.ok(t2.forbiddenRole.includes('DIAGNOSIS')); assert.ok(t2.forbiddenRole.includes('HIDDEN_STATE_CERTAINTY'));
const pcm=readJson(P.pcm), tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT'); assert.ok(tarPcm); assert.equal(tarPcm.userExecutable,false); assert.equal(tarPcm.productionAccepted,false);
const cat=readJson(P.publicCatalog), tarPublic=cat.methods.find(x=>x.methodCode==='TAROT'); assert.ok(tarPublic); assert.equal(tarPublic.runAllowed,false);

console.log('✓ TPA-W16 governed reflective lens passed: 16 bilingual inquiry units, no card-meaning, diagnosis, hidden-state or prediction authority.');
console.log('✓ TPA-W17 perspective availability passed: 4 preserved classes with explicit AVAILABLE/PARTIAL/NOT_INGESTED states; psychological remains non-diagnostic.');
console.log('✓ TPA-W18 no-source-blending passed: T0–T5 origins remain separable; no voting, universal synthesis, private-reference or web-discovery runtime leakage.');
console.log('✓ TPA-W19 corpus coverage matrix passed: 78 cards + 78 VIS + 78 Waite locators/100 units + 16 reflective lenses, with intentional perspective gaps preserved.');
console.log('✓ TPA-W20 corpus freeze passed: frozen canonical corpus is ready for TPA-W21 TARI rebind while public execution and production promotion remain closed.');
console.log(`  corpus freeze sha256=${sha256(P.freeze)}`);
