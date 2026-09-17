import {createVisualPage} from '../canonical-presentation-runtime/visual-report-page-runtime.js';
export function visualProjectionBuilder({methodId,productId,sourceReportRef,sourceProjectionId,locale,depth,identity,reviewMode}){
 if(!reviewMode)throw Error('VRPT_REVIEW_ONLY');if(!['FREE','PAID'].includes(depth))throw Error('VRPT_DEPTH_INVALID');
 const pages=[],suppressedModules=[];
 const local=(en,zh)=>locale==='zh-Hans'?zh:en,ref=path=>`${sourceReportRef}#${path}`;
 const add=({id,title,question,templateId,type,nodes,edges=[],insights=[],informationUnitRefs=[],...extra})=>{
  if(!nodes?.length){suppressedModules.push({id,reason:'SOURCE_DATA_NOT_AVAILABLE'});return;}
  const refs=[...new Set([...nodes.flatMap(x=>x.sourceRefs||[]),...edges.flatMap(x=>x.sourceRefs||[]),...insights.map(x=>x.sourceRef)].filter(Boolean))];
  pages.push(createVisualPage({pageId:`VRPT-${methodId}-${id}`,methodId,productId,sourceReportRef,locale,title,question,templateId,visual:{type,nodes,edges,dataRefs:refs,labels:nodes.map(x=>x.label),a11ySummary:question,encoding:'LAYOUT_ONLY_SOURCE_VALUES_PRESERVED'},insights,evidenceRefs:refs,meaningRefs:insights.map(x=>x.sourceRef),ruleRefs:[],boundaryRefs:[],claimUniverseRefs:insights.map(x=>x.claimRef||x.sourceRef),informationUnitRefs,freePaid:depth,...extra}));
 };
 const finish=()=>({schemaVersion:'PHI-OS-PERSONAL-READING-VISUAL-PAGES-v1.0.0',methodId,productId,sourceReportRef,sourceProjectionId,locale,depth,identity,pages,suppressedModules,customerPublishable:false,humanReview:'PENDING',checkoutEnabled:false});
 return {add,finish,ref,local,pages,suppressedModules};
}
