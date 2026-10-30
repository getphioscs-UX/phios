import {deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
export const NUM_OWNER_SECTION_VERSION='NUM-OWNER-SEC01-10-20261030';
export const NUM_OWNER_SECTIONS=deepFreeze([
 ['CORE-NUMBER-STRUCTURE','核心数字结构','Core Number Structure',['P06','P07']],
 ['RELATIONSHIPS','关系','Relationships',['P08']],
 ['STRUCTURAL-PATTERNS','结构模式','Structural Patterns',['P09','P10','P11','P12']],
 ['STRENGTHS-FRICTION','优势与摩擦','Strengths & Friction',['P13','P14']],
 ['SELF-RELATIONSHIPS','自我与关系','Self & Relationships',['P15','P16']],
 ['WORK-RESOURCES','工作与资源','Work & Resources',['P17','P18']],
 ['LIFECYCLES','人生周期','Life Cycles',['P19','P20']],
 ['REALITY-OBSERVATION','现实观察','Reality Observation',['P22']],
 ['NAVIGATION-BOUNDARY','导航与边界','Navigation & Boundary',['P23','P24']],
 ['INTEGRATION','综合整合','Integration',['P21','I10-1','I10-2','I10-3','I10-4']]
].map(([slug,zh,en,pages],i)=>({id:'SEC-'+String(i+1).padStart(2,'0'),number:String(i+1).padStart(2,'0'),slug,zh,en,pages,filename:'VIS-REPORT-NUMEROLOGY-SEC-'+String(i+1).padStart(2,'0')+'-'+slug+'.webp'})));
export function numOwnerPhysicalPlan(locale){
 if(!['zh-Hans','en','bilingual'].includes(locale))throw Error('NUM_OWNER_LOCALE_REQUIRED');
 const out=[],push=x=>out.push({physicalPageNumber:out.length+1,...x});
 for(let i=1;i<=5;i++)push({logicalPageId:'P0'+i,pageRole:'FIXED_EDITORIAL',sectionId:null,assetRef:'NUM:P0'+i+':'+locale,languagePolicy:locale});
 push({logicalPageId:'CONTENTS',pageRole:'SEMIFIXED_CONTENTS',sectionId:null,assetRef:'NUM:CONTENTS:bilingual',languagePolicy:'bilingual'});
 for(const s of NUM_OWNER_SECTIONS){push({logicalPageId:null,pageRole:'FIXED_MASTER_SECTION',sectionId:s.id,assetRef:'NUM:'+s.id+':bilingual',languagePolicy:'bilingual'});for(const id of s.pages)push({logicalPageId:id,pageRole:'BODY_CONTENT',sectionId:s.id,assetRef:'NUM:BODY',languagePolicy:locale,contentRef:id});}
 return deepFreeze(out);
}
// These are connective editorial lenses using the frozen source reading. No
// numerology arithmetic, new school meanings or customer life history is added.
export function numOwnerIntegrationPages(publication){
 const role=(code)=>publication.sourceView.birthRoles.find(r=>r.role===code)||publication.sourceView.name.roles.find(r=>r.role===code);
 const rows=['LIFE_PATH','BIRTHDAY_NUMBER','EXPRESSION','SOUL_URGE','PERSONALITY'].map(role).filter(Boolean);
 const labels={LIFE_PATH:['生命路径','Life Path'],BIRTHDAY_NUMBER:['生日数','Birthday'],EXPRESSION:['表达数','Expression'],SOUL_URGE:['灵魂驱动数','Soul Urge'],PERSONALITY:['人格数','Personality']};
 const line=k=>rows.map(r=>labels[r.role][k]+' '+r.value).join(k?' · ':'、');
 const year=publication.sourceView.timing.calendar.find(r=>r.code==='PERSONAL_YEAR');
 const attitude=role('ATTITUDE_NUMBER'),observedRoles=[...rows,...(attitude?[attitude]:[])];
 const roleLabels={...labels,ATTITUDE_NUMBER:['态度数','Attitude']};
 const sameValueRoles=new Map();for(const r of observedRoles){if(!sameValueRoles.has(r.value))sameValueRoles.set(r.value,[]);sameValueRoles.get(r.value).push(r);}
 const recurrent=[...sameValueRoles].filter(([,rs])=>rs.length>1);
 const convergenceZh=recurrent.length?recurrent.map(([value,rs])=>`${value} 同时出现在${rs.map(r=>roleLabels[r.role][0]).join('、')}中`).join('；')+'。可以回看这些角色何时相互支持，何时需要不同的表达方式。':'这些长期角色的取值各不相同。可以先为方向、方法与互动各留一个位置，再观察真实情境中哪一个角色需要先得到回应。';
 const convergenceEn=recurrent.length?recurrent.map(([value,rs])=>`${value} appears in ${rs.map(r=>roleLabels[r.role][1]).join(', ')}`).join('; ')+'. Consider when these roles support one another and when they need different forms of expression.':'These long-term roles have distinct values. Give direction, methods and interaction their respective places, then observe which role needs attention first in a real situation.';
 const stage=publication.chartModels.en.publicationDetail.westernTimeline.selection;
 const ageZh=stage.endAge==null?`${stage.startAge} 岁起`:`${stage.startAge}–${stage.endAge} 岁`,ageEn=stage.endAge==null?`${stage.startAge} and older`:`${stage.startAge}–${stage.endAge}`;
 const stageZh=stage.available?`目标日期 ${publication.sourceView.targetDate} 对应第 ${stage.cycleNumber} 阶段（${ageZh}），峰数 ${stage.pinnacle}、挑战数 ${stage.challenge}。把这个阶段坐标与个人年 ${year.value} 分层阅读，再结合现实条件安排当前的重点。`: `以个人年 ${year.value} 的既有时间视角，对照长期投入与当前安排。`;
 const stageEn=stage.available?`At ${publication.sourceView.targetDate}, the existing timeline selects stage ${stage.cycleNumber}, ages ${ageEn}, Pinnacle ${stage.pinnacle} and Challenge ${stage.challenge}. Read this stage alongside Personal Year ${year.value} as distinct timing layers, then consider present conditions when setting priorities.`:`Use the existing timing perspective of Personal Year ${year.value} when comparing long-term commitments with present arrangements.`;
 const sections=[
  {id:'I10-1',number:'10.1',title:{'zh-Hans':'综合总览',en:'Integrated Overview'},zh:[`把${line(0)}放在同一张地图中，方向、贡献、方法与关系中的关注开始彼此连接。前面的每个角色都有自己的位置；此刻更值得看见的是它们怎样一起参与一项真实选择。`,'有些线索在多个主题中呼应，有些只在特定情境里变得明显。可以从最近一个决定开始：你希望完成什么，如何与人协作，又为自己保留了怎样的节奏？这些问题让整份阅读逐渐形成一个可理解的整体。','留意哪些主题在真实经历中相互呼应。让反复出现的线索帮助你理解决定、关系和节奏，再把当前最有帮助的一条线索放到下一步选择中。'],en:[`Read ${line(1)} within one map: direction, contribution, methods and relationship concerns begin to connect. Each role has its own place. The useful focus now is how they participate together in a real choice.`,'Some threads recur across several themes; others become clearer in particular circumstances. Begin with one recent decision: what did you want to complete, how did you cooperate, and what rhythm did you leave for yourself? These questions bring the earlier reading into a coherent whole.','Notice which themes connect in experience. Recurring threads can help you understand decisions, relationships and rhythm. Bring the most useful thread into the next choice.']},
  {id:'I10-2',number:'10.2',title:{'zh-Hans':'关键主题如何汇聚',en:'Pattern Convergence'},zh:['可以沿着四条主线重新阅读前面的内容：方向与成果、关系与互动、资源与边界、结构与节奏。观察它们在哪里相互支持，又在哪里需要不同的先后次序。','当目标、投入方式与现实条件逐渐协调，行动会更有方向。出现张力时，可以把它看作需要安排角色次序的信号：先澄清目的，再讨论方法与合作，最后为回看和调整留出空间。',`以目标日期 ${publication.sourceView.targetDate} 的个人年 ${year.value} 作为时间坐标，分别回看长期投入与当前安排。先确定现实中的重点，再选择一项可回看的行动，让阶段感落实在具体节奏中。`],en:['Follow four threads through the earlier chapters: direction and outcomes, relationships and interaction, resources and boundaries, structure and rhythm. Notice where they support one another and where they need a different order of attention.','As aims, ways of engaging and practical conditions align, action can become clearer. Tension offers a reason to arrange the roles: clarify the purpose, consider methods and cooperation, then leave room for review and adjustment.',`Use Personal Year ${year.value} at the target date ${publication.sourceView.targetDate} as a timing reference when reviewing long-term commitments and present arrangements. Identify a practical priority and choose one action to review, giving the timing perspective a concrete place in your routine.`]},
  {id:'I10-3',number:'10.3',title:{'zh-Hans':'你的人生整合地图',en:'Your Integrated Life Map'},zh:[`你的整合地图以${line(0)}为已有坐标。可以让长期方向、投入方式与关系中的表达各有位置，再把个人年 ${year.value} 的时间视角放在一旁作对照。`, '选择一个最近正在推进的项目或关系安排：你要保留什么成果，愿意调整哪些方法，怎样表达需要并说明责任？把这几个问题放在一起，比单看一个数字更容易形成清楚的行动次序。', '留意哪条线索在实际经验中反复出现，也给不符合之处留出位置。回看时，资源、边界、节奏和表达可以成为四个具体入口；从最贴近当前条件的一个开始。'],en:[`Your integrated map brings ${line(1)} into one set of existing coordinates. Give long-term direction, ways of engaging and relational expression their respective places, alongside the timing perspective of Personal Year ${year.value}.`, 'Choose a current project or relationship arrangement: what outcome would you preserve, which methods could you revise, and how would you express needs and clarify responsibilities? Considered together, these questions can form a clearer order for action than any isolated number.', 'Notice which thread recurs in experience and leave room for exceptions. Resources, boundaries, rhythm and expression offer four practical entry points. Begin with the one that fits present conditions.']},
  {id:'I10-4',number:'10.4',title:{'zh-Hans':'整合后的行动方向',en:'Integration Guidance'},zh:['先抓住当前最有帮助的一条主线。它可能关乎投入、合作、表达或节奏；选择一个足够具体的情境，让整份数字阅读转化为可以观察的小步骤。','问一问自己：哪个主题反复出现，值得认真回应？什么资源已经具备，哪些安排仍需协商？设定一个回看的时点，保留现实反馈，让下一步更贴近自己的条件。',`让${line(0)}作为回看时的角色提示。写下一个准备尝试的改变、可用资源与回看日期；在实际尝试后，记录哪些部分帮助了选择，哪些仍需调整。`],en:['Begin with the thread that is most useful now. It may concern commitment, cooperation, expression or rhythm. Choose a specific situation so the whole reading can become a small, observable step.','Ask which theme has returned often enough to deserve attention, which resources are available, and which arrangements need discussion. Set a point for review and make room for real feedback, so the next step fits your conditions.',`Keep ${line(1)} as role prompts for review. Write down one change to try, the resources available and a review date. After the trial, record what helped the choice and what still needs adjustment.`]}
 ];
 const map=sections.find(p=>p.id==='I10-3');map.zh.splice(1,1,convergenceZh,stageZh);map.en.splice(1,1,convergenceEn,stageEn);
 return sections.map(p=>({...p,logicalPageId:p.id,ownerSourceRef:'OWNER_20261030_SEC10_'+p.number,nativePatternGrouping:recurrent.map(([value,rs])=>({existingValue:value,roles:rs.map(r=>r.role)})),nativeTimelineSelection:stage,nativeSourceClaimRefs:rows.map(r=>r.sourceClaimId).filter(Boolean),kind:'OWNER_INTEGRATION',languages:Object.fromEntries([['zh-Hans',p.zh],['en',p.en]].map(([l,texts])=>[l,{units:texts.map((text,i)=>({unitId:p.id+'-'+i,text,sourceRef:'OWNER_SEC10_DIRECTION_AND_FROZEN_R30_NATIVE_READING'}))}]))}));
}
