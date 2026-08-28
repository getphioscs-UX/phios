import {SMR_R2_LAYOUT_RULES} from './smr-r2-w9-w11-rules.js';

const list=value=>Array.isArray(value)?value:[];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function eligibleSection(ia,id){return list(ia.sections).find(item=>item.sectionId===id&&item.eligibility==='SECTION_ELIGIBLE')||null}
function takeSource(section,count=1){return section?list(section.items).slice(0,count).map(item=>item.sourceRef).filter(Boolean):[]}

export function buildCustomerReadingLayout({readingIA}={}){
  if(readingIA?.schemaVersion!=='PHI-OS-CUSTOMER-READING-IA-v2.0.0')fail('SMR_R2_READING_IA_REQUIRED');
  const opening=eligibleSection(readingIA,'WHAT_STANDS_OUT');
  const themes=eligibleSection(readingIA,'YOUR_CORE_THEMES');
  const support=eligibleSection(readingIA,'WHAT_SUPPORTS_YOU');
  const tension=eligibleSection(readingIA,'WHERE_TENSION_APPEARS')||eligibleSection(readingIA,'WHEN_THE_PATTERN_CHANGES');
  const blocks=[
    {slot:'READING_TITLE',sourceRefs:[]},
    ...(opening?[{slot:'OPENING_SYNTHESIS',sourceRefs:takeSource(opening,1)}]:[]),
    ...takeSource(themes,SMR_R2_LAYOUT_RULES.firstScreenMaxThemes).map(ref=>({slot:'PRIORITY_THEME',sourceRefs:[ref]})),
    ...(support?[{slot:'SUPPORT',sourceRefs:takeSource(support,1)}]:[]),
    ...(tension?[{slot:'TENSION_OR_OPEN',sourceRefs:takeSource(tension,1)}]:[]),
    {slot:'EXPLORE_FULL_READING_CTA',sourceRefs:[]}
  ];
  const limited=blocks.slice(0,SMR_R2_LAYOUT_RULES.firstScreenMaxBlocks);
  const themeCount=limited.filter(block=>block.slot==='PRIORITY_THEME').length;
  if(themeCount>SMR_R2_LAYOUT_RULES.firstScreenMaxThemes)fail('SMR_R2_LAYOUT_FIRST_SCREEN_THEME_LIMIT');
  if(limited.length>SMR_R2_LAYOUT_RULES.firstScreenMaxBlocks)fail('SMR_R2_LAYOUT_FIRST_SCREEN_BLOCK_LIMIT');
  const forbidden=new Set(SMR_R2_LAYOUT_RULES.firstScreenForbiddenKinds);
  if(limited.some(block=>forbidden.has(block.slot)))fail('SMR_R2_LAYOUT_TECHNICAL_ON_FIRST_SCREEN');
  return freeze({
    schemaVersion:SMR_R2_LAYOUT_RULES.outputSchemaVersion,methodId:readingIA.methodId,readingAuthorityRef:readingIA.readingAuthorityRef,semanticDigest:readingIA.semanticDigest,
    firstScreen:{maxBlocks:SMR_R2_LAYOUT_RULES.firstScreenMaxBlocks,maxThemes:SMR_R2_LAYOUT_RULES.firstScreenMaxThemes,blockCount:limited.length,themeCount,blocks:limited,technicalRefsIncluded:false},
    body:{coreThemeMaxCount:SMR_R2_LAYOUT_RULES.coreThemeMaxCount,bodyMaxCharactersPerParagraph:SMR_R2_LAYOUT_RULES.bodyMaxCharactersPerParagraph,bodyRecommendedCharactersPerParagraph:SMR_R2_LAYOUT_RULES.bodyRecommendedCharactersPerParagraph,maxConsecutiveTextBlocks:SMR_R2_LAYOUT_RULES.maxConsecutiveTextBlocks,eligibleSectionRefs:list(readingIA.sections).filter(item=>item.eligibility==='SECTION_ELIGIBLE').map(item=>item.sectionId)},
    desktop:{contentWidthCssPx:SMR_R2_LAYOUT_RULES.desktopContentWidth,technicalDefaultCollapsed:true,chartPlacement:SMR_R2_LAYOUT_RULES.chartPlacement,evidenceDisclosurePolicy:SMR_R2_LAYOUT_RULES.evidenceDisclosurePolicy},
    mobile:{...SMR_R2_LAYOUT_RULES.mobile,stackPolicy:SMR_R2_LAYOUT_RULES.mobileStackPolicy},
    print:{...SMR_R2_LAYOUT_RULES.print,breakPolicy:SMR_R2_LAYOUT_RULES.printBreakPolicy},
    progressiveDisclosure:readingIA.progressiveDisclosure,
    technical:{defaultCollapsed:SMR_R2_LAYOUT_RULES.technicalDefaultCollapsed,disclosureLevel:readingIA.methodDetail.disclosureLevel,firstScreenAllowed:false},
    boundary:{layoutMeaningCreated:false,rendererExpandedLimits:false,webMobilePrintConsumeSameIA:true,firstScreenTechnicalAllowed:false}
  });
}
