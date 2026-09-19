import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {resolveAtlasVisualById,resolveAtlasStaticVisuals,renderAtlasStaticVisuals,ATLAS_VISUAL_BINDINGS_PATH} from '../assets/js/pages/civilization-atlas/atlas-static-visual.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const bindings=read('.'+ATLAS_VISUAL_BINDINGS_PATH),audit=read(bindings.sourceAudit);
assert.equal(bindings.actualBucketTotal,null);
assert.equal(bindings.assets.length,audit.rows.filter(r=>r.result==='VERIFIED_WEBP').length);
assert.equal(new Set(bindings.assets.map(a=>a.assetId)).size,bindings.assets.length);
const options={allowPendingReview:true};
for(const a of bindings.assets){
 assert.equal(resolveAtlasVisualById(bindings,a.assetId,options)?.assetId,a.assetId);
 assert.equal(Boolean(resolveAtlasVisualById(bindings,a.assetId)),a.reviewState==='ACCEPTED');
 assert.ok(a.subjectTitle.en&&a.subjectTitle['zh-Hans']);
 const observed=audit.rows.find(r=>r.assetId===a.assetId);assert.equal(observed.sha256,a.sha256);assert.equal(observed.webpSignature,true);assert.equal(observed.httpStatus,200);
 assert.ok(!a.canonicalAuthority&&!a.historicalAuthority&&!a.ocrWriteBackAllowed);
}
for(const family of ['MODERN_FLAG','HISTORICAL_FIGURE'])assert.equal(bindings.assets.filter(a=>a.family===family).length,family==='MODERN_FLAG'?24:16);
const states=[{activeLayer:'timeline',timeWindowId:'T00'},{activeLayer:'cases',primaryCaseId:'CA-T09-01'},{activeLayer:'comparison',comparisonFamilyId:'CONTINENTAL_EMPIRE'},{activeLayer:'world',snapshotId:'WS-1250'},{activeLayer:'trajectories',trajectoryIds:['POPULATION']},{activeLayer:'transitions',transitionWindowId:'TW-01'},{activeLayer:'loss',lossTypeId:'LOSS-REGIME-END'}];
for(const state of states){const rows=resolveAtlasStaticVisuals(bindings,state,options);assert.ok(rows.length>0,state.activeLayer);assert.ok(rows.length<=2);}
const candidate=bindings.assets.find(a=>a.reviewState==='PENDING_HUMAN_REVIEW');
for(const patch of [{publicUrl:'https://invalid.test/image.webp'},{subjectId:'WRONG_SUBJECT'},{sha256:''},{historicalAuthority:true},{deliveryVerified:false},{ownerUploadConfirmed:false}])assert.equal(resolveAtlasVisualById({...bindings,assets:[{...candidate,...patch}]},candidate.assetId,options),null);
const {document}=parseHTML('<html><head></head><body><main data-atlas-ready="true"><div data-atlas-structured-visual><svg></svg></div></main></body></html>');
renderAtlasStaticVisuals(document.querySelector('main'),{bindings,state:states[0],locale:'zh-Hans'});
assert.ok(document.querySelector('svg'));assert.equal(document.querySelectorAll('img').length,1,'Collapsed library must not load all images');
assert.equal(document.querySelector('img').getAttribute('loading'),'lazy');assert.ok(document.querySelector('img').getAttribute('alt'));
console.log(`PASS: ${bindings.assets.length} verified logical bindings; all seven state projections; 24 flags, 16 figures; local review gate, tamper rejection and bounded image loading.`);
