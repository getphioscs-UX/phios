import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
export const MEANING_CANON_VERSION='BAZI_EDITORIAL_MEANING_CANON_V2';
export const QUALITY_VERSION='BAZI_EDITORIAL_QUALITY_F_V2';
export const METRICS_VERSION='BAZI_EDITORIAL_METRICS_F_V2';
export const S02_REVISION='BAZI_S02_EDITORIAL_SCOPE_R2';
export const S02_SCOPE_INSTRUCTIONS='For S02 follow scopeDistribution. General no-observed-effect and no-prediction limits may be stated once in boundaryNote and apply to every explicitly symbolic/structural paragraph. This is editorial placement only: do not remove a substantive condition, turn a relation into a real-life effect, or promote a reading priority into a measured trait. Keep unresolved verdicts local, each pair separate, secondary rank explicit, and dimensions simultaneous. Verify each paragraph in the context of that explicit shared scope; reject absent shared scope or any contradictory assertion. Do not demand the same general disclaimer after each pair. Keep the measurement caveat once in lead, not again in headline or closingInsight. Use closingInsight to retain the dimensions together, rather than repeat the primary theme list.';
export const STYLE_CONTRACTS=deepFreeze({
 en:{version:'BAZI_EDITORIAL_EN_V1',voice:'Direct, concrete, calm English. Explain the admitted meaning rather than narrating the report machinery.',avoid:['source-designated','visible count','interface','the method records','this topic'],numbers:'No chart counts or percentages in narrative. Essential timing dates belong to the timing visual.',boundaries:'One local scope sentence; full method limits belong in Method & Appendix. Preserve every substantive uncertainty and condition.',structure:'Lead with the selected meaning; explain its specific context and tension; close with one licensed reflection. No invented examples or causal links.'},
 'zh-Hans':{version:'BAZI_EDITORIAL_ZH_V1',voice:'自然、清楚、克制的中文。直接说明已获许可的意义，不描述报告生成流程。',avoid:['来源指定','可见计数','接口','方法记录到','本章需要'],numbers:'叙事不复述图表百分比和计数；必要日期留在时间图表。',boundaries:'局部仅留一句范围说明，完整限制归入方法与附录；实质条件和不确定性必须保留。',structure:'以本节获许可的意义开篇，说明具体背景与张力，以获许可的观察问题收束。不新增行为实例或因果关系。'}
});
const relations=(claims,...types)=>claims.filter(c=>types.includes(c.relationType)).map(c=>({claimId:c.id,text:c.text,sourceRefs:c.sourceRefs,conditions:c.conditions,openConditions:c.openConditions,scope:'SECTION_CONTEXT_NOT_AN_ADDITIONAL_THEME_RELATION'}));
// An editorial projection of admitted Claim IR. Empty facets stay empty; no
// meaning, rule, ranking, contrast or real-world manifestation is manufactured.
export async function withEditorialMeaningBrief(pack){
 if(pack.editorialQualityVersion===QUALITY_VERSION&&(pack.sectionKey!=='S02_PERSONALITY'||pack.sectionNarrativeBrief?.editorialRevision===S02_REVISION))return pack;
 const claims=pack.licensedClaims||[];
 const themes=claims.filter(c=>c.relationType!=='BOUNDARY').map(c=>({themeId:c.id,customerMeaning:{claimId:c.id,text:c.text},roleInWholeChart:{rank:c.rank,relationType:c.relationType,subject:c.subject,objects:c.objects},
  supportingContext:relations(claims,'SUPPORT_CONDITION','CONTEXT_MODIFIER'),tension:relations(claims,'TENSION'),contrast:relations(claims,'CONTRAST'),openCondition:relations(claims,'OPEN_CONDITION'),
  allowedReflection:(pack.reflectionQuestions||[]).filter(q=>q.claimIds?.includes(c.id)),prohibitedInference:['CAUSE','SEQUENCE','BEHAVIORAL_EFFECT','EVENT_INFERENCE','REALITY_ASSERTION'],sourceRefs:c.sourceRefs,conditions:c.conditions,openConditions:c.openConditions}));
 const canon={version:MEANING_CANON_VERSION,sectionKey:pack.sectionKey,locale:pack.locale,themes,sourceLineage:pack.sourceLineage,createsMeaning:false};
 const meaningCanonDigest=await sha256Stable(canon);
 const order=['EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS','OPERATING_CONDITION','SUPPORT_CONDITION','TENSION','CONTRAST','OPEN_CONDITION','TEMPORAL_RELEVANCE','CROSS_SECTION_RELEVANCE','ASSOCIATION','CONTEXT_MODIFIER'];
 const ordered=claims.filter(c=>c.relationType!=='BOUNDARY').slice().sort((a,b)=>order.indexOf(a.relationType)-order.indexOf(b.relationType)||(a.rank??999)-(b.rank??999)||a.id.localeCompare(b.id));
 const contentPlan=Object.fromEntries(Object.entries(pack.contentPlan).map(([field,ids])=>[field,ids.slice().sort((a,b)=>ordered.findIndex(c=>c.id===a)-ordered.findIndex(c=>c.id===b))]));
 const brief={version:'BAZI_SECTION_NARRATIVE_BRIEF_F_V1',sectionKey:pack.sectionKey,locale:pack.locale,meaningCanonDigest,orderedMeaningIds:ordered.map(c=>c.id),contentPlan,
  mainProseExcludes:['canonicalFacts','percentages','counts','technicalIdentifiers'],localScopeClaimId:claims.find(c=>c.relationType==='BOUNDARY')?.id||null,fullBoundaryDestination:'S10_APPENDIX',styleContract:STYLE_CONTRACTS[pack.locale],selectionRule:'Preserve admitted section scope, source ranks, distinct pairs and conditions; deterministic relation-role order; no unlicensed expansion.'};
 if(pack.sectionKey==='S02_PERSONALITY'){
  brief.editorialRevision=S02_REVISION;
  brief.scopeDistribution={version:S02_REVISION,sharedScope:{field:'boundaryNote',claimId:brief.localScopeClaimId,appliesTo:ordered.map(c=>c.id),required:true},measurementCaveat:{field:'lead',claimId:claims.find(c=>c.rank===1)?.id,maximumOccurrences:1},localConditions:ordered.map(c=>({claimId:c.id,conditions:c.conditions,openConditions:c.openConditions,relationType:c.relationType,subject:c.subject,objects:c.objects,rank:c.rank})),singleFieldPlan:{headline:'Name the primary theme briefly.',lead:'State the primary reading priority and its measurement caveat once.',closingInsight:'Retain the simultaneous dimensions; do not repeat the heading or primary theme list.'},instruction:S02_SCOPE_INSTRUCTIONS};
 }
 const {canonicalEvidenceHash,sourceEvidenceHash:originalHash,editorialQualityVersion:oldQuality,meaningCanon:oldCanon,sectionNarrativeBrief:oldBrief,sectionNarrativeBriefDigest:oldDigest,...source}=pack;
 const sourceEvidenceHash=originalHash||canonicalEvidenceHash;
 const enriched={...source,sourceEvidenceHash,editorialQualityVersion:QUALITY_VERSION,meaningCanon:canon,sectionNarrativeBrief:brief,sectionNarrativeBriefDigest:await sha256Stable(brief),contentPlan};
 return deepFreeze({...enriched,canonicalEvidenceHash:await sha256Stable(enriched)});
}
const technical=/functionalGroupId|professionalModules|sourceFactIds|canonical|interface|visible count|supportVisible|priorityRef|计数|接口|来源指定|承载支持/gi;
const boundary=/not (?:a |an )?(?:prediction|diagnosis|fact|proof|measurement)|not (?:as )?a measured|does not (?:establish|predict|prove)|cannot (?:establish|prove)|without establishing|不(?:代表|等于|证明|预测)|不能(?:据此)?(?:证明|建立|认定)|不是对[^。；;]{0,16}测量/gi;
const numbers=s=>s.match(/\d+(?:\.\d+)?\s*[%％]?/g)||[];
const tokens=s=>s.toLowerCase().match(/[a-z]+|[\u3400-\u9fff]/g)||[];
const shingles=s=>{const t=tokens(s);return new Set(t.slice(0,-4).map((_,i)=>t.slice(i,i+5).join(' ')));};
export function classifyEditorialText(text,{visual=false,boundaryRole=false,observation=false}={}){
 if(boundaryRole||boundary.test(text)){boundary.lastIndex=0;return 'BOUNDARY';}boundary.lastIndex=0;
 if(observation||/[?？]\s*$/.test(text))return 'OBSERVATION';
 if(visual||/\d+(?:\.\d+)?\s*[%％]|functionalGroupId|professionalModules|\b(?:count|ratio)\b|计数|占比/i.test(text))return 'TECHNICAL_DATA';
 if(/four pillars|day master|ten gods|BaZi organizes|四柱|十神|日主|八字围绕/i.test(text))return 'METHOD_EXPLANATION';
 return 'CUSTOMER_MEANING';
}
export function editorialQualityMetrics(text,{precedingVisualText='',otherSections=[],sectionTerms=[]}={}){
 const units=Math.max(1,tokens(text).length),technicalHits=[...text.matchAll(technical)].length,boundaryHits=[...text.matchAll(boundary)].length;
 const previous=new Set(numbers(precedingVisualText)),repeated=numbers(text).filter(n=>previous.has(n)).length;
 const sentences=text.split(/[.!?。！？]+/).map(s=>s.trim().toLowerCase()).filter(Boolean);
 // Repeated disclaimers can sit inside different sentences. Count complete
 // clauses too, while ignoring short list fragments such as "support".
 const clauses=text.split(/[.!?。！？,;，；]+/).map(s=>s.trim().toLowerCase()).filter(s=>tokens(s).length>=4);
 const duplicates=clauses.length-new Set(clauses).size;
 const here=shingles(text),similarity=otherSections.map(s=>{const there=shingles(s);return [...here].filter(x=>there.has(x)).length/Math.max(1,Math.min(here.size,there.size));});
 return {version:METRICS_VERSION,TECHNICAL_DENSITY:technicalHits/units,NUMBER_REPETITION:repeated,TEMPLATE_PHRASE_REPETITION:duplicates/Math.max(1,clauses.length),BOUNDARY_DENSITY:boundaryHits/Math.max(1,sentences.length),SECTION_SPECIFICITY:sectionTerms.length?sectionTerms.filter(s=>text.toLowerCase().includes(s.toLowerCase())).length/sectionTerms.length:null,CROSS_SECTION_SIMILARITY:similarity.length?Math.max(...similarity):null,counts:{units,sentences:sentences.length,clauses:clauses.length,repeatedClauses:duplicates,technicalHits,boundaryHits,comparisonSections:otherSections.length}};
}
export function validateEditorialQuality(n,pack){
 const fields=['headline','lead','interpretation','supportingConditions','tensionConditions','howThisMayShowUp','closingInsight'];
 const blocks=fields.flatMap(k=>Array.isArray(n?.[k])?n[k]:[n?.[k]]).filter(Boolean),text=blocks.map(b=>b.text||'').join(' ');
 const segmenter=new Intl.Segmenter(pack.locale,{granularity:'word'});
 const sectionTerms=[...new Set((pack.licensedClaims||[]).filter(c=>c.rank===1).flatMap(c=>[...segmenter.segment(c.text)].filter(s=>s.isWordLike&&s.segment.length>=(pack.locale==='en'?5:2)).map(s=>s.segment.toLowerCase())))].slice(0,12);
 const metrics=editorialQualityMetrics(text,{precedingVisualText:JSON.stringify(pack.canonicalFacts||[]),sectionTerms});
 const issues=[];
 if(metrics.TECHNICAL_DENSITY>0)issues.push('TECHNICAL_DENSITY');
 if(metrics.NUMBER_REPETITION>0||/\d+(?:\.\d+)?\s*[%％]/.test(text))issues.push('NUMBER_REPETITION');
 if(metrics.TEMPLATE_PHRASE_REPETITION>0)issues.push('TEMPLATE_PHRASE_REPETITION');
 if(metrics.counts.boundaryHits>1)issues.push('BOUNDARY_DENSITY');
 return {status:issues.length?'REJECT':'PASS',issues,metrics,humanAcceptance:false};
}
