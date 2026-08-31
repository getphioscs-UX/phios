import crypto from 'node:crypto';
import {buildHumanDesignR3ProfessionalReadingIr} from './human-design-r3-reading-ir-v2.js';

export const HD_R3_EDITORIAL_VERSION='PHI-OS-HD-PRO-R3-W16-CUSTOMER-EDITORIAL-v1.0.0';
const zh=(en,zhHans)=>({en,zhHans});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);
const INTERNAL_TERMS=['canonical','claim ir','semantic owner','source_admitted','composition supported','projection digest','authority registry','semantic_admitted'];

const replacements=[
  [/primary semantic owner/gi,'main explanation'],
  [/semantic owner/gi,'explanation source'],
  [/claim ir/gi,'technical trace'],
  [/SOURCE_ADMITTED/gi,'source reviewed'],
  [/SEMANTIC_ADMITTED/gi,'meaning reviewed'],
  [/composition supported/gi,'combined reading available'],
  [/projection digest/gi,'technical fingerprint'],
  [/authority registry/gi,'source register'],
  [/primary semantic owner/gi,'主要解释'],
  [/semantic owner/gi,'解释来源'],
  [/generic meaning/gi,'基础说明']
];
function customerize(v){
  if(typeof v==='string') return replacements.reduce((s,[re,to])=>s.replace(re,to),v);
  if(Array.isArray(v)) return v.map(customerize);
  if(v&&typeof v==='object') return Object.fromEntries(Object.entries(v).map(([k,val])=>[k,customerize(val)]));
  return v;
}
function prose(f,index){
  const variant=index%4;
  const finding=customerize(f.finding), combine=customerize(f.howStructuresCombine), why=customerize(f.whyThisAppears), reality=customerize(f.realLifeExpression), counter=customerize(f.whatWouldContradictIt);
  if(variant===0) return Object.freeze({layout:'FINDING_THEN_EVIDENCE',headline:finding,body:combine,why,observe:reality,counterpoint:counter});
  if(variant===1) return Object.freeze({layout:'REALITY_FIRST',headline:finding,body:reality,why,observe:combine,counterpoint:counter});
  if(variant===2) return Object.freeze({layout:'WHY_FIRST',headline:finding,body:why,why:combine,observe:reality,counterpoint:counter});
  return Object.freeze({layout:'CONTRAST',headline:finding,body:combine,why,observe:reality,counterpoint:counter});
}

function renderSection(section){
  const rows=Array.isArray(section.findings)?section.findings:[];
  const customerCards=rows.filter(x=>x&&x.findingId&&x.finding).map((f,i)=>Object.freeze({cardId:`EDITORIAL-${f.findingId}`,tier:f.tier,semanticRole:f.semanticRole,...prose(f,i)}));
  const customerQuestions=rows.filter(x=>x&&x.findingId&&x.question).map(x=>Object.freeze({findingId:x.findingId,question:customerize(x.question)}));
  return Object.freeze({sectionId:section.sectionId,order:section.order,title:section.title,customerCards:Object.freeze(customerCards),customerQuestions:Object.freeze(customerQuestions),chartSummary:customerize(section.chartSummary)||undefined,customerNote:customerize(section.customerNote)||undefined,boundarySummary:customerize(section.boundarySummary)||undefined,technicalTraceAvailable:Boolean(section.technicalTraceAvailable)});
}

function containsInternal(value){
  const s=JSON.stringify(value).toLowerCase();
  return INTERNAL_TERMS.filter(t=>s.includes(t));
}

export function editorializeHumanDesignR3Reading(facts={},options={}){
  const readingIr=options.readingIr||buildHumanDesignR3ProfessionalReadingIr(facts,options);
  const customerSections=readingIr.sections.map(renderSection);
  const leaks=containsInternal(customerSections);
  const result={
    schemaVersion:HD_R3_EDITORIAL_VERSION,
    readingIrDigest:readingIr.readingIrDigest,
    customerSections:Object.freeze(customerSections),
    technicalTrace:Object.freeze({available:true,defaultVisible:false,claimIds:readingIr.technical.claimIds,structureRefs:readingIr.technical.structureRefs,sourceRefs:readingIr.technical.sourceRefs,compositionRuleIds:readingIr.technical.compositionRuleIds}),
    editorialPolicy:Object.freeze({internalEngineeringLanguageDefaultVisible:false,mechanicalSixHeadingTemplateRequired:false,variedCardLayouts:true,sourceAndTechnicalDetailsSeparated:true,forbiddenDefaultTerms:Object.freeze(INTERNAL_TERMS),detectedForbiddenTerms:Object.freeze(leaks)}),
    publication:Object.freeze({machineVerified:false,humanAccepted:false,customerPublishableR3:false})
  };
  return Object.freeze({...result,editorialDigest:digest(result)});
}

export function assertNoHumanDesignR3EditorialLeaks(editorial){
  const leaks=containsInternal(editorial?.customerSections||[]);
  if(leaks.length) throw new Error(`HD_R3_EDITORIAL_INTERNAL_LANGUAGE_LEAK:${leaks.join(',')}`);
  return true;
}
