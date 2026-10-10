import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const d=await read('content/knowledge/authoring/extensions/legacy-supporting-source/review-resolution/decisions/legacy-human-review-wave-a-decisions-v1.json');
const r=await read('content/knowledge/authoring/extensions/legacy-supporting-source/review-resolution/resolved/legacy-human-review-wave-a-resolution-v1.json');
const a=await read('content/knowledge/authoring/extensions/legacy-supporting-source/acceptance/kau-e1r-wave-a-human-review-resolution-acceptance-v1.json');
const q=await read('content/knowledge/authoring/extensions/legacy-supporting-source/review/legacy-unified-language-human-review-queue-v1.json');
assert.equal(d.decisionCount,21);
assert.equal(r.decisionCount,21);
assert.equal(a.checks.decisionCount,21);
assert.equal(a.checks.acceptedRelationshipCount,17);
assert.equal(a.checks.deferredCount,4);
assert.equal(a.checks.canonicalNodeRegistryMutated,false);
assert.equal(a.checks.meaningAuthorityMutated,false);
assert.equal(a.checks.productionReadinessPromoted,false);
const codes=new Set(q.entries.map(x=>x.reviewCode));
for(const x of d.decisions){ assert.ok(codes.has(x.reviewCode)); assert.equal(x.reviewedBy,'TL'); assert.ok(x.reviewedAt); assert.ok(x.humanReason); if(x.humanDecision==='DEFER') assert.equal(x.acceptedCanonicalNodeReferences.length,0); }
console.log('✓ KAU-E1R Wave A: 21 explicit TL decisions recorded; 17 supporting relationships accepted, 4 deferred; no Canonical/Meaning/KPP mutation.');
