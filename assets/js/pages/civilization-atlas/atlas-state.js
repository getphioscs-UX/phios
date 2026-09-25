export const ATLAS_LAYERS = Object.freeze([
  'timeline','cases','comparison','world','trajectories','transitions','loss'
]);

export const DEFAULT_ATLAS_STATE = Object.freeze({
  version:'1.0.0',
  activeLayer:'timeline',
  time:null,
  timeWindowId:null,
  snapshotId:null,
  regionIds:[],
  caseIds:[],
  primaryCaseId:null,
  comparisonFamilyId:null,
  trajectoryIds:[],
  transitionWindowId:null,
  lossFamilyId:null,
  lossTypeId:null,
  evidenceClasses:[],
  compareBasket:[],
  caseSearch:'',
  locale:'en'
});

const EVIDENCE_CLASSES = new Set(['EVIDENCE_SERIES','HISTORICAL_RECONSTRUCTION','CONCEPTUAL_TRAJECTORY']);
const LOCALES = new Set(['en','zh-Hans']);
const asString=v=>typeof v==='string'&&v.trim()?v.trim():null;
const asArray=v=>Array.isArray(v)?[...new Set(v.map(asString).filter(Boolean))]:[];
const asTime=v=>{
  if(v===null||v===undefined||v==='') return null;
  const n=Number(v);
  return Number.isFinite(n)&&n>=-10000&&n<=9999?Math.trunc(n):null;
};

export function normalizeAtlasState(input={}){
  const activeLayer=ATLAS_LAYERS.includes(input.activeLayer)?input.activeLayer:DEFAULT_ATLAS_STATE.activeLayer;
  const locale=LOCALES.has(input.locale)?input.locale:DEFAULT_ATLAS_STATE.locale;
  const caseIds=asArray(input.caseIds);
  const compareBasket=asArray(input.compareBasket).slice(0,6);
  const primaryCandidate=asString(input.primaryCaseId);
  const primaryCaseId=primaryCandidate || caseIds[0] || null;
  return {
    version:'1.0.0',
    activeLayer,
    time:asTime(input.time),
    timeWindowId:asString(input.timeWindowId),
    snapshotId:asString(input.snapshotId),
    regionIds:asArray(input.regionIds),
    caseIds,
    primaryCaseId,
    comparisonFamilyId:asString(input.comparisonFamilyId),
    trajectoryIds:asArray(input.trajectoryIds).slice(0,5),
    transitionWindowId:asString(input.transitionWindowId),
    lossFamilyId:asString(input.lossFamilyId),
    lossTypeId:asString(input.lossTypeId),
    evidenceClasses:asArray(input.evidenceClasses).filter(v=>EVIDENCE_CLASSES.has(v)),
    compareBasket,
    caseSearch:typeof input.caseSearch==='string'?input.caseSearch.slice(0,120):'',
    locale
  };
}

export function createCivilizationAtlasState(initial={}){
  let state=normalizeAtlasState({...DEFAULT_ATLAS_STATE,...initial});
  const listeners=new Set();
  const notify=(next,previous,meta)=>listeners.forEach(fn=>fn(next,previous,meta));
  return Object.freeze({
    get(){return state;},
    set(patch={},meta={source:'unknown'}){
      const previous=state;
      state=normalizeAtlasState({...state,...patch});
      notify(state,previous,meta);
      return state;
    },
    replace(next={},meta={source:'replace'}){
      const previous=state;
      state=normalizeAtlasState(next);
      notify(state,previous,meta);
      return state;
    },
    reset(meta={source:'reset'}){return this.replace(DEFAULT_ATLAS_STATE,meta);},
    subscribe(listener){
      if(typeof listener!=='function') return ()=>{};
      listeners.add(listener);
      return ()=>listeners.delete(listener);
    }
  });
}

export const RECONFIG_ATLAS_LAYERS = Object.freeze([
  'overview','search','cases','timeline','windows','snapshots','dossiers','lived','visuals','compare','dossiercompare'
]);
export const DEFAULT_RECONFIGURATION_ATLAS_STATE = Object.freeze({
  version:'2.0.0',activeLayer:'overview',query:'',caseSearch:'',primaryCaseId:null,compareCaseIds:[],
  windowId:null,snapshotId:null,snapshotLayer:'political',dossierId:null,compareDossierIds:[],
  livedRealityDimensionId:null,sectionId:null,regionId:null,caseType:null,filterWindowId:null,
  triggerQuery:'',pressureQuery:'',changeFilter:null,casePage:1,searchPage:1,locale:'en'
});
const RECONFIG_SNAPSHOT_LAYERS=new Set(['political','population','industry','energy','finance','trade','military','technology','information','colonialPostcolonial']);
const positivePage=v=>{const n=Math.trunc(Number(v));return Number.isFinite(n)&&n>0?Math.min(n,99):1;};
export function normalizeReconfigurationAtlasState(input={}){
 const locale=LOCALES.has(input.locale)?input.locale:'en';
 const activeLayer=RECONFIG_ATLAS_LAYERS.includes(input.activeLayer)?input.activeLayer:'overview';
 return {
  version:'2.0.0',activeLayer,query:String(input.query??'').slice(0,160),caseSearch:String(input.caseSearch??'').slice(0,160),
  primaryCaseId:asString(input.primaryCaseId),compareCaseIds:asArray(input.compareCaseIds).slice(0,4),
  windowId:asString(input.windowId),snapshotId:asString(input.snapshotId),
  snapshotLayer:RECONFIG_SNAPSHOT_LAYERS.has(input.snapshotLayer)?input.snapshotLayer:'political',
  dossierId:asString(input.dossierId),compareDossierIds:asArray(input.compareDossierIds).slice(0,4),
  livedRealityDimensionId:asString(input.livedRealityDimensionId),sectionId:asString(input.sectionId),
  regionId:asString(input.regionId),caseType:asString(input.caseType),filterWindowId:asString(input.filterWindowId),
  triggerQuery:String(input.triggerQuery??'').slice(0,120),pressureQuery:String(input.pressureQuery??'').slice(0,120),
  changeFilter:asString(input.changeFilter),casePage:positivePage(input.casePage),searchPage:positivePage(input.searchPage),locale
 };
}
export function createReconfigurationAtlasState(initial={}){
 let current=normalizeReconfigurationAtlasState({...DEFAULT_RECONFIGURATION_ATLAS_STATE,...initial});
 const listeners=new Set();
 return Object.freeze({
  get(){return current;},
  set(patch={},meta={source:'reconfiguration-ui'}){const previous=current;current=normalizeReconfigurationAtlasState({...current,...patch});listeners.forEach(fn=>fn(current,previous,meta));return current;},
  replace(next={},meta={source:'replace'}){const previous=current;current=normalizeReconfigurationAtlasState(next);listeners.forEach(fn=>fn(current,previous,meta));return current;},
  reset(meta={source:'reset'}){return this.replace(DEFAULT_RECONFIGURATION_ATLAS_STATE,meta);},
  subscribe(listener){if(typeof listener!=='function')return()=>{};listeners.add(listener);return()=>listeners.delete(listener);}
 });
}
