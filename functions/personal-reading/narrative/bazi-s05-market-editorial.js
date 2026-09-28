import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const WEALTH_EDIT_VERSION='S05-MARKET-EDIT-v1.0.0';
const expected={
 'zh-Hans':'f5fc0566cdc56a9ec3ccbb4334709747d308240f76e49bf85afd308cd5e66574',
 en:'ef5eb32324342afdfe7fdfec5bef06c0f837433832162fcc97a710351585e861'
};
const edited={
 'zh-Hans':[
`你的日主是癸水，生于午月，四柱为己巳、庚午、癸丑、戊午。午为夏季月令，火在这张盘中对应财星。正财丙火藏于年支巳，偏财丁火藏于月支午和时支午，财星均在地支，没有透出本命天干。

财富解读因此从这些具体落点展开：财星联系需求、所得与资源使用，官杀联系责任和标准，印星联系知识与方法。年干己七杀、时干戊正官和月干庚正印都透出，使收入与责任、专业投入成为需要一起看的主题。五行的原始数量只描述分布，不直接判断财富多少或日主旺衰。`,
`这张盘值得关注的财富方向，是把自己的知识与承担的责任，转化为对方愿意付费的具体价值。丙正财在巳、丁偏财在两午，提供了不同的财富落点；庚正印透月干，戊正官与己七杀分别透时、年，提示收入不能脱离完成事情所需的本领和投入来谈。

财星藏于地支，现实中可以多花一点功夫，把看似有吸引力的需求问清楚：对方究竟需要什么，所得如何约定，自己要付出多少。正财、偏财不直接等于薪资、横财，也不能据此确定赚钱能力。更有用的是辨清每份收入背后的交换条件。`,
`第一，可从不同需求中寻找收入方向。年支巳藏丙正财，月、时两午藏丁偏财，让财富主题有多个实际落点。可以比较不同需求所对应的报酬与投入，选择自己能够完成、价值也说得清楚的安排。

第二，可把专业积累用在解决实际问题上。月干及巳中有庚正印，丑中有辛偏印，印星使知识和方法成为相关资源。已有经验若能减少对方的困难，就值得说明它解决了什么，以及需要多少准备时间。

第三，可通过明确责任来保护所得。透出的戊正官、己七杀让标准和承诺进入财富阅读。接下收入机会时，把完成条件和额外要求讲清楚，较有利于比较表面报酬与实际付出。`,
`需要留意的是，财星与官杀同时出现，收入机会也可能伴随更多责任。若只看报酬，没有计算准备、返工及后续照顾所需的时间，最后留下的资源可能与预期不同。对这张盘，承诺之前先了解要求，比接下以后不断补充投入更值得重视。

日干癸与时干戊相合；月午与日丑、日丑与时午分别有午丑害，月时两午另有午午自刑。这些关系使外部要求、个人安排和完成条件之间的协调成为观察重点，并不确定具体损失。日支丑还藏一处癸比肩，合作时可以先说清分担与资源归属，不能把比肩写成劫财或认定他人会夺财。`,
`收入与积累可以分开看。丙正财与丁偏财提示关注需求和交换，官杀提示检查承担的责任；真正值得比较的，是所得、完成所需的资源，以及最终能够留下的部分。对不同收入安排，都可以用同样的三个问题核对，避免只被表面金额吸引。

印星提供知识与方法的背景，可考虑用已有专长回应具体需要，同时观察准备成本是否过高。本命没有食神、伤官，不能直接把表达或成果输出当成先天优势；这不妨碍通过实践，把服务内容和价值说明白。上述方向不限定职业，也不指定投资方式。`,
`当前大运为甲戌，年龄段34—44岁。甲为伤官，属于表达、解决问题与成果输出的主题；相较于本命没有食神、伤官，这一运增加了展示成果的角度。戌中藏戊正官、辛偏印、丁偏财，责任、知识和需求仍共同参与。大运甲与本命年干己相合，有联系，但没有据此确立合化。

2026年为丙午：丙正财透出于流年，午藏丁偏财与己七杀，与本命财星均藏的呈现有所不同。流年午与本命月午、时午重复并有自刑关系，又与日丑相害。财富阅读可把重点放在收入机会与承担条件能否配合：大运关注成果如何表达，流年关注这些成果回应了什么需求，以及所得是否对应实际投入。`,
`下一步可以先挑一项已有的知识或服务，把它能解决的问题、预期报酬和需要承担的工作讲清楚。这结合了庚正印的专业背景、财星的需求主题，以及当前甲伤官的成果表达，比仅凭机会数量判断收入前景更具体。

若涉及共同完成或共同投入，再确认分工、费用与资源归属。对于2026年出现的收入安排，也把后续责任一起计算，给自己留下核对和调整的空间。八字反映的是结构倾向与阶段变化，实际财富状况仍会受到个人选择与现实条件影响。`
 ],
 en:[
`Your Day Master is 癸 Gui Water, born in the 午 summer month. The four pillars are 己巳, 庚午, 癸丑 and 戊午. Fire corresponds to Wealth here: 丙正财 Direct Wealth is hidden in year 巳, while 丁偏财 Indirect Wealth is hidden in both month and hour 午. None is visible on a natal stem.

Visible 己七杀 Seven Killings, 戊正官 Direct Officer and 庚正印 Direct Resource bring responsibility, standards and knowledge into the reading. Raw element counts describe distribution; they do not determine wealth or Day Master strength.`,
`A direction worth exploring is turning knowledge and responsibility into something another person finds worth paying for. The hidden Wealth placements bring demand and exchange into focus, while visible Resource and Officer stars make expertise and the work involved relevant alongside income.

Use this reading to clarify an attractive request: what is needed, what return is agreed, and what effort is involved? Direct and Indirect Wealth do not establish salary, windfalls or earning ability. The useful distinction is between an appealing opportunity and an exchange whose terms you understand.`,
`One potential strength is considering different demands. 丙正财 in 巳 and 丁偏财 in both 午 branches give Wealth several concrete placements. Compare the return and effort involved, looking for needs you can meet and value you can explain.

A second is applying accumulated knowledge. 庚正印 at the month stem and in 巳, with 辛偏印 in 丑, makes methods and experience relevant resources. Show which problem your expertise addresses, while accounting for preparation time.

A third is protecting the value of your work through clear responsibilities. Visible 戊正官 and 己七杀 bring standards and commitments into view. Clarify completion conditions and additional requests before comparing the reward with the effort.`,
`Wealth and Officer stars coexist, so income opportunities deserve attention alongside the responsibilities attached. Preparation, rework and continuing obligations can change what remains after the work is done. Understanding requirements before committing is a useful focus for this chart.

The natal day 癸 and hour 戊 form a stem combination. There are separate 午丑 harm relations between month and day and between day and hour, plus 午午 self-punishment between month and hour. These relations highlight coordination between external requirements, personal commitments and completion conditions, without predicting losses. The single 癸比肩 Peer hidden in day 丑 also makes shared effort worth clarifying; it is not Rob Wealth or proof that others take resources.`,
`Consider earning and accumulation separately. Wealth draws attention to demand and exchange; Officer stars to the responsibilities accepted. Compare what is received, what completion consumes, and what remains available afterward. Apply the same questions across arrangements instead of focusing only on the headline amount.

Resource stars make existing knowledge relevant when it addresses a concrete need, provided preparation costs stay in view. Neither 食神 Eating God nor 伤官 Hurting Officer appears in the natal chart, so expression should not be assumed as an innate advantage. Explaining a service and its value can still improve through practice. These directions do not prescribe an occupation or investment.`,
`The current Da Yun is 甲戌 Jia-Xu, ages 34–44. 甲伤官 Hurting Officer concerns expression, problem solving and visible results. Compared with natal Output's absence, this period adds a reason to show what your expertise produces. 戌 contains 戊正官, 辛偏印 and 丁偏财, keeping responsibility, knowledge and demand involved. Da Yun 甲 combines with natal year 己; no transformation is established.

The 2026 year is 丙午 Bing-Wu. Annual 丙正财 is visible, unlike the natal Wealth placements, while 午 holds 丁偏财 and 己七杀. Annual 午 repeats and forms self-punishment with each natal 午 and forms harm with day 丑. This makes the fit between an income opportunity and its obligations worth examining. The Da Yun draws attention to expressing results; the year to the demand those results meet and whether the return reflects the effort.`,
`Start with one existing skill or service. Explain the problem it addresses, the proposed return and the work you would undertake. This brings together the knowledge theme of 庚正印, Wealth's focus on demand and the current 甲伤官 emphasis on expression.

When effort or resources are shared, clarify responsibilities, costs and ownership. For arrangements arising in 2026, include continuing obligations in the comparison and leave room to reassess. BaZi describes structural tendencies and changes across periods; personal choices and real-world circumstances also shape financial outcomes.`
 ]
};

export async function editFrozenWealthCandidate(candidate,locale){
 const beforeDigest=await sha256Stable(candidate);
 if(!expected[locale]||beforeDigest!==expected[locale])throw Error('WEALTH_EDITORIAL_SOURCE_MISMATCH');
 const next=structuredClone(candidate);
 next.blocks.forEach((block,i)=>{block.text=edited[locale][i];});
 return {candidate:next,audit:{version:WEALTH_EDIT_VERSION,editor:'ASSISTANT_EDITORIAL_REVISION',writerCalls:0,beforeDigest,afterDigest:await sha256Stable(next),changedRoles:next.blocks.map(b=>b.role),reasons:['CONCISE_BILINGUAL_PARAGRAPHS','REMOVE_REPEATED_GOVERNANCE_LANGUAGE','REMOVE_UNSUPPORTED_PILLAR_TIME_MAPPING','ALIGN_BILINGUAL_ADVANTAGES','LOCALIZE_FINAL_BOUNDARY'],requiresFreshIndependentReview:true}};
}
