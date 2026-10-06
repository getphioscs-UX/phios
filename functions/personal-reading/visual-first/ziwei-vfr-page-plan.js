export const ZWR_VFR_PAGE_PLAN_VERSION='ZWR-VFR-R1-47-PAGE-DEEP-MANUSCRIPT-v2';

const P=(pageNumber,pageKey,pageFamily,{sectionId=null,diagramIds=[],visual=true,textRole='SUPPORTING',readingIndex=null,readingCount=null}={})=>Object.freeze({
 pageNumber,pageKey,pageFamily,sectionId,diagramIds:Object.freeze(diagramIds),visual,textRole,readingIndex,readingCount
});

export const ZWR_VFR_PAGE_PLAN=Object.freeze([
 P(1,'COVER','COVER',{visual:true}),
 P(2,'METHOD_INTRO','FRONT_MATTER',{visual:true}),
 P(3,'ORIGIN','FRONT_MATTER',{visual:true}),
 P(4,'PHIOS_LENS','FRONT_MATTER',{visual:true}),
 P(5,'HOW_TO_READ','FRONT_MATTER',{visual:true}),
 P(6,'TWELVE_PALACE_MAP','OVERVIEW',{diagramIds:['ZWD-01']}),

 P(7,'S02_MASTER','SECTION_MASTER',{sectionId:'S02'}),
 P(8,'S02_LIFE_BODY','DIAGRAM',{sectionId:'S02',diagramIds:['ZWD-02']}),
 P(9,'S02_NETWORK','DIAGRAM',{sectionId:'S02',diagramIds:['ZWD-03']}),
 P(10,'S02_READING','READING',{sectionId:'S02',visual:false,readingIndex:0,readingCount:1}),

 P(11,'S03_MASTER','SECTION_MASTER',{sectionId:'S03'}),
 P(12,'S03_INNER_STRUCTURE','DIAGRAM',{sectionId:'S03',diagramIds:['ZWD-04']}),
 P(13,'S03_READING','READING',{sectionId:'S03',visual:false,readingIndex:0,readingCount:1}),

 P(14,'S04_MASTER','SECTION_MASTER',{sectionId:'S04'}),
 P(15,'S04_CAREER_NETWORK','DIAGRAM',{sectionId:'S04',diagramIds:['ZWD-06']}),
 P(16,'S04_STRUCTURAL_CROSS','DIAGRAM',{sectionId:'S04',diagramIds:['ZWD-13']}),
 P(17,'S04_READING_A','READING',{sectionId:'S04',visual:false,readingIndex:0,readingCount:2}),
 P(18,'S04_READING_B','READING',{sectionId:'S04',visual:false,readingIndex:1,readingCount:2}),

 P(19,'S05_MASTER','SECTION_MASTER',{sectionId:'S05'}),
 P(20,'S05_WEALTH_NETWORK','DIAGRAM',{sectionId:'S05',diagramIds:['ZWD-07']}),
 P(21,'S05_TRANSFORMATIONS','DIAGRAM',{sectionId:'S05',diagramIds:['ZWD-05']}),
 P(22,'S05_READING_A','READING',{sectionId:'S05',visual:false,readingIndex:0,readingCount:2}),
 P(23,'S05_READING_B','READING',{sectionId:'S05',visual:false,readingIndex:1,readingCount:2}),

 P(24,'S06_MASTER','SECTION_MASTER',{sectionId:'S06'}),
 P(25,'S06_RELATIONSHIP_NETWORK','DIAGRAM',{sectionId:'S06',diagramIds:['ZWD-08']}),
 P(26,'S06_READING_A','READING',{sectionId:'S06',visual:false,readingIndex:0,readingCount:2}),
 P(27,'S06_READING_B','READING',{sectionId:'S06',visual:false,readingIndex:1,readingCount:2}),

 P(28,'S07_MASTER','SECTION_MASTER',{sectionId:'S07'}),
 P(29,'S07_SUPPORT_NETWORK','DIAGRAM',{sectionId:'S07',diagramIds:['ZWD-09']}),
 P(30,'S07_READING_A','READING',{sectionId:'S07',visual:false,readingIndex:0,readingCount:2}),
 P(31,'S07_READING_B','READING',{sectionId:'S07',visual:false,readingIndex:1,readingCount:2}),

 P(32,'S08_MASTER','SECTION_MASTER',{sectionId:'S08'}),
 P(33,'S08_PRESSURE_CAPACITY','DIAGRAM',{sectionId:'S08',diagramIds:['ZWD-10']}),
 P(34,'S08_READING','READING',{sectionId:'S08',visual:false,readingIndex:0,readingCount:1}),

 P(35,'S09_MASTER','SECTION_MASTER',{sectionId:'S09'}),
 P(36,'S09_DAXIAN','DIAGRAM',{sectionId:'S09',diagramIds:['ZWD-11']}),
 P(37,'S09_NATAL_DAXIAN','DIAGRAM',{sectionId:'S09',diagramIds:['ZWD-14']}),
 P(38,'S09_READING_A','READING',{sectionId:'S09',visual:false,readingIndex:0,readingCount:2}),
 P(39,'S09_READING_B','READING',{sectionId:'S09',visual:false,readingIndex:1,readingCount:2}),

 P(40,'S10_MASTER','SECTION_MASTER',{sectionId:'S10'}),
 P(41,'S10_CURRENT_ACTIVATION','DIAGRAM',{sectionId:'S10',diagramIds:['ZWD-12']}),
 P(42,'S10_READING_A','READING',{sectionId:'S10',visual:false,readingIndex:0,readingCount:2}),
 P(43,'S10_READING_B','READING',{sectionId:'S10',visual:false,readingIndex:1,readingCount:2}),

 P(44,'S11_MASTER','SECTION_MASTER',{sectionId:'S11'}),
 P(45,'S11_WHOLE_CHART_NAVIGATION','DIAGRAM',{sectionId:'S11',diagramIds:['ZWD-15']}),
 P(46,'S11_READING','READING',{sectionId:'S11',visual:false,readingIndex:0,readingCount:1}),

 P(47,'CLOSING_BOUNDARY','CLOSING',{visual:true})
]);

export function validateZwrVfrPagePlan({diagramIds=[]}={}){
 const reasons=[],pages=ZWR_VFR_PAGE_PLAN;
 if(pages.length!==47)reasons.push('PAGE_COUNT_NOT_47');
 if(pages.some((p,i)=>p.pageNumber!==i+1))reasons.push('PAGE_SEQUENCE_INVALID');
 const ids=new Set(diagramIds);
 for(const p of pages)for(const id of p.diagramIds)if(!ids.has(id))reasons.push('DIAGRAM_DATA_MISSING:'+id);
 const bound=pages.flatMap(p=>p.diagramIds);
 for(let i=1;i<=15;i++){
  const id='ZWD-'+String(i).padStart(2,'0');
  if(bound.filter(x=>x===id).length!==1)reasons.push('DIAGRAM_BINDING_NOT_EXACTLY_ONCE:'+id);
 }
 const sections=new Set(pages.map(p=>p.sectionId).filter(Boolean));
 for(const id of ['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'])if(!sections.has(id))reasons.push('SECTION_PAGE_MISSING:'+id);
 for(const id of sections){
  if(!pages.some(p=>p.sectionId===id&&p.pageFamily==='SECTION_MASTER'))reasons.push('SECTION_MASTER_MISSING:'+id);
  if(!pages.some(p=>p.sectionId===id&&p.pageFamily==='READING'))reasons.push('SECTION_READING_MISSING:'+id);
 }
 const textOnly=pages.filter(p=>p.visual===false).length;
 let consecutive=0,maxConsecutive=0;
 for(const p of pages){consecutive=p.visual?0:consecutive+1;maxConsecutive=Math.max(maxConsecutive,consecutive);}
 if(maxConsecutive>2)reasons.push('TOO_MANY_CONSECUTIVE_PROSE_PAGES');
 return Object.freeze({
  accepted:reasons.length===0,
  reasons:[...new Set(reasons)],
  pageCount:pages.length,
  visualPages:pages.length-textOnly,
  textOnlyPages:textOnly,
  maxConsecutiveProsePages:maxConsecutive
 });
}
export default Object.freeze({ZWR_VFR_PAGE_PLAN,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION});
