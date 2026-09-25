import assert from 'node:assert/strict';
import fs from 'node:fs';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='content/civilization-atlas/reconfiguration/';
const manifest=json(base+'atlas-manifest-v2.json');
const sections=json(base+'book-vi-sections-v1.json');
const cases=json(base+'reconfiguration-case-registry-v1.json');
const windows=json(base+'reconfiguration-windows-v1.json');
const snapshots=json(base+'world-reconfiguration-snapshots-v1.json');
const dossiers=json(base+'contemporary-runtime-dossiers-v1.json');
const lived=json(base+'lived-reality-dimensions-v1.json');
const rels=json(base+'book-vi-atlas-relationships-v2.json');
const visuals=json(base+'book-vi-visual-asset-status-v1.json');

assert.equal(manifest.bookCode,'BOOK-6');
assert.equal(manifest.partCode,'PART-13');
assert.equal(manifest.chapterRange,'13.1–13.85');
assert.equal(manifest.architectureBoundary.newParallelRuntime,false);
assert.equal(sections.sections.length,85);
assert.equal(new Set(sections.sections.map(x=>x.id)).size,85);
assert.equal(sections.sections.at(-1).id,'13.85');
assert.equal(cases.cases.length,60);
assert.equal(new Set(cases.cases.map(x=>x.id)).size,60);
assert.equal(windows.windows.length,24);
assert(windows.windows.every(x=>x.startYear<=x.endYear));
assert(windows.windows.every(x=>x.version&&x.createdAt&&x.updatedAt&&Object.hasOwn(x,'supersedes')&&Object.hasOwn(x,'supersededBy')));
assert.equal(snapshots.snapshots.length,12);
assert.equal(new Set(snapshots.snapshots.map(x=>x.id)).size,12);
assert(snapshots.snapshots.every(x=>x.version&&x.createdAt&&x.updatedAt&&Object.hasOwn(x,'supersedes')&&Object.hasOwn(x,'supersededBy')));
for(const s of snapshots.snapshots){
 assert.equal(s.asset.assetRole,'STATIC_ATLAS_BASE_VISUAL');
 assert.equal(s.asset.htmlOverlayRequired,true);
 assert.equal(s.asset.dynamicDataEmbedded,false);
 assert.equal(s.asset.legendEmbedded,false);
 assert.equal(s.asset.currentDataEmbedded,false);
 const visual=visuals.assets.find(a=>a.assetId===s.visualAssetId);
 assert.ok(visual,'missing visual status for '+s.visualAssetId);
 assert.equal(s.asset.resolutionStatus,visual.status,'snapshot status must follow B6-WEB-E resolver truth');
}
assert.equal(lived.dimensions.length,14);
assert(lived.dimensions.every(x=>x.scoreAllowed===false));
assert.equal(dossiers.dossiers.length,12);
assert(dossiers.dossiers.every(x=>x.version&&x.createdAt&&x.updatedAt&&Object.hasOwn(x,'supersedes')&&Object.hasOwn(x,'supersededBy')));
for(const d of dossiers.dossiers){
 if(d.dataClass==='CURRENT_DATA')assert(d.asOfDate&&d.sourceDate&&d.lastReviewedAt);
 assert.notEqual(d.status,'CURRENT_VERIFIED');
}
assert.equal(rels.relationships.length,85);
assert.equal(visuals.expectedCoreAssets,23);
assert.equal(visuals.assets.length,23);
assert.deepEqual(visuals.snapshotSummary,{expected:12,present:12,missing:0,unverified:0});
assert.deepEqual(visuals.coreSummary,{expected:23,present:15,missing:8,unverified:0});
assert.equal(visuals.liveProbe?.status,'PASS');
const snapshot2026=visuals.assets.find(a=>a.assetId==='WORLD_RECONFIGURATION_SNAPSHOT_2026');
assert.equal(snapshot2026?.status,'PRESENT');
assert.equal(snapshot2026?.liveProbe?.httpStatus,200);
assert.equal(snapshot2026?.liveProbe?.contentType,'image/webp');
assert.equal(snapshot2026?.liveProbe?.webpSignature,true);
for(const id of ['FIG_13A','FIG_13B','FIG_13C','FIG_13D','FIG_13E','FIG_13F','FIG_13G','FIG_13H']){
 const v=visuals.assets.find(a=>a.assetId===id);
 assert.equal(v?.status,'MISSING',id+' must remain truthfully missing until a future live resolver probe succeeds');
 assert.equal(v?.liveProbe?.httpStatus,404);
}
const banned=/\b(best country|worst country|best civilization|advanced civilization|backward civilization|country score|civilization score|winner|loser|happiest country)\b/i;
for(const path of ['reconfiguration-case-registry-v1.json','contemporary-runtime-dossiers-v1.json','lived-reality-dimensions-v1.json'])assert(!banned.test(fs.readFileSync(base+path,'utf8')),path);
const ui=fs.readFileSync('assets/js/pages/civilization-atlas/reconfiguration-renderer.js','utf8');
assert.match(ui,/BOOK_SECTION/);
assert.match(ui,/LIVED_REALITY/);
assert.match(ui,/dossiercompare/);
assert.match(ui,/slice\(0,4\)/);
assert.match(ui,/resolveAtlasVisualById/);
console.log('✓ Book VI Reconfiguration Atlas structure PASS: 85 sections, 60 cases, 24 windows, 12 snapshot records, 12 dossier targets, 14 lived-reality dimensions, unified search and 2–4 comparison surfaces.');
console.log('  B6-WEB-E live visual truth: Snapshots 12/12 PRESENT; 23 core visuals = 15 PRESENT / 8 MISSING / 0 UNVERIFIED; FIG 13A–13H are the eight live-404 gaps.');
console.log('  Browser acceptance NOT_RUN; human acceptance remains B6-WEB-F.');
