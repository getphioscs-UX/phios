import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sources,digest} from './lib/sks-review-sources.mjs';
import {validateDraft} from './lib/sks-review-draft.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const p=read('functions/_source-material/m1-m4-review/m8-review-packet-v1.json');
assert.equal(p.decisions.length,132);assert.equal(p.humanAcceptanceComplete,false);assert.equal(p.automaticWriteback,false);
const original=read('functions/_source-material/m1-m4-review/m1-m4-review-packet-v1.json');
assert.deepEqual(p.decisions.slice(0,128),original.decisions);
const extra='functions/_source-material/m1-m4-review/ca-r1-additional-meaning-proposals-v1.json';
assert.equal(p.sourceDigest,digest(original.sourceDigest+fs.readFileSync(extra)));
const b=sources().find(b=>b.bookCode==='BOOK-3');let count=0;
for(const proposal of p.additionalProposals){assert.equal(proposal.humanReview,'NOT_REVIEWED');assert.equal(proposal.productionImport,false);assert.equal(proposal.englishSemanticParity,'DRAFT_PENDING_M8');
 for(const e of [proposal.source,...proposal.fields.flatMap(f=>f.evidence)]){assert.equal(e.sourcePdfSha256,b.pdf.sourcePdfSha256);assert.equal(b.text.slice(...e.normalizedOffsets),e.quote);assert.equal(digest(e.quote),e.quoteSha256);count++;}
}
const draft={sourceDigest:p.sourceDigest,reviewer:'TEST ONLY',humanAcceptanceApplied:false,decisions:p.decisions.map(d=>({id:d.id,decision:'NOT_REVIEWED',note:''}))};
assert.equal(validateDraft(p,draft).validDraft,true);assert.equal(validateDraft(p,{...draft,sourceDigest:original.sourceDigest}).validDraft,false);assert.equal(validateDraft(p,{...draft,humanAcceptanceApplied:true}).validDraft,false);
const registry=read('data/qa/customer-activation-r1/issue-registry-v1.json');assert.equal(registry.issues.length,14);assert.equal(registry.issues.filter(x=>x.priority==='P0').length,5);assert.ok(registry.issues.every(x=>x.status!=='CLOSED'));
assert.equal(read('docs/qa/customer-activation-r1/m8-review-requirements-v1.json').productionReadiness,false);
console.log(`✓ M8 132 decisions, ${count} additional exact source excerpts, stale-version/false-approval guards; no production issue falsely closed.`);
