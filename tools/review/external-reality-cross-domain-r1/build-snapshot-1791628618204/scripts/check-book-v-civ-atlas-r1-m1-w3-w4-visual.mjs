import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const proj=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
assert.equal(proj.status,'ACTIVE_PROJECTION_ONLY');
assert.equal(proj.bookId,'book-5');
assert.equal(proj.partId,'part-12');
assert.equal(proj.authority.posterIsSourceOfTruth,false);
assert.equal(proj.authority.ocrMayWriteRegistry,false);
assert.equal(proj.authority.registryRemainsSourceOfTruth,true);
assert.equal(proj.authority.createsSecondVisualResolver,false);
assert.equal(proj.layers.length,7);
const ids=proj.layers.map(x=>x.layerId);
assert.deepEqual(ids.sort(),['cases','comparison','loss','timeline','trajectories','transitions','world'].sort());
const world=proj.layers.find(x=>x.layerId==='world');
assert.equal(world.posters.length,15);
for(const p of world.posters){assert.match(p.assetRef,/^VIS-B5-ATLAS-L5-WS-/);assert.equal(p.availability,'UNVERIFIED_ATLAS_POSTER');}
const main=read('assets/js/pages/civilization-atlas.js');
const data=read('assets/js/pages/civilization-atlas/atlas-data.js');
const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const structuredActive=/STRUCTURED_HTML_SVG_PRIMARY/.test(main)&&/renderStructuredAtlasVisual/.test(shell)&&fs.existsSync('assets/js/pages/civilization-atlas/atlas-structured-visual.js');
if(structuredActive){
  assert.doesNotMatch(main,/loadAtlasVisualProjection/,'W4A successor must not load poster projection manifest');
  assert.doesNotMatch(data,/loadAtlasVisualProjection/,'W4A successor must not load poster projection manifest');
  assert.doesNotMatch(shell,/renderAtlasVisualProjection|data-atlas-visual-projection/,'W4A successor must not render poster projection');
  assert.match(shell,/data-atlas-structured-visual/);
  const structured=read('assets/js/pages/civilization-atlas/atlas-structured-visual.js');
  for(const layer of ['timeline','cases','comparison','world','trajectories','transitions','loss']) assert.match(structured,new RegExp(`data-structured-layer=["']${layer}["']`));
  assert.doesNotMatch(structured,/<img|\/images\/atlas\//i);
  assert.match(structured,/--atlas-navy/);
  assert.match(structured,/--atlas-gold/);
  assert.match(structured,/prefers-reduced-motion/);
  assert.match(structured,/forced-colors/);
  console.log('✓ BOOK-V-CIV-ATLAS-R1-M1-W3–W4 successor validation passed.');
  console.log('  Historical poster projection remains non-authoritative evidence; W4A/W4B HTML/SVG projection is the active customer successor.');
}else{
  assert.equal(proj.rules.brokenImageFailsToStructuredFallback,true);
  for(const l of proj.layers){assert.equal(l.fallback,'STRUCTURED_RENDERER');assert.equal(l.interactiveRegions,'STATE_DRIVEN_HTML_NOT_IMAGE_GEOMETRY');}
  assert.match(main,/loadAtlasVisualProjection/);
  assert.match(data,/loadAtlasVisualProjection/);
  assert.match(shell,/renderAtlasVisualProjection/);
  assert.match(shell,/data-atlas-visual-projection/);
  const visual=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
  assert.match(visual,/loading="lazy"/);
  assert.match(visual,/decoding="async"/);
  assert.match(visual,/data-visual-fallback/);
  assert.match(visual,/openPosterViewer/);
  assert.match(visual,/showModal/);
  assert.match(visual,/poster is orientation only|Poster is for orientation/i);
  console.log('✓ BOOK-V-CIV-ATLAS-R1-M1-W3–W4 Dynamic Visual Projection predecessor passed.');
}
const manifest=json('content/civilization-atlas/atlas-manifest-v1.json');
for(const key of ['posterAsSourceOfTruth','ocrWritesRegistry']) assert.equal(manifest.boundaries[key],false);
