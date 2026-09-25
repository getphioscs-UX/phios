// Publication-owned editorial copy for BaZi fixed pages.
//
// Contract:
// - Section openers and Key Insights are static bilingual publication copy.
// - They explain what each chapter reads and how to use its structure.
// - They do not create a person-specific verdict and must never be replaced by T3.
// - Person-specific narrative remains owned by admitted native facts / dynamic pages.
const pair=(en,zh)=>({en,'zh-Hans':zh});

export const BAZI_SECTION_EDITORIAL={
 S01_OVERVIEW:{
  intro:pair(
   'Every later interpretation begins with the same chart. This chapter establishes that common reference: the Four Pillars, the Day Master, the month setting and the distribution of the Five Elements. Read it as the map of the system before moving into personality, work, relationships or timing.',
   '后面的所有解读，都从同一张命盘开始。本章先建立共同参照：四柱、日主、月令，以及五行在命盘中的分布。先把它当作整套系统的地图看清楚，再进入性格、事业、关系与时间等主题。'
  ),
  bridge:pair(
   'The Four Pillars show where each stem and branch is positioned; the Day Master gives the chart its reference point; the month setting supplies the seasonal context; the Five Elements show what is visibly present and how that presence is distributed. These layers should be read together rather than reduced to a single count.',
   '四柱说明每个天干地支位于哪里；日主提供整张命盘的参照点；月令提供季节背景；五行则显示哪些元素出现，以及它们如何分布。阅读时要把这些层次放在一起，而不是把命盘压缩成一个数字。'
  ),
  items:[
   pair('The Day Master is the reference point of the chart. Its meaning depends on the season, surrounding stems and branches, roots and support—not on the Day Master label alone.','日主是命盘的参照点。它需要结合季节、周围干支、根气与支持一起阅读，不能只凭日主名称下结论。'),
   pair('Element counts describe composition, not final strength. Seasonal influence and structural relationships determine how that composition functions.','五行数量说明的是组成，不等于最终强弱。季节作用与结构关系，才决定这些组成怎样运作。'),
   pair('The chart is a system of positions and relationships. Later chapters do not introduce a different chart; they return to this same structure from a different question.','命盘是一套位置与关系组成的系统。后面的章节不是换一张命盘，而是带着不同问题重新回到同一套结构。')
  ]
 },
 S02_PERSONALITY:{
  intro:pair(
   'Core Personality reads the recurring way the chart receives information, develops capability, expresses itself and meets expectations. In BaZi, personality is not one isolated trait. It emerges from the relationship between the Day Master, the Ten Gods and the conditions that support or constrain how those functions are used.',
   '核心性格读取的不是一个孤立标签，而是命盘如何吸收信息、发展能力、表达自己，以及面对期待时反复出现的运作方式。在八字里，性格来自日主、十神与支持或限制这些功能的条件之间的关系。'
  ),
  bridge:pair(
   'The Ten Gods describe functions relative to the Day Master: self-position, learning and support, expression and output, resources and exchange, responsibility and pressure. A useful personality reading asks which functions are prominent, which ones cooperate, and what conditions make them easier or harder to use consistently.',
   '十神描述的是相对于日主的不同功能：自我位置、学习与支持、表达与产出、资源与交换、责任与压力。真正有用的性格读取，需要看哪些功能突出、哪些功能彼此协作，以及什么条件会让这些能力更容易或更难稳定发挥。'
  ),
  items:[
   pair('Core style comes from the relationship between the leading capability function and the other functions that remain active around it, not from one personality label.','核心运作方式来自首要能力功能与周围其他功能的关系，而不是一个性格标签。'),
   pair('Learning, absorption and expression are different layers of capability. A skill may be available internally while still needing different conditions to become consistent output.','学习、吸收与表达是能力的不同层次。一项能力可以已经存在，但仍需要不同条件才能成为稳定输出。'),
   pair('Reliability depends on carrying conditions. Support, external demand and the cost of expression influence whether capability remains usable over time.','能力能否稳定使用取决于承载条件。支持、外部要求与表达成本会共同影响能力能否长期保持可用。')
  ]
 },
 S03_LIFE_STRUCTURE:{
  intro:pair(
   'Life Structure brings the chart’s main mechanics into one view. It considers the carrying conditions of the Day Master, the functional balance of the Ten Gods, candidate pattern paths and the relationships between pillars. The purpose is to understand how the chart organizes support, demand and direction before applying it to specific life domains.',
   '人生格局把命盘最主要的运作机制放到同一张图里阅读：日主的承载条件、十神功能的分布、可能形成的格局路径，以及柱位之间的关系。先理解命盘如何组织支持、负荷与方向，再把这些结构带入具体人生领域。'
  ),
  bridge:pair(
   'A pattern is not established because one symbol is present. It is established only when the required relationships and conditions are present together. Life Structure therefore keeps confirmed structure, candidate paths and unresolved conditions distinct.',
   '格局并不会因为某个符号出现就自动成立。只有相关关系与必要条件同时具备，判断才有足够基础。因此，本章会把已经确认的结构、候选路径与仍未满足的条件明确区分。'
  ),
  items:[
   pair('Day Master carrying conditions describe how much support and counter-pressure the reference point is working with. They are the base layer for later interpretation, not a judgment of personal worth.','日主承载条件说明这个参照点同时面对多少支持与反向负荷。它是后续解读的基础层，不是对个人价值的评价。'),
   pair('Pattern paths show how several functions may organize into a larger structure. A visible path is meaningful, but it remains different from a fully established pattern when conditions are still open.','格局路径显示多个功能可能怎样组织成更大的结构。路径可见本身有意义，但只要关键条件仍开放，就必须与“已经成格”区分。'),
   pair('Pillar relationships reveal where structural interaction occurs. Repetition, support, control or tension becomes more informative when its position in the chart is preserved.','柱位关系揭示结构互动发生在哪里。重复、支持、制约或张力，只有在保留其具体位置后，才具有更完整的解释价值。')
  ]
 },
 S04_CAREER:{
  intro:pair(
   'Career Development reads how the chart handles responsibility, output, standards, resources and role boundaries. Rather than assigning a single “best profession,” this chapter looks at the kinds of working conditions in which the chart’s functions can be used coherently and sustained over time.',
   '事业发展读取的是命盘如何处理责任、产出、标准、资源与角色边界。本章不会把你指定到某一个“最佳职业”，而是观察什么样的工作条件，能让命盘中的功能更连贯、更持续地被使用。'
  ),
  bridge:pair(
   'Career themes become useful when they are translated from symbols into working conditions: what must be delivered, how much autonomy is available, how standards are set, what support exists and how resources move through the role. The same chart can function very differently across two jobs with different structures.',
   '事业主题只有从符号转换成工作条件后才真正有用：需要交付什么、拥有多少自主权、标准如何设定、有哪些支持、资源如何在角色中流动。同一张命盘，在两种结构完全不同的工作里，实际运作方式可以差异很大。'
  ),
  items:[
   pair('Career fit depends more on role structure than on job title: responsibility, autonomy, standards, resources and support need to be read together.','事业适配更取决于角色结构，而不是职位名称：责任、自主权、标准、资源与支持需要一起阅读。'),
   pair('The same capability can operate very differently under different working conditions. Authority, workload and clarity of expectations materially change how the structure is carried.','同一套能力在不同工作条件下可以表现得很不一样。权限、工作量与期待是否清楚，会明显改变结构如何被承载。'),
   pair('Long-term career direction is best read from themes that repeat across several parts of the chart, not from one isolated profession symbol.','长期事业方向更适合从整盘反复出现的主题中判断，而不是从一个孤立的职业符号推出。')
  ]
 },
 S05_WEALTH:{
  intro:pair(
   'Wealth Outlook reads the chart’s relationship with resources: how value is produced, exchanged, directed, maintained and placed under responsibility. In BaZi, “wealth” is first a structural function. Actual income, assets and financial outcomes still depend on real-world decisions and conditions outside the chart.',
   '财富运势读取的是命盘与资源之间的关系：价值如何被创造、交换、调动、维持，以及怎样进入责任结构。在八字里，“财”首先是一种结构功能；真实收入、资产与财务结果仍取决于命盘之外的现实决定与条件。'
  ),
  bridge:pair(
   'A useful wealth reading follows the full resource cycle rather than stopping at acquisition. It asks where resources come from, what must be exchanged for them, what competes for them and what structure is needed to retain or redeploy them.',
   '有用的财富读取不会只停在“得到资源”，而是追踪完整的资源循环：资源从哪里来、需要交换什么、哪些力量会分流资源，以及需要怎样的结构才能保留、管理或重新投入。'
  ),
  items:[
   pair('Wealth is read as a resource cycle: how value enters, what must be exchanged for it and what competing demands act on it afterward.','财富要按资源循环来读：价值如何进入、需要交换什么，以及之后有哪些要求会分流资源。'),
   pair('Resource opportunity and resource retention are different structural questions. Receiving more does not automatically mean keeping more.','资源机会与资源留存是两个不同问题。得到更多，并不自动等于能够留下更多。'),
   pair('Symbolic wealth structure does not equal a financial outcome. Real decisions still require cash flow, obligations, risk and market evidence outside the chart.','象征性的财富结构不等于现实财务结果。真实决定仍需要命盘之外的现金流、义务、风险与市场证据。')
  ]
 },
 S06_RELATIONSHIP:{
  intro:pair(
   'Relationships & Marriage reads how the chart approaches closeness, reciprocity, expectations, responsibility and personal position within important bonds over time. It does not reduce another person to a symbol; instead, it examines the recurring relational functions carried by this chart.',
   '感情婚姻读取的是命盘在重要关系中如何处理亲近、互惠、期待、责任，以及自己的位置。它不会把另一个人压缩成一个符号，而是观察这张命盘反复携带怎样的关系功能。'
  ),
  bridge:pair(
   'Relationship structure becomes clearer when self-position and partner-facing functions are read together. Attraction, obligation, support and boundary-setting may belong to different parts of the same pattern. The practical question is not only who appears, but how the relationship is organized once two people begin interacting.',
   '关系结构需要把自我位置与面向伴侣的功能放在一起阅读。吸引、责任、支持与边界，可能分别属于同一个关系模式的不同部分。真正需要理解的不只是“谁会出现”，而是两个人开始互动以后，关系怎样被组织起来。'
  ),
  items:[
   pair('Relationship reading begins with your recurring position: expectations, exchange, support, responsibility and boundaries need to be read together.','关系读取先看你反复出现的位置：期待、交换、支持、责任与边界需要一起理解。'),
   pair('Recorded links and tensions show where interaction may require negotiation. They describe relational structure, not the other person’s hidden motives.','已记录的联结与张力显示哪些互动需要协商；它们描述关系结构，不代表对方的隐藏动机。'),
   pair('The chart can identify recurring relationship themes, but it cannot by itself guarantee marriage, separation or one fixed partner outcome.','命盘可以识别反复出现的关系主题，但不能单独保证婚姻、分离或某一种伴侣结果。')
  ]
 },
 S07_HEALTH:{
  intro:pair(
   'Health & Wellbeing translates the chart’s load, rhythm and support structure into a non-clinical view of daily functioning. It focuses on how pressure, recovery and routine are organized. It does not diagnose disease, identify vulnerable organs or replace medical assessment.',
   '健康养生把命盘中的负荷、节奏与支持结构，转换成对日常运作的非临床观察。重点是压力、恢复与生活规律怎样被组织；本章不诊断疾病、不判断器官弱点，也不能代替医疗评估。'
  ),
  bridge:pair(
   'In this report, wellbeing is read through the balance between demand and recovery. Structural pressure may be useful as a lens for noticing rhythm, but it is not a biological diagnosis. The meaningful comparison is between periods with different workloads, routines and available support.',
   '在本报告里，身心状态主要通过“负荷与恢复之间的平衡”来阅读。结构压力可以帮助观察生活节奏，却不是生理诊断。更有意义的比较，是不同工作量、作息与支持条件下，你的日常运作有何变化。'
  ),
  items:[
   pair('Pressure is a structural theme before it is a health theme. It may describe demand, accountability or sustained load without implying illness.','压力首先是结构主题，其次才是生活观察主题。它可以代表要求、责任或持续负荷，但不等于疾病。'),
   pair('Recovery conditions matter as much as demand. Sleep, routine, workload, environment and practical support belong to real-life wellbeing evidence and should remain visible.','恢复条件与负荷同样重要。睡眠、作息、工作量、环境与实际支持，都属于真实生活中的身心证据，需要被保留下来。'),
   pair('Any medical conclusion requires medical evidence. Use this chapter to organize observations about rhythm and pressure, not to convert symbolic elements into diagnoses.','任何医学结论都需要医学证据。本章只用于整理节奏与压力的观察，不把象征性的五行或十神转换成诊断。')
  ]
 },
 S08_TIMING:{
  intro:pair(
   'Timing & Cycles adds movement to the natal structure. The birth chart remains the base; luck cycles and annual layers show clearly which parts of that structure are being revisited, supported, challenged or made more visible during a defined period.',
   '时间结构是在本命结构之上加入“变化”。本命仍是底图；大运与流年显示在特定时期里，命盘中的哪些部分被重新触发、得到支持、受到挑战，或变得更加明显。'
  ),
  bridge:pair(
   'Timing works by layering rather than replacing. Natal structure, luck cycle and year each answer a different question. The most useful reading keeps those levels separate first, then examines where their themes intersect.',
   '时间读取采用“叠层”而不是“替换”。本命、大运与流年分别回答不同问题。最有效的做法，是先把这些层次分清楚，再观察它们在哪里发生交汇。'
  ),
  items:[
   pair('The natal chart describes the persistent structure; the luck cycle changes the medium-term operating environment; the annual layer narrows the observation window further.','本命描述持续存在的结构；大运改变中期运行环境；流年则把观察范围进一步收窄。'),
   pair('A repeated theme across natal, luck-cycle and annual layers deserves more attention than a symbol appearing in only one layer, but repetition still does not guarantee a specific event.','同一主题若同时出现在本命、大运与流年中，通常比只出现于单一层更值得注意；但重复仍不等于保证某件具体事件发生。'),
   pair('Timing is most useful when anchored to a real period and a real question. It should help compare changing conditions, not turn every symbol into a prediction.','时间读取最适合绑定真实时期与真实问题，用来比较条件怎样变化，而不是把每个符号都转换成预测。')
  ]
 },
 S09_GUIDANCE:{
  intro:pair(
   'Guidance & Recommendations brings the report back together. Instead of adding every chapter into one final verdict, it identifies the recurring structural themes that matter across work, resources, relationships and timing, then translates them into clear practical points of attention.',
   '人生建议把整份报告重新收拢。它不是把所有章节相加成一个最终结论，而是找出在事业、资源、关系与时间中反复出现的结构主题，再把这些主题转换成现实中值得注意的行动重点。'
  ),
  bridge:pair(
   'Integration asks which themes repeat across several chapters, which ones depend on a specific condition and which ones remain unresolved. The strongest guidance comes from recurring structure plus real-world feedback, not from the most dramatic isolated statement.',
   '整合时要分清：哪些主题在多个章节中重复出现，哪些主题依赖特定条件，哪些判断仍然开放。最有价值的建议，来自反复出现的结构与现实反馈，而不是最戏剧化的一句孤立结论。'
  ),
  items:[
   pair('Give priority to themes that repeat across several chapters. Repetition across work, resources, relationships and timing is more informative than one isolated statement.','优先关注跨章节重复出现的主题。事业、资源、关系与时间中反复出现的结构，比一句孤立判断更有解释力。'),
   pair('Keep stable structure separate from temporary timing. A current period can intensify a theme without turning it into a permanent identity.','把稳定结构与阶段性时间分开。当前时期可以放大某个主题，却不会因此变成永久身份。'),
   pair('Guidance becomes useful when it changes navigation: identify one condition that matters now, make a bounded adjustment and observe what actually changes.','建议只有进入现实导航才真正有用：找出当前最重要的一个条件，做有限调整，再观察真实变化。')
  ]
 },
 S10_APPENDIX:{
  intro:pair(
   'Method & Appendix explains what the report is built from, what each layer can support and where interpretation must stop. Use it whenever you want to distinguish a calculated chart fact from an interpretive statement, a candidate pattern from a confirmed one, or a timing frame from an event claim.',
   '方法与附录说明这份报告由什么组成、每一层证据能够支持到哪里，以及解释应该在哪里停止。当你需要区分“计算事实与解释文字”“候选格局与已确认格局”“时间框架与事件判断”时，可以回到这里。'
  ),
  bridge:pair(
   'The report contains several evidence levels: calculated chart structure, admitted method relationships, editorial explanation and lived-reality comparison. Keeping these levels distinct makes the report more useful because a strong conclusion can be traced back to the kind of evidence that actually supports it.',
   '本报告包含几个不同证据层：计算得到的命盘结构、已核准的方法关系、编辑解释，以及现实经验对照。把这些层次分清楚，报告反而会更有用，因为每个重要结论都能追溯到真正支持它的证据类型。'
  ),
  items:[
   pair('Calculated facts and interpretation are different layers. Stems, branches, counts and resolved timing positions are method facts; the meaning attached to them requires an explicit interpretive rule.','计算事实与解释属于不同层次。天干、地支、计数与已解析的时间位置属于方法事实；附加其上的意义则需要明确的解释规则。'),
   pair('Open conditions stay open. When a pattern, strength judgment or timing conclusion is not fully established, the report should preserve that uncertainty instead of filling it with stronger prose.','未定条件必须保持未定。当格局、强弱或时间结论尚未完全成立时，报告应保留这种不确定性，而不是用更肯定的文字填补。'),
   pair('Use the report as a structured lens, then compare it with independent evidence from your actual life. Agreement can be useful, and disagreement is equally valuable information for interpretation.','把报告当作结构化观察镜头，再与真实生活中的独立证据比较。相符可以提供线索，不相符同样是重要的解释信息。')
  ]
 }
};
