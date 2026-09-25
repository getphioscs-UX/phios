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
  ),[byId(':DOMAIN_EXPLANATION'),byId(':DIMENSIONS'),byId(':SECONDARY')]);

  makeFacet('personalityLearning',pick(
   'Learning and processing are read through the chart’s support-and-absorption function and the conditions around it. This layer asks how information is taken in, supported and made usable before expression is expected.',
   '学习与处理方式主要从命盘中的支持与吸收功能，以及包围它的条件来阅读。这一层关注信息如何被接收、获得支持并变成可用能力，再进入表达与输出。'
  ),[byId(':PRIMARY'),byId(':SUPPORT')]);

  makeFacet('personalityExpression',pick(
   'Expression is separate from learning. A capability may exist internally yet need different conditions to become repeatable visible output. Recorded links between self-position and expression refine this reading.',
   '表达需要与学习分开阅读。一项能力可以已经存在于内部，但要变成可见输出、反复使用并持续承担，可能需要不同条件。命盘中自我位置与表达之间的已记录联结，会进一步修正这一层。'
  ),[...linkPairs]);

  makeFacet('personalityFriction',pick(
   'Friction is not treated as a flaw. It is the part of the structure where support, expression, standards or external demand do not automatically move in the same direction. Repeated tension across chart positions shows where capability may need more deliberate coordination.',
   '张力不等于缺点。它指支持、表达、标准与外部要求并不自动同向运作。若张力在多个柱位反复出现，就更需要主动协调这些功能。'
  ),[...tensionPairs,byId(':TENSION'),...claims.filter(x=>x.id.includes(':WHOLE_')&&/pressure|责任|规则/i.test(x.text))]);

  makeFacet('personalityReliability',pick(
   'Reliability asks a different question from talent: can the capability remain usable when expression, responsibility and demand continue over time? Carrying conditions and unresolved strength judgments therefore belong here, without being converted into a fixed strong-or-weak identity.',
   '稳定性问的不是“有没有能力”，而是当表达、责任与要求持续存在时，这项能力是否仍然可用。承载条件与未定的强弱判断需要一起阅读，但不能变成固定身份。'
  ),[byId(':OPERATING_CONDITION'),byId(':OPEN_STRENGTH')]);
 }
 // Domain-specific deterministic facets keep the publication readable without
 // creating new method meaning. Each facet selects licensed claims from the
 // same section authority and changes only editorial grouping.
 const makeDomainFacets=async(section,code,facets)=>{
  const authority=await buildBaZiNarrativeClaimIR({reading,sectionKey:section,locale,temporalSnapshot:temporalContext});
  const claims=authority.claims.filter(x=>x.relationType!=='BOUNDARY');
  const boundary=authority.claims.find(x=>x.relationType==='BOUNDARY')?.text||'';
  const select=types=>{
   const pool=claims.filter(x=>types.includes(x.relationType));
   const limited=[];
   for(const type of types){
    let rows=pool.filter(x=>x.relationType===type);
    if(type==='CONTEXT_MODIFIER')rows=rows.slice(0,1);
    if(type==='CROSS_SECTION_RELEVANCE')rows=rows.slice().sort((a,b)=>(a.wholeChartRank??a.rank??99)-(b.wholeChartRank??b.rank??99)).slice(0,2);
    if(type==='ASSOCIATION')rows=rows.slice(0,1);
    limited.push(...rows);
   }
   return limited;
  };
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
  ),types:['OPERATING_CONDITION','OPEN_CONDITION']}
 ]);

 await makeDomainFacets('S04_CAREER','CAREER',[
  {key:'careerRoleSystem',lead:pick(
   'Career begins with role structure: what you are expected to carry, what you are expected to produce, and how resources and learning support enter the role. The chart is most useful here when these functions are read as one working system.',
   '事业首先要看角色结构：需要承担什么、需要产出什么，以及资源与学习支持怎样进入这个角色。把这些功能当作一套工作系统一起阅读，命盘才真正具有现实解释力。'
  ),types:['EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS','ASSOCIATION']},
  {key:'careerWorkingConditions',lead:pick(
   'A role can look suitable on paper and still become difficult when authority, standards, support or workload are mismatched. This page focuses on the conditions that make the same capability easier or harder to carry in practice.',
   '一个角色看起来合适，仍可能因为权限、标准、支持或工作量不匹配而变得困难。本页关注什么条件让同一套能力更容易或更难持续运作。'
  ),types:['SUPPORT_CONDITION','TENSION','OPERATING_CONDITION']},
  {key:'careerDirection',lead:pick(
   'Career direction is read from repeated themes across the chart rather than from a single profession label. Cross-chart priorities and unresolved conditions help separate a durable work pattern from a temporary or incomplete signal.',
   '事业方向应从整盘反复出现的主题中读取，而不是从一个职业标签直接推出。跨结构重点与未定条件，可以帮助区分长期工作模式与暂时或尚未完成的讯号。'
  ),types:['OPEN_CONDITION','CONTRAST']}
 ]);

 await makeDomainFacets('S05_WEALTH','WEALTH',[
  {key:'wealthResourceFlow',lead:pick(
   'Wealth is first read as resource flow: how value is produced, exchanged and brought into the system. This page focuses on the functions that make resources visible before asking what happens to them afterward.',
   '财富首先从资源流动来读：价值怎样被创造、交换并进入系统。本页先看什么功能让资源出现，再进入资源之后如何被处理的问题。'
  ),types:['EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS','ASSOCIATION']},
  {key:'wealthRetentionPressure',lead:pick(
   'Receiving resources and keeping them are different structural questions. Support, competing demands, responsibility and exchange pressure determine whether resources can be retained, redirected or repeatedly consumed.',
   '得到资源与保留资源，是两个不同的结构问题。支持条件、竞争性要求、责任与交换压力，会共同影响资源能否被保留、重新调动，或持续被消耗。'
  ),types:['SUPPORT_CONDITION','TENSION','OPERATING_CONDITION']},
  {key:'wealthRealityBoundary',lead:pick(
   'The final wealth layer separates symbolic resource structure from real financial outcomes. Open conditions preserve the boundary between what the method can describe and what must still be established through actual financial evidence.',
   '最后一层财富读取，要把象征性的资源结构与真实财务结果分开。未定条件会保留方法能够描述的范围，以及仍必须由真实财务证据确认的部分。'
  ),types:['OPEN_CONDITION','CONTRAST']}
 ]);

 await makeDomainFacets('S06_RELATIONSHIP','RELATIONSHIPS',[
  {key:'relationshipPosition',lead:pick(
   'Relationship reading begins with your recurring position inside important bonds: what you expect, what you exchange, what you carry and what kind of support enters the relationship. It describes your side of the interaction without turning the other person into a chart symbol.',
   '关系读取先从你在重要关系中反复出现的位置开始：期待什么、交换什么、承担什么，以及什么样的支持会进入关系。它描述的是你的互动位置，而不会把对方压缩成命盘符号。'
  ),types:['EMPHASIS','LIFE_DOMAIN_EXPLANATION','CO_OCCURRING_DIMENSIONS','ASSOCIATION']},
  {key:'relationshipInteraction',lead:pick(
   'The next layer is interaction. Recorded links and tensions between chart positions show where expectations, support, responsibility and self-expression may need active negotiation instead of moving automatically in the same direction.',
   '下一层是互动。柱位之间已记录的联结与张力，会显示期待、支持、责任与自我表达在哪里需要主动协商，而不是自然地朝同一方向运行。'
  ),types:['TENSION','OPERATING_CONDITION']},
  {key:'relationshipBoundaries',lead:pick(
   'Relationship guidance becomes more reliable when recurring interaction structure is separated from fixed outcome claims. Open conditions keep marriage, separation and partner outcomes outside unsupported certainty.',
   '关系建议只有在反复出现的互动结构与固定结果被分开后才更可靠。未定条件会避免把婚姻、分离或伴侣结果写成没有依据的确定结论。'
  ),types:['OPEN_CONDITION','CONTRAST']}
 ]);
 {
  const authority=await buildBaZiNarrativeClaimIR({reading,sectionKey:'S07_HEALTH',locale,temporalSnapshot:temporalContext});
  const claims=authority.claims.filter(x=>x.relationType!=='BOUNDARY');
  const first=type=>claims.find(x=>x.relationType===type);
  const selected=[
   first('LIFE_DOMAIN_EXPLANATION'),
   first('TENSION'),
   first('OPERATING_CONDITION')
  ].filter(Boolean);
  modules.healthNarrative={blocks:[
   block(e('S07_HEALTH').bridge[locale],`${edRef}#S07_HEALTH`,'EDITORIAL_GUIDANCE'),
   ...selected.map(x=>block(humanizePublicationStatement(x.text),(x.sourceRefs||[]).join('|'),'METHOD_INTERPRETATION'))
  ],boundary:authority.claims.find(x=>x.relationType==='BOUNDARY')?.text||''};
 }

 // R11 content-quality successor: customer prose is section-specific and
 // deterministic. It consumes existing governed BaZi facts and Reality Bridge
 // prompts; it does not create calculations, event claims or observed reality.
 const R11_TEN_GOD={
  BI_JIAN:pick('Peer','比肩'),JIE_CAI:pick('Rob Wealth','劫财'),SHI_SHEN:pick('Eating God','食神'),SHANG_GUAN:pick('Hurting Officer','伤官'),
  PIAN_CAI:pick('Indirect Wealth','偏财'),ZHENG_CAI:pick('Direct Wealth','正财'),QI_SHA:pick('Seven Killings','七杀'),ZHENG_GUAN:pick('Direct Officer','正官'),
  PIAN_YIN:pick('Indirect Resource','偏印'),ZHENG_YIN:pick('Direct Resource','正印')
 };
 const R11_GROUP={PEER:pick('peer / self-position','同类／自我位置'),OUTPUT:pick('output / expression','输出／表达'),WEALTH:pick('wealth / exchange','财星／资源交换'),OFFICER:pick('rules / responsibility / pressure','官杀／规则责任压力'),RESOURCE:pick('learning / support / absorption','印星／学习支持吸收')};
 const R11_RELATION_THEME={
  ENVIRONMENT_SELF_INTERFACE:pick('the environment–self interface','环境与自我位置'),
  SELF_EXPRESSION_INTERFACE:pick('the self–expression interface','自我位置与表达'),
  ENVIRONMENT_EXPRESSION_INTERFACE:pick('the environment–expression interface','环境与表达')
 };
 const R11_RELATION_TYPE={
  STEM_COMBINATION:pick('stem combination','天干合'),
  BRANCH_HARM:pick('branch harm','地支害'),
  BRANCH_SELF_PUNISHMENT:pick('branch self-punishment','地支自刑'),
  BRANCH_REPEAT:pick('branch repetition','地支重复')
 };
 const R11_PATTERN_STATE={
  OPEN_REQUIRES_MORE_FORMATION_SUPPORT:pick('open because additional formation support is still required','仍开放，因为成立条件仍不足'),
  OPEN_WITH_PARTIAL_FORMATION_SUPPORT:pick('open with partial formation support','已有部分成立条件，但仍保持开放'),
  ESTABLISHED:pick('established','已成立')
 };
 const R11_CARRY={
  MIXED_CARRY:pick('mixed carrying conditions','支持、外泄与压力并见'),
  SUPPORT_HEAVY:pick('support-led carrying conditions','支持条件较突出'),
  DRAIN_HEAVY:pick('outward-demand-led carrying conditions','向外投入较突出'),
  PRESSURE_HEAVY:pick('pressure-led carrying conditions','压力条件较突出')
 };
 const r11Topic=code=>reading.professionalModules.professionalTopics.topics.find(t=>t.topicCode===code);
 const r11TopicIndex=code=>reading.professionalModules.professionalTopics.topics.findIndex(t=>t.topicCode===code);
 const r11Prompts=code=>{
  const row=(reading.professionalModules.realityBridge?.topicPrompts||[]).find(x=>x.topicCode===code);
  return (row?.prompts||[]).map(x=>x.prompt?.[lang]).filter(Boolean).slice(0,2);
 };
 const r11Ref=code=>{
  const index=r11TopicIndex(code);
  return index>=0?`professionalModules/professionalTopics/topics/${index}`:'professionalModules/wholeChartPriority/themes';
 };
 const r11Repeated=topic=>(topic?.relevantTenGods||[]).filter(x=>x.repeatState==='REPEATED').sort((a,b)=>b.count-a.count);
 const r11TenGodDetail=code=>reading.professionalModules.tenGods?.items?.find(x=>x.tenGodCode===code)||null;
 const r11TenGodStructure=code=>{
  const x=r11TenGodDetail(code);if(!x)return '';
  return pick(
   `${R11_TEN_GOD[code]||code} appears ${x.count} time${x.count===1?'':'s'} in the governed inventory (${x.visibleCount} visible, ${x.hiddenCount} hidden), with ${x.repeatState==='REPEATED'?'repetition across the chart':'a limited occurrence'}.`,
   `${R11_TEN_GOD[code]||code}在已核准清单中出现 ${x.count} 次（透干 ${x.visibleCount}、藏干 ${x.hiddenCount}），${x.repeatState==='REPEATED'?'并在命盘中重复出现':'属于较有限的出现'}。`
  );
 };
 const r11Pattern=topic=>(topic?.patternCandidates||[]);
 const r11Relations=topic=>(topic?.relationshipInterfaces||[]);
 const r11Module=(key,code,paragraphs,{boundary='',observations=r11Prompts(code),extraRefs=[]}={})=>{
  const ref=r11Ref(code);
  modules[key]={
   blocks:paragraphs.filter(Boolean).map((text,i)=>block(text,extraRefs[i]||ref,i===0?'EDITORIAL_GUIDANCE':'METHOD_INTERPRETATION')),
   observations,
   boundary
  };
 };

 {
  const t=r11Topic('CAPABILITY'),repeated=r11Repeated(t),rels=r11Relations(t),carry=t?.carryingContext||{};
  const repeatedNames=repeated.slice(0,3).map(x=>R11_TEN_GOD[x.tenGodCode]).filter(Boolean);
  const tensionCount=rels.filter(x=>['TENSION','REPEAT_TENSION'].includes(x.relationFamily)).length;
  r11Module('personalityCoreStyle','CAPABILITY',[
   pick(
    `This capability reading is anchored in ${R11_GROUP[t.leadGroup.groupCode]}. The recurring Ten-God pattern includes ${repeatedNames.join(', ')||'several repeated functions'}, so learning and support are not read in isolation from responsibility, pressure and self-position.`,
    `这张命盘的能力读取以「${R11_GROUP[t.leadGroup.groupCode]}」为入口；反复出现的十神包括${repeatedNames.join('、')||'多个重复功能'}。因此，学习与支持不能和责任、压力、自我位置分开阅读。`
   ),
   r11TenGodStructure('QI_SHA'),
   r11TenGodStructure('ZHENG_YIN'),
   pick(
    'These two structures do different work in the reading. Resource/support describes how material, guidance or prior knowledge can be taken in; the Officer/pressure side describes standards, obligations and demands that must also be carried. Their coexistence is more informative than calling either one a personality trait.',
    '这两组结构在读取中承担不同作用：印星／支持说明资料、指导或既有知识怎样进入系统；官杀／压力则描述标准、责任与需要承载的要求。两者同时存在，比把其中任何一项写成固定性格标签更有解释力。'
   ),
   pick(
    `The chart also records ${tensionCount} tension interface${tensionCount===1?'':'s'} involving environment, self-position or expression. That makes context important: the same capability can be easier to access in one setting and harder to carry in another. Compare situations with different standards, support and freedom of expression to see which condition actually changes the result.`,
    `命盘同时记录了 ${tensionCount} 组涉及环境、自我位置或表达的张力关系。因此，情境差异很重要：同一项能力在不同环境中可能更容易调用或更难承载。可以比较标准、支持与表达空间不同的情境，看真正改变结果的是哪一个条件。`
   )
  ],{boundary:'',observations:r11Prompts('CAPABILITY')});

  const supportPhrase=carry.supportVisible===0?pick('visible support is not prominent','可见支持并不突出'):pick('visible support is present','可见支持存在');
  const loadPhrase=(carry.outwardVisible>0&&carry.pressureVisible>0)?pick('outward demand and pressure are both present','向外投入与压力同时存在'):pick('support and demand need to be read together','支持与要求需要一起阅读');
  r11Module('personalityDevelopment','CAPABILITY',[
   pick(
    `Capability development is not one step. In this chart, ${supportPhrase}, while ${loadPhrase}. The useful distinction is between taking information in, turning it into usable output, and sustaining that output when demands continue.`,
    `能力发展不是单一步骤。这张命盘里，${supportPhrase}，同时${loadPhrase}。真正要分开的，是信息吸收、形成可用输出，以及在要求持续存在时还能不能稳定使用。`
   ),
   pick(
    'This is why “can learn,” “can express,” and “can keep carrying the same responsibility” should not be treated as the same question. Compare them separately in real situations rather than using one success or failure to define the whole capability pattern.',
    '因此，“能学会”“能表达”“能持续承担同一项责任”不应被当成同一个问题。回到真实情境时，把这三件事分开观察，不要用一次成功或失败定义整套能力结构。'
   )
  ],{boundary:''});

  const tensionRelations=rels.filter(x=>['TENSION','REPEAT_TENSION'].includes(x.relationFamily));
  r11Module('personalityFriction','CAPABILITY',[
   pick(
    `The friction in this chart is concentrated around ${tensionRelations.map(x=>R11_RELATION_THEME[x.positionThemeCode]).filter(Boolean).join(', ')||pick('recorded position interfaces','已记录的柱位关系')}. The practical issue is not whether friction is “good” or “bad,” but which part changes first when support, standards and expression pull in different directions.`,
    `这张命盘的张力主要集中在${tensionRelations.map(x=>R11_RELATION_THEME[x.positionThemeCode]).filter(Boolean).join('、')||'已记录的柱位关系'}。真正值得观察的不是张力“好不好”，而是当支持、标准与表达不同步时，哪一部分最先发生变化。`
   ),
   pick(
    `The recorded tension set is not one repeated copy: ${tensionRelations.map(x=>`${R11_RELATION_THEME[x.positionThemeCode]||pick('a position interface','一组柱位关系')} carries ${R11_RELATION_TYPE[x.type]||pick('a recorded relation','已记录关系')}`).join('; ')}. These relations occupy different positions, so they should not be collapsed into one generic statement about stress or personality.`,
    `这几组张力并不是同一句话的重复：${tensionRelations.map(x=>`${R11_RELATION_THEME[x.positionThemeCode]||'一组柱位关系'}呈现${R11_RELATION_TYPE[x.type]||'已记录关系'}`).join('；')}。它们发生在不同位置，因此不应被压成一句笼统的“压力大”或固定性格判断。`
   ),
   pick(
    'A useful comparison is to separate environmental pressure from self-imposed pressure, and both from the cost of expression. If one changes while the others stay the same, that difference is more informative than repeating a general personality label.',
    '可以把环境压力、自我要求与表达成本分开比较：如果其中一项改变，而另外两项没有改变，这种差异比重复一个笼统性格标签更有解释价值。'
   ),
   pick(
    'When the same tension appears across more than one position, look for what is actually repeated in life: the standard being imposed, the resource available, the freedom to respond, or the amount of sustained effort required. A clear counterexample is useful because it shows which condition may be carrying the most weight.',
    '当类似张力出现在不止一个位置时，可以观察现实中真正重复的是什么：外部标准、可用资源、回应空间，还是持续投入的成本。一个清楚的反例同样重要，因为它能显示究竟哪一个条件在现实里承担了更大的作用。'
   )
  ],{boundary:'',observations:r11Prompts('CAPABILITY')});
 }

 {
  const t=r11Topic('LIFE_OPERATION'),repeated=r11Repeated(t),patterns=r11Pattern(t),rels=r11Relations(t);
  const qisha=patterns.find(x=>x.tenGodCode==='QI_SHA'),cai=patterns.find(x=>x.tenGodCode==='PIAN_CAI');
  r11Module('lifeStructureSystem','LIFE_OPERATION',[
   pick(
    `The whole-chart structure is not just a ranking of functions. ${repeated.slice(0,3).map(x=>R11_TEN_GOD[x.tenGodCode]).join(', ')} repeat across the chart, while the recorded pillar relations connect environment, self-position and expression. Those layers need to be read together before any pattern label is allowed to dominate the interpretation.`,
    `整盘结构不是把功能从高到低排一次名。命盘里${repeated.slice(0,3).map(x=>R11_TEN_GOD[x.tenGodCode]).join('、')}反复出现，同时柱位关系把环境、自我位置与表达连在一起；在任何格局名称成为主结论之前，这些层次必须先放回同一张图中。`
   ),
   pick(
    `The Seven-Killings candidate ${qisha?.visibleStemMatch?'has a visible-stem match':'has no visible-stem match'} and remains ${R11_PATTERN_STATE[qisha?.conclusionState]||pick('open','保持开放')}; the Indirect-Wealth candidate ${cai?.visibleStemMatch?'has a visible-stem match':'has no visible-stem match'} with ${cai?.visiblePathCount??0} recorded path${cai?.visiblePathCount===1?'':'s'}. The important point is the contrast between a visible route and a completed formation judgment.`,
    `七杀候选${qisha?.visibleStemMatch?'有透干对应':'未见透干对应'}，但状态仍是「${R11_PATTERN_STATE[qisha?.conclusionState]||'保持开放'}」；偏财候选${cai?.visibleStemMatch?'有透干对应':'未见透干对应'}，并记录到 ${cai?.visiblePathCount??0} 条路径。真正重要的是把“路径可见”与“格局已经成立”分开。`
   ),
   pick(
    `There are ${rels.length} recorded relationship interfaces in the natal structure. Their value is not that they predict events, but that they show where otherwise separate functions meet and therefore where a later career, wealth or relationship reading must return to the same underlying structure.`,
    `本命结构里记录了 ${rels.length} 组柱位关系。它们的价值不是预测事件，而是说明原本分开的功能在哪里相遇，也解释了为什么后面的事业、财富与关系章节会不断回到同一套底层结构。`
   )
  ],{boundary:pick('Pattern candidates remain conditional; no final strong/weak or primary-pattern verdict is created here.','格局候选继续保持条件性；这里不建立最终旺弱或主格局定论。')});
 }

 {
  const t=r11Topic('CAREER'),repeated=r11Repeated(t),carry=t.carryingContext||{};
  r11Module('careerRoleSystem','CAREER',[
   pick(
    `Career is anchored in ${R11_GROUP[t.leadGroup.groupCode]}, with ${repeated.slice(0,3).map(x=>R11_TEN_GOD[x.tenGodCode]).join(', ')} repeating in the relevant evidence. Learning/support and wealth/exchange remain secondary but active, so the work reading is about how standards, responsibility, resources and learning are combined inside a role—not about naming one ideal occupation.`,
    `事业主题以「${R11_GROUP[t.leadGroup.groupCode]}」为主轴，相关证据里反复出现的十神包括${repeated.slice(0,3).map(x=>R11_TEN_GOD[x.tenGodCode]).join('、')}。学习支持与资源交换仍然参与，因此这里要读的是标准、责任、资源与学习怎样被组织进一个角色，而不是指定一个“最佳职业”。`
   ),
   pick(
    `The carrying context is ${R11_CARRY[carry.overallTendency]||pick('mixed carrying conditions','混合承载条件')}. That makes role design more important than job title: compare responsibility with decision authority, workload with available support, and output expectations with the time or resources actually available to meet them.`,
    `承载状态为「${R11_CARRY[carry.overallTendency]||'混合承载条件'}」。因此，角色设计比职位名称更值得看：把责任与决策权、工作量与可用支持、产出要求与实际可用时间／资源分别对照。`
   )
  ],{boundary:'',observations:r11Prompts('CAREER')});
  r11Module('careerWorkingDirection','CAREER',[
   pick(
    'The long-term career question is not “which profession fits?” but “which role conditions keep repeating when work is sustainable?” Look for recurring combinations of accountability, autonomy, learning support, resource access and delivery pressure across different jobs.',
    '长期事业问题不是“哪个职业最适合”，而是“哪些角色条件在工作可持续时反复出现”。可以跨不同工作比较：责任、自主权、学习支持、资源取得与交付压力，哪些组合最常出现。'
   ),
   pick(
    'If a role looks attractive but becomes difficult only after sustained delivery begins, treat that difference as evidence about carrying cost—not as proof that the occupation itself is wrong for you.',
    '如果某个角色一开始看起来合适，却在持续交付后才变得困难，更值得把这个差异当作“承载成本”的线索，而不是直接认定这个职业本身不适合你。'
   )
  ],{boundary:'',observations:r11Prompts('CAREER')});
 }

 {
  const t=r11Topic('WEALTH'),repeated=r11Repeated(t),wealthGods=(t.relevantTenGods||[]).filter(x=>x.functionGroup==='WEALTH');
  r11Module('wealthResourceFlow','WEALTH',[
   pick(
    `The wealth reading is anchored in ${R11_GROUP[t.leadGroup.groupCode]}. Within that group, ${wealthGods.map(x=>`${R11_TEN_GOD[x.tenGodCode]} (${x.repeatState.toLowerCase().replace('_',' ')})`).join(' and ')} are not distributed in the same way, so “resource opportunity” should not be treated as one single channel.`,
    `财富主题以「${R11_GROUP[t.leadGroup.groupCode]}」为主轴；其中${wealthGods.map(x=>`${R11_TEN_GOD[x.tenGodCode]}（${x.repeatState==='REPEATED'?'重复出现':'单次出现'}）`).join('、')}的分布并不相同，因此“资源机会”不能被当成单一渠道。`
   ),
   pick(
    `Rules / responsibility / pressure also remain active in this topic. The more useful reading is therefore the full resource cycle: what enters, what must be exchanged for it, what obligations attach to it, and what is still left available for retention or redeployment.`,
    `「${R11_GROUP.OFFICER}」也同时参与财富主题。更有价值的读取因此是完整资源循环：资源怎样进入、需要交换什么、附带哪些责任，以及最后还有多少可以留存或重新配置。`
   )
  ],{boundary:pick('Symbolic wealth structure is not an income forecast or financial advice.','象征性的财富结构不是收入预测，也不是财务建议。'),observations:r11Prompts('WEALTH')});
  r11Module('wealthRetentionReality','WEALTH',[
   pick(
    'Separate acquisition from retention. A resource pattern can be visible while the real outcome is dominated by market conditions, family obligations, timing or personal choice. Those external factors are not “noise”; they are part of the reality check.',
    '把“得到资源”与“留下资源”分开。命盘里可以看见资源结构，但真实结果仍可能主要由市场、家庭责任、时间条件或个人选择决定；这些现实因素不是杂讯，而是必须纳入的对照证据。'
   ),
   pick(
    'For practical use, compare two periods with similar income but different retention results. The difference between them often gives a clearer test of the resource structure than asking whether one wealth symbol is present.',
    '实际使用时，可以比较两个收入相近、但留存结果不同的时期。两者之间的差异，往往比单问“有没有财星”更能检验这套资源结构。'
   )
  ],{boundary:pick('Real financial decisions require actual cash-flow, obligation, risk and market evidence.','真实财务决定仍需要现金流、义务、风险与市场证据。'),observations:r11Prompts('WEALTH')});
 }

 {
  const t=r11Topic('RELATIONSHIPS'),rels=r11Relations(t);
  r11Module('relationshipPosition','RELATIONSHIPS',[
   pick(
    `This relationship reading is multi-factor: ${R11_GROUP[t.leadGroup.groupCode]} is foregrounded, while ${t.relevantGroups.filter(g=>g.groupCode!==t.leadGroup.groupCode).map(g=>R11_GROUP[g.groupCode]).join(', ')} remain active. That is why the report does not reduce partnership to a single spouse symbol.`,
    `这张命盘的关系读取是多因素的：「${R11_GROUP[t.leadGroup.groupCode]}」进入前景，同时${t.relevantGroups.filter(g=>g.groupCode!==t.leadGroup.groupCode).map(g=>R11_GROUP[g.groupCode]).join('、')}也都参与。因此，关系不能被压缩成一个单一“配偶星”。`
   ),
   pick(
    `The natal relationship interfaces include ${rels.filter(x=>x.relationFamily==='LINK').length} linkage and ${rels.filter(x=>['TENSION','REPEAT_TENSION'].includes(x.relationFamily)).length} tension relation${rels.filter(x=>['TENSION','REPEAT_TENSION'].includes(x.relationFamily)).length===1?'':'s'}. The useful question is where expectations, responsibility, exchange and self-expression require negotiation—not what another person is secretly thinking.`,
    `本命关系接口里有 ${rels.filter(x=>x.relationFamily==='LINK').length} 组联结，以及 ${rels.filter(x=>['TENSION','REPEAT_TENSION'].includes(x.relationFamily)).length} 组张力。真正值得观察的是：期待、责任、交换与自我表达在哪里需要协商，而不是猜测对方心里“真正怎么想”。`
   )
  ],{boundary:pick('The chart cannot guarantee marriage, separation or one fixed partner outcome.','命盘不能保证婚姻、分离或某一种固定伴侣结果。'),observations:r11Prompts('RELATIONSHIPS')});
  r11Module('relationshipInteractionBoundary','RELATIONSHIPS',[
   pick(
    'Relationship quality changes when the conditions of the interaction change. Compare the same issue across different people or different stages of one relationship: what changes when boundaries, expectations, time, support or resource pressure change?',
    '关系互动会随着条件变化。可以把同一个问题放到不同对象、或同一段关系的不同阶段比较：当边界、期待、时间、支持或资源压力改变时，互动怎样跟着变化？'
   ),
   pick(
    'A repeating pattern across several relationships is more informative than one intense episode. A clear counterexample is equally useful because it shows which condition may be doing more work than the chart alone can establish.',
    '跨多段关系反复出现的模式，比一次强烈事件更有解释价值；一个清楚的反例同样重要，因为它能显示哪些条件可能比命盘本身更关键。'
   )
  ],{boundary:pick('Relationship structure is a lens for interaction, not a verdict on another person or a guaranteed outcome.','关系结构用于观察互动，不是对另一个人的定论，也不是结果保证。'),observations:r11Prompts('RELATIONSHIPS')});
 }

 {
  const t=r11Topic('PRESSURE'),carry=t.carryingContext||{};
  r11Module('healthNarrative','PRESSURE',[
   pick(
    `For wellbeing, the chart is used only as a load-and-recovery lens. Here, ${carry.supportVisible===0?'visible support is limited':'visible support is present'} while outward demand and pressure are both recorded, so the useful comparison is between periods with different workload, routine and practical support.`,
    `在健康与身心部分，命盘只作为“负荷—恢复”的观察镜头。这张命盘里，${carry.supportVisible===0?'可见支持较少':'可见支持存在'}，同时向外投入与压力并见，因此更有意义的是比较不同工作量、作息与实际支持条件下的变化。`
   ),
   pick(
    'Do not use this section to name organs or diseases. Use it to notice whether recovery capacity changes when sleep, schedule, workload, environment or support changes, and take medical questions to medical evidence.',
    '不要用这一章判断器官或疾病。更适合观察的是：当睡眠、作息、工作量、环境或支持改变时，恢复能力有没有跟着变化；医学问题仍应回到医学证据。'
   )
  ],{boundary:pick('No medical diagnosis is created from BaZi structure.','八字结构不产生医学诊断。'),observations:r11Prompts('PRESSURE')});
 }

 {
  const timeline=reading.professionalModules.professionalTimeline,current=timeline.currentWindow,dy=current?.currentDaYun,annual=current?.annual;
  const dyInteraction=current?.interactions?.daYunToNatal?.[0],annualRelations=current?.interactions?.liuNianToNatal||[];
  modules.timingContext={
   blocks:[
    block(pick(
     `The selected Da Yun is ${dy?.pillar?.stem?.zh||''}${dy?.pillar?.branch?.zh||''} (${R11_TEN_GOD[dy?.stemTenGod?.code]||dy?.stemTenGod?.en||''}), while the annual layer is ${annual?.stem?.zh||''}${annual?.branch?.zh||''} (${R11_TEN_GOD[annual?.stemTenGod?.code]||annual?.stemTenGod?.en||''}). These layers add timing context to the natal chart; they do not replace it.`,
     `当前大运为${dy?.pillar?.stem?.zh||''}${dy?.pillar?.branch?.zh||''}（${R11_TEN_GOD[dy?.stemTenGod?.code]||dy?.stemTenGod?.zh||''}），流年为${annual?.stem?.zh||''}${annual?.branch?.zh||''}（${R11_TEN_GOD[annual?.stemTenGod?.code]||annual?.stemTenGod?.zh||''}）。这些时间层用于补充本命背景，不取代本命。`
    ),'professionalModules/professionalTimeline/currentWindow','METHOD_INTERPRETATION'),
    block(pick(
     `The Da Yun records ${dyInteraction?.type||'a natal interaction'} with the natal ${dyInteraction?.natalPosition||'structure'} and no transformation verdict. The annual layer records ${annualRelations.length} natal interaction${annualRelations.length===1?'':'s'}, including repeat, self-punishment or harm relations where present. Read these as points of structural emphasis, not event predictions.`,
     `大运与本命记录到${dyInteraction?.type||'一组关系'}，落在本命${dyInteraction?.natalPosition||'结构'}，且没有建立化气结论；流年层与本命记录到 ${annualRelations.length} 组互动，其中包括重复、自刑或害等已记录关系。它们表示结构重点，不等于事件预测。`
    ),'professionalModules/professionalTimeline/currentWindow/interactions','METHOD_INTERPRETATION')
   ],
   temporal:{...source(20).temporal,generatedAt:temporalContext.generatedAt,localTime:temporalContext.localTime},
   observations:[pick('Which natal theme is actually more visible in this period, and what real evidence would show that it is not?','这一阶段里，哪一个本命主题在现实中真的更明显？又有什么真实证据会反驳这个判断？')],
   boundary:pick('Timing relevance is not event certainty.','时间相关性不等于事件确定性。')
  };
  modules.currentYearInsight={
   blocks:[
    block(pick(
     `The annual layer ${annual?.stem?.zh||''}${annual?.branch?.zh||''} brings wealth/exchange and officer/pressure functions into the selected window. The natal month and hour both contain ${annual?.branch?.zh||'the annual branch'}, and the recorded annual relations therefore revisit already-existing natal positions rather than creating a new chart.`,
     `流年${annual?.stem?.zh||''}${annual?.branch?.zh||''}把财星／资源交换与官杀／规则压力带入当前观察窗口。本命月支与时支都出现${annual?.branch?.zh||'同一地支'}，因此流年关系是在重新触及既有本命位置，而不是生成一张新的命盘。`
    ),'professionalModules/professionalTimeline/currentWindow/annual','METHOD_INTERPRETATION'),
    block(pick(
     'The useful comparison is between the same life domain before and during this window. Repetition across natal, Da Yun and annual layers increases relevance, but a concrete event still requires independent evidence.',
     '最有价值的比较，是同一个生活主题在这个时间窗口之前与期间有什么不同。本命、大运与流年重复同一主题会提高相关性，但任何具体事件仍需要独立现实证据。'
    ),'professionalModules/professionalTimeline/currentWindow/topicTimeline','EDITORIAL_GUIDANCE')
   ],
   temporal:modules.timingContext.temporal,
   observations:[pick('What changed in the real situation when this period began, and what stayed unchanged despite the new timing layer?','这个时间窗口开始后，现实情境中什么真的改变了？又有什么即使时间层变化仍保持不变？')],
   boundary:pick('The year layer frames observation; it does not label specific events as opportunities or warnings.','流年层用于界定观察范围，不把具体事件直接标记为机会或预警。')
  };
 }

 {
  const priorities=reading.professionalModules.wholeChartPriority?.themes||[],top=priorities.slice().sort((a,b)=>a.rank-b.rank).slice(0,4);
  const topNames=top.map(x=>({
   RELATIONSHIP:pick('environment–self tension','环境—自我张力'),
   TEN_GOD_GROUP:pick('rules / responsibility / pressure','规则／责任／压力'),
   PATTERN:pick('Seven-Killings candidate remains open','七杀候选仍保持开放'),
   CARRYING:pick('mixed carrying conditions','混合承载条件'),
   TIMING:pick('current timing activation','当前时间激活')
  }[x.themeType]||x.themeKey));
  r11Module('guidanceIntegrated','GUIDANCE',[
   pick(
    `Four themes deserve to be held together rather than repeated separately: ${topNames.join('; ')}. Their value is in the way they intersect across sections, not in turning the highest-ranked theme into a fate statement.`,
    `有四条主线更适合被放在一起，而不是在不同章节反复说一遍：${topNames.join('；')}。它们真正有价值的地方，是看这些主线怎样跨章节交会，而不是把排名靠前的主题写成命运结论。`
   ),
   pick(
    'For navigation, choose one live situation and identify which of these themes is actually operating there. Then look for a counterexample. If the situation changes when one condition changes, that is more useful than treating the whole chart as a single fixed identity.',
    '实际导航时，先选一个正在发生的真实情境，判断这几条主线里哪一条真的在起作用；再主动找一个反例。如果某个条件一改变，情境就跟着改变，这种差异比把整张命盘理解成固定身份更有用。'
   )
  ],{boundary:'',observations:(reading.professionalModules.realityBridge?.priorityPrompts||[]).flatMap(x=>x.prompts||[]).map(x=>x.prompt?.[lang]).filter(Boolean).slice(0,2)});
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
  const ranked=claims.filter(x=>x.relationType==='CROSS_SECTION_RELEVANCE').slice().sort((a,b)=>(a.rank??99)-(b.rank??99)).slice(0,3);
  const temporal=claims.filter(x=>x.relationType==='TEMPORAL_RELEVANCE');
  const open=claims.filter(x=>x.relationType==='OPEN_CONDITION');
  const mk=(key,lead,list)=>{
   modules[key]={blocks:[
    block(lead,`${edRef}#S09_GUIDANCE`,'EDITORIAL_GUIDANCE'),
    ...list.map(x=>block(humanizePublicationStatement(x.text),(x.sourceRefs||[]).join('|'),'METHOD_INTERPRETATION'))
   ],boundary:authority.claims.find(x=>x.relationType==='BOUNDARY')?.text||''};
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
 paragraphs('boundaries',[
  e('S10_APPENDIX').bridge[locale],
  pick(
   'Use four evidence levels when reading the report: calculated chart facts, admitted method relationships, editorial explanation, and lived-reality evidence. A statement becomes stronger only when the kind of evidence supporting it is clear; agreement between layers should not erase their different roles or collapse them into one source of certainty.',
   '阅读本报告时，请区分四个证据层：计算得到的命盘事实、已核准的方法关系、编辑解释，以及真实生活证据。一个判断只有在清楚知道由哪一层证据支持时才更可靠；不同层之间即使相符，也不应因此失去各自的角色。'
  )
 ],`${edRef}#S10_APPENDIX`);
 modules.boundaries.blocks.push(...appendixConditions);
 paragraphs('methodology',[pick('BaZi organizes a birth reading around four pillars and uses the Day Master as a reference position. The diagrams in this report preserve the distinctions between visible stems, branches, hidden stems and element counts. Structural candidates are shown with their conditions, so an open pattern remains open rather than becoming a final verdict. The timing chapter adds only the layers resolved by the existing method engine for the saved observation window. These layers accompany the birth structure; they do not replace it. Read the prose as a bounded explanation of that structure, then compare it with independent experience.','八字围绕四柱组织出生读取，并以日主作为参照位置。本报告的图表区分天干、地支、藏干与五行计数；结构候选与成立条件一同呈现，因此仍开放的格局不会被写成最终判断。时间章节只加入既有方法引擎针对保存的观察窗口所解析的层次，它们与本命结构一起阅读，不取代本命。请把文字看作有范围的结构说明，再用独立经验来比较。')],`${edRef}#S10_APPENDIX`);
 // R10 publication compression: combine already-admitted deterministic
 // modules into denser customer pages. This is presentation ownership only;
 // no new BaZi meaning, calculation or provider prose is introduced here.
 const compactModule=(key,lead,parts,{maxBlocks=5,boundary=true}={})=>{
  const seen=new Set(),blocks=[];
  if(lead)blocks.push(block(lead,`${edRef}#R10_COMPRESSION`,'EDITORIAL_GUIDANCE'));
  for(const name of parts){
   for(const b of modules[name]?.blocks||[]){
    const text=String(b.text||'').trim();
    if(!text||seen.has(text))continue;
    seen.add(text);blocks.push(b);
    if(blocks.length>=maxBlocks)break;
   }
   if(blocks.length>=maxBlocks)break;
  }
  modules[key]={
   blocks,
   items:parts.flatMap(name=>modules[name]?.items||[]),
   boundary:boundary?[...new Set(parts.map(name=>modules[name]?.boundary).filter(Boolean))].join(' '):''
  };
 };
 compactModule('personalityDevelopment',pick(
  'Capability development is easier to understand as one sequence: how information is absorbed, how it becomes expression, and what conditions make that expression reliable over time.',
  '能力发展更适合放在同一条链上理解：信息怎样被吸收、怎样进入表达，以及什么条件让这种表达能够长期稳定。'
 ),['personalityLearning','personalityExpression','personalityReliability'],{maxBlocks:5});
 // Life Structure keeps one integrated narrative page instead of a separate
 // open-judgment page.
 compactModule('lifeStructureSystem',null,['lifeStructureSystem','lifeStructureConditions'],{maxBlocks:5});
 compactModule('careerWorkingDirection',pick(
  'Work conditions and long-term direction belong together: the same capability can function very differently depending on authority, support, workload and the role structure that repeats across time.',
  '工作条件与长期方向应该一起阅读：同一套能力会因为权限、支持、工作量与长期反复出现的角色结构，而呈现完全不同的运行结果。'
 ),['careerWorkingConditions','careerDirection'],{maxBlocks:5});
 compactModule('wealthRetentionReality',pick(
  'Resource retention and real financial outcomes should be read together. What enters the system, what competes for it, and what can actually be retained are different questions from a guaranteed financial result.',
  '资源留存与现实财务结果应该一起阅读。资源怎样进入、哪些要求会分流它、最终能留下多少，与“保证得到某种财务结果”是不同问题。'
 ),['wealthRetentionPressure','wealthRealityBoundary'],{maxBlocks:5});
 compactModule('relationshipInteractionBoundary',pick(
  'Interaction and outcome boundaries belong on the same page: the chart can describe recurring negotiation patterns, but it cannot turn those patterns into guaranteed marriage, separation or partner outcomes.',
  '互动模式与结果边界应该放在同一页：命盘可以描述反复出现的协商结构，但不能把这些结构直接写成确定的婚姻、分离或伴侣结果。'
 ),['relationshipInteraction','relationshipBoundaries'],{maxBlocks:5});
 compactModule('guidanceIntegrated',pick(
  'The final guidance layer combines repeated themes with the current timing context, while keeping temporary emphasis separate from the chart’s more stable structure.',
  '最后的建议层把跨章节重复主题与当前时间情境放在一起，同时把阶段性放大与较稳定的本命结构清楚分开。'
 ),['guidancePriorities','guidanceCurrentFocus'],{maxBlocks:5});
 modules.methodGuide={blocks:[
  block(pick(
   'Read the report through four evidence levels: calculated chart facts, admitted method relationships, editorial explanation and lived-reality evidence. Keep them distinct so every conclusion can be traced to the kind of evidence that actually supports it, and keep unresolved conditions visibly unresolved.',
   '阅读这份报告时，请区分四个证据层：计算得到的命盘事实、已核准的方法关系、编辑解释，以及真实生活证据。让它们保持各自边界，才能知道每个判断真正由什么支持；尚未成立的条件也必须继续保持开放。'
  ),`${edRef}#S10_APPENDIX`,'EDITORIAL_GUIDANCE'),
  block(pick(
   'BaZi organizes the reading around the Four Pillars with the Day Master as reference. Visible stems, branches, hidden stems, element counts, pattern candidates and resolved timing layers remain separate parts of the method. Timing accompanies the birth structure rather than replacing it, and the interpretation should always be compared with independent experience.',
   '八字围绕四柱组织读取，并以日主作为参照。天干、地支、藏干、五行计数、格局候选与已解析的时间层，都应保持为方法中的不同部分。时间层与本命结构一起阅读，不取代本命；所有解释最终仍应与独立的现实经验进行比较。'
  ),`${edRef}#S10_APPENDIX`,'METHOD_INTERPRETATION')
 ],items:[],boundary:''};

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
    const visualPageSize=def.primaryVisualRef==='BZR-VIS-TEN-GOD-DETAILS'?6:1;
    for(let offset=0;offset<count;offset+=visualPageSize){const visual=buildBaziPublicationVisual({reading,primaryVisualRef:def.primaryVisualRef,locale,topicCode:def.visualTopic,offset,limit:visualPageSize});
     pageBlocks.push({definitionKey:def.key,visualContinuation:offset?`_CONT_${offset/visualPageSize+1}`:'',pageFamily:def.family,title:def.title[locale],contentBlocks:def.primaryVisualRef==='BZR-VIS-FOUR-PILLARS'?modules.baziChart.blocks:[],items:[],sourcePages:[],facts:[],observations:[],boundary:visual.boundary,primaryVisualRef:visual.primaryVisualRef,primaryVisualHtml:visual.primaryVisualHtml});
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
  pages.push({...base,pageKey:section.pages[0].key,definitionKey:section.pages[0].key,pageFamily:'SECTION_OPENER_PAGE',title:publicationTitle[locale],paragraphs:[noTarget&&section.key==='S08_TIMING'?pick('The calculated sequence remains available. Without a selected observation time, current-period and annual selections remain unavailable.','已计算的周期序列仍然可用；没有选定观察时点时，当前阶段与流年选择保持不可用。'):editorial.intro[locale]],items:editorial.items.map(i=>i[locale]),visualVariant:'SECTION_MASTER_FALLBACK'});
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
