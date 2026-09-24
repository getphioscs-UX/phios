import fs from 'node:fs';
import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {buildEcrHumanRuntimeReport} from '../functions/ecr-full-report/ecr-human-runtime-report-v4-1.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,x)=>{fs.mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
const base='content/embodied-configuration/v4-1/admission/';
// Preparation is idempotent and must not overwrite any subsequent human decision.
const prepare=(name,data)=>{if(!fs.existsSync(base+name))write(base+name,data);};
prepare('ecr-semantic-runtime-owner-admission-v1.json',{
 schemaVersion:'ECR-V4.1A-SEMANTIC-OWNER-ADMISSION-v1',status:'PENDING',mappings:[],
 requiredMappingFields:['mappingId','sourceIdentityRef','sourceClass','primaryOwner','secondaryOwners','scope','birthOrDesignRole','driverRole','phiCompositionRuleRef','evidenceRefs','humanReviewRef','customerMeaningAllowed','provenance','status'],
 allowedStatuses:['PENDING','ACCEPTED','REVISED','REJECTED','UNKNOWN'],
 rule:'Use deepest justified owner; multiple owners require primary/secondary rationale. Source coverage is not admission.',customerMeaningAllowed:false});
const deck=read('content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json');
prepare('ecr-phi-card-runtime-slot-candidates-v1.json',{
 schemaVersion:'ECR-V4.1A-CARD-SLOT-CANDIDATES-v1',status:'PENDING',
 slots:['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY'],
 cards:deck.cards.map(c=>({cardId:c.cardId,predecessorGroup:c.groupId,candidateRuntimeSlot:null,
 semanticRefs:[`content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json#${c.cardId}`],runtimeOwnerRefs:[],
 fitRationale:null,conflicts:['No admitted relation from predecessor group to successor runtime slot'],humanDecision:'PENDING'})),
 automaticSelectionAllowed:false});
const source='content/embodied-configuration/ecr-topic-r1/registries/ecr-topic-semantic-owner-matrix-v1.json',topics=read(source).topics;
prepare('ecr-topic-geometry-migration-v1.json',{
 schemaVersion:'ECR-V4.1A-TOPIC-MIGRATION-v1',source,status:'PENDING',
 mappings:Object.entries(topics).flatMap(([topic,groups])=>Object.entries(groups).flatMap(([group,refs])=>refs.map(ref=>({topic,group,sourceRef:ref,
 classification:['M','A','D'].includes(group)?'GEOMETRY_DEPENDENT_MAPPING':'UNRESOLVED',successorRef:null,
 reason:['M','A','D'].includes(group)?'Predecessor selection uses old H64/M8/A8 geometry or driver ranking; meaning identity is not evidence for transferring the personal selection.':'G/Q/R identity may survive, but upstream personal selection lineage has not been admitted under the P64 successor.',
 checkerEvidence:null,humanDecision:'PENDING'})))),
 retainedWithoutRemapping:[],customerEnabled:false});
prepare('ecr-current-reality-dynamic-candidates-v1.json',{
 schemaVersion:'ECR-V4.1A-DYNAMIC-CANDIDATE-BOUNDARY-v1',status:'PENDING',rules:[],
 requiredChain:['OBSERVATION','NORMALIZED_EVIDENCE','COMPARISON_STATE','CANDIDATE_HYPOTHESIS','CONFIDENCE_AND_COUNTEREVIDENCE','HUMAN_REVIEW','ADMISSION'],
 forbiddenAutomaticPromotions:['tired -> RECOVERY_REQUIRED','confused -> C2_BOTTLENECK','stuck -> AGENCY_FAILURE','changed job -> IDENTITY_DRIFT','birth Driver -> current Driver Priority'],customerDynamicStateAllowed:false});
const input=read('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json').cases[0].canonicalInput;
const ir=await buildEcrHumanRuntime({canonicalInput:input});
const sharedEntitlement={schemaVersion:'PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0',methodCode:'ECR',access:{methodAllowed:true,readingDepthAllowed:true}};
const reports=Object.fromEntries(['en','zh-Hans'].map(locale=>[locale,buildEcrHumanRuntimeReport({ir,locale,sharedEntitlement,reviewMode:true})]));
const figureBySection={CARRIER_ARCHITECTURE:['FIG-4A','FIG-4B'],C1:['FIG-4C'],CONTINUITY:['FIG-4D','FIG-4E'],C2:['FIG-5A'],C3:['FIG-5B'],C4:['FIG-5C'],C5:['FIG-5D'],CURRENT_REALITY:['FIG-5E']};
const pairs=[];
for(let i=0;i<reports.en.sections.length;i++){
 const en=reports.en.sections[i],zh=reports['zh-Hans'].sections[i];
 pairs.push({sectionId:en.sectionId,en,zhHans:zh,contentDigests:{en:await sha256Stable(en),zhHans:await sha256Stable(zh)},
 sourceFigureRefs:figureBySection[en.sectionId]||[],sourceSemanticRefs:[],
 provenanceClass:en.sectionId==='INITIALIZATION'?'CALCULATED_WITH_EXPLICIT_UNKNOWNS':'ARCHITECTURE_OR_BOUNDARY_CANDIDATE',
 baselineCurrentBoundary:en.scope,unknownDisclosures:ir.unknown,customerClaimList:[en.content.text,zh.content.text].filter(Boolean),decision:'PENDING'});
}
const path='docs/ecr-human-runtime-v4-1/semantic-review-pairs.json';
if(fs.existsSync(path)){
 const prior=read(path);
 for(const pair of pairs){const old=prior.pairs.find(p=>p.sectionId===pair.sectionId);if(old&&old.decision!=='PENDING')throw Error('HUMAN_DECISION_EXISTS_RECONCILE_BEFORE_REGENERATION');}
}
write(path,{status:'PENDING',syntheticFixtureOnly:true,decisionVocabulary:['ACCEPT','REVISE','REJECT'],pairCount:14,candidateCount:28,pairs});
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fs.writeFileSync('docs/ecr-human-runtime-v4-1/semantic-admission-review.html',`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ECR V4.1A 双语审核工作区</title><style>body{font:17px/1.7 system-ui;color:#20394c;background:#faf7ef;margin:24px auto;padding:0 20px;max-width:1100px;overflow-wrap:anywhere}section{border-top:1px solid #bba;padding:24px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}article{min-width:0}@media(max-width:700px){.pair{display:block}}</style><h1>ECR V4.1A · 双语审核工作区</h1><p>14 对／28 个候选；全部 PENDING。合成测试资料；尚未发布个人解读。可对章节明确回复 ACCEPT／REVISE／REJECT；本页不会自动写入接受记录。</p><p><a href="review-zh-Hans.html">中文图形</a> · <a href="review-en.html">English visual</a> · <a href="semantic-review-pairs.json">完整证据与摘要</a></p>${pairs.map(p=>`<section id="${esc(p.sectionId)}"><h2>${esc(p.sectionId)} · PENDING</h2><div class="pair"><article lang="en"><h3>${esc(p.en.title)}</h3><pre>${esc(JSON.stringify(p.en.content,null,2))}</pre><small>${p.contentDigests.en}</small></article><article><h3>${esc(p.zhHans.title)}</h3><pre>${esc(JSON.stringify(p.zhHans.content,null,2))}</pre><small>${p.contentDigests.zhHans}</small></article></div><p>Figure: ${esc(p.sourceFigureRefs.join(', ')||'无直接 Figure 映射')} · ${esc(p.provenanceClass)} · ${esc(p.baselineCurrentBoundary)}</p><p>个人语义来源：尚未获准；UNKNOWN 不代表已完成个性化解读。</p></section>`).join('')}</html>`);
console.log('Prepared 14 bilingual pairs / 28 candidates, 48 unassigned cards and owner/topic/dynamic workspaces. No human decisions created.');
const migrations=read(base+'ecr-topic-geometry-migration-v1.json');
fs.writeFileSync('docs/ecr-human-runtime-v4-1/admission-workspace.html',`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ECR V4.1A Admission Workspace</title><style>body{font:17px/1.7 system-ui;max-width:1100px;margin:24px auto;padding:0 20px;overflow-wrap:anywhere;color:#20394c;background:#faf7ef}article{padding:18px 0;border-top:1px solid #ccb}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #ccb;padding:8px;text-align:left}section{margin:32px 0}.scroll{overflow:auto}</style><h1>ECR V4.1A · 审核工作区</h1><p>结构化准备已建立。全部新语义映射仍待审；没有生产准入或自动分配。</p><nav><a href="semantic-admission-review.html">28 个中英文候选</a> · <a href="review-zh-Hans.html?anchor=238">Mandala 238° 屏幕起点</a> · <a href="#cards">48 张卡片</a> · <a href="#topics">Topic 迁移</a></nav><section><h2>个人语义 Owner</h2><p>当前没有获准的 Gate／Line → C1–C5 个人映射。候选必须说明来源身份、最具体的主 Owner／次 Owner、Birth／Design 角色、Driver 角色、组成规则、证据和人工评审记录。来源覆盖率不等于个人意义获准。</p></section><section id="cards"><h2>48 张卡片 → 六个新位置</h2><p>旧牌义保留。六个候选位置：CARRIER、EXPERIENCE、EXPRESSION、AGENCY、IDENTITY、FEEDBACK_CONTINUITY。下列每张卡片的新位置均未分配，必须逐项提供理由、冲突及人工决定。</p>${deck.cards.map(c=>`<article><h3>${esc(c.cardId)} · ${esc(c.title['zh-Hans'])} / ${esc(c.title.en)}</h3><p>旧组：${esc(c.groupId)} · 新位置：UNKNOWN · 人工决定：PENDING</p><p>${esc(c.canonicalCustomerMeaning['zh-Hans'])}</p><p lang="en">${esc(c.canonicalCustomerMeaning.en)}</p><small>来源：ecr-phi-card-deck-registry-v2.json#${esc(c.cardId)}。Runtime Owner、适配理由待填写。</small></article>`).join('')}</section><section id="topics"><h2>Topic 几何迁移审计</h2><p>${migrations.mappings.length} 条关系；现有 topic projection 使用 selected G/Q/R、D 前三排名、M 和 A。M/A/D 明确依赖旧选择机制；G/Q/R 的个人选择链尚未完成 successor 准入，因此保守标为 UNRESOLVED。没有按旧 Hxx 序号转移。</p><div class="scroll"><table><thead><tr><th>Topic</th><th>旧 Owner</th><th>分类</th><th>状态</th></tr></thead><tbody>${migrations.mappings.map(m=>`<tr><td>${esc(m.topic)}</td><td>${esc(m.sourceRef)}</td><td>${esc(m.classification)}</td><td>PENDING</td></tr>`).join('')}</tbody></table></div></section><section><h2>Current Reality 动态规则</h2><p>观察、归一证据、比较、候选假设、反证与置信度、人工评审、准入必须分开。当前无获准动态规则；疲惫、困惑、卡住或换工作不能自动产生恢复／瓶颈／失败／身份漂移结论。</p></section></html>`);
