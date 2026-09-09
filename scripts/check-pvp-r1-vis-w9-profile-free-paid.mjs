import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildProfileVisualDepthProjection} from '../functions/profile/profile-visual-depth-projection.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const c=read('content/product-visual-platform-r1/profile/access/profile-free-paid-depth-contract-v1.json');
const a=read('content/product-visual-platform-r1/acceptance/pvp-r1-vis-w9-profile-free-paid-v1.json');
assert.deepEqual(Object.keys(c.states),['FREE_SNAPSHOT','DEEP_PROFILE','REALITY_PROFILE']);
assert.equal(c.entitlementBoundary.clientRequestMaySelfUpgrade,false);
assert.equal(c.entitlementBoundary.currentProfileApiTrustedEntitlementIntegrated,false);
assert.equal(c.commerceBoundary.priceCreated,false);
assert.equal(c.commerceBoundary.offerIdCreated,false);
assert.equal(a.currentCustomerRuntime,'FREE_SNAPSHOT');
const projection={schemaVersion:'x',figures:[
 {pfig:'PFIG-001',state:'READY',data:{lanes:[{dimensions:[1,2,3,4].map((value,i)=>({signalRef:`s${i}`,value}))}]}},
 {pfig:'PFIG-003',state:'READY',data:{resources:[{signalRef:'r1'},{signalRef:'r2'}],costs:[{signalRef:'c1'},{signalRef:'c2'}]}},
 {pfig:'PFIG-005',state:'READY',data:{perspectives:[{projectionState:'CONVERGES'},{projectionState:'DIVERGES'}]}},
 {pfig:'PFIG-009',state:'READY',data:{contextEvidence:{x:1},contradictions:[{signalRef:'x'}],questions:[{text:'Q1'},{text:'Q2'}]}}
]};
const free=buildProfileVisualDepthProjection({visualProjection:projection,entitlement:{trustedServerResolved:false,status:'ACTIVE',level:'REALITY_PROFILE'}});
assert.equal(free.level,'FREE_SNAPSHOT');assert.equal(free.fullProjection,null);assert.equal(free.freeSnapshot.figures.length,4);assert.equal(free.freeSnapshot.figures[0].data.lanes[0].dimensions.length,3);assert.equal(free.freeSnapshot.figures[1].data.resources.length,1);assert.equal(free.freeSnapshot.figures[3].data.questions.length,1);
const paid=buildProfileVisualDepthProjection({visualProjection:projection,entitlement:{trustedServerResolved:true,status:'ACTIVE',level:'DEEP_PROFILE'}});
assert.equal(paid.level,'DEEP_PROFILE');assert.ok(paid.fullProjection);assert.equal(paid.locked.length,1);
console.log('✓ PVP-R1-VIS-W9 Profile Free/Paid passed.');
console.log('  Free Snapshot is current runtime; Deep Profile and Reality Profile are defined but commerce remains fail-closed.');
