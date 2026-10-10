import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {HD_R3_COMPOSITION_RULES,HD_R3_PRECEDENCE,composeHumanDesignR3} from '../functions/external-profile/human-design-r3-composition-runtime.js';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const registry=readJson(`${ROOT}/composition/HD-PRO-R3-W12-composition-rule-registry-v1.json`);
const fixture=readJson(`${ROOT}/composition/HD-PRO-R3-W12-composition-fixture-v1.json`);
const status=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v9.json`);
const historical=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v8.json`);

const required=[
'TYPE_X_AUTHORITY','TYPE_X_PROFILE','AUTHORITY_X_PROFILE','PROFILE_X_DEFINITION','AUTHORITY_X_CENTER',
'DEFINED_CENTER_X_CHANNEL','UNDEFINED_CENTER_X_HANGING_GATE','CHANNEL_X_GATE','PERSONALITY_GATE_X_DESIGN_GATE',
'DEFINITION_X_CHANNEL_NETWORK','VARIABLE_X_CORE_STRUCTURE'
];
assert.equal(registry.baselineCommit,'78ac0ae651133131d162e53c07cbccd793a55672');
assert.equal(registry.rules.length,11);
assert.deepEqual(registry.requiredFamilies,required);
assert.deepEqual(new Set(registry.rules.map(x=>x.family)),new Set(required));
assert.equal(registry.coverage.requiredRuleFamilies,11);
assert.equal(registry.coverage.registeredRuleFamilies,11);
assert.equal(registry.coverage.semanticExecutableRuleFamilies,10);
assert.equal(registry.coverage.structuralOnlyRuleFamilies,1);
assert.equal(registry.coverage.allValueCombinationCoverageMeasured,false);
assert.equal(registry.ownership.atomicMeaningIsComposition,false);
assert.equal(registry.ownership.compositionMustHaveRuleId,true);
assert.equal(registry.ownership.completeChannelPrimaryOverGate,true);
assert.equal(registry.ownership.authorityKeepsFinalDecision,true);
assert.equal(registry.ownership.advancedVariableMayOverrideCore,false);
assert.equal(registry.ownership.personalityDesignDistinctMeaningMayBeInvented,false);
assert.equal(HD_R3_COMPOSITION_RULES.length,11);
assert.deepEqual(new Set(HD_R3_COMPOSITION_RULES.map(x=>x.family)),new Set(required));
assert.equal(HD_R3_COMPOSITION_RULES.filter(x=>x.semanticExecutable).length,10);
const pdRule=HD_R3_COMPOSITION_RULES.find(x=>x.family==='PERSONALITY_GATE_X_DESIGN_GATE');
assert.equal(pdRule.semanticExecutable,false);
assert.equal(pdRule.structuralOnly,true);
assert.equal(pdRule.sourceStatus,'SOURCE_PENDING');
assert.equal(HD_R3_PRECEDENCE.ADVANCED_VARIABLE_MODIFIER,100);
assert(HD_R3_PRECEDENCE.CHART_LEVEL_COMPOSITION>HD_R3_PRECEDENCE.AUTHORITY_COMPOSITION);

const first=composeHumanDesignR3(fixture.facts);
const second=composeHumanDesignR3(JSON.parse(JSON.stringify(fixture.facts)));
assert.deepEqual(first,second,'composition output must be deterministic');
assert.equal(first.compositionDigest,second.compositionDigest);
assert(first.claims.length>=fixture.expected.semanticCompositionClaimsAtLeast);
assert.equal(first.boundaries.stringConcatenationAllowed,false);
assert.equal(first.boundaries.atomicMeaningEqualsComposition,false);
assert.equal(first.boundaries.authorityKeepsFinalDecision,true);
assert.equal(first.boundaries.advancedModifierMayOverrideCore,false);
assert.equal(first.boundaries.r3CustomerPublishable,false);

for(const c of first.claims){
  assert(c.compositionRuleId,'composition claim requires ruleId');
  assert(c.compositionClass,'composition class missing');
  assert(c.precedenceClass,'precedence class missing');
  assert(Number.isFinite(c.precedenceRank));
  assert(c.subjectRefs?.length>=2,'composition must bind two or more subjects');
  assert(c.sourceRefs?.length>=1,'composition must retain source evidence');
  assert.equal(c.machineVerified,false);
  assert.equal(c.humanAccepted,false);
  assert.equal(c.customerPublishable,false);
}
const ta=first.claims.find(x=>x.compositionClass==='TYPE_X_AUTHORITY');
assert(ta);
assert.match(ta.customerMeaning.zhHans,/回应不等于决定已经完成/);
assert.equal(ta.precedenceClass,'AUTHORITY_COMPOSITION');
assert.equal(ta.compositionSupported,true);
assert(ta.sourceRefs.includes('HD-UA-TYPE-GENERATOR'));
assert(ta.sourceRefs.includes('HD-UA-AUTHORITY-EMOTIONAL'));

const channelGate=first.claims.find(x=>x.compositionClass==='CHANNEL_X_GATE');
assert(channelGate);
assert.equal(channelGate.precedenceClass,'CHANNEL_COMPOSITION');
assert.match(channelGate.customerMeaning.en,/component Gates.*do not render as parallel primary meanings/i);
const definedChannel=first.claims.find(x=>x.compositionClass==='DEFINED_CENTER_X_CHANNEL');
assert(definedChannel);
assert.equal(definedChannel.precedenceClass,'CHANNEL_COMPOSITION');
assert.match(definedChannel.customerMeaning.en,/full Channel becomes the primary semantic owner/i);

const pd=first.claims.find(x=>x.compositionClass==='PERSONALITY_GATE_X_DESIGN_GATE');
assert(pd);
assert.equal(pd.admissionStatus,'SOURCE_PENDING');
assert.equal(pd.semanticAdmissionStatus,'SEMANTIC_REVIEW_PENDING');
assert.equal(pd.compositionSupported,false);
assert.equal(pd.structuralCompositionSupported,true);
assert.equal(pd.sourceGap,'W9_PERSONALITY_DESIGN_DISTINCT_GATE_SEMANTICS_SOURCE_PENDING');
assert.match(pd.customerMeaning.en,/does not provide distinct value-specific Personality-versus-Design meanings/i);

const variable=first.claims.filter(x=>x.compositionClass==='VARIABLE_X_CORE_STRUCTURE');
assert.equal(variable.length,2);
for(const c of variable){
  assert.equal(c.precedenceClass,'ADVANCED_VARIABLE_MODIFIER');
  assert.equal(c.precedenceRank,100);
  assert.match(c.customerMeaning.en,/cannot reverse a core finding or create a new decision rule/i);
  assert.equal(c.compositionSupported,true);
}
const network=first.claims.find(x=>x.compositionClass==='DEFINITION_X_CHANNEL_NETWORK');
assert(network);
assert.equal(network.precedenceClass,'CHART_LEVEL_COMPOSITION');
assert.equal(network.precedenceRank,800);
assert.match(network.customerMeaning.en,/without implying defect, dependency, or a need for another person to become complete/i);

assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v9.0.0');
assert.equal(status.updatedByWork,'HD-PRO-R3-W12');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v8.json`);
assert.equal(status.historicalStatusRewritten,false);
assert.equal(historical.updatedByWork,'HD-PRO-R3-W11');
assert.equal(status.aggregate.compositionEngineActive,true);
assert.equal(status.aggregate.compositionRuleFamiliesRegistered,11);
assert.equal(status.aggregate.compositionRuleFamiliesSemanticExecutable,10);
assert.equal(status.aggregate.compositionRuleFamiliesStructuralOnly,1);
assert.equal(status.aggregate.allValueCombinationCoverageMeasured,false);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W13 Semantic Precedence + Dedup Engine');

console.log('✓ HD-PRO-R3-W12 Composition Rule Engine passed.');
console.log(`  ${first.claims.length} deterministic fixture claims execute across 11 registered rule families (10 semantic + 1 structural-only); Generator × Emotional is composed rather than concatenated, Channel ownership is preserved, and Variable/PHS cannot override the core chart.`);
