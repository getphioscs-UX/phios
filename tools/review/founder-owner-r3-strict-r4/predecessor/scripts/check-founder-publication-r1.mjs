import crypto from 'node:crypto';import {parseHTML} from 'linkedom';import {founderR2Successor} from './lib/founder-human-presence-successor-r2.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import en from '../assets/js/locales/en.js';import zh from '../assets/js/locales/zh-Hans.js';
const html=fs.readFileSync('about/founder/index.html','utf8'),base='content/production-closure/live-customer-commercial-convergence';
assert.equal((html.match(/<h1\b/g)||[]).length,1);
for(let i=1;i<=9;i++)assert.equal((html.match(new RegExp('data-founder-r1="S0'+i+'"','g'))||[]).length,1);
const accepted=JSON.parse(fs.readFileSync(base+'/founder-publication-r1/OWNER-PUBLICATION-COPY.json'));
const copySuccessor=JSON.parse(fs.readFileSync('content/web/index-surfaces/founder-publication-zh-copy-successor-r10.json'));
assert.equal(copySuccessor.status,'ENGINEERING_RECONCILIATION');assert.equal(copySuccessor.locale,'zh-Hans');assert.equal(copySuccessor.predecessor.path,base+'/founder-publication-r1/OWNER-PUBLICATION-COPY.json');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(copySuccessor.predecessor.path)).digest('hex'),copySuccessor.predecessor.sha256);
for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(copySuccessor[key],false);
assert.deepEqual(copySuccessor.changes.map(c=>c.path),[['S06','body','15'],['S06','body','20']]);
for(const change of copySuccessor.changes){const owner=change.path.slice(0,-1).reduce((v,k)=>v[k],accepted['zh-Hans']),key=change.path.at(-1);assert.equal(owner[key],change.previous);owner[key]=change.current;}
for(const [locale,dictionary] of [['en',en],['zh-Hans',zh]])assert.deepEqual(dictionary.hpc2Destinations.founder.publication,accepted[locale],'PUBLICATION_COPY_NOT_BOUND_TO_EXISTING_LOCALE_OWNER');
for(const match of html.matchAll(/data-i18n="([^"]+)"/g))for(const dictionary of [en,zh])assert.equal(typeof match[1].split('.').reduce((v,k)=>v?.[k],dictionary),'string',match[1]);
assert.ok(!/V8-FOUNDER|PIS-R1 EDITORIAL|RECOVERY-FOUNDER-V8-RESTORATION|NATURE-EXPERIENCE-SCOPE|COM-SUBSCRIPTION|price_|\bRM\d|14 layers|five-volume|three-volume/i.test(html));
assert.ok(!/PhD|therapist|psychologist|licensed|certified|award/i.test(html));
const founderSuccessor=founderR2Successor();assert.ok(founderSuccessor,'Current Founder composition must have exact successor evidence');
const document=parseHTML(html).document;
for(const element of document.querySelectorAll('[data-pis-copy]'))assert.ok(!element.closest('[data-founder-r1]'),'DUPLICATE_PUBLIC_COPY_OWNER');
const registry=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json'));
for(const a of JSON.parse(fs.readFileSync(base+'/founder-publication-r1/ASSET-BINDINGS.json'))){assert.ok(registry.entries.some(x=>x.assetId===a.assetId&&x.objectKey===a.objectKey&&x.publicUrl===a.publicUrl));if(a.assetId==='PLAN-HOME-07'&&!html.includes('data-founder-asset-id="'+a.assetId+'"')){assert.ok(fs.readFileSync(founderSuccessor.sourceBefore,'utf8').includes('data-founder-asset-id="'+a.assetId+'"'),'Historical Founder illustration evidence missing');}else assert.ok(html.includes('data-founder-asset-id="'+a.assetId+'"'));}
assert.ok(html.includes('NAVIGATION-FORMATION-1B'));assert.ok(html.includes('CUSTOMER-ENTRY-PATHS'));
for(const m of html.matchAll(/href="(\/[^"?#]*)/g)){const p=m[1].slice(1);assert.ok(fs.existsSync(p)||fs.existsSync(p+'index.html'),m[1]);}
const schemas=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));assert.equal(schemas.filter(s=>s['@type']==='Person').length,1);
console.log('PASS Founder R1: nine sections; exact approved bilingual copy in existing locale owner; canonical assets/links; one Person/H1; legacy duplication removed. Portrait/source and browser acceptance are separate gates.');
