const clean=value=>String(value??'').normalize('NFKC').trim();
const scalar=(value,max=160)=>clean(value).slice(0,max)||null;
const list=(value,max=8)=>[...new Set((Array.isArray(value)?value:[]).map(item=>scalar(item)).filter(Boolean))].slice(0,max);
const BOOK5_LAYERS=new Set(['timeline','cases','comparison','world','trajectories','transitions','loss']);
const BOOK6_LAYERS=new Set(['overview','reconfiguration-cases','reconfiguration-windows','reconfiguration-snapshots','dossiers','lived-reality','chapters','compare']);
const EVIDENCE_CLASSES=new Set(['EVIDENCE_SERIES','HISTORICAL_RECONSTRUCTION','CONCEPTUAL_TRAJECTORY','CANONICAL_HISTORY','CURRENT_DATA','DERIVED_RUNTIME_READOUT','CONDITIONAL_PROJECTION','UNKNOWN']);
export function normalizeAtlasRetrievalScope(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const bookCode=scalar(input.bookCode)?.toUpperCase(),partCode=scalar(input.partCode)?.toUpperCase(),activeLayer=scalar(input.activeLayer)?.toLowerCase();
 const book5=bookCode==='BOOK-5'&&partCode==='PART-12'&&BOOK5_LAYERS.has(activeLayer);
 const book6=bookCode==='BOOK-6'&&partCode==='PART-13'&&BOOK6_LAYERS.has(activeLayer);
 if(!book5&&!book6)return null;
 return Object.freeze({schemaVersion:'PHI-OS-ATLAS-RETRIEVAL-SCOPE-v2.0.0',scopeType:'CIVILIZATION_ATLAS',atlasOwner:book6?'BOOK_VI_RECONFIGURATION_ATLAS':'BOOK_V_CIVILIZATION_ATLAS',bookCode,partCode,activeLayer,
  time:Number.isFinite(Number(input.time))?Math.trunc(Number(input.time)):null,timeWindowId:scalar(input.timeWindowId),snapshotId:scalar(input.snapshotId),regionIds:Object.freeze(list(input.regionIds)),caseIds:Object.freeze(list(input.caseIds)),primaryCaseId:scalar(input.primaryCaseId),comparisonFamilyId:scalar(input.comparisonFamilyId),trajectoryIds:Object.freeze(list(input.trajectoryIds,5)),transitionWindowId:scalar(input.transitionWindowId),lossFamilyId:scalar(input.lossFamilyId),lossTypeId:scalar(input.lossTypeId),
  dossierId:scalar(input.dossierId),dossierIds:Object.freeze(list(input.dossierIds,4)),livedRealityDimensionIds:Object.freeze(list(input.livedRealityDimensionIds,14)),bookSection:scalar(input.bookSection),
  evidenceClasses:Object.freeze(list(input.evidenceClasses).filter(item=>EVIDENCE_CLASSES.has(item)))});
}
const readJson=async(env,path)=>{if(!env?.ASSETS?.fetch)return null;const response=await env.ASSETS.fetch(new Request('https://assets.local/'+path));return response.ok?response.json():null};
const localized=(value,locale)=>value&&typeof value==='object'&&!Array.isArray(value)?clean(value[locale]||value.en||value['zh-Hans']):clean(value);
const qterms=value=>{const t=clean(value).toLowerCase();return [...new Set([...(t.match(/[a-z0-9-]{3,}/g)||[]),...(t.match(/[\u3400-\u9fff]{2,}/g)||[])])]};
const flatten=(record,locale)=>{const out=[];const visit=v=>{if(v==null)return;if(Array.isArray(v)){v.slice(0,24).forEach(visit);return}if(typeof v==='object'){if('en'in v||'zh-Hans'in v){const x=localized(v,locale);if(x)out.push(x);return}Object.values(v).forEach(visit);return}if(typeof v==='string'||typeof v==='number')out.push(clean(v))};visit(record);return [...new Set(out)].join(locale==='zh-Hans'?'。':'. ')};
const CONFIG5={timeline:{path:'content/civilization-atlas/timeline/timeline-periods-v1.json',array:'periods',id:'periodId',scope:['timeWindowId']},cases:{path:'content/civilization-atlas/cases/civilization-case-registry-v1.json',array:'cases',id:'caseId',scope:['primaryCaseId','caseIds']},comparison:{path:'content/civilization-atlas/comparison/comparison-families-v1.json',array:'families',id:'familyId',scope:['comparisonFamilyId']},world:{path:'content/civilization-atlas/snapshots/world-snapshots-v1.json',array:'snapshots',id:'snapshotId',scope:['snapshotId']},trajectories:{path:'content/civilization-atlas/trajectories/long-duration-trajectories-v1.json',array:'trajectories',id:'trajectoryId',scope:['trajectoryIds']},transitions:{path:'content/civilization-atlas/transitions/transition-windows-v1.json',array:'transitionWindows',id:'transitionWindowId',scope:['transitionWindowId']},loss:{path:'content/civilization-atlas/loss/reversal-loss-atlas-v1.json',arrays:['families','lossTypes'],ids:['familyId','lossTypeId'],scope:['lossFamilyId','lossTypeId']}};
const CONFIG6={'reconfiguration-cases':{path:'content/civilization-atlas/reconfiguration/cases/reconfiguration-case-registry-v1.json',array:'cases',id:'id',scope:['primaryCaseId','caseIds']},'reconfiguration-windows':{path:'content/civilization-atlas/reconfiguration/windows/reconfiguration-windows-v1.json',array:'windows',id:'id',scope:['timeWindowId']},'reconfiguration-snapshots':{path:'content/civilization-atlas/reconfiguration/snapshots/world-reconfiguration-snapshots-v1.json',array:'snapshots',id:'id',scope:['snapshotId']},dossiers:{path:'content/civilization-atlas/reconfiguration/dossiers/contemporary-runtime-dossiers-v1.json',array:'dossiers',id:'id',scope:['dossierId','dossierIds']},'lived-reality':{path:'content/civilization-atlas/reconfiguration/lived-reality/lived-reality-dimensions-v1.json',array:'dimensions',id:'id',scope:['livedRealityDimensionIds']},chapters:{path:'content/civilization-atlas/reconfiguration/book-vi-reconfiguration-atlas-registry-v2.json',array:'chapters',id:'section',scope:['bookSection']},compare:{path:'content/civilization-atlas/reconfiguration/cases/reconfiguration-case-registry-v1.json',array:'cases',id:'id',scope:['caseIds']},overview:{path:'content/civilization-atlas/reconfiguration/book-vi-reconfiguration-atlas-registry-v2.json',array:'chapters',id:'section',scope:['bookSection']}};
const wantedIds=(scope,keys)=>[...new Set(keys.flatMap(key=>Array.isArray(scope[key])?scope[key]:[scope[key]]).filter(Boolean))];
function rankByQuestion(records,idKey,question,locale){const terms=qterms(question);if(!terms.length)return [];return records.map(record=>{const hay=flatten(record,locale).toLowerCase();return {record,idKey,score:terms.reduce((n,t)=>n+(hay.includes(t)?Math.max(2,t.length):0),0)}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6)}
export async function retrieveAtlasScope({env={},scope,locale='zh-Hans',question=''}={}){
 const normalized=normalizeAtlasRetrievalScope(scope);if(!normalized)return {scope:null,sources:[],chain:[]};
 const is6=normalized.bookCode==='BOOK-6',config=(is6?CONFIG6:CONFIG5)[normalized.activeLayer];if(!config)return {scope:normalized,sources:[],chain:[]};
 const registry=await readJson(env,config.path);const arrays=config.arrays||[config.array],ids=config.ids||[config.id];let records=[];arrays.forEach((name,i)=>records.push(...(registry?.[name]||[]).map(record=>({record,idKey:ids[i]}))));
 const wanted=wantedIds(normalized,config.scope);if(wanted.length)records=records.filter(({record,idKey})=>wanted.includes(record?.[idKey]));else records=rankByQuestion(records.map(x=>x.record),ids[0],question,locale);
 const href=is6?'/books/reality-configuration/#reconfiguration-atlas':'/books/reality-differentiation/';
 const entitySources=records.slice(0,8).map(({record,idKey})=>{const entityId=record[idKey];return {sourceType:is6?'BOOK_VI_RECONFIGURATION_ENTITY':'CIVILIZATION_ATLAS_ENTITY',sourceId:`ATLAS:${normalized.activeLayer}:${entityId}`,bookCode:normalized.bookCode,partCode:normalized.partCode,atlasLayer:normalized.activeLayer,atlasEntityId:entityId,authorityClass:record.dataClass||record.authorityClass||record.evidenceQuality||'UNKNOWN',scopeMatch:true,href,text:flatten(record,locale).slice(0,2000)}}).filter(x=>x.text);
 const chain=is6?[
  {stage:'ATLAS_ENTITY',status:entitySources.length?'MATCHED':'NO_ENTITY_MATCH',count:entitySources.length},
  {stage:'RECONFIGURATION_CASE',status:normalized.activeLayer==='reconfiguration-cases'?'ACTIVE':'AUTHORIZED_FALLBACK'},
  {stage:'WINDOW',status:normalized.activeLayer==='reconfiguration-windows'?'ACTIVE':'AUTHORIZED_FALLBACK'},
  {stage:'SNAPSHOT',status:normalized.activeLayer==='reconfiguration-snapshots'?'ACTIVE':'AUTHORIZED_FALLBACK'},
  {stage:'DOSSIER_VERSION',status:normalized.activeLayer==='dossiers'?'ACTIVE':'AUTHORIZED_FALLBACK'},
  {stage:'LIVED_REALITY_LAYER',status:normalized.activeLayer==='lived-reality'?'ACTIVE':'AUTHORIZED_FALLBACK'},
  {stage:'BOOK_VI_CANONICAL_SECTION',status:'AUTHORIZED_FALLBACK'},{stage:'BROADER_KNOWLEDGE',status:'AUTHORIZED_FALLBACK'}
 ]:[{stage:'ATLAS_ENTITY',status:entitySources.length?'MATCHED':'NO_EXPLICIT_ENTITY_SELECTED',count:entitySources.length},{stage:'PART_12',status:'AUTHORIZED_FALLBACK'},{stage:'BROADER_KNOWLEDGE',status:'AUTHORIZED_FALLBACK'}];
 return {scope:normalized,sources:entitySources,chain};
}
