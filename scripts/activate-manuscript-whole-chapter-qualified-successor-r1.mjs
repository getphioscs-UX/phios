import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash}from'node:crypto';
const dir='tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/',read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const q=read(dir+'CHAPTER-QUALIFICATION.json');assert.equal(q.qualified,3);
const registry=read('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v9-candidate.json');
const predecessor=read('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v7.json');
// Current III's six-scope migration regression is not yet closed. Preserve its
// actual production record, and VII's existing production boundary, exactly.
for(const code of ['BOOK-3','BOOK-7'])registry.records[registry.records.findIndex(r=>r.bookCode===code)]=predecessor.records.find(r=>r.bookCode===code);
registry.schemaVersion='PHI-OS-MANUSCRIPT-KNOWLEDGE-SOURCE-REGISTRY-v9';
registry.productionActivated=true;
registry.activationScope={wholeChapterCandidates:['B1V3-P1-S006','B5-S002'],excludedPendingCurrentMigration:['CM-B3V1-P8-S001'],predecessorPreservedBooks:['BOOK-3','BOOK-7'],qualificationEvidence:dir+'CHAPTER-QUALIFICATION.json',qualificationSha256:sha(fs.readFileSync(dir+'CHAPTER-QUALIFICATION.json')),ownerAuthorization:'Continuous deployment authorization for validated Chinese scopes; no expansion to whole books or protected text.'};
fs.writeFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v9.json',JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({sourceQualified:3,compiledAdmissionCandidates:2,thirdCurrentCutover:'BLOCKED_BY_SIX_SCOPE_REGRESSION',seventhProductionBoundary:'PREDECESSOR_PRESERVED',providerCalls:0}));
