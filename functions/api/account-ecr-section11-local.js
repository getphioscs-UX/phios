import {personIdentity} from '../account/canonical-person-store.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {createContinuityD1Store} from '../personal-reading/continuity/continuity-persistence-d1.js';
import {createContinuityCase,updateContinuityCase,restoreContinuityCheckpoint} from '../customer-projection/ric-navigation-continuity.js';
import {consumeProfileEcrNavigationR2} from '../customer-projection/profile-ecr-navigation-r2.js';
import {selectEcrReflection,compareEcrReflection} from '../ecr-phi-card/ecr-user-reflection-r2.js';
import {ECR_PHI_CARD_DECK} from '../ecr-phi-card/ecr-card-runtime-authority.js';
import {ECR_V41_AUTHORITIES} from '../embodied-configuration/ecr-v41-authorities.generated.js';
import {isEcrHumanAdmitted} from '../embodied-configuration/ecr-semantic-composition-r2.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
const TYPE='ECR_SECTION11_R21_LOCAL',fail=(code,status=422)=>{throw Object.assign(Error(code),{code,status});};
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store'}});
const policy=ECR_V41_AUTHORITIES['content/embodied-configuration/v4-1/semantic-admission-r2/composition-policy.json'];
const factors=['gateBases','lineModifiers','planetaryDriverRoles','layerRoles'].flatMap(group=>policy[group].filter(isEcrHumanAdmitted).map(r=>({id:r.factorId,group,sourceRefs:r.sourceRefs,meaningRef:r.meaningRef})));
export async function onRequest(context){try{
 const url=new URL(context.request.url);if(context.env.PHIOS_ECR_R21_LOCAL!=='true'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))fail('SECTION11_LOCAL_ONLY',403);
 const owner=personIdentity(context).userId,db=context.env.RUNTIME_DB,store=createContinuityD1Store(db);
 if(context.request.method==='GET'&&!url.searchParams.get('key'))return json({factors,cards:ECR_PHI_CARD_DECK.cards.map(c=>({cardId:c.cardId,title:c.title})),productionAdmission:false});
 const load=async key=>{if(!/^R21-[a-f0-9-]{36}$/.test(key||''))fail('CASE_NOT_FOUND',404);const row=await db.prepare("SELECT a.artifact_id,a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE r.user_id=? AND a.artifact_type=? AND json_extract(a.payload,'$.key')=?").bind(owner,TYPE,key).first();if(!row)fail('CASE_NOT_FOUND',404);const record=JSON.parse(row.payload);if(record.revoked)fail('CASE_REVOKED',410);if(record.owner!==owner)fail('CASE_NOT_FOUND',404);return {row,record};};
 const sourceBinding=async comparison=>{const current=selectEcrReflection({cardIds:comparison.reflection.cards.map(c=>c.cardId),locale:comparison.reflection.locale,selectedConfigurationRefs:comparison.reflection.selectedConfigurationRefs});const binding={factorAuthorityVersion:policy.schemaVersion,factors:current.selectedConfigurationRefs.map(id=>factors.find(f=>f.id===id)),cards:current.cards};return {binding,digest:await sha256Stable(binding)};};
 const verify=async record=>{if((await sourceBinding(record.comparison)).digest!==record.sourceDigest)fail('INTERPRETATION_SOURCE_VERSION_CHANGED',409);const request=new Request(context.request.url,{method:'POST',headers:{origin:url.origin}});return consumeProfileEcrNavigationR2({...context,request},record.selection,record.question);};
 const view=async record=>({ok:true,key:record.key,revision:record.revision,caseId:record.case.case_id,question:record.question,selection:record.selection,observation:record.observation,comparison:record.comparison,sourceContext:await verify(record),checkpoint:restoreContinuityCheckpoint(record.case,{userId:owner,checkpointId:record.case.checkpoints.at(-1).id}),providerCalls:0,productionPersistence:false});
 if(context.request.method==='GET'){const {record}=await load(url.searchParams.get('key'));return json(await view(record));}
 if(context.request.method!=='POST')fail('METHOD_NOT_ALLOWED',405);requireSameOrigin(context.request);
 const raw=await context.request.text();if(raw.length>20000)fail('INPUT_TOO_LARGE',413);const b=JSON.parse(raw);
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['action','key','baseRevision','consent','retentionConsent','question','selection','factorRefs','cardIds','feedback','observation','counterexample','locale'].includes(k)))fail('INPUT_INVALID');
 if(b.consent!==true)fail('EXPLICIT_CONSENT_REQUIRED',403);
 const apply=(c,input)=>updateContinuityCase(c,{...input,expectedVersion:c.version,consent:true},{userId:owner});
 const update=async(row,previous,next)=>{const r=await db.prepare('UPDATE runtime_artifacts SET payload=?,updated_at=? WHERE artifact_id=? AND payload=?').bind(JSON.stringify(next),new Date().toISOString(),row.artifact_id,JSON.stringify(previous)).run();if(r.meta.changes!==1)fail('CASE_VERSION_CONFLICT',409);};
 if(b.action==='revoke'){const {row,record}=await load(b.key);if(b.baseRevision!==record.revision)fail('CASE_VERSION_CONFLICT',409);apply(record.case,{action:'revokeCheckpoint',checkpointId:record.case.checkpoints.at(-1).id});await update(row,record,{key:record.key,owner,revision:record.revision+1,revoked:true});return json({ok:true,revoked:true,newContextRecords:0});}
 if(!['save','edit'].includes(b.action)||b.retentionConsent!==true)fail('EXPLICIT_RETENTION_CONSENT_REQUIRED',403);
 if(typeof b.question!=='string'||!b.question.trim()||b.question.length>240||typeof b.observation!=='string'||!b.observation.trim()||b.observation.length>2000)fail('OBSERVATION_REQUIRED');
 if(!Array.isArray(b.factorRefs)||!b.factorRefs.length||b.factorRefs.length>4||b.factorRefs.some(id=>!factors.some(f=>f.id===id)))fail('ADMITTED_FACTOR_SELECTION_REQUIRED');
 const sourceContext=await consumeProfileEcrNavigationR2(context,b.selection,b.question);if(!sourceContext)fail('PROFILE_SELECTION_REQUIRED');
 const reflection=selectEcrReflection({cardIds:b.cardIds,locale:b.locale==='zh-Hans'?'zh-Hans':'en',selectedConfigurationRefs:b.factorRefs});
 const comparison=compareEcrReflection({reflection,feedback:b.feedback,counterexample:b.counterexample||'',observation:b.observation});
 let previous,row,c,key,revision=1;
 if(b.action==='edit'){({row,record:previous}=await load(b.key));if(b.baseRevision!==previous.revision)fail('CASE_VERSION_CONFLICT',409);c=previous.case;key=previous.key;revision=previous.revision+1;for(const r of c.records.filter(r=>r.validity==='ACTIVE'))c=apply(c,{action:'withdraw',recordId:r.record_id,reason:'Explicitly revised Section 11 selection'});c=apply(c,{action:'question',question:b.question,goal:'Review user-confirmed observations'});}
 else{key='R21-'+crypto.randomUUID();c=createContinuityCase({userId:owner,question:b.question,goal:'Review user-confirmed observations',locale:b.locale});}
 const add=(kind,content,extra={})=>{c=apply(c,{action:'record',kind,content,...extra});const r=c.records.at(-1);c=apply(c,{action:'confirm',recordId:r.record_id,reason:'User explicitly confirmed supplied observation / interpretation, not independent verification'});};
 add('INTERPRETATION','METHOD_DERIVED · '+b.factorRefs.join(', ')+' · '+reflection.cards.map(c=>c.title+': '+c.meaning).join('\n'));
 add('CONSTRAINT','USER_DECLARED_OBSERVATION · '+b.observation);
 if(b.counterexample)add('CONSTRAINT','USER_DECLARED_COUNTEREXAMPLE · '+b.counterexample);
 c=apply(c,{action:'checkpoint',recordIds:c.records.filter(r=>r.validity==='ACTIVE').map(r=>r.record_id)});
 const source=await sourceBinding(comparison);
 const record={key,owner,revision,revoked:false,question:b.question,selection:b.selection,observation:b.observation,comparison,sourceDigest:source.digest,sourceBindings:source.binding,case:c};
 if(previous)await update(row,previous,record);else await store.put({subjectRef:owner,type:TYPE,key,payload:record});
 return json(await view(record),b.action==='save'?201:200);
 }catch(e){return json({ok:false,code:e.code||e.message||'SECTION11_FAILED'},e.status||422);}}
