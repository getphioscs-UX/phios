const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const list=value=>Array.isArray(value)?value:[];
const bi=(en,zhHans)=>freeze({en:String(en||''),zhHans:String(zhHans||'')});
const normalise=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'').trim();

const PRIORITY_PROMPTS=Object.freeze({
 RELATIONSHIP:Object.freeze([
  bi('Across different roles or environments, where does this same interface repeat—and where does it behave differently?','把同一个接口放到不同角色或环境里看：哪些互动模式会重复，哪些情境下反而表现不同？'),
  bi('What lived example most clearly contradicts this relationship reading, and what condition was different in that case?','哪一个真实例子最不符合这段关系解读？当时的环境、角色或资源条件有什么不同？')
 ]),
 PATTERN:Object.freeze([
  bi('When this pattern path works best in real life, which supporting conditions tend to appear together rather than separately?','这条格局路径在现实里运行得比较顺时，哪些支持条件通常会一起出现，而不是各自单独出现？'),
  bi('Can you identify a situation where the expected pattern did not show up even though one supporting factor was present?','有没有一种情况：虽然某个成格支持已经出现，但整段格局表现并没有随之成立？')
 ]),
 TEN_GOD_GROUP:Object.freeze([
  bi('In which recurring situations does this functional group become the default way you respond or organize action?','在哪些反复出现的情境里，这个功能组最容易成为你默认的应对或行动方式？'),
  bi('When another functional group takes over instead, what changed in the task, relationship, resources or pressure?','当现实里反而由另一个功能组接管时，任务、关系、资源或压力条件发生了什么变化？')
 ]),
 CARRYING:Object.freeze([
  bi('Take the same kind of task under two different conditions: when support is available and when pressure is high. What changes in stamina, pace or recovery?','拿同一类任务比较两个条件：支持充足时与压力偏高时，你的持续力、节奏或恢复方式有什么明显变化？'),
  bi('Which part of this carrying pattern feels stable across years, and which part appears mainly under specific environments or workloads?','这组承载模式里，哪些部分多年都比较稳定，哪些只在特定环境、工作量或责任阶段出现？')
 ]),
 TIMING:Object.freeze([
  bi('Around the selected timing window, which natal theme became noticeably more foregrounded compared with the period before it?','在所选时间窗口前后比较，哪一个原局主题确实比之前更明显地进入前景？'),
  bi('What did not change despite the timing activation, and what does that tell you about the difference between natal baseline and temporary emphasis?','即使时间层有所激活，哪些部分其实没有改变？这能怎样帮助你区分原局基线与阶段性前景？')
 ]),
 DEFAULT:Object.freeze([
  bi('Where does this theme repeat consistently, and where does lived experience show a different pattern?','这个主题在哪些现实情境稳定重复，又有哪些经验显示出不同的模式？')
 ])
});

const TOPIC_PROMPTS=Object.freeze({
 CAREER:Object.freeze([
  bi('Across your last two or three work settings, which mix of responsibility, output, resources and learning kept repeating?','回看最近两三个工作环境，责任、输出、资源交换与学习支持中，哪一种组合最常重复？'),
  bi('What kind of role looks suitable on paper but becomes unsustainable once the real carrying cost appears?','有哪些角色表面上看起来适合，但真正进入持续执行后，会因为承载成本而变得难以长期维持？')
 ]),
 WEALTH:Object.freeze([
  bi('When resources accumulate more smoothly, is the key difference production, management, exchange, restraint—or the timing of those actions?','当资源累积比较顺时，真正的差别更常来自产出、管理、交换、节制，还是行动时机？'),
  bi('Where has the chart-like resource pattern failed to predict reality because market, family obligation or personal choice dominated instead?','有哪些财富经验并不符合这段结构，因为市场、家庭责任或个人选择反而占了主导？')
 ]),
 RELATIONSHIPS:Object.freeze([
  bi('Which relationship pattern repeats across different people even when the personalities involved are very different?','即使对象性格完全不同，哪些互动模式仍会在不同关系里重复？'),
  bi('What boundary, expectation or resource condition changes the relationship dynamic most dramatically?','哪一种边界、期待或资源条件一改变，关系互动就会明显变成另一种样子？')
 ]),
 FAMILY:Object.freeze([
  bi('Which family or background pattern is truly persistent across life stages, and which one belonged mainly to a specific period?','哪些家庭／背景模式跨阶段都持续存在，哪些其实只属于某一个人生时期？'),
  bi('Where does chosen support outside the family reproduce—or correct—the same pattern seen in the original environment?','家庭以外后来选择的支持系统，在哪些地方重现了原有模式，又在哪些地方修正了它？')
 ]),
 CAPABILITY:Object.freeze([
  bi('Which ability becomes reliable only after repeated practice and support, and which one appears easily but is harder to sustain?','哪些能力要经过反复练习与支持才会稳定，哪些能力很容易出现，却比较难持续？'),
  bi('What context consistently blocks expression even when the underlying skill is present?','明明能力已经存在时，哪些情境仍会稳定地阻碍表达或发挥？')
 ]),
 PRESSURE:Object.freeze([
  bi('What kind of pressure improves focus, and what kind consistently reduces judgment, pacing or recovery?','哪一种压力会提升专注，哪一种压力反而会持续削弱判断、节奏或恢复？'),
  bi('When the same responsibility becomes easier to carry, what changed first: support, clarity, authority, time or resources?','同一种责任变得更容易承接时，最先改变的通常是支持、清晰度、权限、时间还是资源？')
 ]),
 LIFE_OPERATION:Object.freeze([
  bi('Over a normal month, where does the cycle of support → output → resource exchange → responsibility flow smoothly, and where does it repeatedly break?','以一个普通月份来看，支持 → 输出 → 资源交换 → 责任这条循环在哪里最顺，在哪里最容易反复断掉？'),
  bi('What small environmental change produces the largest improvement in your day-to-day operating rhythm?','哪一个很小的环境调整，最容易带来日常运行节奏上最大的改善？')
 ])
});


const TIMING_SECTION_PROMPTS=Object.freeze([
 bi('Compare the period before, during and after this target window: which already-present natal theme actually changes in visibility?','把目标时间窗口的前、当下与之后放在一起比较：原局已经存在的主题里，哪一个真正改变了可见度？'),
 bi('If the expected timing emphasis is absent, what competing responsibility, environment or choice better explains the real outcome?','如果预期的时间强调并没有出现，现实里是否有更强的责任、环境或选择更能解释结果？')
]);
function promptUnit({id,scope,ref,promptType,copy,index}){return freeze({promptId:id,scope,chapterRef:scope==='PRIORITY'?ref:null,topicCode:scope==='TOPIC'?ref:null,promptType,index,prompt:copy,boundaries:freeze({answerBecomesChartEvidence:false,answerRewritesCalculation:false,agreementRequired:false,counterExampleWelcome:true})})}
function contextualPriorityCopy(chapter,copy){const rank=Number(chapter?.rank)||0,titleEn=chapter?.title?.en||'this chart theme',titleZh=chapter?.title?.zhHans||'这条整盘主线';return bi(`For priority ${rank}, “${titleEn}”: ${copy?.en||''}`,`针对第 ${rank} 条主线「${titleZh}」：${copy?.zhHans||''}`)}
function priorityUnits(chapter){const copies=PRIORITY_PROMPTS[chapter?.themeType]||PRIORITY_PROMPTS.DEFAULT;return freeze(copies.slice(0,2).map((copy,index)=>promptUnit({id:`RB-PRI-${String(chapter?.rank||0).padStart(2,'0')}-${index+1}`,scope:'PRIORITY',ref:chapter?.priorityRef||null,promptType:index===0?'REPEAT_OR_CONTEXT':'COUNTEREXAMPLE',copy:contextualPriorityCopy(chapter,copy),index:index+1})))}
function topicUnits(item){const copies=TOPIC_PROMPTS[item?.topicCode]||TOPIC_PROMPTS.LIFE_OPERATION;return freeze(copies.slice(0,2).map((copy,index)=>promptUnit({id:`RB-TOPIC-${item?.topicCode||'UNKNOWN'}-${index+1}`,scope:'TOPIC',ref:item?.topicCode||null,promptType:index===0?'REPEAT_OR_CONTEXT':'COUNTEREXAMPLE',copy,index:index+1})))}
function timingUnits(timing){if(!timing?.available)return freeze([]);const copies=TIMING_SECTION_PROMPTS;return freeze(copies.map((copy,index)=>promptUnit({id:`RB-TIMING-${index+1}`,scope:'TIMING',ref:null,promptType:index===0?'TIMING_CORRESPONDENCE':'COUNTEREXAMPLE',copy,index:index+1})))}

function assertDedup(units){const seen=new Map(),dups=[];for(const unit of units){for(const lang of ['en','zhHans']){const raw=unit?.prompt?.[lang]||'',key=`${lang}:${normalise(raw)}`;if(!normalise(raw))continue;if(seen.has(key))dups.push({first:seen.get(key),duplicate:unit.promptId,lang});else seen.set(key,unit.promptId)}}return freeze({promptCount:units.length,exactDuplicateCount:dups.length,duplicates:freeze(dups)})}

export function buildBaziRealityBridge({customerNarrative,wholeChartPriority,professionalTopics,professionalTimeline}={}){
 if(customerNarrative?.schemaVersion!=='PHI-OS-BAZI-CX-PRO-CUSTOMER-NARRATIVE-v1.0.0')throw Object.assign(new Error('BAZI_CX_PRO_W11_CUSTOMER_NARRATIVE_REQUIRED'),{code:'BAZI_CX_PRO_W11_CUSTOMER_NARRATIVE_REQUIRED'});
 const priorityPrompts=freeze(list(customerNarrative.priorityChapters).map(chapter=>freeze({priorityRef:chapter.priorityRef,rank:chapter.rank,themeType:chapter.themeType,prompts:priorityUnits(chapter)})));
 const topicPrompts=freeze(list(customerNarrative.topicNarratives).map(item=>freeze({topicCode:item.topicCode,prompts:topicUnits(item)})));
 const timingPrompts=timingUnits(customerNarrative.timingNarrative);
 const all=freeze([...priorityPrompts.flatMap(x=>x.prompts),...topicPrompts.flatMap(x=>x.prompts),...timingPrompts]);
 const dedup=assertDedup(all);if(dedup.exactDuplicateCount)throw Object.assign(new Error('BAZI_CX_PRO_W11_REALITY_PROMPT_DUPLICATE'),{code:'BAZI_CX_PRO_W11_REALITY_PROMPT_DUPLICATE',duplicates:dedup.duplicates});
 return freeze({
  schemaVersion:'PHI-OS-BAZI-CX-PRO-REALITY-BRIDGE-v1.0.0',work:'BAZI-CX-PRO-W11',
  priorityPrompts,topicPrompts,timingPrompts,
  summary:freeze({priorityChapterCount:priorityPrompts.length,topicChapterCount:topicPrompts.length,timingPromptCount:timingPrompts.length,totalPromptCount:all.length,promptsPerProfessionalChapterMin:1,promptsPerProfessionalChapterMax:2}),
  dedup,
  boundaries:freeze({promptsAppearAfterInterpretation:true,separateGenericQuestionBankDefault:false,oneOrTwoPromptsPerChapter:true,customerAnswerBecomesEvidence:false,customerAnswerChangesMethodVerdict:false,counterEvidenceWelcome:true,eventPredictionCreated:false,goodBadScoreCreated:false})
 });
}
export default Object.freeze({buildBaziRealityBridge});
