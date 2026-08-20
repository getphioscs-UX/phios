import assert from 'node:assert/strict';
import fs from 'node:fs';
const binding=JSON.parse(fs.readFileSync('content/web-production/registries/phios-bri-branding-logo-binding-v1.json','utf8'));
const visual=JSON.parse(fs.readFileSync('content/web-production/registries/client-visual-asset-registry-v1.2.json','utf8'));
const publicAssets=JSON.parse(fs.readFileSync('content/registry/public-assets.json','utf8'));
const data=fs.readFileSync('assets/js/web-production/public-surface-data.js','utf8');
const books=fs.readFileSync('assets/js/pages/books.js','utf8');
assert.equal(binding.bindings.length,5);
assert.equal(new Set(binding.bindings.map(x=>x.sequence)).size,5);
for (const b of binding.bindings) {
  assert.match(b.sequence,/^BRAND-00[1-5]$/); assert.equal(b.lightSurfaceLogo,'LOGO-009'); assert.equal(b.darkSurfaceLogo,'LOGO-010');
  const v=visual.assets.find(x=>x.sequence===b.sequence); assert.ok(v); assert.equal(v.r2.objectKey,b.objectKey); assert.equal(v.assetType,'BRANDING');
  const p=publicAssets.assets.find(x=>x.asset_code===v.assetCode); assert.ok(p,`Public asset missing for ${b.sequence}`); assert.equal(p.object_key,b.objectKey);
}
assert.equal(binding.authority.createsSecondLogoAuthority,false); assert.equal(binding.authority.createsSecondAssetResolver,false); assert.equal(binding.authority.heroNoLogoInvariantPreserved,true);
assert.match(data,/resolveBookBranding/); assert.match(books,/resolveBookBranding/); assert.doesNotMatch(books,/pub-[a-z0-9]+\.r2\.dev/i);
console.log('✓ BRI-1 Branding Logo Binding passed: 5/5 identities, canonical logo governance, BOOKS fail-closed consumer.');
