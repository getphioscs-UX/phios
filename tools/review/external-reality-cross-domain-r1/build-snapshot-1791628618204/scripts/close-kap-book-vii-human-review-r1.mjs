import fs from 'node:fs';
import crypto from 'node:crypto';
const root='content/knowledge/book-vii';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const figurePath=`${root}/registries/book-vii-observation-science-figure-registry-v1.json`;
const assetPath=`${root}/registries/book-vii-observation-science-r2-asset-registry-v1.json`;
const fixturePath=`${root}/fixtures/acceptance-corpus-v1.json`;
const successorPath='content/knowledge/answer-projection/reconciliation/kap-book-vii-observation-science-successor-v1.json';
const baselinePath=`${root}/evidence/targeted-closure-baseline-v1.json`;
const targets=[figurePath,assetPath,fixturePath,'scripts/build-kap-book-vii-r1.mjs','scripts/check-kap-book-vii-observation-science-successor.mjs'];
if(!fs.existsSync(baselinePath))write(baselinePath,{predecessorSuccessorSha256:sha(successorPath),fullPrivateSource:read(assetPath).assets.find(a=>a.assetClass==='FULL_PRIVATE_SOURCE'),files:targets.map(path=>({path,sha256:sha(path)}))});
const baseline=read(baselinePath);
const configured=read('content/web-production/registries/wpr-eight-volume-r2-public-assets-v1.json');
const bucket=configured.bucket,base=configured.publicBaseUrl;
if(bucket!=='phios-public-assets')throw Error('CONFIGURED_BUCKET_MISMATCH');
const candidates=[...Array.from({length:50},(_,i)=>({assetId:'BOOK-7-PUBLIC-PREVIEW-50P',page:i+1,objectKey:`books/previews/book-7/page-${String(i+1).padStart(3,'0')}.webp`})),...Array.from({length:9},(_,i)=>({assetId:`FIG-14${String.fromCharCode(65+i)}`,objectKey:`images/figures/books/book-7/14${String.fromCharCode(65+i)}.webp`}))];
const verification=[];
for(let offset=0;offset<candidates.length;offset+=6) {
 await Promise.all(candidates.slice(offset,offset+6).map(async candidate=>{
  const url=`${base}/${candidate.objectKey}`;
  try {
   const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
   if(!response.ok){verification.push({...candidate,status:'PENDING_R2_OBJECT_IDENTITY',httpStatus:response.status});return;}
   const bytes=Buffer.from(await response.arrayBuffer());
   const valid=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
   verification.push({...candidate,bucket,status:valid?'BOUND':'PENDING_R2_OBJECT_IDENTITY',httpStatus:response.status,contentType:response.headers.get('content-type'),...(valid?{byteLength:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}:{})});
  } catch(error){verification.push({...candidate,status:'PENDING_R2_OBJECT_IDENTITY',error:error.message});}
 }));
 console.log(`Verified ${Math.min(offset+6,candidates.length)}/${candidates.length} existing object paths; no upload.`);
}
verification.sort((a,b)=>a.objectKey.localeCompare(b.objectKey));
write(`${root}/evidence/r2-targeted-object-verification-v1.json`,{method:'USER_SCREENSHOT_PREFIX_AND_FILENAMES_CONFIGURED_PUBLIC_BASE_READ_ONLY_GET_WEBP_HEADER_SHA256',configuredRegistry:'content/web-production/registries/wpr-eight-volume-r2-public-assets-v1.json',providerInvoked:false,uploadPerformed:false,unsupportedObjectListAttempted:false,records:verification});
const figures=read(figurePath);
for(const figure of figures.figures) {
 const verified=verification.find(v=>v.assetId===figure.figureId&&v.status==='BOUND');
 if(verified)Object.assign(figure,{r2BindingStatus:'BOUND',bucket,objectKey:verified.objectKey,sha256:verified.sha256});
 if(figure.figureId==='FIG-14H')Object.assign(figure,{semanticPurpose:'已知／重构／投影／争议／未知',primarySectionCode:'14.96',primarySectionTitleZhHans:'我们知道到哪里',primaryNodeCode:'KN-B7-14-096',supportingSectionCodes:Array.from({length:11},(_,i)=>`14.${85+i}`)});
}
write(figurePath,figures);
const assets=read(assetPath);
for(const asset of assets.assets) {
 if(asset.assetClass==='FULL_PRIVATE_SOURCE')continue;
 if(asset.assetClass==='PUBLIC_PREVIEW_50P') {
  const pages=verification.filter(v=>v.assetId===asset.assetId);
  const complete=pages.length===50&&pages.every(p=>p.status==='BOUND');
  asset.bindingStatus=complete?'BOUND':'PENDING_R2_OBJECT_IDENTITY';
  asset.pages=pages.filter(p=>p.status==='BOUND').map(p=>({pageNumber:p.page,objectKey:p.objectKey,sha256:p.sha256,byteLength:p.byteLength})).sort((a,b)=>a.pageNumber-b.pageNumber);
  asset.verifiedPageCount=asset.pages.length;
  if(complete){asset.bucket=bucket;asset.objectPrefix='books/previews/book-7/';asset.representation='50_EXISTING_WEBP_PAGE_OBJECTS';}
 }else {
  const verified=verification.find(v=>v.assetId===asset.assetId&&v.status==='BOUND');
  if(verified)Object.assign(asset,{bindingStatus:'BOUND',bucket,objectKey:verified.objectKey,sha256:verified.sha256});
 }
}
assets.bindingStatus=assets.assets.every(a=>a.bindingStatus==='BOUND')?'BOUND':'PENDING_R2_OBJECT_IDENTITY';
assets.discovery.method='REPOSITORY_CONFIG_USER_SCREENSHOT_IDENTITIES_AND_READ_ONLY_OBJECT_VERIFICATION';
if(JSON.stringify(assets.assets.find(a=>a.assetClass==='FULL_PRIVATE_SOURCE'))!==JSON.stringify(baseline.fullPrivateSource))throw Error('FULL_PRIVATE_SOURCE_MUST_REMAIN_UNCHANGED');
write(assetPath,assets);
const fixtures=read(fixturePath),figureCase=fixtures.cases.find(c=>c.id==='FIGURE');
Object.assign(figureCase,{sections:[96],supportingSections:Array.from({length:11},(_,i)=>85+i),text:'FIG 14H 表达已知／重构／投影／争议／未知的知识状态边界。主要绑定 14.96《我们知道到哪里》，支持范围为 14.85–14.95；图像不是正文或 OCR 权威。'});
write(fixturePath,fixtures);
const successor=read(successorPath);
successor.r2BindingStatus=assets.bindingStatus;
successor.r2AssetStatus={fullPrivateSource:'BOUND',preview:assets.assets.find(a=>a.assetClass==='PUBLIC_PREVIEW_50P').bindingStatus,figures:figures.figures.every(f=>f.r2BindingStatus==='BOUND')?'BOUND':'PENDING_R2_OBJECT_IDENTITY'};
successor.targetedHumanReviewClosure={status:'READY_FOR_HUMAN_REVIEW',predecessorSuccessorSha256:baseline.predecessorSuccessorSha256,figure14HPrimary:'14.96',figure14HSupporting:'14.85–14.95',pendingAssets:assets.assets.filter(a=>a.bindingStatus!=='BOUND').map(a=>a.assetId),files:baseline.files.map(e=>({path:e.path,predecessorSha256:e.sha256,currentSha256:sha(e.path)})),physicalVerification:{path:`${root}/evidence/r2-targeted-object-verification-v1.json`,sha256:sha(`${root}/evidence/r2-targeted-object-verification-v1.json`)},publicationPromoted:false,humanAccepted:false};
write(successorPath,successor);
console.log(JSON.stringify({status:'READY_FOR_HUMAN_REVIEW',bindingStatus:assets.bindingStatus,pendingAssets:successor.targetedHumanReviewClosure.pendingAssets,figure14HPrimary:'14.96'}));
