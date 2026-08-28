import {SMR_R2_READING_IA_RULES} from './smr-r2-w9-w11-rules.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function publicBlock(block){return block&&block.renderable===true&&typeof block.text==='string'&&block.text.trim()?block:null}
function narrativeItem(block,itemType='NARRATIVE_BLOCK'){
  if(!publicBlock(block))return null;
  return freeze({itemType,sourceRef:block.narrativeRef,text:block.text,themeRef:block.themeRef||null,sourceClaimRefs:uniq(block.sourceClaimRefs),newInformationRefs:uniq(block.newInformationRefs),meaningCreated:false});
}
function metadataItem(item){return freeze({...item,meaningCreated:false})}
function dedupItems(items){
  const out=[],seen=new Set();
  for(const item of items.filter(Boolean)){
    const key=item.sourceRef||`${item.itemType}:${item.questionRef||item.claimRef||JSON.stringify(item)}`;
    if(seen.has(key))continue;seen.add(key);out.push(item);
  }
  return out;
}
function section(config,items){
  const clean=dedupItems(items);
  if(config.required&&clean.length===0)fail('SMR_R2_READING_IA_REQUIRED_SECTION_EMPTY',{sectionId:config.sectionId});
  return freeze({sectionId:config.sectionId,order:config.order,customerLabel:config.customerLabel,disclosureLevel:config.disclosureLevel,eligibility:clean.length?'SECTION_ELIGIBLE':'SECTION_NOT_ELIGIBLE',items:clean,itemCount:clean.length});
}

export function buildCustomerReadingIA({narrativeIR}={}){
  if(narrativeIR?.schemaVersion!=='PHI-OS-CUSTOMER-READING-NARRATIVE-IR-v1.0.0')fail('SMR_R2_NARRATIVE_IR_REQUIRED');
  const configById=new Map(SMR_R2_READING_IA_RULES.sections.map(item=>[item.sectionId,item]));
  const themeBlocks=list(narrativeIR.primaryThemes);
  const whatStandsOut=[narrativeItem(narrativeIR.openingSynthesis?.block,'OPENING_SYNTHESIS')];
  const coreThemes=[];
  for(const theme of themeBlocks){
    coreThemes.push(narrativeItem(theme.whatStandsOut,'THEME_WHAT_STANDS_OUT'));
    coreThemes.push(narrativeItem(theme.whyItMatters,'THEME_WHY_IT_MATTERS'));
  }
  for(const deep of list(narrativeIR.deeperSections).filter(item=>item.sectionId==='CORE_THEMES'))for(const block of list(deep.blocks))coreThemes.push(narrativeItem(block,'DEEPER_CORE_THEME'));

  const support=[];
  for(const block of list(narrativeIR.supportTensionSummary?.support))support.push(narrativeItem(block,'SUPPORT'));
  for(const theme of themeBlocks)for(const block of list(theme.whatSupportsIt))support.push(narrativeItem(block,'SUPPORT'));

  const tension=[];
  for(const key of ['tension','counterbalanced','open'])for(const block of list(narrativeIR.supportTensionSummary?.[key]))tension.push(narrativeItem(block,key.toUpperCase()));
  for(const theme of themeBlocks)for(const block of list(theme.whatComplicatesIt))tension.push(narrativeItem(block,'COMPLICATION'));

  const changes=[];
  for(const block of list(narrativeIR.supportTensionSummary?.conditional))changes.push(narrativeItem(block,'CONDITIONAL'));
  for(const theme of themeBlocks)changes.push(narrativeItem(theme.whenItMayDiffer,'WHEN_IT_MAY_DIFFER'));

  const reality=[];
  for(const theme of themeBlocks)reality.push(narrativeItem(theme.howItMayShow,'HOW_IT_MAY_SHOW'));
  for(const deep of list(narrativeIR.deeperSections).filter(item=>item.sectionId!=='CORE_THEMES'))for(const block of list(deep.blocks))reality.push(narrativeItem(block,`DEEPER_${deep.sectionId}`));

  const observe=[];
  for(const questionRef of uniq(narrativeIR.observationQuestions))observe.push(metadataItem({itemType:'OBSERVATION_QUESTION',questionRef,sourceRef:`QUESTION:${questionRef}`,text:null,themeRef:null,sourceClaimRefs:[],newInformationRefs:[questionRef]}));
  for(const theme of themeBlocks)for(const questionRef of uniq(theme.whatToObserve))observe.push(metadataItem({itemType:'OBSERVATION_QUESTION',questionRef,sourceRef:`QUESTION:${questionRef}`,text:null,themeRef:theme.themeId,sourceClaimRefs:[theme.primaryClaimRef],newInformationRefs:[questionRef]}));

  const why=[];
  for(const item of list(narrativeIR.whyThisReading))why.push(metadataItem({itemType:'WHY_THIS_READING_EVIDENCE',sourceRef:`WHY:${item.themeRef}:${item.claimRef}`,themeRef:item.themeRef,claimRef:item.claimRef,text:null,priorityReasonRefs:uniq(item.priorityReasonRefs),evidenceRefs:uniq(item.evidenceRefs),lineageRefs:uniq(item.lineageRefs)}));

  const sectionItems={
    WHAT_STANDS_OUT:whatStandsOut,YOUR_CORE_THEMES:coreThemes,WHAT_SUPPORTS_YOU:support,WHERE_TENSION_APPEARS:tension,
    WHEN_THE_PATTERN_CHANGES:changes,WHAT_THIS_MAY_LOOK_LIKE_IN_REALITY:reality,WHAT_TO_OBSERVE:observe,WHY_THIS_READING:why
  };
  const sections=SMR_R2_READING_IA_RULES.sections.map(config=>section(config,sectionItems[config.sectionId]||[]));
  const methodDetail=freeze({
    disclosureLevel:'LEVEL_3_TECHNICAL_DETAIL',defaultCollapsed:true,readingAuthorityRef:narrativeIR.technicalAppendix?.readingAuthorityRef||narrativeIR.readingAuthorityRef,
    semanticDigest:narrativeIR.technicalAppendix?.semanticDigest||narrativeIR.semanticDigest,sectionRefs:uniq(narrativeIR.technicalAppendix?.sectionRefs),
    productionAdmissionRefs:uniq(narrativeIR.technicalAppendix?.productionAdmissionRefs),interpretationUnitRefs:uniq(narrativeIR.technicalAppendix?.interpretationUnitRefs),
    projectionRefs:uniq(narrativeIR.technicalAppendix?.projectionRefs),meaningRefs:uniq(narrativeIR.technicalAppendix?.meaningRefs),ruleRefs:uniq(narrativeIR.technicalAppendix?.ruleRefs),boundaryRefs:uniq(narrativeIR.technicalAppendix?.boundaryRefs),
    customerConclusionCreatedFromTechnicalDetail:false
  });
  const progressiveDisclosure=SMR_R2_READING_IA_RULES.progressiveDisclosure.map(level=>freeze({...level,sectionRefs:sections.filter(section=>section.disclosureLevel===level.levelId&&section.eligibility==='SECTION_ELIGIBLE').map(section=>section.sectionId),technicalDetailRef:level.levelId==='LEVEL_3_TECHNICAL_DETAIL'?'METHOD_DETAIL':null}));
  return freeze({
    schemaVersion:SMR_R2_READING_IA_RULES.outputSchemaVersion,methodId:narrativeIR.methodId,readingAuthorityRef:narrativeIR.readingAuthorityRef,semanticDigest:narrativeIR.semanticDigest,
    sections,progressiveDisclosure,methodDetail,
    boundary:{customerReadingOrderOwnsBody:true,methodObjectDirectoryOwnsBody:false,technicalDetailLeadsBody:false,technicalDetailDefaultCollapsed:true,emptyOptionalSectionRendered:false,sourceTextFromNarrativeIR:true,rendererMeaningCreated:false,methodDetailSeparateDisclosureLevel:true}
  });
}
