import {normalizeAtlasState,ATLAS_LAYERS} from './atlas-state.js';

const PARAMS=Object.freeze({
  activeLayer:'atlas',time:'time',timeWindowId:'period',snapshotId:'snapshot',
  regionIds:'regions',caseIds:'cases',primaryCaseId:'case',comparisonFamilyId:'family',
  trajectoryIds:'trajectories',transitionWindowId:'tw',lossFamilyId:'lossFamily',
  lossTypeId:'lossType',evidenceClasses:'evidence',compareBasket:'compare'
});
const ARRAY_KEYS=new Set(['regionIds','caseIds','trajectoryIds','evidenceClasses','compareBasket']);
const split=value=>value?value.split(',').map(v=>v.trim()).filter(Boolean):[];

export function atlasStateFromUrl(urlLike,locale='en'){
  const url=urlLike instanceof URL?urlLike:new URL(String(urlLike),'https://example.invalid');
  const draft={locale};
  for(const [key,param] of Object.entries(PARAMS)){
    const raw=url.searchParams.get(param);
    if(raw===null) continue;
    draft[key]=ARRAY_KEYS.has(key)?split(raw):raw;
  }
  if(draft.activeLayer && !ATLAS_LAYERS.includes(draft.activeLayer)) draft.activeLayer='timeline';
  return normalizeAtlasState(draft);
}

export function atlasUrlFromState(urlLike,state,{includeHash=true}={}){
  const url=urlLike instanceof URL?new URL(urlLike.href):new URL(String(urlLike),'https://example.invalid');
  const normalized=normalizeAtlasState(state);
  for(const param of Object.values(PARAMS)) url.searchParams.delete(param);
  const set=(param,value)=>{if(value!==null&&value!==undefined&&value!==''&&(!Array.isArray(value)||value.length)) url.searchParams.set(param,Array.isArray(value)?value.join(','):String(value));};
  set(PARAMS.activeLayer,normalized.activeLayer);
  set(PARAMS.time,normalized.time);
  set(PARAMS.timeWindowId,normalized.timeWindowId);
  set(PARAMS.snapshotId,normalized.snapshotId);
  set(PARAMS.regionIds,normalized.regionIds);
  set(PARAMS.caseIds,normalized.caseIds);
  set(PARAMS.primaryCaseId,normalized.primaryCaseId);
  set(PARAMS.comparisonFamilyId,normalized.comparisonFamilyId);
  set(PARAMS.trajectoryIds,normalized.trajectoryIds);
  set(PARAMS.transitionWindowId,normalized.transitionWindowId);
  set(PARAMS.lossFamilyId,normalized.lossFamilyId);
  set(PARAMS.lossTypeId,normalized.lossTypeId);
  set(PARAMS.evidenceClasses,normalized.evidenceClasses);
  set(PARAMS.compareBasket,normalized.compareBasket);
  if(includeHash) url.hash='atlas';
  return url;
}

export function bindAtlasUrlState(store,{windowObject=globalThis.window,locale='en'}={}){
  if(!windowObject?.location||!windowObject?.history) return ()=>{};
  let applyingPopstate=false;
  const initial=atlasStateFromUrl(windowObject.location.href,locale);
  store.replace({...store.get(),...initial},{source:'url-initial'});
  const unsubscribe=store.subscribe((next,_previous,meta={})=>{
    if(applyingPopstate||meta.source==='url-popstate') return;
    const nextUrl=atlasUrlFromState(windowObject.location.href,next);
    const href=`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    const historyState={...windowObject.history.state,phiosAtlas:true};
    const replaceSources=new Set(['url-initial','url-popstate','locale','restore']);
    if(replaceSources.has(meta.source)) windowObject.history.replaceState(historyState,'',href);
    else windowObject.history.pushState(historyState,'',href);
  });
  const onPopState=()=>{
    applyingPopstate=true;
    try{store.replace(atlasStateFromUrl(windowObject.location.href,store.get().locale),{source:'url-popstate'});}finally{applyingPopstate=false;}
  };
  windowObject.addEventListener?.('popstate',onPopState);
  return ()=>{unsubscribe();windowObject.removeEventListener?.('popstate',onPopState);};
}
