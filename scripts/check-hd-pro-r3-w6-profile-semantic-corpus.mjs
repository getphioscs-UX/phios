import assert from 'node:assert/strict';
import fs from 'node:fs';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const corpus=read(`${ROOT}/semantics/HD-PRO-R3-W6-profile-professional-meaning-corpus-v1.json`);
const admission=read(`${ROOT}/semantics/HD-PRO-R3-W6-profile-semantic-admission-v1.json`);
const resolution=read(`${ROOT}/source/HD-PRO-R3-W6-profile-source-resolution-v1.json`);
const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v3.json`);
const historicalStatus=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v2.json`);
const units=read(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const candidates=read(`${ROOT}/claims/hd-pro-r3-semantic-claim-candidates-v1.json`);
const schema=read(`${ROOT}/claims/hd-pro-r3-semantic-claim-ir-v1.schema.json`);
const r2=read('content/customer-experience-rebuild/hd-pro-r2/hd-w10-production-cutover-v1.json');
const md=fs.readFileSync(`${ROOT}/semantics/HD-PRO-R3-W6-profile-professional-meaning-corpus.md`,'utf8');

const PROFILES=['1/3','1/4','2/4','2/5','3/5','3/6','4/6','4/1','5/1','5/2','6/2','6/3'];
const REQUIRED=['lineAContribution','lineBContribution','profileTension','publicRole','privateOperatingMode','learningPattern','relationshipExpectation','misrecognitionRisk'];
const sourceByProfile=new Map(units.sourceUnits.filter(x=>x.category==='PROFILE').map(x=>[x.canonicalKey,x]));
const candidateByProfile=new Map(candidates.claims.filter(x=>x.subjectRefs?.[0]?.startsWith('PROFILE.')).map(x=>[x.subjectRefs[0].slice(8),x]));
const validClaimTypes=new Set(schema.properties.claimType.enum);

assert.equal(corpus.schemaVersion,'PHI-OS-HD-PRO-R3-W6-PROFILE-PROFESSIONAL-MEANING-CORPUS-v1.0.0');
assert.equal(corpus.baselineCommit,'d86589d0be33ace066b29f300959cfdc27ced6e6');
assert.equal(corpus.status,'PROFILE_PROFESSIONAL_SEMANTICS_ADMITTED_R3_SHADOW');
assert.equal(corpus.authority.r2State,'CUSTOMER_PUBLISHED');
assert.equal(corpus.authority.r3State,'SHADOW_CANDIDATE');
assert.equal(corpus.authority.phiosHumanDesignBirthCalculationAuthority,false);
assert.equal(corpus.authority.externalConfirmedChartRequired,true);
assert.equal(corpus.ownershipBoundary.profileMeaningIsSimpleLineConcatenation,false);
assert.equal(corpus.ownershipBoundary.lineAtomicMeaningMayRenderAsProfileReading,false);
assert.equal(corpus.ownershipBoundary.profileMayReplaceAuthority,false);
assert.equal(corpus.ownershipBoundary.genericFillerAllowed,false);
assert(corpus.ownershipBoundary.profileOwns.includes('profile_pair_composition'));
assert(corpus.ownershipBoundary.authorityOwns.includes('decision_timing'));

assert.equal(resolution.status,'PROFILE_12_OF_12_DIRECT_USER_SOURCE_RESOLVED_FOR_SEMANTIC_ADMISSION_R3_SHADOW');
assert.equal(resolution.coverage.canonicalProfiles,12);
assert.equal(resolution.coverage.directUserSourceProfiles,12);
assert.equal(resolution.coverage.resolvedForSemanticAdmission,12);
assert.equal(resolution.coverage.unresolved,0);
assert.equal(resolution.linePositionPolicy.lineParagraphConcatenationEqualsProfileMeaning,false);
assert.equal(resolution.linePositionPolicy.profilePairRequiresDedicatedCompositionOwner,true);
assert.deepEqual([...resolution.lifeStageResolution.sourceExplicitProfiles].sort(),['3/6','6/2','6/3'].sort());
assert.deepEqual(resolution.lifeStageResolution.line6ProfileWithoutExplicitMilestoneSource,['4/6']);
assert.equal(resolution.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(resolution.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(resolution.publication.r2HumanReviewInherited,false);

assert.equal(corpus.semanticAdmission.canonicalProfileCount,12);
assert.equal(corpus.semanticAdmission.sourceAdmittedProfileUnits,12);
assert.equal(corpus.semanticAdmission.semanticAdmittedProfileUnits,12);
assert.equal(corpus.semanticAdmission.semanticLayerClaims,96);
assert.equal(corpus.semanticAdmission.compositionSupportedProfileUnits,0);
assert.equal(corpus.semanticAdmission.machineVerifiedProfileUnits,0);
assert.equal(corpus.semanticAdmission.humanAcceptedProfileUnits,0);
assert.equal(corpus.semanticAdmission.customerPublishableR3ProfileUnits,0);
assert.deepEqual([...corpus.meaningUnits.map(x=>x.canonicalProfile)].sort(),[...PROFILES].sort());
assert.equal(new Set(corpus.meaningUnits.map(x=>x.meaningUnitId)).size,12);
assert.equal(new Set(corpus.semanticClaims.map(x=>x.claimId)).size,96);

const banned=[/最速配/g,/理想伴侣/g,/固定命运/g,/注定/g,/保证.{0,8}(成功|幸福|长久)/g,/百分百的安全感/g,/灵魂伴侣/g,/destined/gi,/most compatible/gi,/perfect match/gi,/guaranteed relationship/gi,/fixed destiny/gi,/soulmate/gi];
for(const m of corpus.meaningUnits){
  const source=sourceByProfile.get(m.canonicalProfile);
  const candidate=candidateByProfile.get(m.canonicalProfile);
  assert(source,`${m.canonicalProfile} source missing`);
  assert(candidate,`${m.canonicalProfile} W3 candidate missing`);
  assert.equal(source.sourceAdmissionStatus,'SOURCE_ADMITTED');
  assert.equal(m.sourceTrace.primarySourceUnitId,source.sourceUnitId);
  assert.equal(m.sourceTrace.sourceTextSha256,source.sourceTextSha256);
  assert.equal(m.candidateClaimId,candidate.claimId);
  assert.equal(m.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(m.compositionSupported,false);
  assert.equal(m.machineVerified,false);
  assert.equal(m.humanAccepted,false);
  assert.equal(m.customerPublishableR3,false);
  assert.equal(m.profileStructure.profileIsPairLevelOwner,true);
  assert.equal(m.profileStructure.lineParagraphConcatenationEqualsProfileMeaning,false);
  assert.equal(m.profileStructure.firstLine,Number(m.canonicalProfile.split('/')[0]));
  assert.equal(m.profileStructure.secondLine,Number(m.canonicalProfile.split('/')[1]));
  for(const layer of REQUIRED){
    assert(m.requiredLayers[layer],`${m.canonicalProfile} missing ${layer}`);
    assert(m.requiredLayers[layer].zhHans.length>=45,`${m.canonicalProfile} ${layer} zh too shallow`);
    assert(m.requiredLayers[layer].en.length>=80,`${m.canonicalProfile} ${layer} en too shallow`);
    assert.equal(source.sourceText.zhHans.includes(m.requiredLayers[layer].zhHans),false,`${m.canonicalProfile} ${layer} copied source verbatim`);
  }
  assert.equal(m.realityCheckQuestions.length,3,`${m.canonicalProfile} must have exactly 3 focused reality questions`);
  assert(m.realityDomains.length>=4,`${m.canonicalProfile} reality domains too sparse`);
  assert(m.legacySourceMaterialExcludedFromW6.length>=8,`${m.canonicalProfile} boundary exclusions missing`);
  const customerText=[...Object.values(m.requiredLayers).flatMap(x=>[x.zhHans,x.en]),...m.realityCheckQuestions.flatMap(x=>[x.zhHans,x.en]),m.customerBoundary.zhHans,m.customerBoundary.en,m.lifeStageContext?.customerMeaning?.zhHans||'',m.lifeStageContext?.customerMeaning?.en||''].join('\n');
  assert.equal(/\bW6\b|\bW12\b|SHADOW_CANDIDATE|SEMANTIC_ADMITTED|R3 human review/i.test(customerText),false,`${m.canonicalProfile} leaks internal engineering language`);
  for(const re of banned){ re.lastIndex=0; assert.equal(re.test(customerText),false,`${m.canonicalProfile} contains banned deterministic/compatibility phrase ${re}`); }
  if(['3/6','6/2','6/3'].includes(m.canonicalProfile)){
    assert.equal(m.lifeStageContext.sourceStatus,'SOURCE_EXPLICIT_BOUNDARY_REWRITE_REQUIRED');
    assert.equal(m.lifeStageContext.fixedAgePredictionAllowed,false);
    assert(m.lifeStageContext.customerMeaning.zhHans.includes('十八岁') || m.lifeStageContext.customerMeaning.zhHans.includes('三十岁'));
  }else if(m.canonicalProfile==='4/6'){
    assert.equal(m.lifeStageContext.sourceStatus,'SOURCE_NOT_EXPLICIT_FOR_MILESTONE_CLAIM');
    assert.equal(m.lifeStageContext.customerMeaning,null);
  }else{
    assert.equal(m.lifeStageContext.sourceStatus,'NOT_APPLICABLE');
    assert.equal(m.lifeStageContext.customerMeaning,null);
  }
}

for(const c of corpus.semanticClaims){
  assert.equal(c.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert(validClaimTypes.has(c.claimType),`${c.claimId} invalid claim type`);
  assert(c.subjectRefs[0].startsWith('PROFILE.'));
  assert.equal(c.semanticOwnerId,'human_design.profile');
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

const p41=corpus.meaningUnits.find(x=>x.canonicalProfile==='4/1');
const p51=corpus.meaningUnits.find(x=>x.canonicalProfile==='5/1');
const p24=corpus.meaningUnits.find(x=>x.canonicalProfile==='2/4');
const p36=corpus.meaningUnits.find(x=>x.canonicalProfile==='3/6');
assert.match(p41.requiredLayers.lineBContribution.zhHans,/宿命化语言/);
assert.match(p41.requiredLayers.lineBContribution.zhHans,/不采用字面宿命/);
assert.match(p51.requiredLayers.profileTension.zhHans,/期待答案/);
assert.match(p51.requiredLayers.lineBContribution.zhHans,/研究|准备|基础/);
assert.match(p24.requiredLayers.profileTension.zhHans,/一个人|独处/);
assert.match(p24.requiredLayers.profileTension.zhHans,/有人来找我|关系/);
assert.match(p36.requiredLayers.profileTension.zhHans,/参与与观察|参与.*观察/);

assert.equal(admission.status,'PROFILE_12_OF_12_SEMANTIC_ADMITTED_COMPOSITION_PENDING');
assert.equal(admission.coverage.canonicalProfiles,12);
assert.equal(admission.coverage.userAuthoredSourceProfiles,12);
assert.equal(admission.coverage.semanticAdmitted,12);
assert.equal(admission.coverage.semanticCoveragePct,100);
assert.equal(admission.coverage.semanticLayerClaims,96);
assert.equal(admission.coverage.compositionSupported,0);
assert.equal(admission.coverage.humanAccepted,0);
assert.equal(admission.coverage.r3CustomerPublishable,0);
assert.equal(admission.boundaryResolution.dedicatedProfilePairOwners,12);
assert.equal(admission.boundaryResolution.simpleLineConcatenationUsed,false);
assert.equal(admission.boundaryResolution.compatibilityRankingsRemoved,true);
assert.equal(admission.boundaryResolution.literalFixedFateRemoved,true);
assert.equal(admission.boundaryResolution.lifeStageClaimsFailClosedToSourceExplicitOnly,true);
assert.equal(admission.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(admission.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(admission.publication.r2HumanReviewInherited,false);

const byCategory=Object.fromEntries(status.categories.map(x=>[x.category,x]));
assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v3.0.0');
assert.equal(status.baselineCommit,'d86589d0be33ace066b29f300959cfdc27ced6e6');
assert.equal(status.updatedByWork,'HD-PRO-R3-W6');
assert.equal(status.r2State,'CUSTOMER_PUBLISHED');
assert.equal(status.r3State,'SHADOW_CANDIDATE');
assert.equal(status.historicalStatusRewritten,false);
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v2.json`);
assert.equal(historicalStatus.updatedByWork,'HD-PRO-R3-W5');
assert.equal(historicalStatus.categories.find(x=>x.category==='PROFILE').semanticAdmitted,0);
assert.equal(byCategory.TYPE.semanticAdmitted,5);
assert.equal(byCategory.AUTHORITY.semanticAdmitted,8);
assert.equal(byCategory.PROFILE.expected,12);
assert.equal(byCategory.PROFILE.sourceAdmitted,12);
assert.equal(byCategory.PROFILE.semanticAdmitted,12);
assert.equal(byCategory.PROFILE.semanticLayerClaims,96);
assert.equal(byCategory.PROFILE.compositionSupported,0);
for(const k of ['CENTER','CHANNEL','GATE','DEFINITION','VARIABLE_PHS']) assert.equal(byCategory[k].semanticAdmitted,0,`${k} was admitted early by W6`);
assert.equal(status.aggregate.typeSemanticCoveragePct,100);
assert.equal(status.aggregate.authoritySemanticCoveragePct,100);
assert.equal(status.aggregate.profileSemanticCoveragePct,100);
assert.equal(status.aggregate.compositionSupportedCoveragePct,0);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W7 Center Professional Meaning Corpus');

assert.equal(r2.cutover.customerInterpretiveReading,'CUSTOMER_PUBLISHED');
assert.equal(r2.cutover.realityComposition,'CUSTOMER_PUBLISHED');
for(const token of ['12/12 Profile pair-level semantic owners','does **not** construct a Profile by concatenating two line paragraphs','R2 remains `CUSTOMER_PUBLISHED`','R3 remains `SHADOW_CANDIDATE`','3/6','6/2','6/3','4/6']) assert(md.includes(token),`W6 note missing ${token}`);

console.log('✓ HD-PRO-R3-W6 Profile Professional Meaning Corpus passed.');
console.log('  12/12 Profile pair-level owners are SEMANTIC_ADMITTED with 96 bounded professional claims; simple line concatenation, compatibility scoring, literal fate, composition, R3 human acceptance and customer publication remain gated.');
