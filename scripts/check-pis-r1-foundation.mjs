import {consolidationSuccessor,assertCurrentConsolidatedSurface} from './lib/page-consolidation-successor-r1.mjs';
import {pisCurrentSurfaceSuccessor,assertPisCurrentSurface} from './lib/pis-current-surface-successor.mjs';
import './check-founder-publication-r1.mjs';
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
for(const authority of baseline.routeAuthorities){
  if(authority.path==='_redirects'){
    const routeSuccessor=read('content/web/index-surfaces/pis-r1-current-route-successor-v2.json');
    assert.equal(routeSuccessor.status,'ENGINEERING_RECONCILIATION');assert.equal(routeSuccessor.path,authority.path);
    assert.equal(routeSuccessor.predecessor.path,'docs/public-index-successor/pis-r1-w0-baseline-audit-v1.json');assert.equal(sha(routeSuccessor.predecessor.path),routeSuccessor.predecessor.sha256);
    for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(routeSuccessor[key],false);
    assert.equal(routeSuccessor.previousSha256,authority.sha256);assert.equal(sha(routeSuccessor.previousPath),authority.sha256);
    assert.equal(sha(authority.path),routeSuccessor.sha256,'PIS current registered route digest drift');
    const parseRoutes=source=>new Map(source.split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#')).map(line=>{const [from,to,status]=line.split(/\s+/);return [from,{to,status}];}));
    const before=parseRoutes(fs.readFileSync(routeSuccessor.previousPath,'utf8')),current=parseRoutes(fs.readFileSync(authority.path,'utf8'));
    const delta=[...new Set([...before.keys(),...current.keys()])].filter(from=>JSON.stringify(before.get(from))!==JSON.stringify(current.get(from))).map(from=>({from,previous:before.get(from)||null,current:current.get(from)||null}));
    assert.deepEqual(delta,routeSuccessor.changes,'PIS redirect changes exceed registered migration');assert.equal(delta.length,23);
    for(const change of delta){assert.equal(change.current?.status,'308');const [destination,anchor]=change.current.to.split('#');assert.ok(destination.startsWith('/')&&!destination.startsWith('//'));
      const file=destination.endsWith('/')?destination.slice(1)+'index.html':destination.slice(1);assert.ok(fs.existsSync(file),'Redirect destination missing: '+destination);
      if(anchor)assert.ok(parseHTML(fs.readFileSync(file,'utf8')).document.getElementById(anchor),'Redirect fragment missing: '+change.current.to);
    }
    assert.ok(fs.existsSync('books/reality-reconfiguration/index.html'));
  }else assert.equal(sha(authority.path),authority.sha256,'PIS must not silently change route authority');
}
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
const successor=pisCurrentSurfaceSuccessor();
assert.equal(Object.keys(copy.pages).length,29);
for(const [file,sections] of Object.entries(copy.pages)){
 const source=fs.readFileSync(file,'utf8');
 const {document}=parseHTML(source);
 if(file==='explore/index.html'&&source.includes('/assets/js/explore-about-compat.js')){
  const {historicalPisBytes}=await import('./lib/page-consolidation-successor-r1.mjs');historicalPisBytes(file);
  assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'),'https://www.getphios.com/about/founder/');
  assert.equal(document.querySelector('a')?.getAttribute('href'),'/about/founder/');
  const destination=parseHTML(fs.readFileSync('about/founder/index.html','utf8')).document;
  for(const anchor of ['why','how','start','faq'])assert(destination.getElementById(anchor),'About destination anchor missing: '+anchor);
  continue;
 }
 if(document.querySelector('[data-consolidation-target]')){assert(assertCurrentConsolidatedSurface(document,file),'Unregistered redirect surface: '+file);continue;}
 assert.equal(document.querySelectorAll('h1').length,1,`${file}: one h1`);
 const current=successor.surfaces.find(s=>s.file===file);
 assertPisCurrentSurface(document,current);
 const consolidated=consolidationSuccessor()?.surfaces.some(item=>item.file===file);
 if(!consolidated)assert.equal(document.querySelectorAll('.pis-editorial:not(.pis-visual-story)').length,current?.editorialReplaced?0:sections.length+(current?.additionalEditorial.length||0),file+': editorial scope');
 if(!consolidated)assert.ok(document.querySelector(`script[src="${current?.copyRuntime||'/assets/customer-ui/js/public-index-copy.js'}"]`));
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
