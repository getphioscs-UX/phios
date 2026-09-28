export const REPORT_EDITORIAL_QUALITY_R3='PHI-OS-REPORT-EDITORIAL-QUALITY-R3-v1.1.0';
const GOVERNANCE=/\b(?:claim|admitted|authority|source-bound|verdict|governed inventory|runtime tier|semantic verifier)\b|(?:已核准|来源指定|本报告保留|判断权限|运行层级|语义验证)/giu;
const TECHNICAL=/\b(?:claimIr|sourceRefs|sectionKey|relationType|semanticOperators|OPEN_REQUIRES_MORE_FORMATION_SUPPORT)\b|(?:透干|藏干|格局候选|语义算子)/giu;
const TEMPLATE=[/值得注意的是/gu,/这意味着/gu,/在某些情况下/gu,/相关主题/gu,/你可能会/gu,/从这个角度来看/gu,/it is worth noting/giu,/this means/giu,/in some cases/giu,/you may/giu,/from this perspective/giu];
function text(v){return String(v??'');}
function count(re,s){return (s.match(re)||[]).length;}
function chars(s){return Math.max(1,[...s].length);}
function meaningfulUnits(s){const v=text(s).trim();if(!v)return 0;return /[\u3400-\u9fff]/u.test(v)?[...v.replace(/\s/g,'')].length:v.split(/\s+/).filter(Boolean).length;}
function sentenceStarts(s){return s.split(/[。！？.!?]+/u).map(x=>x.trim()).filter(Boolean).map(x=>x.split(/[，,\s]+/u).slice(0,3).join(' ').toLowerCase());}
function repeatedNumbers(s){const nums=s.match(/\b\d+(?:\.\d+)?%?\b/g)||[],m=new Map();for(const n of nums)m.set(n,(m.get(n)||0)+1);return [...m.entries()].filter(([,c])=>c>1).reduce((a,[,c])=>a+c-1,0);}
function roleUnits(blocks,role){return blocks.filter(b=>b.role===role).reduce((n,b)=>n+meaningfulUnits(b.text),0);}

export function evaluateReportEditorialQuality({paragraphs=[],blocks=[],claimCoverage=null,requiredRoles=[],presentRoles=[],otherSectionTexts=[],sectionSpecificTerms=[]}={}){
 const normalizedBlocks=Array.isArray(blocks)&&blocks.length?blocks:paragraphs.map(text=>({role:'MEANING',text}));
 const ps=normalizedBlocks.map(b=>text(b.text)),s=ps.join('\n'),n=chars(s),starts=sentenceStarts(s),freq=new Map();
 for(const x of starts)freq.set(x,(freq.get(x)||0)+1);
 const repeatedStarts=[...freq.entries()].filter(([,c])=>c>1).reduce((a,[,c])=>a+c-1,0);
 const templateHits=TEMPLATE.reduce((a,re)=>a+count(re,s),0);
 const words=s.toLowerCase().split(/\s+|(?=[\u3400-\u9fff])|(?<=[\u3400-\u9fff])/u).filter(Boolean);
 const otherMax=otherSectionTexts.reduce((m,o)=>{const set=new Set(text(o).toLowerCase().split(/\s+/).filter(Boolean)),shared=words.filter(w=>w.length>2&&set.has(w)).length;return Math.max(m,words.length?shared/words.length:0);},0);
 const missingRoles=requiredRoles.filter(r=>!presentRoles.includes(r));
 const totalUnits=normalizedBlocks.reduce((sum,b)=>sum+meaningfulUnits(b.text),0);
 const governanceHits=count(GOVERNANCE,s),technicalHits=count(TECHNICAL,s);
 const roleSet=new Set(normalizedBlocks.map(b=>b.role));
 const customerRoles=new Set(['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION']);
 const customerUnits=normalizedBlocks.filter(b=>customerRoles.has(b.role)).reduce((sum,b)=>sum+meaningfulUnits(b.text),0);
 const specificHits=sectionSpecificTerms.filter(Boolean).reduce((sum,term)=>sum+(s.toLowerCase().includes(String(term).toLowerCase())?1:0),0);
 const lengths=ps.map(meaningfulUnits).filter(Boolean),uniqueLengths=new Set(lengths.map(x=>Math.round(x/10)*10)).size;
 return Object.freeze({
  schemaVersion:REPORT_EDITORIAL_QUALITY_R3,
  meaningfulUnits:totalUnits,
  technicalDensity:Number((technicalHits/n).toFixed(5)),
  numberRepetition:repeatedNumbers(s),
  governanceJargonDensity:Number((governanceHits/n).toFixed(5)),
  templatePhraseRepetition:templateHits,
  sentenceOpeningRepetition:repeatedStarts,
  paragraphVariety:lengths.length?Number((uniqueLengths/lengths.length).toFixed(4)):0,
  claimCoverage:claimCoverage==null?null:Number(claimCoverage),
  explanationChainCoverage:requiredRoles.length?Number(((requiredRoles.length-missingRoles.length)/requiredRoles.length).toFixed(4)):1,
  missingRoles,
  sectionSpecificity:sectionSpecificTerms.length?Number((specificHits/sectionSpecificTerms.length).toFixed(4)):null,
  crossSectionSimilarity:Number(otherMax.toFixed(4)),
  customerInterpretationRatio:totalUnits?Number((customerUnits/totalUnits).toFixed(4)):0,
  realityExplanationDensity:totalUnits?Number((roleUnits(normalizedBlocks,'OBSERVABLE_EXPRESSION')/totalUnits).toFixed(4)):0,
  timingExplanationDepth:Object.freeze({present:roleSet.has('TIMING_RELEVANCE'),units:roleUnits(normalizedBlocks,'TIMING_RELEVANCE')}),
  navigationDepth:Object.freeze({present:roleSet.has('NAVIGATION'),units:roleUnits(normalizedBlocks,'NAVIGATION')}),
  calibrationState:'OWNER_EXEMPLAR_REQUIRED',
  machineAcceptanceDoesNotEqualHumanAcceptance:true
 });
}
export default Object.freeze({evaluateReportEditorialQuality});
