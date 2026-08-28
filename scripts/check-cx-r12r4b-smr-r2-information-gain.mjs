import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveSectionInformationGain} from '../functions/single-method-reading-r2/section-information-gain-resolver.js';
import {SMR_R2_SECTION_RULES} from '../functions/single-method-reading-r2/smr-r2-w6-w8-rules.js';

const contract=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr-r2/contracts/smr-r2-section-information-gain-contract-v1.json','utf8'));
const registry=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr-r2/registries/smr-r2-section-information-gain-registry-v1.json','utf8'));
assert.equal(contract.schemaVersion,'PHI-OS-SMR-R2-SECTION-INFORMATION-GAIN-CONTRACT-v1.0.0');
assert.deepEqual(contract.requiredInformationGainFields,SMR_R2_SECTION_RULES.bodyInformationFields);
assert.equal(contract.rules.allFiveInformationGainFieldsEmptyMeans,'SECTION_NOT_ELIGIBLE');
assert.equal(contract.rules.emptyValueSectionFillerAllowed,false);
assert.equal(contract.rules.timingRequiresExplicitTemporalClaim,true);
assert.equal(registry.boundary.technicalSectionsMayBypassBodyInformationGainGate,false);
assert.deepEqual(registry.sections.map(section=>section.sectionId),SMR_R2_SECTION_RULES.sections.map(section=>section.sectionId));

const claim=(id,{subject='SUN',type='CORE_PATTERN',priority='SECONDARY',domains=['IDENTITY_EXPRESSION'],conditions=[],counter=[]}={})=>({
  schemaVersion:'PHI-OS-CUSTOMER-READING-CLAIM-IR-v1.0.0',claimId:`SMR2-CLAIM-AST-${id}`,methodId:'AST',semanticDimension:`METHOD_NATIVE:AST:${subject}`,claimType:type,
  headline:`Accepted ${subject}`,structuralMeaning:`Accepted meaning ${id}`,findingRefs:[],interpretationUnitRefs:[`U-${id}`],evidenceRefs:[`P-${id}`,`M-${id}`],counterEvidenceRefs:counter,
  priorityClass:priority,priorityScore:priority==='PRIMARY'?100:priority==='SECONDARY'?70:50,priorityReasonRefs:[`R-${id}`],noveltyClass:'UNASSESSED',confidenceClass:'ADMITTED_AUTHORITY',conditions,boundaries:[],questionRelevance:{state:'RESOLVED_RELEVANT',intentId:'OPEN',score:0},sectionCandidates:[],customerDomains:domains,
  lineage:{productionAdmissionRef:'ADM',readingAuthorityRef:'READ',interpretationUnitRefs:[`U-${id}`],projectionRefs:[`P-${id}`],meaningRefs:[`M-${id}`],ruleRefs:[`RULE-${id}`],boundaryRefs:[],semanticDigest:'SEM'}
});
const claims=[
  claim('A',{subject:'SUN',type:'SUPPORT',priority:'PRIMARY',domains:['IDENTITY_EXPRESSION']}),
  claim('B',{subject:'MONTH',type:'SUPPORT',priority:'PRIMARY',domains:['WORK_RESOURCES']}),
  claim('C',{subject:'WEALTH',type:'CORE_PATTERN',domains:['WORK_RESOURCES']}),
  claim('D',{subject:'SPOUSE',type:'TENSION',domains:['RELATIONSHIP_EXCHANGE'],counter:['COUNTER-D']}),
  claim('E',{subject:'TRAVEL',type:'CONDITION',domains:['ENVIRONMENT_DIRECTION'],conditions:['QUESTION:Does this change across environments?']}),
  claim('F',{subject:'CYCLE',type:'TEMPORAL_ACTIVATION',domains:['ACTION_RHYTHM']}),
  claim('G',{subject:'MERCURY',type:'CORE_PATTERN',domains:['COMMUNICATION_EXCHANGE']})
];
const priorityResolution={schemaVersion:'PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0',methodId:'AST',readingAuthorityRef:'READ',semanticDigest:'SEM',priorityRuleVersion:'TEST',claims,firstScreenClaimRefs:[claims[0].claimId,claims[1].claimId],boundary:{}};
const themeCollection={schemaVersion:'PHI-OS-CUSTOMER-THEME-IR-COLLECTION-v1.0.0',methodId:'AST',themes:claims.map((item,index)=>({themeId:`T-${index}`,claimRefs:[item.claimId]}))};
const first=resolveSectionInformationGain({priorityResolution,themeCollection});
const second=resolveSectionInformationGain({priorityResolution,themeCollection});
assert.deepEqual(first,second);
assert.equal(first.boundary.deterministic,true);
assert.equal(first.boundary.emptyValueSections,0);
for(const section of first.sections){
  const gain=contract.requiredInformationGainFields.reduce((sum,key)=>sum+section[key].length,0);
  assert.equal(gain,section.informationGainCount);
  if(gain===0)assert.equal(section.eligibility,'SECTION_NOT_ELIGIBLE');
  if(section.eligibility==='SECTION_ELIGIBLE')assert.ok(gain>0);
}
const byId=id=>first.sections.find(section=>section.sectionId===id);
assert.equal(byId('OVERVIEW').eligibility,'SECTION_ELIGIBLE');
assert.equal(byId('CORE_THEMES').eligibility,'SECTION_ELIGIBLE');
assert.ok(byId('CORE_THEMES').newClaimRefs.includes(claims[6].claimId));
assert.equal(byId('SUPPORT_TENSION').eligibility,'SECTION_ELIGIBLE');
assert.equal(byId('REALITY_QUESTIONS').eligibility,'SECTION_ELIGIBLE');
assert.ok(byId('REALITY_QUESTIONS').newObservationRefs.includes('QUESTION:Does this change across environments?'));
assert.equal(byId('WORK').eligibility,'SECTION_NOT_ELIGIBLE');
assert.equal(byId('RESOURCES').eligibility,'SECTION_ELIGIBLE');
assert.ok(byId('RESOURCES').newClaimRefs.includes(claims[2].claimId));
assert.equal(byId('RELATIONSHIP').eligibility,'SECTION_ELIGIBLE');
assert.ok(byId('RELATIONSHIP').newClaimRefs.includes(claims[3].claimId));
assert.equal(byId('ENVIRONMENT').eligibility,'SECTION_ELIGIBLE');
assert.ok(byId('ENVIRONMENT').newClaimRefs.includes(claims[4].claimId));
assert.equal(byId('TIMING').eligibility,'SECTION_ELIGIBLE');
assert.ok(byId('TIMING').newClaimRefs.includes(claims[5].claimId));
for(const id of ['METHOD_DETAIL','SOURCE_LINEAGE','RULE_LINEAGE','CALCULATION_DETAIL']){
  assert.equal(byId(id).eligibility,'SECTION_NOT_ELIGIBLE');
  assert.equal(byId(id).defaultCollapsed,true);
  assert.equal(byId(id).technicalAppendixEligible,true);
  assert.equal(byId(id).informationGainCount,0);
}
const noTemporal={...priorityResolution,claims:claims.filter(item=>item.claimType!=='TEMPORAL_ACTIVATION'),firstScreenClaimRefs:[claims[0].claimId,claims[1].claimId]};
const noTemporalResult=resolveSectionInformationGain({priorityResolution:noTemporal,themeCollection:{...themeCollection,themes:themeCollection.themes.filter((_,index)=>index!==5)}});
assert.equal(noTemporalResult.sections.find(section=>section.sectionId==='TIMING').eligibility,'SECTION_NOT_ELIGIBLE');
const seen={newClaimRefs:new Set(),newRelationRefs:new Set(),newConditionRefs:new Set(),newCounterEvidenceRefs:new Set(),newObservationRefs:new Set()};
for(const section of first.sections.filter(section=>section.eligibility==='SECTION_ELIGIBLE'))for(const key of contract.requiredInformationGainFields)for(const ref of section[key]){assert.equal(seen[key].has(ref),false,`${key} reused as new information: ${ref}`);seen[key].add(ref)}
console.log('✓ CX-R12R4B SMR-R2 W6 information-gain eligibility passed: empty sections suppress, conditional/timing sections require new governed information, technical detail stays appendix-only.');
