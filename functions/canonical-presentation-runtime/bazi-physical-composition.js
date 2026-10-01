// Presentation only: accepted semantic nodes remain immutable and traceable.
export const BAZI_COMPOSITION_VERSION='BAZI-FULL-REPORT-COMPOSITION-R1';
const role=(id,en,zh,selectors)=>({id,title:{en,'zh-Hans':zh},selectors});
// Selectors refer to canonical definitions and paragraph ordinals, not the
// locale-dependent continuation pages produced by the historical partitioner.
export const BAZI_PHYSICAL_PAGE_ARCHITECTURE=Object.freeze([
 ['S01',role('STRUCTURE_ELEMENTS','Chart Structure & Elements','命盘结构与五行',[['S01_OVERVIEW_FOUR_PILLARS'],['S01_OVERVIEW_FIVE_ELEMENTS']])],
 ['S02',role('CORE_STYLE','Core Operating Style','核心运作方式',[['S02_PERSONALITY_TEN_GOD_OVERVIEW'],['S02_CORE_OPERATING_STYLE']]),role('CAPABILITY','Capability Development','能力发展',[['S02_CAPABILITY_DEVELOPMENT']]),role('FRICTION','Friction & Current Expression','张力与当前表达',[['S02_FRICTION']])],
 ['S03',role('CARRYING','Carrying Conditions & Functional Groups','承载条件与功能组',[['S03_LIFE_STRUCTURE_DAY_MASTER_CARRYING'],['S03_LIFE_STRUCTURE_TEN_GOD_FUNCTION_GROUPS'],['S03_SYSTEM',[0,1]]]),role('GODS_PATTERNS','Ten Gods & Pattern Paths','十神与格局路径',[['S03_LIFE_STRUCTURE_TEN_GOD_DETAILS'],['S03_LIFE_STRUCTURE_PATTERN_PATHS']]),role('RELATIONSHIPS','Structural Relationships','结构关系',[['S03_LIFE_STRUCTURE_PILLAR_RELATIONSHIPS'],['S03_SYSTEM',[3,4]]]),role('INTEGRATED','Integrated Life Structure','整合人生结构',[['S03_SYSTEM',[2,5,6]]])],
 ['S04',role('FINGERPRINT','Career Structural Fingerprint','事业结构指纹',[['S04_CAREER_PROFESSIONAL_TOPICS'],['S04_ROLE_SYSTEM']]),role('CONDITIONS','Work Conditions & Direction','工作条件与方向',[['S04_WORKING_DIRECTION']]),role('TIMING','Career Timing & Navigation','事业时序与导航',[['S04_P4']])],
 ['S05',role('FLOW','Resource Flow','资源流动',[['S05_WEALTH_PROFESSIONAL_TOPICS'],['S05_RESOURCE_FLOW']]),role('RETENTION_TIMING','Retention, Timing & Action','资源留存、时序与行动',[['S05_RETENTION_REALITY']])],
 ['S06',role('POSITION','Relationship Position','关系位置',[['S06_RELATIONSHIP_PROFESSIONAL_TOPICS'],['S06_POSITION']]),role('BOUNDARY','Interaction & Boundaries','互动与边界',[['S06_INTERACTION_BOUNDARY']])],
 ['S07',role('PRESSURE','Pressure & Recovery','压力与恢复',[['S07_P2',[0,1,2,3]]]),role('MAINTENANCE','Maintenance Takeaways','日常维护要点',[['S07_P2',[4,5,6]]])],
 ['S08',role('LAYERS','Natal → Da Yun → Liu Nian','本命 → 大运 → 流年',[['S08_TIMING_TIMING_LAYERS'],['S08_P2',[0,1]]]),role('YEAR','Current-Year Observation','当前年度观察',[['S08_P2',[2,3]],['S08_P3']])],
 ['S09',role('GUIDANCE','Integrated Guidance','整合建议',[['S09_INTEGRATED_GUIDANCE',[0,1,2,3]]]),role('DECISIONS','Decision Framework','决策框架',[['S09_INTEGRATED_GUIDANCE',[4,5,6]]])],
 ['S10',role('EVIDENCE_BOUNDARY','Method, Evidence & Boundaries','方法、证据与边界',[['S10_METHOD_GUIDE']])]
]);

export function composeBaziPhysicalPages(sourcePages,locale){
 if(!['en','zh-Hans'].includes(locale))throw Error('COMPOSITION_LOCALE_REQUIRED');
 const sourceSnapshot=JSON.stringify(sourcePages),pages=[],coverage=[],deduplications=[];
 for(const [sectionId,...roles] of BAZI_PHYSICAL_PAGE_ARCHITECTURE){
  const nodes=sourcePages.filter(p=>p.sectionKey.startsWith(sectionId+'_'));
  const master=nodes.find(p=>p.pageFamily==='SECTION_OPENER_PAGE');
  if(!master)throw Error('COMPOSITION_MASTER_MISSING:'+sectionId);
  const common={sectionId,locale,priority:'REQUIRED',mustBreakBefore:true,mustBreakAfter:true,fitMode:'STANDARD',overflow:'UNMEASURED'};
  pages.push({...master,...common,compositionGroupId:sectionId+':MASTER',physicalPageRole:'SECTION_MASTER',sourceNodeIds:[master.pageKey],canMerge:false});
  coverage.push({sourceNodeId:master.pageKey,compositionGroupIds:[sectionId+':MASTER'],state:'PRESERVED'});
  const definitions=new Map();
  for(const p of nodes.filter(p=>p!==master)){
   if(!definitions.has(p.definitionKey))definitions.set(p.definitionKey,{paragraphs:[],nodes:[]});
   const d=definitions.get(p.definitionKey);d.nodes.push(p);
   p.paragraphs.forEach((text,index)=>d.paragraphs.push({text,sourceNodeId:p.pageKey,sourceParagraphIndex:index,ordinal:d.paragraphs.length,blockId:p.definitionKey+':P'+d.paragraphs.length}));
  }
  const usedVisuals=new Set(),usedExtras=new Set(),boundaries=new Map();
  for(const r of roles){
   const fragments=[];
   for(const [definition,indices] of r.selectors){
    const d=definitions.get(definition);if(!d)throw Error('COMPOSITION_DEFINITION_MISSING:'+definition);
    if(indices?.some(i=>!d.paragraphs[i]))throw Error('COMPOSITION_PARAGRAPH_MISSING:'+definition);
    for(const p of d.nodes){
     const paragraphs=d.paragraphs.filter(b=>b.sourceNodeId===p.pageKey&&(!indices||indices.includes(b.ordinal)));
     const visual=!usedVisuals.has(p.pageKey)&&p.primaryVisualHtml?p.primaryVisualHtml:null;
     const extras=!usedExtras.has(p.pageKey);
     if(!paragraphs.length&&!visual&&!(extras&&(p.items?.length||p.facts?.length||p.observations?.length||p.boundary)))continue;
     if(visual)usedVisuals.add(p.pageKey);usedExtras.add(p.pageKey);
     if(extras&&p.boundary){
      if(boundaries.has(p.boundary))deduplications.push({sourceNodeId:p.pageKey,field:'boundary',reason:'Exact repeated section boundary; canonical occurrence retained.',canonicalSourceNodeId:boundaries.get(p.boundary).sourceNodeId});
      else boundaries.set(p.boundary,{text:p.boundary,sourceNodeId:p.pageKey,level:sectionId==='S10'?'GLOBAL':p.primaryVisualHtml?'LOCAL':'SECTION'});
     }
     fragments.push({sourceNodeId:p.pageKey,definitionKey:definition,paragraphs,primaryVisualHtml:visual,primaryVisualRef:visual?p.primaryVisualRef:null,items:extras?p.items||[]:[],facts:extras?p.facts||[]:[],observations:extras?p.observations||[]:[],sourcePages:p.sourcePages||[],takeaway:sectionId==='S09'&&paragraphs.some(b=>b.ordinal===6)});
    }
   }
   const groupId=sectionId+':'+r.id,ids=[...new Set(fragments.map(f=>f.sourceNodeId))];
   pages.push({...master,...common,pageKey:groupId,definitionKey:groupId,title:r.title[locale],pageFamily:sectionId==='S10'?'METHOD_APPENDIX_PAGE':'NARRATIVE_ANALYSIS_PAGE',physicalPageRole:r.id,compositionGroupId:groupId,sourceNodeIds:ids,canMerge:true,compositionNodes:fragments,paragraphs:[],items:[],boundary:'',observations:[],isSectionOpener:false,primaryVisualHtml:null,temporal:null,timingAuthoritySection:'S08_TIMING',compositionBoundaries:[]});
  }
  // Local qualifications remain on the group containing their visual. A
  // section-level/global reminder appears once, at the end of its section.
  const sectionGroups=pages.filter(p=>p.sectionId===sectionId&&p.canMerge);
  for(const b of boundaries.values()){
   const group=b.level==='LOCAL'?sectionGroups.find(g=>g.sourceNodeIds.includes(b.sourceNodeId)):sectionGroups.at(-1);
   group.compositionBoundaries.push(b);
  }
  for(const p of nodes.filter(p=>p!==master)){
   const groups=sectionGroups.filter(g=>g.sourceNodeIds.includes(p.pageKey));
   if(!groups.length)throw Error('COMPOSITION_SOURCE_DROPPED:'+p.pageKey);
   coverage.push({sourceNodeId:p.pageKey,compositionGroupIds:groups.map(g=>g.compositionGroupId),state:'MERGED'});
  }
 }
 const sequence=new Map();
 pages.forEach((p,i)=>{p.pageNumber=i+7;p.sequenceWithinSection=(sequence.get(p.sectionId)||0)+1;sequence.set(p.sectionId,p.sequenceWithinSection);});
 if(JSON.stringify(sourcePages)!==sourceSnapshot)throw Error('COMPOSITION_MUTATED_SOURCE');
 return {version:BAZI_COMPOSITION_VERSION,pages,totalPages:pages.length+6,coverage,deduplications,timingOwner:'S08_TIMING',boundaryHierarchy:['LOCAL','SECTION','GLOBAL']};
}
