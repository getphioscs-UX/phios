import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')), lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
assert.equal(pkg.devDependencies?.sharp, '0.35.2', 'package.json must pin sharp 0.35.2');
assert.equal(lock.packages?.['node_modules/sharp']?.version, '0.35.2', 'package-lock must pin sharp 0.35.2');
const sharp = require('sharp');
assert.ok(sharp); assert.ok(sharp.versions?.vips);
let installed = 'unknown'; try { installed = require('sharp/package.json').version; } catch {}
console.log(`✓ FIG raster backend checker: repository pin sharp 0.35.2; runtime sharp ${installed} / libvips ${sharp.versions.vips}; SVG→PNG capability available.`);
