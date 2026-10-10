import assert from 'node:assert/strict';
import fs from 'node:fs';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const corpus=read(`${ROOT}/semantics/HD-PRO-R3-W5-authority-professional-meaning-corpus-v1.json`);
const admission=read(`${ROOT}/semantics/HD-PRO-R3-W5-authority-semantic-admission-v1.json`);
const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v2.json`);
const resolution=read(`${ROOT}/source/HD-PRO-R3-W5-authority-source-resolution-v1.json`);
const historicalW2C=read(`${ROOT}/source/HD-PRO-R3-W2C-source-school-reconciliation-v1.json`);
const units=read(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const candidates=read(`${ROOT}/claims/hd-pro-r3-semantic-claim-candidates-v1.json`);
const schema=read(`${ROOT}/claims/hd-pro-r3-semantic-claim-ir-v1.schema.json`);
const r2=read('content/customer-experience-rebuild/hd-pro-r2/hd-w10-production-cutover-v1.json');
const md=fs.readFileSync(`${ROOT}/semantics/HD-PRO-R3-W5-authority-professional-meaning-corpus.md`,'utf8');

const AUTH=['EMOTIONAL','SACRAL','SPLENIC','SELF_PROJECTED','EGO_MANIFESTED','EGO_PROJECTED','MENTAL_ENVIRONMENTAL','LUNAR'];
const REQUIRED=['decisionProcess','decisionTiming','prematureDecisionPattern','pressureDistortion','externalInfluence','realityEvidence','counterEvidence'];
const sourceById=new Map(units.sourceUnits.filter(x=>x.category==='AUTHORITY').map(x=>[x.sourceUnitId,x]));
const candidateBySubject=new Map(candidates.claims.filter(x=>x.subjectRefs?.[0]?.startsWith('AUTHORITY.')).map(x=>[x.subjectRefs[0],x]));
const resolutionByAuth=new Map(resolution.resolutions.map(x=>[x.canonicalAuthority,x]));

assert.equal(corpus.schemaVersion,'PHI-OS-HD-PRO-R3-W5-AUTHORITY-PROFESSIONAL-MEANING-CORPUS-v1.0.0');
assert.equal(corpus.baselineCommit,'ccac579a7e81dc27f7f6403df1c6446fba38bc25');
assert.equal(corpus.status,'AUTHORITY_PROFESSIONAL_SEMANTICS_ADMITTED_R3_SHADOW');
assert.equal(corpus.authority.r2State,'CUSTOMER_PUBLISHED');
assert.equal(corpus.authority.r3State,'SHADOW_CANDIDATE');
assert.equal(corpus.authority.phiosHumanDesignBirthCalculationAuthority,false);
assert.equal(corpus.authority.externalConfirmedChartRequired,true);
assert.equal(corpus.ownershipBoundary.atomicAuthorityMeaningIsCustomerReading,false);
assert.equal(corpus.ownershipBoundary.typeStrategyMayReplaceAuthority,false);
assert.equal(corpus.ownershipBoundary.genericFillerAllowed,false);
assert(corpus.ownershipBoundary.authorityOwns.includes('final_decision_reference'));
assert(corpus.ownershipBoundary.authorityOwns.includes('decision_timing'));

assert.equal(resolution.status,'AUTHORITY_8_OF_8_SOURCE_SCOPE_RESOLVED_FOR_SEMANTIC_ADMISSION_R3_SHADOW');
assert.equal(resolution.coverage.canonicalAuthorities,8);
assert.equal(resolution.coverage.directUserSourceAuthorities,4);
assert.equal(resolution.coverage.sharedFamilyResolvedAuthorities,2);
assert.equal(resolution.coverage.mixedFamilyDecomposedAuthorities,2);
assert.equal(resolution.coverage.resolvedForSemanticAdmission,8);
assert.equal(resolution.coverage.unresolved,0);
assert.equal(resolution.authorityBoundary.phiosHumanDesignBirthCalculationAuthority,false);
assert.equal(resolution.authorityBoundary.supportingReferenceMayOverrideConfirmedChart,false);
assert.equal(resolution.authorityBoundary.supportingReferenceDirectLongFormReuseAllowed,false);
assert.equal(resolution.historicalW2C.rewritten,false);
assert.deepEqual([...resolution.resolutions.map(x=>x.canonicalAuthority)].sort(),[...AUTH].sort());
for(const ref of resolution.supportingReferences){
  assert.equal(ref.sourceClass,'SUPPORTING_REFERENCE');
  assert.equal(ref.directLongFormReuseAllowed,false);
  assert.equal(ref.licenseForReproductionVerified,false);
  assert.match(ref.url,/^https:\/\/jovianarchive\.com\//);
}

// W5 must be a scoped successor; the historical W2C gap record remains historical evidence.
assert.equal(historicalW2C.schemaVersion,'PHI-OS-HD-PRO-R3-W2C-SOURCE-SCHOOL-RECONCILIATION-v1.0.0');
assert.equal(historicalW2C.status,'SOURCE_RECONCILIATION_COMPLETE_SEMANTIC_ADMISSION_STILL_PENDING');
const historicalAuthority=historicalW2C.reconciliation.find(x=>x.scope==='AUTHORITY');
assert.equal(historicalAuthority.status,'SCHOOL_VARIANT');
assert.equal(historicalAuthority.mappings.find(x=>x.canonical==='LUNAR').status,'SOURCE_PENDING');

assert.equal(corpus.semanticAdmission.canonicalAuthorityCount,8);
assert.equal(corpus.semanticAdmission.sourceScopeResolvedAuthorityUnits,8);
assert.equal(corpus.semanticAdmission.semanticAdmittedAuthorityUnits,8);
assert.equal(corpus.semanticAdmission.semanticLayerClaims,56);
assert.equal(corpus.semanticAdmission.compositionSupportedAuthorityUnits,0);
assert.equal(corpus.semanticAdmission.machineVerifiedAuthorityUnits,0);
assert.equal(corpus.semanticAdmission.humanAcceptedAuthorityUnits,0);
assert.equal(corpus.semanticAdmission.customerPublishableR3AuthorityUnits,0);
assert.deepEqual([...corpus.meaningUnits.map(x=>x.canonicalAuthority)].sort(),[...AUTH].sort());
assert.equal(new Set(corpus.meaningUnits.map(x=>x.meaningUnitId)).size,8);
assert.equal(new Set(corpus.semanticClaims.map(x=>x.claimId)).size,56);

const banned=[/注定/g,/保证你/g,/灵魂伴侣/g,/最适合的伴侣/g,/治愈/g,/治疗疾病/g,/guaranteed outcome/gi,/destined/gi,/soulmate/gi,/cure disease/gi];
for(const m of corpus.meaningUnits){
  const res=resolutionByAuth.get(m.canonicalAuthority);
  assert(res,`${m.canonicalAuthority} lacks W5 source resolution`);
  const primary=sourceById.get(m.sourceTrace.primarySourceUnitId);
  assert(primary,`${m.canonicalAuthority} lacks primary W2A source unit`);
  assert.equal(primary.sourceAdmissionStatus,'SOURCE_ADMITTED');
  assert.equal(m.sourceTrace.sourceTextSha256,primary.sourceTextSha256);
  assert.equal(m.sourceTrace.sourceFamily,res.sourceFamily);
  assert.equal(m.sourceTrace.w5ResolutionState,res.resolutionState);
  assert.deepEqual(m.sourceTrace.supportingReferenceIds,res.supportingRefs);
  assert.equal(m.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(m.compositionSupported,false);
  assert.equal(m.machineVerified,false);
  assert.equal(m.humanAccepted,false);
  assert.equal(m.customerPublishableR3,false);
  const expectedCandidate=candidateBySubject.get(`AUTHORITY.${res.sourceFamily}`) || candidateBySubject.get(`AUTHORITY.${m.canonicalAuthority}`);
  assert.equal(m.candidateClaimId,expectedCandidate?.claimId,`${m.canonicalAuthority} candidate trace missing`);
  for(const layer of REQUIRED){
    assert(m.requiredLayers[layer],`${m.canonicalAuthority} missing ${layer}`);
    assert(m.requiredLayers[layer].zhHans.length>=45,`${m.canonicalAuthority} ${layer} zh too shallow`);
    assert(m.requiredLayers[layer].en.length>=80,`${m.canonicalAuthority} ${layer} en too shallow`);
  }
  assert(m.realityCheckQuestions.length>=3,`${m.canonicalAuthority} needs >=3 reality questions`);
  assert(m.realityDomains.length>=4,`${m.canonicalAuthority} reality domains too sparse`);
  assert(m.legacySourceMaterialExcludedFromW5.length>=6,`${m.canonicalAuthority} boundary exclusions missing`);
  const customerText=[...Object.values(m.requiredLayers).flatMap(x=>[x.zhHans,x.en]),...m.realityCheckQuestions.flatMap(x=>[x.zhHans,x.en]),m.customerBoundary.zhHans,m.customerBoundary.en].join('\n');
  for(const re of banned){ re.lastIndex=0; assert.equal(re.test(customerText),false,`${m.canonicalAuthority} contains banned deterministic/sensitive phrase ${re}`); }
  const sourceText=primary.sourceText.zhHans;
  for(const layer of REQUIRED) assert.equal(sourceText.includes(m.requiredLayers[layer].zhHans),false,`${m.canonicalAuthority} ${layer} copied user source paragraph verbatim`);
}

const mental=corpus.meaningUnits.find(x=>x.canonicalAuthority==='MENTAL_ENVIRONMENTAL');
const lunar=corpus.meaningUnits.find(x=>x.canonicalAuthority==='LUNAR');
const egoM=corpus.meaningUnits.find(x=>x.canonicalAuthority==='EGO_MANIFESTED');
const egoP=corpus.meaningUnits.find(x=>x.canonicalAuthority==='EGO_PROJECTED');
const sacral=corpus.meaningUnits.find(x=>x.canonicalAuthority==='SACRAL');
assert.match(mental.requiredLayers.decisionTiming.zhHans,/没有统一的 29\.5 天|29\.5 天.*分开/);
assert.match(lunar.requiredLayers.decisionTiming.zhHans,/29\.5 天/);
assert.match(egoM.requiredLayers.decisionProcess.zhHans,/显示者|显化/);
assert.match(egoP.requiredLayers.decisionProcess.zhHans,/投射者/);
assert.match(egoP.requiredLayers.decisionProcess.zhHans,/邀请/);
assert.match(sacral.requiredLayers.decisionTiming.zhHans,/情绪权威.*优先|情绪时序优先/);
assert.equal(mental.sourceSemanticSegment,'ENVIRONMENTAL_DIALOGUE_ONLY_EXCLUDE_LUNAR_29_DAY_CONTENT');
assert.equal(lunar.sourceSemanticSegment,'LUNAR_CYCLE_CONTENT_ONLY_EXCLUDE_MENTAL_PROJECTOR_DIALOGUE_GENERALIZATION');

const validClaimTypes=new Set(schema.properties.claimType.enum);
for(const c of corpus.semanticClaims){
  assert.equal(c.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert(validClaimTypes.has(c.claimType),`${c.claimId} invalid claim type`);
  assert(c.subjectRefs[0].startsWith('AUTHORITY.'));
  assert.equal(c.semanticOwnerId,'human_design.authority');
  assert.equal(c.admissionStatus,'SOURCE_ADMITTED');
  assert.equal(c.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert(c.customerMeaning?.zhHans && c.customerMeaning?.en,`${c.claimId} missing bilingual meaning`);
  assert(c.customerBoundary?.zhHans && c.customerBoundary?.en,`${c.claimId} missing boundary`);
  assert.equal(c.compositionRuleId,null);
  assert.equal(c.compositionSupported,false);
  assert.equal(c.machineVerified,false);
  assert.equal(c.humanAccepted,false);
  assert.equal(c.customerPublishable,false);
}

assert.equal(admission.status,'AUTHORITY_8_OF_8_SEMANTIC_ADMITTED_COMPOSITION_PENDING');
assert.equal(admission.coverage.canonicalAuthorities,8);
assert.equal(admission.coverage.userAuthoredSourceFamilies,6);
assert.equal(admission.coverage.sourceScopeResolved,8);
assert.equal(admission.coverage.semanticAdmitted,8);
assert.equal(admission.coverage.semanticCoveragePct,100);
assert.equal(admission.coverage.semanticLayerClaims,56);
assert.equal(admission.coverage.compositionSupported,0);
assert.equal(admission.coverage.r3CustomerPublishable,0);
assert.equal(admission.boundaryResolution.mentalAndLunarSeparated,true);
assert.equal(admission.boundaryResolution.egoManifestedAndEgoProjectedSeparated,true);
assert.equal(admission.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(admission.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(admission.publication.r3AuthorityCorpusMayRenderDirectlyToCustomer,false);
assert.equal(admission.publication.r2HumanReviewInherited,false);

const byCategory=Object.fromEntries(status.categories.map(x=>[x.category,x]));
assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v2.0.0');
assert.equal(status.updatedByWork,'HD-PRO-R3-W5');
assert.equal(status.r2State,'CUSTOMER_PUBLISHED');
assert.equal(status.r3State,'SHADOW_CANDIDATE');
assert.equal(status.historicalStatusRewritten,false);
assert.equal(byCategory.TYPE.semanticAdmitted,5);
assert.equal(byCategory.AUTHORITY.expected,8);
assert.equal(byCategory.AUTHORITY.sourceAdmittedFamilies,6);
assert.equal(byCategory.AUTHORITY.sourceScopeResolved,8);
assert.equal(byCategory.AUTHORITY.semanticAdmitted,8);
assert.equal(byCategory.AUTHORITY.compositionSupported,0);
assert.equal(byCategory.AUTHORITY.customerPublishableR3,0);
for(const k of ['PROFILE','CENTER','CHANNEL','GATE','DEFINITION','VARIABLE_PHS']) assert.equal(byCategory[k].semanticAdmitted,0,`${k} was admitted early by W5`);
assert.equal(status.aggregate.typeSemanticCoveragePct,100);
assert.equal(status.aggregate.authoritySemanticCoveragePct,100);
assert.equal(status.aggregate.compositionSupportedCoveragePct,0);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W6 Profile Professional Meaning Corpus');

assert.equal(r2.cutover.customerInterpretiveReading,'CUSTOMER_PUBLISHED');
assert.equal(r2.cutover.realityComposition,'CUSTOMER_PUBLISHED');
for(const token of ['final decision reference, decision process and timing','EGO_MANIFESTED','MENTAL_ENVIRONMENTAL','LUNAR','SHADOW_CANDIDATE','CUSTOMER_PUBLISHED']) assert(md.includes(token),`W5 note missing ${token}`);

console.log('✓ HD-PRO-R3-W5 Authority Professional Meaning Corpus passed.');
console.log('  8/8 canonical Authorities are source-scope resolved and SEMANTIC_ADMITTED with seven professional decision layers each; composition, R3 human acceptance and customer publication remain gated.');
