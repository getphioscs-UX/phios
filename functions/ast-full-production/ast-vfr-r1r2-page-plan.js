export const AST_R1R2_LAYOUTS={
 'BODY-A':{columns:30,lineBudget:23,density:'DENSE',purpose:'Full reading column'},
 'BODY-B':{columns:23,lineBudget:22,density:'MEDIUM',purpose:'Asymmetric reading and visual breathing zone'},
 'BODY-C':{columns:19,lineBudget:9,density:'LIGHT',purpose:'Accepted standalone insight'},
 'BODY-D':{columns:30,lineBudget:9,density:'MEDIUM',purpose:'Mini diagram with accepted explanation'},
 'BODY-E':{columns:32,lineBudget:5,density:'MEDIUM',purpose:'Signature diagram with accepted callouts'},
 'BODY-F':{columns:15,lineBudget:10,density:'MEDIUM',purpose:'Structural dual composition'},
 'BODY-G':{columns:28,lineBudget:9,density:'LIGHT',purpose:'Accepted closing anchors'},
 'BODY-H':{columns:24,lineBudget:14,density:'LIGHT',purpose:'Accepted transition and integrated close'}
};
const major=new Set(['AST-D01','AST-D04','AST-D05','AST-D06']);
const dual=new Set(['AST-D07','AST-D11','AST-D12']);
const keyPattern=/先感受到|外面的系统仍然在运行|理想需要现实|有边界的行动|什么值得我进入这么深/;
export function buildAstR1R2PagePlan(ir){
 const pages=ir.editorialPages.map(e=>({...e,pageType:'EDITORIAL_FULL_PAGE',composition:null,parts:[],diagramIds:[],density:'LIGHT'}));
 for(const section of ir.sections){
  pages.push({sectionId:section.sectionId,assetId:section.assetId,pageType:'SECTION_OPENER',composition:null,parts:[],diagramIds:[],density:'LIGHT'});
  const queue=ir.contentBlocks.filter(b=>b.sectionId===section.sectionId).flatMap(b=>b.text.split(/\r?\n\r?\n/).map((text,i)=>({blockId:b.blockId,paragraphIndex:i,offset:0,text,heading:i===0?b.title:null})));
  const pull=part=>part&&part.text.length<90&&keyPattern.test(part.text);
  const take=(variant)=>{const spec=AST_R1R2_LAYOUTS[variant],parts=[];let used=0;
   while(queue.length){const p=queue[0],cost=Math.ceil(p.text.length/spec.columns)+.6+(p.heading?2.5:0);if(parts.length&&used+cost>spec.lineBudget)break;if(parts.length&&pull(p)&&variant!=='BODY-C')break;
    const room=Math.floor((spec.lineBudget-used-.6-(p.heading?2.5:0))*spec.columns);if(room<spec.columns)break;
    if(cost<=spec.lineBudget-used){parts.push(queue.shift());used+=cost;}
    else {const piece=p.text.slice(0,room);parts.push({...p,text:piece});queue[0]={...p,text:p.text.slice(room),offset:p.offset+piece.length,heading:null};break;}
   }return parts;};
  let serial=0;
  const reading=()=>{const nearbyQuote=!queue[0]?.heading&&queue[0]?.text.length<60&&pull(queue[1]);let variant=section.sectionId==='SEC-01'&&serial===0?'BODY-A':pull(queue[0])||nearbyQuote?'BODY-C':'BODY-B';if(queue.length<=3&&!queue[0]?.heading)variant=section.sectionId==='SEC-10'?'BODY-H':pull(queue[0])||nearbyQuote?'BODY-C':'BODY-G';const parts=take(variant);if(!parts.length)throw Error('AST_R1R2_PAGE_PLAN_NO_PROGRESS');pages.push({sectionId:section.sectionId,pageType:variant==='BODY-G'?'SUMMARY_PAGE':variant==='BODY-H'?'TRANSITION_PAGE':'READING_PAGE',composition:variant,parts,diagramIds:[],density:AST_R1R2_LAYOUTS[variant].density,side:serial++%2?'right':'left'});};
  if(queue.length)reading();
  for(const diagram of ir.diagramBlocks.filter(d=>d.sectionId===section.sectionId)){
   const variant=major.has(diagram.diagramId)?'BODY-E':dual.has(diagram.diagramId)?'BODY-F':'BODY-D';
   pages.push({sectionId:section.sectionId,pageType:major.has(diagram.diagramId)?'DIAGRAM_FULL_PAGE':'DIAGRAM_TEXT_COMBO_PAGE',composition:variant,parts:take(variant),diagramIds:[diagram.diagramId],density:AST_R1R2_LAYOUTS[variant].density,intentionalDiagramDominance:major.has(diagram.diagramId)});
   if(queue.length&&(pull(queue[0])||queue.length>3))reading();
  }
  while(queue.length)reading();
 }
 return {schemaVersion:'PHI-OS-AST-VFR-R1R2-PAGE-PLAN-v1.0.0',globalPageCount:null,referenceOnly:true,layouts:AST_R1R2_LAYOUTS,pages:pages.map((p,i)=>({...p,pageId:'AST-R1R2-P'+String(i+1).padStart(3,'0'),pageNumber:i+1}))};
}
