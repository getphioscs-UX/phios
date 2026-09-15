import fs from 'node:fs';
import {currentDedupReport} from './build-b14-sks-dedup.mjs';
export const output='content/knowledge/structured/structured-knowledge-search-index-v1.json';
export function searchIndex(){
 currentDedupReport();
 const discovery=JSON.parse(fs.readFileSync('content/knowledge/structured/structured-knowledge-registry-v1.json'));
 const cache=new Map();
 return discovery.objects.map(entry=>{
  if(!cache.has(entry.registryPath))cache.set(entry.registryPath,JSON.parse(fs.readFileSync(entry.registryPath)));
  const registry=cache.get(entry.registryPath),o=(registry.objects||registry.patterns||registry.entries).find(o=>o.objectId===entry.objectId);
  const aliases=[...new Set([...(Array.isArray(o.aliases)?o.aliases:[]),o.titleEn,registry.details?.[o.objectId]?.titleEn].filter(v=>typeof v==='string'&&v.trim()&&v!==o.title))];
  // Keywords come only from existing identity/classification metadata, never manuscript prose.
  const keywords=[...new Set([o.objectType,o.family,o.runtimeLevel,...aliases.flatMap(a=>a.match(/[\p{L}\p{N}]+/gu)||[])].filter(Boolean))];
  return {objectId:o.objectId,title:o.title,aliases,objectType:o.objectType,bookCode:o.bookCode,partCode:o.partCode,keywords};
 }).sort((a,b)=>a.objectId.localeCompare(b.objectId,'en'));
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-b14-sks-search.mjs')){const rows=searchIndex();fs.writeFileSync(output,JSON.stringify(rows,null,2)+'\n');console.log(`W63: ${rows.length} metadata-only search entries.`);}
