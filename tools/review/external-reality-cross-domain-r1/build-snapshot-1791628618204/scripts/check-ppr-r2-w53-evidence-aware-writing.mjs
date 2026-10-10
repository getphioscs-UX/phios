import fs from 'node:fs';import assert from 'node:assert/strict';import {verifyEvidenceAwareClaim} from '../functions/personal-reading/personal-reading-evidence-verifier-v2.js';
const rules=JSON.parse(fs.readFileSync('content/personal-reading/governed/registries/personal-reading-evidence-writing-rules-v2.json','utf8'));assert.equal(rules.schemaVersion,'PHI-OS-PERSONAL-READING-EVIDENCE-WRITING-RULES-v2.0.0');
const ok=[
 {claimClass:'METHOD_ONLY_FACTUAL',methodRefs:['AST:1']},
 {claimClass:'CROSS_METHOD_FACTUAL',methodRefs:['AST:1','BZR:1'],crossRuleRefs:['CROSS:R1']},
 {claimClass:'REALITY_FACTUAL',currentRealityRefs:['CR:1']},
 {claimClass:'CROSS_PLUS_REALITY_FACTUAL',crossClaimRefs:['X:1'],currentRealityRefs:['CR:1']},
 {claimClass:'PROFILE_SELF_REPORT',profileSignalRefs:['P:1'],sourceClasses:['CUSTOMER_SELF_REPORT'],objectivePersonalityFact:false},
 {claimClass:'REASONING_TASK',reasoningTaskRefs:['R:1'],iqClaim:false,percentileClaim:false},
 {claimClass:'MIXED_SOURCE_FACTUAL',crossSourceRuleRefs:['XS:1'],sourceClasses:['CUSTOMER_SELF_REPORT','SYMBOLIC_INTERPRETATION'],truthConversion:false,scientificValidationTransfer:false}
];for(const x of ok)assert.equal(verifyEvidenceAwareClaim(x).passed,true,x.claimClass);
assert.equal(verifyEvidenceAwareClaim({claimClass:'CROSS_METHOD_FACTUAL',methodRefs:['AST:1'],crossRuleRefs:['R']}).passed,false);assert.equal(verifyEvidenceAwareClaim({claimClass:'PROFILE_SELF_REPORT',profileSignalRefs:['P'],sourceClasses:['CUSTOMER_SELF_REPORT'],objectivePersonalityFact:true}).passed,false);assert.equal(verifyEvidenceAwareClaim({claimClass:'REASONING_TASK',reasoningTaskRefs:['R'],iqClaim:true}).passed,false);assert.equal(verifyEvidenceAwareClaim({claimClass:'REASONING_TASK',reasoningTaskRefs:['R'],percentileClaim:true}).passed,false);assert.equal(verifyEvidenceAwareClaim({claimClass:'MIXED_SOURCE_FACTUAL',crossSourceRuleRefs:['XS'],sourceClasses:['CUSTOMER_SELF_REPORT','SYMBOLIC_INTERPRETATION'],scientificValidationTransfer:true}).passed,false);console.log('✓ W53 evidence-aware factual verification passed across method, cross, Reality, Profile, reasoning and mixed-source classes.');
