import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const json=p=>JSON.parse(read(p));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const baseline=json('content/civilization-atlas/audits/atlas-baseline-reconciliation-v1.json');
const manifestNow=json('content/civilization-atlas/atlas-manifest-v1.json');
assert.ok(['e8d9c5c0b222fabfae9bae0ed9abb6e098705c1f','35bba5e0d9ce328801e5d56d812851bb1aad2044'].includes(baseline.baselineCommit));
assert.equal(baseline.status,'NO_DRIFT_LATEST_MAIN_RECONCILED_FOUNDATION_READY');
assert.equal(baseline.executionOrder.bookIVA6,'PRODUCTION_ADMITTED');
const a6=json('content/knowledge/contracts/book-4-production-admission-authority-v1.json');
assert.equal(a6.status,'PRODUCTION_ADMITTED');
const authorizedLaterWaveMutations=new Set(manifestNow?.boundaries?.publicUiActivated?['books/reality-differentiation/index.html','assets/js/pages/book-volume-seven.js']:[]);
for(const f of baseline.protectedFiles){if(authorizedLaterWaveMutations.has(f.path)) continue; assert.equal(digest(f.path),f.sha256,`protected baseline drift: ${f.path}`);}
const current7=json('content/web-production/registries/current-seven-volume-publication.json'); assert.equal(current7.status,'ACTIVE');
const pub=json('content/web-production/registries/wpr-seven-volume-publication-context-registry-v1.json');
const p12=pub.partOwnership.find(x=>x.partCode==='P12'); assert.ok(p12); assert.equal(p12.publicationBookCode,'BOOK-5'); assert.equal(p12.publicationBookId,'book-5'); assert.equal(p12.bookRoute,'/books/reality-differentiation/');
const bookPage=read('books/reality-differentiation/index.html'); assert.match(bookPage,/data-book-id="book-5"/); assert.match(bookPage,/\/assets\/js\/pages\/book-volume-seven\.js/); if(manifestNow.boundaries.publicUiActivated){assert.ok(bookPage.includes('data-civilization-atlas-root'),'active Atlas manifest requires Book V mount');assert.ok(fs.existsSync(path.join(root,'assets/js/pages/civilization-atlas.js')),'active Atlas manifest requires W4 entry module');}else{assert.ok(!bookPage.includes('data-civilization-atlas-root'),'foundation state must not activate public Atlas UI');}
assert.ok(!fs.existsSync(path.join(root,'assets/js/pages/civilization-atlas/civilization-atlas-image-resolver.js')),'second image resolver prohibited');
const manifest=manifestNow; assert.ok(['FOUNDATION','ACTIVE','PRODUCTION_ADMITTED'].includes(manifest.status)); assert.equal(manifest.bookId,'book-5'); assert.equal(manifest.partId,'part-12'); assert.equal(manifest.canonicalRoute,'/books/reality-differentiation/');
assert.deepEqual(manifest.layers,['timeline','cases','comparison','world','trajectories','transitions','loss']);
for(const [k,v] of Object.entries(manifest.boundaries)){if(k==='publicUiActivated') continue; assert.equal(v,false,`protected boundary must remain false: ${k}`);}
const layers=json('content/civilization-atlas/atlas-layers-v1.json'); assert.ok(['FOUNDATION','ACTIVE','PRODUCTION_ADMITTED'].includes(layers.status)); assert.equal(layers.explorerLayers.length,7); assert.deepEqual(layers.explorerLayers.map(x=>x.layerId),manifest.layers); assert.ok(layers.explorerLayers.every(x=>typeof x.customerEnabled==='boolean')); if(manifest.status==='FOUNDATION') assert.ok(layers.explorerLayers.every(x=>x.customerEnabled===false));
const ev=json('content/civilization-atlas/evidence/evidence-authority-v1.json'); assert.deepEqual(ev.authorityClasses.map(x=>x.id),['EVIDENCE_SERIES','HISTORICAL_RECONSTRUCTION','CONCEPTUAL_TRAJECTORY']); assert.deepEqual(ev.knowledgeStates,['UNKNOWN','CONTESTED','PARTIAL','RECONSTRUCTED','OBSERVED']); assert.equal(ev.customerBoundary.conceptualProjectionIsHistoricalFact,false); assert.equal(ev.customerBoundary.conceptualProjectionIsStatisticalMeasurement,false);
const packageJson=json('package.json'); assert.equal(packageJson.scripts['check:book-v-atlas:r1:w1'],'node scripts/check-book-v-civ-atlas-r1-w1-authority.mjs'); assert.equal(packageJson.scripts['check:book-v-atlas:r1:w2'],'node scripts/check-book-v-civ-atlas-r1-w2-schemas.mjs');
for(const forbidden of ['collapseScore','civilizationDeclineScore','totalLossScore','superiorityScore']) assert.ok(!(forbidden in layers) && !(forbidden in ev),`prohibited score field: ${forbidden}`);
assert.equal(manifest.boundaries.collapseScore,false); assert.equal(manifest.boundaries.superiorityScore,false);
console.log('✓ BOOK-V-CIV-ATLAS-R1-W1 Authority & Layer Contract passed.');
console.log('  P12 -> BOOK-5 publication ownership and existing theory/visual/Ask authorities remain preserved across the Atlas successor state.');
