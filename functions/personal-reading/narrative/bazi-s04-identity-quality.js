export const CAREER_IDENTITY_DIMENSIONS=['careerOperatingStyle','valueCreationSpecificity','multiMechanismDifferentiation','advantageSpecificity','roleFunctionDifferentiation','scenarioSemanticDiversity','evidenceBridges','timingContrast','decisionPriorities','antiGenericWorkAdvice','editorialCompression','naturalCareerInterpretation'];
export const CAREER_SENTENCE_CATEGORIES=['CAREER_IDENTITY','VALUE_CREATION','MECHANISM_SYNTHESIS','ADVANTAGE','COST','ROLE_FIT','SCENARIO','TIMING_CONTRAST','DECISION_PRIORITY','METHOD_EXPLANATION','DISCLAIMER','GENERIC_WORK_ADVICE'];
export function checkCareerIdentityStructure(ir){
 const reasons=[],nodes=ir.nodes||[],mechanisms=nodes.filter(n=>n.kind==='CAUSAL_CHAIN'),scenarios=nodes.filter(n=>n.kind==='SCENARIO');
 if(!ir.careerOperatingStyle||!ir.valueCreationMode?.length)reasons.push('CAREER_IDENTITY_REQUIRED');
 if((ir.distinctCareerAdvantages||[]).length<2)reasons.push('DISTINCT_ADVANTAGES_REQUIRED');
 if(new Set(scenarios.map(n=>n.mechanismClass)).size<3||scenarios.length<4)reasons.push('SCENARIO_MECHANISM_DIVERSITY');
 const conclusions=scenarios.map(n=>n.conclusionClass);if(new Set(conclusions).size<4||conclusions.some(c=>!c||conclusions.filter(x=>x===c).length>scenarios.length/2))reasons.push('SCENARIO_CONCLUSION_COLLAPSE');
 if((ir.careerIdentityEvidence||[]).length<2)reasons.push('EVIDENCE_BRIDGES_REQUIRED');
 if((ir.roleSpectrum||[]).length<2)reasons.push('ROLE_FUNCTION_DIFFERENTIATION');
 if(ir.careerDecisionPriorities?.length<3||ir.careerDecisionPriorities?.length>4)reasons.push('DECISION_PRIORITIES_REQUIRED');
 for(const m of mechanisms)if(!m.sourceFacts?.length||!m.sourceClaimIds?.length||!m.sourceRefs?.length||!m.advantage||!m.cost||!m.conditions||!m.valueCreation)reasons.push('MECHANISM_SOURCE_OR_MEANING_MISSING:'+m.id);
 for(const e of ir.mechanismInteractions||[])if(!mechanisms.some(m=>m.id===e.from)||!mechanisms.some(m=>m.id===e.to)||!e.sourceClaimIds?.length)reasons.push('UNSUPPORTED_INTERACTION');
 for(const t of nodes.filter(n=>n.kind==='TIMING'))for(const key of ['natalCareerBaseline','daYunAmplifiedMechanism','annualAmplifiedMechanism','combinedTimingContrast','currentCareerQuestion'])if(!t[key]?.sourceClaimIds?.length)reasons.push('TIMING_CONTRAST_REQUIRED:'+key);
 return {accepted:!reasons.length,reasons};
}
export function evaluateCareerIdentity({brief,candidate,review,containsQuote,sentences}){
 const ir=brief.careerNarrativeIR,reasons=[...checkCareerIdentityStructure(ir).reasons],whole=candidate.blocks.map(b=>b.text).join('\n');
 const used=new Set(review?.meaningfullyUsedClaimRefs||[]),nodes=ir.nodes.filter(n=>used.has(n.id)),active=ir.nodes.filter(n=>n.kind==='CAUSAL_CHAIN');
 const coverage={activeMechanisms:active.map(n=>n.id),mechanismsExplained:nodes.filter(n=>n.kind==='CAUSAL_CHAIN').map(n=>n.id),mechanismsWithAdvantage:used.has('CSD:TRADEOFFS')?ir.distinctCareerAdvantages.filter(a=>used.has(a.sourceMechanism)).map(a=>a.sourceMechanism):[],mechanismsWithCost:used.has('CSD:TRADEOFFS')?active.filter(n=>used.has(n.id)).map(n=>n.id):[],mechanismsWithScenario:[...new Set(nodes.filter(n=>n.kind==='SCENARIO').flatMap(n=>n.mechanismIds))],mechanismsUsedInTiming:used.has('CSD:TIMING')?[...new Set(ir.nodes.filter(n=>n.kind==='TIMING').flatMap(n=>[n.daYunAmplifiedMechanism.primaryGroup,n.annualAmplifiedMechanism.primaryGroup]).map(k=>'CSD:V3:'+k))]:[]};
 if(coverage.mechanismsExplained.length!==active.length||coverage.mechanismsWithAdvantage.length<2||coverage.mechanismsWithScenario.length<3)reasons.push('MECHANISM_COVERAGE_FAIL');
 for(const d of CAREER_IDENTITY_DIMENSIONS){const rows=(review?.editorialAssessments||[]).filter(a=>a.dimension===d);if(rows.length!==1||!rows[0].passed||!containsQuote(whole,rows[0].evidence))reasons.push('IDENTITY_REVIEW_REQUIRED:'+d);}
 const labels=review?.careerSentenceLabels||[];const ss=sentences(whole);
 // Independent classification is bound to exact, numbered sentences supplied to
 // the reviewer. Missing/duplicate labels cannot dilute the generic-advice ratio.
 if(labels.length!==ss.length||new Set(labels.map(x=>x.sentenceIndex)).size!==ss.length||labels.some(x=>x.sentenceIndex<0||x.sentenceIndex>=ss.length||!CAREER_SENTENCE_CATEGORIES.includes(x.category)))reasons.push('CAREER_SENTENCE_CLASSIFICATION_REQUIRED');
 const counts=Object.fromEntries(CAREER_SENTENCE_CATEGORIES.map(k=>[k,labels.filter(x=>x.category===k).length]));
 const genericRatio=counts.GENERIC_WORK_ADVICE/Math.max(1,ss.length);if(genericRatio>.15)reasons.push('GENERIC_WORK_ADVICE_DOMINATES');
 for(const k of ['CAREER_IDENTITY','VALUE_CREATION','MECHANISM_SYNTHESIS','ADVANTAGE'])if(!counts[k])reasons.push('CAREER_VALUE_CATEGORY_MISSING:'+k);
 return {version:'CAREER_IDENTITY_QUALITY-v1.0.0',accepted:!reasons.length,reasons,coverage,sentenceCategories:counts,genericWorkAdviceRatio:genericRatio,scenarioConclusionClasses:nodes.filter(n=>n.kind==='SCENARIO').map(n=>n.conclusionClass),classificationScope:'INDEPENDENT_SENTENCE_REVIEW_PLUS_SOURCE_COVERAGE',ownerAcceptance:'PENDING'};
}
export function compareCareerIdentities(rows){
 const dimensions=['careerOperatingStyle','valueCreationMode','careerAdvantages','roleSpectrum','activeMechanisms','mechanismInteractions','scenarioMix','timingContrast','decisionPriorities'];
 const signatures=rows.map(({id,ir})=>({id,careerOperatingStyle:ir.nodes.find(n=>n.kind==='CAREER_OPERATING_STYLE')?.dominantMechanism,valueCreationMode:ir.valueCreationMode.map(v=>v.text),careerAdvantages:ir.distinctCareerAdvantages.map(a=>a.advantageName),roleSpectrum:ir.roleSpectrum.map(r=>r.functionContrast),activeMechanisms:ir.activeMechanisms.map(m=>m.nodeId),mechanismInteractions:ir.mechanismInteractions.map(e=>e.id),scenarioMix:ir.nodes.filter(n=>n.kind==='SCENARIO').map(n=>n.conclusionClass),timingContrast:ir.nodes.filter(n=>n.kind==='TIMING').map(n=>[n.natalCareerBaseline.dominant,n.daYunAmplifiedMechanism.primaryGroup,n.annualAmplifiedMechanism.primaryGroup]),decisionPriorities:ir.careerDecisionPriorities.map(p=>p.mechanismId||p.decisionTest)}));
 const diversity=Object.fromEntries(dimensions.map(k=>[k,new Set(signatures.map(s=>JSON.stringify(s[k]))).size]));
 return {accepted:rows.length>=3&&Object.values(diversity).every(n=>n>=2),diversity,signatures,scope:'DETERMINISTIC_TEST_CHART_IDENTITIES_NOT_GENERATED_PROSE'};
}
