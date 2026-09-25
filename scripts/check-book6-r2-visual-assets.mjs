import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const statusPath='content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json';
const bindingsPath='content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json';
const status=read(statusPath);
const bindings=read(bindingsPath);
const assets=status.assets||[];

assert.equal(status.expectedCoreAssets,23);
assert.equal(assets.length,23);
assert.equal(new Set(assets.map(a=>a.assetId)).size,23);
assert.equal(assets.filter(a=>a.kind==='BOOK_VISUAL').length,3);
assert.equal(assets.filter(a=>a.kind==='CANONICAL_BOOK_FIGURE').length,8);
assert.equal(assets.filter(a=>a.kind==='STATIC_ATLAS_BASE_VISUAL').length,12);
for(const a of assets){
 assert.ok(a.expectedR2Path, a.assetId+' must declare expectedR2Path');
 assert.ok(['PRESENT','MISSING','UNVERIFIED'].includes(a.status), a.assetId+' has invalid status');
}
const snapshot2026=assets.find(a=>a.assetId==='WORLD_RECONFIGURATION_SNAPSHOT_2026');
assert.ok(snapshot2026);
if(snapshot2026.status==='PRESENT'){
 const probe=snapshot2026.liveProbe;
 assert.equal(probe?.status,'PRESENT','2026 PRESENT requires its own live resolver evidence');
 assert.equal(probe?.httpStatus,200,'2026 PRESENT requires HTTP 200');
 assert.ok(String(probe?.contentType||'').toLowerCase().startsWith('image/webp'),'2026 PRESENT requires image/webp');
 assert.equal(probe?.webpSignature,true,'2026 PRESENT requires a RIFF/WEBP signature');
}else{
 assert.equal(snapshot2026.status,'MISSING','2026 may only be MISSING or live-probe PRESENT');
}

if(!process.argv.includes('--live')){
 const counts=Object.fromEntries(['PRESENT','MISSING','UNVERIFIED'].map(k=>[k,assets.filter(a=>a.status===k).length]));
 console.log('PASS: B6-WEB-E static 23-core-visual inventory contract',counts);
 process.exit(0);
}

const source=bindings.assets?.find(a=>a.publicUrl);
assert.ok(source?.publicUrl,'Existing Civilization visual resolver bindings must provide the public delivery origin');
const publicOrigin=new URL(source.publicUrl).origin;
const probe=async a=>{
 const url=publicOrigin+'/'+a.expectedR2Path.split('/').map(encodeURIComponent).join('/');
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{Accept:'image/webp,image/*;q=0.8,*/*;q=0.1'}});
  if(response.status===404) return {assetId:a.assetId,status:'MISSING',httpStatus:404,contentType:response.headers.get('content-type'),bytes:0};
  if(!response.ok) return {assetId:a.assetId,status:'UNVERIFIED',httpStatus:response.status,contentType:response.headers.get('content-type'),bytes:0};
  const bytes=Buffer.from(await response.arrayBuffer());
  const webp=bytes.length>=12&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  const contentType=response.headers.get('content-type')||'';
  return {assetId:a.assetId,status:webp&&contentType.toLowerCase().startsWith('image/webp')?'PRESENT':'UNVERIFIED',httpStatus:response.status,contentType,bytes:bytes.length,webpSignature:webp};
 }catch(error){
  return {assetId:a.assetId,status:'UNVERIFIED',httpStatus:null,contentType:null,bytes:0,error:error?.message||String(error)};
 }
};

let cursor=0;
const results=[];
await Promise.all(Array.from({length:6},async()=>{while(cursor<assets.length){const i=cursor++;results[i]=await probe(assets[i]);}}));
for(const row of results) console.log('B6_R2_PROBE '+JSON.stringify(row));
const summary=Object.fromEntries(['PRESENT','MISSING','UNVERIFIED'].map(k=>[k,results.filter(r=>r.status===k).length]));
console.log('B6_R2_SUMMARY '+JSON.stringify(summary));
const mismatches=results.filter((r,i)=>r.status!==assets[i].status).map((r,i)=>({assetId:r.assetId,recorded:assets.find(a=>a.assetId===r.assetId)?.status,live:r.status,httpStatus:r.httpStatus,contentType:r.contentType,bytes:r.bytes}));
if(mismatches.length){
 console.error('B6_R2_STATUS_UPDATE_REQUIRED '+JSON.stringify(mismatches));
 process.exitCode=1;
}else{
 console.log('PASS: live GET + image/webp + RIFF/WEBP verification matches the recorded 23-core-visual status.');
}
