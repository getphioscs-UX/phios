import {evaluateCareerIdentity} from './bazi-s04-identity-quality.js';
// R4 extends R3 for the explicitly admitted S04 review successor only.
// Heuristics support, never replace, the independent source-to-prose review.
export const EDITORIAL_R4_DIMENSIONS=Object.freeze(['causalExplanation','customerSpecificity','domainSpecificity','realityTranslation','scenarioDensity','thesisClarity','advantageCostBalance','conditionSpecificity','timingIntegration','navigationUsefulness','disclaimerCompression','primitiveSuppression','nameRemoval','sectionSubstitution','paragraphFunction','observableExpression']);
export const CSD_REVIEW_AUDIT_VERSION='CSD-REVIEW-v1.1.1';
export function containsEditorialQuote(text,quote){
 const normalize=s=>String(s||'').normalize('NFKC').replace(/\s+/gu,' ').toLocaleLowerCase().trim();
 const fragment=normalize(quote).replace(/^["“‘]|["”’]$/gu,'').replace(/[.!?;:。！？；：]+$/u,'').trim();
 return fragment.length>=8&&normalize(text).includes(fragment);
}
const primitive=/\b(?:structural tension|symbolic priority|carrying (?:condition|picture)|formation support|relationship modifier|self-position|semantic|operator|governance|claim)\b|当前结构|该组结构|承载条件|关系修正|形成支持|象征性解读/giu;
const disclaimer=/\b(?:not (?:a prediction|observed behavior)|symbolic reading|does not (?:predict|establish)|conditional reading|chart-based possibilities|final strong-or-weak judgment)\b|不预测|不代表已经|象征性|不认定|不证明|待实际工作检验的命盘|最终强弱与格局判断/iu;
const method=/\b(?:ten gods?|percentage|semantic|operator|reading priority|pattern label)\b|十神|占比|格局名称|读取优先/iu;
const domain=/\b(?:deadline|deliver\w*|client|budget|staff\w*|promotion|manager\w*|team|project|approval|workload|pricing|mentor\w*|training|decision|role|accountability|responsibility|authority|preparation|review time|scope|mandate|expertise|handoff|revision)\b|交付|客户|预算|人员|晋升|管理|团队|项目|审批|工作量|定价|指导|培训|决策|岗位|职责|责任|产出|专业|期限|复核|授权|交接/iu;
const consequence=/\b(?:if|when|because|without|while|otherwise|can|may|cost\w*|rather|depends?|unless|match\w*|keep\w*|make\w*|agree\w*|compare\w*|check\w*|review\w*|define\w*|identify|write|tie\w*|set\w*|protect\w*|offer\w*|provide\w*|improve\w*|support\w*|require\w*|meet\w*|test\w*|sustainable|useful|convert\w*)\b|如果|当|若|因为|却|否则|可能|成本|取决于|才能|有助于|需要|对应|支持|帮助|连接|明确|核对|判断|检查|复查|比较|提供|可持续|更容易|适合|应|使|让/iu;
export function editorialSentences(value){return String(value||'').split(/(?<=[.!?。！？])\s*|\n+/u).map(x=>x.trim()).filter(Boolean);}
export function removePersonalIdentifiers(value,identifiers=[]){let s=String(value);for(const id of identifiers.filter(Boolean))s=s.split(id).join('');return s.replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b|\b\d{1,2}:\d{2}\b|\d+(?:\.\d+)?\s*[%％]/gu,'');}
export function evaluateCustomerEditorialR4({brief,candidate,verification,identifiers=[]}){
 const blocks=candidate?.blocks||[],ir=brief.careerNarrativeIR,reasons=[];
 const whole=blocks.map(b=>b.text).join('\n'),sentences=editorialSentences(whole),total=Math.max(1,sentences.length);
 if(new Set(blocks.map(b=>b.text.trim())).size<blocks.length)reasons.push('PARAGRAPH_REPETITION');
 const count=fn=>sentences.filter(fn).length;
 const categories={DISCLAIMER:count(s=>disclaimer.test(s)),METHOD_EXPLANATION:count(s=>!disclaimer.test(s)&&method.test(s)),CUSTOMER_INTERPRETATION:count(s=>!disclaimer.test(s)&&!method.test(s)&&domain.test(s)&&consequence.test(s))};
 if(brief.identityContract&&verification?.semanticReview?.careerSentenceLabels){const labels=verification.semanticReview.careerSentenceLabels;categories.CUSTOMER_INTERPRETATION=labels.filter(x=>!['GENERIC_WORK_ADVICE','METHOD_EXPLANATION','DISCLAIMER'].includes(x.category)).length;categories.DISCLAIMER=Math.max(categories.DISCLAIMER,labels.filter(x=>x.category==='DISCLAIMER').length);categories.METHOD_EXPLANATION=Math.max(categories.METHOD_EXPLANATION,labels.filter(x=>x.category==='METHOD_EXPLANATION').length);}
 categories.RAW_FACT=sentences.length-Object.values(categories).reduce((a,b)=>a+b,0);
 const ratios=Object.fromEntries(Object.entries(categories).map(([k,v])=>[k,Number((v/total).toFixed(3))]));
 const exposed=[...whole.matchAll(primitive)].map(m=>m[0].toLowerCase());
 const repeatedDisclaimers=sentences.filter(s=>disclaimer.test(s));
 const observable=editorialSentences(blocks.filter(b=>b.role==='OBSERVABLE_EXPRESSION').map(b=>b.text).join('\n'));
 const observableUseful=brief.identityContract?(()=>{let offset=0,count=0;const labels=verification?.semanticReview?.careerSentenceLabels||[];for(const b of blocks){const ss=editorialSentences(b.text);if(b.role==='OBSERVABLE_EXPRESSION')count+=ss.filter((s,i)=>!/[?？]/u.test(s)&&labels.some(x=>x.sentenceIndex===offset+i&&!['GENERIC_WORK_ADVICE','METHOD_EXPLANATION','DISCLAIMER'].includes(x.category))).length;offset+=ss.length;}return count;})():observable.filter(s=>domain.test(s)&&consequence.test(s)&&!/[?？]/u.test(s)).length;
 const observationQuestionRatio=observable.filter(s=>/[?？]/u.test(s)).length/Math.max(1,observable.length);
 const used=new Set(verification?.semanticReview?.meaningfullyUsedClaimRefs||[]);
 const meaningfulNodes=(ir?.nodes||[]).filter(n=>used.has(n.id));
 const density={thesis:blocks.filter(b=>b.role==='CAREER_THESIS').length,causalChains:meaningfulNodes.filter(n=>n.kind==='CAUSAL_CHAIN').length,scenarios:meaningfulNodes.filter(n=>n.kind==='SCENARIO').length,contrasts:used.has('CSD:TRADEOFFS')?ir.causalChains.filter(n=>used.has(n.nodeId)).length:0,environmentDistinctions:used.has('CSD:CONDITIONS')?ir.causalChains.filter(n=>used.has(n.nodeId)).length:0,sustainable:used.has('CSD:CONDITIONS')?1:0,unsustainable:used.has('CSD:CONDITIONS')?1:0,synthesizedFacts:uniqueFacts(meaningfulNodes),timingWhenAvailable:ir?.timingAmplifiers.length?Number(used.has('CSD:TIMING')):1,decisionSequence:Number(used.has('CSD:DECISION'))};
 for(const [key,min] of Object.entries(brief.customerValueContract.minimums))if(density[key]<min)reasons.push('CUSTOMER_DEPTH_MISSING:'+key);
 const thesis=blocks.filter(b=>b.role==='CAREER_THESIS');if(thesis.length!==1||editorialSentences(thesis[0]?.text).length>3)reasons.push('CAREER_THESIS_INVALID');
 const scenarioClasses=new Set(meaningfulNodes.filter(n=>n.kind==='SCENARIO').map(n=>n.scenarioClass));if(scenarioClasses.size<4)reasons.push('SCENARIO_DIVERSITY_FAIL');
 if(exposed.length>2||exposed.some((x,i)=>exposed.indexOf(x)!==i))reasons.push('SEMANTIC_PRIMITIVE_EXPOSURE');
 if((!brief.identityContract&&repeatedDisclaimers.length>2)||ratios.DISCLAIMER>.10||new Set(repeatedDisclaimers).size<repeatedDisclaimers.length)reasons.push('DISCLAIMER_REPETITION');
 if(ratios.METHOD_EXPLANATION>.15||ratios.CUSTOMER_INTERPRETATION<.70)reasons.push('CUSTOMER_VALUE_SENTENCE_RATIO');
 if(!observable.length||observationQuestionRatio>.30||observableUseful/Math.max(1,observable.length)<.70)reasons.push('OBSERVABLE_EXPRESSION_RATIO');
 const stripped=removePersonalIdentifiers(whole,identifiers),strippedSentences=editorialSentences(stripped);
 const nameRemovalHeuristic=brief.identityContract?ratios.CUSTOMER_INTERPRETATION>=.70:strippedSentences.filter(s=>domain.test(s)&&consequence.test(s)).length/Math.max(1,strippedSentences.length)>=.70;
 const substitutionHeuristic=blocks.filter(b=>domain.test(b.text.replace(/\b(?:career|work)\b|事业|工作/giu,''))).length/Math.max(1,blocks.length)>=.70;
 if(!nameRemovalHeuristic)reasons.push('NAME_REMOVAL_FAIL');if(!substitutionHeuristic)reasons.push('SECTION_SUBSTITUTION_FAIL');
 const assessments=verification?.semanticReview?.editorialAssessments||[];
 for(const dimension of EDITORIAL_R4_DIMENSIONS){const rows=assessments.filter(r=>r.dimension===dimension);if(rows.length!==1||rows[0].passed!==true||!containsEditorialQuote(whole,rows[0].evidence))reasons.push('EDITORIAL_REVIEW_REQUIRED:'+dimension);}
 for(const b of blocks)if(!brief.paragraphFunctions.includes(b.function))reasons.push('PARAGRAPH_FUNCTION_INVALID');
 const identityQuality=brief.identityContract?evaluateCareerIdentity({brief,candidate:{blocks},review:verification?.semanticReview,containsQuote:containsEditorialQuote,sentences:editorialSentences}):null;
 if(identityQuality)reasons.push(...identityQuality.reasons);
 return {identityQuality,version:'PHI-OS-REPORT-EDITORIAL-QUALITY-R4-v1.1.1',state:reasons.length?'EDITORIAL_AUTOMATED_FAIL':'EDITORIAL_AUTOMATED_PASS',accepted:!reasons.length,customerSpecificityDensity:density,sentenceRatios:ratios,observableInterpretationRatio:observableUseful/Math.max(1,observable.length),primitiveExposure:exposed,disclaimerCount:repeatedDisclaimers.length,nameRemoval:nameRemovalHeuristic?'PASS':'FAIL',sectionSubstitution:substitutionHeuristic?'PASS':'FAIL',assessments,reasons,thresholdStatus:'INITIAL_CALIBRATION',ownerAcceptance:'PENDING',productionEligible:false};
}
function uniqueFacts(nodes){return new Set(nodes.filter(n=>n.kind==='CAUSAL_CHAIN').flatMap(n=>n.inputs||[]).map(x=>x.ref)).size;}
export function crossSubjectDistinguishability(rows){
 const dimensions=['mechanisms','scenarios','tradeoffs','conditions','timing'];
 const signatures=rows.map(r=>({id:r.id,mechanisms:r.ir.nodes.filter(n=>n.kind==='CAUSAL_CHAIN').map(n=>n.ruleId).join('|'),scenarios:r.ir.nodes.filter(n=>n.kind==='SCENARIO').map(n=>n.scenarioClass).join('|'),tradeoffs:r.ir.careerCosts.map(n=>n.text).join('|'),conditions:r.ir.environmentFit.map(n=>n.text).join('|'),timing:JSON.stringify(r.ir.nodes.filter(n=>n.kind==='TIMING').map(n=>n.layers.map(l=>l.emphasis.map(e=>e.group))))}));
 const diversity=Object.fromEntries(dimensions.map(k=>[k,new Set(signatures.map(s=>s[k])).size]));
 const prosePairs=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=new Set(editorialSentences(removePersonalIdentifiers(rows[i].text||''))),b=new Set(editorialSentences(removePersonalIdentifiers(rows[j].text||'')));const shared=[...a].filter(x=>b.has(x)).length;prosePairs.push({a:rows[i].id,b:rows[j].id,overlap:shared/Math.max(1,Math.min(a.size,b.size))});}
 const accepted=rows.length>=3&&Object.values(diversity).every(n=>n>=2)&&prosePairs.every(p=>p.overlap<.7);
 return {accepted,diversity,prosePairs,signatures,scope:'DETERMINISTIC_SYNTHESIS_AND_PROSE_FIXTURES',liveCrossSubjectEditorialValidation:false};
}
