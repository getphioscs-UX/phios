import {freeze,list,text,localeOf,fail} from '../product-envelope-core.js';
import {sha256Stable,stableStringify} from '../../zi-wei-runtime/zwr-utils.js';

export const ZIWEI_CX_R1_W8_REPORT_PROJECTION_SCHEMA='PHI-OS-ZIWEI-CX-R1-W18-FULL-REPORT-PROJECTION-v1.0.0';
export const ZIWEI_CX_R1_W8_REPORT_RENDERER_ID='ZIWEI_CX_R1_W8_FULL_REPORT';

const sectionBy=(report,code)=>list(report?.sections).find(x=>x?.sectionCode===code)||null;
const clean=value=>String(value??'').trim();
const uniq=values=>[...new Set(list(values).filter(Boolean))];
const readable=value=>clean(value);
const sourceRefsOf=block=>uniq([
  block?.blockDigest,
  block?.why?.readingUnitRef,
  ...list(block?.why?.evidenceRefs),
  ...list(block?.why?.meaningRefs),
  ...list(block?.why?.authorityRefs),
  ...list(block?.why?.counterEvidenceRefs)
]);

function anchorLine(anchor,l){
  if(!anchor)return '';
  return text(l,`${anchor.label}: ${anchor.value}`,`${anchor.label}：${anchor.value}`);
}
function networkLine(block,l){
  const summary=readable(block?.networkContext?.summary);if(!summary)return '';
  return text(l,`Palace network: ${summary}`,`宫位网络：${summary}`);
}
function boundaryLine(copy,l){
  const value=readable(copy);if(!value)return '';
  return text(l,`Open boundary: ${value}`,`仍保留的解释空白：${value}`);
}
function resolutionSummary(block,l){
  const state=readable(block?.resolutionLabel||block?.resolutionState);
  const branch=readable(block?.branchLabel);
  const focus=[];
  if(block?.isLifePalace===true)focus.push(text(l,'Life Palace','命宫'));
  if(block?.isBodyPalace===true)focus.push(text(l,'Body Palace','身宫'));
  if(block?.isStructuralFocus===true)focus.push(text(l,'current structural focus','当前结构重点'));
  return [branch,state,focus.join(l==='zh-Hans'?' · ':' · ')].filter(Boolean).join(' · ');
}
function paragraphPayload(block,l,{includeNetwork=false,includeBoundary=false}={}){
  const rows=[...list(block?.paragraphs).map(readable).filter(Boolean)];
  if(includeNetwork){const network=networkLine(block,l);if(network)rows.push(network);}
  if(includeBoundary){const boundary=boundaryLine(block?.openBoundary,l);if(boundary)rows.push(boundary);}
  return uniq(rows);
}
function projectedSection({sectionId,title,summary=null,payload=[],kind='READING',sourceRefs=[]}={}){
  if(!sectionId||!title)fail('ZIWEI_CX_R1_W8_SECTION_ID_TITLE_REQUIRED');
  return freeze({sectionId,title,summary,kind,payload:list(payload).filter(Boolean),sourceRefs:uniq(sourceRefs)});
}

export function projectZiweiW18FullReport({publicationEnvelope,locale=publicationEnvelope?.locale||'en'}={}){
  if(publicationEnvelope?.schemaVersion!=='PHI-OS-ZIWEI-CX-R1-CURRENT-PUBLICATION-ENVELOPE-v1.0.0')fail('ZIWEI_CX_R1_W8_PUBLICATION_ENVELOPE_REQUIRED');
  if(publicationEnvelope.state!=='CUSTOMER_PUBLISHABLE')fail('ZIWEI_CX_R1_W8_CUSTOMER_PUBLISHABLE_REQUIRED');
  const l=localeOf(locale),report=publicationEnvelope.report;
  if(report?.schemaVersion!=='PHI-OS-ZIWEI-CUSTOMER-REPORT-v1.0.0')fail('ZIWEI_CX_R1_W8_W18_REPORT_REQUIRED');
  if(report.locale!==l)fail('ZIWEI_CX_R1_W8_LOCALE_MISMATCH');
  const snap=stableStringify(publicationEnvelope);
  const readingFirst=report.readingFirst||sectionBy(report,'READING_FIRST');
  const foundation=sectionBy(report,'FOUNDATION');
  const palaces=sectionBy(report,'PALACES');
  const patterns=sectionBy(report,'PATTERNS');
  const timing=sectionBy(report,'TIMING');
  const open=sectionBy(report,'OPEN_BOUNDARIES');
  const evidence=sectionBy(report,'WHY_THIS_READING')||report.technicalEvidence;
  if(!readingFirst||!foundation||!palaces||!patterns||!timing||!open||!evidence)fail('ZIWEI_CX_R1_W8_REQUIRED_W18_SECTION_MISSING');
  if(list(palaces.items).length!==12)fail('ZIWEI_CX_R1_W8_REQUIRES_12_PALACE_BLOCKS');

  const sections=[];
  const firstPayload=[...list(readingFirst.anchors).map(x=>anchorLine(x,l)),...list(readingFirst.paragraphs).map(readable)].filter(Boolean);
  sections.push(projectedSection({sectionId:text(l,'Read first','先看重点'),title:readingFirst.title||text(l,'Read these first','先看这几件事'),summary:report.subtitle||null,payload:firstPayload,kind:'READING_FIRST',sourceRefs:[report.reportDigest,report.source?.readingDigest]}));

  const foundationBlock=list(foundation.items)[0];
  sections.push(projectedSection({sectionId:text(l,'Life & Body','命身基础'),title:foundation.title||foundationBlock?.title||text(l,'Life and Body foundation','命身基础'),summary:foundationBlock?.resolutionLabel||null,payload:paragraphPayload(foundationBlock,l),kind:'FOUNDATION',sourceRefs:sourceRefsOf(foundationBlock)}));

  for(const block of list(palaces.items)){
    const code=clean(block.palaceCode);if(!code)fail('ZIWEI_CX_R1_W8_PALACE_CODE_REQUIRED');
    sections.push(projectedSection({sectionId:block.title||code,title:block.title||code,summary:resolutionSummary(block,l),payload:paragraphPayload(block,l,{includeNetwork:true,includeBoundary:false}),kind:'PALACE_READING',sourceRefs:sourceRefsOf(block)}));
  }

  const patternItems=list(patterns.items);
  if(patternItems.length){
    for(const [index,block] of patternItems.entries())sections.push(projectedSection({sectionId:`${text(l,'Pattern','格局')} · ${block.title||block.label||index+1}`,title:block.title||block.label||text(l,'Qualified pattern','成立格局'),summary:block.resolutionLabel||null,payload:paragraphPayload(block,l),kind:'PATTERN',sourceRefs:sourceRefsOf(block)}));
  }else{
    sections.push(projectedSection({sectionId:text(l,'Patterns','格局'),title:patterns.title||text(l,'Qualified patterns','成立格局'),summary:text(l,'No admitted pattern matched this chart.','本命盘没有命中当前已准入格局。'),payload:[patterns.emptyCopy].filter(Boolean),kind:'PATTERN',sourceRefs:[report.reportDigest]}));
  }

  for(const block of list(timing.items)){
    const suffix=clean(block.kind||block.blockId||'LAYER').replace(/[^A-Z0-9_]+/gi,'_').toUpperCase();
    const payload=[...paragraphPayload(block,l),...list(block.transformations).map(x=>[x.label,x.targetStarLabel,x.palaceLabel].filter(Boolean).join(' · '))].filter(Boolean);
    sections.push(projectedSection({sectionId:block.title||text(l,'Timing layer','时间层'),title:block.title||text(l,'Timing layer','时间层'),summary:block.resolutionLabel||null,payload,kind:'TIMING',sourceRefs:sourceRefsOf(block)}));
  }

  const openItems=list(open.items);
  sections.push(projectedSection({sectionId:text(l,'Open boundaries','解释边界'),title:open.title||text(l,'Open interpretation boundaries','仍未获准解释的部分'),summary:text(l,`${openItems.length} interpretation boundary item(s) remain visible.`,`仍明确保留 ${openItems.length} 个解释边界项目。`),payload:openItems.map(x=>x.customerCopy).filter(Boolean),kind:'OPEN',sourceRefs:[report.reportDigest]}));

  const counts=evidence.counts||{};
  const countLine=text(l,
    `Evidence remains traceable: ${counts.customerReportPalaceBlocks??12} palace blocks, ${counts.timingBlocks??list(timing.items).length} timing blocks, ${counts.openBoundaryItems??openItems.length} open boundary items.`,
    `证据继续可追溯：${counts.customerReportPalaceBlocks??12} 个宫位块、${counts.timingBlocks??list(timing.items).length} 个时间层块、${counts.openBoundaryItems??openItems.length} 个开放边界项目。`
  );
  sections.push(projectedSection({sectionId:text(l,'Why this reading','为什么这样读'),title:evidence.title||text(l,'Why this reading','为什么这样读'),summary:evidence.defaultDisplay==='COLLAPSED'?text(l,'Technical lineage remains secondary to the reading.','技术 lineage 保持次级呈现，不抢占正文。'):null,payload:[evidence.customerSummary,countLine].filter(Boolean),kind:'EVIDENCE',sourceRefs:[evidence.sourceReadingDigest,report.reportDigest]}));

  const anchorHighlights=list(readingFirst.anchors).slice(0,5).map(x=>anchorLine(x,l));
  const resultBase={
    schemaVersion:ZIWEI_CX_R1_W8_REPORT_PROJECTION_SCHEMA,
    work:'ZIWEI-CX-R1-W8',
    rendererId:ZIWEI_CX_R1_W8_REPORT_RENDERER_ID,
    locale:l,
    source:{reportDigest:report.reportDigest,readingDigest:report.source?.readingDigest||null,publicationEnvelopeDigest:publicationEnvelope.envelopeDigest||null},
    hero:{title:report.title,subtitle:report.subtitle,highlights:anchorHighlights},
    navigation:sections.map(x=>x.sectionId),
    sections,
    summary:{sectionCount:sections.length,palaceSectionCount:sections.filter(x=>x.kind==='PALACE_READING').length,patternSectionCount:sections.filter(x=>x.kind==='PATTERN').length,timingSectionCount:sections.filter(x=>x.kind==='TIMING').length,openBoundaryItemCount:openItems.length,duplicateCustomerTextCount:report.summary?.duplicateCustomerTextCount??null,fullW18CustomerNarrativeProjected:true},
    boundaries:{newMeaningCreated:false,newFindingCreated:false,newContradictionResolutionCreated:false,rawCodePromotedToNarrative:false,unknownSuppressed:false,counterEvidenceSuppressed:false,secondPalaceEssayCreated:false,sharedPersonalRealityFileMutationRequired:false}
  };
  const projectionDigest=sha256Stable(resultBase);
  if(stableStringify(publicationEnvelope)!==snap)fail('ZIWEI_CX_R1_W8_INPUT_MUTATION_FORBIDDEN');
  return freeze({...resultBase,projectionDigest});
}

export default Object.freeze({projectZiweiW18FullReport});
