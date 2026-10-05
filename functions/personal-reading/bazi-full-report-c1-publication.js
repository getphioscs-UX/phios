import {BAZI_FULL_REPORT_C1 as copy} from './narrative/bazi-full-report-c1-copy.generated.js';
import {BAZI_SECTION_REGISTRY,bindSectionVisual} from '../canonical-presentation-runtime/report-section-contract.js';
import {GUIDED_REPORT_SUCCESSOR} from '../canonical-presentation-runtime/report-publication-contract.js';
import {REPORT_EDITORIAL_ASSETS} from '../canonical-presentation-runtime/report-editorial-registry.js';
import {resolveReportEditorialAsset} from '../canonical-presentation-runtime/report-editorial-resolver.js';

// A review-only edition of the existing publication owner. No birth calculation,
// provider, historical-copy replacement, acceptance receipt, or release path.
export function projectBaziFullReportC1({locale,reviewOnly,natalAuthority,timingAuthority}={}){
 if(reviewOnly!==true)throw Error('BAZI_C1_REVIEW_GATE_REQUIRED');
 if(locale!=='zh-Hans')throw Error('BAZI_C1_ENGLISH_NOT_ACCEPTED');
 if(JSON.stringify(natalAuthority)!==JSON.stringify(copy.natalAuthority.pillars))throw Error('BAZI_C1_NATAL_AUTHORITY_MISMATCH');
 if(timingAuthority?.daYun!=='己巳'||timingAuthority?.annual!=='丙寅'||timingAuthority?.identityState!=='PARTIAL_TEST_STRUCTURE'||timingAuthority?.gregorianYear!=null||timingAuthority?.age!=null||timingAuthority?.startDate!=null)throw Error('BAZI_C1_TIMING_AUTHORITY_MISMATCH');
 const pages=[];
 const titles=['命盘与读取基础',...copy.sections.map(s=>s.title)];
 const add=(s,body)=>pages.push({...s,...body,pageNumber:pages.length+6,pageKey:`C1_${s.sectionKey}_${pages.length+1}`,facts:[],observations:[],items:[],boundary:''});
 for(let i=0;i<10;i++){
  const registered=BAZI_SECTION_REGISTRY.sections[i];
  const section={sectionKey:registered.key,sectionNumber:registered.number,sectionTitle:{'zh-Hans':titles[i],en:''},visualBinding:bindSectionVisual(registered.key),heroPlacement:bindSectionVisual(registered.key).placement};
  add(section,{pageFamily:'SECTION_OPENER_PAGE',title:titles[i],paragraphs:[]});
  const paragraphs=i===0?[{id:'AUTHORITY:NATAL',text:'庚申／甲子／庚辰／庚寅\n\n日主：庚金。\n\n这份读取以这组四柱为基础。出生公历日期、年龄与起运日期未在当前资料中提供，因此不从四柱反推这些身份资料。\n\n阶段读取采用己巳大运与丙寅年度柱的测试结构；它们不能被视为已核实的公历年份与年龄。'}]:copy.sections[i-1].paragraphs;
  // Preserve each accepted paragraph and its sequence. Page allocation estimates
  // actual lines and paragraph spacing, rather than shrinking long-form prose.
  const groups=[];let group=[],height=0;
  for(const p of paragraphs){const lines=p.text.split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil([...line].length/41)),0),cost=lines*25+11;
   if(height+cost>775&&group.length){groups.push(group);group=[];height=0;}
   group.push(p);height+=cost;
  }if(group.length)groups.push(group);
  for(const group of groups)add(section,{pageFamily:'NARRATIVE_BODY_PAGE',title:titles[i],paragraphs:group.map(p=>p.text),compositionNodes:[{sourceNodeId:registered.key,primaryVisualHtml:null,facts:[],items:[],observations:[],paragraphs:group.map((p,n)=>({text:p.text,blockId:p.id,ordinal:n+1}))}],compositionBoundaries:[]});
 }
 const intro=[1,2,3,4,5].map(page=>({pageNumber:page,kind:page===1?'STATIC_COVER':'STATIC',src:resolveReportEditorialAsset({registry:{bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS},methodId:'BZR',page,locale:page===1?'bilingual':locale,publicBaseUrl:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev'}).src,alt:['八字读取封面','八字方法说明','方法来源','读取视角','如何阅读'][page-1],...(page===1?{subject:{displayName:null,birthDate:null,birthTime:null,timeAccuracy:'UNKNOWN'}}:{})}));
 return {schemaVersion:GUIDED_REPORT_SUCCESSOR,methodId:'BZR',locale,totalPages:pages.length+5,intro,pages,customerPublishable:false,successorBaselineActivated:false,physicalComposition:{version:'BAZI_FR_C1_REVIEW_ONLY'},providerCalls:0,sourceEdition:copy.version};
}
