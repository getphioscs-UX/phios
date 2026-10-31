const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const bi=(en,zhHans)=>freeze({en:String(en||''),zhHans:String(zhHans||'')});
const normalise=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'').trim();

const GROUP=Object.freeze({
 PEER:bi('peer and self-position','同类与自我位置'),
 OUTPUT:bi('expression and output','表达与输出'),
 WEALTH:bi('resources and exchange','资源与交换'),
 OFFICER:bi('rules, responsibility and pressure','规则、责任与压力'),
 RESOURCE:bi('learning, support and absorption','学习、支持与吸收'),
 UNAVAILABLE:bi('an open functional theme','尚待核对的功能主题')
});
const TEN_GOD=Object.freeze({BI_JIAN:bi('Peer','比肩'),JIE_CAI:bi('Rob Wealth','劫财'),SHI_SHEN:bi('Eating God','食神'),SHANG_GUAN:bi('Hurting Officer','伤官'),PIAN_CAI:bi('Indirect Wealth','偏财'),ZHENG_CAI:bi('Direct Wealth','正财'),QI_SHA:bi('Seven Killings','七杀'),ZHENG_GUAN:bi('Direct Officer','正官'),PIAN_YIN:bi('Indirect Resource','偏印'),ZHENG_YIN:bi('Direct Resource','正印')});
const PATTERN=Object.freeze({ZHENG_GUAN:bi('Direct Officer pattern path','正官格路径'),QI_SHA:bi('Seven Killings pattern path','七杀格路径'),CAI:bi('Wealth pattern path','财格路径'),YIN:bi('Resource pattern path','印格路径'),SHI_SHEN:bi('Eating God pattern path','食神格路径'),SHANG_GUAN:bi('Hurting Officer pattern path','伤官格路径'),PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE:bi('Jian Lu / Yue Jie path','建禄／月劫路径')});
const TOPIC=Object.freeze({CAREER:bi('career and work','事业与工作'),WEALTH:bi('wealth and resources','财富与资源'),RELATIONSHIPS:bi('relationships','关系'),FAMILY:bi('family and background','家庭与背景'),CAPABILITY:bi('capability and expression','能力与表达'),PRESSURE:bi('pressure and responsibility','压力与责任'),LIFE_OPERATION:bi('life operation','生活运行')});
const POSITION_THEME=Object.freeze({OUTER_ENVIRONMENT_INTERFACE:bi('outer context ↔ environment','外部背景 ↔ 月令环境'),OUTER_SELF_INTERFACE:bi('outer context ↔ self anchor','外部背景 ↔ 自我锚点'),ENVIRONMENT_SELF_INTERFACE:bi('environment ↔ self anchor','月令环境 ↔ 自我锚点'),ENVIRONMENT_EXPRESSION_INTERFACE:bi('environment ↔ later expression','月令环境 ↔ 后续表达'),SELF_EXPRESSION_INTERFACE:bi('self anchor ↔ later expression','自我锚点 ↔ 后续表达'),MULTI_PILLAR_NETWORK:bi('multi-pillar network','多柱网络')});
const RELATION=Object.freeze({BRANCH_CLASH:bi('a direct branch clash','地支相冲'),BRANCH_SIX_COMBINATION:bi('a six-combination link','地支六合'),STEM_COMBINATION:bi('a stem combination','天干相合'),BRANCH_HARM:bi('a branch harm relation','地支相害'),BRANCH_BREAK:bi('a branch break relation','地支相破'),BRANCH_PUNISHMENT:bi('a branch punishment relation','地支相刑'),BRANCH_SELF_PUNISHMENT:bi('a self-punishment relation','地支自刑'),BRANCH_THREE_HARMONY:bi('a three-harmony relation','地支三合'),BRANCH_THREE_MEETING:bi('a three-meeting relation','地支三会')});
const CARRY=Object.freeze({SUPPORT_SIDE_VISIBLE:bi('support and carrying are more visible','承载与支持侧更明显'),OUTPUT_SIDE_VISIBLE:bi('output and consumption are more visible','外泄与耗力侧更明显'),PRESSURE_SIDE_VISIBLE:bi('pressure is more visible','受克与压力侧更明显'),MIXED_CARRY:bi('support, output and pressure are mixed','支持、外泄与压力并见')});
const TOPIC_INTRO=Object.freeze({
 CAREER:bi('Work is read here as the way output, responsibility, resources and learning are organized into a usable role.','事业主题看的是表达产出、规则责任、资源交换与学习支持怎样组织成可持续的工作方式。'),
 WEALTH:bi('Wealth is read as the chart’s resource flow: what can be produced, managed, exchanged and protected.','财富主题看的是资源怎样被产出、管理、交换与保留，而不是把一个财星直接等同于财富结果。'),
 RELATIONSHIPS:bi('Relationships are read through recurring interfaces between self-position, rules, resources and support, not through a single spouse label.','关系主题看自我位置、规则、资源与支持怎样在不同关系接口里反复出现，而不是把某一柱直接等同某个人。'),
 FAMILY:bi('Family and background are read as the chart’s support, belonging and environmental interfaces rather than fixed family-member assignments.','家庭与背景主题看支持、归属与环境接口怎样组合，不把某一柱固定对应成某位家人。'),
 CAPABILITY:bi('Capability is read from what can be absorbed, practiced, expressed and repeatedly carried.','能力主题看一项东西能否被吸收、练习、表达并反复承载。'),
 PRESSURE:bi('Pressure is read from standards and control together with the support available to carry them.','压力主题把规则与受克放在可用支持和承载条件里一起读。'),
 LIFE_OPERATION:bi('Life operation asks whether support, output, resources, responsibility and relationships can circulate as one system.','生活运行看支持、输出、资源、责任与关系能不能形成一套可持续循环。')
});
const BANNED_VISIBLE=Object.freeze(['READING IR','SEMANTIC OWNER','AUTHORITY','ADMITTED','FULL PRODUCTION','BAZI-CX-PRO-W','PPR-C1-W']);
const text=(table,key,lang)=>table?.[key]?.[lang]||table?.[key]?.en||String(key||'');
const group=(key,lang)=>text(GROUP,key,lang),tenGod=(key,lang)=>text(TEN_GOD,key,lang),pattern=(key,lang)=>text(PATTERN,key,lang),topic=(key,lang)=>text(TOPIC,key,lang),positionTheme=(key,lang)=>text(POSITION_THEME,key,lang),relation=(key,lang)=>text(RELATION,key,lang),carry=(key,lang)=>text(CARRY,key,lang);
const humanJoin=(items,lang)=>{const xs=uniq(items);if(!xs.length)return '';if(xs.length===1)return xs[0];if(lang==='zhHans')return xs.join('、');if(xs.length===2)return `${xs[0]} and ${xs[1]}`;return `${xs.slice(0,-1).join(', ')}, and ${xs.at(-1)}`};

function priorityCopy(theme,ctx,lang){
 const f=theme?.facts||{},rank=theme?.rank||0;
 if(theme?.themeType==='RELATIONSHIP'){
  const iface=positionTheme(f.positionThemeCode,lang),rel=relation(f.type,lang),groups=humanJoin(list(f.functionGroups).slice(0,4).map(x=>group(x,lang)),lang),members=humanJoin(list(f.memberZh),lang);
  return lang==='zhHans'?{
   title:`${iface}是整盘最先要看的接口`,
   thesis:`${members?`${members}之间形成${rel}`:`这里形成${rel}`}，而且同时直接碰到日主与月令，所以它不是边缘信息，而是会改写其他主题怎样彼此配合的主线。`,
   development:`这条接口把${groups||'多个功能组'}拉进同一处阅读。也就是说，规则、资源、支持或表达不宜各自孤立解释，要看它们在环境与自我之间怎样同时发生。`,
   condition:`${rel}描述的是结构关系，不等于现实里一定发生某类事件；真正表现仍取决于场景、角色与后续时间层。`
  }:{
   title:`${iface} is the first interface to read`,
   thesis:`${members?`${members} form ${rel}`:`This chart forms ${rel}`} at an interface that directly touches both the Day Master and month command, so it can reshape how other themes work together.`,
   development:`This interface pulls ${groups||'several functional groups'} into one reading. Rules, resources, support and expression should therefore be read together rather than as isolated symbols.`,
   condition:`${rel} describes structural interaction, not a guaranteed event. Its lived form still depends on context, role and later timing layers.`
  };
 }
 if(theme?.themeType==='PATTERN'){
  const p=pattern(f.patternFamily,lang),tg=f.tenGodZh||tenGod(f.tenGodCode,lang),paths=Number(f.visiblePathCount)||0,mods=Number(f.relationshipModifierCount)||0;
  return lang==='zhHans'?{
   title:`${p}是第二条组织路径`,
   thesis:`${tg}从月令路径进入格局讨论，目前可见 ${paths} 条成格支持${mods?`，同时有 ${mods} 项干支关系需要一起修正`:''}。`,
   development:`因此这里真正要读的不是“有没有一个格局名称”，而是这些支持条件能否和日主承载、十神组合及关系修正同时成立。`,
   condition:`当前格局路径可以深入解释，但不会因为某一条件突出就自动升级成唯一主格。`
  }:{
   title:`${p} is the second organizing path`,
   thesis:`${tg} enters the month-command pattern discussion with ${paths} visible formation path${paths===1?'':'s'}${mods?` and ${mods} relationship modifier${mods===1?'':'s'} to review`:''}.`,
   development:`The useful question is not whether the chart can be given a pattern label, but whether formation support, Day-Master carrying, Ten-God composition and relationship modifiers can hold together.`,
   condition:`The path can be explained in depth without being promoted automatically to one final primary pattern.`
  };
 }
 if(theme?.themeType==='TEN_GOD_GROUP'){
  const g=group(f.groupCode,lang),ratio=Number(f.ratio)||0,gods=humanJoin(list(f.tenGods).slice(0,3).map(x=>tenGod(x.tenGodCode,lang)),lang);
  return lang==='zhHans'?{
   title:`${g}在十神结构中进入前景`,
   thesis:`这一功能组约占当前十神落点的 ${ratio}%${gods?`，主要由${gods}构成`:''}，因此它会反复出现在多个生活主题里。`,
   development:`「${g}」值得优先读，不是因为占比越高就越“好”或越像人格标签，而是因为它和整盘其他结构有更多重复连接。`,
   condition:`后面的主题章节会继续说明「${g}」在不同领域怎样改变，而不是把同一句十神定义重复七次。`
  }:{
   title:`${g} comes to the foreground`,
   thesis:`This functional group accounts for about ${ratio}% of the current Ten-God occurrences${gods?` and is carried mainly by ${gods}`:''}, so it is likely to reappear across several life domains.`,
   development:`${g} deserves early attention because it reconnects to multiple chart structures, not because a higher ratio is automatically better or a personality score.`,
   condition:`Later topic chapters show how ${g} changes by domain instead of repeating the same Ten-God definition seven times.`
  };
 }
 if(theme?.themeType==='CARRYING'){
  const c=carry(f.overallTendency,lang),root=Number(f.rootCount)||0,support=Number(f.supportVisible)||0,out=Number(f.outwardVisible)||0,pressure=Number(f.pressureVisible)||0;
  return lang==='zhHans'?{
   title:'日主能不能承接这些主题，是整盘必须单独看的问题',
   thesis:`当前承载结构呈「${c}」：根气 ${root}、可见生扶 ${support}、泄耗 ${out}、克 ${pressure}。`,
   development:'这组结构决定其他主题落到现实运行时有多少支撑、多少输出成本、又要面对多少外部要求，因此它比单独贴“身强／身弱”更有解释力。',
   condition:'这里读的是承载条件，不制造加权旺衰分数，也不把一个阶段性的压力状态当成固定身份。'
  }:{
   title:'Whether the Day Master can carry the chart needs its own reading',
   thesis:`The current carrying structure shows ${c}: roots ${root}, visible support ${support}, drain/consumption ${out}, and pressure ${pressure}.`,
   development:'This changes how much support, output cost and external demand the other themes can actually carry, which is more informative than applying a one-word strong/weak sticker.',
   condition:'This describes carrying conditions. It does not create a weighted strength score or turn a temporary pressure state into a fixed identity.'
  };
 }
 if(theme?.themeType==='TIMING'){
  const cross=Number(f.crossLayerGroupCount)||0,ix=Number(f.interactionCount)||0;
  return lang==='zhHans'?{
   title:'所选时间窗口正在重新放大原局已有主题',
   thesis:`这个时间窗口可见 ${cross} 组跨层结构与 ${ix} 项时间互动，因此时间层值得进入主线阅读。`,
   development:'时间层不会产生一张新的命盘；它只是让原局某些已经存在的主题在大运与流年里更靠前。',
   condition:'前景化表示这个阶段更值得观察，不等于某个事件必然发生。'
  }:{
   title:'The selected timing window is re-emphasizing natal themes',
   thesis:`This timing window contains ${cross} cross-layer group${cross===1?'':'s'} and ${ix} timing interaction${ix===1?'':'s'}, making timing relevant to the main reading thread.`,
   development:'Timing does not create a new natal chart; it changes which already-present natal themes move closer to the foreground through Da Yun and Liu Nian.',
   condition:'Foregrounding means the theme deserves attention in this period, not that a specific event must happen.'
  };
 }
 return lang==='zhHans'?{title:`第 ${rank} 个整盘主线`,thesis:'这个主题连接了多个命盘层次。',development:'它会在后续章节继续展开。',condition:'仍需结合整盘阅读。'}:{title:`Whole-chart theme ${rank}`,thesis:'This theme connects multiple chart layers.',development:'It is developed in later chapters.',condition:'It remains a whole-chart reading.'};
}

function priorityShortLabel(theme,lang){
 const f=theme?.facts||{};
 if(theme?.themeType==='RELATIONSHIP')return positionTheme(f.positionThemeCode,lang);
 if(theme?.themeType==='PATTERN')return pattern(f.patternFamily,lang);
 if(theme?.themeType==='TEN_GOD_GROUP')return group(f.groupCode,lang);
 if(theme?.themeType==='CARRYING')return lang==='zhHans'?'日主承载':'Day-Master carrying';
 if(theme?.themeType==='TIMING')return lang==='zhHans'?'时间激活':'timing activation';
 return lang==='zhHans'?'整盘主线':'whole-chart theme';
}

function openingCopy({priority,fiveElements},lang){
 const day=fiveElements?.dayMaster?.zh||'',month=fiveElements?.monthCommand?.branchZh||'',themes=list(priority?.themes).slice(0,3),titles=themes.map(x=>priorityShortLabel(x,lang)),lead=humanJoin(titles,lang);
 const dominant=list(fiveElements?.items).slice().sort((a,b)=>(Number(b.rawRatio)||0)-(Number(a.rawRatio)||0))[0];
 if(lang==='zhHans')return {
  headline:`${day?`${day}日主`:''}${month?` · ${month}月令`:''}：先读整盘主线，再读单项符号`,
  paragraphs:[
   `这张盘最值得先看的不是十神清单，而是${lead||'几个跨层结构'}怎样同时组织整盘。它们会决定后面的格局、关系、人生主题与时间层应该用什么顺序阅读。`,
   `${dominant?`原始五行里${dominant.element==='WOOD'?'木':dominant.element==='FIRE'?'火':dominant.element==='EARTH'?'土':dominant.element==='METAL'?'金':'水'}约占 ${dominant.rawRatio}%，但这只是组成背景。真正的主线仍要回到月令、日主承载、十神功能组与干支接口之间的组合。`:''}`.trim()
  ].filter(Boolean)
 }
 return {
  headline:`${day?`${day} Day Master`:''}${month?` · ${month} month command`:''}: read the whole-chart thread before individual symbols`,
  paragraphs:[
   `The most useful starting point is not a Ten-God catalogue, but how ${lead||'a few cross-chart structures'} organize the chart together. They set the reading order for pattern, relationships, life domains and timing.`,
   `${dominant?`The raw Five-Element composition is led by ${dominant.element.toLowerCase()} at about ${dominant.rawRatio}%, but that is only background composition. The main thread still depends on month command, Day-Master carrying, functional groups and pillar interfaces working together.`:''}`.trim()
  ].filter(Boolean)
 };
}

function topicNarrative(topicItem,ctx,lang){
 const code=topicItem?.topicCode||'LIFE_OPERATION',lead=topicItem?.leadGroup,leadLabel=lead?group(lead.groupCode,lang):'',patterns=list(topicItem?.patternCandidates).slice(0,2),rels=list(topicItem?.relationshipInterfaces).slice(0,2),carryCtx=topicItem?.carryingContext||{};
 const patText=humanJoin(patterns.map(x=>pattern(x.patternFamily,lang)),lang),relText=humanJoin(rels.map(x=>positionTheme(x.positionThemeCode,lang)),lang),tgText=humanJoin(list(topicItem?.relevantTenGods).slice(0,3).map(x=>tenGod(x.tenGodCode,lang)),lang),priorityCount=list(topicItem?.priorityRefs).length;
 const intro=TOPIC_INTRO[code]?.[lang]||'';
 if(lang==='zhHans'){
  const focus=lead?`在这个主题里，「${leadLabel}」是当前最靠前的功能组（约 ${lead.ratio}%）${tgText?`，主要连接到${tgText}`:''}。`:'这个主题没有被单一功能组垄断，需要继续看多层组合。';
  const structure=`${patText?`同时可连接到${patText}`:'当前不需要依赖单一格局路径'}${relText?`，并经过${relText}等柱位接口修正`:''}。${priorityCount?`它与整盘 ${priorityCount} 个优先主线直接相连，因此不是独立的小结。`:''}`;
  const condition=code==='CAREER'?`事业结构会随角色、组织环境与阶段而改变；这里说明的是工作运行方式，不把它直接写成某个职业的固定成败结论。`:code==='WEALTH'?`资源结构说明钱、机会与交换怎样进入命盘，不等同实际收入承诺；现实结果仍取决于选择、市场、责任与时间条件。`:code==='RELATIONSHIPS'?`关系结构更适合观察互动方式、边界与反复接口，不把它直接翻译成结婚、分手或某一种伴侣结果。`:code==='FAMILY'?`家庭角色与现实成员会随人生阶段变化，因此这里只读支持与环境结构，不固定指定哪一柱就是哪一位家人。`:code==='PRESSURE'?`承载侧目前呈「${carry(carryCtx.overallTendency,lang)}」，所以压力要同时看可用支持 ${carryCtx.supportVisible||0} 与受克 ${carryCtx.pressureVisible||0}，不能只看官杀数量。`:code==='CAPABILITY'?`能力是否稳定，要继续看根气 ${carryCtx.rootCount||0}、生扶 ${carryCtx.supportVisible||0} 与输出成本 ${carryCtx.outwardVisible||0} 能不能长期配合。`:`生活运行的关键不是哪一组永远占上风，而是支持、输出、资源与责任能否在不同阶段重新找到可持续的循环。`;
  return {headline:topic(code,lang),lead:intro,development:`就「${topic(code,lang)}」而言，${focus}${structure}`,condition};
 }
 const focus=lead?`the leading functional group is ${leadLabel} at about ${lead.ratio}%${tgText?`, carried mainly by ${tgText}`:''}.`:'no single functional group monopolizes the domain, so the reading remains multi-factor.';
 const structure=`${patText?`It also connects to ${patText}`:'It does not require one pattern path to stand alone'}${relText?` and is modified by interfaces such as ${relText}`:''}.${priorityCount?` It directly reconnects to ${priorityCount} whole-chart priority theme${priorityCount===1?'':'s'}, so this is not an isolated mini-reading.`:''}`;
 const condition=code==='CAREER'?`Career structure can change with role, organization and timing. This describes work dynamics rather than fixing one profession into a guaranteed success-or-failure outcome.`:code==='WEALTH'?`Resource structure describes how money, opportunity and exchange enter the chart; it is not an income promise. Real outcomes still depend on choices, markets, responsibilities and timing.`:code==='RELATIONSHIPS'?`Relationship structure is best used to observe interaction style, boundaries and recurring interfaces rather than to predict marriage, separation or one fixed partner outcome.`:code==='FAMILY'?`Family roles and real people change across life stages, so this reading stays with support and environmental structure instead of assigning one pillar to one family member.`:code==='PRESSURE'?`The carrying side currently shows ${carry(carryCtx.overallTendency,lang)}, so pressure should be read against visible support ${carryCtx.supportVisible||0} and pressure ${carryCtx.pressureVisible||0}, not Officer count alone.`:code==='CAPABILITY'?`Reliability still depends on whether roots ${carryCtx.rootCount||0}, support ${carryCtx.supportVisible||0} and output cost ${carryCtx.outwardVisible||0} can work together over time.`:`The key is not which function wins permanently, but whether support, output, resources and responsibility can return to a sustainable circulation across changing periods.`;
 return {headline:topic(code,lang),lead:intro,development:`For ${topic(code,lang)}, ${focus} ${structure}`,condition};
}

function timingNarrative(timeline,priority,lang){
 const w=timeline?.currentWindow||{};if(timeline?.state!=='EXPLICIT'||!w.available)return freeze({available:false,headline:bi('Timing narrative becomes available after a complete target time is selected.','选择完整目标时间后，才会生成当前时间窗口的连续解读。'),paragraphs:freeze([]),topicCodes:freeze([]),priorityRefs:freeze([])});
 const dy=w.currentDaYun,ln=w.annual,dyGroups=list(w.currentDaYunFunctionGroups).map(x=>group(x,lang)),lnGroups=list(w.annualFunctionGroups).map(x=>group(x,lang));
 const active=list(w.topicTimeline).slice().sort((a,b)=>{const rank={DA_YUN_LIU_NIAN_CONVERGENCE:0,DA_YUN_ACTIVE:1,LIU_NIAN_ACTIVE:2,NATAL_BASELINE_ONLY:3};return (rank[a.activationState]??9)-(rank[b.activationState]??9)||String(a.topicCode).localeCompare(String(b.topicCode))});
 const focal=active.filter(x=>x.activationState!=='NATAL_BASELINE_ONLY').slice(0,3),topicNames=focal.map(x=>topic(x.topicCode,lang)),priRefs=uniq([...list(w.currentDaYunPriorityRefs),...list(w.annualPriorityRefs)]),priorityMap=new Map(list(priority?.themes).map(x=>[x.priorityId,x])),priTitles=priRefs.slice(0,3).map(ref=>priorityMap.get(ref)).filter(Boolean).map(x=>priorityShortLabel(x,lang));
 const headline=lang==='zhHans'?`${timeline.targetContext?.targetDate||''}：${dy?`${dy.pillar?.stem?.zh||''}${dy.pillar?.branch?.zh||''}大运`:''}${dy&&ln?' × ':''}${ln?`${ln.stem?.zh||''}${ln.branch?.zh||''}流年`:''}`:`${timeline.targetContext?.targetDate||''}: ${dy?`${dy.pillar?.stem?.zh||''}${dy.pillar?.branch?.zh||''} Da Yun`:''}${dy&&ln?' × ':''}${ln?`${ln.stem?.zh||''}${ln.branch?.zh||''} Liu Nian`:''}`;
 const paragraphs=lang==='zhHans'?[
  `这个窗口不是另起一张命盘，而是把原局主线带进时间层。当前大运带入${humanJoin(dyGroups,lang)||'若干功能组'}，流年再加入${humanJoin(lnGroups,lang)||'更窄的年度条件'}；它们重新连接到${humanJoin(priTitles,lang)||'原局已有重点'}。`,
  `${topicNames.length?`${humanJoin(topicNames,lang)}在这个窗口更靠前。`:'七大生活主题仍以原局基线为主。'} 如果大运与流年同时指向同一主题，只表示结构相关性增加，不把这种汇合写成事件确定性。`
 ]:[
  `This window does not create a new chart; it carries the natal thread into time. The current Da Yun brings in ${humanJoin(dyGroups,lang)||'several functional groups'}, while Liu Nian adds ${humanJoin(lnGroups,lang)||'a narrower annual layer'}, reconnecting to ${humanJoin(priTitles,lang)||'existing natal priorities'}.`,
  `${topicNames.length?`${humanJoin(topicNames,lang)} move closer to the foreground in this window.`:'The seven life domains remain anchored in the natal baseline.'} When Da Yun and Liu Nian point to the same domain, the convergence increases structural relevance rather than proving an event.`
 ];
 return freeze({available:true,headline:bi(headline,headline),paragraphs:freeze(paragraphs.map(x=>bi(x,x))),topicCodes:freeze(focal.map(x=>x.topicCode)),priorityRefs:freeze(priRefs)});
}

// R1.1 depth extension in the existing narrative owner. Conditions use the
// admitted topic composition; examples are observation situations, not biography.
function publicationDepthForTopic(t,topicIndex){
 const has=g=>list(t.relevantGroups).some(x=>x.groupCode===g&&Number(x.ratio)>0),refs=['professionalModules/professionalTopics/topics/'+topicIndex],support=has('RESOURCE'),pressure=has('OFFICER'),output=has('OUTPUT'),wealth=has('WEALTH');let text;
 switch(t.topicCode){
 case 'CAPABILITY':text=support&&output?bi('Learning/support and output both enter this capability structure. The distinction is between taking something in and making it usable for another person: understanding a method is not the same task as explaining or applying it. When comparing a study task with a task that requires a finished explanation, notice whether support remains available at both stages.','学习支持与表达输出同时进入这组能力结构。需要区分的是吸收内容与把内容转成他人能够使用的成果：理解一种方法，与说明或应用这种方法，并不是同一项任务。比较学习任务与需要完成说明的任务时，可以观察支持条件在两个阶段是否都能保留。'):bi('The capability topic does not give learning/support and output equal prominence. Avoid filling the less prominent side with an assumed skill or deficit; instead compare preparation, expression and sustained carrying separately. A practical observation is whether a change in learning support changes the task itself or only the effort needed to complete it.','这组能力主题没有让学习支持与表达输出占据相同位置。较不突出的部分不应直接被补写成某项优势或缺陷，应把准备、表达与持续承载分开观察。一个具体的对照是：学习支持改变后，改变的是任务本身，还是完成任务所需的投入。');break;
 case 'LIFE_OPERATION':text=list(t.relationshipInterfaces).some(x=>['TENSION','REPEAT_TENSION'].includes(x.relationFamily))?bi('The recorded interfaces include tension rather than only linkage. Read coordination between positions before treating the functional groups as independent strengths: the same requirement may be supported at one interface and constrained at another. Compare two roles with similar demands but different room to negotiate responsibility; this is a way to test the structural reading, not evidence that conflict has occurred.','已记录的柱位接口包含张力，而不只是联结。因此，应先看位置之间怎样协调，再把各功能组分别当作优势：同一种要求，在一个接口获得支持，在另一个接口可能受到约束。可以比较要求相近、责任协商空间却不同的两个角色；这用于检验结构解读，并不证明现实中已经发生冲突。'):bi('The recorded topic does not foreground a tension interface. Its operating question is therefore how the available functions coordinate, without inventing a conflict to make the reading sound dramatic. Compare a setting with clear responsibilities and one with changing responsibilities, and distinguish what stays stable from what depends on the setting.','这组主题没有把张力接口列在前景。运行方式的重点因此是已有功能怎样配合，不应为了制造戏剧性而补写冲突。可以比较责任清楚与责任变化的两种情境，区分哪些部分保持稳定，哪些部分依赖具体环境。');break;
 case 'CAREER':text=pressure&&support&&!list(t.relevantTenGods).some(x=>x.functionGroup==='OFFICER'&&x.visibleCount>0)?bi('The career-related Officer records are carried in hidden stems rather than visible stems, while the topic also includes learning/support. Keep those source layers distinct: this is a structural basis for examining when responsibilities become explicit, not proof of continuous external pressure. In a work setting, compare an obligation that is clearly assigned with one that becomes apparent only after the task develops, and ask what support is usable in each situation.','事业相关的官杀记录主要来自藏干，而不是透干；主题中也同时存在学习支持。需要保留这些来源层次的差别：它提供的是观察责任在何种条件下变得明确的结构依据，并不证明现实中一直承受外部压力。在工作情境中，可以比较明确被分配的责任与任务展开后才显现的责任，并分别观察哪些支持能够使用。'):pressure&&support?bi('Rules/responsibility and learning/support are both relevant to work here. The useful mechanism is their coordination: a demanding role and a workable method are separate conditions, so responsibility alone does not establish professional readiness. In a role with explicit standards, compare the demand with the training, tools and support actually available before reading the combination as sustainable.','规则责任与学习支持同时参与这里的事业结构。值得解释的是两者怎样配合：有要求的角色与可使用的方法是两种不同条件，单有责任并不能证明专业准备已经充分。在标准明确的工作情境中，可以把要求与实际可用的训练、工具及支持逐项对照，再观察这种组合能否持续。'):bi('The career composition gives a different balance to output, exchange and responsibility. Do not borrow a standard authority-and-support career story when that combination is not prominent. Compare what a role asks you to produce, how that output is used, and which responsibilities are genuinely attached to it; a job title alone cannot answer these questions.','这组事业结构对输出、交换与责任给出了不同的配置。若官杀与印星的组合并不突出，就不应借用一套标准的“权威与支持”事业故事。可以分别看角色要求产出什么、这些产出怎样被使用，以及实际附带哪些责任；职位名称本身不能回答这些问题。');break;
 case 'WEALTH':text=wealth&&output?bi('Output and wealth/exchange both appear in this resource topic. Keep producing value, exchanging it and retaining resources as separate questions; one recorded connection does not make them a guaranteed sequence. In a project or service scenario, distinguish the work delivered, the terms of exchange and what remains after the resources required to deliver it.','输出与财星交换同时出现在这组资源主题中。创造价值、完成交换与保留资源应分开理解，不能把结构上的联系直接写成必然发生的连续结果。在项目或服务的情境里，可以分别观察交付的工作、交换条件，以及扣除完成交付所需资源之后留下的部分。'):bi('Output and wealth/exchange are not equally foregrounded in this resource composition. A resource reading should not invent an automatic path from effort to income. Compare access to resources, the conditions of exchange and the ability to retain them separately; differences between these stages may matter more than a single wealth label.','这组资源结构没有让输出与财星交换同样进入前景。资源解读不能据此补写一条从付出自动通向收入的路径。可以分别比较资源能否取得、交换需要哪些条件，以及能否保留资源；几个阶段之间的差异，可能比单一财星标签更值得观察。');break;
 case 'RELATIONSHIPS':text=support&&pressure?bi('Support and responsibility are both part of the relationship composition. Receiving care and agreeing to an obligation are different interactions; treating one as proof of the other can hide the boundary that needs discussion. In a shared decision, compare what each person offers, what each person expects and which expectations have actually been agreed, without assigning a chart role to a partner.','支持与责任同时进入关系结构。接受照顾与同意承担义务是两种不同互动，把其中一种当成另一种的证明，会掩盖真正需要沟通的边界。在共同决定的情境中，可以分别看彼此提供什么、期待什么，以及哪些期待已经获得明确同意；不把某个命盘角色直接指定给伴侣。'):bi('The relationship topic has its own distribution of relevant functions and interfaces. Begin with the recorded combination rather than assuming that closeness must be organized around duty or support. Compare how a shared decision is made and how room for independent choice is maintained; the comparison is an observation prompt, not a verdict about another person.','关系主题有其自身的相关功能与接口分布。应从已有组合出发，而不是预设亲密关系一定围绕责任或支持组织。可以比较共同决定怎样形成，以及独立选择的空间怎样被保留；这种比较是观察入口，不是对另一个人的判断。');break;
 case 'FAMILY':text=support?bi('Learning/support is present in the family composition, but support is not identical to a family member or a permanent duty. Distinguish the availability of help, the way it is requested and how the load is shared. A practical example is a recurring care task: observe who can contribute under which conditions rather than inferring the family history from a pillar.','学习支持功能参与家庭结构，但支持并不等同于某位家人或一项永久义务。应区分帮助是否可用、怎样提出需要，以及负担怎样分配。一个具体的观察情境是反复出现的照顾任务：看不同条件下谁能够参与，而不是根据某一柱推断家庭经历。'):bi('Learning/support is not foregrounded in this family composition. This does not establish that support was absent in your life; symbolic prominence and actual care are different kinds of evidence. For a recurring shared task, compare the help that is explicitly available with the help that is only assumed, and keep the family history open until real information is supplied.','学习支持功能没有在这组家庭结构中进入前景。这不证明现实中没有得到支持；符号是否突出与实际照顾属于不同层次的证据。面对反复出现的共同任务，可以比较明确可用的帮助与只是被默认存在的帮助；没有现实资料之前，家庭经历仍保持开放。');break;
 case 'PRESSURE':text=pressure&&support?bi('Pressure/responsibility and support both enter the carrying picture. They should be read as separate conditions rather than cancelling each other in a numerical score. In a demanding period, compare the requirement, the resources available to meet it and the opportunity to recover; the presence of support does not prove that it is accessible in that situation.','压力责任与支持同时进入承载结构。两者是需要分别核对的条件，不能在一个数字分数里简单抵消。在要求较高的阶段，可以把要求、应对要求所需的资源与恢复机会分开对照；命盘中出现支持，也不证明在某个具体情境中一定能够使用。'):bi('The pressure topic is not reducible to a dominant Officer label. Look at the existing combination of carrying, outward demand and support instead of inventing a stress history. Compare tasks with similar effort but different recovery conditions; this can clarify which conditions matter without turning the chart into a diagnosis.','压力主题不能被压缩成一个突出的官杀标签。应回到承载、向外投入与支持的已有组合，不补写压力经历。可以比较投入相近、恢复条件却不同的任务，以此辨认哪些条件值得关注，而不把命盘当作诊断。');break;
 }
 return text?[{text,sourceRefs:refs,sourceOwner:'EXISTING_R11_AND_NATIVE_DOMAIN_MEANINGS',humanReview:'R1_1_CANDIDATE'}]:[];
}

function collectCopies(narrative){
 const out=[];const add=(key,c)=>{if(c?.en)out.push({key:`${key}:en`,lang:'en',text:c.en});if(c?.zhHans)out.push({key:`${key}:zhHans`,lang:'zhHans',text:c.zhHans})};
 add('opening:headline',narrative.opening.headline);narrative.opening.paragraphs.forEach((x,i)=>add(`opening:p${i+1}`,x));
 narrative.priorityChapters.forEach((x,i)=>{add(`priority:${i}:title`,x.title);add(`priority:${i}:thesis`,x.thesis);add(`priority:${i}:development`,x.development);add(`priority:${i}:condition`,x.condition)});
 narrative.topicNarratives.forEach((x,i)=>{add(`topic:${i}:headline`,x.headline);add(`topic:${i}:lead`,x.lead);add(`topic:${i}:development`,x.development);add(`topic:${i}:condition`,x.condition)});
 if(narrative.timingNarrative.available){add('timing:headline',narrative.timingNarrative.headline);narrative.timingNarrative.paragraphs.forEach((x,i)=>add(`timing:p${i+1}`,x));}
 return out;
}

function assertCustomerCopySafe(narrative){
 const copies=collectCopies(narrative);const seen=new Map(),duplicates=[];
 for(const item of copies){const n=normalise(item.text);if(!n)continue;const key=`${item.lang}:${n}`;if(seen.has(key))duplicates.push(freeze({first:seen.get(key),duplicate:item.key}));else seen.set(key,item.key);const upper=item.text.toUpperCase();for(const banned of BANNED_VISIBLE)if(upper.includes(banned))throw Object.assign(new Error('BAZI_CX_PRO_W10_INTERNAL_LANGUAGE_LEAK'),{code:'BAZI_CX_PRO_W10_INTERNAL_LANGUAGE_LEAK',banned,key:item.key});}
 return freeze({textBlockCount:copies.length,exactDuplicateCount:duplicates.length,duplicates:freeze(duplicates),allVisibleCopyCustomerSafe:true});
}

export function buildBaziCustomerNarrative({fiveElements,wholeChartPriority,professionalTopics,professionalTimeline}={}){
 if(wholeChartPriority?.schemaVersion!=='PHI-OS-BAZI-CX-PRO-WHOLE-CHART-PRIORITY-v1.0.0')throw Object.assign(new Error('BAZI_CX_PRO_W10_PRIORITY_REQUIRED'),{code:'BAZI_CX_PRO_W10_PRIORITY_REQUIRED'});
 if(professionalTopics?.schemaVersion!=='PHI-OS-BAZI-CX-PRO-PROFESSIONAL-TOPIC-READING-v1.0.0')throw Object.assign(new Error('BAZI_CX_PRO_W10_TOPICS_REQUIRED'),{code:'BAZI_CX_PRO_W10_TOPICS_REQUIRED'});
 if(professionalTimeline?.schemaVersion!=='PHI-OS-BAZI-CX-PRO-DA-YUN-LIU-NIAN-PROFESSIONAL-TIMELINE-v1.0.0')throw Object.assign(new Error('BAZI_CX_PRO_W10_TIMELINE_REQUIRED'),{code:'BAZI_CX_PRO_W10_TIMELINE_REQUIRED'});
 const openingEn=openingCopy({priority:wholeChartPriority,fiveElements},'en'),openingZh=openingCopy({priority:wholeChartPriority,fiveElements},'zhHans');
 const opening=freeze({headline:bi(openingEn.headline,openingZh.headline),paragraphs:freeze(openingEn.paragraphs.map((x,i)=>bi(x,openingZh.paragraphs[i]||''))),priorityRefs:freeze(list(wholeChartPriority.themes).map(x=>x.priorityId))});
 const priorityChapters=freeze(list(wholeChartPriority.themes).map(theme=>{const en=priorityCopy(theme,{},'en'),zh=priorityCopy(theme,{},'zhHans');return freeze({chapterId:`NARRATIVE-PRI-${String(theme.rank).padStart(2,'0')}`,rank:theme.rank,priorityRef:theme.priorityId,themeType:theme.themeType,themeKey:theme.themeKey,title:bi(en.title,zh.title),thesis:bi(en.thesis,zh.thesis),development:bi(en.development,zh.development),condition:bi(en.condition,zh.condition),sourceRefs:freeze(list(theme.sourceRefs))});}));
 const topicNarratives=freeze(list(professionalTopics.topics).map(item=>{const en=topicNarrative(item,{},'en'),zh=topicNarrative(item,{},'zhHans');return freeze({topicCode:item.topicCode,publicationDepth:publicationDepthForTopic(item,professionalTopics.topics.indexOf(item)),headline:bi(en.headline,zh.headline),lead:bi(en.lead,zh.lead),development:bi(en.development,zh.development),condition:bi(en.condition,zh.condition),priorityRefs:freeze(list(item.priorityRefs)),sourceState:item.state});}));
 const timingEn=timingNarrative(professionalTimeline,wholeChartPriority,'en'),timingZh=timingNarrative(professionalTimeline,wholeChartPriority,'zhHans');
 const timing=freeze({available:timingEn.available&&timingZh.available,headline:bi(timingEn.headline?.en||'',timingZh.headline?.zhHans||''),paragraphs:freeze(list(timingEn.paragraphs).map((x,i)=>bi(x.en||'',timingZh.paragraphs?.[i]?.zhHans||''))),topicCodes:timingEn.topicCodes,priorityRefs:timingEn.priorityRefs});
 const base={schemaVersion:'PHI-OS-BAZI-CX-PRO-CUSTOMER-NARRATIVE-v1.0.0',work:'BAZI-CX-PRO-W10',opening,priorityChapters,topicNarratives,timingNarrative:timing,boundaries:freeze({sourceFactsRecalculated:false,newChartFactCreated:false,priorityOrderPreserved:true,topicCompositionPreserved:true,timingDoesNotOverwriteNatal:true,fortunePredictionCreated:false,eventPredictionCreated:false,goodBadScoreCreated:false,identityLabelCreated:false,oneBoundaryParagraphPerNarrativeUnit:true,rendererMayNotInventNarrative:true})};
 const dedup=assertCustomerCopySafe(base);
 if(dedup.exactDuplicateCount)throw Object.assign(new Error('BAZI_CX_PRO_W10_EXACT_NARRATIVE_DUPLICATE'),{code:'BAZI_CX_PRO_W10_EXACT_NARRATIVE_DUPLICATE',duplicates:dedup.duplicates});
 return freeze({...base,dedup});
}

export default Object.freeze({buildBaziCustomerNarrative});

// Publication reuse of existing functional meanings, explicitly per cycle, never
// an invented current-cycle selection or an event forecast.
export function describeBaziNativeCycle(cycle){
 const g=list(cycle.functionGroups),has=x=>g.includes(x);
 if(has('RESOURCE')&&has('OUTPUT'))return bi('This cycle combines learning/support with expression/output. Read the availability of support and the conversion into usable work as different conditions: preparation does not automatically become a finished result. Compare what the natal chart can carry with what this period adds, and observe whether both stages have practical support.','本步运同时引入学习支持与表达输出。支持是否可用、能否转为可使用的成果，是两种需要分别核对的条件，准备并不自动变成完成的结果。可把原局的承载与这一步增加的功能放在一起，观察两个阶段是否都有现实支持。');
 if(has('OFFICER')&&has('RESOURCE'))return bi('Responsibility/pressure and learning/support enter this cycle together. This makes their coordination a useful question, rather than treating responsibility as either a promise or a threat. Where a role becomes more demanding, compare the actual methods, resources and permission available to carry it; the chart does not establish that such a role has occurred.','责任压力与学习支持同时进入本步运。重点在两者如何配合，不能把责任单独当作机会承诺或威胁。若某个角色的要求增加，可比较是否有实际方法、资源与权限来承接；命盘不证明这样的角色已经出现。');
 if(has('WEALTH')&&has('OUTPUT'))return bi('Output and exchange are joined in this cycle composition. The reading distinguishes making something useful, agreeing the exchange and retaining resources; these remain separate conditions, not a guaranteed chain of events. A project provides a useful comparison between what is produced and what its delivery actually requires.','输出与交换同时进入本步运的组合。解读应区分形成有用成果、达成交换与保留资源，这些仍是不同条件，并不构成必然发生的事件链。可以借一个具体项目，比较产出的内容与完成交付真正需要的投入。');
 if(has('PEER')&&has('WEALTH'))return bi('Self-position and resource exchange both enter this period. Keep control over resources separate from the responsibilities shared with others; one does not prove the other. Compare how decisions, contributions and retained resources are agreed, without turning a Peer or Wealth symbol into a story about another person.','自我位置与资源交换同时进入这一阶段。对资源的选择权与同他人分担的责任需要分开，不能相互作为证明。可以比较决定、投入与资源留存怎样达成约定，不把比劫或财星符号改写成关于他人的故事。');
 if(has('OFFICER'))return bi('Rules and responsibility enter this cycle without Resource being listed among this cycle’s own functions. That does not mean support is absent from the natal chart or real life. It makes the source of support a condition to check alongside the demand, rather than assuming that a new responsibility supplies its own means of being carried.','规则责任进入本步运，而这一步自身列出的功能组未包含印星。这不等于原局或现实中没有支持，而是需要把支持从哪里取得，与要求本身放在一起核对，不能假定一项新的责任会自动提供承接它的方法。');
 if(has('RESOURCE'))return bi('Learning/support is one of this cycle’s recorded functions. Its value depends on whether what is available can actually be used in the relevant situation; symbolic presence alone is not proof of access. Compare an opportunity to prepare or learn with the task that preparation is meant to support, while retaining the natal chart’s other demands.','学习支持是本步运列出的功能之一。它的作用仍取决于已有条件能否在具体情境中使用，符号出现本身不证明支持已经可取得。可以把准备或学习的机会，与它要支持的实际任务相对照，同时保留原局其他要求。');
 if(has('OUTPUT'))return bi('Expression/output enters this cycle. The useful distinction is between having something to express and sustaining the conditions needed to produce it. Compare the form of the output with its time, support and carrying requirements, without treating the cycle as a promise of achievement.','表达输出进入本步运。值得区分的是有内容需要表达，与能够持续维持产出条件。可把产出的形式同它所需的时间、支持和承载相比较，不把这一步运当作成就承诺。');
 if(has('WEALTH'))return bi('Resource exchange enters this cycle. Access, exchange terms and retention should be observed separately, in relation to the natal structure. None of these symbols confirms actual income, and a change in one stage does not establish a change in all of them.','资源交换进入本步运。取得资源、交换条件与留存需要分别观察，并结合原局读取。符号不能证实实际收入，其中一个阶段改变，也不证明其他阶段都已经改变。');
 return bi('Read this cycle’s recorded functions with the natal structure rather than as a replacement chart. Compare self-position, shared responsibilities and the conditions that make an arrangement sustainable; the period does not establish a personal event.','本步运列出的功能应与原局合读，不另起一张命盘。可以对照自我位置、共同责任与安排得以持续的条件，而不把这一阶段当作个人事件的证明。');
}
