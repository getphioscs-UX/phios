import {deduplicateNarrativeBlocks} from './narrative-deduplicator.js';
import {SMR_R2_NARRATIVE_RULES} from './smr-r2-w6-w8-rules.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function lineageRefs(claim){return uniq([
  claim?.lineage?.productionAdmissionRef,claim?.lineage?.readingAuthorityRef,
  ...list(claim?.lineage?.interpretationUnitRefs),...list(claim?.lineage?.projectionRefs),...list(claim?.lineage?.meaningRefs),...list(claim?.lineage?.ruleRefs),...list(claim?.lineage?.boundaryRefs)
])}
function sourceClaimForText(theme,text,claimById){if(!text)return null;for(const ref of list(theme.claimRefs)){const claim=claimById.get(ref);if(claim?.structuralMeaning===text)return claim}return claimById.get(theme.primaryClaimRef)||null}
function blockCandidate({narrativeRef,text,contextKey,sourceClaimRefs=[],themeRef=null,newInformationRefs=[]}){
  if(!text)return null;
  return {narrativeRef,text,contextKey,sourceClaimRefs:uniq(sourceClaimRefs),themeRef,newInformationRefs:uniq(newInformationRefs)};
}
function normaliseText(value){return String(value??'').toUpperCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
function buildPublicBlockMap(dedup){
  const output=new Map(),seenTextOwner=new Map();
  for(const dedupBlock of list(dedup.blocks)){
    let renderable=SMR_R2_NARRATIVE_RULES.renderableDedupDecisions.includes(dedupBlock.dedupDecision);
    let primaryNarrativeRef=dedupBlock.primaryNarrativeRef||null;
    if(renderable&&dedupBlock.dedupDecision==='CONTEXT_DERIVATIVE'){
      const primary=dedup.blocks.find(block=>block.narrativeRef===dedupBlock.primaryNarrativeRef);
      if(primary&&normaliseText(primary.text)===normaliseText(dedupBlock.text))renderable=false;
    }
    const textKey=normaliseText(dedupBlock.text);
    if(renderable&&textKey&&seenTextOwner.has(textKey)){renderable=false;primaryNarrativeRef=seenTextOwner.get(textKey)}
    if(renderable&&textKey)seenTextOwner.set(textKey,dedupBlock.narrativeRef);
    output.set(dedupBlock.narrativeRef,freeze({
      narrativeRef:dedupBlock.narrativeRef,text:renderable?dedupBlock.text:null,sourceClaimRefs:uniq(dedupBlock.sourceClaimRefs),themeRef:dedupBlock.themeRef||null,
      dedupDecision:renderable?dedupBlock.dedupDecision:'SUPPRESSED_DUPLICATE',primaryNarrativeRef,newInformationRefs:uniq(dedupBlock.newInformationRefs),renderable
    }));
  }
  return output;
}
function findPublic(publicBlocks,narrativeRef){return publicBlocks.get(narrativeRef)||null}
function technicalAppendix(priorityResolution,sectionInformationGain){
  const claims=list(priorityResolution.claims);
  return freeze({
    defaultCollapsed:true,
    sectionRefs:list(sectionInformationGain.technicalAppendixRefs),
    readingAuthorityRef:priorityResolution.readingAuthorityRef,
    semanticDigest:priorityResolution.semanticDigest,
    productionAdmissionRefs:uniq(claims.map(claim=>claim.lineage?.productionAdmissionRef)),
    interpretationUnitRefs:uniq(claims.flatMap(claim=>list(claim.interpretationUnitRefs))),
    projectionRefs:uniq(claims.flatMap(claim=>list(claim.lineage?.projectionRefs))),
    meaningRefs:uniq(claims.flatMap(claim=>list(claim.lineage?.meaningRefs))),
    ruleRefs:uniq(claims.flatMap(claim=>list(claim.lineage?.ruleRefs))),
    boundaryRefs:uniq(claims.flatMap(claim=>[...list(claim.boundaries),...list(claim.lineage?.boundaryRefs)])),
    customerConclusionCreatedFromTechnicalDetail:false
  });
}

export function buildCustomerNarrativeIR({priorityResolution,themeCollection,sectionInformationGain,contradictionPreservation}={}){
  if(priorityResolution?.schemaVersion!=='PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0')fail('SMR_R2_PRIORITY_RESOLUTION_REQUIRED');
  if(themeCollection?.schemaVersion!=='PHI-OS-CUSTOMER-THEME-IR-COLLECTION-v1.0.0')fail('SMR_R2_THEME_COLLECTION_REQUIRED');
  if(sectionInformationGain?.schemaVersion!=='PHI-OS-SMR-R2-SECTION-INFORMATION-GAIN-v1.0.0')fail('SMR_R2_INFORMATION_GAIN_REQUIRED');
  if(contradictionPreservation?.schemaVersion!=='PHI-OS-SMR-R2-CONTRADICTION-PRESERVATION-v1.0.0')fail('SMR_R2_CONTRADICTION_PRESERVATION_REQUIRED');
  if(new Set([priorityResolution.methodId,themeCollection.methodId,sectionInformationGain.methodId,contradictionPreservation.methodId]).size!==1)fail('SMR_R2_NARRATIVE_METHOD_MISMATCH');
  const claims=list(priorityResolution.claims),claimById=new Map(claims.map(claim=>[claim.claimId,claim]));
  const themes=list(themeCollection.themes);
  const themeById=new Map(themes.map(theme=>[theme.themeId,theme]));
  const firstThemeRefs=list(themeCollection.firstScreenThemeRefs).filter(ref=>themeById.has(ref));
  const openingTheme=themeById.get(firstThemeRefs[0])||themes[0]||null;
  if(!openingTheme)fail('SMR_R2_NARRATIVE_THEME_REQUIRED');

  const candidates=[];
  const openingClaim=claimById.get(openingTheme.primaryClaimRef);
  candidates.push(blockCandidate({narrativeRef:'SMR2-NARRATIVE:OPENING',text:openingTheme.whatStandsOut,contextKey:'OPENING_SYNTHESIS',sourceClaimRefs:[openingTheme.primaryClaimRef],themeRef:openingTheme.themeId,newInformationRefs:[openingTheme.primaryClaimRef]}));

  const selectedThemes=themes.filter(theme=>['PRIMARY','SECONDARY'].includes(theme.priorityClass)).slice(0,SMR_R2_NARRATIVE_RULES.maxPrimaryThemes);
  for(const theme of selectedThemes){
    const whatClaim=sourceClaimForText(theme,theme.whatStandsOut,claimById);
    const whyClaim=sourceClaimForText(theme,theme.whyItMatters,claimById);
    const howClaim=sourceClaimForText(theme,theme.howItMayShow,claimById);
    const differClaim=sourceClaimForText(theme,theme.whenItMayDiffer,claimById);
    candidates.push(blockCandidate({narrativeRef:`${theme.themeId}:WHAT`,text:theme.whatStandsOut,contextKey:'WHAT_STANDS_OUT',sourceClaimRefs:[whatClaim?.claimId],themeRef:theme.themeId,newInformationRefs:[whatClaim?.claimId]}));
    candidates.push(blockCandidate({narrativeRef:`${theme.themeId}:WHY`,text:theme.whyItMatters,contextKey:'WHY_IT_MATTERS',sourceClaimRefs:[whyClaim?.claimId],themeRef:theme.themeId,newInformationRefs:[whyClaim?.claimId]}));
    candidates.push(blockCandidate({narrativeRef:`${theme.themeId}:HOW`,text:theme.howItMayShow,contextKey:'HOW_IT_MAY_SHOW',sourceClaimRefs:[howClaim?.claimId],themeRef:theme.themeId,newInformationRefs:[howClaim?.claimId]}));
    candidates.push(blockCandidate({narrativeRef:`${theme.themeId}:DIFFER`,text:theme.whenItMayDiffer,contextKey:'WHEN_IT_MAY_DIFFER',sourceClaimRefs:[differClaim?.claimId],themeRef:theme.themeId,newInformationRefs:[differClaim?.claimId]}));
    for(const relation of list(contradictionPreservation.relations).filter(item=>item.themeRefs.includes(theme.themeId))){
      const key=['SUPPORT'].includes(relation.state)?'SUPPORT':['TENSION','COUNTERBALANCED','CONDITIONAL','OPEN'].includes(relation.state)?'COMPLICATES':'RELATION';
      candidates.push(blockCandidate({narrativeRef:`${theme.themeId}:${key}:${relation.claimRef}`,text:relation.structuralMeaning,contextKey:key==='SUPPORT'?'WHAT_SUPPORTS_IT':'WHAT_COMPLICATES_IT',sourceClaimRefs:[relation.claimRef],themeRef:theme.themeId,newInformationRefs:[relation.relationId,...relation.counterEvidenceRefs,...relation.conditionRefs]}));
    }
  }
  for(const relation of list(contradictionPreservation.relations)){
    candidates.push(blockCandidate({narrativeRef:`SMR2-NARRATIVE:RELATION:${relation.relationId}`,text:relation.structuralMeaning,contextKey:`SUPPORT_TENSION_${relation.state}`,sourceClaimRefs:[relation.claimRef],themeRef:relation.themeRefs[0]||null,newInformationRefs:[relation.relationId,...relation.counterEvidenceRefs,...relation.conditionRefs]}));
  }
  for(const section of list(sectionInformationGain.sections).filter(section=>section.eligibility==='SECTION_ELIGIBLE'&&(section.sectionId==='CORE_THEMES'||['CONDITIONAL','TEMPORAL'].includes(section.configuredSectionClass)))){
    for(const ref of section.newClaimRefs){const claim=claimById.get(ref);if(claim)candidates.push(blockCandidate({narrativeRef:`SMR2-NARRATIVE:SECTION:${section.sectionId}:${ref}`,text:claim.structuralMeaning,contextKey:`DEEPER_SECTION_${section.sectionId}`,sourceClaimRefs:[ref],themeRef:list(themeCollection.themes).find(theme=>theme.claimRefs.includes(ref))?.themeId||null,newInformationRefs:[ref,...section.newRelationRefs,...section.newConditionRefs,...section.newCounterEvidenceRefs,...section.newObservationRefs]}))}
  }
  const cleanCandidates=candidates.filter(Boolean);
  const dedup=deduplicateNarrativeBlocks({blocks:cleanCandidates});
  const publicBlocks=buildPublicBlockMap(dedup);

  const openingSynthesis=freeze({
    themeRefs:firstThemeRefs.length?firstThemeRefs:[openingTheme.themeId],
    headlineRefs:uniq((firstThemeRefs.length?firstThemeRefs:[openingTheme.themeId]).map(ref=>themeById.get(ref)?.headline)),
    block:findPublic(publicBlocks,'SMR2-NARRATIVE:OPENING'),
    sourceType:'ADMITTED_CLAIM_TEXT'
  });

  const primaryThemes=selectedThemes.map(theme=>{
    const relations=list(contradictionPreservation.relations).filter(item=>item.themeRefs.includes(theme.themeId));
    const supportBlocks=relations.filter(item=>item.state==='SUPPORT').map(item=>findPublic(publicBlocks,`${theme.themeId}:SUPPORT:${item.claimRef}`)).filter(Boolean);
    const complicationBlocks=relations.filter(item=>['TENSION','COUNTERBALANCED','CONDITIONAL','OPEN'].includes(item.state)).map(item=>findPublic(publicBlocks,`${theme.themeId}:COMPLICATES:${item.claimRef}`)).filter(Boolean);
    const evidenceRefs=uniq(list(theme.claimRefs).flatMap(ref=>list(claimById.get(ref)?.evidenceRefs)));
    const lineage=uniq(list(theme.claimRefs).flatMap(ref=>lineageRefs(claimById.get(ref))));
    const observationRefs=uniq(theme.realityQuestionRefs);
    return freeze({
      themeId:theme.themeId,headline:theme.headline,primaryClaimRef:theme.primaryClaimRef,
      whatStandsOut:findPublic(publicBlocks,`${theme.themeId}:WHAT`),whyItMatters:findPublic(publicBlocks,`${theme.themeId}:WHY`),
      whatSupportsIt:supportBlocks,whatComplicatesIt:complicationBlocks,
      howItMayShow:findPublic(publicBlocks,`${theme.themeId}:HOW`),whenItMayDiffer:findPublic(publicBlocks,`${theme.themeId}:DIFFER`),
      whatToObserve:observationRefs,evidenceRefs,lineageRefs:lineage,
      boundary:freeze({themeMeaningInvented:false,contradictionPreserved:true})
    });
  });

  const supportTensionSummary=freeze({
    support:list(contradictionPreservation.relations).filter(item=>item.state==='SUPPORT').map(item=>freeze({relationRef:item.relationId,claimRef:item.claimRef,block:findPublic(publicBlocks,`SMR2-NARRATIVE:RELATION:${item.relationId}`)})),
    tension:list(contradictionPreservation.relations).filter(item=>item.state==='TENSION').map(item=>freeze({relationRef:item.relationId,claimRef:item.claimRef,block:findPublic(publicBlocks,`SMR2-NARRATIVE:RELATION:${item.relationId}`)})),
    conditional:list(contradictionPreservation.relations).filter(item=>item.state==='CONDITIONAL').map(item=>freeze({relationRef:item.relationId,claimRef:item.claimRef,block:findPublic(publicBlocks,`SMR2-NARRATIVE:RELATION:${item.relationId}`)})),
    counterbalanced:list(contradictionPreservation.relations).filter(item=>item.state==='COUNTERBALANCED').map(item=>freeze({relationRef:item.relationId,claimRef:item.claimRef,block:findPublic(publicBlocks,`SMR2-NARRATIVE:RELATION:${item.relationId}`)})),
    open:list(contradictionPreservation.relations).filter(item=>item.state==='OPEN').map(item=>freeze({relationRef:item.relationId,claimRef:item.claimRef,block:findPublic(publicBlocks,`SMR2-NARRATIVE:RELATION:${item.relationId}`)}))
  });

  const deeperSections=list(sectionInformationGain.sections).filter(section=>section.eligibility==='SECTION_ELIGIBLE'&&(section.sectionId==='CORE_THEMES'||['CONDITIONAL','TEMPORAL'].includes(section.configuredSectionClass))).map(section=>freeze({
    sectionId:section.sectionId,sectionClass:section.configuredSectionClass,informationGainCount:section.informationGainCount,
    claimRefs:section.newClaimRefs,relationRefs:section.newRelationRefs,conditionRefs:section.newConditionRefs,counterEvidenceRefs:section.newCounterEvidenceRefs,observationRefs:section.newObservationRefs,
    blocks:section.newClaimRefs.map(ref=>findPublic(publicBlocks,`SMR2-NARRATIVE:SECTION:${section.sectionId}:${ref}`)).filter(Boolean)
  }));
  const observationQuestions=uniq(list(sectionInformationGain.sections).find(section=>section.sectionId==='REALITY_QUESTIONS')?.newObservationRefs||[]);
  const whyThisReading=freeze(primaryThemes.map(theme=>{
    const claim=claimById.get(theme.primaryClaimRef);
    return freeze({themeRef:theme.themeId,claimRef:theme.primaryClaimRef,priorityReasonRefs:uniq(claim?.priorityReasonRefs),evidenceRefs:uniq(claim?.evidenceRefs),lineageRefs:lineageRefs(claim)});
  }));
  const appendix=technicalAppendix(priorityResolution,sectionInformationGain);
  const renderedTexts=[...publicBlocks.values()].filter(block=>block.renderable).map(block=>block.text);
  if(renderedTexts.some(text=>!text))fail('SMR_R2_NARRATIVE_EMPTY_RENDERABLE_TEXT');
  return freeze({
    schemaVersion:SMR_R2_NARRATIVE_RULES.irSchemaVersion,methodId:priorityResolution.methodId,readingAuthorityRef:priorityResolution.readingAuthorityRef,semanticDigest:priorityResolution.semanticDigest,
    openingSynthesis,primaryThemes,supportTensionSummary,deeperSections,observationQuestions,whyThisReading,technicalAppendix:appendix,
    narrativeDedup:freeze({schemaVersion:dedup.schemaVersion,renderableBlockCount:[...publicBlocks.values()].filter(block=>block.renderable).length,suppressedDuplicateCount:[...publicBlocks.values()].filter(block=>!block.renderable).length,contextDerivativeTextMustDiffer:true,exactTextOwnerUnique:true}),
    closingText:null,
    boundary:freeze({admittedClaimTextOnly:true,newMeaningCreated:false,genericIntroCreated:false,genericEndingCreated:false,repeatedMethodDisclaimer:false,rendererMeaningCreated:false,suppressedDuplicateRenderable:false,contextDerivativeTextMustDiffer:true,technicalDefaultCollapsed:true,customerPredictionAccuracyClaimed:false})
  });
}
