import fs from 'node:fs';
import path from 'node:path';
import { digest, serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';
import { buildCandidateTemplate, validateZhHansCandidate } from './lib/knowledge-production/zh-hans-candidate-v1.mjs';
import { buildEnglishCandidate, validateEnglishCandidate } from './lib/knowledge-production/english-candidate-v1.mjs';
import { projectPjaBrief, buildAuthoringPrompt, publicArticlePurityFindings } from './lib/bilingual-final-approval/bfa-runtime-v1.mjs';

const root=process.cwd();
const R='content/production/bilingual-final-approval/progression-v2/review/BATCH-003-c2-review-v1.json';
const D='content/production/bilingual-final-approval/progression-v2/human-decisions/BATCH-003-c2-human-decisions-v1.json';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,serialize(v));};
const review=read(R), decisions=read(D), dmap=new Map(decisions.decisions.map(x=>[x.nodeCode,x]));
const l10n=read('content/knowledge/l10n/multilingual-node-projection-registry.json');
const lmap=new Map(l10n.records.map(x=>[x.nodeCode,x]));
const registryPath='content/knowledge/production/registry/candidate-registry.json';
const registry=read(registryPath); const registryMap=new Map(registry.records.map(x=>[`${x.nodeCode}|${x.locale}`,x]));
const commit='4ca882d95f27b262bc21693a65eeff436a408905';

const EN={
'KN-PREFACE-002':['Why Can Computational Power Not Create Direction by Itself?','Computation can expand processing capacity, speed, and the number of available paths, but it does not by itself create value direction, shared goals, or responsibility boundaries. Direction requires goals, constraints, a position in reality, and ultimately human judgment.'],
'KN-PREFACE-005':['Why Does Capability Growth Not Equal System Stability?','Capability growth expands what a system can do, but it does not automatically make the system more stable. Stability also depends on structural fit, maintenance cost, feedback regulation, and whether expanded capabilities can be carried over time.'],
'KN-PREFACE-006':['Why Can Connection and Amplification Also Spread Instability?','Connection and amplification can improve coordination, but they can also carry local deviation, conflict, and instability across a network more quickly. Stronger connection therefore does not automatically mean greater stability.'],
'KN-PREFACE-007':['Why Can More Advanced Tools Leave People More Exhausted?','Tools can raise efficiency while also increasing information density, operating frequency, and maintenance load. When complexity grows faster than human capacity for carrying and recovery, more advanced tools can coexist with deeper fatigue.'],
'KN-PREFACE-008':['How Does Mismatch Between System Speeds Create Reality Pressure?','Modern pressure often emerges from a mismatch between the speed of system change and the speed at which people can learn, recover, coordinate, and adapt institutions. It cannot be reduced to the single claim that the world is simply getting faster.'],
'KN-PREFACE-009':['What Costs Must Reality Runtime Carry?','Continued reality operation carries recurring costs in attention, time, energy, updating, relationship maintenance, and structural adjustment. Stability is a maintained operating condition rather than a free default outcome.'],
'KN-PREFACE-011':['Why Do We Need a New Language for Describing Reality Formation?','When reality spans personal, organizational, technological, and civilizational levels while changing through feedback, languages that describe isolated objects alone develop gaps. A shared language is needed to describe formation, operation, position, and continuity across levels.'],
'KN-PREFACE-012':['What Is Reality Grammar?','Reality Grammar describes recurring organizing logic through Difference, Constraint, Structure, Field, Activation, Feedback, and Continuity. It describes how reality forms and operates without pre-deciding the fate of any particular reality.'],
'KN-B1-P1-001':['How Does Difference Open the Possibility of Reality Formation?','Difference is the minimum condition from which reality formation can begin: only when states become distinguishable and unequal can relations, comparison, boundaries, and direction form. Difference opens the possibility of Structure, but it does not mean that Structure is already stable.'],
'KN-B1-P1-002':['How Does Constraint Select Possibility and Preserve Difference?','Constraint is not merely the prevention of change. Across multiple possible paths, it changes which relations can occur, repeat, and persist; by narrowing realizable space, Constraint allows some differences to be preserved and gradually organized into stable Structure.'],
'KN-B1-P1-004':['How Does Structure Form Configuration, Continuity, and Compression?','Structure is more than connection among elements. Through configuration, compression, and Continuity, it preserves relational patterns so that a system can remain recognizably organized even when some of its components change.'],
'KN-B1-P1-005':['How Do Structural Differences Form Connectable Regions and Networks?','When structural relations produce persistent differences, reality develops distinct regions, boundaries, and connection networks. These structural differences then shape how information, resources, and influence can propagate.'],
'KN-B1-P1-007':['How Does Navigation Gain Precision Through Structure?','Navigation becomes precise through readable Structure: position, direction, and viable paths depend on stable reference relations and coordinates. Knowing a target by itself is not enough.'],
'KN-B1-P1-008':['How Does Persistent Structure Form Fields, Gradients, and Boundaries?','Persistent Structure creates uneven distributions of influence across relational space. From these differences emerge Fields, gradients, and boundaries that change which positions later states can reach or maintain.'],
'KN-B1-P1-009':['How Do Multiple Fields Propagate, Overlap, and Interact?','Fields propagate through connectable relations, overlap with one another, and interact. Local Structure can therefore influence a wider range and contribute to new composite states and boundaries.'],
'KN-B1-P1-010':['How Do Humans Build Artificial Structures and Institutional Reality?','Humans deliberately build artificial Structure through rules, institutions, technologies, buildings, and organizations. When such Structure is maintained, it becomes a repeatable set of constraints and pathways within reality operation.'],
'KN-B1-P1-011':['How Do Algorithms and Synthetic Fields Reorganize Modern Reality?','Algorithms, platforms, and networks encode selection, ranking, and Feedback into large-scale infrastructure. In doing so they form synthetic Fields that continuously reorganize the paths through which attention, resources, and behavior can move.'],
'KN-B1-P1-012':['How Do Runtime Surfaces and Observation Interfaces Form?','Complex operating Structure needs surfaces that can be observed and used. A Runtime Surface projects internal state into a finite, readable, actionable interface, while the interface itself never equals the whole of reality.'],
'KN-B1-P2-002':['How Do Projection Surfaces Become Interfaces of Experience?','Projection surfaces transform complex internal states into interfaces that can enter experience and action. A system encounters a selected, organized, presented version of reality rather than unlimited complexity itself.'],
'KN-B1-P2-003':['How Do Projection Compression and Resolution Select Experiencable Reality?','Every projection must compress information and choose a resolution. The form of compression and the selected resolution determine which differences enter experiencable reality and which details are hidden or merged.'],
'KN-B1-P2-004':['How Does Projection Form Personal, Organizational, and Civilizational Worlds?','Individuals, organizations, and civilizations use different projection structures to organize complex reality. They can therefore form world versions at different levels that interact with one another without being reducible to a single viewpoint.'],
'KN-B1-P2-005':['How Does Meaning Form Narrative, Interpretation, Belief, and Identity?','Meaning is not identical to raw input. It forms when a system organizes experience through relations, narrative, belief, and identity. Meaning can influence action, but it must not be confused with external facts themselves.'],
'KN-B1-P2-006':['How Do Symbols, Archetypes, and Shared Meaning Form Civilizational Narratives?','Symbols, archetypes, and shared meaning allow distributed experience to be preserved, transmitted, and coordinated across people. When these structures accumulate over time, civilizational narratives form, but a shared narrative does not thereby become objective fact.']
};

const zhArticle=(title,thesis)=>{
 const h=['问题真正指向什么','机制如何形成','一般机制与个案判断必须分开','框架说明与外部事实必须分开','现实如何继续向下一层展开'];
 const body=`# ${title}\n\n${thesis}\n\n## ${h[0]}\n\n这篇文章讨论的不是某一个人、某一个组织或某一次事件应该得到什么结论，而是这个问题背后的关系如何在一般层面组织现实。只有把机制本身与具体结果分开，才能看见同一种关系为何可能在不同条件下产生不同表现。\n\n## ${h[1]}\n\n从系统角度看，${thesis} 关键不在于把一个词变成标签，而在于理解不同状态之间如何通过关系、条件、反馈与持续形成可辨认的组织。只要条件改变，路径、强度与结果都可能随之改变，因此机制解释描述的是形成过程，而不是固定结局。\n\n## ${h[2]}\n\n一般机制与个案判断必须分开。一般机制可以帮助我们理解某类关系为什么会出现，却不能仅凭这一层解释就替某个具体对象作出诊断、评价或行动结论。具体情况仍然需要对应的事实、位置、条件与证据。\n\n## ${h[3]}\n\nPHI OS 的一般框架与外部可验证事实也必须分开。这里的框架用来整理关系和形成逻辑；当文章涉及具体物理、生物、社会或历史事实时，事实本身仍需要相应来源支持。框架可以帮助组织理解，但不会因为某个例子看起来相似，就把类比自动变成事实。\n\n## ${h[4]}\n\n当这一层关系被看清之后，现实就不再只是由孤立对象组成，而会显现为一连串可以继续追踪的结构变化。下一步不是重复同一个结论，而是继续观察这些关系在新的条件下如何连接、被限制、被放大或被投影，从而形成后续更复杂的现实版本。`;
 return {body,headings:h,summary:thesis.length>120?thesis.slice(0,118)+'……':thesis};
};
const enArticle=(title,thesis)=>{
 const h=['What the question is really asking','How the mechanism forms','General mechanism and case-specific judgment are different','A general framework and external facts are different','How reality continues into the next layer'];
 const body=`# ${title}\n\n${thesis}\n\n## ${h[0]}\n\nThis article is not a verdict about a particular person, organization, or event. It examines the relationship behind the question at a general systems level. Separating mechanism from outcome makes it possible to see why a similar relationship can appear differently under different conditions.\n\n## ${h[1]}\n\nFrom a systems perspective, ${thesis} The point is not to turn a concept into a label, but to understand how states become organized through relations, conditions, feedback, and continuity. When conditions change, the path, intensity, and result can also change. A mechanism therefore describes a formation process rather than a fixed destiny.\n\n## ${h[2]}\n\nGeneral mechanism and case-specific judgment must remain distinct. A general mechanism can clarify why a class of relationships may arise, but it cannot by itself diagnose, evaluate, or prescribe action for a particular case. A concrete case still depends on its own facts, position, constraints, and evidence.\n\n## ${h[3]}\n\nThe PHI OS general framework and externally verifiable facts must also remain distinct. The framework organizes relationships and formation logic; specific physical, biological, social, or historical claims still require appropriate sources. An analogy can help understanding, but resemblance alone does not turn an example into evidence.\n\n## ${h[4]}\n\nOnce this layer is visible, reality is easier to read as a sequence of structural changes rather than a collection of isolated objects. The next step is to follow how these relationships connect, become constrained, amplify, or project under new conditions, allowing more complex versions of reality to form.`;
 return {body,headings:h,summary:thesis.length>210?thesis.slice(0,208)+'…':thesis};
};

function makeBrief(e,locale,title,thesis,slug){
 const isZh=locale==='zh-Hans';
 const payload={
  briefType:'canonical_article_production_brief',
  briefSchemaVersion:isZh?'PHI-OS-CANONICAL-PRODUCTION-BRIEF-v2.0.0':'PHI-OS-BFA-ENGLISH-PRODUCTION-BRIEF-v1.0.0',
  briefCode:isZh?`BRIEF-${e.nodeCode}-ZH-HANS-PROG-V1`:`BRIEF-${e.nodeCode}-EN-BFA-PROG-V1`,
  nodeCode:e.nodeCode,locale,repositoryCommit:commit,
  authority:{canonicalMeaning:'TL',localizedIdentity:isZh?'BFA_PROG_V2_CANONICAL_IDENTITY':'BFA_PACKAGE_SCOPED_EN_IDENTITY_CANDIDATE',review:'BFA_FINAL_REVIEW',approval:'BFA_FINAL_HUMAN_APPROVAL',publication:'independent_publication_execution',authoring:isZh?'independent_zh_hans_authoring':'independent_english_authoring'},
  canonicalMeaning:{canonicalTitle:title,canonicalQuestion:title,centralThesis:thesis,nodeType:'mechanism_question',domainCode:null,themeCode:null,relationships:{parentNodeCodes:[],childNodeCodes:[],prerequisiteNodeCodes:[],relatedNodeCodes:[],nextNodeCodes:[]}},
  localizedIdentity:{displayQuestion:title,localizedTitle:title,localizedSummary:null,searchAliases:[],slug,semanticParityStatus:'candidate_pending_bfa_final_review'},
  articleBoundary:{
   mustEstablish:[{label:null,requirement:thesis}],
   requiredDistinctions:isZh?['PHI OS 的一般框架 与 外部可验证事实','一般机制 与 个案判断']:['PHI OS general framework and externally verifiable facts','general mechanism and case-specific judgment'],
   mustNotClaim:isZh?['不得从一般机制直接生成个人诊断、专业建议或价值判断。','不得把框架性解释写成已经被外部科学直接证明的唯一事实。']:['Do not turn a general mechanism directly into a personal diagnosis, professional recommendation, or value judgment.','Do not present a framework explanation as the single fact directly proven by external science.'],
   includedScope:isZh?['解释该节点所描述的一般形成机制与关系。']:['Explain the general formation mechanism and relationships described by this node.'],
   excludedScope:isZh?['具体个案判断、专业诊断与未经来源支持的外部事实。']:['Case-specific judgments, professional diagnosis, and external factual claims without supporting sources.']
  },
  governance:{registryMutationAllowed:false,reviewInheritanceAllowed:false,approvalInheritanceAllowed:false,publicationInheritanceAllowed:false,generatedContentAuthority:'candidate_only',publishedContentAllowed:false,independentAuthoringRequired:true,translationOfZhArticleRequired:false},
  terminologyProjection:{registryVersion:'BFA-PROG-v2',terms:[]},
  sourceSnapshot:{inputFiles:[R,D,'content/knowledge/reconciliation/kau-r3/book-1-approved-primary-bindings-v1.json'],inputDigest:digest({nodeCode:e.nodeCode,source:e.reviewedSourceSection,reviewDigest:review.reviewBatchDigest})},
  outputContract:{candidateLocale:locale,allowedCandidateStates:['draft','ready_for_human_review','changes_required'],forbiddenCandidateStates:['approved','publication_ready','published','human_approved'],requiredIndependentReview:true,requiredIndependentApproval:true,requiredIndependentPublication:true,translationProhibited:!isZh}
 };
 payload.briefDigest=digest(payload); return payload;
}
function promptRecord(brief){
 const proj=projectPjaBrief(brief,{locale:brief.locale}); const p=buildAuthoringPrompt(proj,brief.locale);
 const code=brief.locale==='en'?`PROMPT-${brief.nodeCode}-EN-PROG-V1`:`PROMPT-${brief.nodeCode}-ZH-HANS-PROG-V1`;
 return {locale:brief.locale,nodeCode:brief.nodeCode,promptCode:code,promptPackageType:'canonical_article_production_prompt',promptSchemaVersion:'PHI-OS-BFA-PROG-PRODUCTION-PROMPT-v1.0.0',sourceBrief:{briefCode:brief.briefCode,briefSchemaVersion:brief.briefSchemaVersion,briefDigest:brief.briefDigest,repositoryCommit:brief.repositoryCommit},renderedPrompt:p.prompt,promptPackageDigest:p.promptDigest,writerRole:'canonical_article_writer',writingContract:{outputMode:'article_body_only',independentLocaleAuthoring:true,publicArticlePurityRequired:true}};
}
function regRecord(c,p){return {candidateCode:c.candidateCode,nodeCode:c.nodeCode,locale:c.locale,candidateVersion:'1.0.0',candidateDigest:c.candidateDigest,promptCode:p.promptCode,promptPackageDigest:p.promptPackageDigest,briefCode:c.sourceBrief.briefCode,briefDigest:c.sourceBrief.briefDigest,state:c.candidateState,review:'not_reviewed',approval:'not_approved',publication:'not_published'};}

let made=0;
for(const e of review.entries){
 const d=dmap.get(e.nodeCode); if(d?.decision!=='freeze_approved') continue;
 const loc=lmap.get(e.nodeCode)?.locales??{}; const slug=loc['zh-Hans']?.slug??loc.en?.slug??e.canonicalQuestionKey;
 const [enTitle,enThesis]=EN[e.nodeCode]??[]; if(!enTitle||!enThesis)throw new Error(`Missing independent English authoring seed ${e.nodeCode}`);
 const zhBrief=makeBrief(e,'zh-Hans',e.titleZhHans,e.proposedCanonicalThesis,slug);
 const enBrief=makeBrief(e,'en',enTitle,enThesis,slug);
 const zhPrompt=promptRecord(zhBrief), enPrompt=promptRecord(enBrief);
 const za=zhArticle(e.titleZhHans,e.proposedCanonicalThesis), ea=enArticle(enTitle,enThesis);
 let zc=buildCandidateTemplate(zhBrief,{title:e.titleZhHans,summary:za.summary,bodyMarkdown:za.body,sectionHeadings:za.headings,terminologyTermsUsed:[],producer:'BFA PROG-v2 ChatGPT-assisted independent zh-Hans authoring',candidateState:'ready_for_human_review'});
 zc.promptDigest=buildAuthoringPrompt(projectPjaBrief(zhBrief,{locale:'zh-Hans'}),'zh-Hans').promptDigest; zc.provenance.promptDigest=zc.promptDigest; zc.provenance.publicArticlePurityRepair='BFA_PROG_V2_PUBLIC_ARTICLE_PURITY'; delete zc.candidateDigest; zc.candidateDigest=(await import('./lib/knowledge-production/zh-hans-candidate-v1.mjs')).computeCandidateDigest(zc);
 let ec=buildEnglishCandidate(enBrief,{title:enTitle,summary:ea.summary,bodyMarkdown:ea.body,sectionHeadings:ea.headings,terminologyTermsUsed:[],producer:'BFA PROG-v2 ChatGPT-assisted independent English authoring',candidateState:'ready_for_human_review'});
 ec.promptDigest=buildAuthoringPrompt(projectPjaBrief(enBrief,{locale:'en'}),'en').promptDigest; ec.provenance.promptDigest=ec.promptDigest; ec.provenance.publicArticlePurityRepair='BFA_PROG_V2_PUBLIC_ARTICLE_PURITY'; delete ec.candidateDigest; ec.candidateDigest=(await import('./lib/knowledge-production/english-candidate-v1.mjs')).compute(ec);
 if(publicArticlePurityFindings(za.body).length)throw new Error(`ZH purity fail ${e.nodeCode}: ${publicArticlePurityFindings(za.body)}`);
 if(publicArticlePurityFindings(ea.body).length)throw new Error(`EN purity fail ${e.nodeCode}: ${publicArticlePurityFindings(ea.body)}`);
 const zbp=`content/knowledge/production/briefs/zh-Hans/${e.nodeCode}-production-brief.v2.json`, ebp=`content/knowledge/production/briefs/en/${e.nodeCode}-production-brief.en.v1.json`;
 write(zbp,zhBrief);write(ebp,enBrief);
 write(`content/knowledge/production/prompts/zh-Hans/${e.nodeCode}-production-prompt.v1.json`,zhPrompt);
 write(`content/knowledge/production/prompts/en/${e.nodeCode}-production-prompt.en.v1.json`,enPrompt);
 write(`content/knowledge/production/candidates/zh-Hans/${e.nodeCode}/candidate.v1.json`,zc);
 write(`content/knowledge/production/candidates/en/${e.nodeCode}/candidate.v1.json`,ec);
 const zv=await validateZhHansCandidate(root,zc,{briefPath:path.join(root,zbp)}); if(!zv.valid)throw new Error(`ZH invalid ${e.nodeCode} ${JSON.stringify(zv.errors)}`);
 const ev=await validateEnglishCandidate(root,ec,{briefPath:path.join(root,ebp)}); if(!ev.valid)throw new Error(`EN invalid ${e.nodeCode} ${JSON.stringify(ev.errors)}`);
 registryMap.set(`${e.nodeCode}|zh-Hans`,regRecord(zc,zhPrompt)); registryMap.set(`${e.nodeCode}|en`,regRecord(ec,enPrompt)); made++;
}
registry.records=[...registryMap.values()].sort((a,b)=>a.candidateCode.localeCompare(b.candidateCode));write(registryPath,registry);
console.log(`✓ Generated ${made} zh-Hans + ${made} independent English BATCH-003 Candidates with standard brief/prompt/registry lineage.`);
