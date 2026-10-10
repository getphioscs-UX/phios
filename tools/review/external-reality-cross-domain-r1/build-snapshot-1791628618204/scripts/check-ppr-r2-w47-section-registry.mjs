import fs from 'node:fs';import assert from 'node:assert/strict';
const r=JSON.parse(fs.readFileSync('content/personal-reading/governed/registries/personal-reading-section-registry-v2.json','utf8'));
assert.equal(r.schemaVersion,'PHI-OS-PERSONAL-READING-SECTION-REGISTRY-v2.0.0');
assert.equal(r.rules.hardSectionCountRequired,false);assert.equal(r.rules.fillerAllowed,false);assert.equal(r.rules.profileRequiresPrfW12ProductionAdmission,true);assert.equal(r.rules.humanDesignMethodPerspectiveAllowed,true);
assert.deepEqual(r.sectionStates,['ELIGIBLE','NOT_ESTABLISHED','SUPPRESSED']);
const groupIds=new Set(r.groups.map(x=>x.groupId));for(const id of ['A','B','B2','C','D','E','F'])assert(groupIds.has(id));
const ids=r.sections.map(x=>x.sectionId);assert.equal(new Set(ids).size,ids.length);for(const id of ['ECR_PERSPECTIVE','AST_PERSPECTIVE','BZR_PERSPECTIVE','ZWR_PERSPECTIVE','HD_PERSPECTIVE','NUM_PERSPECTIVE','PROFILE_OVERVIEW','SELF_ASSESSMENT','REASONING_TASKS','CROSS_SOURCE_ALIGNMENT','SOURCE_TENSIONS','CURRENT_STATE','SOURCES_AND_DETAILS'])assert(ids.includes(id));
assert(r.sections.every(x=>x.fillerAllowed===false));
console.log(`✓ W47 section registry v2 passed: ${r.sections.length} candidate sections across ${r.groups.length} governed groups; no filler and no hard section count.`);
