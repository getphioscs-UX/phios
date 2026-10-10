import {createVisualPage,textSize} from '../canonical-presentation-runtime/visual-report-page-runtime.js';
import {numFpRoleMeta} from '../num-full-production/num-full-production-rules.js';
// Consume NUM's admitted integrated and depth IR. Never derive a number,
// relationship, timing value or interpretation in the presentation layer.
export function projectNumVisualReport({reading,depth='FREE',reviewMode=false}){
 if(!reviewMode)throw Error('VRPT_REVIEW_ONLY');
 if(reading?.schemaVersion!=='PHI-OS-NUM-INTEGRATED-READING-IR-v1.0.0'||reading.customerPublishable!==true)throw Error('VRPT_NUM_ADMITTED_READING_REQUIRED');
 if(!['FREE','PAID'].includes(depth))throw Error('VRPT_DEPTH_INVALID');
 const s=reading.sections,locale=reading.locale,zh=locale==='zh-Hans',local=(en,cn)=>zh?cn:en,sourceReportRef=`NUM_FULL_REPORT:${reading.sourceProjectionId}`,pages=[];
 const ref=path=>`${sourceReportRef}#${path}`;
 const node=(x,path)=>({id:x.role||x.code,label:x.label||x.role,secondary:String(x.value),code:x.role||x.code,sourceRefs:[ref(path)]});
 const snapshot=s.snapshot.map(x=>node(x,`sections/snapshot/${x.role}`));
 const rich=s.richReading?.customerPublishable?s.richReading.roleReadings.filter(x=>x.runtimeUseAllowed):[];
 const copy=x=>({text:x.text,sourceRef:x.sourceClaimId||x.claimId||ref(`sections/richReading/roleReadings/${x.role}`),claimRef:x.sourceClaimId||x.claimId||ref(`sections/richReading/roleReadings/${x.role}`)});
 const add=(id,title,question,templateId,type,nodes,insights=[],extra={})=>{if(!nodes.length)return;const refs=nodes.flatMap(x=>x.sourceRefs);pages.push(createVisualPage({pageId:`VRPT-NUM-${id}`,methodId:'NUM',productId:'NUMEROLOGY_FULL_REPORT',sourceReportRef,locale,title,question,templateId,visual:{type,nodes,edges:[],dataRefs:refs,labels:nodes.map(x=>x.label),a11ySummary:question,encoding:'SOURCE_NATIVE_VALUES_NOT_STRENGTH'},insights,evidenceRefs:[...refs,...insights.map(x=>x.sourceRef)],meaningRefs:insights.map(x=>x.sourceRef),ruleRefs:[reading.sourceMeaningBundleCode],boundaryRefs:['NUM_INTEGRATED_READING_IR#boundaries'],claimUniverseRefs:insights.map(x=>x.claimRef).filter(Boolean),informationUnitRefs:[],freePaid:depth,...extra}));};
 add('SNAPSHOT',local('Your number roles','你的数字角色'),local('Which values belong to each distinct role?','不同角色分别对应哪些数值？'),'RPT-T02','DOMAIN_GRID',snapshot,depth==='FREE'?rich.slice(0,2).map(copy):[],{freePaid:'SHARED',...(depth==='FREE'&&s.realityReflection.at(-1)?{navigationPrompt:{text:s.realityReflection.at(-1),sourceRef:ref(`sections/realityReflection/${s.realityReflection.length-1}`)}}:{})});
 if(depth==='PAID'){
  const groups=[];let group=[];
  for(const role of rich){if(!s.snapshot.some(x=>x.role===role.role))continue;const trial=[...group,role];if(group.length&&(trial.length>2||textSize(trial.map(x=>x.text).join(' '),locale)+trial.length>(zh?180:110))){groups.push(group);group=[];}group.push(role);}if(group.length)groups.push(group);
  for(const [index,roles] of groups.entries())add(`ROLE_MEANINGS-${index+1}`,local('Different numbers, different roles','不同数值，不同角色'),local('How do these roles differ in this reading?','这些角色在本次读取中有什么不同？'),'RPT-T10','MINI_CARD',roles.map(r=>node(s.snapshot.find(x=>x.role===r.role),`sections/snapshot/${r.role}`)),roles.map(copy),{informationUnitRefs:roles.map(r=>copy(r).sourceRef)});
  for(const [i,relation] of s.relationships.entries()){
   const facts=relation.roles.map(role=>s.snapshot.find(x=>x.role===role)).filter(Boolean);
   const nodes=facts.map(x=>node(x,`sections/snapshot/${x.role}`));
   if(relation.cycleRole){const cycle=s.timing.calendar.find(x=>x.code===relation.cycleRole);if(cycle)nodes.push({id:cycle.code,label:relation.title,secondary:String(cycle.value),sourceRefs:[ref(`sections/timing/calendar/${cycle.code}`)]});}
   add(`RELATION-${i}`,relation.title,local('Where is the same value used in different roles?','同一数值在哪些不同角色中出现？'),'RPT-T08','SPLIT_COMPARE',nodes,[{text:relation.summary,sourceRef:ref(`sections/relationships/${i}`),claimRef:ref(`sections/relationships/${i}`)}],{informationUnitRefs:[ref(`sections/relationships/${i}`)]});
  }
  const cycleReadings=s.richReading.cycleReadings.filter(x=>x.runtimeUseAllowed);
  if(cycleReadings.length)add('CURRENT_CYCLES',local('Current cycles','当前周期'),local('Which time scales are distinct in this reading?','本次读取区分了哪些时间尺度？'),'RPT-T05','DOMAIN_GRID',cycleReadings.map(x=>({id:x.role,label:numFpRoleMeta(x.role,locale).label,secondary:String(x.value),sourceRefs:[ref(`sections/timing/calendar/${x.role}`)]})),cycleReadings.slice(0,3).map(copy),{informationUnitRefs:cycleReadings.map(x=>x.claimId)});
  for(const role of ['PINNACLE_CYCLE','CHALLENGE_CYCLE']){
   const cycles=(s.depth?.runtimeUseAllowed?s.depth.sections.longCycleMeanings:[]).filter(x=>x.role===role&&x.runtimeUseAllowed&&x.customerPublishable);
   const nodes=cycles.map(x=>({id:`${role}-${x.cycleNumber}`,label:`${x.startAge}–${x.endAge??'…'}`,secondary:String(x.value),sourceRefs:[ref(`sections/depth/longCycleMeanings/${role}/${x.cycleNumber}`)]}));
   // Keep identical source claims once; the four time positions remain visible.
   const unique=[...new Map(cycles.map(x=>[x.sourceClaimId,x])).values()];
   for(let offset=0;offset<unique.length;offset+=2){
    const selected=unique.slice(offset,offset+2),ids=new Set(selected.map(x=>x.sourceClaimId)),part=cycles.filter(x=>ids.has(x.sourceClaimId));
    const partNodes=nodes.filter(x=>part.some(c=>x.id===`${role}-${c.cycleNumber}`));
    add(`${role}-${offset/2+1}`,local(role==='PINNACLE_CYCLE'?'Pinnacle cycles':'Challenge cycles',role==='PINNACLE_CYCLE'?'高峰周期':'挑战周期'),local('How do these admitted long-cycle positions differ?','这些已准入的长期周期位置有何不同？'),'RPT-T06','TIMELINE',partNodes,selected.map(copy),{informationUnitRefs:part.map(x=>ref(`sections/depth/longCycleMeanings/${role}/${x.cycleNumber}`))});
   }
  }
  add('NAVIGATION',local('Reality navigation','现实导航'),local('What would support or contradict this reading?','哪些经验支持或反驳这次读取？'),'RPT-T11','MINI_CARD',s.realityReflection.slice(0,3).map((text,i)=>({id:String(i),label:String(i+1).padStart(2,'0'),secondary:text,sourceRefs:[ref(`sections/realityReflection/${i}`)]})),[],{informationUnitRefs:[ref('sections/realityReflection')]});
 }
 return {schemaVersion:'PHI-OS-PERSONAL-READING-VISUAL-PAGES-v1.0.0',sourceReportRef,sourceProjectionId:reading.sourceProjectionId,methodId:'NUM',productId:'NUMEROLOGY_FULL_REPORT',locale,depth,identity:s.snapshot.map(x=>({role:x.role,value:x.value})),pages,customerPublishable:false,humanReview:'PENDING',checkoutEnabled:false,sourceAuthority:'NUM_INTEGRATED_READING_IR',conditionalSections:[],suppressedModules:['UNADMITTED_OR_MISSING_NAME_AND_RELATIONSHIP_CONTEXT'],boundaries:reading.boundaries};
}
