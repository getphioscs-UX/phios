import {projectBaziPublicationPages} from './bazi-visual-report-projection.js';
import {buildBaziPublicationVisual} from '../canonical-presentation-runtime/bazi-publication-visuals.js';
import {compilePublicationInterpretation} from './narrative/narrative-brief-compiler.js';
import {composePublicationNarrative,humanizePublicationStatement} from './narrative/narrative-writer.js';
import {BAZI_SECTION_EDITORIAL} from './bazi-section-editorial.js';
import {buildSectionEvidencePack,T3_SECTIONS,crossSectionEditorialCheck} from './narrative/bazi-editorial-contract.js';
import {composeBaziT3Section,canShowT3} from './narrative/bazi-t3-composition.js';
import {buildBaZiNarrativeClaimIR} from './narrative/bazi-explanatory-authority.js';
import {BAZI_SECTION_REGISTRY,REPORT_PAGE_FAMILIES,validateSectionRegistry,bindSectionVisual,splitSemanticBlocks,textUnits} from '../canonical-presentation-runtime/report-section-contract.js';

// Adapter inside the existing projection owner: native facts are calculated
// upstream. The section engine never interprets raw birth data.
export async function projectBaziSectionPublication({reading,locale,temporalContext,composition={},unavailableModules=[],allowUnselectedTiming=false}={}){
 validateSectionRegistry();
 const legacy=await projectBaziPublicationPages({reading,locale,temporalContext,allowUnselectedTiming});
 const noTarget=allowUnselectedTiming&&temporalContext?.mode==='UNAVAILABLE';
 const lang=locale==='en'?'en':'zhHans',pick=(en,zh)=>locale==='en'?en:zh;
 const source=n=>legacy.pages.find(p=>p.pageNumber===n),internal=n=>legacy.internalPages.find(p=>p.pageNumber===n).interpretation;
 const topics=reading.professionalModules.customerNarrative.topicNarratives;
 const topic=code=>topics.find(t=>t.topicCode===code);
 const modules={},block=(text,sourceRef,role='EDITORIAL_GUIDANCE')=>({text:humanizePublicationStatement(text),sourceRef,role});
 const edRef='functions/personal-reading/bazi-section-editorial.js';
 const paragraphs=(key,texts,sourceRef)=>modules[key]={blocks:texts.filter(Boolean).map(t=>block(t,sourceRef))};
 const e=s=>BAZI_SECTION_EDITORIAL[s];
 const appendixConditions=[];
 const makeNarrative=async(key,section,code)=>{
  const t=topic(code),idx=t?topics.indexOf(t):-1,ref=idx>=0?`professionalModules/customerNarrative/topicNarratives/${idx}`:null;
  const authority=await buildBaZiNarrativeClaimIR({reading,sectionKey:section,locale,temporalSnapshot:temporalContext});
  const selected=authority.claims.filter(c=>c.relationType!=='BOUNDARY');
  const byType=(...types)=>selected.filter(c=>types.includes(c.relationType));
  const joinClaims=claims=>claims.map(c=>humanizePublicationStatement(c.text)).filter(Boolean).join(' ');
  // Deterministic publication composition: licensed claims are grouped by
  // reading function so the customer receives a coherent explanation instead
  // of a schema-like list. No new method meaning is created here.
  const groups=[
   byType('EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS'),
   byType('SUPPORT_CONDITION','TENSION','OPERATING_CONDITION','CONTEXT_MODIFIER'),
   byType('CROSS_SECTION_RELEVANCE','OPEN_CONDITION','TEMPORAL_RELEVANCE','CONTRAST','ASSOCIATION')
  ];
  const blocks=groups.map(claims=>{
   const text=joinClaims(claims);if(!text)return null;
   const refs=[...new Set(claims.flatMap(c=>c.sourceRefs||[]))];
   return block(text,refs.join('|'),'METHOD_INTERPRETATION');
  }).filter(Boolean);
  modules[key]={blocks,boundary:authority.claims.find(c=>c.relationType==='BOUNDARY')?.text||''};
  if(t?.condition?.[lang]&&ref)appendixConditions.push(block(t.condition[lang],`${ref}/condition`,'METHOD_BOUNDARY'));
 };
 for(const [key,n] of [['baziChart',7],['dayMaster',8],['fiveElements',9],['chartStructure',12],['usefulElements',14]])modules[key]={blocks:[],sourcePages:[n],facts:source(n).facts,evidence:internal(n).evidence};
 modules.baziChart.blocks=[block(e('S01_OVERVIEW').bridge[locale],`${edRef}#S01_OVERVIEW`)];
 modules.chartStructure.blocks=[block(source(12).paragraphs.concat(source(13).paragraphs).join(' '),internal(12).evidence[0],'METHOD_INTERPRETATION'),block(pick('Read each candidate alongside the conditions that would establish it, keeping a visible path separate from a completed judgment.','请把候选模式与成立所需的条件一起阅读，分清路径可见与判断完成之间的差别。'),`${edRef}#S03_LIFE_STRUCTURE`)];
 modules.chartStructure.boundary=source(12).boundary;
 // S02 uses a dedicated deterministic publication template rather than one
 // generic narrative block. Each facet selects only licensed S02 claims.
 {
  const authority=await buildBaZiNarrativeClaimIR({reading,sectionKey:'S02_PERSONALITY',locale,temporalSnapshot:temporalContext});
  const claims=authority.claims.filter(x=>x.relationType!=='BOUNDARY');
  const byId=suffix=>claims.find(x=>x.id.endsWith(suffix));
  const pairClaims=claims.filter(x=>x.id.includes(':PAIR_'));
  const tensionPairs=pairClaims.filter(x=>['TENSION','REPEAT_TENSION'].includes(x.relationQualifier));
  const linkPairs=pairClaims.filter(x=>x.relationQualifier==='LINK');
  const makeFacet=(key,lead,selected)=>{
   const unique=[...new Map(selected.filter(Boolean).map(x=>[x.id,x])).values()];
   modules[key]={blocks:[
    block(lead,`${edRef}#S02_PERSONALITY`,'EDITORIAL_GUIDANCE'),
    ...unique.map(x=>block(humanizePublicationStatement(x.text),(x.sourceRefs||[]).join('|'),'METHOD_INTERPRETATION'))
   ],boundary:authority.claims.find(x=>x.relationType==='BOUNDARY')?.text||''};
  };
  makeFacet('personalityCoreStyle',pick(
   'Your core operating style is read from the function that receives first emphasis, together with the other functions that remain active around it. The point is not to assign a permanent personality label, but to identify the structure that repeatedly organizes how capability is approached.',
   '你的核心运作方式，要从命盘里首先被强调的功能开始，再把同时参与的其他功能放回来一起看。重点不是贴上永久人格标签，而是找出反复组织你如何发展与使用能力的那套结构。'
  ),[byId(':PRIMARY'),byId(':DOMAIN_EXPLANATION'),byId(':DIMENSIONS'),byId(':SECONDARY')]);

  makeFacet('personalityLearning',pick(
   'Learning and processing are read through the chart’s support-and-absorption function and the conditions around it. This layer asks how information is taken in, supported and made usable before expression is expected.',
   '学习与处理方式主要从命盘中的支持与吸收功能，以及包围它的条件来阅读。这一层关注信息如何被接收、获得支持并变成可用能力，再进入表达与输出。'
  ),[byId(':PRIMARY'),byId(':SUPPORT'),...claims.filter(x=>x.id.includes(':WHOLE_')&&/RESOURCE|CARRY/i.test(x.text))]);

  makeFacet('personalityExpression',pick(
   'Expression is separate from learning. A capability may exist internally yet need different conditions to become repeatable visible output. Recorded links between self-position and expression refine this reading.',
   '表达需要与学习分开阅读。一项能力可以已经存在于内部，但要变成可见输出、反复使用并持续承担，可能需要不同条件。命盘中自我位置与表达之间的已记录联结，会进一步修正这一层。'
  ),[...linkPairs,byId(':TENSION'),byId(':OPERATING_CONDITION')]);

  makeFacet('personalityFriction',pick(
   'Friction is not treated as a flaw. It is the part of the structure where support, expression, standards or external demand do not automatically move in the same direction. Repeated tension across chart positions shows where capability may need more deliberate coordination.',
   '张力不等于缺点。它指的是支持、表达、标准与外部要求并不会自动朝同一方向运作的部分。若张力在多个柱位反复出现，就更需要有意识地协调这些功能。'
  ),[...tensionPairs,byId(':TENSION'),...claims.filter(x=>x.id.includes(':WHOLE_')&&/pressure|责任|规则/i.test(x.text))]);

  makeFacet('personalityReliability',pick(
   'Reliability asks a different question from talent: can the capability remain usable when expression, responsibility and demand continue over time? Carrying conditions and unresolved strength judgments therefore belong here, without being converted into a fixed strong-or-weak identity.',
   '稳定性问的不是“有没有能力”，而是当表达、责任与要求持续存在时，这项能力是否仍然可用。因此，承载条件与尚未定论的强弱判断应该放在这里阅读，而不能被转换成固定的身强或身弱身份。'
  ),[byId(':OPERATING_CONDITION'),byId(':OPEN_STRENGTH'),...claims.filter(x=>x.id.includes(':WHOLE_')&&/carry|承载/i.test(x.text))]);
 }
 // Domain-specific deterministic facets keep the publication readable without
 // creating new method meaning. Each facet selects licensed claims from the
 // same section authority and changes only editorial grouping.
 const makeDomainFacets=async(section,code,facets)=>{
  const authority=await buildBaZiNarrativeClaimIR({reading,sectionKey:section,locale,temporalSnapshot:temporalContext});
  const claims=authority.claims.filter(x=>x.relationType!=='BOUNDARY');
  const boundary=authority.claims.find(x=>x.relationType==='BOUNDARY')?.text||'';
  const select=types=>claims.filter(x=>types.includes(x.relationType));
  const toBlock=(key,lead,selected)=>{
   const unique=[...new Map(selected.filter(Boolean).map(x=>[x.id,x])).values()];
   modules[key]={blocks:[
    block(lead,`${edRef}#${section}`,'EDITORIAL_GUIDANCE'),
    ...unique.map(x=>block(humanizePublicationStatement(x.text),(x.sourceRefs||[]).join('|'),'METHOD_INTERPRETATION'))
   ],boundary};
  };
  for(const facet of facets)toBlock(facet.key,facet.lead,select(facet.types));
 };

 await makeDomainFacets('S03_LIFE_STRUCTURE','LIFE_OPERATION',[
  {key:'lifeStructureSystem',lead:pick(
   'The structural center of the chart is read by bringing carrying conditions, functional balance and recurring relationships into one frame. This page explains how the main system holds together before any single pattern name is treated as decisive.',
   '命盘的结构中心，要把承载条件、功能分布与反复出现的关系放在同一框架里阅读。本页先说明整套系统怎样组织起来，再判断任何单一格局名称是否真的具有决定性。'
  ),types:['EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS','SUPPORT_CONDITION']},
  {key:'lifeStructureConditions',lead:pick(
   'The second question is whether the visible structure can be sustained. Pattern candidates, tension, carrying limits and unresolved conditions belong together here because they determine how far an interpretation can safely go.',
   '第二个问题是：眼前可见的结构能否被持续承载。格局候选、张力、承载限制与未定条件必须放在一起，因为它们共同决定这份解释可以走多远。'
  ),types:['TENSION','OPERATING_CONDITION','CONTEXT_MODIFIER','CROSS_SECTION_RELEVANCE','OPEN_CONDITION','ASSOCIATION']}
 ]);

 await makeDomainFacets('S04_CAREER','CAREER',[
  {key:'careerRoleSystem',lead:pick(
   'Career begins with role structure: what you are expected to carry, what you are expected to produce, and how resources and learning support enter the role. The chart is most useful here when these functions are read as one working system.',
   '事业首先要看角色结构：需要承担什么、需要产出什么，以及资源与学习支持怎样进入这个角色。把这些功能当作一套工作系统一起阅读，命盘才真正具有现实解释力。'
  ),types:['EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS','ASSOCIATION']},
  {key:'careerWorkingConditions',lead:pick(
   'A role can look suitable on paper and still become difficult when authority, standards, support or workload are mismatched. This page focuses on the conditions that make the same capability easier or harder to carry in practice.',
   '一个角色在名称上看起来合适，仍可能因为权限、标准、支持或工作量不匹配而变得困难。本页关注的是：什么条件会让同一套能力在现实中更容易或更难持续运作。'
  ),types:['SUPPORT_CONDITION','TENSION','OPERATING_CONDITION','CONTEXT_MODIFIER']},
  {key:'careerDirection',lead:pick(
   'Career direction is read from repeated themes across the chart rather than from a single profession label. Cross-chart priorities and unresolved conditions help separate a durable work pattern from a temporary or incomplete signal.',
   '事业方向应从整盘反复出现的主题中读取，而不是从一个职业标签直接推出。跨结构重点与未定条件，可以帮助区分长期工作模式与暂时或尚未完成的讯号。'
  ),types:['CROSS_SECTION_RELEVANCE','OPEN_CONDITION','CONTRAST']}
 ]);

 await makeDomainFacets('S05_WEALTH','WEALTH',[
  {key:'wealthResourceFlow',lead:pick(
   'Wealth is first read as resource flow: how value is produced, exchanged and brought into the system. This page focuses on the functions that make resources visible before asking what happens to them afterward.',
   '财富首先从资源流动来读：价值怎样被创造、交换并进入系统。本页先看什么功能让资源出现，再进入资源之后如何被处理的问题。'
  ),types:['EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS','ASSOCIATION']},
  {key:'wealthRetentionPressure',lead:pick(
   'Receiving resources and keeping them are different structural questions. Support, competing demands, responsibility and exchange pressure determine whether resources can be retained, redirected or repeatedly consumed.',
   '得到资源与保留资源，是两个不同的结构问题。支持条件、竞争性要求、责任与交换压力，会共同影响资源能否被保留、重新调动，或持续被消耗。'
  ),types:['SUPPORT_CONDITION','TENSION','OPERATING_CONDITION','CONTEXT_MODIFIER']},
  {key:'wealthRealityBoundary',lead:pick(
   'The final wealth layer separates symbolic resource structure from real financial outcomes. Cross-chart priorities can show where resource themes repeat, while open conditions preserve the boundary between a method reading and an actual financial result.',
   '最后一层财富读取，要把象征性的资源结构与真实财务结果分开。跨结构重点可以显示资源主题在哪里反复出现；未定条件则保留方法解读与现实财务结果之间的边界。'
  ),types:['CROSS_SECTION_RELEVANCE','OPEN_CONDITION','CONTRAST']}
 ]);

 await makeDomainFacets('S06_RELATIONSHIP','RELATIONSHIPS',[
  {key:'relationshipPosition',lead:pick(
   'Relationship reading begins with your recurring position inside important bonds: what you expect, what you exchange, what you carry and what kind of support enters the relationship. It describes your side of the interaction without turning the other person into a chart symbol.',
   '关系读取先从你在重要关系中反复出现的位置开始：期待什么、交换什么、承担什么，以及什么样的支持会进入关系。它描述的是你的互动位置，而不会把对方压缩成命盘符号。'
  ),types:['EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS','ASSOCIATION']},
  {key:'relationshipInteraction',lead:pick(
   'The next layer is interaction. Recorded links and tensions between chart positions show where expectations, support, responsibility and self-expression may need active negotiation instead of moving automatically in the same direction.',
   '下一层是互动。柱位之间已记录的联结与张力，会显示期待、支持、责任与自我表达在哪里需要主动协商，而不是自然地朝同一方向运行。'
  ),types:['SUPPORT_CONDITION','TENSION','OPERATING_CONDITION','CONTEXT_MODIFIER']},
  {key:'relationshipBoundaries',lead:pick(
   'Relationship guidance becomes more reliable when repeated chart themes are separated from fixed outcome claims. Cross-chart relevance can identify recurring relational priorities, while open conditions keep marriage, separation and partner outcomes outside unsupported certainty.',
   '关系建议只有在“反复结构”与“固定结果”被分开后才更可靠。跨结构重点可以识别持续出现的关系主线；未定条件则避免把婚姻、分离或伴侣结果写成没有依据的确定结论。'
  ),types:['CROSS_SECTION_RELEVANCE','OPEN_CONDITION','CONTRAST']}
 ]);
 await makeNarrative('healthNarrative','S07_HEALTH','PRESSURE');
 if(modules.healthNarrative){
  modules.healthNarrative.blocks.push(block(e('S07_HEALTH').bridge[locale],`${edRef}#S07_HEALTH`,'EDITORIAL_GUIDANCE'));
 }else{
  paragraphs('healthNarrative',[e('S07_HEALTH').bridge[locale]],`${edRef}#S07_HEALTH`);
 }
 const itemMap={chartHighlights:'S01_OVERVIEW',strengths:'S02_PERSONALITY',lifeStructureInsights:'S03_LIFE_STRUCTURE',careerFields:'S04_CAREER',financialAdvice:'S05_WEALTH',relationshipAdvice:'S06_RELATIONSHIP',wellnessAdvice:'S07_HEALTH',timingInsights:'S08_TIMING',nextSteps:'S09_GUIDANCE',appendixInsights:'S10_APPENDIX'};
 for(const [key,section] of Object.entries(itemMap))modules[key]={blocks:[],items:e(section).items.map(i=>block(i[locale],`${edRef}#${section}`))};
 // Strengths, challenges and social style share the admitted observation set;
 // they are not fabricated independent measurements.
 modules.challenges={blocks:[]};modules.socialStyle={blocks:[]};
 modules.timingContext={blocks:[block(source(20).paragraphs[0],internal(20).evidence[0],'METHOD_INTERPRETATION'),block(e('S08_TIMING').bridge[locale],`${edRef}#S08_TIMING`)],temporal:{...source(20).temporal,generatedAt:temporalContext.generatedAt,localTime:temporalContext.localTime},observations:e('S08_TIMING').items.slice(0,2).map(x=>x[locale]),boundary:source(20).boundary};
 modules.currentYearInsight={blocks:source(21).paragraphs.map(t=>block(t,internal(21).evidence[0],'METHOD_INTERPRETATION')),temporal:modules.timingContext.temporal,observations:[e('S08_TIMING').items[2][locale],pick('What stayed consistent across the year boundary, despite the change in the named time layer?','时间层名称改变前后，哪些经验仍然保持一致？')],boundary:pick('The year layer frames observation; this reading does not identify specific events as opportunities or warnings.','流年层用于界定观察范围；本次读取不把具体事件判断为机会或预警。')};
 // Optional career timing is absent unless an upstream adapter supplies an
 // admitted career-specific module. Generic current-year data is insufficient.
 {
  const authority=await buildBaZiNarrativeClaimIR({reading,sectionKey:'S09_GUIDANCE',locale,temporalSnapshot:temporalContext});
  const claims=authority.claims.filter(x=>x.relationType!=='BOUNDARY');
  const ranked=claims.filter(x=>x.relationType==='CROSS_SECTION_RELEVANCE').slice().sort((a,b)=>(a.rank??99)-(b.rank??99));
  const temporal=claims.filter(x=>x.relationType==='TEMPORAL_RELEVANCE');
  const open=claims.filter(x=>x.relationType==='OPEN_CONDITION');
  const mk=(key,lead,list)=>{
   const refs=[...new Set(list.flatMap(x=>x.sourceRefs||[]))],body=list.map(x=>humanizePublicationStatement(x.text)).join(' ');
   modules[key]={blocks:[block(lead,`${edRef}#S09_GUIDANCE`,'EDITORIAL_GUIDANCE'),...(body?[block(body,refs.join('|'),'METHOD_INTERPRETATION')]:[])],boundary:authority.claims.find(x=>x.relationType==='BOUNDARY')?.text||''};
  };
  mk('guidancePriorities',pick(
   'The most useful guidance comes from themes that repeat across several parts of the chart. This page brings those recurring priorities into one reading order so they can be acted on without collapsing the whole report into a single verdict.',
   '最有价值的建议，来自在整张命盘不同部分反复出现的主题。本页把这些重复主线按阅读顺序重新收拢，让它们可以转化成行动重点，而不是把整份报告压成一个单一结论。'
  ),ranked);
  mk('guidanceCurrentFocus',pick(
   'Current focus depends on which of those recurring themes are relevant to the present timing layer and which judgments still remain open. The aim is to identify what deserves attention now while carefully keeping temporary emphasis separate from permanent structure.',
   '当前重点要看哪些重复主线正在与现阶段时间层发生关联，同时保留仍未确定的判断。目标是找出现在最值得注意的内容，同时把阶段性放大与长期结构清楚分开。'
  ),[...temporal,...open]);
 }
 paragraphs('boundaries',[e('S10_APPENDIX').bridge[locale]],`${edRef}#S10_APPENDIX`);
 modules.boundaries.blocks.push(...appendixConditions);
 paragraphs('methodology',[pick('BaZi organizes a birth reading around four pillars and uses the Day Master as a reference position. The diagrams in this report preserve the distinctions between visible stems, branches, hidden stems and element counts. Structural candidates are shown with their conditions, so an open pattern remains open rather than becoming a final verdict. The timing chapter adds only the layers resolved by the existing method engine for the saved observation window. These layers accompany the birth structure; they do not replace it. Read the prose as a bounded explanation of that structure, then compare it with independent experience.','八字围绕四柱组织出生读取，并以日主作为参照位置。本报告的图表区分天干、地支、藏干与五行计数；结构候选与成立条件一同呈现，因此仍开放的格局不会被写成最终判断。时间章节只加入既有方法引擎针对保存的观察窗口所解析的层次，它们与本命结构一起阅读，不取代本命。请把文字看作有范围的结构说明，再用独立经验来比较。')],`${edRef}#S10_APPENDIX`);
 for(const name of unavailableModules)delete modules[name];
 const sections=[],internalSections=[],pages=[],t3Interpretations=[];
 for(const section of BAZI_SECTION_REGISTRY.sections){
  const editorial=e(section.key),sourceNumbers=({S01_OVERVIEW:[7,8,9],S02_PERSONALITY:[14],S03_LIFE_STRUCTURE:[11,12,13,14,15],S04_CAREER:[18],S05_WEALTH:[19],S06_RELATIONSHIP:[17],S07_HEALTH:[24],S08_TIMING:[20,21],S09_GUIDANCE:[16,18,19,17],S10_APPENDIX:[26]})[section.key];
  const sourcePage=legacy.reports.flatMap(r=>r.pages).find(p=>p.pageNumber===sourceNumbers[0]);
  const definitions=section.pages.slice(1).filter(p=>(!p.optional||p.dataModules.every(k=>modules[k]))&&!(noTarget&&p.dataModules.some(k=>['timingContext','currentYearInsight'].includes(k))));
  const pageBlocks=[];
  for(const def of definitions){
   if(def.primaryVisualRef){
    const count=def.primaryVisualRef==='BZR-VIS-TEN-GOD-DETAILS'?reading.professionalModules.tenGods.items.length:1;
    for(let offset=0;offset<count;offset+=4){const visual=buildBaziPublicationVisual({reading,primaryVisualRef:def.primaryVisualRef,locale,topicCode:def.visualTopic,offset});
     pageBlocks.push({definitionKey:def.key,visualContinuation:offset?`_CONT_${offset/4+1}`:'',pageFamily:def.family,title:def.title[locale],contentBlocks:def.primaryVisualRef==='BZR-VIS-FOUR-PILLARS'?modules.baziChart.blocks:[],items:[],sourcePages:[],facts:[],observations:[],boundary:visual.boundary,primaryVisualRef:visual.primaryVisualRef,primaryVisualHtml:visual.primaryVisualHtml});
    }continue;
   }
   const selected=def.dataModules.map(k=>modules[k]).filter(Boolean),blocks=selected.flatMap(m=>m.blocks||[]),items=selected.flatMap(m=>m.items||[]);
   if(def.omitWhenInsufficient&&(!selected.length||def.family==='INSIGHT_LIST_PAGE'&&items.length<3))continue;
   if(!selected.length)throw Error(`SECTION_REQUIRED_MODULE_MISSING:${def.key}`);
   pageBlocks.push({definitionKey:def.key,pageFamily:def.family,title:def.title[locale],contentBlocks:blocks,items,sourcePages:selected.flatMap(m=>m.sourcePages||[]),facts:selected.flatMap(m=>m.facts||[]),temporal:selected.find(m=>m.temporal)?.temporal||null,observations:selected.flatMap(m=>m.observations||[]),boundary:selected.map(m=>m.boundary).filter(Boolean).join(' ')});
  }
  const sectionObject={sectionKey:section.key,title:section.title,openerIntro:editorial.intro[locale],keyThemes:pageBlocks.map(p=>p.title),pageBlocks,boundaryNotes:pageBlocks.map(p=>p.boundary).filter(Boolean),practicalObservations:pageBlocks.flatMap(p=>p.observations),temporalContext};
  const narrative=pageBlocks.find(p=>p.pageFamily==='NARRATIVE_ANALYSIS_PAGE'||p.pageFamily==='SUMMARY_PAGE');
  const allowed=noTarget&&section.key==='S08_TIMING'?modules.timingContext.blocks.slice(0,1):(narrative||pageBlocks.find(p=>p.contentBlocks.length)||pageBlocks[0]).contentBlocks;
  const interpretation=await compilePublicationInterpretation({methodId:'BZR',page:{...sourcePage,pageId:section.key,evidenceRefs:[...new Set(sourceNumbers.flatMap(n=>internal(n).evidence))]},temporalContext,allowedStatements:allowed.map(b=>({text:b.text,sourceRef:b.sourceRef})),conditions:sectionObject.boundaryNotes,realityQuestions:sectionObject.practicalObservations});
  // Canonical customer publication is deterministic. Provider-backed prose is
  // an explicit T3 editorial experiment below and never the default composer.
  const composed=await composePublicationNarrative({interpretation,locale,executionClass:'T2_LIGHT_COMPOSITION',sectionComposition:sectionObject});
  if(narrative&&composed.internalOnly.evidenceAdmission==='SEMANTIC_VERIFIER_ACCEPTED'){
   const maximum=REPORT_PAGE_FAMILIES[narrative.pageFamily].budget[locale==='en'?'en':'zh']?.[1]||500;
   if(composed.paragraphs.every(text=>textUnits(text,locale)<=maximum))narrative.contentBlocks=composed.paragraphs.map(text=>block(text,section.key,'VERIFIED_SECTION_COMPOSITION'));
   else composed.internalOnly={...composed.internalOnly,executionClass:'T2_LIGHT_COMPOSITION',evidenceAdmission:'SOURCE_BOUND_CANONICAL_STATEMENTS',fallbackState:'DEEP_COMPOSITION_FALLBACK',fallbackReason:'COMPOSITION_BUDGET_REJECTED'};
  }
  let t3=null;
  if(composition.t3&&T3_SECTIONS.includes(section.key)){
   // Build from all deterministic pages in this section; timing includes both
   // the luck and annual layers. Guidance also receives prior admitted sections.
   const packInterpretation={...interpretation,canonicalFacts:[...new Map(sourceNumbers.flatMap(n=>internal(n).canonicalFacts).map(f=>[f.sourceRefs[0],f])).values()]};
   const topicCode=({S02_PERSONALITY:'CAPABILITY',S03_LIFE_STRUCTURE:'LIFE_OPERATION',S04_CAREER:'CAREER',S05_WEALTH:'WEALTH',S06_RELATIONSHIP:'RELATIONSHIPS',S07_HEALTH:'PRESSURE',S09_GUIDANCE:'LIFE_OPERATION'})[section.key];
   const prompts=(reading.professionalModules.realityBridge.topicPrompts||[]).filter(p=>p.topicCode===topicCode).flatMap(p=>p.prompts||[]);
   packInterpretation.counterSignals=prompts.filter(p=>p.promptType==='COUNTEREXAMPLE').map(p=>p.prompt[lang]);
   packInterpretation.realityQuestions=prompts.filter(p=>p.promptType==='REPEAT_OR_CONTEXT').map(p=>p.prompt[lang]);
   if(section.key==='S07_HEALTH'){
    const pressure=topic('PRESSURE');
    if(pressure){const ref=`professionalModules/customerNarrative/topicNarratives/${topics.indexOf(pressure)}`;packInterpretation.allowedInterpretations=['lead','development'].map(k=>({text:pressure[k][lang],sourceRef:`${ref}/${k}`}));packInterpretation.tensionSignals=[pressure.condition[lang]];}
   }
   if(section.key==='S08_TIMING'){
    packInterpretation.allowedInterpretations=sourceNumbers.flatMap(n=>internal(n).allowedInterpretations);
    packInterpretation.canonicalFacts.push({id:'SAVED_TEMPORAL_LAYERS',label:'Saved natal comparison window, luck cycle and year',displayValue:source(20).temporal,sourceRefs:[`${reading.summary.reportDigest}#professionalModules/professionalTimeline/currentWindow`]});
   }
   const relatedPriorities=(reading.professionalModules.customerNarrative.priorityChapters||[]).filter(p=>topic(topicCode)?.priorityRefs?.includes(p.priorityRef)||(section.key==='S08_TIMING'&&p.themeType==='TIMING'));
   for(const chapter of relatedPriorities){
    const index=reading.professionalModules.customerNarrative.priorityChapters.indexOf(chapter),ref=`professionalModules/customerNarrative/priorityChapters/${index}`;
    packInterpretation.allowedInterpretations=[...packInterpretation.allowedInterpretations,...['thesis','development','condition'].filter(k=>chapter[k]?.[lang]).map(k=>({text:chapter[k][lang],sourceRef:`${ref}/${k}`}))];
   }
   const pack=await buildSectionEvidencePack({interpretation:packInterpretation,locale,sectionKey:section.key,relatedInterpretations:t3Interpretations,reading});
   t3Interpretations.push(packInterpretation);
   // Rendering may consume accepted snapshots, never start an implicit eight-
   // section provider run. New generation belongs to the staged QA endpoint.
   const frozenSnapshot=composition.t3.snapshots?.[section.key];
   t3=frozenSnapshot?await composeBaziT3Section({pack,snapshot:frozenSnapshot}):{status:'FALLBACK',snapshot:null,internalOnly:{fallbackState:'T3_FALLBACK_USED',fallbackReason:'ACCEPTED_SNAPSHOT_REQUIRED'}};
   t3.evidencePack=pack;
   if(t3.status==='PASS'&&canShowT3({...composition.t3,snapshot:t3?.snapshot})){
    const n=t3.snapshot.finalNarrative,target=narrative||pageBlocks.find(p=>p.pageFamily==='TIMING_PAGE');
    const main=[n.lead,...n.interpretation,...n.howThisMayShowUp,n.closingInsight].filter(b=>b.text.trim());
    // Static publication pages are immutable. T3 may enrich only dynamic narrative/timing pages.
    const secondary=pageBlocks.find(p=>p!==target&&p.pageFamily==='TIMING_PAGE');
    const secondaryBlocks=[...n.supportingConditions,...n.tensionConditions];
    if(!secondary)main.push(...secondaryBlocks);
    const maximum=REPORT_PAGE_FAMILIES[target.pageFamily].budget[locale==='en'?'en':'zh']?.[1]||500;
    // Preserve registered page families; too much text returns the whole
    // section to T2 rather than silently deleting claims or conditions.
    const listRange=REPORT_PAGE_FAMILIES.INSIGHT_LIST_PAGE.budget[locale==='en'?'enItem':'zhItem'];
    const listFits=secondary?.pageFamily!=='INSIGHT_LIST_PAGE'||(secondaryBlocks.length<=6&&secondaryBlocks.every(b=>textUnits(b.text,locale)<=listRange[1]));
    if(listFits&&(pack.claimIrVersion||main.reduce((sum,b)=>sum+textUnits(b.text,locale),0)<=maximum)){
     target.contentBlocks=main.map(b=>block(b.text,section.key,'VERIFIED_SECTION_COMPOSITION'));
     target.items=[];
     if(secondary?.pageFamily==='INSIGHT_LIST_PAGE')secondary.items=secondaryBlocks.map(b=>block(b.text,section.key,'VERIFIED_SECTION_COMPOSITION'));
     else if(secondary)secondary.contentBlocks=secondaryBlocks.map(b=>block(b.text,section.key,'VERIFIED_SECTION_COMPOSITION'));
     for(const pb of pageBlocks){if(!pb.primaryVisualRef)pb.boundary='';pb.observations=[];}
     pageBlocks.at(-1).observations=[...n.observationPrompt,...n.counterSignals,...n.realityCheck].map(b=>b.text);
     pageBlocks.at(-1).boundary=n.boundaryNote.text;
    }else t3={...t3,status:'FALLBACK',internalOnly:{...t3.internalOnly,fallbackState:'T3_FALLBACK_USED',fallbackReason:'COMPOSITION_BUDGET_REJECTED'}};
   }
  }
  internalSections.push({sectionKey:section.key,interpretation,composition:composed.internalOnly,sectionComposition:sectionObject,...(t3?{t3}:{} )});
  const publicationTitle=composition.t3&&section.key==='S07_HEALTH'?{en:'Wellbeing & Daily Rhythm','zh-Hans':'身心状态与日常节奏'}:section.title;
  const base={sectionKey:section.key,section:section.key,sectionNumber:section.number,sectionTitle:publicationTitle,visualBinding:bindSectionVisual(section.key),facts:[],paragraphs:[],boundary:'',observations:[],customerVisible:true};
  const admittedT3=t3?.status==='PASS'&&canShowT3({...composition.t3,snapshot:t3?.snapshot});
  internalSections.at(-1).diagnostics={sectionRuntimeTier:admittedT3?'T3':t3?'T2_FALLBACK':'DETERMINISTIC',snapshotMatch:t3?.snapshot?'VALIDATED':composition.t3?.snapshots?.[section.key]?'INVALID':'ABSENT',fallbackReason:admittedT3?null:t3?.internalOnly?.fallbackReason||(t3?.snapshot?'SNAPSHOT_NOT_HUMAN_ACCEPTED_FOR_STAGE':null),claimIrVersion:t3?.evidencePack?.claimIrVersion||t3?.evidencePack?.explanatoryAuthorityVersion||null,editorialVersion:t3?.snapshot?.editorialVersion||null};
  pages.push({...base,pageKey:section.pages[0].key,definitionKey:section.pages[0].key,pageFamily:'SECTION_OPENER_PAGE',title:publicationTitle[locale],paragraphs:[noTarget&&section.key==='S08_TIMING'?pick('The calculated sequence remains available. Without a selected observation time, current-period and annual selections remain unavailable.','已计算的周期序列仍然可用；没有选定观察时点时，当前阶段与流年选择保持不可用。'):editorial.intro[locale]],visualVariant:'SECTION_OPENER'});
  for(const pb of pageBlocks){
   const budget=REPORT_PAGE_FAMILIES[pb.pageFamily].budget,maxUnits=budget[locale==='en'?'en':'zh']?.[1]||500;
   let chunks;
   try{
    chunks=splitSemanticBlocks(pb.contentBlocks,{locale,maxUnits,minUnits:budget[locale==='en'?'en':'zh']?.[0]||0});
   }catch(error){
    const units=pb.contentBlocks.map(b=>textUnits(b.text,locale));
    const e=new Error(`${error?.message||'SECTION_BLOCK_PARTITION_FAILED'}:${locale}:${pb.definitionKey}:${pb.pageFamily}:units=${units.join(',')}:min=${budget[locale==='en'?'en':'zh']?.[0]||0}:max=${maxUnits}`);
    e.cause=error;throw e;
   }
   if(!chunks.length)chunks.push([]);
   for(const [i,chunk] of chunks.entries())pages.push({...base,pageKey:pb.definitionKey+(pb.visualContinuation||'')+(i?`_CONT_${i+1}`:''),definitionKey:pb.definitionKey,pageFamily:pb.pageFamily,title:pb.title+(i||pb.visualContinuation?pick(' · continued',' · 续'):''),paragraphs:chunk.map(b=>b.text),facts:i?[]:pb.facts,sourcePages:i?[]:pb.sourcePages,primaryVisualRef:pb.primaryVisualRef||null,primaryVisualHtml:i?null:pb.primaryVisualHtml||null,items:i?[]:pb.items.map(b=>b.text),temporal:pb.temporal,observations:i?[]:pb.observations,boundary:i===chunks.length-1?pb.boundary:'',visualVariant:'BODY',contentBudget:{units:chunk.reduce((sum,b)=>sum+textUnits(b.text,locale),0),maximum:maxUnits}});
  }
  sections.push({key:section.key,title:section.title});
 }
 const sectionSequence=new Map();
 pages.forEach((p,i)=>{p.pageNumber=i+7;p.sequenceWithinSection=(sectionSequence.get(p.sectionKey)||0)+1;sectionSequence.set(p.sectionKey,p.sequenceWithinSection);p.isSectionOpener=p.pageFamily==='SECTION_OPENER_PAGE';p.contentDensity=p.isSectionOpener?'LOW':p.pageFamily==='NARRATIVE_ANALYSIS_PAGE'?'NARRATIVE':'STRUCTURED';p.compositionBudget=REPORT_PAGE_FAMILIES[p.pageFamily].budget;});
 const crossSection=composition.t3?crossSectionEditorialCheck(internalSections.filter(s=>s.t3?.status==='PASS').map(s=>s.t3.snapshot)):null;
 if(crossSection?.status==='REJECT'&&internalSections.some(s=>canShowT3({...composition.t3,snapshot:s.t3?.snapshot}))){
  const safe=await projectBaziSectionPublication({reading,locale,temporalContext,unavailableModules,composition:{}});
  return {...safe,internalSections:internalSections.map(s=>({...s,diagnostics:{...s.diagnostics,sectionRuntimeTier:s.t3?'T2_FALLBACK':'DETERMINISTIC',fallbackReason:s.t3?'CROSS_SECTION_REPETITION':null}})),crossSection,t3Fallback:'CROSS_SECTION_REPETITION'};
 }
 return {pages,sections,internalSections,legacy,...(crossSection?{crossSection}:{})};
}
