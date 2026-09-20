// Validates the existing Page IR's optional visualDesign extension. This is not
// a report generator, calculation engine or second Page IR.
export function reportDesignErrors(page,registry){
 const errors=[],fail=code=>errors.push(code),design=page.visualDesign||{};
 if(!registry.masters.some(x=>x.id===page.visualTemplateId))fail('UNKNOWN_TEMPLATE');
 if(!page.pageNumber||!Number.isInteger(page.pageNumber)||page.pageNumber<6||page.pageNumber>26)fail('PAGE_NUMBER_REQUIRED');
 if(registry.pageMap.find(x=>x.pageNumber===page.pageNumber)?.master!==page.visualTemplateId)fail('PAGE_MASTER_MISMATCH');
 if(!page.reportIdentity)fail('REPORT_IDENTITY_REQUIRED');
 if(!['OPEN','PREVIEW','PAID_LOCKED','DATA_REQUIRED','CONDITIONAL','NOT_APPLICABLE'].includes(page.accessState))fail('PAGE_STATUS_REQUIRED');
 if(!page.question||!page.title)fail('CUSTOMER_QUESTION_REQUIRED');
 if(!page.visual?.type||!page.visual.nodes?.length)fail('PRIMARY_VISUAL_REQUIRED');
 if(!page.visual?.dataRefs?.length||page.visual.dataRefs.some(x=>/assets\/images\/report|reference|sample/i.test(x)))fail('GOVERNED_VISUAL_SOURCE_REQUIRED');
 if((page.insights||[]).length>registry.layout.maxCoreInsights)fail('TOO_MANY_INSIGHTS');
 if((page.insights||[]).some(x=>!x.sourceRef))fail('INSIGHT_SOURCE_REQUIRED');
 if(design.referenceDataCopied!==false)fail('REFERENCE_DATA_NOT_EXCLUDED');
 if(!design.cardTypes?.length||design.cardTypes.some(x=>!registry.panel.cardFamilies.includes(x)))fail('UNKNOWN_CARD_FAMILY');
 if(design.iconFamily!==registry.iconFamily.id||(design.iconIds||[]).some(x=>!registry.iconFamily.allowedIds.includes(x)))fail('UNKNOWN_ICON_FAMILY');
 if(!design.tokenRefs?.length||design.tokenRefs.some(x=>!(x in registry.tokenValues)))fail('UNKNOWN_TOKEN');
 if((design.classNames||[]).some(x=>!registry.approvedClasses.includes(x)))fail('UNKNOWN_STYLE_CLASS');
 if(design.inlineStyle)fail('INLINE_STYLE_DRIFT');
 if(design.headerContract!=='REPORT_SHARED_HEADER_R1'||design.footerContract!=='REPORT_SHARED_FOOTER_R1')fail('PAGE_CHROME_DRIFT');
 const limits=registry.pageMap.find(x=>x.pageNumber===page.pageNumber)?.visualShare||registry.masters.find(x=>x.id===page.visualTemplateId)?.visualShare;
 const measured=design.measuredLayout;
 if(!measured||measured.source!=='BROWSER_GEOMETRY'||!Number.isFinite(measured.primaryVisualShare)||!Number.isFinite(measured.proseShare))fail('DENSITY_MEASUREMENT_REQUIRED');
 else{
  if(limits&&measured.primaryVisualShare<limits[0])fail('PRIMARY_VISUAL_TOO_SMALL');
  if(measured.primaryVisualShare>1||measured.primaryVisualShare<0||measured.proseShare<0)fail('INVALID_DENSITY_MEASUREMENT');
  if(measured.proseShare>registry.layout.normalProseShare[1])fail('PROSE_DOMINANCE');
 }
 return [...new Set(errors)];
}
export function reportCssErrors(css,registry){
 const errors=[];
 for(const [,token] of css.matchAll(/var\((--[a-z0-9-]+)/gi))if(!(token in registry.tokenValues))errors.push('UNREGISTERED_TOKEN');
 for(const [,property,value] of css.matchAll(/(?:^|[;{])\s*(color|background(?:-color)?|border(?:-color|-radius)?|box-shadow|font(?:-size|-family)?)\s*:\s*([^;}]+)/g)){
  if(!/^\s*(?:var\(--phi-report-[a-z-]+\)|none|inherit|transparent)\s*$/.test(value))errors.push(`UNREGISTERED_${property.toUpperCase().replaceAll('-','_')}`);
 }
 if(/@import|@font-face|url\(/i.test(css))errors.push('UNREGISTERED_EXTERNAL_STYLE_ASSET');
 return [...new Set(errors)];
}
