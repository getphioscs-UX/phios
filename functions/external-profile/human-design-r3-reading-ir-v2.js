import crypto from 'node:crypto';
import {prioritizeHumanDesignR3WholeChart} from './human-design-r3-whole-chart-priority.js';

export const HD_R3_READING_IR_VERSION='PHI-OS-HD-PRO-R3-W15-PROFESSIONAL-READING-IR-v2.0.0';
const zh=(en,zhHans)=>({en,zhHans});
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);

function refs(findings=[]){
  return Object.freeze({
    claimIds:Object.freeze(uniq(findings.flatMap(f=>f.technicalRefs?.claimIds||[]))),
    structureRefs:Object.freeze(uniq(findings.flatMap(f=>f.technicalRefs?.structureRefs||[]))),
    sourceRefs:Object.freeze(uniq(findings.flatMap(f=>f.technicalRefs?.sourceRefs||[]))),
    compositionRuleIds:Object.freeze(uniq(findings.flatMap(f=>f.technicalRefs?.compositionRuleIds||[])))
  });
}
function pick(all,pred){return all.filter(pred);}
function hasDomain(f,d){return (f.domains||[]).includes(d);}
function hasStructure(f,prefix){return (f.technicalRefs?.structureRefs||[]).some(x=>String(x).startsWith(prefix));}
function section(id,order,title,findings,extra={}){
  return Object.freeze({sectionId:id,order,title,findings:Object.freeze(findings),technicalRefs:refs(findings),...extra});
}

export function buildHumanDesignR3ProfessionalReadingIr(facts={},options={}){
  const priority=options.priorityResult||prioritizeHumanDesignR3WholeChart(facts,options);
  const all=[...priority.primaryFindings,...priority.secondaryFindings,...priority.contextualFindings,...priority.advancedDetails];
  const primary=priority.primaryFindings;
  const channels=pick(all,f=>hasStructure(f,'CHANNEL.'));
  const gates=pick(all,f=>hasStructure(f,'GATE.'));
  const advanced=pick(all,f=>f.tier==='ADVANCED'||hasDomain(f,'ENVIRONMENT_ADVANCED'));
  const sections=[
    section('HD-R3-READING-01-AT_A_GLANCE',1,zh('Your Human Design at a glance','你的人类图一览'),[],{
      chartSummary:Object.freeze({type:facts.type||null,authority:facts.authority||null,profile:facts.profile||null,definition:facts.definition||null,channels:Object.freeze((facts.channels||[]).map(x=>x.channelId)),centers:Object.freeze({defined:Object.freeze(facts.centers?.defined||[]),undefined:Object.freeze(facts.centers?.undefined||[]),open:Object.freeze(facts.centers?.open||[])}),hangingGates:Object.freeze((facts.hangingGates||[]).map(x=>x.gate)),advancedFields:Object.freeze(Object.keys(facts.advanced||{})),confirmedExternalChart:true}),
      customerNote:zh('This reading starts from the Human Design chart you supplied and confirmed. PHI OS is not claiming to calculate this Human Design chart from birth data.','这份读取从你提供并确认的人类图开始。PHI OS 不声称根据出生资料自行计算这张人类图。')
    }),
    section('HD-R3-READING-02-DECISIONS',2,zh('How your decisions work','你的决定如何形成'),pick(primary,f=>hasDomain(f,'DECISION'))),
    section('HD-R3-READING-03-ENGAGEMENT',3,zh('How you engage with situations','你如何进入现实情境'),pick(primary,f=>hasDomain(f,'ENGAGEMENT'))),
    section('HD-R3-READING-04-ROLE',4,zh('Your role and interaction pattern','你的角色与互动模式'),pick(primary,f=>hasDomain(f,'ROLE')||hasDomain(f,'RELATIONSHIP'))),
    section('HD-R3-READING-05-DEFINED_STRUCTURES',5,zh('Your strongest defined structures','最稳定的已定义结构'),pick(all,f=>hasDomain(f,'STRUCTURE')&&f.tier!=='ADVANCED').slice(0,4)),
    section('HD-R3-READING-06-CONTEXT_SENSITIVITY',6,zh('Where context affects you more strongly','哪些地方更容易受到情境影响'),pick(all,f=>hasDomain(f,'OPENNESS_PRESSURE')).slice(0,4)),
    section('HD-R3-READING-07-CHANNELS',7,zh('Channels shaping the chart','塑造整张图的通道'),channels.slice(0,4),{defaultExpandLimit:4}),
    section('HD-R3-READING-08-INTEGRATION',8,zh('Integration and definition','内部整合与 Definition'),pick(all,f=>hasDomain(f,'INTEGRATION')).slice(0,3)),
    section('HD-R3-READING-09-PRIORITY_GATES',9,zh('Priority gates','关键闸门'),gates.slice(0,5),{customerIa:'DETAIL_ON_DEMAND',allGatesDefaultVisible:false}),
    section('HD-R3-READING-10-ADVANCED',10,zh('Environment / Variable / PHS','环境、Variable 与 PHS'),advanced.slice(0,6),{advancedModifierOnly:true}),
    section('HD-R3-READING-11-REALITY',11,zh('Reality comparison','现实对照'),[],{runtimeOwner:'HD-PRO-R3-W17'}),
    section('HD-R3-READING-12-OPEN_QUESTIONS',12,zh('Open questions / contradictions','开放问题与反证'),primary.map(f=>Object.freeze({findingId:f.findingId,question:f.whatWouldContradictIt})).slice(0,8),{technicalRefs:refs(primary)}),
    section('HD-R3-READING-13-SOURCES_BOUNDARIES',13,zh('Chart source and boundaries','图表来源与边界'),[],{
      boundarySummary:Object.freeze([
        zh('Chart authority comes from the customer-supplied, confirmed external Human Design chart.','图表 authority 来自客户提供并确认的外部人类图。'),
        zh('R3 meaning and composition remain shadow candidates until the R3 machine campaign and new human review are accepted.','R3 的意义与组合在新一轮机器 campaign 与人工验收通过前仍处于 shadow candidate。'),
        zh('Advanced Variable/PHS content is observation-oriented, not medical, nutritional, therapeutic, or mandatory advice.','高级 Variable/PHS 内容用于观察，不是医疗、营养、治疗或强制建议。')
      ]),
      technicalTraceAvailable:true,
      internalIdsDefaultVisible:false
    })
  ];
  const result={schemaVersion:HD_R3_READING_IR_VERSION,priorityDigest:priority.priorityDigest,sections:Object.freeze(sections),primaryFindingIds:Object.freeze(primary.map(x=>x.findingId)),technical:Object.freeze({claimIds:refs(all).claimIds,structureRefs:refs(all).structureRefs,sourceRefs:refs(all).sourceRefs,compositionRuleIds:refs(all).compositionRuleIds}),customerDefaults:Object.freeze({showInternalIds:false,showAllGates:false,showAllAtomicMeanings:false}),publication:Object.freeze({machineVerified:false,humanAccepted:false,customerPublishableR3:false})};
  return Object.freeze({...result,readingIrDigest:digest(result)});
}
