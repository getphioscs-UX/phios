const BASE='/content/knowledge/public/successors/book4-discovery-v1';
const PATHS=Object.freeze({
  search:`${BASE}/public-search-index.json`,
  catalog:`${BASE}/knowledge-catalog.json`,
  crossBook:`${BASE}/cross-book-discovery.json`
});
const cache=new Map();
async function load(name){
 if(cache.has(name))return cache.get(name);
 const promise=fetch(PATHS[name],{credentials:'same-origin',headers:{Accept:'application/json'}}).then(response=>{
  if(!response.ok)throw new Error(`PUBLIC_DISCOVERY_SOURCE_UNAVAILABLE:${PATHS[name]}`);
  return response.json();
 });
 cache.set(name,promise);return promise;
}
export async function loadPublicSearchIndex(locale){
 const data=await load('search');
 const records=Array.isArray(data.records)?data.records:[];
 return records.filter(record=>!locale||record.locale===locale);
}
export async function loadPublicKnowledgeCatalog(){return load('catalog')}
export async function loadCrossBookDiscovery(locale){
 const data=await load('crossBook');
 const records=Array.isArray(data.records)?data.records:[];
 return records.filter(record=>!locale||record.locale===locale);
}
export function clearPublicDiscoveryCache(){cache.clear()}
