const clean=value=>String(value??'').normalize('NFKC').trim();
const scalar=(value,max=120)=>clean(value).slice(0,max)||null;
const list=(value,max=8)=>[...new Set((Array.isArray(value)?value:[]).map(item=>scalar(item)).filter(Boolean))].slice(0,max);
const LAYERS=new Set(['timeline','cases','comparison','world','trajectories','transitions','loss']);
const EVIDENCE_CLASSES=new Set(['EVIDENCE_SERIES','HISTORICAL_RECONSTRUCTION','CONCEPTUAL_TRAJECTORY']);

export function normalizeAtlasRetrievalScope(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const bookCode=scalar(input.bookCode)?.toUpperCase();
  const partCode=scalar(input.partCode)?.toUpperCase();
  const activeLayer=scalar(input.activeLayer)?.toLowerCase();
  if(bookCode!=='BOOK-5'||partCode!=='PART-12'||!LAYERS.has(activeLayer))return null;
  return Object.freeze({
    schemaVersion:'PHI-OS-ATLAS-RETRIEVAL-SCOPE-v1.0.0',
    scopeType:'CIVILIZATION_ATLAS',bookCode,partCode,activeLayer,
    time:Number.isFinite(Number(input.time))?Math.trunc(Number(input.time)):null,
    timeWindowId:scalar(input.timeWindowId),snapshotId:scalar(input.snapshotId),
    regionIds:Object.freeze(list(input.regionIds)),caseIds:Object.freeze(list(input.caseIds)),
    primaryCaseId:scalar(input.primaryCaseId),comparisonFamilyId:scalar(input.comparisonFamilyId),
    trajectoryIds:Object.freeze(list(input.trajectoryIds,5)),transitionWindowId:scalar(input.transitionWindowId),
    lossFamilyId:scalar(input.lossFamilyId),lossTypeId:scalar(input.lossTypeId),
    evidenceClasses:Object.freeze(list(input.evidenceClasses).filter(item=>EVIDENCE_CLASSES.has(item)))
  });
}

const readJson=async(env,path)=>{
  if(!env?.ASSETS?.fetch)return null;
  const response=await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));
  return response.ok?response.json():null;
};
const localized=(value,locale)=>value&&typeof value==='object'&&!Array.isArray(value)
  ?clean(value[locale]||value.en||value['zh-Hans'])
  :clean(value);
const questionTerms=value=>{
  const text=clean(value).toLocaleLowerCase();
  const latin=text.match(/[a-z0-9-]{3,}/g)||[];
  const cjk=(text.match(/[\u3400-\u9fff]+/g)||[]).flatMap(run=>run.length<=4?[run]:Array.from({length:run.length-1},(_,i)=>run.slice(i,i+2)));
  return [...new Set([...latin,...cjk])];
};
const flattenLocalized=(record,locale,question='')=>{
  const selected=[];
  const visit=value=>{
    if(value==null)return;
    if(Array.isArray(value)){value.slice(0,20).forEach(visit);return;}
    if(typeof value==='object'){
      if('en'in value||'zh-Hans'in value){const text=localized(value,locale);if(text)selected.push(text);return;}
      Object.values(value).forEach(visit);return;
    }
    if(typeof value==='string'&&value.length>2)selected.push(clean(value));
  };
  visit(record);
  const terms=questionTerms(question),unique=[...new Set(selected)];
  unique.sort((a,b)=>terms.filter(term=>b.toLocaleLowerCase().includes(term)).length-terms.filter(term=>a.toLocaleLowerCase().includes(term)).length);
  return unique.join(locale==='zh-Hans'?'。':'. ').slice(0,1800);
};

const CONFIG=Object.freeze({
  timeline:{path:'content/civilization-atlas/timeline/timeline-periods-v1.json',array:'periods',id:'periodId',scope:['timeWindowId']},
  cases:{path:'content/civilization-atlas/cases/civilization-case-registry-v1.json',array:'cases',id:'caseId',scope:['primaryCaseId','caseIds']},
  comparison:{path:'content/civilization-atlas/comparison/comparison-families-v1.json',array:'families',id:'familyId',scope:['comparisonFamilyId']},
  world:{path:'content/civilization-atlas/snapshots/world-snapshots-v1.json',array:'snapshots',id:'snapshotId',scope:['snapshotId']},
  trajectories:{path:'content/civilization-atlas/trajectories/long-duration-trajectories-v1.json',array:'trajectories',id:'trajectoryId',scope:['trajectoryIds']},
  transitions:{path:'content/civilization-atlas/transitions/transition-windows-v1.json',array:'transitionWindows',id:'transitionWindowId',scope:['transitionWindowId']},
  loss:{path:'content/civilization-atlas/loss/reversal-loss-atlas-v1.json',arrays:['families','lossTypes'],ids:['familyId','lossTypeId'],scope:['lossFamilyId','lossTypeId']}
});
const wantedIds=(scope,keys)=>[...new Set(keys.flatMap(key=>Array.isArray(scope[key])?scope[key]:[scope[key]]).filter(Boolean))];

export async function retrieveAtlasScope({env={},scope,locale='zh-Hans',question=''}={}){
  const normalized=normalizeAtlasRetrievalScope(scope);
  if(!normalized)return {scope:null,sources:[],chain:[]};
  const config=CONFIG[normalized.activeLayer];
  const [registry,evidence]=await Promise.all([
    readJson(env,config.path),
    readJson(env,'content/civilization-atlas/evidence/evidence-authority-v1.json')
  ]);
  const arrays=config.arrays||[config.array],ids=config.ids||[config.id];
  const wanted=wantedIds(normalized,config.scope);
  let records=[];
  arrays.forEach((arrayName,index)=>records.push(...(registry?.[arrayName]||[]).map(record=>({record,idKey:ids[index]}))));
  if(wanted.length)records=records.filter(({record,idKey})=>wanted.includes(record?.[idKey]));
  else records=[];
  const entitySources=records.slice(0,8).map(({record,idKey})=>{
    const entityId=record[idKey];
    return {sourceType:'CIVILIZATION_ATLAS_ENTITY',sourceId:`ATLAS:${normalized.activeLayer}:${entityId}`,bookCode:'BOOK-5',partCode:'PART-12',atlasLayer:normalized.activeLayer,atlasEntityId:entityId,authorityClass:record.authorityClass||config.defaultAuthority||'HISTORICAL_RECONSTRUCTION',scopeMatch:true,href:'/books/reality-differentiation/',text:flattenLocalized(record,locale,question)};
  }).filter(source=>source.text);
  const evidenceIds=[...new Set(records.flatMap(({record})=>(record.evidence||record.evidenceIds||[]).map(item=>typeof item==='string'?item:item?.evidenceId)).filter(Boolean))];
  const evidenceSources=(evidence?.records||[]).filter(record=>evidenceIds.includes(record.evidenceId)).slice(0,12).map(record=>({sourceType:'CIVILIZATION_ATLAS_EVIDENCE',sourceId:`ATLAS:EVIDENCE:${record.evidenceId}`,bookCode:'BOOK-5',partCode:'PART-12',atlasLayer:normalized.activeLayer,atlasEntityId:record.evidenceId,authorityClass:record.authorityClass||'EVIDENCE_SERIES',scopeMatch:true,href:'/books/reality-differentiation/',text:flattenLocalized(record,locale,question)})).filter(source=>source.text);
  return {
    scope:normalized,
    sources:[...entitySources,...evidenceSources],
    chain:[
      {stage:'ATLAS_ENTITY',status:entitySources.length?'MATCHED':'NO_EXPLICIT_ENTITY_SELECTED',count:entitySources.length},
      {stage:'ATLAS_EVIDENCE',status:evidenceSources.length?'MATCHED':'NO_LINKED_EVIDENCE_RECORD',count:evidenceSources.length},
      {stage:'PART_12',status:'AUTHORIZED_FALLBACK'},
      {stage:'BROADER_KNOWLEDGE',status:'AUTHORIZED_FALLBACK'}
    ]
  };
}
