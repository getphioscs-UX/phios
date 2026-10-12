import {personIdentity} from '../../account/canonical-person-store.js';
import {activeContinuitySubscription} from './continuity-quota-d1.js';
import {handleKnowledgeAccessRequest} from '../../_lib/knowledge-access-api.js';
import {approvedCrossLocaleSearch} from '../../knowledge-runtime/approved-terminology-context.js';
import {buildMembershipAuthorityPack} from './membership-authority-pack.js';
import {createMembershipModelRequest} from './membership-model-request.js';
import {executeMembershipAsk} from './membership-ask-execution.js';
// Server-side orchestration candidate. No customer-supplied pack, cost or owner.
// Production model dispatch remains closed until an independently authorized adapter.
export async function prepareKnowledgeMembershipAsk(context,{question,locale='zh-Hans',bookCode=''}){
 const ownerAccountId=personIdentity(context).userId;await activeContinuitySubscription(context.env,ownerAccountId);
 const search=locale==='en'?approvedCrossLocaleSearch(question,'en','zh-Hans'):{retrievalQuery:question};
 const url=new URL('/api/knowledge-access',context.request.url);url.search=new URLSearchParams({q:search.retrievalQuery,locale:'zh-Hans',source:'manuscript',bookCode}).toString();
 const response=await handleKnowledgeAccessRequest(new Request(url),context.env);if(!response.ok)throw Error('SOURCE_RETRIEVAL_SERVICE_FAILURE');const result=await response.json();
 const pack=await buildMembershipAuthorityPack({question,locale,records:result.manuscript?.records||[]});
 if(!pack.sources.length)return {state:'SOURCE_INSUFFICIENT',providerCalls:0,pack,ownerAccountId};
 return {state:'SOURCE_PACK_READY',pack,ownerAccountId,request:createMembershipModelRequest(pack,'gpt-5.6-luna')};
}
export async function runOfflineKnowledgeMembershipAsk(context,input,{taskId,platformEnvelopeId,invoke}){
 if(context.env.PHIOS_ENVIRONMENT!=='local')throw Error('OFFLINE_QA_ONLY');
 const prepared=await prepareKnowledgeMembershipAsk(context,input);if(prepared.state!=='SOURCE_PACK_READY')return prepared;
 return executeMembershipAsk({env:context.env,ownerAccountId:prepared.ownerAccountId,taskId,pack:prepared.pack,mode:'KNOWLEDGE',depth:'ORDINARY',budget:{maximumMicroUSD:50000,modelMicroUSD:prepared.request.maximumMicroUSD},platformEnvelopeId,invoke,offlineReplay:true});
}
