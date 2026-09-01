import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
export const NARRATIVE_CACHE_VERSION='PHI-OS-NARRATIVE-GENERATION-CACHE-v1.0.0';
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}
function clean(v){return typeof v==='string'?v.trim():'';}
function assertPersistentAdapter(adapter){if(!adapter||typeof adapter.get!=='function'||typeof adapter.put!=='function')fail('W54N7_PERSISTENT_ADAPTER_REQUIRED');}
export async function buildNarrativeGenerationKey({purchaseId,sourceSemanticDigest,narrativeBriefDigest,promptVersion,narrativeProductVersion}={}){
  for(const [k,v] of Object.entries({purchaseId,sourceSemanticDigest,narrativeBriefDigest,promptVersion,narrativeProductVersion}))if(!clean(String(v??'')))fail('W54N7_GENERATION_KEY_FIELD_REQUIRED',{field:k});
  const identity={purchaseId:String(purchaseId),sourceSemanticDigest:String(sourceSemanticDigest),narrativeBriefDigest:String(narrativeBriefDigest),promptVersion:String(promptVersion),narrativeProductVersion:String(narrativeProductVersion)};
  const digest=await sha256Stable(identity);
  return deepFreeze({schemaVersion:'PHI-OS-NARRATIVE-GENERATION-KEY-v1.0.0',...identity,generationKey:`NGEN-${digest.toUpperCase()}`});
}
export function createNarrativeGenerationCache({adapter=null,production=false}={}){
  if(production)assertPersistentAdapter(adapter);
  const memory=new Map();
  const persistenceMode=adapter?'PERSISTENT_ADAPTER':'TEST_ONLY_MEMORY';
  return Object.freeze({
    schemaVersion:NARRATIVE_CACHE_VERSION,
    persistenceMode,
    productionReady:production&&Boolean(adapter),
    async get(key){if(adapter?.get)return adapter.get(key.generationKey);return memory.get(key.generationKey)||null;},
    async put(key,narrative){if(narrative?.generationState!=='READY')fail('W54N7_ONLY_READY_NARRATIVE_CACHEABLE');if(adapter?.put)await adapter.put(key.generationKey,narrative);else memory.set(key.generationKey,narrative);return narrative;},
    async resolve(key,{reason='REOPEN'}={}){const v=adapter?.get?await adapter.get(key.generationKey):memory.get(key.generationKey);if(!v)return null;return deepFreeze({cacheHit:true,reason,narrative:v,regenerationAllowed:false,persistenceMode});},
    async size(){return adapter?.size?adapter.size():memory.size;}
  });
}
export default Object.freeze({buildNarrativeGenerationKey,createNarrativeGenerationCache});
