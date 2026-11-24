import {releaseR5Predecessor,validateReleaseR5} from './lib/pr22-release-r5-exact-successor-r1.mjs';
import {auditPublicPredecessor} from './lib/audit-r2-public-receiver-r2.mjs';
import {parseHTML} from 'linkedom';
import {isConvergenceCurrent,readConvergenceRecord,assertConvergenceHome,convergencePredecessor,convergenceRedirectTarget} from './lib/public-customer-report-convergence-successor-r1.mjs';
import './check-public-visual-slot-contrast-current.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {resolvePublicAssetForWeb} from '../assets/js/runtime/web-production/asset-resolver.js';

import path from 'node:path';import {createHash} from 'node:crypto';
const proofSha=bytes=>createHash('sha256').update(bytes).digest('hex');
const nativeProofFetch=globalThis.fetch.bind(globalThis);
async function verifiedDeltaBytes(proof,{readCache=fs.readFileSync,publicFetch=nativeProofFetch,ignoreCache=process.argv.includes('--proof-no-cache')}={}){
 const url=new URL(proof.requestedURL);assert.equal(url.origin,'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev','UNAPPROVED_PUBLIC_PROOF_ORIGIN');assert.equal(url.search,'');assert.equal(url.hash,'');assert.equal(decodeURIComponent(url.pathname.slice(1)),proof.objectKey,'DELTA_PUBLIC_OBJECT_IDENTITY_DRIFT');assert.ok(proof.objectKey.startsWith('images/')&&!proof.objectKey.split('/').includes('..'),'DELTA_PUBLIC_OBJECT_SCOPE');assert.match(proof.sha256,/^[a-f0-9]{64}$/);assert.equal(proof.decoded,true);assert.equal(proof.httpStatus,200);
 const cacheRoot=path.resolve('.tmp/visual-binding-r6-cache'),cachePath=path.resolve(proof.cache);assert.ok(cachePath.startsWith(cacheRoot+path.sep),'DELTA_CACHE_OUTSIDE_DECLARED_ROOT');let bytes;
 if(!ignoreCache){try{bytes=readCache(cachePath);}catch(error){if(error.code!=='ENOENT')throw error;}}
 if(!bytes){const response=await publicFetch(url.href,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(response.status,200,'DELTA_PUBLIC_GET_FAILED');bytes=Buffer.from(await response.arrayBuffer());}
 assert.equal(proofSha(bytes),proof.sha256,'DELTA_BYTES_DRIFT');return bytes;
}
// Deterministic request/byte tests: no real fixture URL is contacted or bound.
const fixtureBytes=Buffer.from('deterministic public proof fixture'),fixtureProof={decoded:true,httpStatus:200,cache:'.tmp/visual-binding-r6-cache/fixture.webp',objectKey:'images/fixture.webp',requestedURL:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/fixture.webp',sha256:proofSha(fixtureBytes)},missingCache=()=>{throw Object.assign(new Error('fixture missing'),{code:'ENOENT'});},fixtureFetch=async()=>new Response(fixtureBytes,{status:200});
assert.deepEqual(await verifiedDeltaBytes(fixtureProof,{readCache:missingCache,publicFetch:fixtureFetch,ignoreCache:false}),fixtureBytes);
await assert.rejects(()=>verifiedDeltaBytes({...fixtureProof,requestedURL:'https://private.invalid/images/fixture.webp'},{readCache:missingCache,publicFetch:fixtureFetch}),/UNAPPROVED_PUBLIC_PROOF_ORIGIN/);
await assert.rejects(()=>verifiedDeltaBytes({...fixtureProof,objectKey:'images/other.webp'},{readCache:missingCache,publicFetch:fixtureFetch}),/DELTA_PUBLIC_OBJECT_IDENTITY_DRIFT/);
await assert.rejects(()=>verifiedDeltaBytes(fixtureProof,{readCache:missingCache,publicFetch:async()=>new Response('',{status:503}),ignoreCache:false}),/DELTA_PUBLIC_GET_FAILED/);
await assert.rejects(()=>verifiedDeltaBytes(fixtureProof,{readCache:missingCache,publicFetch:async()=>new Response('tamper'),ignoreCache:false}),/DELTA_BYTES_DRIFT/);
let invalidCacheFetched=false;await assert.rejects(()=>verifiedDeltaBytes(fixtureProof,{readCache:()=>Buffer.from('tamper'),publicFetch:async()=>{invalidCacheFetched=true;return fixtureFetch();},ignoreCache:false}),/DELTA_BYTES_DRIFT/);assert.equal(invalidCacheFetched,false);
function financialBoundaryPredecessor(html,{recordBytes=fs.readFileSync("content/customer-experience-rebuild/legacy/financial-evidence-boundary-successor-v1.json")}={}){
 // Validate the real accepted current boundary before the exact historical view.
 assert.ok(!html.includes('data-px2-asset="FIG-036"'),'RETIRED_BOUNDARY_CONSUMER_RESTORED_WITHOUT_SUCCESSOR');
 assert.ok(html.includes('The financial snapshot, deterministic calculations and bounded findings keep their original labels.')&&html.includes('财务快照、确定性计算与边界化发现会保留原有标签'),'CURRENT_EVIDENCE_DECISION_COPY_MISSING');
 try {html=auditPublicPredecessor('professional/financial/index.html',Buffer.from(html)).toString('utf8');}
 catch(error){if(error.message?.startsWith('AUDIT_PUBLIC_INPUT_DRIFT:professional/financial/index.html'))assert.fail('FINANCIAL_BOUNDARY_CURRENT_DRIFT: '+error.message);throw error;}
 assert.equal(proofSha(recordBytes),"d75da4205e89c25966fea2d0f344f352adc92527d0a2645cb1b8bf1cff3c5873",'UNREGISTERED_FINANCIAL_BOUNDARY_SUCCESSOR');const record=JSON.parse(recordBytes);assert.equal(record.status,'ENGINEERING_FINANCIAL_VISUAL_PREDECESSOR_RECONCILIATION');assert.equal(record.path,'professional/financial/index.html');for(const key of ['humanAcceptanceGranted','productionAcceptanceGranted','restoresLegacyImage'])assert.equal(record[key],false);assert.equal(proofSha(html),record.afterSHA,'FINANCIAL_BOUNDARY_CURRENT_DRIFT');
 assert.ok(!html.includes('data-px2-asset="FIG-036"'),'RETIRED_BOUNDARY_CONSUMER_RESTORED_WITHOUT_SUCCESSOR');assert.ok(html.includes('The financial snapshot, deterministic calculations and bounded findings keep their original labels.')&&html.includes('财务快照、确定性计算与边界化发现会保留原有标签'),'CURRENT_EVIDENCE_DECISION_COPY_MISSING');
 const legacy=JSON.parse(fs.readFileSync('content/registry/public-assets.json')).assets.find(a=>a.asset_code==='FIG-036'),approved=JSON.parse(fs.readFileSync('data/visual/approved-r2-visual-assets.json')).assets.find(a=>a.aliases.includes('FIG-036'));assert.equal(proofSha(JSON.stringify(legacy)),record.legacyRegistryEntrySHA,'LEGACY_BOUNDARY_AUTHORITY_DRIFT');assert.equal(proofSha(JSON.stringify(approved)),record.approvedInventoryEntrySHA,'BOUNDARY_ACCEPTANCE_REQUIRES_RECONCILIATION');
 const acceptanceBytes=fs.readFileSync(record.publicApproval.path);assert.equal(proofSha(acceptanceBytes),record.publicApproval.sha256,'BOUNDARY_OWNER_ACCEPTANCE_DRIFT');const acceptance=JSON.parse(acceptanceBytes);assert.equal(acceptance.authority,'EXPLICIT_USER_CONFIRMATION');assert.equal(acceptance.reviewState,'ACCEPTED');for(const key of record.publicApproval.objectKeys)assert.ok(acceptance.objectKeys.includes(key),'MISSING_EXACT_BOUNDARY_ACCEPTANCE');
 let restored=html;for(const h of [...record.reverseHunks].reverse()){assert.equal(restored.slice(h.newOffset,h.newOffset+h.after.length),h.after,'FINANCIAL_BOUNDARY_HUNK_DRIFT');restored=restored.slice(0,h.newOffset)+h.before+restored.slice(h.newOffset+h.after.length);}assert.equal(proofSha(restored),record.beforeSHA,'FINANCIAL_BOUNDARY_PREDECESSOR_DRIFT');return restored;
}

const p='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json',r=JSON.parse(fs.readFileSync(p));
assert.equal(new Set(r.entries.map(x=>x.assetId)).size,r.entries.length,'AMBIGUOUS_ASSET_ID');
const resolverFixtures=new Map([['/'+p,r],['/data/visual/approved-r2-visual-assets.json',JSON.parse(fs.readFileSync('data/visual/approved-r2-visual-assets.json'))]]);
globalThis.fetch=async url=>{assert.ok(resolverFixtures.has(url),'UNEXPECTED_RESOLVER_FIXTURE_URL '+url);return new Response(JSON.stringify(resolverFixtures.get(url)),{headers:{'Content-Type':'application/json'}});};
for(const [id,name]of [['HERO-021','RELATIONSHIP'],['HERO-022','PERSONAL-EVIDENCE'],['HERO-023','MEMBERSHIP-CONTINUITY']]){const a=await resolvePublicAssetForWeb(id);assert.ok(a.src.endsWith('PHIOS-HERO-'+name+'-v2.webp'),'WRONG_HERO_IDENTITY');assert.ok(a.width>0&&a.height>0);await assert.rejects(()=>resolvePublicAssetForWeb(id,{variant:'invented-en'}));}
const old='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json';assert.equal(fs.readFileSync(old,'utf8'),execFileSync('git',['show','HEAD:'+old],{encoding:'utf8',maxBuffer:8*1024*1024}),'PREDECESSOR_CHANGED');
const source=fs.readFileSync('assets/js/pages/knowledge-spine-visuals.js','utf8');assert.ok(source.includes('resolveSevenVolumeCustomerAsset'));assert.ok(source.includes('BOOK-'));assert.ok(!source.includes("'book-5':'HERO-023'"),'BOOK_MEMBERSHIP_ALIAS_COLLISION');
const financialPath='professional/financial/index.html',financial=fs.readFileSync(financialPath,'utf8'),priorFinancial=execFileSync('git',['show','HEAD:'+financialPath],{encoding:'utf8'});
const formInputs=html=>[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(x=>x[0]);
assert.deepEqual(formInputs(financial),formInputs(priorFinancial),'FINANCIAL_INPUT_CONTRACT_CHANGED');
const remote=JSON.parse(fs.readFileSync('content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-89-R2-VERIFICATION.json'));
const deltaPath='content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R6-R2-DELTA.json';
const delta=fs.existsSync(deltaPath)?JSON.parse(fs.readFileSync(deltaPath)).records:[];
for(const proof of delta.filter(x=>x.decoded)){
 assert.equal(proof.httpStatus,200,'DELTA_HTTP_NOT_VERIFIED');assert.ok(proof.width>0&&proof.height>0,'DELTA_DECODE_NOT_VERIFIED');
 assert.equal(proofSha(await verifiedDeltaBytes(proof)),proof.sha256,'DELTA_BYTES_DRIFT');
 assert.ok(remote.records.some(x=>x.planId===proof.planId&&x.sequence===proof.sequence),'DELTA_UNKNOWN_IDENTITY');
 if(proof.sequence===61)assert.equal(proof.objectKey,'images/figures/Entrance/PHIOS-ILLUSTRATION-NATURAL-HEALER-SERVICE-SCOPE-v1.webp','OWNER_CORRECTED_KEY_DRIFT');
 else assert.equal(proof.objectKey,remote.records.find(x=>x.planId===proof.planId).objectKey,'DELTA_KEY_DRIFT');
}
for(let number=29;number<=35;number++){
 const id='PLAN-FIN-'+String(number).padStart(3,'0'),asset=r.entries.find(x=>x.assetId===id),proof=remote.records.find(x=>x.planId===id);
 assert.equal(proof?.decoded,true,'UNVERIFIED_IMAGE_BOUND');assert.equal(asset.contentHash,proof.sha256);assert.equal(asset.publicUrl,proof.requestedURL);
 assert.equal(financial.split('data-r5-financial-guide="'+id+'"').length-1,1,'DUPLICATE_FINANCIAL_CONSUMER');
 assert.ok(!financial.includes('data-px2-asset="FIG-'+String(number).padStart(3,'0')+'"'),'RETIRED_DUPLICATE_GALLERY_CONSUMER');
}
assert.ok(financialBoundaryPredecessor(financial).includes('data-px2-asset="FIG-036"'),'MISSING_EVIDENCE_BOUNDARY_PREDECESSOR');
assert.throws(()=>financialBoundaryPredecessor(financial+' '),/FINANCIAL_BOUNDARY_CURRENT_DRIFT/);
assert.throws(()=>financialBoundaryPredecessor(financial,{recordBytes:Buffer.from('{}')}),/UNREGISTERED_FINANCIAL_BOUNDARY_SUCCESSOR/);
assert.ok(!r.entries.some(x=>x.assetId==='PLAN-FIN-036'),'FAILED_REMOTE_ASSET_PROMOTED');
const currentProofs=remote.records.map(x=>delta.find(d=>d.planId===x.planId&&d.decoded)||x);
for(const proof of currentProofs){const asset=r.entries.find(x=>x.assetId===proof.planId);if(proof.decoded){assert.ok(asset?.available);assert.equal(asset.contentHash,proof.sha256);assert.equal(asset.publicUrl,proof.requestedURL);assert.equal(asset.r5Sequence,proof.sequence);}else assert.ok(!asset?.available,'NOT_UPLOADED_ASSET_PROMOTED');}
function currentR5ConsumerHTML(file,html){if(file==='index.html'){validateReleaseR5();html=releaseR5Predecessor(file,Buffer.from(html)).toString('utf8');}
 // Two exact R4 successors retain their own composition/redirect authority.
 // Validate actual R3 Home and its original Ask; historical R5 assertions below
 // receive only the immutable, byte-proven predecessor of these two paths.
 if((file==='index.html'||file==='explore/start/index.html')&&isConvergenceCurrent(file)){
  const row=readConvergenceRecord().paths.find(x=>x.path===file);assert.equal(proofSha(html),row.sha256,file==='index.html'?'R3_HOME_RUNTIME_DRIFT':'DECLARED_R5_ALIAS_BYTES_DRIFT');
  const home=fs.readFileSync('index.html','utf8');assertConvergenceHome(parseHTML(home).document);
  if(file==='explore/start/index.html'){assert.equal(convergenceRedirectTarget(file,'/#start'),'/#six-perspectives');assert.ok(html.includes('data-consolidation-target="/#six-perspectives"'),'R3_ALIAS_TARGET_DRIFT');}
  const homeRow=readConvergenceRecord().paths.find(x=>x.path==='index.html');return convergencePredecessor('index.html',homeRow.previousSHA256).toString('utf8');
 }

 if(file!=='explore/start/index.html')return html;
 assert.equal(proofSha(html),"734922e25637cec01a8ca19948bdc04fa6c1490766f2f8919927a25b4c8a69da",'DECLARED_R5_ALIAS_BYTES_DRIFT');const row=JSON.parse(fs.readFileSync("content/production-closure/live-customer-commercial-convergence/page-consolidation-r1/PHIOS-PAGE-CONSOLIDATION-R1-ROUTE-DECISIONS.json")).find(r=>r.route==='/explore/start/');assert.equal(proofSha(JSON.stringify(row)),"3fc1c25920cc32484b97d9bca665bcff6db1ae2c88f066303ed53b034a117bd5",'R5_ALIAS_DECISION_DRIFT');assert.equal(row.action,'MERGE_AND_SINGLE_HOP_REDIRECT');assert.equal(row.destination,'/#start');assert.ok(html.includes('data-consolidation-target="/#start"')&&html.includes('/assets/customer-ui/js/surfaces/page-consolidation-redirect.js'),'MISSING_DECLARED_ALIAS_OWNER');const target=fs.readFileSync('index.html','utf8');assert.ok(target.includes('id="start"'),'MISSING_R5_ALIAS_DESTINATION');return target;
}
assert.throws(()=>currentR5ConsumerHTML('explore/start/index.html',fs.readFileSync('explore/start/index.html','utf8')+' '),/DECLARED_R5_ALIAS_BYTES_DRIFT/);
assert.equal(currentR5ConsumerHTML('other/index.html','not an admitted alias'),'not an admitted alias');
// R3_HOME_TAMPER_NEGATIVE: exact approved bytes only, never arbitrary Home content.
assert.throws(()=>currentR5ConsumerHTML('index.html',fs.readFileSync('index.html','utf8')+' '),/R3_HOME_RUNTIME_DRIFT/);

if(process.argv.includes('--proof-portability-only')){console.log(JSON.stringify({scope:'PROOF_PORTABILITY_ONLY_NOT_FULL_R5',verifiedDeltas:delta.filter(x=>x.decoded).length,proofCacheIgnored:process.argv.includes('--proof-no-cache'),publicGETOrigin:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev',negativeCases:9,financialHistoricalBoundaryReconstructed:true,qaOutputPolicy:'STDOUT_ONLY_NO_SOURCE_MUTATION',fullR5Pass:false}));}else{
const guides=fs.readFileSync('assets/customer-ui/js/surfaces/visual-binding-r5-guides.js','utf8');assert.ok(guides.includes('hydrateCustomerAssets'));assert.ok(!guides.includes('fetch('),'SECOND_ASSET_OR_CUSTOMER_FETCH_OWNER');
for(const file of ['index.html','explore/start/index.html','reality/index.html','account/index.html','perspectives/profile/index.html']){const html=fs.readFileSync(file,'utf8');assert.equal(currentR5ConsumerHTML(file,html).split('src="/assets/customer-ui/js/surfaces/visual-binding-r5-guides.js"').length-1,1);const previous=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8',maxBuffer:4*1024*1024});assert.deepEqual(formInputs(html),formInputs(previous),'INPUT_CHANGED:'+file);}
const decoded=currentProofs.filter(x=>x.decoded).length,missing=currentProofs.length-decoded;
const result={state:'PASS_BOUNDED_CORRECTIONS_AND_VERIFIED_ASSETS',verifiedAssets:decoded,unverifiedAssets:missing,scope:'Three Hero identities and byte-verified explanatory assets; original inputs preserved; unverified assets not promoted; browser/private/full-site closure separate',providerCalls:0};console.log(JSON.stringify({...result,qaOutputPolicy:'STDOUT_ONLY_NO_SOURCE_MUTATION'}));console.log(result.state+' '+decoded+' verified / '+missing+' unverified');

}
