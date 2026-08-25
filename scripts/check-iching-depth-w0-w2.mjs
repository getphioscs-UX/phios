import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {createIChingDepthCoverageSnapshot} from '../functions/interpretation-runtime/iching-depth-coverage-taxonomy-v1.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const base='content/interpretation/iching';
const taxonomy=read(`${base}/reconciliation/iching-depth-coverage-taxonomy-successor-v1.json`);
const schema=read(`${base}/contracts/iching-depth-interpretation-entry-v1.schema.json`);
const dimensions=read(`${base}/registries/iching-depth-interpretation-dimension-registry-v1.json`);
const editorial=read(`${base}/authority/iching-depth-editorial-authority-contract-v1.json`);
const admission=read(`${base}/registries/iching-depth-source-admission-registry-v1.json`);
const fixtures=read(`${base}/fixtures/iching-depth-entry-schema-fixtures-v1.json`);
const corpus=read(`${base}/corpus/iching-public-domain-canonical-corpus-v2.json`);
const hexagrams=read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json');

function validateDepthEntry(entry){
  const errors=[];
  if(entry?.schemaVersion!=='PHI-OS-ICHI-DEPTH-INTERPRETATION-ENTRY-v1.0.0') errors.push('SCHEMA_VERSION');
  if(entry?.methodCode!=='I_CHING') errors.push('METHOD_CODE');
  if(!/^HEXAGRAM-(0[1-9]|[1-5][0-9]|6[0-4])$/.test(entry?.hexagramId||'')) errors.push('HEXAGRAM_ID');
  if(!['HEXAGRAM','LINE'].includes(entry?.scope)) errors.push('SCOPE');
  if(!['PHIOS_PLAIN_LANGUAGE_INTERPRETATION','PHIOS_DEPTH_EDITORIAL_INTERPRETATION'].includes(entry?.contentClass)) errors.push('CONTENT_CLASS');
  if(!Array.isArray(entry?.sourceBindings?.sourceIds)||entry.sourceBindings.sourceIds.length===0) errors.push('SOURCE_IDS');
  if(!Array.isArray(entry?.sourceBindings?.sourceClaimRefs)||entry.sourceBindings.sourceClaimRefs.length===0) errors.push('SOURCE_CLAIM_REFS');
  if(entry?.sourceBindings?.sourceTextCopied!==false) errors.push('SOURCE_TEXT_COPIED');
  if(!entry?.localeProjections?.['zh-Hans']||!entry?.localeProjections?.en) errors.push('LOCALES');
  if(entry?.scope==='HEXAGRAM'&&(!entry.hexagramInterpretation||entry.linePosition!==undefined||entry.lineInterpretation!==undefined)) errors.push('HEXAGRAM_SHAPE');
  if(entry?.scope==='LINE'&&(!Number.isInteger(entry.linePosition)||entry.linePosition<1||entry.linePosition>6||!entry.lineInterpretation||entry.hexagramInterpretation!==undefined)) errors.push('LINE_SHAPE');
  if(entry?.authority?.canonicalMeaningCreated!==false||entry?.authority?.realityTruthCreated!==false||entry?.authority?.fateConclusionCreated!==false||entry?.authority?.professionalJudgmentCreated!==false||entry?.authority?.runtimeModelGenerationAllowed!==false) errors.push('AUTHORITY_BOUNDARY');
  const approved=entry?.review?.status==='HUMAN_APPROVED';
  if(approved&&!(entry.review.humanApproved===true&&typeof entry.review.reviewer==='string'&&entry.review.reviewer&&Number.isFinite(Date.parse(entry.review.reviewedAt))&&entry.review.sourceFidelityChecked===true&&entry.review.localeFidelityChecked===true&&entry.review.boundaryChecked===true)) errors.push('HUMAN_APPROVAL');
  if(!approved&&entry?.review?.humanApproved!==false) errors.push('NON_APPROVED_STATE');
  return {valid:errors.length===0,errors};
}

assert.equal(taxonomy.work,'ICHI-DEPTH-W0');
for(const predecessor of taxonomy.predecessors){
  assert.equal(sha(predecessor.path),predecessor.sha256,`ICHI_DEPTH_PREDECESSOR_DRIFT:${predecessor.path}`);
  assert.equal(predecessor.mutated,false);
}
const snapshot=createIChingDepthCoverageSnapshot({hexagramRegistry:hexagrams,corpus,editorialEntries:[]});
assert.equal(snapshot.coverage.canonicalStructure.coverage,'64/64');
assert.equal(snapshot.coverage.canonicalHexagramText.coverage,'64/64');
assert.equal(snapshot.coverage.canonicalLineText.coverage,'384/384');
assert.equal(snapshot.coverage.historicalSourceCommentaryHexagram.coverage,'2/64');
assert.equal(snapshot.coverage.historicalSourceCommentaryLine.coverage,'12/384');
assert.equal(snapshot.coverage.phiosPlainLanguageHexagram.coverage,'0/64');
assert.equal(snapshot.coverage.phiosPlainLanguageLine.coverage,'0/384');
assert.equal(snapshot.coverage.phiosDepthHexagram.coverage,'0/64');
assert.equal(snapshot.coverage.phiosDepthLine.coverage,'0/384');
assert.equal(snapshot.readiness.canonicalWitnessReady,true);
assert.equal(snapshot.readiness.customerDepthReady,false);
assert.equal(snapshot.separation.canonicalTextDoesNotSatisfyCommentaryCoverage,true);
assert.equal(snapshot.readiness.publicProductionEligible,false);

assert.equal(dimensions.work,'ICHI-DEPTH-W1');
assert.equal(dimensions.hexagramDimensions.length,9);
assert.equal(dimensions.lineDimensions.length,7);
assert.deepEqual(dimensions.localePolicy.requiredLocales,['zh-Hans','en']);
assert.equal(dimensions.productionBoundary.entriesAdmitted,0);
assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');
assert.equal(schema.additionalProperties,false);
assert.ok(schema.required.includes('sourceBindings')&&schema.required.includes('localeProjections')&&schema.required.includes('review')&&schema.required.includes('authority'));
for(const entry of fixtures.entries){const result=validateDepthEntry(entry);assert.equal(result.valid,true,JSON.stringify(result.errors));}
const invalid=structuredClone(fixtures.entries[1]);
invalid.sourceBindings.sourceClaimRefs=[];
assert.equal(validateDepthEntry(invalid).valid,false,'ICHI_DEPTH_EMPTY_SOURCE_BINDING_MUST_FAIL');
const invalidRuntime=structuredClone(fixtures.entries[0]);
invalidRuntime.authority.runtimeModelGenerationAllowed=true;
assert.equal(validateDepthEntry(invalidRuntime).valid,false,'ICHI_DEPTH_RUNTIME_MODEL_GAP_FILL_MUST_FAIL');
const invalidLine=structuredClone(fixtures.entries[1]);
delete invalidLine.linePosition;
assert.equal(validateDepthEntry(invalidLine).valid,false,'ICHI_DEPTH_LINE_POSITION_MUST_BE_REQUIRED');
assert.ok(fixtures.entries.every(entry=>entry.review.status==='CANDIDATE'&&entry.review.humanApproved===false));

assert.equal(editorial.work,'ICHI-DEPTH-W2');
assert.equal(editorial.status,'ACTIVE_FAIL_CLOSED_NO_DEPTH_ENTRY_HUMAN_APPROVED');
assert.equal(editorial.humanApprovalAuthority.modelApprovalAllowed,false);
assert.equal(editorial.modelRole.runtimeGapFillAllowed,false);
assert.equal(editorial.authorityBoundaries.mayCreateUniversalTrueMeaning,false);
assert.equal(editorial.admissionGate.humanApprovedEntryCount,0);
assert.equal(editorial.admissionGate.publicDepthReady,false);
assert.equal(admission.work,'ICHI-DEPTH-W2');
assert.equal(sha(admission.predecessorSourceRegistry.path),admission.predecessorSourceRegistry.sha256);
assert.equal(admission.predecessorSourceRegistry.mutated,false);
const byId=new Map(admission.sources.map(source=>[source.sourceId,source]));
assert.equal(byId.get('ICH-SRC-ZHOUYI-ANCIENT-CN-WITNESS-25501').admissionState,'ADMITTED_CANONICAL_WITNESS');
assert.equal(byId.get('ICH-SRC-RESEARCH-BAIHUA-YIJING-SUN-ZHENSHENG').admissionState,'RESEARCH_ONLY_RIGHTS_REVIEW_REQUIRED');
assert.equal(byId.get('ICH-SRC-RESEARCH-RA-URU-HU-64-EVOLUTIONARY-STEPS').admissionState,'DERIVED_SYSTEM_RESEARCH_ONLY');
assert.equal(byId.get('ICH-SRC-RESEARCH-RICHARD-RUDD-GENE-KEYS').admissionState,'EXCLUDED_FROM_PUBLIC_CORPUS');
assert.ok(admission.sources.filter(source=>source.sourceId.includes('RESEARCH')).every(source=>source.maySatisfyPhiosDepthCoverageWithoutHumanReview===false));
assert.equal(admission.governance.physicalOwnershipCreatesPublicReuseRights,false);
assert.equal(admission.governance.humanEditorialAdmissionRequiredForPhiosDepth,true);

console.log('✓ ICHI-DEPTH-W0 coverage taxonomy passed: canonical 64/64 + 384/384 remain separate from historical 2/64 + 12/384 and PHI OS depth 0/448.');
console.log('✓ ICHI-DEPTH-W1 depth interpretation schema passed: hexagram/line dimensions, bilingual projections, source bindings and fail-closed review are enforced.');
console.log('✓ ICHI-DEPTH-W2 source/editorial authority passed: public-domain authorities remain source-bound; user materials are research-only or excluded from the public corpus.');
