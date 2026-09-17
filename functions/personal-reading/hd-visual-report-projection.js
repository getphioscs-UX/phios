import {textSize} from '../canonical-presentation-runtime/visual-report-page-runtime.js';
import {visualProjectionBuilder} from './visual-report-projection-utils.js';
const text=(v,l)=>v?.[l==='zh-Hans'?'zhHans':'en']||'';
export function adaptHdVisualParent(product){
 if(product?.activeCustomerReadingVersion!=='HD_PRO_R3'||product.publicationDecision?.customerPublishable!==true)throw Error('VRPT_HD_PRODUCTION_SOURCE_REQUIRED');
 const findings=[...product.priority.primaryFindings,...product.priority.secondaryFindings,...product.priority.contextualFindings];
 return {schemaVersion:'PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0',methodId:'HD',readingAuthorityRef:product.readingIr.schemaVersion,productionAdmissionRef:product.publicationDecision.humanReviewEvidence,semanticDigest:product.professionalProductDigest,acceptedUnits:findings.map(f=>({interpretationUnitId:f.findingId,title:text(f.finding,product.locale),plainLanguageExplanation:text(f.howStructuresCombine,product.locale),semanticTags:f.domains,confidenceBoundary:text(f.whatWouldContradictIt,product.locale)})),priorityRefs:product.priority.primaryFindings.map(f=>f.findingId),supportRefs:product.readingIr.technical.structureRefs,tensionRefs:[],openRefs:[],temporalClaims:[],boundaryFlags:['CONFIRMED_EXTERNAL_CHART_ONLY'],boundary:{acceptedAuthorityOnly:true}};
}
export function projectHdVisualReport({product,depth='FREE',reviewMode=false}){
 adaptHdVisualParent(product);
 const p=product,l=p.locale,b=visualProjectionBuilder({methodId:'HD',productId:'HD_FULL_REPORT',sourceReportRef:p.professionalProductDigest,sourceProjectionId:p.schemaVersion,locale:l,depth,reviewMode,identity:{chartDigest:p.chartDigest,summary:p.structuralMap.summary}}),{add,local:L,ref}=b;
 const sections=p.customerReading.customerSections,flat=sections.flatMap(s=>s.customerCards||[]),seen=new Set(),cards=flat.filter(c=>!seen.has(c.cardId)&&seen.add(c.cardId));
 const insight=(c,key)=>({text:text(c[key],l),sourceRef:ref(`${c.cardId}.${key}`),claimRef:ref(`${c.cardId}.${key}`)});
 const map=p.structuralMap;
 add({id:'CHART',title:L('Your confirmed Human Design','你已确认的人类图'),question:L('Which structures are present in your supplied chart?','你提供的图表包含哪些结构？'),templateId:'RPT-T07',type:'NETWORK',nodes:map.centers.map(c=>({id:c.code,label:c.code.replaceAll('_',' '),role:c.state,sourceRefs:[ref(`structuralMap.centers.${c.code}`),...c.sourceRefs]})),edges:map.channels.map(c=>({from:c.centers[0],to:c.centers[1],label:c.channelId,sourceRefs:c.sourceRefs})),insights:cards.slice(0,2).map(c=>insight(c,'body')),informationUnitRefs:[ref('structuralMap')],boundaryText:L('PHI OS structural map · confirmed external chart · four center states remain distinct.','PHI OS 结构图 · 已确认外部图表 · 保留四种中心状态。')});
 if(depth==='FREE')return b.finish();
 const findings=[...p.priority.primaryFindings,...p.priority.secondaryFindings,...p.priority.contextualFindings,...p.priority.advancedDetails];
 for(const card of cards){
  const finding=findings.find(f=>card.cardId===`EDITORIAL-${f.findingId}`);if(!finding)continue;
  const s=sections.find(s=>s.customerCards?.some(c=>c.cardId===card.cardId));
  // Follow the owner's adaptive section selection; repeated atomic readings
  // and unselected gates do not become extra paid pages.
  add({id:card.cardId,title:text(s.title,l),question:L('How do these selected structures work together?','这些已选结构如何共同作用？'),templateId:'RPT-T07',type:'NETWORK',nodes:[{id:finding.findingId,label:L('Composed reading','组合读取'),sourceRefs:[finding.findingId,...finding.technicalRefs.claimIds]},...finding.technicalRefs.structureRefs.map((r,i)=>({id:r,label:finding.structuralEvidence[i]||r.replaceAll('.',' · ').replaceAll('_',' '),sourceRefs:[r,...finding.technicalRefs.sourceRefs]}))],edges:finding.technicalRefs.structureRefs.map(r=>({from:r,to:finding.findingId,label:L('source','来源'),sourceRefs:[r,...finding.technicalRefs.claimIds]})),insights:textSize(text(card.headline,l)+' '+text(card.counterpoint,l),l)>(l==='zh-Hans'?180:110)?[insight(card,'headline')]:[insight(card,'headline'),insight(card,'counterpoint')],informationUnitRefs:[ref(card.cardId)],ruleRefs:finding.technicalRefs.compositionRuleIds,boundaryRefs:[ref(`${card.cardId}.counterpoint`)]});
  if(textSize(text(card.headline,l)+' '+text(card.counterpoint,l),l)>(l==='zh-Hans'?180:110))add({id:`COUNTER_${card.cardId}`,title:L('What would challenge this reading?','什么会挑战这个读取？'),question:text(card.observe,l),templateId:'RPT-T12',type:'SPLIT_COMPARE',nodes:[{id:card.cardId,label:text(s.title,l),sourceRefs:[ref(card.cardId)]}],insights:[insight(card,'counterpoint')],informationUnitRefs:[ref(`${card.cardId}.counterpoint`)]});
 }
 return {...b.finish(),adaptiveBlueprintRef:'content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/report/hd-pro-r3-report-blueprint-authority-v1.json'};
}
