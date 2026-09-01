import fs from 'node:fs';import assert from 'node:assert/strict';
const c=JSON.parse(fs.readFileSync('content/personal-reading/governed/contracts/personal-reading-section-evidence-contract-v2.json','utf8'));const s=JSON.parse(fs.readFileSync('content/personal-reading/governed/schemas/personal-reading-section-evidence-v2.schema.json','utf8'));
assert.equal(c.schemaVersion,'PHI-OS-PERSONAL-READING-SECTION-EVIDENCE-CONTRACT-v2.0.0');assert.equal(c.rules.governedFactualConclusionRequiresWhyThisAppears,true);
for(const field of ['singleMethodReadingRefs','crossMethodClaimRefs','profileSignalRefs','selfAssessmentRefs','reasoningTaskRefs','currentRealityRefs','realityComparisonRefs','whyThisAppears','supportRefs','tensionRefs','openRefs','boundaryRefs','technicalRefs'])assert(c.requiredFields.includes(field),field);
assert.equal(s.properties.status.enum.includes('ELIGIBLE'),true);assert.equal(s.properties.whyThisAppears.type,'array');
console.log('✓ W48 section evidence contract passed: Profile/Assessment, Cross, Current Reality and whyThisAppears lineage are explicit.');
