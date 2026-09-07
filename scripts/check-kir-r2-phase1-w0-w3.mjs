import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const w0=read('content/knowledge/knowledge-intelligence-r2/evidence/kir-r2-w0-ask-failure-census-v1.json');
const w1=read('content/knowledge/knowledge-intelligence-r2/registries/kir-r2-book-i-iii-source-admission-v1.json');
const w2=read('content/knowledge/knowledge-intelligence-r2/evidence/kir-r2-w2-canonical-knowledge-coverage-audit-v1.json');
const w3=read('content/knowledge/knowledge-intelligence-r2/semantic-profiles/kir-r2-book-i-iii-semantic-retrieval-profiles-v1.json');
assert.equal(w0.status,'CENSUS_COMPLETE');
assert.deepEqual(w1.productionBooks,['BOOK-1','BOOK-2','BOOK-3']);
assert.equal(w1.records.length,3);
assert.ok(!w1.records.some(x=>['BOOK-4','BOOK-5'].includes(x.bookCode)));
assert.equal(w2.totals.canonicalNodes,350);
assert.equal(w3.profileCount,350);
assert.deepEqual(w3.bookCounts,{'BOOK-1':65,'BOOK-2':180,'BOOK-3':105});
const ids=new Set(); for(const p of w3.profiles){assert.ok(!ids.has(p.profileId));ids.add(p.profileId);assert.ok(p.nodeCode&&p.canonicalName?.['zh-Hans']);assert.ok(Array.isArray(p.naturalQuestions)&&p.naturalQuestions.length>=3);assert.ok(Array.isArray(p.aliases)&&p.aliases.length);assert.ok(Array.isArray(p.authorityRefs)&&p.authorityRefs.length>=2);assert.ok(['BOOK-1','BOOK-2','BOOK-3'].includes(p.bookCode));}
console.log('✓ KIR-R2 Phase 1 W0–W3 passed');
console.log('  Book I–III admitted for KIR retrieval authority; Book IV/V remain excluded.');
console.log('  Semantic Retrieval Profiles: 350/350 (65 + 180 + 105).');
