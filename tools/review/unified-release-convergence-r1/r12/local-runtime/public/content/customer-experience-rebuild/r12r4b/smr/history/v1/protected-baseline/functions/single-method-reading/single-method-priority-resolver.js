import {SMR_DOMAIN_REGISTRY,SMR_METHOD_PRIORITY_REGISTRY} from './smr-registry-v1.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const unitId=unit=>unit.unitId||unit.interpretationUnitId;
const tokens=value=>String(value??'').toUpperCase().replace(/[^A-Z0-9_]+/g,' ').split(/\s+/).filter(Boolean);

function unitCorpus(unit){
  return uniq([
    ...list(unit.semanticTags),unit.subject,unit.relationType,unit.priority,unit.title,
    ...list(unit.projectionRefs),...list(unit.derivationRefs),...list(unit.ruleRefs)
  ]).join(' ').toUpperCase();
}

export function resolveSmrDomainTags(methodId,unit){
  const corpus=unitCorpus(unit);
  const registry=SMR_DOMAIN_REGISTRY.methodTokens[methodId]||{};
  const matched=SMR_DOMAIN_REGISTRY.order.filter(domain=>list(registry[domain]).some(token=>corpus.includes(token)));
  return freeze(matched.length?matched:['CORE_STRUCTURE']);
}

function primaryDomain(methodId,unit,domainTags){
  const subject=String(unit.subject||list(unit.semanticTags)[1]||'').toUpperCase();
  const exact={
    AST:{SUN:'IDENTITY_EXPRESSION',ASC:'IDENTITY_EXPRESSION',MOON:'REGULATION_PRESSURE',MERCURY:'COMMUNICATION_EXCHANGE',VENUS:'RELATIONSHIP_EXCHANGE',MARS:'ACTION_RHYTHM',JUPITER:'WORK_RESOURCES',SATURN:'REGULATION_PRESSURE',MC:'WORK_RESOURCES'},
    BZR:{YEAR:'ENVIRONMENT_DIRECTION',MONTH:'WORK_RESOURCES',DAY:'IDENTITY_EXPRESSION',HOUR:'ACTION_RHYTHM'},
    NUM:{LIFE_PATH:'ENVIRONMENT_DIRECTION',BIRTHDAY_NUMBER:'IDENTITY_EXPRESSION',ATTITUDE_NUMBER:'COMMUNICATION_EXCHANGE',BIRTH_YEAR_NUMBER:'WORK_RESOURCES',BIRTH_MONTH_NUMBER:'ACTION_RHYTHM'},
    ZWR:{LIFE:'IDENTITY_EXPRESSION',BODY:'IDENTITY_EXPRESSION',TRAVEL:'ENVIRONMENT_DIRECTION',MIGRATION:'ENVIRONMENT_DIRECTION',SIBLINGS:'RELATIONSHIP_EXCHANGE',SPOUSE:'RELATIONSHIP_EXCHANGE',CAREER:'WORK_RESOURCES',WEALTH:'WORK_RESOURCES',FORTUNE:'REGULATION_PRESSURE',HEALTH:'REGULATION_PRESSURE'}
  };
  return exact[methodId]?.[subject]||domainTags.find(tag=>tag!=='CORE_STRUCTURE')||'CORE_STRUCTURE';
}

function intentCorpus(customerIntent){
  if(!customerIntent)return '';
  if(typeof customerIntent==='string')return customerIntent.toUpperCase();
  return JSON.stringify(customerIntent).toUpperCase();
}

function timingAuthorised(context){
  return context?.status==='AUTHORISED'||context?.authorised===true||context?.authorityState==='AVAILABLE';
}

export function resolveInterpretationPriorities({methodId,interpretationUnits,customerIntent=null,availableTimingContext=null}={}){
  const units=list(interpretationUnits);
  const common=SMR_METHOD_PRIORITY_REGISTRY.common;
  const methodWeights=SMR_METHOD_PRIORITY_REGISTRY.methods[methodId]||{};
  const semanticCounts=new Map();
  const refCounts=new Map();
  for(const unit of units){
    for(const tag of uniq(unit.semanticTags))semanticCounts.set(tag,(semanticCounts.get(tag)||0)+1);
    for(const ref of uniq(unit.projectionRefs))refCounts.set(ref,(refCounts.get(ref)||0)+1);
  }
  const intent=intentCorpus(customerIntent);
  const output=units.map(unit=>{
    const corpus=unitCorpus(unit);
    const priorityReasons=[];
    let priorityScore=0;
    const priority=String(unit.priority||list(unit.semanticTags).find(tag=>tag==='PRIMARY'||tag==='SECONDARY')||'SECONDARY').toUpperCase();
    const base=priority==='PRIMARY'?common.primary:common.secondary;
    priorityScore+=base;priorityReasons.push({code:`UNIT_${priority}`,weight:base});
    const relation=String(unit.relationType||'').toUpperCase();
    const relationWeight={SUPPORT:common.supportRelation,TENSION:common.tensionRelation,ACTIVATION:common.activationRelation,DEPENDENCY:common.dependencyRelation,TRANSITION:common.activationRelation}[relation]||0;
    if(relationWeight){priorityScore+=relationWeight;priorityReasons.push({code:`RELATION_${relation}`,weight:relationWeight})}
    for(const [token,weight] of Object.entries(methodWeights)){
      if(corpus.includes(token)){priorityScore+=weight;priorityReasons.push({code:`${methodId}_${token}`,weight})}
    }
    const sharedRefs=uniq(unit.projectionRefs).filter(ref=>(refCounts.get(ref)||0)>1).length;
    if(sharedRefs){const weight=Math.min(12,sharedRefs*common.sharedProjectionRef);priorityScore+=weight;priorityReasons.push({code:'SHARED_PROJECTION_NETWORK',weight})}
    const repeatedTags=uniq(unit.semanticTags).filter(tag=>(semanticCounts.get(tag)||0)>1&&!['AST','BZR','NUM','ZWR','PRIMARY','SECONDARY'].includes(tag)).length;
    if(repeatedTags){const weight=Math.min(8,repeatedTags*common.repeatedSemanticTag);priorityScore+=weight;priorityReasons.push({code:'REPEATED_SEMANTIC_THEME',weight})}
    const domainTags=resolveSmrDomainTags(methodId,unit);
    const intentMatch=intent&&[...domainTags,...tokens(unit.title),...list(unit.semanticTags)].some(token=>intent.includes(String(token).replaceAll('_',' '))||intent.includes(String(token)));
    if(intentMatch){priorityScore+=common.customerIntentMatch;priorityReasons.push({code:'CUSTOMER_INTENT_RELEVANCE',weight:common.customerIntentMatch})}
    const hasTiming=timingAuthorised(availableTimingContext)&&/(TIMING|CYCLE|TRANSIT|OVERLAY|PERIOD)/.test(corpus);
    if(hasTiming){priorityScore+=common.authorisedTiming;priorityReasons.push({code:'AUTHORISED_TIMING_RELEVANCE',weight:common.authorisedTiming})}
    return freeze({
      ...unit,
      unitId:unitId(unit),
      priorityScore,
      priorityReasons,
      domainTags,
      primaryDomain:primaryDomain(methodId,unit,domainTags),
      supportingRefs:freeze(uniq([...list(unit.projectionRefs),...list(unit.meaningRefs),...list(unit.derivationRefs),...list(unit.ruleRefs)])),
      timingRelevant:hasTiming
    });
  }).sort((a,b)=>b.priorityScore-a.priorityScore||String(a.unitId).localeCompare(String(b.unitId)));
  return freeze({schemaVersion:'PHI-OS-SMR-PRIORITY-RESOLUTION-v1.0.0',registryVersion:SMR_METHOD_PRIORITY_REGISTRY.schemaVersion,methodId,units:output,boundary:{deterministic:true,randomSort:false,priorityInventedByRenderer:false}});
}
