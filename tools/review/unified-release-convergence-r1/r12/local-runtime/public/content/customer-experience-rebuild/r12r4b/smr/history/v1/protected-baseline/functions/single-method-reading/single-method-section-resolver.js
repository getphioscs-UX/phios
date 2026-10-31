import {SMR_SECTION_REGISTRY,localized} from './smr-registry-v1.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const timingAuthorised=context=>context?.status==='AUTHORISED'||context?.authorised===true||context?.authorityState==='AVAILABLE';

function chooseUnits(sectionId,units,themes,availableTimingContext){
  const byDomain=(...domains)=>units.filter(unit=>list(unit.domainTags).some(domain=>domains.includes(domain)));
  if(sectionId==='CORE_READING')return units.slice(0,Math.min(5,units.length));
  if(sectionId==='CORE_THEMES')return themes.map(theme=>units.find(unit=>unit.unitId===theme.interpretationUnitRefs[0])).filter(Boolean);
  if(sectionId==='NATURAL_OPERATION')return byDomain('IDENTITY_EXPRESSION','COMMUNICATION_EXCHANGE','ACTION_RHYTHM');
  if(sectionId==='SUPPORT_CONDITIONS')return units.filter(unit=>unit.relationType==='SUPPORT'||unit.constructiveExpression);
  if(sectionId==='COST_PRESSURE')return units.filter(unit=>unit.relationType==='TENSION'||unit.frictionExpression);
  if(sectionId==='DECISION_DIRECTION')return byDomain('ENVIRONMENT_DIRECTION','ACTION_RHYTHM','IDENTITY_EXPRESSION');
  if(sectionId==='WORK_RESOURCES')return byDomain('WORK_RESOURCES');
  if(sectionId==='RELATIONSHIP_EXCHANGE')return byDomain('RELATIONSHIP_EXCHANGE','COMMUNICATION_EXCHANGE');
  if(sectionId==='ENVIRONMENT_PRESSURE')return byDomain('ENVIRONMENT_DIRECTION','REGULATION_PRESSURE');
  if(sectionId==='TIMING')return timingAuthorised(availableTimingContext)?units.filter(unit=>unit.timingRelevant):[];
  if(sectionId==='REALITY_VERIFICATION')return units.filter(unit=>list(unit.observableSignals).length||list(unit.realityComparisonQuestions||unit.openQuestions).length);
  if(sectionId==='OPEN_UNCERTAINTY')return units.filter(unit=>list(unit.uncertainties).length||unit.confidenceBoundary||list(unit.alternativeInterpretations).length);
  if(sectionId==='FINAL_READING')return units.slice(0,Math.min(3,units.length));
  return [];
}

export function resolveSingleMethodSections({methodId,prioritizedUnits,themes,locale='en',availableTimingContext=null}={}){
  const units=list(prioritizedUnits),methodLabels=SMR_SECTION_REGISTRY.labels[methodId]||{};
  const sections=SMR_SECTION_REGISTRY.sections.map(definition=>{
    const evidenceUnits=chooseUnits(definition.sectionId,units,list(themes),availableTimingContext);
    const timingUnavailable=definition.sectionId==='TIMING'&&!timingAuthorised(availableTimingContext);
    const state=timingUnavailable?'NOT_APPLICABLE':evidenceUnits.length?'AVAILABLE':'NOT_ESTABLISHED';
    return freeze({
      sectionId:definition.sectionId,
      order:definition.order,
      title:localized(methodLabels[definition.sectionId]||[definition.sectionId,definition.sectionId],locale),
      state,
      optional:definition.optional,
      interpretationUnitRefs:evidenceUnits.map(unit=>unit.unitId),
      semanticTags:uniq(evidenceUnits.flatMap(unit=>unit.semanticTags)),
      evidenceUnits
    });
  });
  return freeze({schemaVersion:'PHI-OS-SMR-SECTION-ELIGIBILITY-v1.0.0',registryVersion:SMR_SECTION_REGISTRY.schemaVersion,methodId,sections,boundary:{genericSectionFill:false,timingAuthorityRequired:true,internalStatesNotCustomerCopy:true}});
}

