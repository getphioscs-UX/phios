import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const reg=JSON.parse(read('content/registry/public-assets.json'));
const fav=reg.assets.find(x=>x.asset_code==='LOGO-011');
assert.ok(fav); assert.equal(fav.official_filename,'PHIOS-FAVICON-v1.svg'); assert.equal(fav.object_key,'images/branding/logo/PHIOS-FAVICON-v1.svg'); assert.equal(fav.canonical,true);
const authority=read('assets/js/branding/favicon-authority.js');
for(const token of ['LOGO-011','PHIOS-FAVICON-v1.svg','ensureCanonicalPhiosFavicon']) assert.ok(authority.includes(token),`favicon authority missing ${token}`);
const shell=read('assets/js/public-shell.js'); assert.match(shell,/ensureCanonicalPhiosFavicon\(\)/); assert.match(shell,/resolvePublicAssetForWeb\('LOGO-011'/);
const journey=read('assets/js/journey-shell.js'); assert.match(journey,/ensureCanonicalPhiosFavicon/);
for(const page of ['knowledge/ask/index.html','books/reality-differentiation/index.html']){const h=read(page);assert.match(h,/PHIOS-FAVICON-v1\.svg/);assert.match(h,/data-phios-branding="true"/);}
assert.ok(!shell.includes('Browser keeps its existing/default favicon'));
console.log('✓ BOOK-V-CIV-ATLAS-R1-M1-W1 Global Favicon Authority Recovery passed.');
