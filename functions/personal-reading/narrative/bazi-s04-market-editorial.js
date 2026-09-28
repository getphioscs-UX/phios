import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
// QA-only editorial correction of the single frozen bilingual V4 run. These
// are edited readings, not a second T2 generation or a reusable chart template.
// Exact original candidate hashes prevent application to any other reading.
export const MARKET_EDIT_VERSION='MARKET-EDITORIAL-REVIEW-v1.0.0';
const expected={
 'zh-Hans':'9ec18941202db70fce5824f617855cfb598c92885e69a6c190727b619ad6e18e',
 en:'0c2ab968a70c57a2d44a8cfbd8a017c03a84d5d305da33aeda165e5ac36af7ca'
};
const edited={
 'zh-Hans':[
`你的四柱是己巳、庚午、癸丑、戊午，日主为癸水，生于午月。日主是盘中代表自己的天干，十神则以它为参照，说明其他干支与自己的关系。五行原始分布中火、土出现较多，金、水也在盘中，木没有出现；这提供了命盘背景，并不能单凭数量定身强身弱。

事业上最值得先看官杀：年干己为七杀，时干戊为正官，都透在天干，七杀还藏在月支午、日支丑、时支午。官杀与责任、标准、竞争和职位要求有关。月干庚正印也透出，财星则藏于巳、午。因此你的事业主线可以从“承担要求、积累专业、回应客户”三者怎样配合来理解。`,
`七杀跨四柱出现，正官又透在时干，事业解读的重点因而落在怎样面对要求、把事情做得经得起检验。相较于职责含糊、只求临场发挥的环境，有明确标准、能逐步建立专业位置的工作，更值得你优先考虑。官杀既可对应承担责任的机会，也提醒你挑选值得承担的责任。

但这张盘并非只有官杀。庚正印透月干、又藏于年支巳，丑中还有辛偏印；印星与学习、知识、方法积累有关。财星中的丙正财藏于巳，丁偏财藏于两午，联系客户、市场与收入方式。把这些放在一起看，以专业解决实际需求，再逐步增加责任，比单纯追求头衔更能体现本盘的事业取向。`,
`一是把要求做扎实。己七杀透年干，戊正官透时干，官杀在盘中反复出现；可优先发挥在标准把关、审核与明确责任的工作上，让别人看见事情由你负责时，有清楚的判断依据。

二是以专业建立信任。月干庚正印与巳中庚、丑中辛共同参与，学习和方法是值得积累的事业资本。把知识用于具体问题、形成可重复使用的经验，比不断增加准备而迟迟不应用，更能发挥印星所对应的优势。

三是让专业贴近需求。正财丙与两处偏财丁都在藏干中，财星提示你关注客户究竟需要什么、愿意为什么成果付费。较有利的发挥方式，是让专业能力成为有明确用途的服务，而不只停留在自己做得熟练。`,
`官杀、印、财并存，容易需要在承担要求、做好准备与回应客户之间取舍。若客户承诺不断增加，专业准备却跟不上，责任就可能比成果更突出。事业扩张时值得先看自己能完成什么，再决定接下多少；把对外承诺与所需投入一起考虑。

原局日干癸与时干戊相合，把日主与正官联系起来；同时，月支午与日支丑、日支丑与时支午分别相害，两午之间还有自刑。这些组合使环境要求、个人承担和成果表达之间的协调成为重点。实际选择中，可留意岗位要求与客户要求是否互相拉扯，避免反复返工消耗专业积累。`,
`可以优先考虑三类方向：以官杀为依据的标准把关与责任型职能；以印星为依据的专业深耕、方法整理与知识应用；以财星为依据、用专业服务客户的发展方式。三者可以在同一份工作中结合，不必急着选定一个固定职业名称。

若走管理路线，应让承担的责任与自己的专业判断相配；若走客户路线，重点是把需求、成果和收入方式说清楚；若考虑自主发展，则先验证服务能否稳定完成，再增加承诺。原局食神、伤官没有出现，不能直接把创意表达认作先天强项，表达仍可通过练习和实际工作培养。`,
`当前为34—44岁的甲戌大运。甲是伤官，属于食伤，联系表达、解决问题与成果呈现；相较于本命不见食伤，这一步大运增加了把专业说清楚、做成可见成果的主题。戌中又藏戊正官、辛偏印、丁偏财，仍需把表达与责任、专业、客户需求结合。甲与原局年干己相合，形成大运伤官与原局七杀的联系，但并未确立合化。

2026为丙午年，丙是正财，午中藏丁偏财与己七杀，年度重点更适合放在客户需求、收入方式及相应责任。流年午与原局月、时两午分别重复并自刑，又与日支丑相害，原有的协调议题更值得留意。大运侧重把能力表达出来，流年则提醒你检视这些成果服务谁、付出与承诺是否相配。`,
`接下来可以先选一项专业成果打磨清楚，再考虑扩大职责或客户范围。这个顺序结合了庚正印的专业积累、原局官杀的责任要求，以及甲伤官大运对表达成果的关注。写作、提案或展示都可以成为工具，关键是让别人理解你能解决什么问题。

面对2026丙午的财星主题，优先考虑需求明确、成果能够完成的合作。讨论收入时，也一起核对时间投入、完成成本与后续责任；让专业换得合适回报，比只看机会数量更切合官、印、财并存的主线。八字反映的是结构倾向与阶段变化，实际发展仍会受到个人选择与现实环境影响。`],
 en:[
`Your four pillars are 己巳 Ji-Si, 庚午 Geng-Wu, 癸丑 Gui-Chou and 戊午 Wu-Wu. Your Day Master is 癸, Yin Water: the stem representing you, against which the Ten Gods are read. You were born in the 午 summer month. Fire and Earth occur more often in the raw element inventory, with Metal and Water also present and no Wood. These counts describe the chart, rather than settling its strength.

Career attention starts with the Officer stars. 己七杀 Seven Killings is visible in the year stem and hidden in the month 午, day 丑 and hour 午. 戊正官 Direct Officer is visible in the hour stem and hidden in 巳. These stars concern demands, standards, competition and responsibility. Visible 庚正印 Direct Resource adds learning and expertise; hidden Wealth stars connect the reading to clients and income methods.`,
`Seven Killings occurs across all four pillars, while Direct Officer is visible at the hour. Together they make work that requires a defensible standard worth considering. A setting where you can understand the requirements and gradually earn professional trust may suit this reading better than one built entirely around improvisation. The practical question is which responsibilities are worth accepting.

This is more than an Officer-led chart. 庚正印 Direct Resource is visible at the month and hidden in 巳; 辛偏印 Indirect Resource is hidden in 丑. Resource stars concern knowledge and methods. 丙正财 Direct Wealth in 巳 and 丁偏财 Indirect Wealth in both 午 branches bring customers and market needs into the picture. A useful direction is to develop expertise that answers a real need, then widen your responsibilities.`,
`One potential strength is making requirements concrete. Visible 己七杀 and 戊正官, alongside their hidden appearances, give a basis for considering standards, review and work with clear responsibility. The opportunity is to make the reasons behind your decisions understandable.

A second is building trust through expertise. 庚正印 at the month and in 巳, together with 辛偏印 in 丑, make learning and methods relevant career resources. Apply knowledge to actual problems and turn the results into reusable experience; preparation becomes more useful when it reaches practice.

A third is connecting specialist work to demand. Hidden 丙正财 and the two 丁偏财 placements suggest considering what customers need and which results they value. This can guide a professional service with a clear use, rather than expertise that stays separate from its audience.`,
`Officer, Resource and Wealth stars coexist here, making responsibility, preparation and client promises an important balance. If commitments grow faster than the work can be completed, pressure may overshadow the professional contribution. Before expanding, compare the demands you would accept with the knowledge and effort they require.

The natal 癸戊 combination links the Day Master to the hour's Direct Officer. There are also two distinct 午丑 harm relations, between month and day and between day and hour, plus 午午 self-punishment between month and hour. In this career reading, these combinations bring attention to coordination between workplace demands, personal commitments and the results expected. Watch for competing requirements that lead to repeated rework.`,
`Three directions deserve consideration: standards and review work supported by the Officer emphasis; specialist development and applied knowledge supported by Resource; and professional service to clients supported by Wealth. They can overlap within one role and do not require choosing a fixed occupation.

For management, match responsibility with professional judgment. For client work, clarify the need, intended result and income method. For independent work, first establish that the service can be completed consistently. Neither 食神 Eating God nor 伤官 Hurting Officer appears in the natal chart, so spontaneous expression should not simply be assumed as an innate strength. Communication can still be developed through practice.`,
`Your current Da Yun is 甲戌 Jia-Xu, ages 34–44. 甲伤官 Hurting Officer belongs to Output, associated with expression, problem solving and visible results. Compared with the natal absence of Output, this ten-year layer introduces a reason to make expertise more visible. 戌 contains 戊正官, 辛偏印 and 丁偏财, keeping responsibility, knowledge and clients involved. The Da Yun 甲 combines with natal 己 at the year: a link between Hurting Officer and Seven Killings, without an established transformation.

The annual cycle is 2026 丙午 Bing-Wu. 丙正财 Direct Wealth highlights customers and income methods, while 午 holds 丁偏财 and 己七杀. Annual 午 repeats and forms self-punishment with each natal 午, and forms harm with day 丑. Existing coordination questions merit attention. The Da Yun invites clearer expression of your work; the year asks whom that work serves and whether its commitments match the effort required.`,
`Start by making one professional result clear and useful before widening responsibilities or the client base. This combines the knowledge emphasis of 庚正印, natal Officer demands and the current 甲伤官 focus on expression. Writing, proposals or demonstrations can help people understand the problem your work addresses.

For 2026 丙午, prioritize collaborations with a clear need and a result you can complete. When discussing income, also consider the time, completion costs and continuing responsibilities involved. Seeking an appropriate return for expertise fits the combined Officer, Resource and Wealth reading better than counting opportunities alone. BaZi describes structural tendencies and changes across periods; personal choices and real-world circumstances also shape career development.`]
};
export async function editFrozenMarketCandidate(candidate,locale){
 const beforeDigest=await sha256Stable(candidate);
 if(beforeDigest!==expected[locale])throw Error('MARKET_EDITORIAL_SOURCE_MISMATCH');
 const next=structuredClone(candidate);
 next.blocks.forEach((b,i)=>{b.text=edited[locale][i];});
 return {candidate:next,audit:{version:MARKET_EDIT_VERSION,editor:'ASSISTANT_EDITORIAL_REVISION',writerCalls:0,beforeDigest,afterDigest:await sha256Stable(next),changedRoles:next.blocks.map(b=>b.role),reasons:['CORRECT_HIDDEN_SEVEN_KILLINGS_POSITIONS','REMOVE_UNSUPPORTED_FIRST_EVER_TIMING_CLAIM','REMOVE_REPEATED_GOVERNANCE_AND_CONSULTING_LANGUAGE','CONCISE_BILINGUAL_PARAGRAPHS','EXPLAIN_TERMS_IN_CUSTOMER_LANGUAGE'],requiresFreshIndependentReview:true}};
}
