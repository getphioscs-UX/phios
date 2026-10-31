import {SMR_DOMAIN_REGISTRY,SMR_VERSIONS,localized} from './smr-registry-v1.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

function firstDomain(unit){return unit.primaryDomain||list(unit.domainTags).find(tag=>tag!=='CORE_STRUCTURE')||'CORE_STRUCTURE'}

function themeHeadline(domain,units,locale){
  const base=localized(SMR_DOMAIN_REGISTRY.labels[domain],locale);
  const lead=units[0]?.title;
  if(!lead)return base;
  return locale==='zh-Hans'?`${base}｜${lead}`:`${base} · ${lead}`;
}

export function clusterSingleMethodThemes({methodId,prioritizedUnits,locale='en'}={}){
  const groups=new Map();
  for(const unit of list(prioritizedUnits)){
    const domain=firstDomain(unit);
    if(!groups.has(domain))groups.set(domain,[]);
    groups.get(domain).push(unit);
  }
  let themes=[...groups.entries()].map(([domain,units])=>{
    const sorted=[...units].sort((a,b)=>b.priorityScore-a.priorityScore||String(a.unitId).localeCompare(String(b.unitId)));
    const priority=sorted.reduce((sum,unit)=>sum+unit.priorityScore,0);
    const supportingPatterns=uniq(sorted.flatMap(unit=>list(unit.priorityReasons).map(reason=>reason.code)));
    const tensions=sorted.filter(unit=>unit.relationType==='TENSION').map(unit=>({unitRef:unit.unitId,relationType:'TENSION',alternatives:list(unit.alternativeInterpretations)}));
    const weakSingle=sorted.length===1&&sorted[0].priorityScore<70;
    return {
      domain,
      priority,
      headline:themeHeadline(domain,sorted,locale),
      tier:weakSingle?'SUPPORTING_THEME':'CORE_THEME',
      interpretationUnitRefs:sorted.map(unit=>unit.unitId),
      semanticTags:uniq(sorted.flatMap(unit=>[...list(unit.semanticTags),...list(unit.domainTags)])),
      supportingPatterns,
      tensions,
      openQuestions:uniq(sorted.flatMap(unit=>list(unit.realityComparisonQuestions||unit.openQuestions))),
      confidenceBoundary:sorted.map(unit=>unit.confidenceBoundary).filter(Boolean)[0]||null,
      units:sorted
    };
  });
  themes.sort((a,b)=>b.priority-a.priority||SMR_DOMAIN_REGISTRY.order.indexOf(a.domain)-SMR_DOMAIN_REGISTRY.order.indexOf(b.domain));
  if(themes.length>7){
    const keep=themes.slice(0,6),tail=themes.slice(6);
    keep.push({domain:'CORE_STRUCTURE',priority:tail.reduce((sum,item)=>sum+item.priority,0),headline:localized(SMR_DOMAIN_REGISTRY.labels.CORE_STRUCTURE,locale),tier:'SUPPORTING_THEME',interpretationUnitRefs:uniq(tail.flatMap(item=>item.interpretationUnitRefs)),semanticTags:uniq(tail.flatMap(item=>item.semanticTags)),supportingPatterns:uniq(tail.flatMap(item=>item.supportingPatterns)),tensions:tail.flatMap(item=>item.tensions),openQuestions:uniq(tail.flatMap(item=>item.openQuestions)),confidenceBoundary:tail.map(item=>item.confidenceBoundary).find(Boolean)||null,units:tail.flatMap(item=>item.units)});
    themes=keep;
  }
  return freeze({schemaVersion:SMR_VERSIONS.themes,methodId,themeCount:themes.length,themes:themes.map((theme,index)=>freeze({...theme,themeId:`SMR-${methodId}-THEME-${String(index+1).padStart(2,'0')}`})),boundary:{semanticTagDriven:true,rendererClustering:false,weakSinglePromotedToCore:false}});
}
