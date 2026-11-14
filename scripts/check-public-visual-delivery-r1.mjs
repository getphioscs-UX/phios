import assert from 'node:assert/strict';
import fs from 'node:fs';
import {onRequestGet} from '../functions/api/public-asset-config.js';
import {readVisualDeliveryRecord,validateVisualDeliveryCurrent,publicVisualDeliveryPredecessor,visualDeliveryHash,VISUAL_DELIVERY_RECORD} from './lib/public-visual-delivery-successor-r1.mjs';
const record=validateVisualDeliveryCurrent(),base=record.publicAuthority.base;let passed=0;
for(const env of [{},{PHIOS_PUBLIC_ASSET_BASE_URL:base},{PHIOS_PUBLIC_ASSET_BASE_URL:base+'/'}]){const response=onRequestGet({env});assert.equal(response.status,200);assert.equal((await response.json()).publicAssetBaseUrl,base);passed++;}
for(const value of ['http://example.test','https://example.test',base+'/private',base+'?x=1',base+'#x','https://user:pass@'+new URL(base).host,'not-a-url']){const response=onRequestGet({env:{PHIOS_PUBLIC_ASSET_BASE_URL:value}});assert.equal(response.status,503);assert.equal((await response.json()).code,'PUBLIC_ASSET_BASE_URL_UNAVAILABLE');assert.equal(response.headers.get('cache-control'),'no-store');passed++;}
const savedFetch=globalThis.fetch;let pointerFails=0,configReads=0;
globalThis.fetch=async input=>{const path=new URL(String(input),'https://fixture.invalid').pathname;if(path==='/api/public-asset-config'){configReads++;return onRequestGet({env:{}});}if(path==='/content/web-production/registries/current-client-visual-registry.json'&&pointerFails++===0)return new Response('temporary',{status:503});const file=path.replace(/^\//,'');assert(!file.includes('..'));assert(fs.existsSync(file),'UNREGISTERED_FIXTURE_REQUEST:'+file);return new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}});};
try{
 const {resolveUnifiedPublicVisual}=await import('../assets/js/public-v2/unified-public-visual-resolver.js');
 await assert.rejects(()=>resolveUnifiedPublicVisual('METHOD-BAZI-HERO'));passed++;
 const client=JSON.parse(fs.readFileSync('content/web-production/registries/client-visual-asset-registry-v1.9.json'));
 const ids=['METHOD-ASTROLOGY-HERO','METHOD-BAZI-HERO','METHOD-ZIWEI-HERO','METHOD-NUMEROLOGY-HERO','METHOD-HUMAN-DESIGN-HERO','RELATIONSHIP-HERO','RELATIONSHIP-INVITE-PARTNER-EMPTYSTATE','RELATIONSHIP-NO-CONSENT-EMPTYSTATE','HEALTH-REALITY-HERO'];
 for(const method of ['ASTROLOGY','BAZI','ZIWEI','NUMEROLOGY','HUMAN-DESIGN']){ids.push('VIS-PREENTRY-'+method+'-P02-'+(method==='BAZI'?'FOUR-PILLARS':method==='NUMEROLOGY'?'CORE-NUMBER-SYSTEM':method==='HUMAN-DESIGN'?'BODYGRAPH-STRUCTURE':'CHART-STRUCTURE')+'-R1','VIS-PREENTRY-'+method+'-P03-METHOD-ORIGINS-R1','VIS-PREENTRY-'+method+'-P04-PHI-READING-LAYERS-R1');}
 assert.equal(ids.length,24);for(const id of ids){const asset=client.assets.find(x=>x.assetCode===id||x.sequence===id);assert.equal(asset.r2.remoteVerified,true);const result=await resolveUnifiedPublicVisual(id);assert.equal(result.renderable,true);assert.equal(result.src,base+'/'+asset.r2.objectKey.split('/').map(encodeURIComponent).join('/'));assert(result.width>0&&result.height>0);passed++;}
 assert(pointerFails>=2,'Transient pointer failure must not poison subsequent resolution');assert(configReads>0,'Actual config bridge must be exercised');
 for(const id of ['UNREGISTERED-VISUAL','constructor','__proto__']){await assert.rejects(()=>resolveUnifiedPublicVisual(id));passed++;}
 const inventory=JSON.parse(fs.readFileSync('data/visual/approved-r2-visual-assets.json'));for(const entry of inventory.assets.filter(x=>['OWNER_WITHDRAWN_FROM_PAGE_CONSUMPTION','REMOTE_MISSING_NOT_RENDERABLE'].includes(x.status))){await assert.rejects(()=>resolveUnifiedPublicVisual(entry.canonicalFilename));passed++;}
}finally{globalThis.fetch=savedFetch;}
for(const row of record.paths){assert.equal(visualDeliveryHash(publicVisualDeliveryPredecessor(row.path,fs.readFileSync(row.path))),row.previousSHA256);assert.throws(()=>validateVisualDeliveryCurrent(p=>p===row.path?Buffer.from('drift'):fs.readFileSync(p)));passed++;}
for(const mutate of [r=>r.paths.push({...r.paths[0],path:'extra.js'}),r=>r.paths[0].previousSHA256='0'.repeat(64),r=>r.publicAuthority.base='https://untrusted.invalid',r=>r.boundaries.paidAdmissionGranted=true,r=>r.frozen.sha256='0'.repeat(64)]){const value=JSON.parse(fs.readFileSync(VISUAL_DELIVERY_RECORD));mutate(value);assert.throws(()=>readVisualDeliveryRecord(Buffer.from(JSON.stringify(value))));passed++;}
console.log(JSON.stringify({status:'PUBLIC_VISUAL_DELIVERY_STRICT_PASS',passed,resolverInvoked:true,registeredAssets:24,providerCalls:0,productionWrites:0,privateAuthorityChanged:false}));
