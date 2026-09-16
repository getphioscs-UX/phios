import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {parseHTML} from 'linkedom';
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=read('docs/public-index-successor/pis-r1-w0-baseline-audit-v1.json');
assert.equal(baseline.baselineCommit,'8772ca0821b7d5c2b84db47f17fee1ffde4039b3');
assert.equal(baseline.sourceZip.sha256,null);
assert.equal(sha(baseline.plan.path),baseline.plan.sha256);
for(const authority of baseline.routeAuthorities)assert.equal(sha(authority.path),authority.sha256,'PIS must not silently change route authority');
const census=read('docs/public-index-successor/pis-r1-w1-surface-census-v1.json');
assert.equal(new Set(census.surfaces.map(x=>x.path)).size,census.surfaces.length);
assert.ok(census.surfaces.some(x=>x.path==='index.html'));
assert.ok(census.surfaces.some(x=>x.path==='thesis.html'));
const language=read('content/web/public-language/public-language-canon-v1.json');
assert.equal(language.changesUnderlyingIdentifiers,false);
assert.ok(language.terms.every(t=>t.internalTerm&&t.publicEnglish&&t.publicZhHans));
const allocation=read('content/web/index-surfaces/public-index-visual-allocation-v1.json');
const pointer=read(allocation.authorityPointer);
const authority=read(pointer.currentRegistryPath.replace(/^\//,''));
assert.equal(allocation.createsVisualAuthority,false);
assert.deepEqual(allocation.assets.map(a=>a.assetCode).sort(),authority.assets.map(a=>a.assetCode).sort());
assert.ok(allocation.assets.filter(a=>a.consumerState==='HISTORICAL_SEMANTIC_STALE').every(a=>a.sevenVolumeCompatibility==='HISTORICAL_ONLY'));
const copy=read('content/web/index-surfaces/pis-r1-discovery-copy-v1.json');
assert.equal(Object.keys(copy.pages).length,29);
for(const [file,sections] of Object.entries(copy.pages)){
 const source=fs.readFileSync(file,'utf8');
 const {document}=parseHTML(source);
 assert.equal(document.querySelectorAll('h1').length,1,`${file}: one h1`);
 assert.equal(document.querySelectorAll('.pis-editorial:not(.pis-visual-story)').length,sections.length);
 assert.ok(document.querySelector('script[src="/assets/customer-ui/js/public-index-copy.js"]'));
 for(const section of sections){
  assert.ok(section.body.en.length>120&&section.body.zh.length>40);
  assert.ok(!/\b(registry|resolver|cutover|successor|fixture|checker|canonical)\b/i.test(section.body.en));
  for(const link of section.links){
   assert.ok(link.en&&link.zh);
   assert.ok(link.href.startsWith('/')&&!link.href.startsWith('//'));
   const destination=link.href.split(/[?#]/)[0].slice(1);
   assert.ok(fs.existsSync(destination.endsWith('/')?destination+'index.html':destination),`${file}: missing destination ${link.href}`);
   assert.ok(!/checkout|payment|subscribe|buy/i.test(link.href),'No new purchase CTA in discovery additions');
  }
 }
 assert.ok([...document.querySelectorAll('[data-pis-copy]')].every(n=>n.getAttribute('data-cx-en')&&n.getAttribute('data-cx-zh')));
}
console.log(`PASS PIS foundation and expanded editorial additions: ${census.surfaces.length} inventoried files, ${allocation.assets.length} existing asset identities. Browser review, broader pages and production freeze are separate.`);
