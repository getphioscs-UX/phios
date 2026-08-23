import { sha256Canonical } from './meaning-resolver.js';

export const CMP_LOCALE_PROJECTION_SCHEMA='PHI-OS-CANONICAL-MEANING-LOCALE-PROJECTION-v1.0.0';

function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value;}

export async function projectCanonicalMeaningLocale({bundle,localeRegistry,locale='en'}={}){
  if(bundle?.status!=='PRODUCTION'||bundle?.activationState!=='PRODUCTION_ACTIVE')fail('CMP_LOCALE_REQUIRES_PRODUCTION_BUNDLE');
  if(!localeRegistry?.entries)fail('CMP_LOCALE_REGISTRY_MISSING');
  const requested=localeRegistry.supportedLocales?.includes(locale)?locale:localeRegistry.fallbackLocale||'en';
  const byCode=new Map(localeRegistry.entries.map(x=>[x.meaningCode,x]));
  const items=bundle.items.map(item=>{
    const record=byCode.get(item.meaningCode); if(!record?.productionLocaleAdmitted)fail('CMP_LOCALE_MEANING_NOT_ADMITTED');
    const rendering=record.locales?.[requested]||record.locales?.[localeRegistry.fallbackLocale||'en']; if(!rendering)fail('CMP_LOCALE_RENDERING_MISSING');
    if(record.meaningCanonicalDigest!==item.evidence?.meaningCanonicalDigest)fail('CMP_LOCALE_MEANING_IDENTITY_DRIFT');
    return freeze({meaningId:item.meaningId,meaningCode:item.meaningCode,meaningVersion:item.meaningVersion,meaningType:item.meaningType,locale:requested,label:rendering.label,definition:rendering.definition,sourceProjectionRef:item.sourceProjectionRef,mappingLineage:item.mappingLineage,knowledgeAuthority:item.knowledgeAuthority});
  });
  const localeDigest=await sha256Canonical({sourceBundleDigest:bundle.bundleDigest,locale:requested,items:items.map(x=>({meaningCode:x.meaningCode,label:x.label,definition:x.definition,mappingCode:x.mappingLineage.mappingCode}))});
  return freeze({schemaVersion:CMP_LOCALE_PROJECTION_SCHEMA,sourceBundleCode:bundle.bundleCode,sourceBundleDigest:bundle.bundleDigest,locale:requested,items,localeDigest,boundaries:{meaningIdentityChanged:false,interpretationCreated:false,professionalJudgmentCreated:false,providerUsed:false,aiUsed:false}});
}
export default Object.freeze({projectCanonicalMeaningLocale});
