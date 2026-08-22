import assert from 'node:assert/strict'; import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'); const json=p=>JSON.parse(read(p));
const s=json('content/web-production/successors/brand-research-commerce-legal-batch4-presentation-successor-v1.json');
assert.equal(s.status,'CURRENT_PRESENTATION_SUCCESSOR'); assert.equal(s.pocA11ToA14Included,false);
for(const p of s.surfaces){assert.ok(fs.existsSync(p),`missing:${p}`);}
const additive=s.surfaces.filter(p=>!['about/founder/index.html','about/why-phios/index.html','about/reality-navigation/index.html','research/human-reading-systems/index.html','research/why-reality-navigation/index.html'].includes(p));
for(const p of additive){const t=read(p); assert.match(t,/brand-research-commerce-legal\.css/); assert.match(t,/brand-research-commerce-legal\.js/);}
for(const p of ['about/founder/index.html','about/why-phios/index.html','about/reality-navigation/index.html','research/human-reading-systems/index.html','research/why-reality-navigation/index.html']) assert.match(read(p),/hpc2-destination-pages\.css/);
assert.match(read('about.html'),/V8-ECO-001/);
const vr=json('content/web-production/registries/client-visual-asset-registry-v1.7.json');
const ills=vr.assets.filter(a=>String(a.sequence||'').startsWith('ILL-')); assert.equal(ills.length,10); for(const a of ills) assert.equal(a.r2?.remoteVerified,true,`${a.sequence}:remoteVerified`);
for(const flag of Object.values(s.authorityBoundaries)) assert.equal(flag,false);
console.log('✓ Brand / Research / Commerce / Legal Batch 4 presentation successor passed.');
console.log('  V8 About/Research content remains present; ILL-001–ILL-010 are recorded remoteVerified=true; POC-A11–A14 are intentionally out of scope.');
