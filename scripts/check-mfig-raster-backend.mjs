import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let sharp;
try{sharp=require('sharp');}catch(error){throw new Error(`MFIG repository raster backend unavailable. Run npm ci. ${error?.message||error}`);}
assert.ok(sharp?.versions?.sharp,'sharp version unavailable');
assert.ok(sharp?.versions?.vips,'libvips version unavailable');
assert.equal(sharp.format?.svg?.input?.buffer,true,'sharp SVG buffer input unavailable');
assert.equal(sharp.format?.png?.output?.file,true,'sharp PNG file output unavailable');
assert.equal(sharp.format?.webp?.output?.file,true,'sharp WebP file output unavailable');
console.log(`✓ MFIG raster backend checker: repository-pinned sharp ${sharp.versions.sharp} / libvips ${sharp.versions.vips}; SVG→PNG/WebP available without ImageMagick.`);
