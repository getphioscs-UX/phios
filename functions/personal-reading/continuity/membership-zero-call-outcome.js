import {personIdentity} from '../../account/canonical-person-store.js';
import {activeContinuitySubscription} from './continuity-quota-d1.js';
import {digest} from '../../account/oidc-auth.js';
const capabilities=new WeakSet();
export function createZeroCallOutcomeCapability(env){
 if(env.PHIOS_ENVIRONMENT!=='local'||env.PHIOS_ISOLATED_OPERATOR!==true)throw Error('ZERO_OUTCOME_LOCAL_CANDIDATE_ONLY');const c=Object.freeze({});capabilities.add(c);return c;
}
export async function saveZeroCallOutcome(context,{taskId,pack,retrievalErrors=[]},{capability}){
 if(!capabilities.has(capability)||context.env.PHIOS_ENVIRONMENT!=='local'||context.env.PHIOS_ISOLATED_OPERATOR!==true)throw Error('ZERO_OUTCOME_NOT_AUTHORIZED');
 const owner=personIdentity(context).userId;await activeContinuitySubscription(context.env,owner);
 if(!taskId?.startsWith('ZERO-')||!pack?.packDigest||pack.sources?.length!==0||retrievalErrors.length||!['zh-Hans','en'].includes(pack.locale))throw Error('ZERO_OUTCOME_REQUIRES_SUCCESSFUL_EMPTY_RETRIEVAL');
 const db=context.env.RUNTIME_DB,requestDigest=await digest(JSON.stringify({question:pack.question,locale:pack.locale,packDigest:pack.packDigest})),answer={locale:pack.locale,answer:pack.locale==='en'?'No admitted source was found that supports an answer to this question.':'尚未找到能够支持回答这个问题的获准来源。',answerCompleteness:'SOURCE_INSUFFICIENT',reasonCode:'NO_ADMITTED_RELEVANT_SOURCE',supportMap:[],sourceBinding:{packDigest:pack.packDigest,bindings:[]},providerCalls:0};
 if(await db.prepare('SELECT task_id FROM continuity_ask_tasks WHERE task_id=?').bind(taskId).first())throw Error('TASK_IDENTITY_CONFLICT');
 await db.prepare("INSERT OR IGNORE INTO continuity_ask_zero_call_outcomes(task_id,owner_account_id,request_digest,context_digest,answer_completeness,reason_code,answer_json,created_at) VALUES(?,?,?,?,'SOURCE_INSUFFICIENT','NO_ADMITTED_RELEVANT_SOURCE',?,?)").bind(taskId,owner,requestDigest,pack.packDigest,JSON.stringify(answer),new Date().toISOString()).run();
 const row=await db.prepare('SELECT * FROM continuity_ask_zero_call_outcomes WHERE task_id=? AND owner_account_id=?').bind(taskId,owner).first();if(!row||row.request_digest!==requestDigest||row.context_digest!==pack.packDigest)throw Error('ZERO_OUTCOME_IDENTITY_CONFLICT');
 return {executionState:'COMPLETE',answerCompleteness:'SOURCE_INSUFFICIENT',taskId,answer:JSON.parse(row.answer_json),providerCalls:0,customerChargeMicroUSD:0};
}
export async function readZeroCallOutcome(env,{ownerAccountId,taskId}){
 if(!taskId?.startsWith('ZERO-'))return null;
 let row;try{row=await env.RUNTIME_DB.prepare('SELECT * FROM continuity_ask_zero_call_outcomes WHERE task_id=? AND owner_account_id=?').bind(taskId,ownerAccountId).first();}catch(error){if(/no such table.*continuity_ask_zero_call_outcomes/i.test(error.message))return null;throw error;}
 return row?{...row,state:'COMPLETE',reserved_micro_usd:0,customer_charge_micro_usd:0,completed_at:row.created_at}:null;
}
