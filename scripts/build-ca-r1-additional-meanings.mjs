import fs from 'node:fs';
import {sources,evidence} from './lib/sks-review-sources.mjs';
const b=sources().find(b=>b.bookCode==='BOOK-3');
const proposals=[
 ['CM-B3V1-P9-S036','协调韧性','Coordination resilience','协调韧性是局部暂时失效、偏离或退出后，整体仍能维持基本协调，并留有时间重新配置的能力。','Coordination resilience is the capacity to maintain basic coordination and retain time to reconfigure when a part temporarily fails, deviates, or exits.','真正韧性是,当某一部分暂时失效、偏离或退出以后,整体仍然能够维持最基本的协调,并拥有时间完成重新配置。'],
 ['CM-B3V1-P9-S038','协调学习','Coordination learning','协调学习是让过去经验改变下一轮协调读取现实、分配注意、设计边界和提前处理问题的方式。','Coordination learning means allowing past experience to change how the next round of coordination reads reality, allocates attention, designs boundaries, and identifies matters for earlier handling.','真正学习发生在,过去经验改变了下一轮协调怎样读取现实、怎样分配注意、怎样设计边界,又怎样判断什么值得提前处理。'],
 ['CM-B3V1-P9-S040','共同维持','Shared maintenance','共同维持是将维持共同运行所需的关键能力分布在关系之中，使它们不再集中于一个不可替代的节点。','Shared maintenance distributes the key capacities needed to sustain joint operation across relationships, so that they no longer depend on a single irreplaceable node.','真正共同维持,是维持共同运行所需要的关键能力,不再集中于任何一个不可替代节点。没有任何单一位置必须持续掌握全部现实。共同连续被分散在关系之中。'],
 ['CM-B3V1-P8-S048','维护学习','Maintenance learning','维护学习是让已经发生的失稳及其生成条件改变下一轮的维护判断与运行，而不只是保存事件记录。','Maintenance learning lets previous instability and its generating conditions change maintenance judgments and operation in the next round, rather than merely preserving records of events.','真正的维护学习,必须让已经发生的现实改变下一轮怎样运行。这便意味着,学习不能只保存事件。它需要保存生成条件。']
].map(([sectionCode,title,titleEn,definitionZh,definitionEn,quote])=>{
 const row=b.rows.find(r=>r.sectionCode===sectionCode),text=b.text.slice(...row.candidateSpan);
 const sentences=text.split(/(?<=[。！？])/u).filter(s=>!s.includes('✦')&&s.length>22&&s.length<230);
 const field=(name,regex)=>{const selected=sentences.filter(s=>regex.test(s)).slice(0,3);return {name,state:selected.length?'SOURCE_EXCERPTS_PENDING_INTERPRETATION':'NOT_ESTABLISHED',evidence:selected.map(q=>evidence(b,sectionCode,q))};};
 return {candidateId:'CA-R1-'+sectionCode,title,titleEn,definitionZh,definitionEn,source:evidence(b,sectionCode,quote),fields:[field('whatChanges',/改变|转化|不再|下一轮/),field('observableIndicators',/讯号|等待|重复|退出|替代/),field('failurePattern',/失效|失败|失去|崩塌|依赖/),field('transitionCondition',/只有|如果|条件|需要/)],relationshipPolicy:'Reading context only; no unconditional causal edge or required stage ordering is asserted.',englishSemanticParity:'DRAFT_PENDING_M8',canonicalAuthority:false,productionImport:false,humanReview:'NOT_REVIEWED'};
});
fs.writeFileSync('functions/_source-material/m1-m4-review/ca-r1-additional-meaning-proposals-v1.json',JSON.stringify({version:1,sourcePdfSha256:b.pdf.sourcePdfSha256,proposals},null,2)+'\n');
console.log('Four additional bilingual definition proposals with exact source excerpts; no registration or human approval.');
