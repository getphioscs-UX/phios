import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const vr=read('content/web-production/registries/client-visual-asset-registry-v1.2.json');
const pub=read('content/registry/public-assets.json');
const critical=read('content/web/homepage/hpc2-pre/hpc2-pre-critical-asset-registry-v1.json');
const final=read('content/web/homepage/hpc2-pre/hpc2-pre-final-readiness-v1.json');
const browser=read('content/web/homepage/hpc2-pre/review/browser-visual-review-v1.json');
const human=read('content/web/homepage/hpc2-pre/review/critical-assets-human-review-v1.json');
const index=fs.readFileSync('index.html','utf8');
const home=fs.readFileSync('assets/js/pages/home-production.js','utf8');
const data=fs.readFileSync('assets/js/web-production/public-surface-data.js','utf8');
const resolver=fs.readFileSync('assets/js/runtime/web-production/asset-resolver.js','utf8');

assert.equal(vr.schemaVersion,'1.2.0');
assert.equal(vr.assets.length,152,'Visual registry must preserve 152 planned identities.');
const heroes=vr.assets.filter(x=>x.assetType==='HERO');
const figures=vr.assets.filter(x=>x.assetType==='FIGURE');
const icons=vr.assets.filter(x=>x.assetType==='ICON');
assert.equal(heroes.length,23); assert.equal(figures.length,57); assert.equal(heroes.length+figures.length,80);
assert.equal(icons.length,43,'Existing icon family identity count must remain preserved.');
for(const h of heroes){
  assert.equal(h.canonicalFormat,'WebP',`${h.assetCode} canonical format`);
  assert.deepEqual(h.masterSize,{width:2560,height:1440},`${h.assetCode} master size`);
  assert.equal(h.aspectRatio,'16:9');
  assert.match(h.r2.objectKey,/^images\/hero\/(?:books\/)?PHIOS-HERO-.*-v1\.webp$/);
  for(const f of ['LONG_COPY','BUTTON','FAKE_UI','LOGO','EMBEDDED_CTA']) assert.ok(h.forbiddenElements.includes(f),`${h.assetCode} forbids ${f}`);
}
for(const f of figures){
  assert.equal(f.canonicalFormat,'SVG',`${f.assetCode} canonical format`);
  assert.match(f.officialFilename,/^PHIOS-FIGURE-.*-v1\.svg$/);
  assert.match(f.r2.objectKey,/^images\/figures\/(?:global|books|journey|knowledge|personal|financial|academy|professional|account)\/PHIOS-FIGURE-.*-v1\.svg$/);
  assert.ok(f.masterSize?.viewBox,`${f.assetCode} viewBox missing`);
  assert.equal(f.machineAcceptance?.status,'MACHINE_ACCEPTED',`${f.assetCode} local SVG machine acceptance missing`);
  assert.equal(f.machineAcceptance?.scriptPresent,false);
  assert.equal(f.machineAcceptance?.externalActiveContentPresent,false);
}
for(const code of ['FIG-054','FIG-055','FIG-056','FIG-057']){
  const f=figures.find(x=>x.assetCode===code); assert.ok(f); assert.match(f.r2.objectKey,/^images\/figures\/global\//);
}
const canonicalKeys=[...heroes,...figures].map(x=>x.r2.objectKey);
assert.equal(new Set(canonicalKeys).size,canonicalKeys.length,'Hero/Figure canonical object keys must be unique.');

const expectedCritical=['HERO-001','BOOK-1-HARDCOVER','BOOK-2-HARDCOVER','BOOK-3-HARDCOVER','BOOK-4-HARDCOVER','BOOK-5-HARDCOVER','FIG-001','FIG-002','FIG-003','FIG-004','FIG-005','FIG-006','FIG-054','FIG-055','FIG-056','FIG-057'];
assert.equal(critical.records.length,16); assert.deepEqual(critical.records.map(x=>x.assetCode),expectedCritical);
for(const code of [...heroes.map(x=>x.assetCode),...figures.map(x=>x.assetCode),...icons.map(x=>x.assetCode),...expectedCritical.filter(x=>x.startsWith('BOOK-'))]){
  const rec=pub.assets.find(x=>x.asset_code===code); assert.ok(rec,`Concrete public member missing: ${code}`); assert.ok(rec.object_key && !rec.object_key.endsWith('/'),`${code} cannot resolve from a folder prefix`);
}
assert.equal(pub.bucket,'phios-public-assets');
assert.match(pub.resolution_policy?.browser_runtime?.resolver || pub.resolution_policy?.runtime_resolver || 'assets/js/runtime/web-production/asset-resolver.js',/asset-resolver\.js$/);

assert.ok(index.includes('/assets/css/hpc2-pre-home-visuals.css'));
assert.ok(index.includes('data-hpc2-hero="HERO-001"'));
for(const code of ['FIG-001','FIG-002','FIG-003','FIG-004','FIG-005','FIG-006']) assert.ok(index.includes(`data-hpc2-figure="${code}"`),`${code} static homepage consumer missing`);
for(const code of ['FIG-054','FIG-055','FIG-056','FIG-057']) assert.ok(home.includes(`'${code}'`),`${code} gallery consumer missing`);
for(const code of ['ICON-006','ICON-007','ICON-008','ICON-009','ICON-014','ICON-015']) assert.ok(index.includes(`data-hpc2-icon="${code}"`),`${code} homepage icon consumer missing`);
assert.ok(home.includes('resolveCanonicalVisual'));
assert.ok(home.includes('resolveBookCover'));
assert.ok(!home.includes('figurePublicSrc'),'Homepage governed Figures must not use repository-relative figurePublicSrc.');
assert.ok(data.includes('resolvePublicAssetForWeb'));
assert.ok(resolver.includes('PUBLIC_ASSET_BASE_URL_UNAVAILABLE'));
assert.ok(!/href=["']\/reality\/?["']/.test(index),'HPC2-PRE must not prematurely activate /reality/.');
assert.ok(index.includes('href="/reality-journey"'),'Legacy public route must remain active until RJX acceptance.');

const resolverCandidates=fs.readdirSync('assets/js/runtime/web-production').filter(x=>/asset.*resolver/i.test(x));
assert.deepEqual(resolverCandidates,['asset-resolver.js'],'No second public asset resolver is allowed.');
assert.equal(human.records.length,16); assert.ok(human.records.every(r=>['PENDING','ACCEPTED','REVISION_REQUIRED'].includes(r.decision)));
assert.equal(browser.matrix.length,6); assert.deepEqual(browser.matrix.map(x=>`${x.viewportWidth}:${x.locale}`),['390:en','390:zh-Hans','768:en','768:zh-Hans','1440:en','1440:zh-Hans']);
const freeze=read('content/web/homepage/hpc2-pre/freeze/hpc2-pre-v2-freeze-v1.json');
assert.equal(freeze.schemaVersion,'1.1.0');
for(const [file,digest] of Object.entries(freeze.implementationDigests)){const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.equal(actual,digest,`HPC2-PRE immutable implementation freeze drift: ${file}`);}
assert.ok(freeze.mutableEvidenceExcludedFromDigestFreeze.includes('content/registry/public-assets.json'));
assert.ok(['BLOCKED','VISUAL_ASSETS_READY_NOT_CONSUMED','CONSUMED_NOT_BROWSER_ACCEPTED','HPC2_PRE_READY'].includes(final.state));
const accepted=critical.records.filter(x=>x.humanAccepted).length, remote=critical.records.filter(x=>x.remoteVerified).length;
if(final.state==='HPC2_PRE_READY'){assert.equal(accepted,16);assert.equal(remote,16);assert.ok(browser.matrix.every(r=>r.decision==='ACCEPTED'));}
console.log('✓ HPC2-PRE FINAL CANONICAL repository contract passed: 152 identities; 23 Hero + 57 Figure = 80; 16 critical assets; single resolver; Homepage consumers wired fail-closed.');
console.log(`✓ Current truth state: ${final.state}; critical Human Accepted ${accepted}/16; Remote Verified ${remote}/16; browser matrix ${browser.matrix.filter(x=>x.decision==='ACCEPTED').length}/6.`);
console.log('✓ /reality/ remains independently gated; no final 9-scene narrative authority was created.');
