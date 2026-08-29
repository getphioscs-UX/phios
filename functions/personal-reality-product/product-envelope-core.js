export const PERSONAL_REALITY_METHOD_PRODUCT_SCHEMA='PHI-OS-PERSONAL-REALITY-METHOD-PRODUCT-ENVELOPE-v1.0.0';
const METHODS=new Set(['AST','BZR','NUM','ZWR','ECR']);
const STATES=new Set(['CUSTOMER_PUBLISHABLE','UPSTREAM_CUTOVER_BLOCKED','PRODUCT_AUTHORITY_INCOMPLETE']);
export const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
export const list=v=>Array.isArray(v)?v:[];
export const uniq=v=>[...new Set(list(v).filter(Boolean))];
export function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
export function localeOf(value){return value==='zh-Hans'?'zh-Hans':'en'}
export function text(locale,en,zh){return localeOf(locale)==='zh-Hans'?zh:en}
export function section({sectionId,title,summary=null,payload=null,kind='READING',state='READABLE',sourceRefs=[]}={}){
 if(!sectionId||!title)fail('PPR_R2_SECTION_ID_TITLE_REQUIRED');
 return freeze({sectionId,title,summary,kind,state,payload,sourceRefs:uniq(sourceRefs)});
}
export function visual({visualId,type,title=null,payload=null,sourceRefs=[]}={}){
 if(!visualId||!type)fail('PPR_R2_VISUAL_ID_TYPE_REQUIRED');
 return freeze({visualId,type,title,payload,sourceRefs:uniq(sourceRefs)});
}
export function buildMethodProductEnvelope({methodId,productType,locale='en',state,publication,hero,navigation=[],sections=[],visuals=[],lineage={},boundaries={},sourceProduct=null}={}){
 if(!METHODS.has(methodId))fail('PPR_R2_METHOD_ID_UNSUPPORTED',{methodId});
 if(!productType)fail('PPR_R2_PRODUCT_TYPE_REQUIRED',{methodId});
 if(!STATES.has(state))fail('PPR_R2_PRODUCT_STATE_INVALID',{methodId,state});
 if(!publication||publication.customerPublishable!==(state==='CUSTOMER_PUBLISHABLE'))fail('PPR_R2_PUBLICATION_STATE_MISMATCH',{methodId,state});
 if(!hero?.title)fail('PPR_R2_HERO_REQUIRED',{methodId});
 const xs=list(sections);if(!xs.length)fail('PPR_R2_SECTIONS_REQUIRED',{methodId});
 const nav=uniq(navigation);if(!nav.length)fail('PPR_R2_NAVIGATION_REQUIRED',{methodId});
 const baseBoundaries={newMeaningCreated:false,methodRuntimeExecuted:false,canonicalProjectionCreated:false,rawProjectionPromotedToCustomerConclusion:false,rendererMeaningCreated:false,blockedUpstreamAuthorityPromoted:false};
 for(const [key,value] of Object.entries(baseBoundaries))if(boundaries[key]===true)fail('PPR_R2_HARD_BOUNDARY_VIOLATION',{methodId,key});
 return freeze({schemaVersion:PERSONAL_REALITY_METHOD_PRODUCT_SCHEMA,methodId,productType,locale:localeOf(locale),state,publication:freeze({...publication}),hero:freeze({...hero}),navigation:nav,sections:xs,visuals:list(visuals),lineage:freeze({...lineage}),boundaries:freeze({...baseBoundaries,...boundaries}),sourceProduct});
}
