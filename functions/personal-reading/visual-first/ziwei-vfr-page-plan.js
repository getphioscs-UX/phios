export const ZWR_VFR_PAGE_PLAN_VERSION='ZWR-VFR-R1-ADAPTIVE-LANGUAGE-SEQUENTIAL-v6';
export const ZWR_VFR_FIT_PROFILE_VERSION='ZWR-VFR-R1-PUBLICATION-FIT-v1';

const ZH_PAGE_CHAR_BUDGET=760;
const EN_PAGE_CHAR_BUDGET=3500;
const MIN_ZH_PAGES=2;
const MAX_ZH_PAGES=4;
const MIN_EN_PAGES=1;
const MAX_EN_PAGES=2;

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

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const chars=copy=>(copy?.paragraphs||[]).reduce((n,p)=>n+String(p||'').length,0);

export function deriveZwrVfrFitProfile({sections=[]}={}){
 const by=new Map((sections||[]).map(s=>[s.sectionId,s]));
 const sectionFit=SECTION_SPECS.map(([sectionId])=>{
  const s=by.get(sectionId)||{};
  const zhChars=chars(s.zhHans);
  const enChars=chars(s.en);
  const zhPages=clamp(Math.ceil(Math.max(1,zhChars)/ZH_PAGE_CHAR_BUDGET),MIN_ZH_PAGES,MAX_ZH_PAGES);
  const enPages=clamp(Math.ceil(Math.max(1,enChars)/EN_PAGE_CHAR_BUDGET),MIN_EN_PAGES,MAX_EN_PAGES);
  return Object.freeze({sectionId,zhChars,enChars,zhPages,enPages});
 });
 return Object.freeze({
  schemaVersion:ZWR_VFR_FIT_PROFILE_VERSION,
  budgets:Object.freeze({zhCharsPerPage:ZH_PAGE_CHAR_BUDGET,enCharsPerPage:EN_PAGE_CHAR_BUDGET}),
  sectionFit:Object.freeze(sectionFit)
 });
}

export function buildZwrVfrPagePlan({sections=[]}={}){
 const fit=deriveZwrVfrFitProfile({sections});
 const fitBy=new Map(fit.sectionFit.map(x=>[x.sectionId,x]));
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
  const sf=fitBy.get(sectionId)||{zhPages:MIN_ZH_PAGES,enPages:MIN_EN_PAGES};
  pages.push(P(n++,sectionId+'_MASTER','SECTION_MASTER',{sectionId}));
  pages.push(P(n++,sectionId+'_DIAGRAMS',diagramIds.length>1?'DIAGRAM_COMPOSITE':'DIAGRAM',{sectionId,diagramIds}));
  for(let i=0;i<sf.zhPages;i++)pages.push(P(n++,sectionId+'_ZH_'+String.fromCharCode(65+i),'READING_ZH',{sectionId,visual:false,locale:'zhHans',readingIndex:i,readingCount:sf.zhPages}));
  for(let i=0;i<sf.enPages;i++)pages.push(P(n++,sectionId+'_EN_'+String.fromCharCode(65+i),'READING_EN',{sectionId,visual:false,locale:'en',readingIndex:i,readingCount:sf.enPages}));
 }
 pages.push(P(n++,'CLOSING_BOUNDARY','CLOSING',{visual:true}));
 return Object.freeze(pages);
}

export const ZWR_VFR_PAGE_PLAN=buildZwrVfrPagePlan();

export function validateZwrVfrPagePlan({diagramIds=[],pages=ZWR_VFR_PAGE_PLAN,sections=[]}={}){
 const reasons=[],ps=pages;
 if(ps.length<50||ps.length>80)reasons.push('PAGE_COUNT_OUTSIDE_BILINGUAL_RANGE');
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
  if(ps.filter(p=>p.sectionId===sectionId&&p.pageFamily==='READING_ZH').length<MIN_ZH_PAGES)reasons.push('SECTION_ZH_READING_TOO_FEW:'+sectionId);
  if(ps.filter(p=>p.sectionId===sectionId&&p.pageFamily==='READING_EN').length<MIN_EN_PAGES)reasons.push('SECTION_EN_READING_TOO_FEW:'+sectionId);
 }
 const composites=ps.filter(p=>p.pageFamily==='DIAGRAM_COMPOSITE');
 if(composites.some(p=>p.diagramIds.length!==2))reasons.push('DIAGRAM_COMPOSITE_REQUIRES_TWO_DIAGRAMS');
 const fit=deriveZwrVfrFitProfile({sections});
 return Object.freeze({
  accepted:reasons.length===0,
  reasons:[...new Set(reasons)],
  pageCount:ps.length,
  chapterMasters:ps.filter(p=>p.pageFamily==='SECTION_MASTER').length,
  chineseReadingPages:ps.filter(p=>p.pageFamily==='READING_ZH').length,
  englishReadingPages:ps.filter(p=>p.pageFamily==='READING_EN').length,
  compositeDiagramPages:composites.length,
  fitProfile:fit
 });
}
export default Object.freeze({buildZwrVfrPagePlan,deriveZwrVfrFitProfile,ZWR_VFR_PAGE_PLAN,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION,ZWR_VFR_FIT_PROFILE_VERSION});
