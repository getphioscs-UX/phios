import {loadSevenVolumeBooks,bookRoute} from '../web-production/public-surface-data-seven.js';
import {loadBook5PublicationMetadata} from './published-content.js';
const BASE='/content/knowledge/public/successors/book4-discovery-v1';
const PATHS=Object.freeze({
  search:`${BASE}/public-search-index.json`,
  catalog:`${BASE}/knowledge-catalog.json`,
  crossBook:`${BASE}/cross-book-discovery.json`
});
const cache=new Map();
async function load(name){
 if(cache.has(name))return cache.get(name);
 const promise=fetch(PATHS[name],{credentials:'same-origin',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}}).then(response=>{
  if(!response.ok)throw new Error(`PUBLIC_DISCOVERY_SOURCE_UNAVAILABLE:${PATHS[name]}`);
  return response.json();
 });
 cache.set(name,promise);promise.catch(()=>cache.delete(name));return promise;
}
export async function loadPublicSearchIndex(locale){
 const [data,book5]=await Promise.all([load('search'),loadBook5PublicationMetadata()]);
 const records=[...(data.records||[]),...book5.records.map(r=>({...r,bookTitle:r.publicationContext.bookTitle,partTitle:r.publicationContext.partTitle})),...book5.atlasDiscovery];
 return records.filter(record=>!locale||record.locale===locale);
}
export async function loadPublicKnowledgeCatalog(){
 const [catalog,registry,book5]=await Promise.all([load('catalog'),loadSevenVolumeBooks(),loadBook5PublicationMetadata()]);
 // Semantic route joins preserve article counts when publication numbers move.
 const previous=new Map(catalog.books.map(b=>[b.canonicalRoute,b]));
 return {...catalog,bookCount:registry.books.length,books:registry.books.map(b=>{
  const route=bookRoute(b.book_id),prior=previous.get(route);
  return {...prior,bookCode:b.bookCode,volume:b.volume,title:b.title,subtitle:b.subtitle,canonicalRoute:route,partCodes:b.parts.map(n=>'P'+n),hasPublishedKnowledge:b.bookCode==='BOOK-5'||prior?.hasPublishedKnowledge||false,publishedArticleCount:b.bookCode==='BOOK-5'?book5.articlePlanCount:prior?.publishedArticleCount||0};
 })};
}
export async function loadCrossBookDiscovery(locale){
 const data=await load('crossBook');
 const records=Array.isArray(data.records)?data.records:[];
 return records.filter(record=>!locale||record.locale===locale);
}
export function clearPublicDiscoveryCache(){cache.clear()}
