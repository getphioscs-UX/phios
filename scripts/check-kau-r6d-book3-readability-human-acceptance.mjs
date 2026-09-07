import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const decisions=read('content/knowledge/manuscripts/review/kau-r6d-book3-readability-decisions-v1.json');
const acceptance=read('content/knowledge/manuscripts/review/kau-r6d-book3-readability-human-acceptance-v1.json');
const inventory=read('content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json');
const completed=read('content/knowledge/manuscripts/completed/book-3-completed-manuscript-v1.json');
const materialization=read('content/knowledge/manuscripts/materialization/book-3-materialization-v1.json');
assert.equal(decisions.schemaVersion,'PHI-OS-KAU-R6D-BOOK3-READABILITY-DECISIONS-v1.0.0');assert.equal(decisions.stage,'KAU-R6D');assert.equal(decisions.sourceSha256,completed.sourceBinary.sha256);assert.equal(decisions.corpusSha256,materialization.extraction.corpusSha256);assert.equal(decisions.recordCount,106);assert.equal(decisions.records.length,106);
const invMap=new Map(inventory.sections.map(s=>[s.sectionCode,s]));const allowed=new Set(['APPROVE_TEXT','APPROVE_WITH_FIGURE_EXCLUSION']);let sections=0;for(const d of decisions.records){const s=invMap.get(d.sectionCode);assert.ok(s,`unknown decision section ${d.sectionCode}`);assert.equal(d.sourceDigest,s.textSha256,`source digest drift ${d.sectionCode}`);assert.deepEqual([d.pageRange.start,d.pageRange.end],[s.startPage,s.endPage]);assert.ok(allowed.has(d.decision),`non-accepted readability decision ${d.sectionCode}: ${d.decision}`);assert.equal(d.reviewedText,null,`reviewedText mutation requires a separate corrected-text successor: ${d.sectionCode}`);if(d.segmentType==='SECTION')sections++;}
assert.equal(sections,103);assert.equal(acceptance.status,'HUMAN_READABILITY_ACCEPTED');assert.equal(acceptance.recordCount,106);assert.equal(acceptance.sectionSegments,103);assert.equal(acceptance.allRecordsHumanAccepted,true);assert.equal(acceptance.textCorrectionsApplied,0);assert.equal(acceptance.authorityBoundary.readabilityApprovalIsArticleEditorialApproval,false);assert.equal(acceptance.authorityBoundary.canonicalNodeMutationPerformed,false);assert.equal(acceptance.authorityBoundary.publicationAuthorityCreated,false);
console.log('✓ KAU-R6D human readability acceptance passed: 106/106 decisions accepted, including 103/103 manuscript sections.');
console.log('✓ No corrected manuscript text, canonical-node authority or publication authority was created by readability approval.');
