import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n')};
const selectionPath='content/product-visual-platform-r1/static-assets/pvp-r1-vis-w29-static-production-asset-selection-v1.json';
const registryPath='content/product-visual-platform-r1/static-assets/pvp-r1-vis-w30-static-production-asset-registry-v1.json';
const evidencePath='content/product-visual-platform-r1/static-assets/evidence/pvp-r1-vis-w31-remote-verification-v1.json';
const acceptancePath='content/product-visual-platform-r1/acceptance/successors/phase12/pvp-r1-vis-w31-remote-verification-acceptance-v1.json';
const freezePath='content/product-visual-platform-r1/freeze/pvp-r1-vis-static-assets-w29-w31-phase12-freeze-v1.json';
const reconciliationPath='content/integrated-master-work/phase12/p12-current-reconciliation-v1.json';
const selection=read(selectionPath);const registry=read(registryPath);const rec=read(reconciliationPath);
const base=String(process.env.PHIOS_PUBLIC_ASSET_BASE_URL||registry.r2.knownPublicBaseUrl||'').replace(/\/$/,'');
assert.match(base,/^https:\/\//,'PHIOS_PUBLIC_ASSET_BASE_URL must be an HTTPS base URL');
const expected=(asset)=>String(asset.contentType||'').toLowerCase();
async function probe(asset){
  const url=`${base}/${asset.objectKey}`;
  let response;
  try{
    response=await fetch(url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(15000)});
    if([403,405].includes(response.status))response=await fetch(url,{method:'GET',headers:{Range:'bytes=0-0'},redirect:'follow',signal:AbortSignal.timeout(15000)});
    const contentType=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    const want=expected(asset);
    const typeOk=want?contentType===want:(contentType.startsWith('image/'));
    return {assetId:asset.assetId,objectKey:asset.objectKey,url,httpStatus:response.status,contentType,expectedContentType:want,ok:response.status===200&&typeOk,error:null};
  }catch(error){
    return {assetId:asset.assetId,objectKey:asset.objectKey,url,httpStatus:0,contentType:null,expectedContentType:expected(asset),ok:false,error:error?.message||String(error)};
  }
}
const results=[];for(const asset of selection.selectedAssets)results.push(await probe(asset));
const allPassed=results.length===selection.selectedAssets.length&&results.every(x=>x.ok===true);
const evidence={schemaVersion:'PHI-OS-PVP-R1-VIS-W31-REMOTE-VERIFICATION-EVIDENCE-v1.0.0',work:'PVP-R1-VIS-W31',baselineCommit:selection.baselineCommit,verifiedAt:new Date().toISOString(),baseUrl:base,status:allPassed?'REMOTE_VERIFIED_ALL_SELECTED':'REMOTE_VERIFICATION_FAILED',selectedCount:selection.selectedAssets.length,verifiedCount:results.filter(x=>x.ok).length,results};
write(evidencePath,evidence);
if(!allPassed){
  console.error(`✗ PVP W31 remote verification failed: ${evidence.verifiedCount}/${evidence.selectedCount} verified.`);
  for(const x of results.filter(x=>!x.ok))console.error(`  ${x.assetId}: ${x.httpStatus||0} ${x.contentType||'-'} ${x.error||''} ${x.url}`);
  process.exit(1);
}
const acceptance={schemaVersion:'PHI-OS-PVP-R1-VIS-W31-ACCEPTANCE-v1.0.0',work:'PVP-R1-VIS-W31',baselineCommit:selection.baselineCommit,status:'MACHINE_ACCEPTED_REMOTE_VERIFICATION',verifiedAt:evidence.verifiedAt,selectedCount:evidence.selectedCount,verifiedCount:evidence.verifiedCount,evidenceRef:evidencePath,checks:{httpsReachable:true,http200:true,contentTypeMatch:true,exactObjectKeys:true,allSelectedAssetsVerified:true},phase12Frozen:true,phase13Authorized:true};
write(acceptancePath,acceptance);
const freeze={schemaVersion:'PHI-OS-PVP-R1-VIS-PHASE12-FREEZE-v1.0.0',work:'PHASE12_PVP_R1_VIS_W29_W31_STATIC_PRODUCTION_ASSETS',baselineCommit:selection.baselineCommit,status:'PVP_R1_VIS_STATIC_ASSETS_W29_W31_PHASE12_FROZEN',frozenAt:evidence.verifiedAt,selectionRef:selectionPath,registryRef:registryPath,evidenceRef:evidencePath,acceptanceRef:acceptancePath,frozenExit:{w29Selected:true,w30RegistryBound:true,w31RemoteVerified:true,selectedAssetCount:evidence.selectedCount,phase13Authorized:true},preservedBoundaries:{staticBudgetMax12:true,upstreamAuthorityPreserved:true,unverifiedAssetActivated:false,phase13ExecutedByThisFreeze:false},nextWork:'PHASE13_PVP_R1_VIS_W32_W37_ACCEPTANCE'};
write(freezePath,freeze);
rec.status='W29_W31_COMPLETE_PHASE12_FROZEN';rec.w31='MACHINE_ACCEPTED_REMOTE_VERIFICATION';rec.phase12Frozen=true;rec.phase13Authorized=true;rec.w31EvidenceRef=evidencePath;rec.phase12FreezeRef=freezePath;write(reconciliationPath,rec);
console.log(`✓ PVP W31 passed: ${evidence.verifiedCount}/${evidence.selectedCount} selected static assets remotely verified; Phase 12 frozen and Phase 13 authorized.`);
