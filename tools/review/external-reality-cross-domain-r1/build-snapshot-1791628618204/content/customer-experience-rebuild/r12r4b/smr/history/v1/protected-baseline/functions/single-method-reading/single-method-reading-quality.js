const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const INTERNAL_LANGUAGE=/\b(?:CUSTOMER_PUBLISHABLE|COMPOSITION_SUPPORTED|MEANING_AVAILABLE|SOURCE_ADMITTED|projectionDigest|semanticDigest|derivationDigest)\b/;
const GENERIC_FILLER=[/you have (?:great|a lot of) potential/i,/believe in yourself/i,/保持平衡会让你更好/,/相信自己/,/你有很大的潜力/,/you (?:both|sometimes).*(?:independent|support)/i];
const ABSOLUTE_CLAIM=/(?:命中注定|你一定会|你就是|guaranteed|destined to|you will definitely)/i;
const TIMING_CLAIM=/(?:未来三个月|今年事业|明年财运|next three months|this year(?:'s)? career|next year(?:'s)? wealth)/i;

function paragraphs(ir){return list(ir?.sections).flatMap(section=>list(section.paragraphs))}

export function inspectSingleMethodReadingQuality(ir,{availableTimingContext=null}={}){
  const failures=[],allParagraphs=paragraphs(ir),text=allParagraphs.map(item=>item.text).join('\n');
  for(const item of allParagraphs){
    if(!list(item.interpretationUnitRefs).length&&!item.compositionRef)failures.push(`SMR_LINEAGE_MISSING:${item.kind||'PARAGRAPH'}`);
    if(GENERIC_FILLER.some(pattern=>pattern.test(item.text)))failures.push('SMR_GENERIC_FILLER');
    if(ABSOLUTE_CLAIM.test(item.text))failures.push('SMR_ABSOLUTE_CLAIM');
  }
  if(INTERNAL_LANGUAGE.test(text))failures.push('SMR_INTERNAL_CUSTOMER_LANGUAGE');
  const timingAuthorised=availableTimingContext?.status==='AUTHORISED'||availableTimingContext?.authorised===true||availableTimingContext?.authorityState==='AVAILABLE';
  if(!timingAuthorised&&TIMING_CLAIM.test(text))failures.push('SMR_UNSUPPORTED_TIMING');
  const boundaryCount=(text.match(/conditional structural interpretation|有条件的结构解释/g)||[]).length;
  if(boundaryCount>1)failures.push('SMR_EXCESSIVE_BOUNDARY_REPETITION');
  for(const section of list(ir?.sections).filter(section=>section.state==='AVAILABLE'&&['CORE_READING','CORE_THEMES','NATURAL_OPERATION','SUPPORT_CONDITIONS','COST_PRESSURE','DECISION_DIRECTION','WORK_RESOURCES','RELATIONSHIP_EXCHANGE','ENVIRONMENT_PRESSURE'].includes(section.sectionId))){
    const dimensions=uniq(list(section.paragraphs).flatMap(item=>list(item.specificityDimensions)));
    if(dimensions.length<2)failures.push(`SMR_SECTION_NOT_SPECIFIC:${section.sectionId}`);
  }
  for(const tension of list(ir?.tensions))if(!list(tension.interpretationUnitRefs).length)failures.push('SMR_TENSION_LINEAGE_MISSING');
  return Object.freeze({valid:failures.length===0,failures:uniq(failures),metrics:{paragraphCount:allParagraphs.length,boundaryRepetitionCount:boundaryCount,lineageBoundParagraphCount:allParagraphs.filter(item=>list(item.interpretationUnitRefs).length||item.compositionRef).length}});
}

export const SMR_QUALITY_BOUNDARY=Object.freeze({genericFillerAllowed:false,absolutePredictionAllowed:false,unsupportedTimingAllowed:false,contradictionFlatteningAllowed:false,reportLevelBoundaryMaximum:1});

