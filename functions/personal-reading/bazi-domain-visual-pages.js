// M06 presentation only. Topic order, lead selection and narratives belong to
// the admitted professional runtime; no personal outcome or score is inferred.
import {projectBaziStructuralBatch} from './bazi-structural-visual-pages.js';
import {visualProjectionBuilder} from './visual-report-projection-utils.js';
export const BAZI_DOMAIN_BATCH='BAZI-DYNAMIC-R1-BATCH-03';
export function projectBaziDomainBatch(options){
 const base=projectBaziStructuralBatch(options),{reading:r,locale,depth,reviewMode}=options;
 const topics=r.professionalModules.professionalTopics?.topics,narratives=r.professionalModules.customerNarrative?.topicNarratives;
 if(!Array.isArray(topics)||!Array.isArray(narratives))throw Error('BAZI_BATCH_3_SOURCE_REQUIRED');
 const t=(en,zh)=>locale==='bilingual'?`${zh} / ${en}`:locale==='zh-Hans'?zh:en;
 const b=visualProjectionBuilder({methodId:base.methodId,productId:base.productId,sourceReportRef:base.sourceReportRef,sourceProjectionId:base.sourceProjectionId,locale:locale==='bilingual'?'zh-Hans':locale,depth,reviewMode,identity:base.identity}),ref=b.ref;
 const labels={PEER:['Peer','比劫'],OUTPUT:['Output','食伤'],WEALTH:['Wealth','财'],OFFICER:['Officer','官杀'],RESOURCE:['Resource','印']};
 const definitions=[
  [16,'LIFE_OPERATION',['Self & Direction','自我与方向'],['How do the functions connect in daily life?','各项功能如何连接日常生活？']],
  [17,'RELATIONSHIPS',['Relationships','关系'],['Which functions shape the relationship interfaces?','哪些功能参与关系接口？']],
  [18,'CAREER',['Career & Work','事业与工作'],['Which functions compose this work domain?','哪些功能构成事业主题？']],
  [19,'WEALTH',['Resources & Money','资源与金钱'],['Which functions participate in resource exchange?','哪些功能参与资源交换？']]
 ];
 for(const [number,code,title,question] of definitions){
  const index=topics.findIndex(x=>x.topicCode===code),ni=narratives.findIndex(x=>x.topicCode===code),topic=topics[index],narrative=narratives[ni];
  const count=n=>Number.isInteger(n)&&n>=0;
  if(topics.filter(x=>x.topicCode===code).length!==1||narratives.filter(x=>x.topicCode===code).length!==1||topic?.state!=='COMPOSED_MULTI_FACTOR'||narrative?.sourceState!==topic.state||!Array.isArray(topic.relevantGroups)||!topic.relevantGroups.length||topic.relevantGroups.length>5||new Set(topic.relevantGroups.map(x=>x.groupCode)).size!==topic.relevantGroups.length||topic.relevantGroups.some(x=>!labels[x.groupCode]||!count(x.count))||!topic.leadGroup||!topic.relevantGroups.some(x=>x.groupCode===topic.leadGroup.groupCode&&x.count===topic.leadGroup.count)||!['patternCandidates','relationshipInterfaces','priorityRefs'].every(k=>Array.isArray(topic[k]))||!['rootCount','supportVisible','outwardVisible','pressureVisible'].every(k=>count(topic.carryingContext?.[k]))||!['lead','condition'].every(k=>['en','zhHans'].every(l=>typeof narrative[k]?.[l]==='string'&&narrative[k][l].trim())))throw Error('BAZI_BATCH_3_TOPIC_CONTRACT_REQUIRED');
  if(!topic.boundaries?.topicIsCompositionNotPrediction||!topic.boundaries?.topicDoesNotEqualSingleTenGod||!topic.boundaries?.pillarDoesNotEqualFamilyMember||!topic.boundaries?.relationshipDoesNotGuaranteeOutcome)throw Error('BAZI_BATCH_3_BOUNDARIES_REQUIRED');
  const path=`professionalModules/professionalTopics/topics/${index}`;
  const nodes=topic.relevantGroups.map((g,i)=>({id:g.groupCode,label:t(...labels[g.groupCode]),value:g.count,lead:g.groupCode===topic.leadGroup.groupCode,sourceRefs:[ref(`${path}/relevantGroups/${i}`),ref(`${path}/leadGroup`)]}));
  const facts=[['rootCount','Roots','根气'],['supportVisible','Support','支持'],['outwardVisible','Outward','外向作用'],['pressureVisible','Pressure','压力']].map(([key,en,zh])=>({id:key,label:t(en,zh),value:topic.carryingContext[key],sourceRefs:[ref(`${path}/carryingContext/${key}`)]}));
  const themes=[['patternCandidates','Candidates','格局候选'],['relationshipInterfaces','Interfaces','接口'],['priorityRefs','Priority themes','优先主题']].map(([key,en,zh])=>({id:key,label:t(en,zh),value:topic[key].length,sourceRefs:[ref(`${path}/${key}`)]}));
  b.add({id:`P${number}`,pageNumber:number,title:t(...title),question:t(...question),templateId:'RPT-T03',type:'RADIAL_MAP',nodes,insights:['lead','condition'].map(key=>({text:t(narrative[key].en,narrative[key].zhHans),sourceRef:ref(`professionalModules/customerNarrative/topicNarratives/${ni}/${key}`)})),boundaryText:t('Domain composition, not a prediction. Counts are not strength or outcome scores.','主题组合并非预测；计数不等于强弱或结果评分。'),visualTemplateId:'M06',reportIdentity:base.productId,accessState:'OPEN',visualDesign:structuredClone(base.pages[0].visualDesign),informationUnitRefs:[ref(path)]});
  const p=b.pages.at(-1);p.visual={...p.visual,topicCode:code,domain:t(...title),leadLabel:t(...labels[topic.leadGroup.groupCode]),facts,themes,context:base.pages[0].visual.context,unit:t('Unweighted source occurrences; the marked lead follows the domain owner, not the largest count.','未加权来源计数；标记重点遵循主题来源，并非选择最大计数。')};
  p.visual.dataRefs=[...new Set([...p.visual.dataRefs,...[...facts,...themes].flatMap(x=>x.sourceRefs),ref(`${path}/boundaries`)])];p.evidenceRefs=[...new Set([...p.visual.dataRefs,...p.insights.map(x=>x.sourceRef)])];
 }
 return {...b.finish(),locale,visualBatch:BAZI_DOMAIN_BATCH,totalPages:26,batchPageRange:[16,19],reviewMode:true};
}
