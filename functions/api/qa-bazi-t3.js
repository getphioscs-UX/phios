import {checkBaziShadowStage} from '../personal-reading/narrative/bazi-t3-shadow-stages.js';
import {withEditorialMeaningBrief,QUALITY_VERSION,validateEditorialQuality} from '../personal-reading/narrative/bazi-editorial-quality.js';
import editorialAcceptance from '../../config/reports/bazi-editorial-quality-acceptance.json';
import fixtures from '../personal-reading/narrative/bazi-t3-preview-packs.generated.json';
import registry from '../../content/ai-economics/providers/ai-provider-cost-registry-v1.json';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {composeBaziT3Section,verifyBaziT3BilingualParity} from '../personal-reading/narrative/bazi-t3-composition.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {COMPOSITION_VERSION} from '../personal-reading/narrative/bazi-editorial-contract.js';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer'};
export async function onRequest(context){
 const reply=(body,status=200)=>Response.json(body,{status,headers});
 const {request,env}=context;
 if(new URL(request.url).origin!=='https://qa.phios-github.pages.dev'||env.PHIOS_ENVIRONMENT!=='qa'||env.BAZI_T3_PREVIEW_SHADOW!=='enabled')return reply({ok:false},404);
 if(!normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity))return reply({ok:false,code:'ACCOUNT_REQUIRED'},401);
 if(request.method!=='POST')return reply({ok:false},405);
 try{
  requireSameOrigin(request);
  const reader=request.body?.getReader();if(!reader)return reply({ok:false},400);
  let raw='',size=0;const decoder=new TextDecoder();
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>256){await reader.cancel();return reply({ok:false},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
  const body=JSON.parse(raw);
  if(!body||Object.keys(body).some(k=>!['locale','sectionKey','profileId','action'].includes(k))||(body.action&&!['generate','parity','matrix-status'].includes(body.action)))return reply({ok:false},400);
  const originalPack=fixtures.packs[`${body.profileId||'BASELINE_NOW'}:${body.locale}:${body.sectionKey}`];if(!originalPack)return reply({ok:false},400);
  const pack=await withEditorialMeaningBrief(originalPack);
  if(!env.PRIVATE_REPORTS||!env.RUNTIME_DB)return reply({ok:false,code:'PREVIEW_STORAGE_UNAVAILABLE'},503);
  {
   const admission=await checkBaziShadowStage({profileId:body.profileId||'BASELINE_NOW',sectionKey:body.sectionKey,action:body.action,stagedProfiles:fixtures.stagedProfiles,passed:async(profileId,locale,sectionKey)=>{
    const source=fixtures.packs[profileId+':'+locale+':'+sectionKey];if(!source)return false;
    const p=await withEditorialMeaningBrief(source);
    const object=await env.PRIVATE_REPORTS.get('qa/bazi-t3/'+COMPOSITION_VERSION+'/'+p.canonicalEvidenceHash+'.json');if(!object)return false;
    const r=await object.json();if(r.status!=='PASS'||!r.snapshot)return false;
    return (await composeBaziT3Section({pack:p,snapshot:r.snapshot})).status==='PASS';
   },humanAccepted:async(profileId,locale,sectionKey)=>{
    const source=fixtures.packs[profileId+':'+locale+':'+sectionKey];if(!source)return false;
    const p=await withEditorialMeaningBrief(source),object=await env.PRIVATE_REPORTS.get(`qa/bazi-t3/${COMPOSITION_VERSION}/${p.canonicalEvidenceHash}.json`);
    const snapshot=object&&(await object.json()).snapshot;
    return Boolean(snapshot&&editorialAcceptance.version===QUALITY_VERSION&&editorialAcceptance.humanReviews.some(r=>r.profileId===profileId&&r.locale===locale&&r.sectionKey===sectionKey&&r.decision==='ACCEPT'&&r.reviewer&&r.reviewedAt&&r.snapshotDigest===snapshot.snapshotDigest&&r.briefDigest===p.sectionNarrativeBriefDigest));
   },parityAccepted:async(profileId,sectionKey)=>{
    const digests=[];
    for(const locale of ['en','zh-Hans']){const source=fixtures.packs[`${profileId}:${locale}:${sectionKey}`];if(!source)return false;const p=await withEditorialMeaningBrief(source),object=await env.PRIVATE_REPORTS.get(`qa/bazi-t3/${COMPOSITION_VERSION}/${p.canonicalEvidenceHash}.json`);const snapshot=object&&(await object.json()).snapshot;if(!snapshot)return false;digests.push(snapshot.snapshotDigest);}
    const object=await env.PRIVATE_REPORTS.get(`qa/bazi-t3/BILINGUAL_PARITY_V1/${await sha256Stable(digests)}.json`),record=object&&await object.json();
    if(!record||record.status!=='PASS'||record.englishSnapshotDigest!==digests[0]||record.chineseSnapshotDigest!==digests[1])return false;
    const seed={status:record.status,englishSnapshotDigest:record.englishSnapshotDigest,chineseSnapshotDigest:record.chineseSnapshotDigest,verifierVersion:record.verifierVersion,verdict:record.verdict};
    return record.artifactDigest===await sha256Stable(seed);
   }});
   if(!admission.allowed)return reply({ok:false,code:'STAGED_QUALITY_GATE',...admission},409);
   if(body.action==='matrix-status')return reply({ok:true,...admission});
  }
  let evidenceHash=pack.canonicalEvidenceHash,kind=COMPOSITION_VERSION,pair=null;
  if(body.action==='parity'){
   const snapshots=[];
   for(const locale of ['en','zh-Hans']){
    const source=fixtures.packs[`${body.profileId||'BASELINE_NOW'}:${locale}:${body.sectionKey}`],p=source&&await withEditorialMeaningBrief(source);
    const object=p&&await env.PRIVATE_REPORTS.get(`qa/bazi-t3/${COMPOSITION_VERSION}/${p.canonicalEvidenceHash}.json`);
    const record=object&&await object.json();
    if(record?.status!=='PASS'||!record.snapshot)return reply({ok:false,code:'BILINGUAL_ACCEPTED_PAIR_REQUIRED'},409);
    snapshots.push(record.snapshot);
   }
   pair={english:snapshots[0],chinese:snapshots[1]};
   evidenceHash=await sha256Stable(snapshots.map(s=>s.snapshotDigest));kind='BILINGUAL_PARITY_V1';
  }
  const id=`bazi-t3:${kind}:${evidenceHash}`,key=`qa/bazi-t3/${kind}/${evidenceHash}.json`;
  const saved=await env.PRIVATE_REPORTS.get(key);
  if(saved){
   const record=await saved.json();
   // Preserve the original immutable result, but expose current quality policy
   // when reopening it. Reassessment never spends another provider call.
   const editorialReassessment=record.snapshot?validateEditorialQuality(record.snapshot.finalNarrative,pack):null;
   return reply({ok:true,cacheHit:true,result:{...record,...(editorialReassessment?{editorialReassessment}:{})},objectKey:key});
  }
  const now=new Date().toISOString(),runtime='QA-BAZI-T3-SYNTHETIC-SHADOW-V1';
  await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtimes(runtime_id,status,current_stage,state,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(runtime,'active','shadow','{}',now,now).run();
  // Global idempotent reservation, not per account: at most one bounded run for
  // each fixed pack, even under concurrent or repeated requests. Partial-source
  // profiles rejected upstream have no callable pack.
  const reserved=await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,runtime,'BAZI_T3_SHADOW_V1','RUNNING',JSON.stringify({objectKey:key,evidenceHash}),now,now).run();
  if(Number(reserved.meta?.changes??reserved.changes)!==1)return reply({ok:false,code:'SHADOW_ALREADY_RESERVED'},409);
  const result=pair?await verifyBaziT3BilingualParity({...pair,registry,env,timeoutMs:240000}):await composeBaziT3Section({pack,registry,env,timeoutMs:240000});
  const evidence={...result,generatedAt:now,fixtureClass:fixtures.fixtureClass,liveProviderAttempt:!['PROVIDER_CREDENTIAL_NOT_CONFIGURED','NO_ADMITTED_PROVIDER_ROUTE','INSUFFICIENT_ADMITTED_INTERPRETATION','PARITY_PAIR_INVALID','PARITY_SNAPSHOT_INVALID','PARITY_TEMPORAL_MISMATCH','PARITY_PROVIDER_UNAVAILABLE'].includes(result.reason||result.internalOnly?.fallbackReason),productionActivated:false};
  await env.PRIVATE_REPORTS.put(key,JSON.stringify(evidence),{httpMetadata:{contentType:'application/json'}});
  await env.RUNTIME_DB.prepare('UPDATE runtime_artifacts SET stage=?,updated_at=? WHERE artifact_id=?').bind(result.status,new Date().toISOString(),id).run();
  return reply({ok:true,cacheHit:false,result:evidence,objectKey:key});
 }catch{return reply({ok:false,code:'SHADOW_UNAVAILABLE'},503);}
}
