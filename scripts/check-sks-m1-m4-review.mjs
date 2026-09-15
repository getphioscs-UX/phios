import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build,page,output} from './build-sks-m1-m4-review.mjs';
import {sources,read,digest,normalize} from './lib/sks-review-sources.mjs';
import {validateDraft} from './lib/sks-review-draft.mjs';
const p=build();assert.deepEqual(read(output+'m1-m4-review-packet-v1.json'),p);const html=fs.readFileSync(output+'M1-M4-UNIFIED-REVIEW.html','utf8');assert.equal(html,page(p));new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]);
assert.equal(new Set(p.decisions.map(d=>d.id)).size,p.decisions.length);assert.equal(p.coverage.mappedObjects,71);assert.equal(p.coverage.meaningCandidates,40);assert.equal(p.coverage.scopeItems,120);assert.equal(p.coverage.book4Definitions,20);assert.equal(p.coverage.duplicatePairs,5);
for(const b of p.mapping)for(const o of b.objects)for(const s of o.sections)assert.ok(s.candidatePages,'OBJECT_SOURCE_UNLOCATED:'+o.objectId);
const bs=sources();let quotes=0;
function verify(e){const b=bs.find(b=>b.file===e.sourcePath);assert.ok(b);assert.equal(e.sourcePdfSha256,b.pdf.sourcePdfSha256);assert.equal(b.text.slice(...e.normalizedOffsets),e.quote);assert.equal(digest(e.quote),e.quoteSha256);const row=b.rows.find(r=>r.sectionCode===e.sectionCode);assert.ok(e.normalizedOffsets[0]>=row.candidateSpan[0]&&e.normalizedOffsets[1]<=row.candidateSpan[1]);quotes++;}
for(const f of p.fieldCandidates){assert.equal(f.canonicalAuthority,false);assert.equal(f.reviewState,'PENDING_M8');for(const e of f.definition?.evidence||[])verify(e);for(const field of f.properties){for(const e of field.evidence)verify(e);if(field.proposedValue===null)assert.ok(field.reason);}}
for(const item of p.missing){assert.equal(item.definition,null);assert.equal(item.admission,'WITHHELD_GENERIC_OBJECT_NOT_ESTABLISHED');item.evidence.forEach(verify);}
for(const m of p.meaning){assert.equal(m.reviewState,'PENDING_M8');assert.equal(m.canonicalAuthority,false);for(const c of m.claims)for(const e of c.evidence){const data=read(e.sourcePath),section=(data.records||data.sections).find(s=>s.sectionCode===e.sectionCode);assert.equal(digest(section.text),e.rawTextSha256);assert.ok(normalize(section.text).includes(e.quote));}for(const s of m.scope){assert.ok(s.candidate&&s.source&&s.supportState);const data=read(s.source.path),section=(data.records||data.sections).find(x=>x.sectionCode===s.source.sectionCode);for(const e of s.context)assert.ok(normalize(section.text).includes(e.quote));}}
for(const m of p.meaning){assert.equal(m.finalClaimMap.map(c=>c.claim).join(''),m.finalCandidate.replace(/[；。]/gu,''));for(const c of m.finalClaimMap){assert.ok(c.context.length);const data=read(c.source.path),section=(data.records||data.sections).find(s=>s.sectionCode===c.source.sectionCode);for(const e of c.context)assert.ok(normalize(section.text).includes(e.quote));}}
const draft={sourceDigest:p.sourceDigest,reviewer:'TEST FIXTURE',humanAcceptanceApplied:false,decisions:p.decisions.map(d=>({id:d.id,decision:'NOT_REVIEWED',note:''}))};assert.equal(validateDraft(p,draft).validDraft,true);
for(const mutate of [d=>d.sourceDigest='stale',d=>d.reviewer='',d=>d.decisions.pop(),d=>d.decisions[0].id='unknown',d=>d.decisions[0].decision='YES',d=>d.humanAcceptanceApplied=true,d=>d.decisions[0].decision='REQUEST_CHANGE']){const d=structuredClone(draft);mutate(d);assert.equal(validateDraft(p,d).validDraft,false);}
const allApproved=structuredClone(draft);allApproved.decisions.forEach(d=>d.decision='APPROVE_PROPOSAL');assert.equal(validateDraft(p,allApproved).productionActivationAllowed,false);
assert.equal(p.decisions.filter(d=>d.id.startsWith('M4-DEDUP')).every(d=>d.details.mergeAllowed===false),true);
console.log(`✓ M1–M4: 71 object mappings, 40 meanings / 84 claims / 120 limits, 20 Book IV definitions, ${quotes} exact desktop evidence excerpts, 5 separate-node decisions and 8 draft guards. No human approval or production writeback.`);
