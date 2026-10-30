// R611A local freshness gate. Reuses the accepted purchase and editorial owners.
// No product admission, entitlement mutation or remote write.
import fs from 'node:fs';import {createHash}from'node:crypto';
import {selectHdFrontMatterForLocalReview}from'../r611/front-matter-binding.mjs';
import {editorialAsset}from'../../../../../functions/canonical-presentation-runtime/report-editorial-registry.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function selectCurrentHdFrontMatter({evidence,entitlement,requested,readBytes=fs.readFileSync}={}){
 if(!evidence||evidence.auth?.tokenValueRecorded!==false||!evidence.auth?.present)throw Error('CURRENT_AUTHENTICATED_EVIDENCE_REQUIRED');
 const expected=[];
 for(const language of ['zh-Hans','en','bilingual'])for(let n=1;n<=5;n++)expected.push({language,pageId:'P0'+n,registered:editorialAsset('HD',n,language)});
 if(evidence.rows?.length!==15)throw Error('EXACT_15_CURRENT_OBJECTS_REQUIRED');
 const rows=expected.map(({language,pageId,registered})=>{
  const matches=evidence.rows.filter(r=>r.language===language&&r.pageId===pageId);
  if(matches.length!==1)throw Error('DUPLICATE_OR_MISSING_CURRENT_OBJECT');
  const a=matches[0];
  if(a.objectKey!==registered.object_key||a.registryAssetId!==registered.asset_code)throw Error('CURRENT_REGISTRY_BINDING_MISMATCH');
  if(a.readHTTP!==200||a.status!=='CURRENT_BYTES_DECODED')throw Error('CURRENT_OBJECT_READ_BLOCKED:'+language+':'+pageId);
  if(a.mime?.split(';')[0]!=='image/webp'||!Number.isInteger(a.width)||!Number.isInteger(a.height)||Math.min(a.width,a.height)<=0||!/^[a-f0-9]{64}$/.test(a.sha256)||!/^[a-f0-9]{64}$/.test(a.pixelSHA256))throw Error('CURRENT_DECODE_IDENTITY_REQUIRED');
  if(a.file!=='.tmp/hd-r611a/assets/'+a.sha256+'.webp')throw Error('CONTENT_ADDRESSED_CACHE_REQUIRED');
  const bytes=readBytes(a.file);
  if(bytes.length!==a.bytes||sha(bytes)!==a.sha256)throw Error('CURRENT_CACHE_BYTES_DRIFT');
  if(a.visualRoleReview?.status!=='MATCHES_ROLE'||a.visualRoleReview?.language!==language||a.visualRoleReview?.pageId!==pageId)throw Error('VISUAL_ROLE_REVIEW_REQUIRED');
  return {...a,verification:'LOCAL_BYTES_DECODED_EXACT_HASH',approval:'OWNER_SELECTED_EXACT_PATH_R611_LOCAL_CANDIDATE',freshnessScope:'R611A_CURRENT_AUTHENTICATED_BYTES_AND_EXPLICIT_VISUAL_REVIEW'};
 });
 if(new Set(rows.filter(r=>r.pageId==='P01').map(r=>r.pixelSHA256)).size!==3)throw Error('COVER_LANGUAGE_DIFFERENTIATION_REQUIRED');
 return selectHdFrontMatterForLocalReview({entitlement,requested,bindings:{rows},localReview:true});
}
