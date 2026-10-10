import fs from 'node:fs';
import assert from 'node:assert/strict';
export function assertAskCurrentVisual(html){
 const read=p=>fs.readFileSync(p,'utf8');
 const registry=JSON.parse(read('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json'));
 const asset=registry.entries.find(a=>a.r5Sequence===71);
 assert.equal(asset?.assetId,'PLAN-HERO-01');assert.equal(asset.available,true);assert.equal(asset.remoteVerified,true);
 assert.equal(asset.objectKey,'images/figures/Entrance/PHIOS-HERO-ASK-KNOWLEDGE-SOURCES-v1.webp');
 const proof=JSON.parse(read('content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-89-R2-VERIFICATION.json')).records.find(p=>p.planId===asset.assetId);
 assert.equal(proof?.decoded,true);assert.equal(proof.sha256,asset.contentHash);assert.equal(proof.requestedURL,asset.publicUrl);
 assert.match(html,/class="cx-ask-poster"/);
 assert.ok(html.includes('/assets/customer-ui/js/surfaces/visual-binding-r5-guides.js'));
 const guides=read('assets/customer-ui/js/surfaces/visual-binding-r5-guides.js');
 assert.ok(guides.includes("[71,'.cx-ask-poster',true]"));assert.ok(guides.includes('hydrateCustomerAssets'));
}
