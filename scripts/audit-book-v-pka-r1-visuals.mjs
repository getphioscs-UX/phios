import fs from 'node:fs';
import {resolveAtlasVisualById,ATLAS_VISUAL_BINDINGS_PATH} from '../assets/js/pages/civilization-atlas/atlas-static-visual.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const registryPath='content/civilization-atlas/visuals/civilization-visual-asset-registry-v2.json';
const bindingPath=ATLAS_VISUAL_BINDINGS_PATH.slice(1);
const registry=read(registryPath),bindings=read(bindingPath);
const manifest=read('content/knowledge/public/successors/book5-publication-v1/visual-article-release.json');
const articles=manifest.records.map(r=>read('.'+r.path));
const byId=new Map(),byKey=new Map();
for(const b of bindings.assets){byId.set(b.assetId,[...(byId.get(b.assetId)||[]),b]);byKey.set(b.bucketKey,[...(byKey.get(b.bucketKey)||[]),b.assetId]);}
// Preserve the historical registry while including its already accepted delivery successors.
const registered=[...registry.assets,...bindings.assets.filter(b=>!registry.assets.some(a=>a.assetId===b.assetId))];
const records=registered.map(a=>{
 const rows=byId.get(a.assetId)||[],bound=rows[0];
 const resolved=Boolean(resolveAtlasVisualById(bindings,a.assetId));
 const usage=articles.filter(r=>r.visualAssets.some(v=>v.assetCode===a.assetId)).map(r=>r.publicHref+'?locale='+r.locale);
 return {assetId:a.assetId,filename:(bound?.bucketKey||a.bucketKey)?.split('/').at(-1)||null,family:a.family,subjectId:a.subjectId,relatedBook:bound?.relatedBook||a.relatedBook||'BOOK-5',r2Ref:bound?.bucketKey||null,publicResolver:'resolveUnifiedPublicVisual → resolveAtlasVisualById',usage,classification:rows.length>1||bound&&byKey.get(bound.bucketKey).length>1?'DUPLICATE_MAPPING':resolved?'BOUND':bound?'UNRESOLVED':'MISSING_MAPPING',bindingIssue:resolved?null:'UNRESOLVED_ASSET_BINDING',publicationUse:usage.length?'ARTICLE_BOUND':resolved?'AVAILABLE_FOR_CONTEXTUAL_SELECTION':'STRUCTURED_FALLBACK',historicalAuthority:false};
});
const orphanReferences=bindings.assets.filter(b=>!registry.assets.some(a=>a.assetId===b.assetId)).map(b=>({assetId:b.assetId,classification:'ORPHAN_REFERENCE'}));
const representatives=[...new Set(records.map(r=>r.family))].map(family=>{
 const row=records.find(r=>r.family===family&&r.classification==='BOUND')||records.find(r=>r.family===family);
 return {family,assetId:row.assetId,binding:row.classification,reachable:'NOT_RUN',fallback:'STRUCTURED_HTML_SVG'};
});
if(process.argv.includes('--remote'))for(const row of representatives){
 if(row.binding!=='BOUND'){row.reachable='UNRESOLVED_ASSET_BINDING';continue;}
 const binding=bindings.assets.find(a=>a.assetId===row.assetId);
 try{const response=await fetch(binding.publicUrl,{method:'HEAD',signal:AbortSignal.timeout(15000)});row.httpStatus=response.status;row.contentType=response.headers.get('content-type');row.reachable=response.ok&&row.contentType?.startsWith('image/')?'PASS':'FAIL';}catch(error){row.reachable='UNVERIFIED_NETWORK_ERROR';row.error=error.message;}
}
// Current eight-volume cover/branding ownership supersedes historical numbered book artwork.
const publicationBindingPath='content/web-production/registries/wpr-eight-volume-r2-visual-binding-v1.json';
const publicationBindings=read(publicationBindingPath),publicationRegistry=read('.'+publicationBindings.assetRegistry);
const publicationIds=[publicationBindings.coverByBook['BOOK-5'],publicationBindings.brandingByBook['BOOK-5']];
const additionalPublicationAssets=publicationIds.map(assetId=>{
 const a=publicationRegistry.assets.find(row=>row.assetId===assetId);
 return {assetId,family:a?.type,filename:a?.objectKey?.split('/').at(-1),r2Ref:a?.objectKey,classification:a?.available&&a.publicUrl?'BOUND':'UNRESOLVED',reachable:'NOT_RUN',usage:['/books/reality-differentiation/'],authority:publicationBindings.assetRegistry};
});
if(process.argv.includes('--remote'))for(const row of additionalPublicationAssets){
 const a=publicationRegistry.assets.find(item=>item.assetId===row.assetId);
 if(row.classification!=='BOUND'){row.reachable='UNRESOLVED_ASSET_BINDING';continue;}
 try{const response=await fetch(a.publicUrl,{method:'HEAD',signal:AbortSignal.timeout(15000)});row.httpStatus=response.status;row.contentType=response.headers.get('content-type');row.reachable=response.ok&&row.contentType?.startsWith('image/')?'PASS':'FAIL';}catch(error){row.reachable='UNVERIFIED_NETWORK_ERROR';row.error=error.message;}
}
const articleVisualReachability=records.filter(r=>r.usage.length).map(r=>({assetId:r.assetId,reachable:'NOT_RUN'}));
if(process.argv.includes('--remote'))for(let i=0;i<articleVisualReachability.length;i+=4){
 await Promise.all(articleVisualReachability.slice(i,i+4).map(async row=>{
  const binding=bindings.assets.find(a=>a.assetId===row.assetId);
  if(!binding){row.reachable='UNRESOLVED_ASSET_BINDING';return;}
  try{const response=await fetch(binding.publicUrl,{method:'HEAD',signal:AbortSignal.timeout(15000)});row.httpStatus=response.status;row.contentType=response.headers.get('content-type');row.reachable=response.ok&&row.contentType?.startsWith('image/')?'PASS':'FAIL';}catch(error){row.reachable='UNVERIFIED_NETWORK_ERROR';row.error=error.message;}
 }));
}
const report={work:'BOOK-V-PKA-R1-W6-W7',registryPath,bindingPath,registryAssetCount:records.length,approvedBindingCount:bindings.assets.length,actualR2BucketCount:null,productionCsvRole:'SUPPLEMENTAL_NOT_TOTAL_AUTHORITY',scope:'Repository registered assets; not a bucket listing. Missing mappings do not mean missing R2 objects.',recordedAt:new Date().toISOString(),records,orphanReferences,representatives,publicationBindingPath,additionalPublicationAssets,articleVisualReachability,historicalNumberingBoundary:'Legacy Book V Reality Navigation artwork is not rebound to current Book V. Current eight-volume publication bindings own cover and branding.',imageGenerationIntroduced:false};
fs.writeFileSync('content/books/book-5/maintenance/visual-reconciliation-v1.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({registered:records.length,bound:records.filter(r=>r.classification==='BOUND').length,unresolved:records.filter(r=>r.bindingIssue).length,representatives},null,2));
if(process.argv.includes('--remote')){
 console.log(`Article objects reachable: ${articleVisualReachability.filter(r=>r.reachable==='PASS').length}/${articleVisualReachability.length}`);
 if([...representatives,...additionalPublicationAssets,...articleVisualReachability].some(r=>r.reachable==='FAIL'||r.reachable==='UNVERIFIED_NETWORK_ERROR'))process.exitCode=1;
}
