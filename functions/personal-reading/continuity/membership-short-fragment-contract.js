import {digest} from '../../account/oidc-auth.js';
import {createMembershipFragmentCatalog} from './membership-fragment-contract.js';
import {verifiedArgumentCoverage} from './membership-source-coverage.js';

// Successor candidate: immutable pack-local IDs. Legacy experiment stays intact.
export async function createShortFragmentRequest(pack){
 const catalog=await createMembershipFragmentCatalog(pack);
 const bindings=catalog.fragments.map((f,i)=>({shortId:`S${i+1}`,...f}));
 const bindingDigest=await digest(JSON.stringify({packDigest:catalog.packDigest,bindings}));
 const serverBinding=Object.freeze({packDigest:catalog.packDigest,bindingDigest,bindings});
 return {serverBinding,modelPayload:{question:pack.question,locale:pack.locale,glossary:pack.glossary||[],sources:bindings.map(f=>({id:f.shortId,text:f.text,sourceLanguage:f.sourceLanguage})),reviewedCoverage:verifiedArgumentCoverage(serverBinding),constraints:{answer:'Natural coherent answer; no mandatory number of claims or long boundary paragraph',support:'Internal support map is required for substantive statements',scope:'Answer the actual question using core evidence; omit unnecessary background',relations:'Distinguish DIRECT_SUPPORT, BACKGROUND and INFERENCE. Background is not a new causal conclusion. Unsupported inferences must be omitted.',qualifiers:'Preserve usually, possibly, whether, negation and conditions',missing:'Describe the specific gap only in THIS admitted source pack, never claim the whole manuscript lacks evidence; recovery and repair are distinct',schema:{locale:pack.locale,answer:'Natural customer prose',supportMap:[{statement:'Exact sentence in answer',sourceIds:['S1'],relation:'DIRECT_SUPPORT'}],limitations:'Only when necessary'},quotes:'Do not invent direct quotes; server renders exact excerpts'}}};
}

export async function validateShortFragmentAnswer(answer,binding,expected){
 if(binding.packDigest!==expected.packDigest||binding.bindingDigest!==expected.bindingDigest)throw Error('SOURCE_PACK_MISMATCH');
 if(await digest(JSON.stringify({packDigest:binding.packDigest,bindings:binding.bindings}))!==binding.bindingDigest)throw Error('SOURCE_BINDING_CHANGED');
 if(answer?.locale!==expected.locale||typeof answer.answer!=='string'||!answer.answer.trim()||!Array.isArray(answer.supportMap)||!answer.supportMap.length)throw Error('SHORT_ANSWER_SCHEMA_INVALID');
 if(answer.locale==='en'&&/[\u3400-\u9fff]/u.test(answer.answer))throw Error('EN_BODY_LANGUAGE_LEAK');
 const support=answer.supportMap.map(row=>{
  if(typeof row.statement!=='string'||!row.statement.trim()||!answer.answer.includes(row.statement)||!['DIRECT_SUPPORT','BACKGROUND','INFERENCE'].includes(row.relation))throw Error('STATEMENT_MAP_INVALID');
  if(!Array.isArray(row.sourceIds)||!row.sourceIds.length||new Set(row.sourceIds).size!==row.sourceIds.length)throw Error('SOURCE_IDS_INVALID');
  return {...row,sources:row.sourceIds.map(id=>{if(typeof id!=='string'||!/^S[1-9][0-9]*$/.test(id))throw Error('SOURCE_ID_INVALID');const f=binding.bindings.find(x=>x.shortId===id);if(!f)throw Error('SOURCE_NOT_IN_THIS_PACK');return {...f,excerpt:f.text};})};
 });
 return {locale:answer.locale,answer:answer.answer,limitations:answer.limitations||'',support,identity:'PASS_EXACT_LOCAL_ID_AND_PACK',semanticSupport:'SEPARATE_AUTOMATED_GROUNDING_GATE_REQUIRED',deliverable:false,providerCalls:0};
}

// Runner seam, with no network/provider transport or commercial activation.
export async function runOfflineShortFragmentExperiment(candidate,offlineModel){
 if(typeof offlineModel!=='function')throw Error('OFFLINE_MODEL_REQUIRED');
 const payload=structuredClone(candidate.modelPayload);
 const answer=await offlineModel(payload);
 const result=await validateShortFragmentAnswer(answer,candidate.serverBinding,{packDigest:candidate.serverBinding.packDigest,bindingDigest:candidate.serverBinding.bindingDigest,locale:payload.locale});
 return {...result,modelValidation:'OFFLINE_FIXTURE_NOT_NEW_MODEL_EVIDENCE',customerCreditsCharged:0};
}
