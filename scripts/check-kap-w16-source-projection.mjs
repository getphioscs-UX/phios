import assert from 'node:assert/strict';
import {ROOT,BASELINE,readJson} from './lib/knowledge-answer-projection/kap-answer-v1.mjs';
import {projectKapSources} from '../functions/_lib/knowledge-answer-composition.js';
const c=readJson(`${ROOT}/contracts/kap-w16-answer-source-projection-contract-v1.json`); const bundle=readJson(`${ROOT}/fixtures/knowledge-grounding-bundle.valid.json`);
assert.equal(c.baselineCommit,BASELINE); assert.equal(c.rules.rawFullSourceExposed,false); assert.equal(c.rules.rawFullBookExposed,false);
const sources=projectKapSources(bundle,'STANDARD'); assert.ok(sources.length>0);
for(const s of sources){assert.equal(s.rawFullSourceExposed,false); assert.ok(c.allowedSourceTypes.includes(s.sourceType)); assert.ok(s.questionScopedExcerpt); assert.equal('rawBody' in s,false);}
assert.ok(sources.some(s=>s.sourceType==='PUBLISHED_CANONICAL_ARTICLE')); assert.ok(sources.some(s=>s.sourceType==='COMPLETED_MANUSCRIPT'));
console.log('✓ KAP-W16 Answer Source Projection passed.');
