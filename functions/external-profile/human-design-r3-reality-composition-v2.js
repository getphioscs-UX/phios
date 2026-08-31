import crypto from 'node:crypto';
import {prioritizeHumanDesignR3WholeChart} from './human-design-r3-whole-chart-priority.js';

export const HD_R3_REALITY_VERSION='PHI-OS-HD-PRO-R3-W17-REALITY-COMPOSITION-v2.0.0';
export const HD_R3_REALITY_RESPONSE_STATES=Object.freeze(['CONFIRMS','PARTIALLY_CONFIRMS','CONTRADICTS','NOT_OBSERVED','CONTEXT_DEPENDENT']);
const zh=(en,zhHans)=>({en,zhHans});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);
const uniq=a=>[...new Set((a||[]).filter(Boolean))];

function ref(f){return Object.freeze({findingIds:[f.findingId],claimIds:f.technicalRefs.claimIds,structureRefs:f.technicalRefs.structureRefs,sourceRefs:f.technicalRefs.sourceRefs,compositionRuleIds:f.technicalRefs.compositionRuleIds});}
function has(f,d){return (f.domains||[]).includes(d);}
function q(id,category,question,f){return Object.freeze({questionId:id,category,question,responseStates:HD_R3_REALITY_RESPONSE_STATES,technicalRefs:ref(f)});}

function decisionQuestion(f){
  if((f.technicalRefs.structureRefs||[]).includes('AUTHORITY.EMOTIONAL')) return zh('When an opportunity first appears, do you often have a strong initial inclination, but notice that the answer changes after several hours or the next day? What remains after the emotional movement settles?','当一个机会刚出现时，你是否经常先有很强的倾向，但隔几个小时或隔天后判断明显改变？情绪变化过去以后，什么仍然保留？');
  return zh('Think of a recent important decision: what first pulled you toward it, and what signal actually remained when you were ready to commit? Were those two moments the same?','回想最近一个重要决定：最初是什么把你拉进去，而真正准备承诺时又是什么信号仍然保留？这两个时刻是同一个吗？');
}
function engagementQuestion(f){return zh('Which recent commitments gave you more usable energy after you entered them, and which ones required you to keep pushing after the original engagement signal had disappeared?','最近哪些承诺在进入以后让你拥有更多可用能量？哪些事情则是在最初投入信号已经消失后，你仍然靠意志硬推？');}
function roleQuestion(f){return zh('Where do other people repeatedly expect you to solve, explain, guide, test, or stabilise something? Which of those expectations match how you actually work, and which create pressure to perform a role too quickly?','别人最常在哪些场景期待你去解决、解释、引导、试验或稳定某件事？哪些期待真的符合你的运作方式，哪些会让你过早进入一个被投射的角色？');}
function opennessQuestion(f){return zh('In which people or environments does this pressure become much louder? When you leave that context, does the urgency or certainty reduce, stay the same, or change shape?','在哪些人或环境里，这种压力会明显变大？离开那个情境以后，紧迫感或确定感会减弱、保持不变，还是换一种形式？');}
function relationshipQuestion(f){
  if((f.technicalRefs.structureRefs||[]).includes('AUTHORITY.EMOTIONAL')) return zh('In which relationships are you most likely to mistake another person’s certainty or urgency for your own decision? What happens if you do not answer on their timetable?','在哪些关系里，你最容易因为对方很确定或很着急，就把对方的确定感误认为自己的决定？如果不按照对方的时间表回答，会发生什么？');
  return zh('In recurring relationships, when does this pattern make interaction easier, and when does it turn into expectation, pressure, or misunderstanding?','在反复出现的关系里，这个模式什么时候让互动更顺，什么时候会变成期待、压力或误解？');
}
function environmentQuestion(f){return zh('Try changing only one environmental or sensory condition for a few comparable situations. Does the experience change in a repeatable way, or was the difference mostly situational?','在几个可比较的情境中，只改变一个环境或感知条件。体验是否出现可重复的变化，还是差异主要来自当时情境？');}
function contradictionQuestion(f){return zh(`What real situation would make you say, “this reading does not describe what actually happens for me”? Use that counter-example instead of forcing the interpretation to fit.`,`什么真实情境会让你明确说：“这个读取并不符合我实际发生的情况”？请保留这个反例，而不是为了符合解释而勉强套用。`);}

export function buildHumanDesignR3RealityCompositionV2(facts={},options={}){
  const priority=options.priorityResult||prioritizeHumanDesignR3WholeChart(facts,options);
  const pool=[...priority.primaryFindings,...priority.secondaryFindings,...priority.advancedDetails];
  const questions=[];
  const used=new Set();
  const take=(category,pred,builder)=>{const f=pool.find(x=>!used.has(x.findingId)&&pred(x));if(!f)return;used.add(f.findingId);questions.push(q(`HD-R3-W17-${category}-${questions.length+1}`,category,builder(f),f));};
  take('DECISION',f=>has(f,'DECISION'),decisionQuestion);
  take('ENGAGEMENT',f=>has(f,'ENGAGEMENT'),engagementQuestion);
  take('WORK_ENERGY',f=>has(f,'ENGAGEMENT')||has(f,'STRUCTURE'),engagementQuestion);
  take('RELATIONSHIP',f=>has(f,'RELATIONSHIP')||has(f,'ROLE'),relationshipQuestion);
  take('OPENNESS_PRESSURE',f=>has(f,'OPENNESS_PRESSURE'),opennessQuestion);
  take('ENVIRONMENT',f=>has(f,'ENVIRONMENT_ADVANCED'),environmentQuestion);
  take('ROLE',f=>has(f,'ROLE'),roleQuestion);
  const contradictionBase=priority.primaryFindings[0];if(contradictionBase) questions.push(q(`HD-R3-W17-CONTRADICTION-${questions.length+1}`,'CONTRADICTION',contradictionQuestion(contradictionBase),contradictionBase));
  // Categories without a matching semantic finding fail closed; W17 never binds an unrelated finding merely to fill a slot.
  const required=['DECISION','ENGAGEMENT','WORK_ENERGY','RELATIONSHIP','OPENNESS_PRESSURE','ENVIRONMENT','ROLE','CONTRADICTION'];
  const categoryStates=Object.freeze(required.map(category=>Object.freeze({category,state:questions.some(x=>x.category===category)?'AVAILABLE':'NOT_APPLICABLE_NO_SEMANTIC_OWNER'})));
  const result={schemaVersion:HD_R3_REALITY_VERSION,priorityDigest:priority.priorityDigest,categories:Object.freeze(required),categoryStates,questions:Object.freeze(questions),responseStates:HD_R3_REALITY_RESPONSE_STATES,policy:Object.freeze({questionsMustBindSemanticOwner:true,genericTraitQuestionAllowed:false,unrelatedFallbackQuestionAllowed:false,contradictionExplicitlyInvited:true,customerResponsesAreRealityEvidenceNotChartFacts:true}),publication:Object.freeze({machineVerified:false,humanAccepted:false,customerPublishableR3:false})};
  return Object.freeze({...result,realityDigest:digest(result)});
}
