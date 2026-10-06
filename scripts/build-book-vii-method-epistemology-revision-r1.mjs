import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='content/knowledge/book-vii/revisions/book-vii-method-epistemology-revision-successor-v1';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const source=path.join(process.env.TEMP,'kap-book-vii-r1/book-7.pdf');
const metadata=read('content/knowledge/book-vii/evidence/section-metadata-from-private-source-v1.json');
assert.equal(hash(fs.readFileSync(source)),metadata.sourceSha256);
const pages=read(path.join(process.env.TEMP,'kap-book-vii-r1/method-revision-pages.json'));
const releasePath='content/knowledge/public/successors/book-vii-production-live-cutover-r1/published-projection.json',release=read(releasePath);
const additions={
65:[
'当你带着一张八字命盘、一份占星解读或一份性格测验报告，试着理解自己为什么总在工作中感到疲惫时，最容易混在一起的，是“这个结果怎么算出来”“这个结果怎样被解释”和“我的生活实际发生了什么”。这三件事各自需要不同的依据：计算权威来自是否按照所声明的规则和输入得到可复核的结果，解释权威来自解释是否遵守自身的适用范围、说明理由并容纳其他可能，现实权威则要回到真实经历和可以核对的证据。例如，一张命盘可以在某套规则下被准确排出，但从其中某种关系推断你不适合团队工作，还需要面对你在不同团队里的实际表现。计算权威不等于解释权威，解释权威也不等于现实权威；把它们分开，才知道一个读取究竟有资格回答哪一部分问题。',
'当朋友拿着不同报告说“这些系统都能认识你”时，你可以认真听取其中的提示，同时留意它们怎样获得信息、讨论什么问题，以及结论愿意停在哪里。八字、紫微、占星、人类图（Human Design）、Gene Keys、MBTI 和大五人格可以在这里作为不同读取语言的例子，它们的输入、传统、分类方式和证据要求并不因此相同。例如，“你在关系中需要空间”也许让你想起某段真实经历，但是否符合当下关系，仍要看相处记录、对方反馈与不符合这句话的时刻，不能只凭报告的名声或令人熟悉的措辞确认。这里既不教授任何方法，也不替所有方法排出高低；证据权威的主线仍然是，让每种说法承担与其来源和范围相称的主张。'],
66:[
'当八字和占星的解读都说你“适合独立工作”时，两次听到相近的话很容易带来双重确认的感觉，但相同结论是否增加证据，要先看它们是否真正独立，以及所说的“独立”是不是同一件事。不同系统可能使用同一份出生资料，也可能在解读时受到你已经讲述的经历影响；例如，你先告诉两位解读者自己讨厌会议，后来两份报告都强调独立性，这种一致不能自动算作两次独立观察。共同输入不等于独立证据，意见一致也不等于独立确认，即使两种计算规则确实不同，也仍需要现实记录检验结论。联合读取的价值因此不在于把赞同次数相加，而在于查明每一条支持究竟从哪里来。',
'当紫微的解读强调承担责任，八字的解读却提醒你避免过度消耗时，你未必需要立刻决定谁错了，因为两句话可能讨论不同的层次、时间或条件。例如，一个人在团队中确实经常承担协调工作，同时也确实会在连续加班后失去恢复空间，这两种描述可以互相限制，帮助校准各自的范围；但若两种说法在同一条件下作出无法同时成立的判断，就需要核对输入、解释步骤和实际记录，不能用“层次不同”把所有矛盾化解。不同系统可能互相支持、限制、校准或反驳，也可能观察不同层面；分歧不等于必有一个系统错误，却也不是免于检查的理由，这才是彼此参照而不简单相加的意义。'],
71:[
'当你第一次拿到八字命盘、占星星盘、紫微命盘或人类图结构图时，图上的排列往往显得比生活本身更清楚，因而容易让人觉得一个关于自己的答案已经完成。其实，按照各自声明的规则，核对出生资料后排出这些图，属于计算；把图中的关系转成有关性格、关系或生活处境的说法，属于解释；再用实际经历检验这些说法，才进入现实验证。例如，在同一套规则和相同输入下，人类图结构图的计算结果可以是确定的，但由此解释你如何合作，仍不能直接成为你的个人现实事实。计算不等于解释，解释不等于证据，解释也不等于个人现实事实；从计算走向解释，再走向现实验证，每一步都需要另外说明理由，而不是让一张算得精确的图替整个过程背书。',
'当一份传统解读让你想起“我好像一直都是这样”时，它可以成为整理经历的一种语言，而不必立即成为最后答案。例如，一份八字解读提示你留意表达方式，你可以回想最近几次会议，比较自己在熟悉团队和陌生场合中的表现，也可以寻找你表达自然、并未出现困难的例外；这些记录会帮助你判断，提示适用于什么条件，还有没有其他解释。占星、紫微和人类图的计算同样不能仅凭图被排出，就被描述成科学已经证明的人生真理，但这也不等于否定它们作为读取语言的价值。不同语言具有不同范围与权威，候选读取的意义正在于让它们帮助提出问题，同时让信心随着证据变化，而不把最先听到的解释变成唯一的自己。'],
72:[
'当一种沿用很久、结构复杂的读取系统给出与你的生活不合的解释时，你可能犹豫：是自己还没有理解它，还是它确实需要调整？传统的延续、方法的复杂程度、内部说法的一致性和计算的精度，都可以成为了解一个系统的线索，却不能取消现实提出反证的资格。例如，一份解读说你一直难以维持合作，而你在多个不同团队里都有长期稳定的合作记录，那么这些经历至少要求重新检查这项解释的范围，而不是因为系统历史悠久，就把所有反例归为你尚未认识自己。模型不等于现实，现实保留最终修正权；任何读取系统都必须让修订、反证和未知继续有位置，这正是解释能够保持可信的条件。',
'当你回看几年前的解读，发现某些描述在当时贴近生活、如今却不再适用时，也不必在“过去全错”和“现在仍然必须相信”之间作选择。你可以先区分生活条件是否改变，以及过去的解释是否原本就超出了证据；例如，换了工作后不再频繁独处，可能与团队安排有关，而不必立刻被解释成某种固定结构发生了变化。若目前还无法区分这些可能，就保留未知，并记录什么新经历会让判断改变，而不是为了维护传统或解释的一致性不断追加理由。公开保存旧读取和修改依据，使现实验证能够持续发生，也把版本修订带回本节的主线：可靠的知识不是永远维持原话，而是能够说明何时、为何以及在哪一部分改变。']};
const sections=Object.entries(additions).map(([n,paragraphs])=>{
 const code=`14.${n}`,m=metadata.records.find(r=>r.sectionCode===code),next=metadata.records[Number(n)];
 // Exact source extraction retained only in private lineage, outside public projections.
 const start=m.sourcePage-1,end=next.sourcePage;
 const compact=s=>s.replace(/[ \t]/g,'');
 const raw=pages.slice(start,end).join('\n');
 const heading=`✦${m.titleZhHans}`,nextHeading=`✦${next.titleZhHans}`;
 const lines=raw.split('\n'),first=lines.findIndex(l=>compact(l).startsWith(heading));
 assert.ok(first>=0,code);let last=lines.findIndex((l,i)=>i>first&&compact(l).startsWith(nextHeading));if(last<0)throw Error('NEXT_SECTION_MISSING:'+code);
 const beforeRaw=lines.slice(first,last).join('\n');
 // Deduplicate repeated page headers; de-space typeset Chinese only for reader review.
 const before=beforeRaw.split('\n').filter((l,i)=>i===0||!compact(l).startsWith(heading)).map(l=>l.replace(/[ \t]+/g,'')).join('\n');
 const subheading=n==='71'?'◈ 传统读取系统究竟知道什么':null;
 const insertion=(subheading?subheading+'\n\n':'')+paragraphs.join('\n\n');
 return {sectionCode:code,nodeCode:`KN-B7-14-${String(n).padStart(3,'0')}`,title:m.titleZhHans,operation:'APPEND_TO_EXISTING_SECTION_DRAFT_NO_REPLACEMENT',beforeRaw,before,beforeRawDigest:hash(beforeRaw),beforeDigest:hash(before),addedSubheading:subheading,addedParagraphs:paragraphs,after:before+'\n\n'+insertion,newSectionDigest:hash(before+'\n\n'+insertion),insertionDigest:hash(insertion),publicPromotionAllowed:false};
});
write(`${dir}/editorial-sections-v1.json`,{status:'READY_FOR_HUMAN_REVIEW',privateEditorialArtifact:true,notForPublicRetrieval:true,sourceSha256:metadata.sourceSha256,extractionNormalization:'TYPESET_SPACE_REMOVAL_AND_REPEATED_HEADER_REMOVAL_FOR_LOCAL_REVIEW',sections});
const qa=[
['八字排盘算出来以后，为什么还不能直接说这就是我的现实？','071','八字排盘给出的是所选规则和输入之下的计算结果，不是你的个人现实事实。把命盘解释成关于你的说法，还需要核对生活经历、实际记录和反例；计算不等于解释，解释不等于证据，现实保留修正权。'],
['八字和占星都说同一件事，是不是就证明是真的？','065','八字和占星的说法一致，并不等于获得了独立证据。先查它们是否共享出生资料、同一段经历或解读时得到的提示，再核对实际记录；共同输入不等于独立证据，赞同次数不能替代现实验证。'],
['如果紫微和八字说法不同，哪一个错？','065','紫微和八字的说法不同，可能涉及不同范围、层次或条件，不能在缺少证据时强迫选出赢家。若两种说法在同一条件下仍互相矛盾，就核对输入、解释过程和实际记录；保留争议或未知，而不是把所有分歧都化解。'],
['Human Design 算出来的结构是不是事实？','071','Human Design 的结构可以在同一套声明规则和相同输入下得到确定的计算结果，但这只说明方法内的计算结构。由结构得出的解释仍有范围边界，个人现实需要实际证据验证；计算结果不能直接充当关于你的人生事实。'],
['传统系统存在几千年，是不是代表它一定正确？','071','传统延续很久，不等于拥有无限的解释权威，也不能保证每项主张都正确。历史、复杂程度、内部一致性和计算精度都不能取消反证、修订与未知；例如长期合作记录与某项解读不符时，解释需要重新检查，现实始终保留最终修正权。']
].map(([question,node,answer],i)=>({id:`METHOD-${i+1}`,question,nodeCode:`KN-B7-14-${node}`,answer,sourceSections:i===1||i===2?['14.65','14.66']:i===4?['14.71','14.72']:['14.71'],derivedSummary:true}));
const candidate=structuredClone(release.projections);
for(const code of ['065','071']){
 const node=candidate.nodes.find(n=>n.nodeCode===`KN-B7-14-${code}`),section=sections.find(s=>s.nodeCode===node.nodeCode);
 node.summary=code==='065'?'不同读取系统的计算、解释与现实验证具有不同权威；意见一致不能替代独立证据，分歧需要核对范围与实际记录。':'传统读取语言可以帮助提出候选解释；计算不等于解释，解释不等于证据或个人现实事实，现实保留最终修正权。';
 node.authorityDigest=hash(JSON.stringify({nodeCode:node.nodeCode,sectionDigest:section.newSectionDigest,status:'PENDING_HUMAN_REVIEW'}));
 const original=candidate.fragments.find(f=>f.nodeCode===node.nodeCode&&f.ordinal===1);original.text=node.summary;original.digest=hash(original.text);original.publicationStatus='PENDING_HUMAN_REVIEW';
 for(const test of qa.filter(t=>t.nodeCode===node.nodeCode)){
  const f={...original,fragmentCode:`B7-METHOD-R1-${test.id}`,ordinal:10+Number(test.id.split('-')[1]),text:test.answer,digest:hash(test.answer),questionScope:[test.question],epistemicEvidence:{sufficient:false,evidenceRefs:[`B7-METHOD-R1-${test.id}`],unknownReasons:['PERSONAL_REALITY_NOT_ESTABLISHED']}};
  candidate.fragments.push(f);
 const q={...candidate.questions.find(q=>q.nodeCode===node.nodeCode),nodeCode:node.nodeCode,question:test.question,questionCode:`B7-METHOD-R1-Q-${test.id}`};candidate.questions.push(q);
 const a={...candidate.aliases.find(a=>a.nodeCode===node.nodeCode),nodeCode:node.nodeCode,value:test.question,aliasCode:`B7-METHOD-R1-A-${test.id}`};candidate.aliases.push(a);
 }
}
write(`${dir}/derived-public-projection-candidate-v1.json`,{status:'PENDING_HUMAN_REVIEW',productionActivated:false,predecessor:{path:releasePath,sha256:hash(fs.readFileSync(releasePath))},affectedPublicNodes:['KN-B7-14-065','KN-B7-14-071'],referenceOnlyPreserved:['KN-B7-14-066','KN-B7-14-072'],projections:candidate});
write(`${dir}/acceptance-questions-v1.json`,{status:'CANDIDATE_ACCEPTANCE_QUESTIONS',cases:qa});
const successor={successorCode:'book-vii-method-epistemology-revision-successor-v1',work:'BOOK-VII-METHOD-EPISTEMOLOGY-REVISION-R1',status:'READY_FOR_HUMAN_REVIEW',predecessor:'KAP-BOOK-VII-PRODUCTION-ADMISSION-R1',predecessorManuscriptDigest:metadata.sourceSha256,predecessorProjection:{path:releasePath,sha256:hash(fs.readFileSync(releasePath))},affectedSectionCodes:sections.map(s=>s.sectionCode),affectedNodes:sections.map(s=>({nodeCode:s.nodeCode,beforeNodeSha256:hash(JSON.stringify(release.projections.nodes.find(n=>n.nodeCode===s.nodeCode))),newSectionDigest:s.newSectionDigest,candidateNodeSha256:hash(JSON.stringify(candidate.nodes.find(n=>n.nodeCode===s.nodeCode))),referenceOnly:['14.66','14.72'].includes(s.sectionCode)})),affectedPublicKnowledgeFragments:candidate.fragments.filter(f=>/065|071/.test(f.nodeCode)).map(f=>({fragmentCode:f.fragmentCode,sha256:f.digest})),unchangedNodes:release.projections.nodes.filter(n=>!sections.some(s=>s.nodeCode===n.nodeCode)).map(n=>({nodeCode:n.nodeCode,sha256:hash(JSON.stringify(n))})),noRenumbering:true,canonicalSectionCount:100,productionActivated:false,humanAcceptance:null,masterAExecuted:false,providerRequests:0,rawManuscriptInPublicCandidate:false,bookViiiAuthorityCreated:false,nextSteps:['Human Review','Human ACCEPT','Book VII method revision production successor','KAP affected-node refresh','MASTER A v2.0.0']};
write(`${dir}/book-vii-method-epistemology-revision-successor-v1.json`,successor);
console.log('Built four private editorial sections and two public-node candidates; no production activation or Human ACCEPT.');
