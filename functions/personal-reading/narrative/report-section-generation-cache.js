import {deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

export const REPORT_SECTION_GENERATION_CACHE_VERSION='PHI-OS-RNT2-SECTION-CANDIDATE-CACHE-v1.0.0';
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}
function keyOf(identity){const k=String(identity?.generationKey||'').trim();if(!k.startsWith('RNT2-'))fail('RNT2_SECTION_CACHE_GENERATION_ID_REQUIRED');return k;}

export function createReportSectionGenerationCache({adapter=null,production=false}={}){
 if(production&&(!adapter||typeof adapter.get!=='function'||typeof adapter.put!=='function'))fail('RNT2_SECTION_CACHE_PERSISTENT_ADAPTER_REQUIRED');
 const memory=new Map();
 return Object.freeze({
  schemaVersion:REPORT_SECTION_GENERATION_CACHE_VERSION,
  persistenceMode:adapter?'PERSISTENT_ADAPTER':'TEST_ONLY_MEMORY',
  productionReady:production&&Boolean(adapter),
  async get(identity){
   const k=keyOf(identity);const v=adapter?.get?await adapter.get(k):memory.get(k);
   if(!v)return null;
   if(v?.verification?.accepted!==true||v?.status!=='PASS')fail('RNT2_SECTION_CACHE_UNVERIFIED_ENTRY');
   return deepFreeze({cacheHit:true,generationIdentity:identity,candidate:v});
  },
  async put(identity,value){
   const k=keyOf(identity);
   if(value?.status!=='PASS'||value?.verification?.accepted!==true)fail('RNT2_SECTION_CACHE_ONLY_VERIFIED_PASS');
   const frozen=deepFreeze({...value,cacheState:'VERIFIED_CANDIDATE'});
   if(adapter?.put)await adapter.put(k,frozen);else memory.set(k,frozen);
   return frozen;
  }
 });
}
export default Object.freeze({createReportSectionGenerationCache});
