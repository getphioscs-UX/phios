export const REPORT_EDITORIAL_QUALITY_R3='PHI-OS-REPORT-EDITORIAL-QUALITY-R3-v1.0.0';
const GOVERNANCE=/\b(?:claim|admitted|authority|source-bound|verdict|governed inventory|runtime tier|semantic verifier)\b|(?:已核准|来源指定|本报告保留|判断权限|运行层级|语义验证)/giu;
const TECHNICAL=/\b(?:claimIr|sourceRefs|sectionKey|relationType|semanticOperators|OPEN_REQUIRES_MORE_FORMATION_SUPPORT)\b|(?:透干|藏干|格局候选|语义算子)/giu;
const TEMPLATE=[/值得注意的是/gu,/这意味着/gu,/在某些情况下/gu,/相关主题/gu,/你可能会/gu,/从这个角度来看/gu,/it is worth noting/giu,/this means/giu,/in some cases/giu,/you may/giu,/from this perspective/giu];
const INTERPRETATION_ROLES=new Set(['MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION']);
function text(v){return String(v??'');}
function count(re,s){return (s.match(re)||[]).length;}
function units(s){return Math.max(0,[...text(s)].length);}
function sentenceStarts(s){return s.split(/[。！？.!?]+/u).map(x=>x.trim()).filter(Boolean).map(x=>x.split(/[，,\s]+/u).slice(0,3).join(' ').toLowerCase());}
export function evaluateReportEditorialQuality({paragraphs=[],blocks=[],claimCoverage=null,requiredRoles=[],presentRoles=[],otherSectionTexts=[]}={}){
 const normalizedBlocks=(Array.isArray(blocks)&&blocks.length?blocks:paragraphs.map(text=>({role:'MEANING',text}))).map(b=>({role:String(b?.role||'').toUpperCase(),text:text(b?.text)}));
 const s=normalizedBlocks.map(b=>b.text).join('\n'),n=Math.max(1,units(s)),starts=sentenceStarts(s),freq=new Map();
 for(const x of starts)freq.set(x,(freq.get(x)||0)+1);
 const repeatedStarts=[...freq.entries()].filter(([,c])=>c>1).reduce((a,[,c])=>a+c-1,0);
 const templateHits=TEMPLATE.reduce((a,re)=>a+count(re,s),0);
 const words=s.toLowerCase().split(/\s+|(?=[\u3400-\u9fff])|(?<=[\u3400-\u9fff])/u).filter(Boolean);
 const otherMax=otherSectionTexts.reduce((m,o)=>{const set=new Set(text(o).toLowerCase().split(/\s+/).filter(Boolean)),shared=words.filter(w=>w.length>2&&set.has(w)).length;return Math.max(m,words.length?shared/words.length:0);},0);
 const roles=[...new Set((presentRoles.length?presentRoles:normalizedBlocks.map(b=>b.role)).filter(Boolean))],missingRoles=requiredRoles.filter(r=>!roles.includes(r));
 const roleUnits=role=>normalizedBlocks.filter(b=>b.role===role).reduce((sum,b)=>sum+units(b.text),0);
 const interpretationUnits=normalizedBlocks.filter(b=>INTERPRETATION_ROLES.has(b.role)).reduce((sum,b)=>sum+units(b.text),0);
 const governanceUnits=count(GOVERNANCE,s),technicalUnits=count(TECHNICAL,s);
 const paragraphLengths=normalizedBlocks.map(b=>units(b.text)).filter(Boolean),avg=paragraphLengths.length?paragraphLengths.reduce((a,b)=>a+b,0)/paragraphLengths.length:0;
 const variance=paragraphLengths.length?paragraphLengths.reduce((a,b)=>a+Math.abs(b-avg),0)/paragraphLengths.length:0;
 return Object.freeze({
  schemaVersion:REPORT_EDITORIAL_QUALITY_R3,
  technicalDensity:Number((technicalUnits/n).toFixed(5)),
  governanceJargonDensity:Number((governanceUnits/n).toFixed(5)),
  templatePhraseRepetition:templateHits,
  sentenceOpeningRepetition:repeatedStarts,
  paragraphVariety:Number((avg?Math.min(1,variance/avg):0).toFixed(4)),
  claimCoverage:claimCoverage==null?null:Number(claimCoverage),
  explanationChainCoverage:requiredRoles.length?Number(((requiredRoles.length-missingRoles.length)/requiredRoles.length).toFixed(4)):1,
  missingRoles,
  crossSectionSimilarity:Number(otherMax.toFixed(4)),
  customerInterpretationRatio:Number((interpretationUnits/n).toFixed(4)),
  realityExplanationDensity:Number((roleUnits('OBSERVABLE_EXPRESSION')/n).toFixed(4)),
  timingExplanationDepth:Number((roleUnits('TIMING_RELEVANCE')/n).toFixed(4)),
  navigationDepth:Number((roleUnits('NAVIGATION')/n).toFixed(4)),
  sectionSpecificity:claimCoverage==null?null:Number(claimCoverage),
  calibrationState:'OWNER_EXEMPLAR_REQUIRED',
  machineAcceptanceDoesNotEqualHumanAcceptance:true
 });
}
export default Object.freeze({evaluateReportEditorialQuality});
