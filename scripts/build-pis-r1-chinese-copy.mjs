import fs from 'node:fs';
const path='assets/js/locales/zh-Hans/public.js';
let source=fs.readFileSync(path,'utf8');
const blocks={
 founder:{metaTitle:'Teresa Lee — PHI OS 创办者与首席架构设计者',skip:'跳至创办者介绍',eyebrow:'创办者与首席架构设计者',title:'Teresa Lee',lead:'PHI OS 起点来自一个反复出现的现实问题：人可以拥有越来越多的信息、框架与建议，却仍然看不清自己的处境究竟发生了什么。',originTitle:'从实践中开始',originCopy:'她的实践跨越理财规划、资源配置、组织重组与系统分析，同时研究不同历史框架如何理解人的模式与时序。不同领域反复显露同一个限制：每种方法能看见一部分，却难以持续保留整体处境、证据、未知与时间中的变化。',quote:'「更深的问题是：这个框架究竟观察到了什么？可以合理推导到哪里？它的解释与现实相遇之后，是否仍然成立？」',factsTitle:'实践背景与研究方向',factsCopy:'PHI OS 创办者与首席架构设计者，《现实导航核心论述》与七册书系作者。实践背景包括理财规划、组织重组、资源配置与系统分析；研究关注现实形成、人的持续运行、解释、连续性、AI 与文明。',researchTitle:'为什么研究仍在继续',researchCopy:'AI 扩展了语言与综合信息的能力。PHI OS 继续追问：如何让这些能力连接证据、持续变化与行动责任，而不只产生更多答案。'},
 founderTeaser:{eyebrow:'创办者',name:'Teresa Lee',role:'创办者与首席架构设计者',action:'为什么建立 PHI OS →'},
 reality:{metaTitle:'什么是现实导航 — PHI OS',skip:'跳至现实导航',eyebrow:'现实导航',title:'理解现实，需要同时看见不同部分。',lead:'正在发生的事、已经存在的条件、亲身感受、相互关系、受到的限制，以及仍不知道的部分，共同构成眼前的处境。',notTitle:'单一视角不等于整体',notCopy:'群体共识、当下感受、一份检测结果或一种身份都可能重要，但都不能独自描述完整处境。',layersTitle:'保留这些重要区别',observed:'观察到的：事件、记录、测量、行动与注明日期的事实。',experienced:'亲身经历的：当事人的感受、察觉、记忆与报告。',structural:'关系与结构：人、角色、资源、依赖、限制与反馈。',derived:'推断与解释：根据依据提出的模式或说明。',unknown:'可能与未知：模型提示的可能性，以及尚无法确认的部分。',jadeTitle:'像观察玉石的不同切面',jadeCopy:'打磨并不是创造里面的玉，而是减少失真、改变光线、尊重纹理。理解处境也一样：依据到尽头时承认未知，行动后再观察新的切面。',verbsTitle:'理解、选择、继续',verbsCopy:'把相关信息放回同一个处境，比较可承担的选项，再记录行动与结果，让下一次理解从实际变化开始。'},
 research:{metaTitle:'为什么研究现实导航 — PHI OS',skip:'跳至研究基础',eyebrow:'研究基础',title:'面对不确定，怎样保留方向感？',lead:'这里讨论人如何寻找意义、理解变化与组织注意。这些研究问题不用于证明某个灵性主张，也不取消不同方法的限制或专业服务的责任。',uncertainty:'不确定性：人如何面对无法掌握的变化，值得进一步研究。',coherence:'连贯性：除了单独的事实，人也会追问事件之间如何连接。',self:'与自己有关：个性化信息可能更有吸引力，但不能因此制造确定性的印象。',attention:'持续注意：给问题留出时间，记录变化，并在之后回来观察。',care:'专业协助：有些问题需要合资格专业人士参与，不能只靠增加解释。',gap:'研究重点：怎样让不同视角各有位置，并与可核对的依据相连接。'},
 systems:{metaTitle:'人类如何理解现实 — PHI OS 研究',skip:'跳至人类读取方法',eyebrow:'人类读取方法',title:'不同方法可以看见一部分，不能代替整个现实。',lead:'PHI OS 比较历史方法、心理学、灵性实践、专业服务、搜索与 AI，同时保留各自的来源与适用范围。',historicalTitle:'传统读取方法',historicalCopy:'占星、八字、数字学与塔罗等提供不同的象征视角、时序框架和模式语言。它们的解释需要结合情境理解，不应被当作必然发生的命运。',psychTitle:'心理学方法',psychCopy:'心理学与心理治疗有各自的专业角色，PHI OS 不替代临床照护。',spiritualTitle:'灵性与意义',spiritualCopy:'仪式与灵性语言可以作为意义建构和反思的方式。主观意义可以被尊重，但不能因此当作已验证的外部事实。',authorityTitle:'了解依据与限制',authorityCopy:'有用的问题不是哪种方法拥有全部真理，而是它观察什么、能够推导什么、何时需要外部专业协助，以及什么仍不知道。'}
};
for(const [name,value] of Object.entries(blocks)){
 const marker=`    "${name}": {`;const start=source.indexOf(marker);if(start<0)throw Error(name);
 const end=source.indexOf('\n    }',start)+6;
 const replacement='    '+JSON.stringify(name)+': '+JSON.stringify(value,null,2).split('\n').map((line,i)=>i?'    '+line:line).join('\n');
 source=source.slice(0,start)+replacement+source.slice(end);
}
fs.writeFileSync(path,source);
console.log('PIS: existing Chinese founder, reality navigation and research copy rewritten in customer language.');
