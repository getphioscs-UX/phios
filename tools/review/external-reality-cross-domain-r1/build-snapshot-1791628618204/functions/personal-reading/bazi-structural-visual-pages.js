// Presentation-only extension of the existing BaZi projection and Page IR.
// No calculation defaults or interpretations are taken from composition art.
import {visualProjectionBuilder} from './visual-report-projection-utils.js';
import {elementRelation} from '../bzr-full-production/bazi-structural-registry.js';
export const BAZI_STRUCTURAL_BATCH='BAZI-DYNAMIC-R1-BATCH-01';
export function projectBaziStructuralBatch({reading:r,locale,depth,reviewMode}){
 if(!reviewMode||depth!=='PAID')throw Error('BAZI_BATCH_REVIEW_PAID_REQUIRED');
 if(!['en','zh-Hans','bilingual'].includes(locale))throw Error('VRPT_LOCALE_UNSUPPORTED');
 const m=r.professionalModules,pillars=r.structuralModel?.pillars,f=m?.fiveElements,s=m?.dayMasterStrength;
 const elements=['WOOD','FIRE','EARTH','METAL','WATER'];
 if(!r.summary?.reportDigest||pillars?.length!==4||new Set(pillars.map(p=>p.position)).size!==4||!['YEAR','MONTH','DAY','HOUR'].every(pos=>pillars.some(p=>p.position===pos&&p.stem?.sourceRef&&p.branch?.sourceRef))||f?.items?.length!==5||!elements.every(e=>f.items.some(x=>x.element===e&&Number.isInteger(x.rawCount)&&x.rawCount>=0))||!s?.dayMaster?.sourceRef||!f.monthCommand?.season||!Number.isInteger(s.roots?.total))throw Error('BAZI_BATCH_SOURCE_DATA_REQUIRED');
 if(f.items.reduce((sum,x)=>sum+x.rawCount,0)!==f.rawInventory.total||f.rawInventory.total<=0)throw Error('BAZI_BATCH_INVENTORY_INCONSISTENT');
 if(pillars.some(p=>!p.stem.zh||!p.branch.zh||!p.hiddenStems?.length||p.hiddenStems.some(h=>!h.stemZh)||!elements.includes(p.stem.element)||!elements.includes(p.branch.element))||f.items.some(x=>!x.breakdown||['visibleStems','visibleBranches','hiddenStemsUnweighted'].some(key=>!Number.isInteger(x.breakdown[key])||x.breakdown[key]<0)))throw Error('BAZI_BATCH_SOURCE_DATA_REQUIRED');
 if(f.items.some(x=>x.rawCount!==x.breakdown.visibleStems+x.breakdown.visibleBranches+x.breakdown.hiddenStemsUnweighted))throw Error('BAZI_BATCH_INVENTORY_INCONSISTENT');
 const sourceReportRef=`BAZI_FULL_REPORT:${r.summary.reportDigest}`;
 const b=visualProjectionBuilder({methodId:'BZR',productId:'BAZI_FULL_REPORT',sourceReportRef,sourceProjectionId:pillars[0].stem.sourceRef.split('#')[0],locale:locale==='bilingual'?'zh-Hans':locale,depth,reviewMode,identity:pillars.map(p=>({position:p.position,stem:p.stem.code,branch:p.branch.code}))});
 const t=(en,zh)=>locale==='bilingual'?`${zh} / ${en}`:locale==='zh-Hans'?zh:en;
 const el=e=>t(e[0]+e.slice(1).toLowerCase(),{WOOD:'木',FIRE:'火',EARTH:'土',METAL:'金',WATER:'水'}[e]);
 const ref=b.ref,positions={YEAR:t('Year','年柱'),MONTH:t('Month','月柱'),DAY:t('Day','日柱'),HOUR:t('Hour','时柱')};
 const pillarNodes=['YEAR','MONTH','DAY','HOUR'].map(position=>{const p=pillars.find(x=>x.position===position);return {id:position,label:positions[position],stem:p.stem.zh,branch:p.branch.zh,stemCode:p.stem.code,branchCode:p.branch.code,stemElement:p.stem.element,branchElement:p.branch.element,stemLabel:el(p.stem.element),branchLabel:el(p.branch.element),polarity:t(p.stem.polarity==='YIN'?'Yin':'Yang',p.stem.polarity==='YIN'?'阴':'阳'),hiddenStems:p.hiddenStems?.map(x=>x.stemZh).join(' · ')||'',sourceRefs:[p.stem.sourceRef,p.branch.sourceRef,ref(`structuralModel/pillars/${pillars.indexOf(p)}/hiddenStems`)]};});
 const elementNodes=elements.map(e=>{const i=f.items.findIndex(x=>x.element===e),x=f.items[i];return {id:e,label:el(e),value:x.rawCount,breakdown:x.breakdown,sourceRefs:[ref(`professionalModules/fiveElements/items/${i}/rawCount`)]};});
 const dm=s.dayMaster,season=f.monthCommand;
 const context={dayMaster:{glyph:dm.zh,code:dm.code,element:dm.element,label:el(dm.element),polarity:t(dm.polarity==='YIN'?'Yin':'Yang',dm.polarity==='YIN'?'阴':'阳'),sourceRefs:[dm.sourceRef]},season:{glyph:season.branchZh,code:season.branchCode,element:season.element,label:el(season.element),name:t(season.season[0]+season.season.slice(1).toLowerCase(),{SPRING:'春',SUMMER:'夏',AUTUMN:'秋',WINTER:'冬',TRANSITION:'季节转换'}[season.season]||season.season),sourceRefs:[ref('professionalModules/fiveElements/monthCommand')]},roots:{value:s.roots.total,sourceRefs:[ref('professionalModules/dayMasterStrength/roots/total')]},total:f.rawInventory.total};
 const boundary=t('Unweighted counts, not strength scores. No final strong/weak verdict.','未加权计数，不等于强弱评分；不作最终旺弱判断。');
 const designs={referenceDataCopied:false,cardTypes:['PRIMARY_INSIGHT','CONDITION','OPEN_QUESTION'],iconFamily:'REPORT_OUTLINE_MEDALLION_R1',iconIds:[],tokenRefs:['--phi-report-ivory','--phi-report-navy','--phi-report-gold','--phi-report-border','--phi-report-font-title'],classNames:['vrpt-page','vrpt-heading','vrpt-primary','vrpt-insights','vrpt-tile','vrpt-evidence'],inlineStyle:false,headerContract:'REPORT_SHARED_HEADER_R1',footerContract:'REPORT_SHARED_FOOTER_R1'};
 const titles=[['Your BaZi Snapshot','你的八字总览'],['Day Master & Seasonal Context','日主与季节背景'],['Four Pillars Structure','四柱结构'],['Five Elements Distribution','五行分布'],['Five Element Relationships','五行关系']];
 const questions=[['What is the starting structure of this reading?','这份读取从怎样的结构出发？'],['Where does the Day Master sit within the seasonal context?','日主处在怎样的季节背景中？'],['How do the stems and branches form the four pillars?','天干与地支如何组成四柱？'],['How are the unweighted element counts distributed?','未加权的五行计数如何分布？'],['How do generating and controlling relationships connect the elements?','相生与相克如何连接五行？']];
 const edges=elements.flatMap(from=>elements.filter(to=>to!==from).flatMap(to=>{const relation=elementRelation(from,to);return ['SUBJECT_GENERATES_TARGET','SUBJECT_CONTROLS_TARGET'].includes(relation)?[{from,to,relation,label:relation==='SUBJECT_GENERATES_TARGET'?t('Generates','相生'):t('Controls','相克'),sourceRefs:['BZR-STRUCTURAL-REGISTRY:elementRelation',...elementNodes.find(x=>x.id===from).sourceRefs,...elementNodes.find(x=>x.id===to).sourceRefs]}]:[];}));
 const contextNodes=[{id:'DAY_MASTER',label:t('Day Master','日主'),value:dm.zh,sourceRefs:[dm.sourceRef]},{id:'SEASON',label:t('Month command','月令'),value:season.branchZh,sourceRefs:context.season.sourceRefs},{id:'ROOTS',label:t('Root records','根气记录'),value:s.roots.total,sourceRefs:context.roots.sourceRefs}];
 const configs=[['RPT-T02','DOMAIN_GRID',pillarNodes,[],'M03'],['RPT-T03','RADIAL_MAP',contextNodes,[],'M04'],['RPT-T03','STRUCTURAL_DIAGRAM',pillarNodes,[],'M04'],['RPT-T04','DONUT',elementNodes,[],'M05'],['RPT-T07','NETWORK',elementNodes,edges,'M05']];
 configs.forEach(([templateId,type,nodes,pageEdges,master],i)=>{
  const number=i+6;
  const facts=[
   [t(`${dm.code} · ${dm.element.toLowerCase()} Day Master.`,`${dm.zh}${el(dm.element)}日主。`),dm.sourceRef],
   [t('Final strength remains open.','最终强弱保持开放。'),ref('professionalModules/dayMasterStrength/withheldVerdict')],
   [t('Compare the structure with lived observations.','将结构与实际经历对照观察。'),ref('professionalModules/realityBridge')]
  ];
  if(number===8)facts[0]=[t('Each column preserves its stem and branch source.','每柱保留天干与地支的来源。'),ref('structuralModel/pillars')];
  if(number===9)facts[0]=[t(`${context.total} unweighted inventory entries.`,`${context.total} 个未加权清单计数。`),ref('professionalModules/fiveElements/rawInventory/total')];
  if(number===10){facts[0]=[t('Arrows show the five-element rule, not personal intensity.','箭头表示五行规则，不表示个人作用强度。'),'BZR-STRUCTURAL-REGISTRY:elementRelation'];}
  b.add({id:`P${number}`,pageNumber:number,title:t(...titles[i]),question:t(...questions[i]),templateId,type,nodes,edges:pageEdges,insights:facts.map(([text,sourceRef])=>({text,sourceRef})),boundaryText:boundary,visualTemplateId:master,reportIdentity:'BAZI_FULL_REPORT',accessState:'OPEN',visualDesign:{...designs},informationUnitRefs:[ref('structuralModel/pillars'),ref('professionalModules/fiveElements'),ref('professionalModules/dayMasterStrength')]});
  const page=b.pages.at(-1);
  page.visual={...page.visual,context,pillars:pillarNodes,elements:elementNodes,unit:t('Unweighted inventory count','未加权清单计数'),comparableWithinSource:true};
  page.visual.dataRefs=[...new Set([...page.visual.dataRefs,...pillarNodes.flatMap(x=>x.sourceRefs),...elementNodes.flatMap(x=>x.sourceRefs),...contextNodes.flatMap(x=>x.sourceRefs)])];
  page.evidenceRefs=[...page.visual.dataRefs,...page.insights.map(x=>x.sourceRef)];
 });
 return {...b.finish(),locale,visualBatch:BAZI_STRUCTURAL_BATCH,totalPages:26,batchPageRange:[6,10],reviewMode:true};
}
