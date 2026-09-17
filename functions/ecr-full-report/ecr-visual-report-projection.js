import {createVisualPage,compareVisualReportDepths} from '../canonical-presentation-runtime/visual-report-page-runtime.js';
const list=v=>Array.isArray(v)?v:[];
const unique=xs=>[...new Set(xs.filter(Boolean))];
const questions={
 COVER:['What does this report help you observe?','这份报告帮助你观察什么？'],
 PHI_CARD:['Which PHI cards belong to this configuration?','哪些 PHI 卡属于这组构型？'],
 OVERVIEW:['How are the baseline coordinates organized?','出生基线的坐标怎样组织？'],
 CORE_QUESTION:['Which question is paired with this grammar?','这组现实语法对应哪个基础问题？'],
 CAPABILITY_REGION:['Which capabilities respond to this question?','哪些能力回应这个基础问题？'],
 DRIVER_PRIORITY:['How are the baseline drivers ordered?','出生基线的驱动怎样排序？'],
 MOTION:['Where is this motion within the eight modes?','当前运动位于八种模式中的哪里？'],
 PHI_CONFIGURATION:['How do environment and embodied response combine?','环境与载体回应怎样构成这组配置？'],
 ACTIVATION:['Where does the calculated activation sit?','计算得到的激活位于哪个阶段？'],
 OBSERVABLE_SIGNALS:['What can you compare with lived experience?','哪些讯号可以与实际经验核对？'],
 REALITY_NAVIGATION:['What should remain open while you observe?','观察现实的时候，哪些问题需要保持开放？']
};
// Existing ECR R1/R1A remains the report authority. The Mandala projection
// supplies all graph facts and relationships; no coordinate is recalculated.
export function projectEcrVisualReport({report,mandalaProjection,observationIr=null,reviewMode=false}) {
 if(!reviewMode || report?.publicationState!=='INTERNAL_REVIEW') throw Error('VRPT_REVIEW_ONLY');
 const p=mandalaProjection;
 if(p?.schemaVersion!=='PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0'||p.sourceProjectionId!==report.sourceProjectionId||p.locale!==report.locale) throw Error('VRPT_ECR_SOURCE_MISMATCH');
 const zh=report.locale==='zh-Hans',local=(en,cn)=>zh?cn:en,s=p.selected,c=p.catalogs;
 const section=id=>report.sections.find(x=>x.sectionId===id);
 const label=x=>zh?(x.questionZhHans||x.labelZhHans||x.chineseNameZhHans||x.label||x.code):(x.question||x.label||x.canonicalName||x.code);
 const find=(catalog,key,id)=>list(c[catalog]).find(x=>x[key]===id);
 const ref=path=>`${p.projectionId}#${path}`;
 const node=(catalog,key,id,role='')=>{const x=find(catalog,key,id);if(!x)throw Error('VRPT_ECR_CATALOG_BINDING_MISSING');return {id:`${role||catalog}:${id}`,code:id,label:label(x),role,selected:true,sourceRefs:[ref(`catalogs/${catalog}/${id}`)]};};
 const grammar=node('grammars','grammarId',s.grammarId),question=node('questions','questionId',s.questionId);
 const capability=node('capabilities','capabilityId',s.primaryCapabilityId,local('Primary','主要'));
 const motion=node('motions','motionId',s.motionId),configuration=node('configurations','configurationId',s.configurationId),activation=node('activations','activationId',s.activationId);
 const rows=(catalog,key,selected)=>list(c[catalog]).map(x=>({id:x[key],code:x[key],label:label(x),selected:selected.includes(x[key]),sourceRefs:[ref(`catalogs/${catalog}/${x[key]}`)]}));
 const pair=p.relations.grammarQuestion.find(x=>x.grammarId===s.grammarId&&x.questionId===s.questionId);
 const response=p.relations.questionCapability.find(x=>x.questionId===s.questionId&&x.primaryCapabilityId===s.primaryCapabilityId);
 const config=p.relations.motionConfiguration.find(x=>x.configurationId===s.configurationId);
 const phase=p.relations.configurationActivation.find(x=>x.configurationId===s.configurationId);
 if(!pair||!response||!config||!phase)throw Error('VRPT_ECR_RELATION_BINDING_MISSING');
 const catalogVisual=(type,nodes,edges=[],extra={})=>({type,nodes,edges,dataRefs:unique([...nodes.flatMap(x=>x.sourceRefs),...edges.flatMap(x=>x.sourceRefs||[])]),encoding:'LAYOUT_ONLY_NOT_STRENGTH_OR_PROBABILITY',labels:nodes.map(x=>x.label),...extra});
 const edge=(a,b,path,role='')=>({from:a.id,to:b.id,label:role,sourceRefs:[ref(path)]});
 const cards=list(section('PHI_CARD')?.cards);
 const cardNodes=cards.map(x=>({id:x.cardId,code:x.cardId,label:x.title,secondary:x.subtitle,sourceRefs:[`${report.lineage.phiCardMappingRef}#${x.cardId}`],asset:x.asset}));
 const defs=[];
 const add=(id,templateId,visual,insights=[],extra={})=>{
  const source=section(id),questionText=questions[id]?.[zh?1:0]||source?.title;
  const claims=list(source?.claims);
  const copied=insights.length?insights:claims.map(x=>({text:x.structuralMeaning,claimRef:x.claimId,sourceRef:x.claimId}));
  defs.push(createVisualPage({pageId:`VRPT-ECR-${id}`,productId:report.productId,methodId:'ECR',locale:report.locale,sourceReportRef:report.reportId,templateId,question:questionText,title:id==='COVER'?report.title:source?.title||report.copy.sections[0],subtitle:'',visual:{...visual,a11ySummary:`${questionText} ${visual.labels.join(' · ')}`},insights:copied.slice(0,3),evidenceRefs:unique([...visual.dataRefs,...claims.flatMap(x=>x.evidenceRefs)]),meaningRefs:unique(claims.flatMap(x=>list(x.lineage?.meaningRefs))),ruleRefs:unique(claims.flatMap(x=>list(x.lineage?.ruleRefs))),boundaryRefs:unique(claims.flatMap(x=>list(x.boundaries))),claimUniverseRefs:unique([...claims.map(x=>x.claimId),...copied.map(x=>x.claimRef)]),informationUnitRefs:unique(visual.edges?.flatMap(x=>x.sourceRefs)||[]),freePaid:report.depth,...extra}));
 };
 const overview=catalogVisual('RADIAL_MAP',[grammar,question,capability,motion,configuration,activation]);
 if(report.depth==='FREE') {
  // Same cards and coordinate identity; expansion never changes their selection.
  add('PHI_CARD','RPT-T01',catalogVisual('MINI_CARD',cardNodes),cards.slice(0,2).map(x=>({text:x.oneLineInsight,sourceRef:`${x.cardId}#oneLineInsight`,claimRef:`${x.cardId}#oneLineInsight`})),{freePaid:'SHARED'});
  add('OVERVIEW','RPT-T03',overview,[],{freePaid:'SHARED',navigationPrompt:cards[0]?.observationPrompt?{text:cards[0].observationPrompt,sourceRef:`${cards[0].cardId}#observationPrompt`}:null});
 } else {
  add('COVER','RPT-T00',catalogVisual('STRUCTURAL_DIAGRAM',[{...configuration,label:report.title,secondary:report.subtitle}],[],{coverAssetUrl:'/assets/reports/PHIOS-COM-REPORT-ECR-FULL-v1.svg'}),[{text:report.copy.overview,sourceRef:'ECR_FULL_REPORT_LOCALE#overview'}]);
  add('PHI_CARD','RPT-T01',catalogVisual('MINI_CARD',cardNodes),cards.slice(0,2).map(x=>({text:x.oneLineInsight,sourceRef:`${x.cardId}#oneLineInsight`,claimRef:`${x.cardId}#oneLineInsight`})),{freePaid:'SHARED'});
  add('OVERVIEW','RPT-T03',overview,[],{freePaid:'SHARED'});
  add('CORE_QUESTION','RPT-T07',catalogVisual('NETWORK',[grammar,question],[edge(grammar,question,`relations/grammarQuestion/${s.grammarId}`,pair.rule)]));
  const supports=list(response.supportingCapabilityIds).map(id=>node('capabilities','capabilityId',id,local('Supporting','辅助')));
  add('CAPABILITY_REGION','RPT-T07',catalogVisual('NETWORK',[question,capability,...supports],[capability,...supports].map(n=>edge(question,n,`relations/questionCapability/${s.questionId}`,n.role))));
  const drivers=list(s.driverPriority).map(x=>({id:x.driverId,code:x.driverId,label:label(x),rank:x.rank,value:x.baselineAffinity,sourceRefs:[ref(`selected/driverPriority/${x.driverId}`)]}));
  add('DRIVER_PRIORITY','RPT-T04',catalogVisual('BAR',drivers,[],{encoding:'EXISTING_BASELINE_AFFINITY_NOT_CURRENT_PRIORITY',unit:local('Baseline affinity · not probability','基线亲和度 · 非概率')}),[],{informationUnitRefs:[ref('selected/driverPriority')],boundaryText:report.copy.driverBoundary});
  add('MOTION','RPT-T03',catalogVisual('RADIAL_MAP',rows('motions','motionId',[s.motionId])),[],{informationUnitRefs:[ref('catalogs/motions')],boundaryText:report.copy.boundary});
  const env=node('motions','motionId',config.environmentPriorityMotionId,local('Environment priority','环境优先'));
  const embodied=node('motions','motionId',config.embodiedResponseMotionId,local('Embodied response','载体回应'));
  add('PHI_CONFIGURATION','RPT-T09',catalogVisual('LAYER_STACK',[env,embodied,configuration],[edge(env,configuration,`relations/motionConfiguration/${s.configurationId}`,config.rule),edge(embodied,configuration,`relations/motionConfiguration/${s.configurationId}`,config.rule)]));
  add('ACTIVATION','RPT-T06',catalogVisual('CYCLE',rows('activations','activationId',[s.activationId])),[],{informationUnitRefs:[ref(`relations/configurationActivation/${s.configurationId}`)],boundaryText:report.copy.activationBoundary});
  const observations=list(section('OBSERVABLE_SIGNALS')?.observations).slice(0,3);
  add('OBSERVABLE_SIGNALS','RPT-T05',catalogVisual('DOMAIN_GRID',observations.map((x,i)=>({id:x.interpretationUnitRef,label:cards[i]?.title||local('Observe','观察'),secondary:x.text,sourceRefs:x.sourceRefs}))),[],{informationUnitRefs:observations.map(x=>`${x.interpretationUnitRef}#observableSignals`)});
  const navigation=list(section('REALITY_NAVIGATION')?.observations).slice(0,3);
  add('REALITY_NAVIGATION','RPT-T11',catalogVisual('MINI_CARD',navigation.map((x,i)=>({id:x.interpretationUnitRef,label:String(i+1).padStart(2,'0'),secondary:x.text,sourceRefs:x.sourceRefs}))),[],{informationUnitRefs:navigation.map(x=>`${x.interpretationUnitRef}#realityComparisonQuestions`),boundaryText:report.copy.boundary});
 }
 const conditional=list(report.sections).filter(x=>x.number>11);
 const contextStates=[];
 const observations=observationIr?.schemaVersion==='PHI-OS-CURRENT-REALITY-OBSERVATION-v1'?list(observationIr.observations).filter(x=>x.source==='CUSTOMER'&&x.confidence==='SELF_REPORTED'&&x.objectiveFact===false&&x.sensitive===false):[];
 const promptLabels={CARRIER_CONDITIONS:local('Carrier conditions','载体条件'),CARRIER_ENVIRONMENT:local('Environment','环境'),EXPERIENCE_SELECTION:local('Selection','选择'),EXPERIENCE_STABILIZATION:local('Stabilization','稳定'),EXPERIENCE_PERSPECTIVE:local('Perspective','视角'),EXPERIENCE_MOTIVATION:local('Experience relevance','经验相关性')};
 for(const item of conditional){
  const claim=item.claims?.[0],refs=claim?.lineage?.contextEvidenceRefs||item.comparisons?.[0]?.currentRealityEvidenceRefs||[];
  const bound=refs.map(id=>observations.find(x=>x.observationId===id));
  if(!refs.length||bound.some(x=>!x)){contextStates.push({sectionId:item.sectionId,state:'SUPPRESSED_MISSING_INDEPENDENT_EVIDENCE'});continue;}
  if(bound.some(x=>x.statement.length>180)){contextStates.push({sectionId:item.sectionId,state:'SUPPRESSED_SHORT_COPY_REQUIRED'});continue;}
  const nodes=bound.map(x=>({id:x.observationId,label:promptLabels[x.promptId]||local('Self-report','自述'),secondary:x.statement,sourceRefs:[x.observationId],role:local('Customer supplied','客户提供')}));
  const counterNodes=list(claim?.counterEvidenceRefs).map(id=>observations.find(x=>x.observationId===id)).filter(Boolean).map(x=>({id:x.observationId,label:local('Counter-evidence','反证'),secondary:x.statement,sourceRefs:[x.observationId],role:local('Customer supplied','客户提供')}));
  if(item.sectionId==='CURRENT_REALITY_COMPARISON'){
   const comparison=item.comparisons[0];
   const units=[{id:comparison.baselineClaimRef,label:report.copy.baseline,secondary:comparison.baselineText,sourceRefs:[comparison.baselineClaimRef]},...nodes,{id:comparison.lineage.comparisonRef,label:report.copy.states[comparison.comparisonState],secondary:comparison.customerExplanation,sourceRefs:[comparison.lineage.comparisonRef]}];
   add(item.sectionId,'RPT-T08',catalogVisual('SPLIT_COMPARE',units),[],{question:local('Where does your own comparison agree or differ?','你的现实核对在哪些方面一致或不同？'),informationUnitRefs:[comparison.lineage.comparisonRef],boundaryText:item.body});
  }else{
   const experience=item.sectionId==='EXPERIENCE_EXPRESSION';
   const edges=experience?nodes.slice(1).map((n,i)=>({from:nodes[i].id,to:n.id,sourceRefs:claim.lineage.ruleRefs})):[];
   const baseline=report.claims.find(x=>claim.claimId.startsWith(`${x.claimId}:`));
   const contextNodes=experience?[...nodes,...counterNodes]:[...(baseline?[{id:baseline.claimId,label:report.copy.baseline,secondary:baseline.structuralMeaning,sourceRefs:[baseline.claimId]}]:[]),...nodes,...counterNodes];
   add(item.sectionId,experience?'RPT-T13':'RPT-T08',catalogVisual(experience?'FLOW':'SPLIT_COMPARE',contextNodes,edges),[{text:item.body,sourceRef:claim.claimId}],{question:local('Which independently reported conditions enter this reading?','哪些独立自述条件进入了这次读取？'),informationUnitRefs:[claim.claimId,...claim.counterEvidenceRefs],counterEvidenceRefs:claim.counterEvidenceRefs,conditions:claim.conditions});
  }
  contextStates.push({sectionId:item.sectionId,state:'REVIEW_CANDIDATE'});
 }
 return {schemaVersion:'PHI-OS-PERSONAL-READING-VISUAL-PAGES-v1.0.0',sourceReportRef:report.reportId,sourceProjectionId:report.sourceProjectionId,locale:report.locale,methodId:'ECR',productId:report.productId,identity:report.structuralIdentity,depth:report.depth,pages:defs,conditionalSections:contextStates,customerPublishable:false,humanReview:'PENDING',checkoutEnabled:false};
}
export function compareEcrVisualReports({free,paid,mandalaProjection}) {
 return compareVisualReportDepths(projectEcrVisualReport({report:free,mandalaProjection,reviewMode:true}),projectEcrVisualReport({report:paid,mandalaProjection,reviewMode:true}));
}
