import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const dir='content/civilization-atlas/maintenance/visual-activation-60247ff';
const csv=read(dir+'/supplied-production-map.json');
const registry=read('content/civilization-atlas/visuals/civilization-visual-asset-registry-v2.json');
const previous=read('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v1.json');
const base=new URL(previous.assets[0].publicUrl).origin+'/';
const folders={TIMELINE_ANCHOR:'timeline',CASE_HERO:'cases',CASE_SECONDARY:'cases',WORLD_SNAPSHOT_ATMOSPHERE:'snapshots',COMPARISON_FAMILY:'comparison',TRAJECTORY_MOTIF:'trajectories',TRANSITION_WINDOW:'transitions',SCALE_SHIFT:'scale-shifts',LOSS_FAMILY:'loss',LOSS_TYPE_VIGNETTE:'loss',CIVILIZATION_INFRASTRUCTURE:'infrastructure',GEOGRAPHIC_BASE:'maps',HISTORICAL_FIGURE:'historical-figures',MODERN_FLAG:'flags'};
const rows=registry.assets.map(a=>({assetId:a.assetId,family:a.family,subjectId:a.subjectId,subjectTitle:a.subjectTitle,filename:csv.find(r=>r.assetId===a.assetId)?.filename||a.assetId+'.webp',suppliedCsv:csv.some(r=>r.assetId===a.assetId),candidateKey:previous.assets.find(r=>r.assetId===a.assetId)?.bucketKey||`images/civilization-atlas/${folders[a.family]}/${a.assetId}.webp`}));
for(const row of csv.filter(r=>!registry.assets.some(a=>a.assetId===r.assetId)))rows.push({assetId:row.assetId,family:row.family||'WORLD_RECONFIGURATION_SNAPSHOT',relatedBook:row['Related Book'],subjectTitle:{'zh-Hans':row.simpleVisualDescription,en:row.assetId},filename:row.filename||null,candidateKey:`images/civilization-atlas/reconfiguration/${row.filename||row.assetId+'.webp'}`,suppliedCsv:true,metadataIncomplete:!row.filename});
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{while(cursor<rows.length){
 const row=rows[cursor++];row.attemptedUrl=base+row.candidateKey;
 try{
  const response=await fetch(row.attemptedUrl,{signal:AbortSignal.timeout(30000)});row.httpStatus=response.status;row.contentType=response.headers.get('content-type');
  if(!response.ok){row.result='UNRESOLVED_OBJECT_PATH';continue;}
  const bytes=Buffer.from(await response.arrayBuffer());row.bytes=bytes.length;
  row.webpSignature=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  row.result=row.webpSignature&&row.contentType?.startsWith('image/')?'VERIFIED_WEBP':'INVALID_IMAGE_RESPONSE';
  if(row.result==='VERIFIED_WEBP'){row.sha256=crypto.createHash('sha256').update(bytes).digest('hex');row.bucketKey=row.candidateKey;row.publicUrl=row.attemptedUrl;}
 }catch(error){row.result='NETWORK_UNVERIFIED';row.error=error.message;}
}}));
const report={work:'BOOK-V-CIV-ATLAS-R1-M1',baselineHead:'60247ffa4d5fd61d1a76b0d0f328396947947bef',branch:'main',initialGitStatus:[],recordedAt:new Date().toISOString(),sourceCsv:'PHI-OS-CIVILIZATION-VISUAL-ASSET-PRODUCTION-LIST-436-WITH-COMMANDS.csv',csvRows:csv.length,currentRegisteredAssets:registry.assets.length,actualBucketTotal:null,folderEvidence:'User-provided R2 screenshot; candidate paths become bindings only after actual GET and WebP byte signature verification.',humanDecision:'PENDING_HUMAN_REVIEW',rows};
fs.writeFileSync(dir+'/r2-object-audit-v1.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({csvRows:csv.length,registered:registry.assets.length,verified:rows.filter(r=>r.result==='VERIFIED_WEBP').length,unresolved:rows.filter(r=>r.result!=='VERIFIED_WEBP').map(r=>({id:r.assetId,status:r.httpStatus,result:r.result}))},null,2));
