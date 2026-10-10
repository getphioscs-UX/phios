import {createHash} from 'node:crypto';

export const ZWR_VFR_CACHE_VERSION='ZWR-VFR-R1-IMMUTABLE-CACHE-v2';

function stable(value){
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
}
export function zwrVfrCacheIdentity({authorityDigest,composerVersion,realityContext=null,localeMode='BILINGUAL_SINGLE_CALL'}={}){
 if(!authorityDigest||!composerVersion)throw Error('ZWR_VFR_CACHE_IDENTITY_REQUIRED');
 return createHash('sha256').update(stable({method:'ZWR',authorityDigest,composerVersion,realityContext,localeMode})).digest('hex');
}
export function zwrVfrDeepPublicationCacheIdentity({
 authorityDigest,
 repairedResultDigest,
 pagePlanVersion,
 diagramDataVersion,
 diagramDataDigest,
 visualBindingVersion,
 rendererVersion,
 publicationIrVersion
}={}){
 const required={authorityDigest,repairedResultDigest,pagePlanVersion,diagramDataVersion,diagramDataDigest,visualBindingVersion,rendererVersion,publicationIrVersion};
 for(const [k,v] of Object.entries(required))if(!v)throw Error('ZWR_VFR_DEEP_CACHE_IDENTITY_REQUIRED:'+k);
 return createHash('sha256').update(stable({
  method:'ZWR',
  lane:'DEEP_MANUSCRIPT_PUBLICATION',
  ...required
 })).digest('hex');
}
export function createMemoryZwrVfrCache(seed={}){
 const store=new Map(Object.entries(seed));
 return Object.freeze({
  async get(key){return store.has(key)?structuredClone(store.get(key)):null;},
  async put(key,value){
   if(store.has(key)){
    const prior=stable(store.get(key)),next=stable(value);
    if(prior!==next)throw Error('ZWR_VFR_IMMUTABLE_CACHE_CONFLICT');
    return false;
   }
   store.set(key,structuredClone(value));
   return true;
  },
  snapshot(){return Object.fromEntries([...store.entries()].map(([k,v])=>[k,structuredClone(v)]));}
 });
}
export default Object.freeze({zwrVfrCacheIdentity,zwrVfrDeepPublicationCacheIdentity,createMemoryZwrVfrCache,ZWR_VFR_CACHE_VERSION});
