import crypto from 'node:crypto';
import {prioritizeHumanDesignR3WholeChart} from './human-design-r3-whole-chart-priority.js';

export const HD_R3_RELATIONSHIP_VERSION='PHI-OS-HD-PRO-R3-W18-SINGLE-CHART-RELATIONSHIP-COMPOSITION-v1.0.0';
const zh=(en,zhHans)=>({en,zhHans});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const has=(f,d)=>(f.domains||[]).includes(d);

function technical(findings){return Object.freeze({findingIds:Object.freeze(findings.map(x=>x.findingId)),claimIds:Object.freeze(uniq(findings.flatMap(x=>x.technicalRefs.claimIds))),structureRefs:Object.freeze(uniq(findings.flatMap(x=>x.technicalRefs.structureRefs))),sourceRefs:Object.freeze(uniq(findings.flatMap(x=>x.technicalRefs.sourceRefs))),compositionRuleIds:Object.freeze(uniq(findings.flatMap(x=>x.technicalRefs.compositionRuleIds)))});}
function item(id,category,findings,meaning,observe){return Object.freeze({relationshipFindingId:id,category,meaning,observe,technicalRefs:technical(findings)});}

export function composeHumanDesignR3SingleChartRelationship(facts={},options={}){
  if(options.partnerChart||options.secondChart||facts.partnerChart) throw new Error('HD_R3_W18_SINGLE_CHART_ONLY');
  const priority=options.priorityResult||prioritizeHumanDesignR3WholeChart(facts,options);
  const pool=[...priority.primaryFindings,...priority.secondaryFindings,...priority.contextualFindings];
  const items=[];
  const relational=pool.filter(f=>has(f,'RELATIONSHIP')||has(f,'ROLE')).slice(0,2);
  if(relational.length) items.push(item('HD-R3-W18-RELATIONSHIP_EXPOSURE','RELATIONSHIP_EXPOSURE',relational,zh('Your chart suggests that relationship experience is shaped less by a universal compatibility rule and more by how recurring role expectations and complete structural patterns are met in real interactions.','你的图表显示，关系体验与其说由一个普遍的“适配度”决定，不如说更受反复出现的角色期待与完整结构在真实互动中如何被回应影响。'),zh('Notice which relationships repeatedly invite the same role from you, and whether that role feels recognised, pressured, or misread.','观察哪些关系反复把你放进同一种角色，以及这个角色是被真正看见、被催促承担，还是被误读。')));
  const open=pool.filter(f=>has(f,'OPENNESS_PRESSURE')).slice(0,2);
  if(open.length) items.push(item('HD-R3-W18-UNDEFINED_SENSITIVITY','UNDEFINED_CENTER_SENSITIVITY',open,zh('Non-defined areas can make certain interpersonal pressures louder or more variable. This describes sensitivity to context, not weakness and not a need for another person to complete you.','非定义区域可能让某些人际压力变得更响亮或更有变化。这描述的是对情境的敏感度，不代表弱点，也不代表需要另一个人来“补全”你。'),zh('Compare how the same issue feels around different people, then again after you leave the interaction.','比较同一个议题在不同人身边的感受，再观察离开互动以后它如何变化。')));
  const role=pool.filter(f=>has(f,'ROLE')).slice(0,2);
  if(role.length){
    items.push(item('HD-R3-W18-PROJECTION','PROJECTION_DYNAMICS',role,zh('Other people may project a practical role or expectation onto what they think you can provide. Projection is an interaction condition, not proof that the role is correct or that the relationship is destined.','别人可能把某种实际角色或期待投射到他们认为你能够提供的东西上。投射是一种互动条件，不代表这个角色一定正确，也不代表这段关系具有命定性。'),zh('Notice when someone is responding to what you actually do versus to an expectation they formed before you agreed to the role.','观察对方什么时候是在回应你真正做出的表现，什么时候则是在回应一个你尚未同意承担的期待。')));
    items.push(item('HD-R3-W18-PROFILE_ROLE','PROFILE_RELATIONAL_ROLE',role,zh('Your Profile can shape the recurring role through which people approach, recognise, test, or expect something from you. It describes a relational pattern, not a compatibility verdict.','你的 Profile 会影响别人反复通过什么角色接近、看见、测试或期待你。它描述的是关系模式，不是适配度判决。'),zh('Ask whether the role being offered actually matches your lived way of operating instead of accepting it only because the other person sounds certain.','观察对方给你的角色是否真的符合你的实际运作，而不是只因为对方很确定就自动接受。')));
  }
  const channel=pool.filter(f=>has(f,'STRUCTURE')&&f.technicalRefs.structureRefs.some(x=>String(x).startsWith('CHANNEL.'))).slice(0,2);
  if(channel.length) items.push(item('HD-R3-W18-CHANNEL_INTERACTION','CHANNEL_BASED_INTERACTION_STYLE',channel,zh('A complete Channel can create a recurring interaction style that is more informative than reading its two component Gates separately. In relationships, watch the full process rather than labelling either person from one Gate theme.','完整通道可能形成反复出现的互动方式，它通常比把两个组成闸门拆开分别解释更有信息量。在关系中应观察完整过程，而不是用单一闸门主题给任何一方贴标签。'),zh('Look for the repeated two-center process in conversations, agreements, conflict, or collaboration.','观察对话、约定、冲突或合作里是否反复出现这条通道连接两个中心的完整过程。')));
  const decision=pool.filter(f=>has(f,'DECISION')).slice(0,2);
  if(decision.length) items.push(item('HD-R3-W18-DECISION_PRESSURE','DECISION_PRESSURE_IN_RELATIONSHIPS',decision,zh('Relationship urgency can become a pressure layer around a decision, but another person’s certainty does not become your Authority.','关系里的紧迫感可能包围一个决定形成压力，但对方的确定感不会因此变成你的 Authority。'),zh('Notice what changes when you keep your own decision timing instead of matching the other person’s urgency.','观察当你保留自己的决策时序，而不是配合对方的急迫感时，现实会发生什么变化。')));
  const result={schemaVersion:HD_R3_RELATIONSHIP_VERSION,scope:'SINGLE_CHART_RELATIONAL_INTERPRETATION',priorityDigest:priority.priorityDigest,interpretations:Object.freeze(items),boundaries:Object.freeze({secondChartAccepted:false,compatibilityScoreAllowed:false,soulmateClaimAllowed:false,destinedRelationshipClaimAllowed:false,breakupPredictionAllowed:false,dependencyLanguageAllowed:false,authorityReplacedByPartner:false}),futureOwner:'HD-PRO-R4 dual-chart relationship composition if separately admitted',publication:Object.freeze({machineVerified:false,humanAccepted:false,customerPublishableR3:false})};
  return Object.freeze({...result,relationshipDigest:digest(result)});
}
