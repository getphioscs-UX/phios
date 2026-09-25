const clean=value=>String(value??'').normalize('NFKC').trim();
const scalar=(value,max=120)=>clean(value).slice(0,max)||null;
const list=(value,max=8)=>[...new Set((Array.isArray(value)?value:[]).map(item=>scalar(item)).filter(Boolean))].slice(0,max);
const LAYERS=new Set(['timeline','cases','comparison','world','trajectories','transitions','loss']);
const RECONFIG_LAYERS=new Set(['overview','search','cases','timeline','windows','snapshots','dossiers','lived','compare','dossiercompare','sections']);
const EVIDENCE_CLASSES=new Set(['EVIDENCE_SERIES','HISTORICAL_RECONSTRUCTION','CONCEPTUAL_TRAJECTORY']);

export function normalizeAtlasRetrievalScope(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const bookCode=scalar(input.bookCode)?.toUpperCase();
  const partCode=scalar(input.partCode)?.toUpperCase();
  const activeLayer=scalar(input.activeLayer)?.toLowerCase();
  const scopeType=scalar(input.scopeType)?.toUpperCase();
  const isReconfiguration=scopeType==='CIVILIZATION_RECONFIGURATION_ATLAS'||bookCode==='BOOK-6';
  if(isReconfiguration){
    if(bookCode!=='BOOK-6'||partCode!=='PART-13'||!RECONFIG_LAYERS.has(activeLayer))return null;
    return Object.freeze({
      schemaVersion:'PHI-OS-ATLAS-RETRIEVAL-SCOPE-v2.0.0',
      scopeType:'CIVILIZATION_RECONFIGURATION_ATLAS',bookCode,partCode,activeLayer,
      entityId:scalar(input.entityId),caseIds:Object.freeze(list(input.caseIds,4)),
      windowId:scalar(input.windowId||input.transitionWindowId),snapshotId:scalar(input.snapshotId),
      dossierId:scalar(input.dossierId),livedRealityDimensionId:scalar(input.livedRealityDimensionId),
      sectionId:scalar(input.sectionId),comparisonIds:Object.freeze(list(input.comparisonIds,4)),
      evidenceClasses:Object.freeze(list(input.evidenceClasses).filter(item=>EVIDENCE_CLASSES.has(item)))
    });
  }
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

const RECONFIG_CONFIG=Object.freeze({
  cases:{path:'content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json',array:'cases',id:'id',stage:'RECONFIGURATION_CASE'},
  windows:{path:'content/civilization-atlas/reconfiguration/reconfiguration-windows-v1.json',array:'windows',id:'id',stage:'RECONFIGURATION_WINDOW'},
  snapshots:{path:'content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json',array:'snapshots',id:'id',stage:'WORLD_RECONFIGURATION_SNAPSHOT'},
  dossiers:{path:'content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json',array:'dossiers',id:'id',stage:'CONTEMPORARY_RUNTIME_DOSSIER'},
  lived:{path:'content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json',array:'dimensions',id:'id',stage:'LIVED_REALITY_LAYER'},
  sections:{path:'content/civilization-atlas/reconfiguration/book-vi-sections-v1.json',array:'sections',id:'id',stage:'BOOK_VI_CANONICAL_SECTION'}
});
const reconfigSelection=(scope)=>[...new Set([
 scope.entityId,scope.windowId,scope.snapshotId,scope.dossierId,scope.livedRealityDimensionId,scope.sectionId,
 ...(scope.caseIds||[]),...(scope.comparisonIds||[])
].filter(Boolean))];
const sourceFor=(record,idKey,stage,locale,question)=>({
  sourceType:'CIVILIZATION_ATLAS_ENTITY',
  sourceId:`ATLAS:BOOK-6:${stage}:${record[idKey]}`,
  bookCode:'BOOK-6',partCode:'PART-13',atlasLayer:stage.toLowerCase(),atlasEntityId:record[idKey],
  authorityClass:record.evidenceQuality||record.dataClass||'HISTORICAL_RECONSTRUCTION',
  scopeMatch:true,href:'/books/reality-configuration/#atlas',
  text:flattenLocalized(record,locale,question)
});

async function retrieveReconfigurationScope({env,scope,locale,question}){
  const ordered=['cases','windows','snapshots','dossiers','lived','sections'],loaded={};
  await Promise.all([...ordered.map(async key=>{loaded[key]=await readJson(env,RECONFIG_CONFIG[key].path);}),readJson(env,'content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json').then(v=>loaded.relationships=v)]);
  const selected=Object.fromEntries(ordered.map(k=>[k,new Set()])),wanted=reconfigSelection(scope);
  const rowsByKey=Object.fromEntries(ordered.map(k=>{const cfg=RECONFIG_CONFIG[k];return [k,loaded[k]?.[cfg.array]||[]]}));
  for(const id of wanted)for(const key of ordered){const cfg=RECONFIG_CONFIG[key];if(rowsByKey[key].some(row=>row?.[cfg.id]===id))selected[key].add(id);}
  const initial=Object.fromEntries(ordered.map(k=>[k,[...selected[k]]]));
  const add=(key,ids)=>{for(const id of ids||[])if(rowsByKey[key].some(row=>row?.[RECONFIG_CONFIG[key].id]===id))selected[key].add(id);};
  for(const id of initial.cases){const c=rowsByKey.cases.find(x=>x.id===id);add('windows',c?.relatedWindows);add('snapshots',c?.relatedSnapshots);add('dossiers',c?.relatedDossiers);add('sections',c?.relatedBookSections);}
  for(const id of initial.windows){const w=rowsByKey.windows.find(x=>x.id===id);add('cases',w?.majorCases);add('snapshots',w?.relatedSnapshots);}
  for(const id of initial.snapshots){const s=rowsByKey.snapshots.find(x=>x.id===id);add('cases',s?.majorReconfigurationCases);}
  for(const id of initial.sections){const r=(loaded.relationships?.relationships||[]).find(x=>x.bookSection===id);add('cases',r?.relatedCases);add('windows',r?.relatedWindows);add('snapshots',r?.relatedSnapshots);add('dossiers',r?.relatedDossiers);add('lived',r?.relatedLivedRealityDimensions);}
  for(const id of initial.dossiers)for(const r of loaded.relationships?.relationships||[])if((r.relatedDossiers||[]).includes(id)){add('sections',[r.bookSection]);add('cases',r.relatedCases);add('lived',r.relatedLivedRealityDimensions);}
  for(const id of initial.lived)for(const r of loaded.relationships?.relationships||[])if((r.relatedLivedRealityDimensions||[]).includes(id)){add('sections',[r.bookSection]);add('dossiers',r.relatedDossiers);}
  const directIds=[...new Set(wanted)];
  const directSources=[];
  for(const id of directIds){
    for(const key of ordered){
      const cfg=RECONFIG_CONFIG[key],record=rowsByKey[key].find(row=>row?.[cfg.id]===id);
      if(record){
        const source=sourceFor(record,cfg.id,cfg.stage,locale,question);
        if(source.text)directSources.push(source);
        break;
      }
    }
  }
  const expandedSources=[],stageRows=[];
  for(const key of ordered){
    const cfg=RECONFIG_CONFIG[key];
    const rows=rowsByKey[key].filter(row=>selected[key].has(row?.[cfg.id])).slice(0,8);
    const projected=rows.map(row=>sourceFor(row,cfg.id,cfg.stage,locale,question)).filter(source=>source.text);
    expandedSources.push(...projected.filter(source=>!directIds.includes(source.atlasEntityId)));
    stageRows.push({stage:cfg.stage,status:projected.length?'MATCHED':'NO_EXPLICIT_ENTITY_SELECTED',count:projected.length});
  }
  const sources=[...directSources,...expandedSources];
  const entityCount=directSources.length;
  return {scope,sources,chain:[{stage:'ATLAS_ENTITY',status:entityCount?'MATCHED':'NO_EXPLICIT_ENTITY_SELECTED',count:entityCount},...stageRows,{stage:'PART_13',status:'AUTHORIZED_FALLBACK'},{stage:'BROADER_KNOWLEDGE',status:'AUTHORIZED_FALLBACK'}]};
}

export async function retrieveAtlasScope({env={},scope,locale='zh-Hans',question=''}={}){
  const normalized=normalizeAtlasRetrievalScope(scope);
  if(!normalized)return {scope:null,sources:[],chain:[]};
  if(normalized.scopeType==='CIVILIZATION_RECONFIGURATION_ATLAS')return retrieveReconfigurationScope({env,scope:normalized,locale,question});
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
