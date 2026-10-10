import fs from 'node:fs';import assert from 'node:assert/strict';import en from '../assets/js/locales/en.js';import zh from '../assets/js/locales/zh-Hans.js';
const html=fs.readFileSync('about/founder/index.html','utf8'),base='content/production-closure/live-customer-commercial-convergence';
assert.equal((html.match(/<h1\b/g)||[]).length,1);
for(let i=1;i<=9;i++)assert.equal((html.match(new RegExp('data-founder-r1="S0'+i+'"','g'))||[]).length,1);
const accepted=JSON.parse(fs.readFileSync(base+'/founder-publication-r1/OWNER-PUBLICATION-COPY.json'));
for(const [locale,dictionary] of [['en',en],['zh-Hans',zh]])assert.deepEqual(dictionary.hpc2Destinations.founder.publication,accepted[locale],'PUBLICATION_COPY_NOT_BOUND_TO_EXISTING_LOCALE_OWNER');
for(const match of html.matchAll(/data-i18n="([^"]+)"/g))for(const dictionary of [en,zh])assert.equal(typeof match[1].split('.').reduce((v,k)=>v?.[k],dictionary),'string',match[1]);
assert.ok(!/V8-FOUNDER|PIS-R1 EDITORIAL|RECOVERY-FOUNDER-V8-RESTORATION|NATURE-EXPERIENCE-SCOPE|COM-SUBSCRIPTION|price_|\bRM\d|14 layers|five-volume|three-volume/i.test(html));
assert.ok(!/PhD|therapist|psychologist|licensed|certified|award/i.test(html));
assert.ok(!html.includes('data-pis-copy'),'DUPLICATE_PUBLIC_COPY_OWNER');
const registry=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json'));
for(const a of JSON.parse(fs.readFileSync(base+'/founder-publication-r1/ASSET-BINDINGS.json'))){assert.ok(registry.entries.some(x=>x.assetId===a.assetId&&x.objectKey===a.objectKey&&x.publicUrl===a.publicUrl));assert.ok(html.includes('data-founder-asset-id="'+a.assetId+'"'));}
assert.ok(html.includes('NAVIGATION-FORMATION-1B'));assert.ok(html.includes('CUSTOMER-ENTRY-PATHS'));
for(const m of html.matchAll(/href="(\/[^"?#]*)/g)){const p=m[1].slice(1);assert.ok(fs.existsSync(p)||fs.existsSync(p+'index.html'),m[1]);}
const schemas=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));assert.equal(schemas.filter(s=>s['@type']==='Person').length,1);
console.log('PASS Founder R1: nine sections; exact approved bilingual copy in existing locale owner; canonical assets/links; one Person/H1; legacy duplication removed. Portrait/source and browser acceptance are separate gates.');
