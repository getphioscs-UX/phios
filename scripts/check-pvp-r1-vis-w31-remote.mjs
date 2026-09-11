import assert from 'node:assert/strict';
import fs from 'node:fs';
const p='content/product-visual-platform-r1/static-assets/evidence/pvp-r1-vis-w31-remote-verification-v1.json';
assert.ok(fs.existsSync(p),'PVP_W31_REMOTE_EVIDENCE_MISSING: run npm run verify:pvp-r1:static-assets:remote from a networked environment');
const x=JSON.parse(fs.readFileSync(p,'utf8'));
assert.equal(x.status,'REMOTE_VERIFIED_ALL_SELECTED');
assert.equal(x.selectedCount,12);assert.equal(x.verifiedCount,12);assert.equal(x.results.length,12);
for(const r of x.results){assert.equal(r.ok,true,`remote asset failed ${r.assetId}`);assert.equal(r.httpStatus,200,`HTTP ${r.assetId}`);assert.match(r.url,/^https:\/\//);assert.ok(['image/webp','image/svg+xml'].includes(r.contentType),`bad MIME ${r.assetId}:${r.contentType}`)}
console.log('✓ PVP W31 passed: all 12 selected static assets have live remote 200 + expected image MIME evidence.');
