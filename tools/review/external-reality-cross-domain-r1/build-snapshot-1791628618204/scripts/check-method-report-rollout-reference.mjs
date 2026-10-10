import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ref=read('content/reports/shared/report-production-reference.json');
const capability=read('content/reports/ziwei/capability-inventory.json');
const sources=read('content/reports/ziwei/semantic-source-inventory.json');
const gaps=read('content/reports/ziwei/report-gap-inventory.json');
const manifest=read('content/reports/shared/bazi-full-review-manifest.json');
const exists=p=>assert(fs.existsSync(p),`missing evidence: ${p}`);
for(const owner of ref.owners)exists(owner.path);
for(const c of capability.capabilities){
 assert(['VERIFIED','IMPLEMENTED_UNVERIFIED','PARTIAL','MISSING','NOT_SUPPORTED'].includes(c.status));
 c.owners.forEach(exists);exists(c.verification);
}
assert.equal(new Set(capability.capabilities.map(c=>c.capability)).size,15);
for(const s of sources.sources){assert(['calculation','semantic','editorial'].includes(s.layer));s.refs.forEach(exists);}
for(const g of gaps.components){assert(['KEEP','REUSE_PARTIAL','DEPRECATE'].includes(g.disposition));g.refs.forEach(exists);}
for(const section of gaps.proposedArchitecture.sections)for(const need of section.requires)assert(capability.capabilities.some(c=>c.capability===need&&c.status!=='MISSING'&&c.status!=='NOT_SUPPORTED'));
assert(['ACCEPTABLE','ACCEPT'].includes(ref.BAZI_CONTENT_STATE));
assert.equal(ref.humanDecision,'ACCEPT');
assert.equal(ref.BAZI_CONTENT_FROZEN,true);
assert.equal(ref.BAZI_REFERENCE_IMPLEMENTATION,true);
const accepted=read('docs/acceptance/bazi-paid-report/composition-r1/HUMAN-ACCEPTANCE.json');
assert.equal(accepted.decision,'ACCEPT');
for(const [p,h] of Object.entries(accepted.files))assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),h,'frozen reference changed');
assert.equal(manifest.productionAdmissionGranted,false);
assert.equal(manifest.humanDecision,null);
assert([null,'ACCEPT'].includes(gaps.proposedArchitecture.humanDecision));
const digest=createHash('sha256').update(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json')).digest('hex');
assert.deepEqual(manifest.artifacts.map(a=>a.locale),['zh-Hans','en']);
for(const artifact of manifest.artifacts){
 assert.equal(artifact.sourceDigest,digest,'stale review source');
 const {document}=parseHTML(fs.readFileSync(artifact.path,'utf8'));
 assert.equal(document.documentElement.lang,artifact.locale);
 const pages=[...document.querySelectorAll('main [data-page-number]')];
 assert.deepEqual(pages.map(p=>Number(p.dataset.pageNumber)),Array.from({length:artifact.totalPages},(_,i)=>i+1),'full customer page order');
 const sections=[...document.querySelectorAll('main [data-section]')];
 assert.deepEqual([...new Set(sections.map(p=>p.dataset.section))],artifact.sections);
 assert.equal(artifact.sections.length,10);
 assert.equal(document.querySelectorAll('[data-page-family="SECTION_OPENER_PAGE"]').length,10);
 assert(document.querySelector('main img'),'cover and opening images missing');
 assert(document.querySelector('main .pub-boundary'),'source/boundary material missing');
 assert(document.querySelector('script[type="module"]'),'shared asset settling / print fitting absent');
 assert.equal(artifact.subjectBindingVerified,false,'do not fabricate identity acceptance');
 for(const img of document.querySelectorAll('main img'))assert(img.getAttribute('src'));
 console.log(`PASS: ${artifact.locale} full customer sequence (${pages.length} pages, 10 sections).`);
}
console.log('PASS: MR-W0/W1/W2 inventories, evidence references and pending human gates. Visual/language/subject acceptance is not asserted.');
