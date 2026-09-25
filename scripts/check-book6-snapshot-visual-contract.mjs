import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshots=read('content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json');
const status=read('content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json');
const renderer=fs.readFileSync('assets/js/pages/civilization-atlas/reconfiguration-renderer.js','utf8');
const rows=snapshots.snapshots||[];
assert.equal(rows.length,12);
assert.equal(new Set(rows.map(x=>x.id)).size,12);
assert.equal(new Set(rows.map(x=>x.visualAssetId)).size,12);
for(const s of rows){
 assert.equal(s.visualAssetType,'STATIC_ATLAS_BASE_VISUAL');
 assert.equal(s.asset?.assetRole,'STATIC_ATLAS_BASE_VISUAL');
 assert.equal(s.asset?.htmlOverlayRequired,true);
 assert.equal(s.asset?.dynamicDataEmbedded,false);
 assert.equal(s.asset?.legendEmbedded,false);
 assert.equal(s.asset?.currentDataEmbedded,false);
 assert.equal(s.asset?.supportsLayerOverlay,true);
 assert.ok(s.asset?.r2Path);
}
assert.match(renderer,/resolveAtlasVisualById\(data\.visualBindings,s\.visualAssetId\)/);
assert.doesNotMatch(renderer,/s\.asset\.publicUrl/);
assert.match(renderer,/loading="lazy"/);
assert.match(renderer,/decoding="async"/);
assert.match(renderer,/data-snapshot-image/);
assert.match(renderer,/RUNTIME_LOAD_FAILED/);
assert.match(renderer,/textAlternative/);
assert.match(renderer,/layerLabel\(state\.snapshotLayer\)/);
const row2026=status.assets.find(a=>a.assetId==='WORLD_RECONFIGURATION_SNAPSHOT_2026');
assert.ok(row2026);
if(row2026.status==='PRESENT'){
 const probe=row2026.liveProbe;
 assert.equal(probe?.status,'PRESENT','2026 PRESENT requires its own live resolver evidence');
 assert.equal(probe?.httpStatus,200,'2026 PRESENT requires HTTP 200');
 assert.ok(String(probe?.contentType||'').toLowerCase().startsWith('image/webp'),'2026 PRESENT requires image/webp');
 assert.equal(probe?.webpSignature,true,'2026 PRESENT requires RIFF/WEBP signature');
}else{
 assert.equal(row2026.status,'MISSING','2026 may only be MISSING or live-probe PRESENT');
}
console.log('PASS: Book VI snapshot visual contract uses one base image + structured overlay, canonical resolver binding, lazy loading and textual alternative.');
