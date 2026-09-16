import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const oldPath='content/web-production/registries/client-visual-asset-registry-v1.7.json';
const nextPath='content/web-production/registries/client-visual-asset-registry-v1.8.json';
const pointerPath='content/web-production/registries/current-client-visual-registry.json';
const evidencePath='docs/public-index-successor/pis-r1-41-remote-evidence-v1.json';
const keys=read('docs/assets/r2-public/non-atlas-usage-resolution-v1.json').items.filter(x=>x.status==='REQUIRES_PAGE_FIT_REVIEW').map(x=>x.key);
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';
const results=[];
// No credentials or storage mutation: verify exact public objects before activation.
for(let start=0;start<keys.length;start+=5){
 const batch=await Promise.all(keys.slice(start,start+5).map(async key=>{
  const url=base+'/'+key.split('/').map(encodeURIComponent).join('/');
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`${response.status}: ${key}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  const svg=key.endsWith('.svg');
  if(svg?!bytes.toString().includes('<svg'):!(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'))throw Error('Unexpected image bytes: '+key);
  return {key,url,status:response.status,bytes:bytes.length,sha256:sha(bytes),contentType:response.headers.get('content-type'),verifiedAt:new Date().toISOString()};
 }));results.push(...batch);
}
fs.writeFileSync(evidencePath,JSON.stringify({method:'PUBLIC_GET_ACTUAL_BYTES',results},null,2)+'\n');
const registry=read(oldPath);
registry.schemaVersion='1.8.0';registry.status='PIS_R1_VERIFIED_VISUAL_PRESENTATION_SUCCESSOR';registry.repositoryTargetPath=nextPath;
registry.pisSuccessor={predecessor:oldPath,sha256:sha(fs.readFileSync(oldPath)),evidence:evidencePath,originalEntriesUnchanged:true,ownerImageAcceptance:'ACCEPTED_BY_EXPLICIT_USER_INSTRUCTION',productionPageAcceptance:false};
for(const [i,r] of results.entries()){
 const svg=r.key.endsWith('.svg');const code=`PIS-${String(i+1).padStart(3,'0')}`;
 const type=svg?'ICON':r.key.includes('/hero/')?'HERO':r.key.includes('/thesis/')?'FIGURE':'ILLUSTRATION';
 registry.assets.push({assetCode:code,sequence:code,assetType:type,family:type,title:r.key.split('/').at(-1),semanticPurpose:'Public editorial illustration; not a new knowledge claim.',productionSpec:{productionFormat:svg?'SVG':'WEBP',embeddedTextPolicy:r.key.includes('/thesis/')?'LOCALE_SPECIFIC_FIGURE':'NO_LONG_COPY'},r2:{bucket:'phios-public-assets',objectKey:r.key,remoteVerified:true,ownerReportedUploaded:true,requestedURL:r.url,sha256:r.sha256,verifiedAt:r.verifiedAt},humanReview:{required:false,status:'OWNER_ACCEPTED'},localePolicy:/zh-hans/.test(r.key)?'ZH_HANS':/-en-/.test(r.key)?'EN':'NEUTRAL',canonicalState:'OWNER_ACCEPTED_REMOTE_GET_VERIFIED'});
}
const updateSummary=registry=>{registry.registry='PHI-OS-CLIENT-VISUAL-ASSET-REGISTRY-v1.8';registry.successorOf='content/web-production/registries/client-visual-asset-registry-v1.7.json';for(const a of registry.assets.slice(152))a.batch='PIS-R1';registry.summary={...registry.summary,assetCount:registry.assets.length,byType:registry.assets.reduce((r,a)=>(r[a.assetType]=(r[a.assetType]||0)+1,r),{}),byBatch:registry.assets.reduce((r,a)=>(r[a.batch]=(r[a.batch]||0)+1,r),{}),registryRevision:'1.8.0',canonicalHeroCount:registry.assets.filter(a=>a.assetType==='HERO').length,canonicalFigureCount:registry.assets.filter(a=>a.assetType==='FIGURE').length};registry.summary.canonicalHeroFigureTotal=registry.summary.canonicalHeroCount+registry.summary.canonicalFigureCount;};updateSummary(registry);
fs.writeFileSync(nextPath,JSON.stringify(registry,null,2)+'\n');
const pointer=read(pointerPath);pointer.currentRegistryPath='/'+nextPath;fs.writeFileSync(pointerPath,JSON.stringify(pointer,null,2)+'\n');
console.log(`PIS: ${results.length} exact public image objects verified; preserved all predecessor entries.`);
