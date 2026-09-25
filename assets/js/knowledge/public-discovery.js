import {loadSevenVolumeBooks,bookRoute} from '../web-production/public-surface-data-seven.js';
import {loadBook5PublicationMetadata,loadBook6PublicationMetadata} from './published-content.js';
const BASE='/content/knowledge/public/successors/book4-discovery-v1';
const PATHS=Object.freeze({
  search:`${BASE}/public-search-index.json`,
  catalog:`${BASE}/knowledge-catalog.json`,
  crossBook:`${BASE}/cross-book-discovery.json`
});
const cache=new Map();
const BOOK6_ATLAS_PATHS=Object.freeze({
 sections:'/content/civilization-atlas/reconfiguration/book-vi-sections-v1.json',
 cases:'/content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json',
 windows:'/content/civilization-atlas/reconfiguration/reconfiguration-windows-v1.json',
 snapshots:'/content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json',
 dossiers:'/content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json',
 lived:'/content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json'
});
let book6AtlasCache;
async function loadBook6AtlasDiscovery(locale='en'){
 if(!book6AtlasCache)book6AtlasCache=Promise.all(Object.entries(BOOK6_ATLAS_PATHS).map(async([key,path])=>{const r=await fetch(path,{credentials:'same-origin',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});if(!r.ok)throw new Error('BOOK6_ATLAS_DISCOVERY_UNAVAILABLE:'+path);return [key,await r.json()];})).then(entries=>Object.fromEntries(entries)).catch(e=>{book6AtlasCache=null;throw e});
 const data=await book6AtlasCache,l=locale==='zh-Hans'?'zh-Hans':'en',bookTitle={en:'Reality Reconfiguration','zh-Hans':'世界如何重组'},partTitle={en:'Civilization Reconfiguration Atlas','zh-Hans':'文明重组图谱'};
 const title=(zh,en)=>l==='zh-Hans'?zh:en;const route=(layer,param,id)=>'/books/reality-configuration/?atlas='+layer+'&'+param+'='+encodeURIComponent(id)+'#atlas';
 const scope=(activeLayer,id,extra={})=>({scopeType:'CIVILIZATION_RECONFIGURATION_ATLAS',bookCode:'BOOK-6',partCode:'PART-13',activeLayer,entityId:id,...extra});
 const records=[];
 for(const x of data.cases?.cases||[])records.push({type:'CASE',slug:x.id,title:title(x.titleZh,x.titleEn),summary:[x.timeLabel,(x.regions||[]).join(' · '),(x.caseTypes||[]).join(' · ')].filter(Boolean).join(' · '),href:route('cases','case',x.id),bookTitle,partTitle,themeCode:'CIVILIZATION_RECONFIGURATION',tags:[...(x.caseTypes||[]),...(x.regions||[])],searchText:[x.id,x.titleZh,x.titleEn,x.timeLabel,x.priorRuntime,x.trigger,x.successorRuntime,...(x.regions||[]),...(x.caseTypes||[]),...(x.triggers||[]),...(x.pressureField||[]),...(x.relatedBookSections||[])].join(' '),atlasScope:scope('cases',x.id)});
 for(const x of data.windows?.windows||[])records.push({type:'WINDOW',slug:x.id,title:title(x.titleZh,x.titleEn),summary:`${x.startYear}–${x.endYear} · ${x.majorCases?.length||0} linked cases`,href:route('windows','window',x.id),bookTitle,partTitle,themeCode:'CIVILIZATION_RECONFIGURATION',tags:[...(x.regions||[]),...(x.systemLayers||[])],searchText:[x.id,x.titleZh,x.titleEn,x.startYear,x.endYear,...(x.majorCases||[]),...(x.regions||[]),...(x.systemLayers||[])].join(' '),atlasScope:scope('windows',x.id,{windowId:x.id})});
 for(const x of data.snapshots?.snapshots||[])records.push({type:'SNAPSHOT',slug:x.id,title:title(x.metadata?.titleZh,x.metadata?.titleEn),summary:`${x.year} · ${x.dataClass||x.knowledgeState||'UNKNOWN'} · ${x.asset?.resolutionStatus||'UNVERIFIED'}`,href:route('snapshots','snapshot',x.id),bookTitle,partTitle,themeCode:'CIVILIZATION_RECONFIGURATION',tags:x.structuredLayers||[],searchText:[x.id,x.year,x.metadata?.titleZh,x.metadata?.titleEn,x.dataClass,x.asset?.resolutionStatus,...(x.majorReconfigurationCases||[]),...(x.structuredLayers||[])].join(' '),atlasScope:scope('snapshots',x.id,{snapshotId:x.id})});
 for(const x of data.dossiers?.dossiers||[])records.push({type:'DOSSIER',slug:x.id,title:x.entity?.[l]||x.entity?.en||x.id,summary:[x.entityType,x.dataClass,x.version].filter(Boolean).join(' · '),href:route('dossiers','dossier',x.id),bookTitle,partTitle,themeCode:'CIVILIZATION_RECONFIGURATION',tags:[x.entityType,x.dataClass].filter(Boolean),searchText:[x.id,x.entity?.en,x.entity?.['zh-Hans'],x.entityType,x.version,x.stage,x.capacity,x.load,x.alignment,x.resilience,x.adaptability,...(x.pressureFields||[]),...(x.direction||[])].join(' '),atlasScope:scope('dossiers',x.id,{dossierId:x.id})});
 for(const x of data.sections?.sections||[])records.push({type:'BOOK_SECTION',slug:x.id,title:title(x.titleZh,x.titleEn),summary:title(x.groupZh,x.groupEn),href:'/books/reality-configuration/?atlas=search&section='+encodeURIComponent(x.id)+'&q='+encodeURIComponent(x.id)+'#atlas',bookTitle,partTitle,themeCode:'CIVILIZATION_RECONFIGURATION',tags:[x.figure,x.groupEn,x.groupZh].filter(Boolean),searchText:[x.id,x.titleZh,x.titleEn,x.groupZh,x.groupEn,x.figure].join(' '),atlasScope:scope('sections',x.id,{sectionId:x.id})});
 for(const x of data.lived?.dimensions||[])records.push({type:'LIVED_REALITY',slug:x.id,title:title(x.labelZh,x.labelEn),summary:l==='zh-Hans'?'观察值 · 推导 · 未知；不转换为通用分数':'Observed · Derived · Unknown; no universal score',href:route('lived','lived',x.id),bookTitle,partTitle,themeCode:'LIVED_REALITY',tags:x.allowedDataClasses||[],searchText:[x.id,x.labelZh,x.labelEn,...(x.states||[]),...(x.allowedDataClasses||[])].join(' '),atlasScope:scope('lived',x.id,{livedRealityDimensionId:x.id})});
 return records;
}
async function load(name){
 if(cache.has(name))return cache.get(name);
 const promise=fetch(PATHS[name],{credentials:'same-origin',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}}).then(response=>{
  if(!response.ok)throw new Error(`PUBLIC_DISCOVERY_SOURCE_UNAVAILABLE:${PATHS[name]}`);
  return response.json();
 });
 cache.set(name,promise);promise.catch(()=>cache.delete(name));return promise;
}
export async function loadPublicSearchIndex(locale){
 const [data,book5,book6,book6Atlas]=await Promise.all([load('search'),loadBook5PublicationMetadata(),loadBook6PublicationMetadata(),loadBook6AtlasDiscovery(locale)]);
 const records=[...(data.records||[]),...book5.records.map(r=>({...r,bookTitle:r.publicationContext.bookTitle,partTitle:r.publicationContext.partTitle})),...(book5.atlasDiscovery||[]),...book6.records.map(r=>({...r,bookTitle:r.publicationContext.bookTitle,partTitle:r.publicationContext.partTitle})),...book6Atlas];
 return records.filter(record=>!locale||record.locale===locale);
}
export async function loadPublicKnowledgeCatalog(){
 const [catalog,registry,book5,book6]=await Promise.all([load('catalog'),loadSevenVolumeBooks(),loadBook5PublicationMetadata(),loadBook6PublicationMetadata()]);
 // Semantic route joins preserve article counts when publication numbers move.
 const previous=new Map(catalog.books.map(b=>[b.canonicalRoute,b]));
 return {...catalog,bookCount:registry.books.length,books:registry.books.map(b=>{
  const route=bookRoute(b.book_id),prior=previous.get(route);
  const successorCount=b.bookCode==='BOOK-5'?book5.articlePlanCount:b.bookCode==='BOOK-6'?book6.articlePlanCount:null;
  return {...prior,bookCode:b.bookCode,volume:b.volume,title:b.title,subtitle:b.subtitle,canonicalRoute:route,partCodes:b.parts.map(n=>'P'+n),hasPublishedKnowledge:successorCount!==null||prior?.hasPublishedKnowledge||false,publishedArticleCount:successorCount??prior?.publishedArticleCount??0};
 })};
}
export async function loadCrossBookDiscovery(locale){
 const data=await load('crossBook');
 const records=Array.isArray(data.records)?data.records:[];
 return records.filter(record=>!locale||record.locale===locale);
}
export function clearPublicDiscoveryCache(){cache.clear()}
