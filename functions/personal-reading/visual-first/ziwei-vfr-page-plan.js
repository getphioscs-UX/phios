export const ZWR_VFR_PAGE_PLAN_VERSION='ZWR-VFR-R1-57-PAGE-LANGUAGE-SEQUENTIAL-v5';

const P=(pageNumber,pageKey,pageFamily,{sectionId=null,diagramIds=[],visual=true,locale=null,readingIndex=null,readingCount=null}={})=>Object.freeze({
 pageNumber,pageKey,pageFamily,sectionId,diagramIds:Object.freeze(diagramIds),visual,locale,readingIndex,readingCount
});

const SECTION_SPECS=Object.freeze([
 ['S02',['ZWD-02','ZWD-03']],
 ['S03',['ZWD-04']],
 ['S04',['ZWD-06','ZWD-13']],
 ['S05',['ZWD-07','ZWD-05']],
 ['S06',['ZWD-08']],
 ['S07',['ZWD-09']],
 ['S08',['ZWD-10']],
 ['S09',['ZWD-11','ZWD-14']],
 ['S10',['ZWD-12']],
 ['S11',['ZWD-15']]
]);

const pages=[
 P(1,'COVER','COVER',{visual:true}),
 P(2,'METHOD_INTRO','FRONT_MATTER',{visual:true}),
 P(3,'ORIGIN','FRONT_MATTER',{visual:true}),
 P(4,'PHIOS_LENS','FRONT_MATTER',{visual:true}),
 P(5,'HOW_TO_READ','FRONT_MATTER',{visual:true}),
 P(6,'TWELVE_PALACE_MAP','OVERVIEW',{diagramIds:['ZWD-01']})
];

let n=7;
for(const [sectionId,diagramIds] of SECTION_SPECS){
 pages.push(P(n++,sectionId+'_MASTER','SECTION_MASTER',{sectionId}));
 pages.push(P(n++,sectionId+'_DIAGRAMS',diagramIds.length>1?'DIAGRAM_COMPOSITE':'DIAGRAM',{sectionId,diagramIds}));
 pages.push(P(n++,sectionId+'_ZH_A','READING_ZH',{sectionId,visual:false,locale:'zhHans',readingIndex:0,readingCount:2}));
 pages.push(P(n++,sectionId+'_ZH_B','READING_ZH',{sectionId,visual:false,locale:'zhHans',readingIndex:1,readingCount:2}));
 pages.push(P(n++,sectionId+'_EN','READING_EN',{sectionId,visual:false,locale:'en',readingIndex:0,readingCount:1}));
}
pages.push(P(n++,'CLOSING_BOUNDARY','CLOSING',{visual:true}));

export const ZWR_VFR_PAGE_PLAN=Object.freeze(pages);

export function validateZwrVfrPagePlan({diagramIds=[]}={}){
 const reasons=[],ps=ZWR_VFR_PAGE_PLAN;
 if(ps.length<50||ps.length>70)reasons.push('PAGE_COUNT_OUTSIDE_BILINGUAL_RANGE');
 if(ps.some((p,i)=>p.pageNumber!==i+1))reasons.push('PAGE_SEQUENCE_INVALID');

 const ids=new Set(diagramIds);
 for(const p of ps)for(const id of p.diagramIds)if(!ids.has(id))reasons.push('DIAGRAM_DATA_MISSING:'+id);
 const bound=ps.flatMap(p=>p.diagramIds);
 for(let i=1;i<=15;i++){
  const id='ZWD-'+String(i).padStart(2,'0');
  if(bound.filter(x=>x===id).length!==1)reasons.push('DIAGRAM_BINDING_NOT_EXACTLY_ONCE:'+id);
 }

 for(const [sectionId] of SECTION_SPECS){
  if(ps.filter(p=>p.sectionId===sectionId&&p.pageFamily==='SECTION_MASTER').length!==1)reasons.push('SECTION_MASTER_INVALID:'+sectionId);
  if(ps.filter(p=>p.sectionId===sectionId&&p.pageFamily==='READING_ZH').length!==2)reasons.push('SECTION_ZH_READING_INVALID:'+sectionId);
  if(ps.filter(p=>p.sectionId===sectionId&&p.pageFamily==='READING_EN').length!==1)reasons.push('SECTION_EN_READING_INVALID:'+sectionId);
 }

 const composites=ps.filter(p=>p.pageFamily==='DIAGRAM_COMPOSITE');
 if(composites.some(p=>p.diagramIds.length!==2))reasons.push('DIAGRAM_COMPOSITE_REQUIRES_TWO_DIAGRAMS');

 return Object.freeze({
  accepted:reasons.length===0,
  reasons:[...new Set(reasons)],
  pageCount:ps.length,
  chapterMasters:ps.filter(p=>p.pageFamily==='SECTION_MASTER').length,
  chineseReadingPages:ps.filter(p=>p.pageFamily==='READING_ZH').length,
  englishReadingPages:ps.filter(p=>p.pageFamily==='READING_EN').length,
  compositeDiagramPages:composites.length
 });
}
export default Object.freeze({ZWR_VFR_PAGE_PLAN,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION});
