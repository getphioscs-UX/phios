import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const json=p=>JSON.parse(read(p));
const page=read('books/reality-differentiation/index.html'); assert.match(page,/data-civilization-atlas-root/); assert.match(page,/id="atlas"/); assert.match(page,/\/assets\/css\/civilization-atlas\.css/); assert.match(page,/\/assets\/js\/pages\/civilization-atlas\.js/); assert.match(page,/\/assets\/js\/pages\/book-volume-seven\.js/);
const renderer=read('assets/js/pages/book-volume-seven.js'); assert.match(renderer,/bookId === 'book-5'/); assert.match(renderer,/Explore the Atlas/); assert.match(renderer,/探索文明图谱/);
const manifest=json('content/civilization-atlas/atlas-manifest-v1.json'); assert.equal(manifest.status,'ACTIVE'); assert.equal(manifest.baselineCommit,'35bba5e0d9ce328801e5d56d812851bb1aad2044'); assert.equal(manifest.boundaries.publicUiActivated,true);
for(const [k,v] of Object.entries(manifest.boundaries)){if(k!=='publicUiActivated') assert.equal(v,false,`protected boundary changed: ${k}`);}
const layers=json('content/civilization-atlas/atlas-layers-v1.json'); assert.equal(layers.status,'ACTIVE');
for(const id of ['timeline','cases','comparison','world','trajectories','transitions','loss']) assert.ok(layers.explorerLayers.some(x=>x.layerId===id),`missing Atlas layer contract: ${id}`);
// Successor-aware boundary: W4 owns the shell/mount only. Later waves may legitimately activate registries; their own checkers enforce those gates.
const shellJs=read('assets/js/pages/civilization-atlas/atlas-shell.js'); for(const layer of ['timeline','cases','comparison','world','trajectories','transitions','loss']) assert.ok(shellJs.includes(layer),`missing layer shell: ${layer}`); assert.match(shellJs,/civ-atlas-inspector/); assert.match(shellJs,/civ-atlas-canvas/); assert.match(shellJs,/历史脊柱/); assert.match(shellJs,/World Slices/);
const css=read('assets/css/civilization-atlas.css'); assert.match(css,/@media\(max-width:1024px\)/); assert.match(css,/@media\(max-width:768px\)/); assert.match(css,/prefers-reduced-motion/);
assert.ok(!fs.existsSync(path.join(root,'assets/js/pages/civilization-atlas/civilization-atlas-image-resolver.js')),'second visual resolver prohibited');
console.log('✓ BOOK-V-CIV-ATLAS-R1-W4 Atlas Shell + Book V Explorer Entry passed.');
console.log('  Book V mounts one seven-layer shell on the canonical page; later-wave activation is delegated to successor-aware W5+ checkers and protected authorities remain unchanged.');
