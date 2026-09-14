const REGISTRY='content/knowledge/structured/book-1/book-1-mechanism-registry-v1.json';
export function normalizeFormationScope(value){
 if(value?.scopeType!=='STRUCTURED_KNOWLEDGE'||value?.bookCode!=='BOOK-1'||!/^SK-B1-[A-Z-]{1,70}$/.test(value?.objectId||''))return null;
 return {scopeType:'STRUCTURED_KNOWLEDGE',bookCode:'BOOK-1',objectId:value.objectId};
}
async function registry(env){
 if(!env?.ASSETS?.fetch)return null;
 try {const response=await env.ASSETS.fetch(new Request(`https://assets.local/${REGISTRY}`));if(!response.ok)return null;const data=await response.json();return Array.isArray(data?.objects)&&data.details?data:null;}catch{return null;}
}
function eligible(object){return object?.bookCode==='BOOK-1'&&['IN_REVIEW','ACCEPTED','ACTIVE'].includes(object.status)&&['CANDIDATE','REVIEWED','ACTIVE'].includes(object.projectionState)&&['SUPPORTED_SOURCE','CANONICAL_SOURCE'].includes(object.evidenceState)&&object.sourceRefs?.canonicalNodeCodes?.includes(object.nodeCode)&&object.sourceRefs?.manuscriptSectionRefs?.length>0;}
export async function resolveFormationEntry(ref,env={}){
 if(!String(ref).startsWith('CONCEPT:'))return null;
 const data=await registry(env);if(!data)return null;
 const object=data.objects?.find(o=>`CONCEPT:${data.details?.[o.objectId]?.conceptId?.replaceAll('_','-')}`===ref);
 if(!eligible(object))return null;
 return {bookCode:'BOOK-1',partCode:object.partCode,retrievalScope:{scopeType:'STRUCTURED_KNOWLEDGE',bookCode:'BOOK-1',objectId:object.objectId}};
}
export async function retrieveFormationScope({env={},scope,locale='zh-Hans'}={}){
 const normalized=normalizeFormationScope(scope);if(!normalized)return {sources:[],nodeCodes:[],chain:[]};
 const data=await registry(env);const selected=data?.objects?.find(o=>o.objectId===normalized.objectId);
 if(!eligible(selected))return {sources:[],nodeCodes:[],chain:[{stage:'SELECTED_STRUCTURED_OBJECT',status:'UNAVAILABLE'}]};
 const relatedIds=data.details?.[selected.objectId]?.relatedMechanisms||[];
 const objects=[selected,...[...new Set(relatedIds)].filter(id=>id!==selected.objectId).map(id=>data.objects.find(o=>o.objectId===id)).filter(eligible)].slice(0,6);
 return {sources:objects.map((o,index)=>({sourceId:`STRUCTURED:${o.objectId}`,sourceType:'STRUCTURED_KNOWLEDGE_OBJECT',authorityClass:'GOVERNED_PROJECTION',bookCode:o.bookCode,partCode:o.partCode,nodeCode:o.nodeCode,structuredObjectId:o.objectId,scopeMatch:true,selected:index===0,href:`/books/reality-formation/?mechanism=${o.objectId}#explorer`,text:`${o.title}: ${o.canonicalMeaning}${locale==='en'?`\nDraft English translation: ${data.details[o.objectId].summaryEn}`:''}\nBoundary: source-based preview; structured classification and translation await human review. No automatic personal diagnosis.`,sourceRefs:o.sourceRefs,humanAcceptanceComplete:false})),nodeCodes:[...new Set(objects.map(o=>o.nodeCode))],chain:[{stage:'SELECTED_STRUCTURED_OBJECT',status:'MATCHED',count:1},{stage:'RELATED_STRUCTURED_OBJECTS',status:'MATCHED',count:objects.length-1},{stage:'CANONICAL_NODE',status:'SOURCE_REFS_BOUND'},{stage:'MANUSCRIPT_OR_PUBLISHED_ARTICLE',status:'EXISTING_RETRIEVAL_FALLBACK'},{stage:'BROADER_KNOWLEDGE',status:'EXISTING_POLICY_FALLBACK'}]};
}
