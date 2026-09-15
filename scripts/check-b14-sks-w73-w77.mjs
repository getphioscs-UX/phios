import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {artifacts,specifications,packet,html} from './build-b14-sks-w73-w77.mjs';
import {validateAcceptanceDraft} from './lib/book1-customer-acceptance.mjs';
import {structuredDiscoveryRows} from '../assets/js/knowledge/structured-discovery.js';
import {renderStructuredAnswer} from '../assets/customer-ui/js/surfaces/structured-answer.js';
const read=p=>JSON.parse(fs.readFileSync(p));
for(const [path,text] of Object.entries(artifacts()))assert.equal(fs.readFileSync(path,'utf8'),text,`STALE_ACCEPTANCE:${path}`);
for(const spec of specifications){const p=packet(spec);new vm.Script(html(spec,p).match(/<script>([\s\S]*)<\/script>/)[1]);
 const draft={sourceDigest:p.sourceDigest,reader:'Synthetic fixture',firstTimeReader:true,locale:'en',testUrl:'https://example.test/',elapsedSeconds:600,results:p.tasks.map(t=>({id:t.id,status:'PASS',observation:'Fixture only'}))};
 assert.equal(validateAcceptanceDraft(p,draft).eligibleForAcceptanceReview,true);
 for(const mutate of [d=>d.results[0].status='FAIL',d=>d.results[0].status='NOT_RUN',d=>d.results[0].observation='',d=>d.sourceDigest='stale']){const d=structuredClone(draft);mutate(d);assert.equal(validateAcceptanceDraft(p,d).eligibleForAcceptanceReview,false);}
 assert.equal(validateAcceptanceDraft(p,draft).humanAcceptanceApplied,false);
}
const registry=read('content/knowledge/structured/structured-knowledge-registry-v1.json'),index=read('content/knowledge/structured/structured-knowledge-search-index-v1.json'),books=read('content/registry/successors/seven-volume-v1/books.json');
for(const locale of ['en','zh-Hans']){
 const rows=structuredDiscoveryRows(registry,index,books,locale);assert.equal(rows.filter(r=>r.type==='STRUCTURED_OBJECT').length,71);assert.equal(rows.filter(r=>r.type==='ATLAS').length,1);
 for(const row of rows){const url=new URL(row.href,'https://example.test');assert.ok(fs.existsSync('.'+url.pathname+'index.html'));if(row.ask){const q=new URL(row.ask,'https://example.test').searchParams;assert.equal(q.get('readingPath'),row.href);assert.ok(q.get('contextRef').startsWith('CONCEPT:sk-'));}assert.equal(row.definition,undefined);}
 for(const [route,label] of [['formation','Explore Mechanism'],['runtime','Explore Pattern'],['continuity','Explore Recovery'],['expansion','Explore Scale Transition']]){const href=`/books/reality-${route}/?topic=test#explorer`;const rendered=renderStructuredAnswer({exploreInBook:href},locale);assert.ok(rendered.includes(href));if(locale==='en')assert.ok(rendered.includes(label));}
}
assert.ok(!renderStructuredAnswer({exploreInBook:'javascript:alert(1)'}).includes('<a '));
console.log('✓ W73–W77: reproducible reader drafts, failed/missing/stale review guards, 71 bilingual discovery links, atlas route and four Ask actions passed. Human acceptance remains deferred.');
