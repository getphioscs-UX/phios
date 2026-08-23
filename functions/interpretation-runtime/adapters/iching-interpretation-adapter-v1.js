/** PHI OS ICHI-W0-W5 validation-only, source-bound I Ching interpretation adapter. */
export const ICHING_INTERPRETATION_ADAPTER_CODE='ICHING_SOURCE_BOUND_INTERPRETATION_ADAPTER';
export const ICHING_INTERPRETATION_ADAPTER_VERSION='1.0.0';
const clone=v=>structuredClone(v);
function obj(v,m){if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError(m);}
function assertProjection(p){obj(p,'ICHING_CANONICAL_PROJECTION_REQUIRED');if(p.schemaVersion!=='PHI-OS-CANONICAL-PROJECTION-v1.0.0'||p.projectionType!=='HEXAGRAM'||p.projectionSource?.methodCode!=='I_CHING'||p.projectionSource?.pluginCode!=='ICH'||p.interpretationCreated!==false)throw new TypeError('INVALID_ICHING_CANONICAL_PROJECTION');}
function maps(registry,sourceRegistry,perspectiveRegistry){
  const hex=new Map((registry?.entries||[]).map(x=>[x.hexagramId,x]));
  const src=new Map((sourceRegistry?.sources||[]).map(x=>[x.sourceId,x]));
  const per=new Map((perspectiveRegistry?.perspectives||[]).map(x=>[x.perspectiveId,x]));
  if(hex.size!==64)throw new TypeError('ICHING_64_HEXAGRAM_REGISTRY_REQUIRED');
  return {hex,src,per};
}
function structural(entry){if(!entry)throw new TypeError('UNKNOWN_ICHING_HEXAGRAM_ID');return Object.freeze({hexagramId:entry.hexagramId,number:entry.number,canonicalName:entry.canonicalName,chineseName:entry.chineseName,upperTrigramId:entry.upperTrigramId,lowerTrigramId:entry.lowerTrigramId,binary:entry.binary,lineStructure:Object.freeze([...entry.lineStructure]),lineOrder:entry.lineOrder});}
function candidate(e,role,changingSet,src,per){
  if(!src.has(e.sourceId)||!per.has(e.perspectiveId))throw new TypeError('ICHING_COMMENTARY_SOURCE_OR_PERSPECTIVE_UNKNOWN');
  if(e.scope==='LINE'&&!Number.isInteger(e.linePosition))throw new TypeError('ICHING_LINE_COMMENTARY_MUST_BE_LINE_BOUND');
  return Object.freeze({claimId:e.claimId,hexagramId:e.hexagramId,hexagramRole:role,sourceId:e.sourceId,perspectiveId:e.perspectiveId,claim:e.claim,scope:e.scope,...(e.linePosition?{linePosition:e.linePosition,selectedBecauseChanging:role==='PRIMARY'&&changingSet.has(e.linePosition)}:{}),provenance:clone(e.provenance),sourceBound:true,canonicalStructureOverride:false,realityTruth:false,fateConclusion:false});
}
function group(candidates){
  const out=[]; const by=new Map();
  for(const c of candidates){let s=by.get(c.sourceId);if(!s){s={sourceId:c.sourceId,perspectives:new Map()};by.set(c.sourceId,s);}let p=s.perspectives.get(c.perspectiveId);if(!p){p=[];s.perspectives.set(c.perspectiveId,p);}p.push(c);}
  for(const s of by.values())out.push(Object.freeze({sourceId:s.sourceId,perspectives:Object.freeze([...s.perspectives.entries()].map(([perspectiveId,claims])=>Object.freeze({perspectiveId,claims:Object.freeze(claims)})))}));
  return Object.freeze(out);
}
export function adaptIChingProjection(projection,{hexagramRegistry,sourceRegistry,perspectiveRegistry,corpus,selectedSourceIds=null,selectedPerspectiveIds=null}={}){
  assertProjection(projection);obj(hexagramRegistry,'ICHING_HEXAGRAM_REGISTRY_REQUIRED');obj(sourceRegistry,'ICHING_SOURCE_REGISTRY_REQUIRED');obj(perspectiveRegistry,'ICHING_PERSPECTIVE_REGISTRY_REQUIRED');obj(corpus,'ICHING_CORPUS_REQUIRED');
  const {hex,src,per}=maps(hexagramRegistry,sourceRegistry,perspectiveRegistry); const pv=projection.projectionValue;
  const primary=structural(hex.get(pv.primary?.hexagramId)); const relating=structural(hex.get(pv.relating?.hexagramId));
  const changingLines=Object.freeze([...(pv.changingLines||[])]); const changingSet=new Set(changingLines);
  const sourceFilter=selectedSourceIds?new Set(selectedSourceIds):null, perspectiveFilter=selectedPerspectiveIds?new Set(selectedPerspectiveIds):null;
  const candidates=[];
  for(const e of corpus.entries||[]){
    if(sourceFilter&&!sourceFilter.has(e.sourceId))continue;if(perspectiveFilter&&!perspectiveFilter.has(e.perspectiveId))continue;
    let role=null;if(e.hexagramId===primary.hexagramId)role='PRIMARY';else if(e.hexagramId===relating.hexagramId)role='RELATING';else continue;
    if(e.scope==='LINE'&&role==='PRIMARY'&&!changingSet.has(e.linePosition))continue;
    if(e.scope==='LINE'&&role==='RELATING')continue;
    candidates.push(candidate(e,role,changingSet,src,per));
  }
  const covered=new Set((corpus.coverage?.coveredHexagrams||[]));
  return Object.freeze({schemaVersion:'PHI-OS-ICHING-SOURCE-BOUND-INTERPRETATION-v1.0.0',adapterCode:ICHING_INTERPRETATION_ADAPTER_CODE,adapterVersion:ICHING_INTERPRETATION_ADAPTER_VERSION,methodCode:'I_CHING',projectionRef:projection.projectionCode,structuralMeaning:Object.freeze({primary,changingLines,relating,linePositions:Object.freeze([1,2,3,4,5,6]),changingState:changingLines.length?'CHANGING_LINES_PRESENT':'NO_CHANGING_LINE'}),commentaryCandidates:Object.freeze(candidates),crossSourceComparison:group(candidates),coverage:Object.freeze({primary:covered.has(primary.hexagramId)?'SOURCE_COMMENTARY_AVAILABLE':'SOURCE_COMMENTARY_NOT_YET_INGESTED',relating:covered.has(relating.hexagramId)?'SOURCE_COMMENTARY_AVAILABLE':'SOURCE_COMMENTARY_NOT_YET_INGESTED',partialCorpus:corpus.coverage?.complete!==true}),authority:Object.freeze({canonicalStructureOwner:'I_CHING_STRUCTURAL_RUNTIME',commentaryOwner:'SOURCE_BOUND_INTERPRETATION_LAYER',adapterMayOverrideStructure:false,adapterMayCreateRealityTruth:false,adapterMayCreateFateConclusion:false}),sourceProjection:clone(projection)});
}
