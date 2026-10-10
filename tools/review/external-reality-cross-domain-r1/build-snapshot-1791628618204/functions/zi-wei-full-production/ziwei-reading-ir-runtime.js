import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';
import {PALACE_ZH,PALACE_EN,STAR_ZH,BRANCH_ZH,TRANSFORMATION_ZH,STAR_STATE_VOCABULARY} from './ziwei-structural-registry.js';

export const ZIWEI_FULL_READING_IR_SCHEMA='PHI-OS-ZIWEI-FULL-READING-IR-v1.0.0';
export const ZIWEI_READING_UNIT_SCHEMA='PHI-OS-ZIWEI-READING-UNIT-v1.0.0';
export const ZIWEI_READING_IR_VERSION='1.0.0';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];const uniq=v=>[...new Set(list(v).filter(Boolean))];
function fail(code){const e=new Error(code);e.code=code;throw e;}
const PALACE_ORDER=Object.freeze(['LIFE','SIBLINGS','SPOUSE','CHILDREN','WEALTH','HEALTH','TRAVEL','FRIENDS','CAREER','PROPERTY','WELLBEING','PARENTS']);
const SECTION_ORDER=Object.freeze(['FOUNDATION','PALACES','PATTERNS','TIMING','OPEN_QUESTIONS','EVIDENCE']);
const sectionForSemanticKey=key=>key==='ZWR:FOUNDATION:LIFE_BODY'?'FOUNDATION':key?.startsWith('ZWR:PALACE:')?'PALACES':key==='ZWR:PATTERN:QUALIFIED_SET'?'PATTERNS':key?.startsWith('ZWR:TEMPORAL:')?'TIMING':null;

function collectMeaningMap(context){
 const out=[];const push=m=>{if(m?.meaningCode)out.push(m)};
 push(context.foundation?.lifePalace?.domainMeaning);push(context.foundation?.bodyPalace?.domainMeaning);push(context.foundation?.bodyPalace?.emphasisMeaning);
 for(const x of list(context.palaceMeanings))push(x.meaning);
 for(const x of list(context.starMeanings))if(x.state==='AVAILABLE')push(x.meaning);
 for(const x of list(context.stateMeanings))push(x.meaning);
 for(const x of list(context.transformations))push(x);
 for(const x of list(context.relationshipMeanings))push(x);
 for(const x of list(context.patternMeanings))push(x.meaning);
 for(const x of list(context.temporalMeanings))push(x);
 return new Map(out.map(x=>[x.meaningCode,x]));
}
function localizedLabel(code,locale){return locale==='zh-Hans'?(PALACE_ZH[code]||code):(PALACE_EN[code]||code)}
function starLabel(code,locale){return locale==='zh-Hans'?(STAR_ZH[code]||code):code}
function branchLabel(code,locale){return locale==='zh-Hans'?(BRANCH_ZH[code]||code):code}
function stateLabel(code,locale){return locale==='zh-Hans'?(STAR_STATE_VOCABULARY[code]?.zh||code):code}
function txLabel(code,locale){return locale==='zh-Hans'?(TRANSFORMATION_ZH[code]||code):code}

export function buildZiweiReadingIR({meaningContext,structuralFindings,evidenceGraph,composition,contradictionResolution,dedup,locale='zh-Hans'}={}){
 if(meaningContext?.schemaVersion!=='PHI-OS-ZIWEI-FP-W11-MEANING-CONTEXT-v1.0.0')fail('ZIWEI_FP_W17_REQUIRES_W11_MEANING_CONTEXT');
 if(structuralFindings?.schemaVersion!=='PHI-OS-ZIWEI-STRUCTURAL-FINDING-COLLECTION-v1.0.0')fail('ZIWEI_FP_W17_REQUIRES_W12_FINDINGS');
 if(evidenceGraph?.schemaVersion!=='PHI-OS-ZIWEI-INTERPRETATION-EVIDENCE-GRAPH-v1.0.0'||evidenceGraph.sourceFindingDigest!==structuralFindings.findingDigest)fail('ZIWEI_FP_W17_REQUIRES_W13_GRAPH');
 if(composition?.schemaVersion!=='PHI-OS-ZIWEI-CROSS-FINDING-COMPOSITION-IR-v1.0.0'||composition.sourceFindingDigest!==structuralFindings.findingDigest||composition.sourceGraphDigest!==evidenceGraph.graphDigest)fail('ZIWEI_FP_W17_REQUIRES_W14_COMPOSITION');
 if(contradictionResolution?.schemaVersion!=='PHI-OS-ZIWEI-CONTRADICTION-RESOLUTION-IR-v1.0.0'||contradictionResolution.sourceCompositionDigest!==composition.compositionDigest||contradictionResolution.sourceFindingDigest!==structuralFindings.findingDigest||contradictionResolution.sourceGraphDigest!==evidenceGraph.graphDigest)fail('ZIWEI_FP_W17_REQUIRES_W15_RESOLUTION');
 if(dedup?.schemaVersion!=='PHI-OS-ZIWEI-SEMANTIC-DEDUP-IR-v1.0.0'||dedup.sourceCompositionDigest!==composition.compositionDigest||dedup.sourceResolutionDigest!==contradictionResolution.resolutionDigest)fail('ZIWEI_FP_W17_REQUIRES_W16_DEDUP');
 const inputs=[meaningContext,structuralFindings,evidenceGraph,composition,contradictionResolution,dedup],snapshots=inputs.map(stableStringify);
 const loc=locale==='zh-Hans'?'zh-Hans':'en';const meaningMap=collectMeaningMap(meaningContext);
 const unitById=new Map(composition.compositionUnits.map(x=>[x.compositionId,x]));
 const resolutionByComp=new Map(contradictionResolution.resolutions.map(x=>[x.compositionRef,x]));
 const findingById=new Map(structuralFindings.findings.map(x=>[x.findingId,x]));
 const evidenceById=new Map(structuralFindings.evidenceCatalog.map(x=>[x.evidenceId,x]));
 const authorityById=new Map(structuralFindings.authorityCatalog.map(x=>[x.authorityId,x]));
 const unknownById=new Map(structuralFindings.unknownCatalog.map(x=>[x.unknownId,x]));
 const decisionByComp=new Map(dedup.decisions.map(x=>[x.compositionRef,x]));
 const seenPrimary=new Set();
 const readingUnits=[];
 for(const cluster of dedup.semanticClusters){
  const primaryDecision=decisionByComp.get(cluster.primaryCompositionRef);if(!primaryDecision||primaryDecision.decision!=='PRIMARY_EXPLANATION')fail('ZIWEI_FP_W17_PRIMARY_DECISION_MISSING');
  if(seenPrimary.has(cluster.semanticClusterId))fail('ZIWEI_FP_W17_DUPLICATE_SEMANTIC_CLUSTER');seenPrimary.add(cluster.semanticClusterId);
  const primaryUnit=unitById.get(cluster.primaryCompositionRef),primaryResolution=resolutionByComp.get(cluster.primaryCompositionRef);if(!primaryUnit||!primaryResolution)fail('ZIWEI_FP_W17_PRIMARY_LINEAGE_MISSING');
  const sectionCode=sectionForSemanticKey(cluster.semanticKey);if(!sectionCode)fail(`ZIWEI_FP_W17_SECTION_UNRESOLVED:${cluster.semanticKey}`);
  const derivatives=cluster.compositionRefs.filter(ref=>ref!==cluster.primaryCompositionRef).map(ref=>{const d=decisionByComp.get(ref),u=unitById.get(ref),r=resolutionByComp.get(ref);if(!d||!u||!r)fail('ZIWEI_FP_W17_DERIVATIVE_LINEAGE_MISSING');return {compositionRef:ref,compositionType:u.compositionType,renderDecision:d.decision,newInformationRefs:d.newInformationRefs||[],resolutionRef:r.resolutionId,resolutionState:r.state,qualifierCodes:r.qualifierCodes,counterEvidenceRefs:r.counterEvidenceRefs,unknownRefs:r.unknownRefs,findingRefs:u.findingRefs,evidenceRefs:u.evidenceRefs,meaningRefs:u.meaningRefs,authorityRefs:u.authorityRefs,temporalContext:u.temporalContext||null};});
  const allUnits=[primaryUnit,...derivatives.map(d=>unitById.get(d.compositionRef))];const meaningRefs=uniq(allUnits.flatMap(x=>x.meaningRefs)).sort(),evidenceRefs=uniq(allUnits.flatMap(x=>x.evidenceRefs)).sort(),authorityRefs=uniq(allUnits.flatMap(x=>x.authorityRefs)).sort(),findingRefs=uniq(allUnits.flatMap(x=>x.findingRefs)).sort();
  const unknownRefs=uniq([...(primaryResolution.unknownRefs||[]),...derivatives.flatMap(x=>x.unknownRefs||[])]).sort(),counterEvidenceRefs=uniq([...(primaryResolution.counterEvidenceRefs||[]),...derivatives.flatMap(x=>x.counterEvidenceRefs||[])]).sort(),qualifierCodes=uniq([...(primaryResolution.qualifierCodes||[]),...derivatives.flatMap(x=>x.qualifierCodes||[])]).sort();
  const governedMeanings=meaningRefs.map(ref=>{const m=meaningMap.get(ref);if(!m)fail(`ZIWEI_FP_W17_MEANING_PAYLOAD_MISSING:${ref}`);return {meaningCode:m.meaningCode,kind:m.kind,sourceCode:m.sourceCode,meaningType:m.meaningType,label:m.label,definition:m.definition,authorityClass:m.authorityClass,semanticDigest:m.semanticDigest};});
  const evidenceItems=evidenceRefs.map(ref=>{const e=evidenceById.get(ref);if(!e)fail(`ZIWEI_FP_W17_EVIDENCE_PAYLOAD_MISSING:${ref}`);return e});
  const authorityItems=authorityRefs.map(ref=>{const a=authorityById.get(ref);if(!a)fail(`ZIWEI_FP_W17_AUTHORITY_PAYLOAD_MISSING:${ref}`);return a});
  const unknownItems=unknownRefs.map(ref=>{const u=unknownById.get(ref);if(!u)fail(`ZIWEI_FP_W17_UNKNOWN_PAYLOAD_MISSING:${ref}`);return u});
  const readingUnitId=`ZWR-READING-${cluster.semanticClusterId.replace(/^ZWR-SEMCLUSTER-/,'')}`;
  readingUnits.push({schemaVersion:ZIWEI_READING_UNIT_SCHEMA,readingUnitId,sectionCode,semanticClusterId:cluster.semanticClusterId,semanticKey:cluster.semanticKey,primary:{compositionRef:primaryUnit.compositionId,compositionType:primaryUnit.compositionType,palaceCode:primaryUnit.palaceCode||null,temporalContext:primaryUnit.temporalContext||null,resolutionRef:primaryResolution.resolutionId,resolutionState:primaryResolution.state,qualifierCodes:primaryResolution.qualifierCodes,counterEvidenceRefs:primaryResolution.counterEvidenceRefs,unknownRefs:primaryResolution.unknownRefs,findingRefs:primaryUnit.findingRefs,evidenceRefs:primaryUnit.evidenceRefs,meaningRefs:primaryUnit.meaningRefs,authorityRefs:primaryUnit.authorityRefs,renderMode:'PRIMARY_EXPLANATION'},contextDerivatives:derivatives,governedMeanings,evidenceItems,authorityItems,unknownItems,lineage:{findingRefs,evidenceRefs,meaningRefs,authorityRefs,unknownRefs,counterEvidenceRefs},renderPolicy:{fullExplanationOwner:true,contextDerivativeMayCreateSecondFullExplanation:false,referenceOnlyMayCreateSeparateBlock:false,qualifiedLanguageRequired:primaryResolution.directives?.requireQualifiedLanguage===true||primaryResolution.state!=='SUPPORTED',counterEvidenceMustRemainVisible:counterEvidenceRefs.length>0,unknownMustRemainVisible:unknownRefs.length>0},boundaries:{newMeaningCreated:false,newFindingCreated:false,newContradictionResolutionCreated:false,customerNarrativeCreated:false,goodBadScoreCreated:false,overallStrongWeakWinnerCreated:false,eventPredictionCreated:false}});
 }
 readingUnits.sort((a,b)=>a.sectionCode.localeCompare(b.sectionCode)||a.semanticKey.localeCompare(b.semanticKey));
 if(readingUnits.length!==dedup.semanticClusters.length)fail('ZIWEI_FP_W17_SEMANTIC_CLUSTER_COVERAGE_MISMATCH');
 const ownerByKey=new Map(readingUnits.map(x=>[x.semanticKey,x]));
 const foundationFinding=structuralFindings.findings.find(x=>x.findingType==='LIFE_BODY_FOUNDATION');
 const palaceRows=PALACE_ORDER.map(palaceCode=>{const owner=ownerByKey.get(`ZWR:PALACE:${palaceCode}`);if(!owner)fail(`ZIWEI_FP_W17_PALACE_OWNER_MISSING:${palaceCode}`);const core=owner.primary.findingRefs.map(ref=>findingById.get(ref)).find(x=>x?.findingType==='PALACE_CONFIGURATION');const network=owner.contextDerivatives.flatMap(d=>d.findingRefs).map(ref=>findingById.get(ref)).find(x=>x?.findingType==='PALACE_RELATIONSHIP_NETWORK');if(!core||!network)fail(`ZIWEI_FP_W17_PALACE_FINDING_PAIR_MISSING:${palaceCode}`);const baseEvidence=core.evidenceRefs.map(ref=>evidenceById.get(ref)).find(x=>x?.kind==='PALACE_CONFIGURATION');const stars=list(baseEvidence?.summary?.stars).map(s=>({starCode:s.starCode,label:starLabel(s.starCode,loc),stateCode:s.stateCode||'UNSPECIFIED',stateLabel:stateLabel(s.stateCode||'UNSPECIFIED',loc)}));const transformations=list(baseEvidence?.summary?.natalTransformations).map(t=>({transformationCode:t.transformationCode,label:txLabel(t.transformationCode,loc),targetStarCode:t.targetStarCode||null}));return {palaceCode,label:localizedLabel(palaceCode,loc),branch:baseEvidence?.summary?.branch||null,branchLabel:branchLabel(baseEvidence?.summary?.branch,loc),isLifePalace:foundationFinding?.metadata?.lifePalaceCode===palaceCode,isBodyPalace:foundationFinding?.metadata?.bodyPalaceCode===palaceCode,readingUnitRef:owner.readingUnitId,resolutionState:owner.primary.resolutionState,stars,transformations,relationshipContext:{oppositePalaceCode:network.metadata.oppositePalaceCode,triadPalaceCodes:network.metadata.triadPalaceCodes,flankPalaceCodes:network.metadata.flankPalaceCodes,emptyMainStarPalace:network.metadata.emptyMainStarPalace,oppositeMeansConflict:false,triadMeansSupport:false},unknownRefs:owner.lineage.unknownRefs,counterEvidenceRefs:owner.lineage.counterEvidenceRefs};});
 const sectionRefs=code=>readingUnits.filter(x=>x.sectionCode===code).map(x=>x.readingUnitId);
 const patternOwners=readingUnits.filter(x=>x.sectionCode==='PATTERNS');const timingOwners=readingUnits.filter(x=>x.sectionCode==='TIMING');
 const sections={
  foundation:{sectionCode:'FOUNDATION',readingUnitRefs:sectionRefs('FOUNDATION'),lifePalaceCode:foundationFinding?.metadata?.lifePalaceCode||null,bodyPalaceCode:foundationFinding?.metadata?.bodyPalaceCode||null},
  palaces:{sectionCode:'PALACES',readingUnitRefs:sectionRefs('PALACES'),items:palaceRows},
  patterns:{sectionCode:'PATTERNS',readingUnitRefs:sectionRefs('PATTERNS'),qualifiedPatternCodes:uniq(patternOwners.flatMap(o=>o.primary.findingRefs.map(ref=>findingById.get(ref)?.metadata?.patternCode))).filter(Boolean).sort(),empty:patternOwners.length===0},
  timing:{sectionCode:'TIMING',readingUnitRefs:sectionRefs('TIMING'),items:timingOwners.map(o=>({readingUnitRef:o.readingUnitId,semanticKey:o.semanticKey,resolutionState:o.primary.resolutionState,temporalContext:o.primary.temporalContext,technicalLabels:uniq(o.lineage.findingRefs.map(ref=>findingById.get(ref)?.technicalLabel)).filter(Boolean)}))},
  openQuestions:{sectionCode:'OPEN_QUESTIONS',items:structuralFindings.unknownCatalog.map(u=>({...u,affectedReadingUnitRefs:readingUnits.filter(x=>x.lineage.unknownRefs.includes(u.unknownId)).map(x=>x.readingUnitId)}))},
  evidence:{sectionCode:'EVIDENCE',source:{meaningRegistryDigest:meaningContext.registryDigest,findingDigest:structuralFindings.findingDigest,graphDigest:evidenceGraph.graphDigest,compositionDigest:composition.compositionDigest,resolutionDigest:contradictionResolution.resolutionDigest,dedupDigest:dedup.dedupDigest},counts:{findings:structuralFindings.findings.length,evidenceItems:structuralFindings.evidenceCatalog.length,authorities:structuralFindings.authorityCatalog.length,graphNodes:evidenceGraph.summary.nodeCount,graphEdges:evidenceGraph.summary.edgeCount,readingUnits:readingUnits.length}}
 };
 for(const code of SECTION_ORDER){const key={FOUNDATION:'foundation',PALACES:'palaces',PATTERNS:'patterns',TIMING:'timing',OPEN_QUESTIONS:'openQuestions',EVIDENCE:'evidence'}[code];if(!sections[key])fail(`ZIWEI_FP_W17_REQUIRED_SECTION_MISSING:${code}`)}
 const base={schemaVersion:ZIWEI_FULL_READING_IR_SCHEMA,work:'ZIWEI-FP-W17',runtimeVersion:ZIWEI_READING_IR_VERSION,locale:loc,authorityState:'READING_IR_ASSEMBLED_FROM_W16_DEDUPED_GOVERNED_RENDER_OWNERS',source:{meaningRegistryDigest:meaningContext.registryDigest,sourceChartDigest:meaningContext.sourceChartDigest,findingDigest:structuralFindings.findingDigest,graphDigest:evidenceGraph.graphDigest,compositionDigest:composition.compositionDigest,resolutionDigest:contradictionResolution.resolutionDigest,dedupDigest:dedup.dedupDigest},sectionOrder:[...SECTION_ORDER],readingUnits,sections,summary:{sectionCount:SECTION_ORDER.length,readingUnitCount:readingUnits.length,primaryExplanationCount:readingUnits.length,contextDerivativeCount:readingUnits.reduce((n,x)=>n+x.contextDerivatives.filter(d=>d.renderDecision==='CONTEXT_DERIVATIVE').length,0),referenceOnlyCount:readingUnits.reduce((n,x)=>n+x.contextDerivatives.filter(d=>d.renderDecision==='REFERENCE_ONLY').length,0),palaceCount:palaceRows.length,qualifiedPatternCount:sections.patterns.qualifiedPatternCodes.length,unknownCount:structuralFindings.unknownCatalog.length,counterbalancedReadingUnitCount:readingUnits.filter(x=>x.primary.resolutionState==='COUNTERBALANCED'||x.contextDerivatives.some(d=>d.resolutionState==='COUNTERBALANCED')).length,boundedByUnknownReadingUnitCount:readingUnits.filter(x=>x.lineage.unknownRefs.length>0).length},boundaries:{oneFullExplanationPerSemanticCluster:true,contextDerivativeCreatesSecondFullExplanation:false,referenceOnlyCreatesSeparateBlock:false,unknownSuppressed:false,counterEvidenceSuppressed:false,governedMeaningRewritten:false,rendererMayCreateMeaning:false,customerNarrativeCreated:false,overallStrongWeakWinnerCreated:false,goodBadScoreCreated:false,fortunePredictionCreated:false,eventPredictionCreated:false,customerProductionEligible:false,customerCutoverAllowed:false}};
 const readingDigest=sha256Stable(base);for(let i=0;i<inputs.length;i++)if(stableStringify(inputs[i])!==snapshots[i])fail('ZIWEI_FP_W17_INPUT_MUTATION_FORBIDDEN');return freeze({...base,readingDigest});
}
export default Object.freeze({buildZiweiReadingIR});
