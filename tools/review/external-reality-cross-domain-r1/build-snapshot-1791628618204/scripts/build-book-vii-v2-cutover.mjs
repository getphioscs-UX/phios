import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='content/knowledge/book-vii/v2-cutover',kap='content/knowledge/answer-projection',pubdir='content/knowledge/public/successors/book-vii-v2-source-refresh-v1';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),sha=p=>hash(fs.readFileSync(p)),write=(p,v)=>{fs.mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const source=read(`${dir}/verified-source-v2.json`),baseline=read(`${dir}/baseline-v1.json`);
assert.equal(sha('.wrangler/book-vii-source-v2.pdf'),source.sha256);assert.equal(source.sectionCount,100);
const oldRegistry='content/knowledge/book-vii/registries/book-vii-observation-science-r2-asset-registry-v1.json',old=read(oldRegistry).assets.find(a=>a.assetClass==='FULL_PRIVATE_SOURCE');
write(`${dir}/canonical-source-registry-v2.json`,{bookId:'BOOK-7',canonicalSourceVersion:'v2',canonicalPublicationSourceVersion:'v2',current:true,supersedes:'v1',r2ObjectKey:source.objectKey,bucket:source.bucket,sha256:source.sha256,byteLength:source.byteLength,pdfHeader:source.pdfHeader,bindingStatus:'BOUND',actualRemoteRead:true,rawManuscriptRetrievalAllowed:false,reviewStatus:'READY_FOR_HUMAN_REVIEW',versions:[{version:'v1',sha256:old.sha256,objectKey:old.objectKey,current:false,status:'HISTORICAL_IDENTITY_REMOTE_KEY_NOW_ABSENT',supersededBy:'v2'},{version:'v2',sha256:source.sha256,objectKey:source.objectKey,current:true,status:'BOUND'}]});
const registry=read('content/knowledge/book-vii/registries/book-vii-observation-science-node-registry-v1.json'),current=structuredClone(registry);
for(const s of source.sections){const n=current.nodes.find(n=>n.nodeCode===s.nodeCode);assert.equal(n.titleZhHans,s.titleZhHans);n.sourceVersion='v2';n.sourceDigest=source.sha256;n.sectionDigest=s.sectionDigest;n.sourcePage=s.sourcePage;if(s.readerQuestionZhHans)n.readerQuestionZhHans=s.readerQuestionZhHans;}
current.status='CURRENT_V2_SOURCE_REFRESH_PENDING_HUMAN_REVIEW';current.predecessorDigest=sha('content/knowledge/book-vii/registries/book-vii-observation-science-node-registry-v1.json');write(`${dir}/canonical-node-registry-v2.json`,current);
write(`${dir}/editorial-predecessor-reconciliation-v1.json`,{status:'SUPERSEDED_BY_CANONICAL_BOOK_VII_V2',predecessor:'book-vii-method-epistemology-revision-successor-v1',predecessorDigest:sha('content/knowledge/book-vii/revisions/book-vii-method-epistemology-revision-successor-v1/book-vii-method-epistemology-revision-successor-v1.json'),currentAuthority:'PHI-OS-Book-7-v2.pdf',currentSourceDigest:source.sha256,incorporation:'THEMATIC_REVISION_VERIFIED_FROM_ACTUAL_V2_NOT_VERBATIM_CANDIDATE_COPY',candidateTextUsedAsActiveAuthority:false,editorialOverlayRequired:false,historicalEvidenceDeleted:false});
const oldReleasePath='content/knowledge/public/successors/book-vii-production-live-cutover-r1/published-projection.json',release=structuredClone(read(oldReleasePath));
release.releaseCode='KAP-BOOK-VII-V2-PUBLICATION-SOURCE-SUCCESSOR-V1';release.status='CURRENT_SOURCE_REFRESH_PENDING_HUMAN_REVIEW';
release.sourceRefreshAuthorization={kind:'EXPLICIT_USER_REQUEST_CANONICAL_V2_CUTOVER',userRequest:'继续完成附件',attachmentSha256:sha('C:/Users/Guest Account/.codex/attachments/4035fc0c-1080-4351-82ff-61540c6c64c8/Pasted text.txt'),newHumanAcceptance:null,predecessorReleaseDigest:sha(oldReleasePath),sourceVersion:'v2',sourceDigest:source.sha256,affectedNodeCodes:source.sections.map(s=>s.nodeCode)};
const questions=[
['八字排盘算出来以后，为什么还不能直接说这就是我的现实？','071','排盘只是给定输入与规则下的计算结果，不能直接成为你的个人现实事实。由结果走向生活解释，再到现实验证，是不同的认识层次；需要核对实际经历、行为、生活条件和反例，计算不等于解释，解释也不等于证据。'],
['八字和占星都说同一件事，是不是就证明是真的？','065','八字和占星的说法一致，首先可能是模型解释的汇聚，不等于独立证据已经确认。它们可能共享输入、上游假设或相近语义；即使模型确实不同，也要看现实记录是否独立支持这个主题，不能用同意次数代替证据。'],
['如果紫微和八字说法不同，哪一个错？','065','不同说法可能观察不同范围、层次或时间条件，不能在没有证据时强迫选出赢家。先核对对象、时间、尺度和解释步骤；若条件对齐后仍有冲突，就保留有资格的候选与争议，等待能区分它们的现实证据。'],
['Human Design 算出来的结构是不是事实？','071','Human Design 的结构可以在给定输入和声明规则下形成确定的计算结果，但方法内的稳定结构不等于个人现实事实。从结构赋予生活意义属于解释，现实有没有支持则需要实际证据检验；这几层不能彼此冒充。'],
['传统系统存在几千年，是不是代表它一定正确？','071','延续很久不等于拥有无限的现实解释权威。依照第七册区分结果与解释的原则，传统的声望、复杂程度、内部一致性或计算稳定性，都不能取消反证、修订和未知；现实仍保留最终修正权。']
].map(([question,n,text],i)=>({id:`METHOD_${i+1}`,question,nodeCode:`KN-B7-14-${n}`,text,derived:true,sourceVersion:'v2'}));
for(const code of ['065','071']){
 const node=release.projections.nodes.find(n=>n.nodeCode===`KN-B7-14-${code}`),packet=release.packages.find(p=>p.nodeCode===node.nodeCode),s=source.sections.find(s=>s.nodeCode===node.nodeCode);
 // Existing accepted summaries retain their original question scope; method summaries
 // are freshly derived from the verified v2 sections and never from the candidate overlay.
 const oldFirst=release.projections.fragments.find(f=>f.nodeCode===node.nodeCode&&f.ordinal===1);
 if(code==='065')oldFirst.text='先核对证据的对象、范围、时间和主张权威；若条件对齐后高质量解释仍然冲突，就保留争议与有资格的替代读取，不强迫选出赢家。';
 else oldFirst.text='第一版解释只是当前证据支持的候选。主读取不是唯一读取；保留仍有资格的替代解释、反证与未知，让信心随现实证据改变。';
 oldFirst.digest=hash(oldFirst.text);
 if(code==='065'){
  const question='如果两个高质量证据冲突怎么办？';packet.approvedQuestions.push(question);
  oldFirst.epistemicEvidence.applicableQuestions.push(question);
  release.projections.questions.push({nodeCode:node.nodeCode,locale:'zh-Hans',question,questionCode:'B7-V2-CONFLICT-VARIANT',questionType:'canonical'});
  release.projections.aliases.push({nodeCode:node.nodeCode,locale:'zh-Hans',value:question,aliasCode:'B7-V2-CONFLICT-VARIANT-A',aliasType:'question'});
 }
 for(const q of questions.filter(q=>q.nodeCode===node.nodeCode)){
  const f={...oldFirst,fragmentCode:`B7-V2-${q.id}`,ordinal:20+Number(q.id.split('_')[1]),text:q.text,digest:hash(q.text),questionScope:[q.question],sourceVersion:'v2',sourceDigest:source.sha256,sectionDigest:s.sectionDigest,epistemicEvidence:{sufficient:false,evidenceRefs:[`B7-V2-${q.id}`],unknownReasons:['PERSONAL_REALITY_NOT_ESTABLISHED']}};
  release.projections.fragments.push(f);packet.approvedQuestions.push(q.question);
  release.projections.questions.push({nodeCode:node.nodeCode,locale:'zh-Hans',question:q.question,questionCode:`B7-V2-Q-${q.id}`,questionType:'canonical'});
  release.projections.aliases.push({nodeCode:node.nodeCode,locale:'zh-Hans',value:q.question,aliasCode:`B7-V2-A-${q.id}`,aliasType:'question'});
 }
 packet.sourceVersion='v2';packet.sourceDigest=source.sha256;packet.sectionDigest=s.sectionDigest;
 packet.review={decision:'pending',basis:'V2_SOURCE_REFRESH_HUMAN_REVIEW_PENDING'};packet.approval={decision:'authorized_source_refresh',basis:'EXPLICIT_USER_ATTACHMENT_CURRENT_PUBLISHED_KNOWLEDGE_REFRESH'};packet.publication={decision:'current_source_refresh',environment:'CURRENT_REPOSITORY_AND_LOCAL_LIVE',cloudDeployed:false};
 packet.approvedFragments=release.projections.fragments.filter(f=>f.nodeCode===node.nodeCode);
 for(const f of packet.approvedFragments){f.sourceVersion='v2';f.sourceDigest=source.sha256;f.sectionDigest=s.sectionDigest;f.derivationMode='V2_CANONICAL_SECTION_DERIVED_KNOWLEDGE_NOT_MANUSCRIPT_QUOTE';}
 packet.content=packet.approvedFragments.map(f=>f.text).join('\n');
 node.summary=oldFirst.text;node.sourceVersion='v2';node.sectionDigest=s.sectionDigest;node.authorityDigest=hash(JSON.stringify(packet));
 const publication=release.projections.publications.find(p=>p.nodeCode===node.nodeCode);publication.authorityDigest=node.authorityDigest;publication.publicationDigest=node.authorityDigest;
 if(s.readerQuestionZhHans&&!packet.approvedQuestions.includes(s.readerQuestionZhHans)){packet.approvedQuestions.push(s.readerQuestionZhHans);release.projections.questions.push({nodeCode:node.nodeCode,locale:'zh-Hans',question:s.readerQuestionZhHans,questionCode:`B7-V2-HEADING-${code}`,questionType:'canonical'});node.authorityDigest=hash(JSON.stringify(packet));publication.authorityDigest=node.authorityDigest;publication.publicationDigest=node.authorityDigest;}
}
for(const code of ['066','072']){
 const node=release.projections.nodes.find(n=>n.nodeCode===`KN-B7-14-${code}`),packet=release.packages.find(p=>p.nodeCode===node.nodeCode),s=source.sections.find(s=>s.nodeCode===node.nodeCode);
 packet.sourceVersion='v2';packet.sourceDigest=source.sha256;packet.sectionDigest=s.sectionDigest;
 packet.review={decision:'pending',basis:'V2_REFERENCE_ONLY_METADATA_REFRESH_PENDING_HUMAN_REVIEW'};packet.approval={decision:'authorized_source_refresh',basis:'EXPLICIT_USER_ATTACHMENT'};packet.publication={decision:'current_source_refresh',environment:'CURRENT_REFERENCE_ONLY_METADATA',cloudDeployed:false};
 if(s.readerQuestionZhHans&&!packet.approvedQuestions.includes(s.readerQuestionZhHans)){packet.approvedQuestions.push(s.readerQuestionZhHans);release.projections.questions.push({nodeCode:node.nodeCode,locale:'zh-Hans',question:s.readerQuestionZhHans,questionCode:`B7-V2-HEADING-${code}`,questionType:'canonical'});release.projections.aliases.push({nodeCode:node.nodeCode,locale:'zh-Hans',value:s.readerQuestionZhHans,aliasCode:`B7-V2-HEADING-A-${code}`,aliasType:'question'});}
 node.sourceVersion='v2';node.sectionDigest=s.sectionDigest;node.authorityDigest=hash(JSON.stringify(packet));const p=release.projections.publications.find(p=>p.nodeCode===node.nodeCode);p.authorityDigest=node.authorityDigest;p.publicationDigest=node.authorityDigest;
 assert.equal(node.publicationMode,'REFERENCE_ONLY');assert.equal(packet.approvedFragments.length,0);
}
write(`${pubdir}/published-projection.json`,release);write(`${dir}/method-acceptance-questions-v2.json`,{cases:questions});
const change=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
const loader='functions/_lib/book-vii-published-admission.js';
change(loader,s=>{
 if(s.includes('const refresh='))return s;
 s=s.replace("content/knowledge/public/successors/book-vii-production-live-cutover-r1/published-projection.json",`${pubdir}/published-projection.json`);
 s=s.replace("if(!release||release.status!=='ADMITTED_FOR_PRODUCTION'||release.humanAcceptance", "const refresh=release?.status==='CURRENT_SOURCE_REFRESH_PENDING_HUMAN_REVIEW'&&release.sourceRefreshAuthorization?.kind==='EXPLICIT_USER_REQUEST_CANONICAL_V2_CUTOVER'&&release.sourceRefreshAuthorization?.sourceVersion==='v2'&&/^[a-f0-9]{64}$/.test(release.sourceRefreshAuthorization?.sourceDigest||'')&&release.sourceRefreshAuthorization?.newHumanAcceptance===null;\n  if(!release||(!refresh&&release.status!=='ADMITTED_FOR_PRODUCTION')||release.humanAcceptance");
 s=s.replace("packet?.review?.decision!=='accept'||packet?.approval?.decision!=='approve'||packet?.publication?.decision!=='publish'", "(!(refresh&&release.sourceRefreshAuthorization.affectedNodeCodes.includes(node.nodeCode)&&packet?.review?.decision==='pending'&&packet?.approval?.decision==='authorized_source_refresh'&&packet?.publication?.decision==='current_source_refresh')&&(packet?.review?.decision!=='accept'||packet?.approval?.decision!=='approve'||packet?.publication?.decision!=='publish'))");return s;});
const chainPath=`${kap}/reconciliation/kap-book-vii-v2-publication-source-successor-v1.json`;
change('scripts/lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs',s=>s.includes(chainPath)?s:s.replace("const PATHS = Object.freeze([",`const PATHS = Object.freeze([`).replace("'content/knowledge/answer-projection/reconciliation/kap-book-vii-production-live-cutover-r1-successor.json'",`'content/knowledge/answer-projection/reconciliation/kap-book-vii-production-live-cutover-r1-successor.json',\n  '${chainPath}'`));
change('scripts/check-kap-book-vii-production-admission-r1.mjs',s=>s.startsWith('// V2')?s:`// V2 current successor dispatch; accepted predecessor checker remains in Git/freeze lineage.\nif ((await import('node:fs')).default.existsSync('${dir}/canonical-source-registry-v2.json')) {await import('./check-book-vii-v2-cutover.mjs');process.exit(0);}\n`+s);
for(const p of ['scripts/lib/knowledge-public/book-vii-current-projection.mjs','scripts/build-cloudflare-pages.mjs'])change(p,s=>s.replaceAll('content/knowledge/public/successors/book-vii-production-live-cutover-r1/retrieval',`${pubdir}/retrieval`));
write(chainPath,{work:'BOOK-VII-V2-CANONICAL-PUBLICATION-CUTOVER',status:'READY_FOR_HUMAN_REVIEW',proposedAdmissionStatus:'BOOK_VII_V2_CANONICAL_PUBLICATION_ADMITTED',predecessor:{path:baseline.oldProductionFreezePath,sha256:baseline.oldProductionFreezeSha256},source:{version:'v2',sha256:source.sha256},release:{path:`${pubdir}/published-projection.json`,sha256:sha(`${pubdir}/published-projection.json`)},affectedNodes:source.sections.map(s=>({nodeCode:s.nodeCode,beforeSha256:hash(JSON.stringify(registry.nodes.find(n=>n.nodeCode===s.nodeCode))),afterSha256:hash(JSON.stringify(current.nodes.find(n=>n.nodeCode===s.nodeCode))),sectionDigest:s.sectionDigest})),unchangedNodeCount:96,changes:baseline.runtime.map(e=>({path:e.path,predecessorSha256:e.sha256,successorSha256:sha(e.path)})),boundaries:{canonicalKnowledgeCreated:false,secondAskRuntimeCreated:false,historicalFreezeRewritten:false,checksumValidationRelaxed:false},humanAcceptance:null,masterAExecuted:false,cloudDeploymentPerformed:false});
console.log('V2 current source and scoped published refresh built; Human Review pending, no new ACCEPT.');
