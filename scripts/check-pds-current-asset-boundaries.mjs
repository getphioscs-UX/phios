import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.cwd();
const resolver=await import(pathToFileURL(path.resolve(root,'assets/js/runtime/web-production/asset-resolver.js')));
const {resolvePublicAsset,resolveApprovedVisual,resolvePublicAssetForWeb,resolvePublicAssetGroupMemberForWeb}=resolver;
let calls=0;const saved=globalThis.fetch;
globalThis.fetch=()=>{throw Error('UNEXPECTED_NETWORK');};
const inventory=JSON.parse(fs.readFileSync('data/visual/approved-r2-visual-assets.json','utf8'));
const withheld=inventory.assets.filter(x=>['OWNER_WITHDRAWN_FROM_PAGE_CONSUMPTION','REMOTE_MISSING_NOT_RENDERABLE'].includes(x.status));
assert(withheld.length>0,'CURRENT_WITHHELD_TEST_COVERAGE_EMPTY');
const fixturePublicRegistry={...JSON.parse(fs.readFileSync('content/registry/public-assets.json','utf8')),public_base_url:'https://assets.example.test'};
const fixturePayloads=new Map([['/data/visual/approved-r2-visual-assets.json',inventory],['/content/registry/public-assets.json',fixturePublicRegistry]]);
const fetchImpl=async url=>{calls++;assert(fixturePayloads.has(url),'UNEXPECTED_FIXTURE_URL:'+url);return {ok:true,json:async()=>fixturePayloads.get(url)};};
const activeAliasTargets=new Map([['Public editorial illustration; not a new knowledge claim.','images/branding/logo/PHIOS-LOGO-MARK-FLAT-v1.svg'],['HERO-021','images/hero/PHIOS-HERO-RELATIONSHIP-v2.webp'],['HERO-022','images/hero/PHIOS-HERO-PERSONAL-EVIDENCE-v2.webp'],['HERO-023','images/hero/PHIOS-HERO-MEMBERSHIP-CONTINUITY-v2.webp']]);
async function assertActiveAliasTarget(id){const asset=await resolveApprovedVisual(id,{fetchImpl});assert.equal(asset.objectKey,activeAliasTargets.get(id),'EXACT_ACTIVE_ALIAS_TARGET:'+id);assert.equal(asset.renderable,true);const target=inventory.assets.find(a=>a.r2Path===asset.objectKey);assert(target&&!['OWNER_WITHDRAWN_FROM_PAGE_CONSUMPTION','REMOTE_MISSING_NOT_RENDERABLE'].includes(target.status));assert(!asset.objectKey.includes('/thesis/'));return asset;}
try {
for(const entry of withheld){
 for(const id of [entry.canonicalFilename,entry.r2Path])await assert.rejects(resolveApprovedVisual(id,{fetchImpl}),{code:'APPROVED_VISUAL_WITHHELD'});
 for(const id of entry.aliases){if(activeAliasTargets.has(id))await assertActiveAliasTarget(id);else await assert.rejects(resolveApprovedVisual(id,{fetchImpl}),{code:'APPROVED_VISUAL_WITHHELD'});}
 // The default web registry has no exact object-key identity for these retired paths.
 await assert.rejects(resolvePublicAssetForWeb(entry.r2Path,{fetchImpl}),{code:'PUBLIC_ASSET_NOT_FOUND'});
 await assert.rejects(resolvePublicAssetForWeb(entry.canonicalFilename,{fetchImpl}),{code:'APPROVED_VISUAL_WITHHELD'});
}
for(const id of activeAliasTargets.keys())await assertActiveAliasTarget(id);
await assert.rejects(resolveApprovedVisual('__UNKNOWN_CURRENT_TEST__',{fetchImpl}),{code:'APPROVED_VISUAL_NOT_FOUND'});
const registry={bucket:'phios-public-assets',public_base_url:'https://assets.example.test',assets:[{asset_code:'TEST',object_key:'images/current image.webp',verification:'verified-owner',variants:[{code:'SMALL',object_key:'images/small.webp',verification:'verified',width:320}]}]};
const valid=resolvePublicAsset({registry,assetCode:'TEST',publicBaseUrl:registry.public_base_url});assert.equal(valid.src,'https://assets.example.test/images/current%20image.webp');assert.equal(valid.renderable,true);
const pending=structuredClone(registry);pending.assets[0].verification='PENDING';assert.equal(resolvePublicAsset({registry:pending,assetCode:'TEST',publicBaseUrl:registry.public_base_url}).renderable,false);
for(const base of ['http://assets.example.test','https://user:secret@assets.example.test','https://assets.example.test/?key=x','https://assets.example.test/#x'])assert.throws(()=>resolvePublicAsset({registry,assetCode:'TEST',publicBaseUrl:base}),{code:'PUBLIC_ASSET_BASE_URL_INVALID'});
for(const key of ['../private','/private','a\\b','a?secret','a#secret']){const bad=structuredClone(registry);bad.assets[0].object_key=key;assert.throws(()=>resolvePublicAsset({registry:bad,assetCode:'TEST',publicBaseUrl:registry.public_base_url}),{code:'PUBLIC_ASSET_OBJECT_KEY_INVALID'});}
assert.throws(()=>resolvePublicAsset({registry,assetCode:'UNKNOWN',publicBaseUrl:registry.public_base_url}),{code:'PUBLIC_ASSET_NOT_FOUND'});
assert.throws(()=>resolvePublicAsset({registry,assetCode:'TEST',variant:'UNREGISTERED',publicBaseUrl:registry.public_base_url}),{code:'PUBLIC_ASSET_VARIANT_NOT_REGISTERED'});
await assert.rejects(resolvePublicAssetForWeb('TEST',{registry,publicConfig:{publicAssetBaseUrl:'https://other.example.test'}}),{code:'PUBLIC_ASSET_BASE_URL_CONFLICT'});
const group=structuredClone(registry);group.assets[0].object_key='images/group/';assert.throws(()=>resolvePublicAsset({registry:group,assetCode:'TEST',publicBaseUrl:registry.public_base_url}),{code:'PUBLIC_ASSET_GROUP_REQUIRES_OBJECT_MEMBER'});
const member=await resolvePublicAssetGroupMemberForWeb('TEST','member.webp',{registry:group});assert.equal(member.renderable,false);assert.equal(member.deliveryState,'REGISTERED_GROUP_MEMBER_RUNTIME_PROBE_REQUIRED');
console.log(JSON.stringify({status:'PASS',withheldCurrentEntries:withheld.length,inventoryFixtureReads:calls,networkCalls:0,scope:'current resolver behavior; no remote existence or publication acceptance'}));
}finally{globalThis.fetch=saved;}
