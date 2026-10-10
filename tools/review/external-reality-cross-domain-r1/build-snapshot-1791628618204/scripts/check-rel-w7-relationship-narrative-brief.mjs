import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileRelationshipNarrativeBrief,RELATIONSHIP_NARRATIVE_BRIEF_SCHEMA} from '../functions/personal-reading/relationship/relationship-narrative-brief.js';
import {buildSpecificRelW7Case,buildSelfRelW7Case} from './rel-w7-relationship-narrative-fixtures.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const contract=read('content/personal-reading/relationship/narrative/contracts/relationship-narrative-brief-contract-v1.json');
const schema=read('content/personal-reading/relationship/narrative/schemas/relationship-narrative-brief-v1.schema.json');
const authority=read('content/personal-reading/relationship/narrative/successors/rel-w7-input-authority-snapshot-v1.json');
const acceptance=read('content/personal-reading/relationship/narrative/acceptance/rel-w7-machine-acceptance-v1.json');
const manifest=read('content/personal-reading/relationship/narrative/acceptance/rel-w7-work-manifest-v1.json');
function valid(out){
  assert.equal(out?.schemaVersion,'PHI-OS-RELATIONSHIP-NARRATIVE-BRIEF-v1.0.0');
  assert.match(out.briefId,/^REL-NBR-[A-F0-9]{24}$/);
  assert.match(out.sourceSemanticDigest,/^[a-f0-9]{64}$/);
  assert.match(out.briefSemanticDigest,/^[a-f0-9]{64}$/);
  assert.equal(out.briefType,'RELATIONSHIP');
  assert.equal(out.genericNarrativeBriefSchemaRef,'PHI-OS-NARRATIVE-BRIEF-v1.0.0');
  assert.ok(Array.isArray(out.factsAiMustNotAlter)&&out.factsAiMustNotAlter.length>=3);
  assert.ok(Array.isArray(out.sensitiveBoundaries)&&out.sensitiveBoundaries.length>=1);
  assert.equal(out.dynamicCuriosityQuestions.length,3);
  const allowed=new Set(Object.keys(schema.properties));
  for(const k of Object.keys(out))assert.ok(allowed.has(k),`schema property missing for ${k}`);
  for(const k of schema.required)assert.ok(Object.prototype.hasOwnProperty.call(out,k),`required field missing ${k}`);
}
async function mustReject(fn,code){let hit=false;try{await fn()}catch(e){hit=true;assert.equal(e.code,code,`expected ${code}, got ${e.code}`)}assert.equal(hit,true,`Expected rejection ${code}`)}
const clone=x=>JSON.parse(JSON.stringify(x));

assert.equal(contract.work,'REL-W7');
assert.equal(contract.outputSchema,RELATIONSHIP_NARRATIVE_BRIEF_SCHEMA);
assert.equal(contract.genericBriefAuthority.relationshipBriefExtendsGenericRules,true);
assert.equal(contract.genericBriefAuthority.secondWriterContractCreated,false);
assert.equal(authority.authorityState.w54n0,'MACHINE_VERIFIED');
assert.equal(authority.authorityState.relW6CrossEvidence,'MACHINE_VERIFIED');
assert.equal(manifest.next,'W54N1-W54N8 shared narrative infrastructure; REL-W8 follows after shared infrastructure is ready.');

// Representative specific-person brief.
const representativeInput=await buildSpecificRelW7Case(8,{methodCount:6,hasProfile:true,realityMode:'CONTRADICT',sensitive:true,customerContext:'Customer reports that Person B said they need more time before a shared decision. Keep this as customer-reported context, not objective access to B\'s private mind.'});
const representative=await compileRelationshipNarrativeBrief(representativeInput);valid(representative);
assert.equal(representative.briefType,'RELATIONSHIP');
assert.equal(representative.participantA.participantRef,'PERSON-A');
assert.equal(representative.participantB.participantRef,'PERSON-B');
assert.ok(representative.participantB.precisionBoundary.length>=1);
assert.equal(representative.dynamicCuriosityQuestions.length,3);
assert.ok(representative.relationshipOpeningSeed.length>20);
assert.ok(representative.factsAiMustNotAlter.some(x=>x.lockType==='HUMAN_ADMITTED_RELATIONSHIP_CLAIM'));
assert.ok(representative.sourceClassLocks.some(x=>x.sourceClass==='SYMBOLIC_INTERPRETATION'));
assert.ok(representative.profileSourceClassLocks.every(x=>x.mayBecomeOtherSourceClass===false));
assert.ok(representative.prohibitedClaimClasses.includes('COMPATIBILITY_PERCENTAGE'));
assert.ok(representative.prohibitedClaimClasses.includes('DESTINY_OR_SOULMATE_VERDICT'));
assert.ok(representative.partnerMindStateForbidden.includes('HIDDEN_FEELINGS'));
assert.equal(representative.customerContext.hiddenStateMayBecomeObjectivePartnerFact,false);
assert.equal(representative.governance.secondWriterContractCreated,false);
assert.equal(representative.governance.paidNarrativeGenerated,false);
assert.equal(representative.governance.currentRealityProvesMethod,false);
assert.equal(representative.governance.relW8RequiredForPaidRelationshipPublication,true);
const replay=await compileRelationshipNarrativeBrief(representativeInput);assert.equal(replay.briefSemanticDigest,representative.briefSemanticDigest);assert.equal(replay.sourceSemanticDigest,representative.sourceSemanticDigest);

// A-only self relationship pattern must stay A-only.
const selfInput=await buildSelfRelW7Case(1,{hasProfile:true,sensitive:false});
const selfBrief=await compileRelationshipNarrativeBrief(selfInput);valid(selfBrief);
assert.equal(selfBrief.relationshipIntent.mode,'SELF_RELATIONSHIP_PATTERN');
assert.equal(selfBrief.participantB,null);
assert.equal(selfBrief.partnerMindStateForbidden.length,0);
assert.ok(selfBrief.factsAiDoesNotKnow.includes('NO_PARTICIPANT_B_IN_SELF_RELATIONSHIP_PATTERN'));
assert.ok(selfBrief.phiOsLensTargets.includes('SELF_PATTERN_WITHOUT_INVENTED_PARTNER'));
assert.equal(selfBrief.dynamicCuriosityQuestions.length,3);

// Negative boundaries.
await mustReject(()=>compileRelationshipNarrativeBrief({...representativeInput,genericNarrativeBriefContract:null}),'REL_W7_GENERIC_NARRATIVE_BRIEF_CONTRACT_REQUIRED');
const missingB=clone(representativeInput);missingB.participantReadingSet.participants.B=null;await mustReject(()=>compileRelationshipNarrativeBrief(missingB),'REL_W7_PARTICIPANT_B_REQUIRED');
const pending=clone(representativeInput);pending.claimSnapshot.claimEntries[0].admissionState='PENDING';await mustReject(()=>compileRelationshipNarrativeBrief(pending),'REL_W7_RELATIONSHIP_CLAIM_NOT_HUMAN_ADMITTED');
const badCross=clone(representativeInput);badCross.crossMethodRelationshipIr.relationshipIntentId='OTHER-INTENT';await mustReject(()=>compileRelationshipNarrativeBrief(badCross),'REL_W7_REL_W6_CROSS_RELATIONSHIP_IR_REQUIRED');
const badProfile=clone(representativeInput);badProfile.profileSignals[0].participantRef='PERSON-C';await mustReject(()=>compileRelationshipNarrativeBrief(badProfile),'REL_W7_PROFILE_SIGNAL_PARTICIPANT_NOT_IN_RELATIONSHIP');
if(representativeInput.relationshipRealityComparisons.length){const badReality=clone(representativeInput);badReality.relationshipRealityComparisons[0].relationshipClaimId='UNKNOWN-CLAIM';await mustReject(()=>compileRelationshipNarrativeBrief(badReality),'REL_W7_REALITY_COMPARISON_CLAIM_NOT_ADMITTED');}
await mustReject(()=>compileRelationshipNarrativeBrief({...representativeInput,rawPlanets:[1]}),'REL_W7_RAW_OR_PROVIDER_INPUT_FORBIDDEN:$.rawPlanets');
await mustReject(()=>compileRelationshipNarrativeBrief({...representativeInput,compatibilityScore:0}),'REL_W7_PROHIBITED_FIELD:$.compatibilityScore');
await mustReject(()=>compileRelationshipNarrativeBrief({...representativeInput,styleIntent:{factualCertainty:'MAX'}}),'REL_W7_STYLE_INTENT_KEY_NOT_ALLOWED');
const selfWithB=clone(selfInput);selfWithB.participantReadingSet.participants.B=clone(representativeInput.participantReadingSet.participants.B);await mustReject(()=>compileRelationshipNarrativeBrief(selfWithB),'REL_W7_SELF_PATTERN_MUST_NOT_INVENT_PARTICIPANT_B');
const selfWithClaims=clone(selfInput);selfWithClaims.claimSnapshot=clone(representativeInput.claimSnapshot);await mustReject(()=>compileRelationshipNarrativeBrief(selfWithClaims),'REL_W7_SELF_PATTERN_CROSS_PERSON_CLAIMS_FORBIDDEN');

// 24-case machine campaign: 20 specific-person + 4 self-pattern.
const stats={passed:0,deterministic:0,specific:0,self:0,profilePresent:0,profileAbsent:0,sourceClasses:new Set(),methodCounts:new Set(),realityStates:{CURRENTLY_RESONANT:0,PARTIALLY_RESONANT:0,CURRENTLY_NOT_RESONANT:0,OPEN:0,NONE:0},astUnavailable:0,sensitive:0,nonConvergence:0,customerContext:0};
const realityModes=['SUPPORT','PARTIAL','CONTRADICT','OPEN','NONE'];
let profileCaseIndex=0;const profileClasses=['CUSTOMER_SELF_REPORT','EXTERNAL_PROFILE_RESULT','MEASURED_TASK_PERFORMANCE','STANDARDIZED_SELF_REPORT'];
for(let i=1;i<=20;i++){
  const hasProfile=i%2===0;const astUnavailable=i%4===0;const sensitive=i%5===0;const customerContext=i%3===0?`Explicit customer-reported relationship context for machine case ${i}.`:null;
  const profileSourceClass=hasProfile?profileClasses[(profileCaseIndex++)%profileClasses.length]:undefined;
  const input=await buildSpecificRelW7Case(i,{methodCount:2+((i-1)%5),hasProfile,profileSourceClass,astUnavailable,realityMode:realityModes[(i-1)%5],sensitive,customerContext});
  const out=await compileRelationshipNarrativeBrief(input);valid(out);const out2=await compileRelationshipNarrativeBrief(input);assert.equal(out.briefSemanticDigest,out2.briefSemanticDigest);assert.equal(out.sourceSemanticDigest,out2.sourceSemanticDigest);
  assert.equal(out.dynamicCuriosityQuestions.length,3);assert.equal(out.participantB!==null,true);assert.equal(out.governance.partnerHiddenStateInferred,false);assert.equal(out.governance.compatibilityScoreCreated,false);assert.equal(out.governance.soulmateOrDestinyVerdictCreated,false);assert.equal(out.governance.relationshipOutcomeGuaranteed,false);
  stats.passed++;stats.deterministic++;stats.specific++;hasProfile?stats.profilePresent++:stats.profileAbsent++;for(const x of input.profileSignals)stats.sourceClasses.add(x.sourceClass);stats.methodCounts.add(input.claimSnapshot.methods.length);if(astUnavailable)stats.astUnavailable++;if(sensitive)stats.sensitive++;if(customerContext)stats.customerContext++;if(out.nonConvergence.length)stats.nonConvergence++;
  const comps=input.relationshipRealityComparisons;if(!comps.length)stats.realityStates.NONE++;else for(const c of comps)stats.realityStates[c.responseState]++;
}
for(let i=1;i<=4;i++){
  const hasProfile=i%2===0;const input=await buildSelfRelW7Case(i,{hasProfile,sensitive:i===4});const out=await compileRelationshipNarrativeBrief(input);valid(out);const out2=await compileRelationshipNarrativeBrief(input);assert.equal(out.briefSemanticDigest,out2.briefSemanticDigest);assert.equal(out.participantB,null);stats.passed++;stats.deterministic++;stats.self++;hasProfile?stats.profilePresent++:stats.profileAbsent++;for(const x of input.profileSignals)stats.sourceClasses.add(x.sourceClass);stats.methodCounts.add(input.participantReadingSet.participants.A.methodReadings.length);if(i===4)stats.sensitive++;if(input.customerContext)stats.customerContext++;stats.realityStates.NONE++;
}
assert.equal(stats.passed,24);assert.equal(stats.deterministic,24);assert.equal(stats.specific,20);assert.equal(stats.self,4);assert.equal(stats.profilePresent,12);assert.equal(stats.profileAbsent,12);assert.ok(stats.methodCounts.has(2));assert.ok(stats.methodCounts.has(3));assert.ok(stats.methodCounts.has(4));assert.ok(stats.methodCounts.has(5));assert.ok(stats.methodCounts.has(6));assert.ok(stats.sourceClasses.has('CUSTOMER_SELF_REPORT'));assert.ok(stats.sourceClasses.has('EXTERNAL_PROFILE_RESULT'));assert.ok(stats.sourceClasses.has('MEASURED_TASK_PERFORMANCE'));assert.ok(stats.sourceClasses.has('STANDARDIZED_SELF_REPORT'));assert.ok(stats.realityStates.CURRENTLY_RESONANT>0);assert.ok(stats.realityStates.PARTIALLY_RESONANT>0);assert.ok(stats.realityStates.CURRENTLY_NOT_RESONANT>0);assert.ok(stats.realityStates.OPEN>0);assert.ok(stats.realityStates.NONE>0);assert.ok(stats.nonConvergence>0);assert.ok(stats.astUnavailable>0);assert.ok(stats.sensitive>0);
assert.equal(acceptance.campaign.requiredCases,24);assert.equal(acceptance.campaign.passedCases,stats.passed);assert.equal(acceptance.campaign.deterministicReplay,'PASS_24_OF_24');assert.equal(acceptance.campaign.specificPersonCases,20);assert.equal(acceptance.campaign.selfRelationshipPatternCases,4);assert.equal(acceptance.campaign.profilePresentCases,12);assert.equal(acceptance.campaign.profileAbsentCases,12);assert.equal(acceptance.verified.factsAiDoesNotKnowPreserved,true);assert.equal(acceptance.verified.partnerMindStateForbiddenExplicit,true);assert.equal(acceptance.boundaries.relationshipCustomerPublicationAllowed,false);
console.log('✓ REL-W7 Relationship Narrative Brief passed.');
console.log('  24/24 deterministic briefs passed: 20 specific-person + 4 self-relationship-pattern cases; methods 2–6; Profile source classes preserved; Reality support/partial/contradiction/open/no-comparison covered.');
console.log('  A/B remain distinct, Person B is never invented, non-convergence/counter-evidence/precision remain visible, and the brief extends W54N0 without creating a second Writer/provider authority.');
