import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { digest, serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';
import { approvalIsCurrent } from './lib/bilingual-final-approval/bfa-runtime-v1.mjs';
import { packagePath, approvalPath } from './lib/bilingual-final-approval/bfa-review-store-v1.mjs';

const root=process.cwd();
const batch='BATCH-005';
const P='content/production/bilingual-final-approval/progression-v2';
const contentRel=`${P}/composition-production/${batch}-article-composition-content-v1.json`;
const unitsRel=`${P}/composition/article-composition-unit-registry-v1.json`;
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,v)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,serialize(v));};
const exists=rel=>fs.existsSync(path.join(root,rel));

if(!exists(contentRel)||!exists(unitsRel))throw new Error('BATCH005_COMPOSITION_SOURCE_MISSING');
const source=read(contentRel),reg=read(unitsRel);
const units=reg.articleUnits.filter(x=>x.batchCode===batch);
const byCode=new Map(units.map(x=>[x.articleUnitCode,x]));
const approved=new Set();
const approvalSnapshot=new Map();
for(const unit of units){
  const pRel=packagePath(batch,unit.anchorNodeCode),aRel=approvalPath(batch,unit.anchorNodeCode);
  if(!exists(pRel)||!exists(aRel))continue;
  const pkg=read(pRel),approval=read(aRel);
  if(approval.decision==='approve_for_publication'&&approvalIsCurrent(approval,pkg)){
    approved.add(unit.articleUnitCode);
    approvalSnapshot.set(unit.articleUnitCode,{finalPackageDigest:pkg.finalPackageDigest,approvalDigest:approval.authorityDigest,packageBytes:fs.readFileSync(path.join(root,pRel)),approvalBytes:fs.readFileSync(path.join(root,aRel))});
  }
}

const zhIntro1='第二册《世界如何运行》开始把第一册建立的现实形成结构推进到持续运行层。这里关注的不是把意识、情绪、自我、关系或群体当成孤立对象，而是观察它们如何在时间中互相生成、互相限制，并把一次状态转化成下一次运行的条件。';
const zhIntro2='这里不追求把每个索引节点拆成一篇薄文章，而是把相邻机制重新连成较完整的运行解释。这篇文章整合 5 个相邻 Canonical Nodes。它们共同回答一个更完整的问题：当现实已经形成，系统如何选择一部分现实进入当前运行，又如何把体验、关系或共同状态继续维持、修正并传递下去。';
const enIntro1='Volume II, *Reality Runtime*, moves from the formation of reality into the question of how formed reality continues to operate. Consciousness, emotion, self, relationship, and collective state are treated here not as isolated objects but as linked runtime processes that select, stabilize, constrain, and hand conditions forward through time.';
const enIntro2='The aim is depth through composition rather than one thin article per indexed node. This article composes 5 adjacent Canonical Nodes into one mechanism chain. Together they ask a larger question: once reality has formed, how does a system admit only part of it into current operation, turn that into experience or shared state, and then preserve, revise, or transmit the result?';

function leadZh(unit,article){
  const hs=(article.headings??[]).slice(0,5); const first=hs[0]??article.title,last=hs.at(-1)??article.title;
  const relational=unit.partCodes.includes('P6');
  if(relational)return `共同现实并不是多个个体状态的简单相加。围绕「${article.title}」，更重要的是追踪连接怎样改变每个参与者可以感知、回应与承担的条件：从「${first}」开始，关系会逐步形成共同节奏、边界与反馈，并在「${last}」处留下可以继续影响下一轮互动的状态。\n\n因此，这里的重点不是替关系贴上固定标签，而是看清共同运行如何被建立、维持、放大或打断。一个环节的变化可能重新分配注意、责任与资源，也可能改变之后更容易出现的反应。把这些变化连起来，才能理解关系为何具有连续性，也为何同一段关系会随着条件改变而出现不同版本。`;
  return `体验并不是现实的完整副本，而是系统在有限注意、记忆与行动能力下形成的可运行版本。围绕「${article.title}」，需要追踪的不是一个孤立概念，而是「${first}」如何改变当前状态，随后各层机制怎样选择、稳定或重新组织体验，并最终在「${last}」处形成下一轮运行可以继承的条件。\n\n这样的连续关系让意识、情绪、自我与行动不再只是并列标签。某个状态被看见以后，会改变什么值得注意；被重复以后，会影响预测和选择；被稳定以后，又可能成为新的惯性。真正需要理解的是这些机制如何彼此传递条件，以及反馈出现时，系统还有哪些重新配置的可能。这样的观察也能帮助区分短暂波动与已经进入持续运行的结构性变化。`;
}
function leadEn(unit,article){
  const hs=(article.headings??[]).slice(0,5); const first=hs[0]??article.title,last=hs.at(-1)??article.title;
  const relational=unit.partCodes.includes('P6');
  if(relational)return `Shared reality is not the simple addition of several independent states. In “${article.title},” the important question is how connection changes what each participant can notice, answer, carry, and expect. Beginning with ${first}, interaction develops shared rhythms, boundaries, and feedback, while ${last} shows how an established relational state can become a condition for what happens next.\n\nThe point is therefore not to attach a permanent label to a relationship. It is to trace how a shared runtime is formed, maintained, amplified, interrupted, and sometimes reorganized. A shift in one layer can redistribute attention, responsibility, or resources and thereby change which responses become easier later. Read as a continuous process, relationship becomes something that can change version as its operating conditions change.`;
  return `Experience is not a complete copy of reality. It is a workable version formed under limits of attention, memory, representation, and action. In “${article.title},” the useful task is to trace how ${first} changes the present configuration, how the intermediate mechanisms select or stabilize what can be carried forward, and how ${last} creates conditions that the next cycle of runtime may inherit.\n\nThis continuity matters because consciousness, emotion, self-model, and action are not merely neighboring labels. What becomes visible changes what can be evaluated; what repeats influences prediction and selection; what stabilizes may later become either support or inertia. The deeper question is how these mechanisms hand conditions to one another and where feedback still allows the runtime to reorganize.`;
}
function repairBody(lang,unit,article){
  let body=article.body;
  const existingMeta=lang==='zh'?/(Canonical Nodes?|Article Composition|索引节点|这篇文章整合|第二册《世界如何运行》开始把第一册)/i:/(Canonical Nodes?|Article Composition|indexed node|This article composes|depth through composition|Volume II, \*Reality Runtime\*, moves)/i;
  if(!existingMeta.test(body))return body;
  const titleLine=body.split('\n\n')[0];
  const intro=lang==='zh'?leadZh(unit,article):leadEn(unit,article);
  const remove=[lang==='zh'?zhIntro1:enIntro1,lang==='zh'?zhIntro2:enIntro2];
  for(const r of remove)body=body.replace(`${r}\n\n`,'').replace(r,'');
  if(lang==='zh'){
    body=body.replace('这一组机制之所以适合放在同一篇文章中，是因为它们并不是随机相邻，而是共同描述一次运行如何发生转折。','把这些机制连起来看，可以看到一次运行如何发生转折。');
    body=body.replace('这样阅读时，单个节点不再只是一个问题，而成为前后状态之间的转换位置。','这样，前后状态之间的转换关系会变得更清楚。');
    body=body.replace('Article Composition 的作用不是制造固定公式，而是把原本分散的 Canonical Nodes 重新放回一条可以比较、追踪和验证的关系链。','这里的目的不是制造固定公式，而是把分散的机制重新放回一条可以比较、追踪和验证的关系链。');
  }else{
    body=body.replace('These mechanisms belong in one article because they describe a transition rather than a random collection of adjacent topics.','Read together, these mechanisms describe a transition rather than a random collection of topics.');
    body=body.replace('The sequence turns each Canonical Node into a relational position between a prior and a later state.','The sequence makes the relation between prior and later states easier to trace.');
    body=body.replace('Article Composition is not intended to manufacture a universal formula. Its purpose is to reconnect separately indexed Canonical Nodes into a mechanism chain that can be compared, traced, and tested against a concrete reality.','The purpose is not to manufacture a universal formula, but to reconnect the mechanisms into a chain that can be compared, traced, and tested against a concrete reality.');
  }
  body=body.replace(/^# .*?\n\n/s,`${titleLine}\n\n${intro}\n\n`);
  const forbidden=lang==='zh'?/(Canonical Nodes?|Article Composition|索引节点|这篇文章整合)/i:/(Canonical Nodes?|Article Composition|indexed node|This article composes|depth through composition)/i;
  if(forbidden.test(body))throw new Error(`BATCH005_META_TEXT_REMAINS:${unit.articleUnitCode}:${lang}`);
  return body.replace(/\n{3,}/g,'\n\n').trim()+'\n';
}

let changed=0;
for(const [code,c] of Object.entries(source.content)){
  const unit=byCode.get(code); if(!unit)continue;
  if(approved.has(code))continue;
  c.zh.body=repairBody('zh',unit,c.zh);
  c.en.body=repairBody('en',unit,c.en);
  changed++;
}
source.contentDigest=`sha256:${digest(source.content)}`;
source.repair={schemaVersion:'PHI-OS-BFA-BATCH005-PUBLIC-META-INTRO-REPAIR-v1.0.0',mode:'APPROVAL_AWARE_NON_DESTRUCTIVE',approvedArticleUnitsPreserved:[...approved].sort(),repairedArticleUnitCount:changed,publicBodyForbiddenMeta:['Canonical Node','Canonical Nodes','Article Composition','索引节点','This article composes','depth through composition'],approvedLegacyException:'Current TL-approved packages are preserved byte-for-byte by explicit user decision.'};
write(contentRel,source);

const run=spawnSync(process.execPath,['scripts/generate-bfa-composition-batch.mjs','--batch',batch],{cwd:root,stdio:'inherit'});
if(run.status!==0)process.exit(run.status??1);
for(const [code,snap] of approvalSnapshot){
  const unit=byCode.get(code),pRel=packagePath(batch,unit.anchorNodeCode),aRel=approvalPath(batch,unit.anchorNodeCode);
  const pkg=read(pRel),approval=read(aRel);
  if(!approvalIsCurrent(approval,pkg)||pkg.finalPackageDigest!==snap.finalPackageDigest||approval.authorityDigest!==snap.approvalDigest)throw new Error(`APPROVED_PACKAGE_CHANGED:${code}`);
  if(!fs.readFileSync(path.join(root,pRel)).equals(snap.packageBytes)||!fs.readFileSync(path.join(root,aRel)).equals(snap.approvalBytes))throw new Error(`APPROVED_BYTES_CHANGED:${code}`);
}
const overlay=spawnSync(process.execPath,['scripts/apply-article-editorial-revisions.mjs'],{cwd:root,stdio:'inherit'});
if(overlay.status!==0)process.exit(overlay.status??1);
console.log(`✓ BATCH-005 approval-aware public composition repair completed: ${changed} unapproved Article Units repaired; ${approved.size} current TL-approved Article Units preserved byte-for-byte.`);
console.log('✓ Approved historical packages remain immutable; governed public editorial overlays remove legacy production metadata from customer-facing bodies.');
