import {bindZiweiReportVisual} from '../canonical-presentation-runtime/ziwei-report-visuals.js';
import {assemblePublicationSnapshot} from '../canonical-presentation-runtime/visual-report-page-runtime.js';
import {PHYSICAL_COMPOSITION_R1} from '../canonical-presentation-runtime/physical-composition-contract.js';
import {REPORT_EDITORIAL_ASSETS} from '../canonical-presentation-runtime/report-editorial-registry.js';
import {resolveReportEditorialAsset} from '../canonical-presentation-runtime/report-editorial-resolver.js';
import {ZIWEI_REPORT_SECTIONS,ZIWEI_STAR_PROFILES as stars,ZIWEI_PALACE_LENSES as palaces,ZIWEI_TRANSFORMATION_MODIFIERS as modifiers} from './narrative/ziwei-semantic-canon.js';
import {ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION} from './narrative/ziwei-professional-synthesis-r5.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const ZIWEI_R5_PAGE_ROLES={
 S01:['STRUCTURE'],
 S02:['CORE_SYNTHESIS','DECISION_CONDITIONS'],
 S03:['INNER_SYNTHESIS','RECOVERY_TENSION'],
 S04:['CAREER_SYNTHESIS','CAREER_NAVIGATION'],
 S05:['WEALTH_SYNTHESIS','WEALTH_NAVIGATION'],
 S06:['RELATIONSHIP_SYNTHESIS','RELATIONSHIP_NAVIGATION'],
 S07:['SUPPORT_SYNTHESIS','SUPPORT_NAVIGATION'],
 S08:['PRESSURE_SYNTHESIS','RECOVERY_NAVIGATION'],
 S09:['CYCLE_SYNTHESIS','CYCLE_NAVIGATION'],
 S10:['ANNUAL_SYNTHESIS','ANNUAL_NAVIGATION'],
 S11:['WHOLE_CHART_NAVIGATION'],
 S12:['METHOD_BOUNDARIES']
};
const TITLES={
 STRUCTURE:['结构坐标','Structural Coordinates'],
 CORE_SYNTHESIS:['命身综合','Life–Body Synthesis'],DECISION_CONDITIONS:['条件与现实落地','Conditions & Lived Implementation'],
 INNER_SYNTHESIS:['内在运行综合','Inner Operating Synthesis'],RECOVERY_TENSION:['恢复与张力','Recovery & Tension'],
 CAREER_SYNTHESIS:['事业综合主轴','Career Synthesis'],CAREER_NAVIGATION:['事业条件与时序','Career Conditions & Timing'],
 WEALTH_SYNTHESIS:['财富结构综合','Wealth Synthesis'],WEALTH_NAVIGATION:['资源边界与时序','Resource Boundaries & Timing'],
 RELATIONSHIP_SYNTHESIS:['关系结构综合','Relationship Synthesis'],RELATIONSHIP_NAVIGATION:['互惠、边界与修复','Reciprocity, Boundaries & Repair'],
 SUPPORT_SYNTHESIS:['支持网络综合','Support Network Synthesis'],SUPPORT_NAVIGATION:['接收、责任与分工','Receiving, Responsibility & Roles'],
 PRESSURE_SYNTHESIS:['压力结构综合','Pressure Synthesis'],RECOVERY_NAVIGATION:['容量与恢复导航','Capacity & Recovery Navigation'],
 CYCLE_SYNTHESIS:['大限综合主线','Da Xian Synthesis'],CYCLE_NAVIGATION:['长周期验证','Long-cycle Validation'],
 ANNUAL_SYNTHESIS:['流年综合主线','Annual Synthesis'],ANNUAL_NAVIGATION:['年度观察重点','Annual Observation Priorities'],
 WHOLE_CHART_NAVIGATION:['整盘现实导航','Whole-chart Navigation'],METHOD_BOUNDARIES:['方法与边界','Method & Boundaries']
};
function diagram(evidence,codes,locale,layer=null){
 const s=evidence.structured||evidence,zh=locale==='zh-Hans',label=c=>palaces[c]?.label?.[locale]||(zh?'宫位未解析':'Unresolved palace');
 return '<div class="zwr-evidence-grid" data-ziwei-visual="'+(layer?'TIMING_TRANSFORMATIONS':'PALACE_PLACEMENTS')+'">'+codes.map(code=>{
  const p=s.palaces.find(x=>x.palaceCode===code),starText=s.placements.filter(x=>x.palaceCode===code).map(x=>esc(stars[x.starCode]?.label?.[locale]||(zh?'未解析星曜':'Unresolved star'))).join(zh?'、':', ')||(zh?'无已获准星曜落点':'No admitted star placement');
  const tx=layer?s.transformations.filter(x=>x.layer===layer&&x.palaceCode===code).map(x=>'<p class="zwr-modifier">'+esc(stars[x.targetStarCode]?.label?.[locale]||(zh?'未解析星曜':'Unresolved star'))+' · '+esc(modifiers[x.transformationCode]?.label?.[locale]||(zh?'未获准修饰':'Unadmitted modifier'))+'</p>').join(''):'';
  return '<article><h3>'+esc(label(code))+(p?.isBodyPalace?' · '+(zh?'身宫':'Body'):'')+'</h3><p>'+starText+'</p>'+tx+'</article>';
 }).join('')+'</div>';
}
function openerDefaults(id,locale){
 const zh=locale==='zh-Hans';
 if(id==='S01')return zh?['命宫与身宫分别定位','十二宫与六条对宫轴','星曜落点先于综合解释']:['Locate Life and Body separately','Twelve palaces and six opposite axes','Placements precede synthesis'];
 if(id==='S12')return zh?['十二宫与获准星曜','本命、大限与流年分层','来源、未知与解释边界']:['Twelve palaces and admitted stars','Natal, Da Xian and Liu Nian kept distinct','Sources, unknowns and interpretation boundaries'];
 return [];
}
export function buildZiweiProfessionalSynthesisR5Publication({evidence,sections,locale,subjectPresentation}={}){
 const s=evidence.structured||evidence,zh=locale==='zh-Hans',pages=[],sourceBlocks=[];
 const base=(reg,role)=>({sectionId:reg.sectionId,sectionKey:reg.sectionId+'_'+reg.code,sectionNumber:reg.sectionId.slice(1),sectionTitle:reg.title,title:TITLES[role]?.[zh?0:1]||reg.title[locale],pageKey:'ZWR-R5:'+reg.sectionId+':'+role,definitionKey:'ZWR-R5:'+reg.sectionId+':'+role,physicalPageRole:role,compositionGroupId:'ZWR-R5:'+reg.sectionId+':'+role,locale,fitMode:'STANDARD',priority:'REQUIRED',mustBreakBefore:true,mustBreakAfter:true,canMerge:false,paragraphs:[],items:[],facts:[],observations:[],boundary:'',visualBinding:{},temporal:null});
 for(const reg of ZIWEI_REPORT_SECTIONS){
  const section=sections.find(x=>x.sectionId===reg.sectionId);if(!section)throw Error('ZIWEI_R5_SECTION_MISSING:'+reg.sectionId);
  const nodeId='ZWR-R5:'+s.subjectKey+':'+reg.sectionId,items=section.synthesisIr?.keyInsights||openerDefaults(reg.sectionId,locale);
  pages.push({...base(reg,'SECTION_MASTER'),pageFamily:'SECTION_OPENER_PAGE',sourceNodeIds:[nodeId+':MASTER'],paragraphs:[],items,sourceClaimRefs:section.synthesisIr?.claims?.map(c=>c.claimId)||section.claims.map(c=>c.claimId)});
  const blocks=section.publicationIr.blocks.map((b,i)=>({text:b.prose,sourceNodeId:nodeId,sourceParagraphIndex:i,ordinal:i,blockId:b.blockId,claimRefs:b.claimRefs}));sourceBlocks.push(...blocks);
  const roles=ZIWEI_R5_PAGE_ROLES[reg.sectionId],split=Math.ceil(blocks.length/roles.length);
  for(const [i,role] of roles.entries()){
   const selected=blocks.slice(i*split,(i+1)*split),codes=section.synthesisIr?[...new Set([...section.synthesisIr.primaryPalaces,...section.synthesisIr.contextPalaces])]:s.palaces.map(p=>p.palaceCode).slice(0,6);
   const layer=reg.sectionId==='S09'?'DA_XIAN':reg.sectionId==='S10'?'LIU_NIAN':null;
   const visual=i===0&&reg.sectionId!=='S12'?diagram(evidence,codes.slice(0,4),locale,layer):null;
   pages.push({...base(reg,role),pageFamily:reg.sectionId==='S12'?'METHOD_APPENDIX_PAGE':'NARRATIVE_ANALYSIS_PAGE',sourceNodeIds:[nodeId],compositionNodes:[{sourceNodeId:nodeId,paragraphs:selected,primaryVisualHtml:visual,items:[],facts:[],observations:[]}],compositionBoundaries:[]});
  }
 }
 pages.forEach((p,i)=>{p.pageNumber=i+7;p.visualBinding=bindZiweiReportVisual({sectionId:p.sectionId,pageNumber:p.pageNumber,isMaster:p.pageFamily==='SECTION_OPENER_PAGE'});p.heroPlacement=p.visualBinding.placement;p.editorialVersion=sections.find(x=>x.sectionId===p.sectionId)?.editorialVersion||ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION;});
 const intro=[1,2,3,4,5].map(page=>({pageNumber:page,kind:page===1?'STATIC_COVER':'STATIC',src:resolveReportEditorialAsset({registry:{bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS},methodId:'ZWR',page,locale:page===1?'bilingual':locale,publicBaseUrl:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev'}).src,alt:'Zi Wei '+page,...(page===1?{subject:subjectPresentation}:{})}));
 const chartHtml=diagram(evidence,s.palaces.map(p=>p.palaceCode),locale);
 intro.push({pageNumber:6,kind:'FROZEN_TEMPLATE',html:'<section class="pub-page zwr-chart-snapshot" data-page-number="6"><header class="pub-header"><span>PHI OS</span><span>'+(zh?'紫微斗数':'Zi Wei')+'</span></header><div class="pub-heading"><h2>'+(zh?'本命结构一览':'Your Natal Structure')+'</h2><p>'+esc(subjectPresentation.displayName)+' · '+esc(subjectPresentation.birthDate)+' · '+esc(subjectPresentation.birthTime)+'</p></div>'+chartHtml+'<p class="pub-boundary">'+(zh?'身宫标记所落宫位；未显示的亮度状态保持未知。':'Body marks its host palace; undisplayed brightness states remain unknown.')+'</p><footer class="pub-footer"><span>PHI OS</span><span>06 / '+(pages.length+6)+'</span></footer></section>'});
 return assemblePublicationSnapshot({methodId:'ZWR',locale,intro,pages,layout:PHYSICAL_COMPOSITION_R1,physicalComposition:{version:'ZIWEI-R5-PROFESSIONAL-SYNTHESIS-PHYSICAL-v1',sourceBlocks,sectionIds:ZIWEI_REPORT_SECTIONS.map(r=>r.sectionId),reference:'ZIWEI-R5-PROFESSIONAL-SYNTHESIS',semanticReuse:true},temporalSnapshot:s.targetContext,generatedAt:new Date(0).toISOString(),internalPages:sections,subjectPresentation}).customer;
}
export default Object.freeze({buildZiweiProfessionalSynthesisR5Publication,ZIWEI_R5_PAGE_ROLES});
