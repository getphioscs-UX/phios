import assert from 'node:assert/strict';
import fs from 'node:fs';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const corpus=read(`${ROOT}/semantics/HD-PRO-R3-W4-type-professional-meaning-corpus-v1.json`);
const admission=read(`${ROOT}/semantics/HD-PRO-R3-W4-type-semantic-admission-v1.json`);
const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v1.json`);
const units=read(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const candidates=read(`${ROOT}/claims/hd-pro-r3-semantic-claim-candidates-v1.json`);
const schema=read(`${ROOT}/claims/hd-pro-r3-semantic-claim-ir-v1.schema.json`);
const r2=read('content/customer-experience-rebuild/hd-pro-r2/hd-w10-production-cutover-v1.json');
const md=fs.readFileSync(`${ROOT}/semantics/HD-PRO-R3-W4-type-professional-meaning-corpus.md`,'utf8');

const TYPES=['GENERATOR','MANIFESTING_GENERATOR','MANIFESTOR','PROJECTOR','REFLECTOR'];
const REQUIRED=['structuralIdentity','engagementPattern','decisionBoundary','typicalFriction','relationshipEnvironmentExpression'];
const typeUnits=new Map(units.sourceUnits.filter(x=>x.category==='TYPE').map(x=>[x.canonicalKey,x]));
const candidateBySubject=new Map(candidates.claims.filter(x=>x.subjectRefs?.[0]?.startsWith('TYPE.')).map(x=>[x.subjectRefs[0],x]));

assert.equal(corpus.schemaVersion,'PHI-OS-HD-PRO-R3-W4-TYPE-PROFESSIONAL-MEANING-CORPUS-v1.0.0');
assert.equal(corpus.baselineCommit,'90ddc484ffb603a1f3a10e50dc638a0526eac717');
assert.equal(corpus.status,'TYPE_PROFESSIONAL_SEMANTICS_ADMITTED_R3_SHADOW');
assert.equal(corpus.authority.r2State,'CUSTOMER_PUBLISHED');
assert.equal(corpus.authority.r3State,'SHADOW_CANDIDATE');
assert.equal(corpus.authority.phiosHumanDesignBirthCalculationAuthority,false);
assert.equal(corpus.authority.externalConfirmedChartRequired,true);
assert.equal(corpus.ownershipBoundary.atomicTypeMeaningIsCustomerReading,false);
assert.equal(corpus.ownershipBoundary.typeAuthorityOwnershipSeparated,true);
assert.equal(corpus.ownershipBoundary.strategyIsInteractionOrientationNotDecisionAuthority,true);
assert.equal(corpus.ownershipBoundary.genericFillerAllowed,false);
assert(corpus.ownershipBoundary.authorityOwns.includes('final_decision_reference'));
assert(corpus.ownershipBoundary.authorityOwns.includes('decision_timing'));

assert.equal(corpus.semanticAdmission.canonicalTypeCount,5);
assert.equal(corpus.semanticAdmission.sourceAdmittedTypeUnits,5);
assert.equal(corpus.semanticAdmission.semanticAdmittedTypeUnits,5);
assert.equal(corpus.semanticAdmission.semanticLayerClaims,25);
assert.equal(corpus.semanticAdmission.compositionSupportedTypeUnits,0);
assert.equal(corpus.semanticAdmission.humanAcceptedTypeUnits,0);
assert.equal(corpus.semanticAdmission.customerPublishableR3TypeUnits,0);
assert.deepEqual([...corpus.meaningUnits.map(x=>x.canonicalType)].sort(),TYPES);
assert.equal(new Set(corpus.meaningUnits.map(x=>x.meaningUnitId)).size,5);
assert.equal(new Set(corpus.semanticClaims.map(x=>x.claimId)).size,25);

const banned=[/一定会/g,/注定/g,/保证/g,/灵魂伴侣/g,/最适合的伴侣/g,/治愈/g,/治疗/g,/疾病/g,/will definitely/gi,/guaranteed/gi,/destined/gi,/soulmate/gi];
for(const m of corpus.meaningUnits){
  const u=typeUnits.get(m.canonicalType);
  assert(u,`${m.canonicalType} lacks W2A TYPE source unit`);
  assert.equal(u.sourceAdmissionStatus,'SOURCE_ADMITTED');
  assert.equal(m.sourceRefs[0],u.sourceUnitId);
  assert.equal(m.sourceTrace.sourceTextSha256,u.sourceTextSha256);
  assert.equal(m.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(m.compositionSupported,false);
  assert.equal(m.machineVerified,false);
  assert.equal(m.humanAccepted,false);
  assert.equal(m.customerPublishableR3,false);
  assert.equal(m.candidateClaimId,candidateBySubject.get(`TYPE.${m.canonicalType}`)?.claimId);
  for(const layer of REQUIRED){
    assert(m.requiredLayers[layer],`${m.canonicalType} missing ${layer}`);
    assert(m.requiredLayers[layer].zhHans.length>=45,`${m.canonicalType} ${layer} zh too shallow`);
    assert(m.requiredLayers[layer].en.length>=80,`${m.canonicalType} ${layer} en too shallow`);
  }
  assert(m.realityCheckQuestions.length>=3,`${m.canonicalType} needs >=3 reality questions`);
  assert(m.realityDomains.length>=3,`${m.canonicalType} reality domains too sparse`);
  assert(m.legacySourceMaterialExcludedFromW4.length>=5,`${m.canonicalType} legacy boundary exclusions missing`);
  const customerText=[...Object.values(m.requiredLayers).flatMap(x=>[x.zhHans,x.en]),...m.realityCheckQuestions.flatMap(x=>[x.zhHans,x.en]),m.customerBoundary.zhHans,m.customerBoundary.en].join('\n');
  for(const re of banned){ re.lastIndex=0; assert.equal(re.test(customerText),false,`${m.canonicalType} contains banned deterministic/sensitive phrase ${re}`); }
  const sourceText=u.sourceText.zhHans;
  for(const layer of REQUIRED){
    const zh=m.requiredLayers[layer].zhHans;
    assert.equal(sourceText.includes(zh),false,`${m.canonicalType} ${layer} copied legacy source paragraph verbatim`);
  }
  assert.match(m.requiredLayers.decisionBoundary.zhHans,/权威|Authority/i,`${m.canonicalType} decision boundary must hand off to Authority`);
}

const validClaimTypes=new Set(schema.properties.claimType.enum);
for(const c of corpus.semanticClaims){
  assert.equal(c.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert(validClaimTypes.has(c.claimType),`${c.claimId} invalid claim type`);
  assert(c.subjectRefs[0].startsWith('TYPE.'));
  assert.equal(c.semanticOwnerId,'human_design.type');
  assert.equal(c.admissionStatus,'SOURCE_ADMITTED');
  assert.equal(c.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert(c.customerMeaning?.zhHans && c.customerMeaning?.en,`${c.claimId} missing bilingual semantic meaning`);
  assert(c.customerBoundary?.zhHans && c.customerBoundary?.en,`${c.claimId} missing boundary`);
  assert.equal(c.compositionRuleId,null);
  assert.equal(c.compositionSupported,false);
  assert.equal(c.machineVerified,false);
  assert.equal(c.humanAccepted,false);
  assert.equal(c.customerPublishable,false);
}

assert.equal(admission.status,'TYPE_5_OF_5_SEMANTIC_ADMITTED_COMPOSITION_PENDING');
assert.equal(admission.coverage.canonicalTypes,5);
assert.equal(admission.coverage.sourceAdmitted,5);
assert.equal(admission.coverage.semanticAdmitted,5);
assert.equal(admission.coverage.semanticCoveragePct,100);
assert.equal(admission.coverage.compositionSupported,0);
assert.equal(admission.coverage.r3CustomerPublishable,0);
assert.equal(admission.boundaryResolution.rewriteCompletedForAtomicTypeMeaning,5);
assert.equal(admission.boundaryResolution.sourceTextCopiedAsCustomerProse,false);
assert.equal(admission.boundaryResolution.typeAuthorityOwnershipSeparated,true);
assert.equal(admission.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(admission.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(admission.publication.r3TypeCorpusMayRenderDirectlyToCustomer,false);
assert.equal(admission.publication.r2HumanReviewInherited,false);

const byCategory=Object.fromEntries(status.categories.map(x=>[x.category,x]));
assert.equal(status.updatedByWork,'HD-PRO-R3-W4');
assert.equal(status.r2State,'CUSTOMER_PUBLISHED');
assert.equal(status.r3State,'SHADOW_CANDIDATE');
assert.equal(byCategory.TYPE.expected,5);
assert.equal(byCategory.TYPE.semanticAdmitted,5);
assert.equal(byCategory.TYPE.compositionSupported,0);
assert.equal(byCategory.TYPE.customerPublishableR3,0);
for(const k of ['AUTHORITY','PROFILE','CENTER','CHANNEL','GATE','DEFINITION','VARIABLE_PHS']) assert.equal(byCategory[k].semanticAdmitted,0,`${k} was admitted early by W4`);
assert.equal(status.aggregate.typeSemanticCoveragePct,100);
assert.equal(status.aggregate.compositionSupportedCoveragePct,0);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W5 Authority Professional Meaning Corpus');

assert.equal(r2.cutover.customerInterpretiveReading,'CUSTOMER_PUBLISHED');
assert.equal(r2.cutover.realityComposition,'CUSTOMER_PUBLISHED');
for(const token of ['Type = engagement / initiation-response mechanics','Authority = final decision reference and timing','SHADOW_CANDIDATE','CUSTOMER_PUBLISHED']) assert(md.includes(token),`W4 note missing ${token}`);

console.log('✓ HD-PRO-R3-W4 Type Professional Meaning Corpus passed.');
console.log('  5/5 Types are SOURCE_ADMITTED → SEMANTIC_ADMITTED with six professional layers each; composition, R3 human acceptance and customer publication remain blocked.');
