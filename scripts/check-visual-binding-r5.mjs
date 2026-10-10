import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {resolvePublicAssetForWeb} from '../assets/js/runtime/web-production/asset-resolver.js';
const p='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json',r=JSON.parse(fs.readFileSync(p));
assert.equal(new Set(r.entries.map(x=>x.assetId)).size,r.entries.length,'AMBIGUOUS_ASSET_ID');
globalThis.fetch=async url=>{assert.equal(url,'/'+p);return new Response(JSON.stringify(r),{headers:{'Content-Type':'application/json'}});};
for(const [id,name]of [['HERO-021','RELATIONSHIP'],['HERO-022','PERSONAL-EVIDENCE'],['HERO-023','MEMBERSHIP-CONTINUITY']]){const a=await resolvePublicAssetForWeb(id);assert.ok(a.src.endsWith('PHIOS-HERO-'+name+'-v2.webp'),'WRONG_HERO_IDENTITY');assert.ok(a.width>0&&a.height>0);await assert.rejects(()=>resolvePublicAssetForWeb(id,{variant:'invented-en'}));}
const old='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json';assert.equal(fs.readFileSync(old,'utf8'),execFileSync('git',['show','HEAD:'+old],{encoding:'utf8',maxBuffer:8*1024*1024}),'PREDECESSOR_CHANGED');
const source=fs.readFileSync('assets/js/pages/knowledge-spine-visuals.js','utf8');assert.ok(source.includes('resolveSevenVolumeCustomerAsset'));assert.ok(source.includes('BOOK-'));assert.ok(!source.includes("'book-5':'HERO-023'"),'BOOK_MEMBERSHIP_ALIAS_COLLISION');
const financialPath='professional/financial/index.html',financial=fs.readFileSync(financialPath,'utf8'),priorFinancial=execFileSync('git',['show','HEAD:'+financialPath],{encoding:'utf8'});
const formInputs=html=>[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(x=>x[0]);
assert.deepEqual(formInputs(financial),formInputs(priorFinancial),'FINANCIAL_INPUT_CONTRACT_CHANGED');
const remote=JSON.parse(fs.readFileSync('content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-89-R2-VERIFICATION.json'));
for(let number=29;number<=35;number++){
 const id='PLAN-FIN-'+String(number).padStart(3,'0'),asset=r.entries.find(x=>x.assetId===id),proof=remote.records.find(x=>x.planId===id);
 assert.equal(proof?.decoded,true,'UNVERIFIED_IMAGE_BOUND');assert.equal(asset.contentHash,proof.sha256);assert.equal(asset.publicUrl,proof.requestedURL);
 assert.equal(financial.split('data-r5-financial-guide="'+id+'"').length-1,1,'DUPLICATE_FINANCIAL_CONSUMER');
 assert.ok(!financial.includes('data-px2-asset="FIG-'+String(number).padStart(3,'0')+'"'),'RETIRED_DUPLICATE_GALLERY_CONSUMER');
}
assert.ok(financial.includes('data-px2-asset="FIG-036"'),'MISSING_EVIDENCE_BOUNDARY_PREDECESSOR');
assert.ok(!r.entries.some(x=>x.assetId==='PLAN-FIN-036'),'FAILED_REMOTE_ASSET_PROMOTED');
for(const proof of remote.records){const asset=r.entries.find(x=>x.assetId===proof.planId);if(proof.decoded){assert.ok(asset?.available);assert.equal(asset.contentHash,proof.sha256);assert.equal(asset.publicUrl,proof.requestedURL);assert.equal(asset.r5Sequence,proof.sequence);}else assert.ok(!asset?.available,'NOT_UPLOADED_ASSET_PROMOTED');}
const guides=fs.readFileSync('assets/customer-ui/js/surfaces/visual-binding-r5-guides.js','utf8');assert.ok(guides.includes('hydrateCustomerAssets'));assert.ok(!guides.includes('fetch('),'SECOND_ASSET_OR_CUSTOMER_FETCH_OWNER');
for(const file of ['index.html','explore/start/index.html','reality/index.html','account/index.html','perspectives/profile/index.html']){const html=fs.readFileSync(file,'utf8');assert.equal(html.split('src="/assets/customer-ui/js/surfaces/visual-binding-r5-guides.js"').length-1,1);const previous=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8',maxBuffer:4*1024*1024});assert.deepEqual(formInputs(html),formInputs(previous),'INPUT_CHANGED:'+file);}
const result={state:'PASS_BOUNDED_CORRECTIONS_AND_THIRTY_READY_ASSETS',scope:'Three Hero identities and 30 ready explanatory assets; original inputs preserved; 59 missing assets not promoted; browser/private/full-site closure separate',providerCalls:0};fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-SOURCE-QA.json',JSON.stringify(result,null,2)+'\n');console.log(result.state);
