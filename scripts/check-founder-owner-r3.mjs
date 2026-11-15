import {assertFounderR3StrictTransition} from './lib/founder-owner-r3-strict-r4.mjs';
assertFounderR3StrictTransition();
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createHash} from 'node:crypto';
const page=fs.readFileSync('about/founder/index.html','utf8'),{document}=parseHTML(page);
const source=JSON.parse(fs.readFileSync('content/web/founder-owner-r3.json','utf8'));
const record=JSON.parse(fs.readFileSync('content/web/index-surfaces/founder-owner-r3.json','utf8'));
assert.equal(record.version,'FOUNDER-OWNER-R3');assert.equal(record.credentialsInvented,false);assert.equal(record.commercialAuthorityChanged,false);
assert.equal(createHash('sha256').update(page).digest('hex'),record.pageSha256);
assert.equal(document.body.dataset.founderPublication,'R3');assert.equal(document.querySelectorAll('main h1').length,1);assert.equal(document.querySelectorAll('.founder-r3-section').length,7);
const nodes=[...document.querySelectorAll('[data-founder-copy]')];
function pair(value){assert(nodes.some(n=>n.getAttribute('data-cx-en')===value[0]&&n.getAttribute('data-cx-zh')===value[1]),'Missing approved bilingual pair: '+value[0]);}
for(const key of ['eyebrow','title','role'])pair(source[key]);for(const p of source.intro)pair(p);
for(const section of source.sections){assert(document.getElementById(section.id));pair(section.title);if(section.lead)pair(section.lead);for(const p of [...section.paragraphs||[],...section.quote||[]])pair(p);for(const p of section.principles||[]){pair(p[0]);pair(p[1]);}if(section.closing)pair(section.closing);for(const [href,en,zh]of section.links||[])assert(nodes.some(n=>n.tagName==='A'&&n.getAttribute('href')===href&&n.dataset.cxEn===en&&n.dataset.cxZh===zh));}
for(const a of document.querySelectorAll('main a[href^="/"]')){const p=a.getAttribute('href').split(/[?#]/)[0].slice(1);assert(fs.existsSync(p)||fs.existsSync(p+'index.html'),p);}
const person=JSON.parse(document.querySelector('[data-pis-founder-schema]').textContent);assert.equal(person.name,'Teresa Lee');assert.equal(person.jobTitle,'Founder and Principal Architect');assert(!/award|licensed|certified|PhD|therapist/i.test(document.querySelector('main').textContent));
assert.equal(document.querySelectorAll('.founder-r3-portrait img').length,1);assert.equal(document.querySelector('.founder-r3-portrait img').getAttribute('loading'),'eager');assert(!document.querySelector('main details'));assert(!/accepted Founder|已接受的 Founder/.test(page));
console.log('PASS Founder R3: exact user-supplied Chinese narrative, complete English pairs, seven visible sections, real destinations, original portrait and identity, no invented credentials.');
