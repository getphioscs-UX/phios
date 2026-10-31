const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

function paragraph(text,units,compositionRef,kind='READING'){
  if(!String(text||'').trim())return null;
  return freeze({kind,text:String(text).trim(),interpretationUnitRefs:uniq(units.map(unit=>unit.unitId)),compositionRef});
}

function sectionParagraphs(section,methodId,themeByUnit){
  const units=list(section.evidenceUnits),ref=`${methodId}:${section.sectionId}:SMR-v1`;
  if(!units.length)return [];
  if(section.sectionId==='CORE_READING')return units.slice(0,3).map(unit=>paragraph(unit.summary||unit.structuralReason||unit.plainLanguageExplanation,[unit],ref,'SUMMARY')).filter(Boolean);
  if(section.sectionId==='CORE_THEMES')return units.map(unit=>{
    const theme=themeByUnit.get(unit.unitId);
    const text=theme?`${theme.headline}: ${unit.summary||unit.structuralReason||unit.plainLanguageExplanation}`:(unit.summary||unit.structuralReason||unit.plainLanguageExplanation);
    return paragraph(text,[unit],ref,'THEME');
  }).filter(Boolean);
  if(section.sectionId==='SUPPORT_CONDITIONS')return units.slice(0,4).map(unit=>paragraph(unit.constructiveExpression||unit.plainLanguageExplanation,[unit],ref,'SUPPORT')).filter(Boolean);
  if(section.sectionId==='COST_PRESSURE')return units.slice(0,4).map(unit=>paragraph(unit.frictionExpression||list(unit.alternativeInterpretations)[0],[unit],ref,'COST')).filter(Boolean);
  if(section.sectionId==='REALITY_VERIFICATION')return units.slice(0,7).flatMap(unit=>[
    ...list(unit.observableSignals).map(text=>paragraph(text,[unit],ref,'OBSERVABLE_SIGNAL')),
    ...list(unit.realityComparisonQuestions||unit.openQuestions).map(text=>paragraph(text,[unit],ref,'REALITY_QUESTION'))
  ]).filter(Boolean).slice(0,7);
  if(section.sectionId==='OPEN_UNCERTAINTY')return units.slice(0,4).map(unit=>paragraph(list(unit.alternativeInterpretations)[0]||unit.confidenceBoundary||list(unit.uncertainties)[0],[unit],ref,'OPEN')).filter(Boolean);
  if(section.sectionId==='FINAL_READING')return units.slice(0,3).map(unit=>paragraph(unit.plainLanguageExplanation||unit.body||unit.summary,[unit],ref,'FINAL')).filter(Boolean);
  return units.slice(0,4).map(unit=>paragraph(unit.plainLanguageExplanation||unit.body||unit.summary,[unit],ref)).filter(Boolean);
}

export function composeMethodSections({methodId,sectionResolution,themes,formula,coverageMatchers}={}){
  const themeByUnit=new Map(list(themes).flatMap(theme=>theme.interpretationUnitRefs.map(ref=>[ref,theme])));
  const allUnits=list(sectionResolution?.sections).flatMap(section=>list(section.evidenceUnits));
  const corpus=uniq(allUnits.flatMap(unit=>[...list(unit.projectionRefs),...list(unit.meaningRefs),...list(unit.semanticTags),...list(unit.ruleRefs),...list(unit.derivationRefs)])).join(' ').toUpperCase();
  const formulaCoverage=Object.fromEntries(Object.entries(coverageMatchers||{}).map(([part,patterns])=>[part,list(patterns).some(pattern=>corpus.includes(String(pattern).toUpperCase()))]));
  const sections=list(sectionResolution?.sections).map(section=>freeze({
    sectionId:section.sectionId,
    order:section.order,
    title:section.title,
    state:section.state,
    interpretationUnitRefs:section.interpretationUnitRefs,
    semanticTags:section.semanticTags,
    paragraphs:section.state==='AVAILABLE'?sectionParagraphs(section,methodId,themeByUnit):[]
  }));
  return freeze({methodId,formula,formulaCoverage,sections,boundary:{acceptedUnitsOnly:true,newMeaningCreated:false,crossMethodComposition:false,technicalGlossaryDump:false}});
}
