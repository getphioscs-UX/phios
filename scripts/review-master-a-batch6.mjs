import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='content/knowledge/structured/successors/master-a-v2-batch6';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const census=read(dir+'/object-census-v1.json'),owners=read(dir+'/current-owner-map-candidate-v1.json'),gate=read(dir+'/check-results-v1.json'),checks=read(dir+'/final-validation-v1.json');
const accepted=[1,2,3,4,5].map(n=>({batch:n,...read(`content/knowledge/structured/successors/master-a-v2-batch${n}/human-acceptance-successor-v1.json`)}));
const rows=[
 ['Predecessor Human Accept',accepted],['Unique current owner map',owners],
 ['Book V / VI census by native family',census.atlasFamilies.map(({existingObjectIds,...r})=>r)],
 ['Book VII census',census.bookVII],['Book VIII census',census.bookVIII],
 ['Cross-book routing / semantic bridges',{routingCandidates:5,semanticBridges:4,liveRoutingInstalled:false}],
 ['Ask reuse',{owner:'functions/api/ask-phios.js',newOwner:false,sourceGapGate:gate.currentAskBoundaryCases}],
 ['KAP reuse',{historicalFreezesRewritten:false,maintenance:read(dir+'/kap-source-unavailable-maintenance-successor-v1.json')}],
 ['RNE reuse',read(dir+'/validation-capture-rne-native-v1.json')],
 ['Knowledge Runtime reuse',{owner:'scripts/lib/knowledge-runtime/knr-package-b-v1.mjs',secondRuntime:false}],
 ['Search / graph reuse',{publicReplacement:false,searchEngineCreated:false,graphEngineCreated:false}],
 ['Observation interaction',{scope:'OBSERVATION_INTERACTION_CONTRACT_ONLY',existingAskIntegration:'FUTURE_SEPARATE_ADMISSION'}],
 ['Observation Lab',{standaloneProduct:'WITHHELD / EXPERIMENTAL / NOT_ADMITTED',publicRoute:false,entitlement:false}],
 ['Navigation structured layer',{objects:39,allWithheld:true,canonicalNodeRefs:'UNBOUND',newRNE:false}],
 ['Reality Continuation',{scope:'Book VIII final closure',persistentRealityWrite:false,actionExecution:false}],
 ['Book VIII canonical title',{title:'世界将如何继续',functionalScope:'Navigation Science / 导航科学',titleMigration:false}],
 ['Eight-volume architecture',{bookIX:false,canonicalIdentityRecreated:false}],
 ['WITHHELD',census],['REFERENCE_ONLY',{bookVII:17,bookVIII:39,existingAtlasAdapters:'REFERENCE_ONLY; existing native eligibility unchanged'}],
 ['ACTIVE',{newStructuredObjects:0,publicRoutingCandidates:0,publicProjectionCandidates:0}],
 ['No parallel runtime',{newAsk:0,newKAP:0,newRNE:0,newRoute:0,newEntitlement:0,commerceChanges:0}],
 ['Authority chain',read(dir+'/structured-authority-successor-candidate-v1.json')],
 ['Book V source gap lineage',read(dir+'/book-v-source-gap-reconciliation-v1.json')],
 ['Book V bounded unavailable behavior',gate],
 ['Validation commands / actual exits',checks],
 ['Unrelated debt / unresolved gates',checks.unresolvedGates],
 ['Cloud / Git',{commit:false,push:false,deploy:false,providerRequests:0}],
 ['Final Human Review gate',{status:'READY_FOR_HUMAN_REVIEW',productionAdmission:'PENDING_EXPLICIT_MASTER_A_V2_FINAL_HUMAN_ACCEPT',productionFreezeCreated:false,productionAcceptanceCreated:false}]
];
const target='tools/review/MASTER-A-V2-FINAL-HUMAN-REVIEW.html';
fs.writeFileSync(target,`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MASTER A v2 · Final Human Review</title><style>body{max-width:1100px;margin:40px auto;padding:0 24px;font:16px/1.65 system-ui;background:#f4f6f8;color:#172334}section{background:white;padding:22px;margin:20px 0;border-radius:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.6 monospace}.state{background:#fff1c9;padding:18px}a{color:#245b9c}</style><h1>MASTER A v2.0.0 · Final Human Review</h1><p class="state">READY_FOR_HUMAN_REVIEW · 尚未授予 MASTER A 最终生产准入。请以各检查的实际退出码为准；此页面不代表全仓库 PASS。</p><p>Book V 原稿来源保持非公开。来源不可用时，现有 Ask 返回有界的 UNKNOWN 可用性响应；没有补造内容、恢复公开原稿或调用付费服务。</p>${rows.map(([title,data],i)=>`<section><h2>${i+1}. ${esc(title)}</h2><pre>${esc(JSON.stringify(data,null,2))}</pre></section>`).join('')}</html>`);
const artifacts=fs.readdirSync(dir).filter(n=>n.endsWith('.json')&&!['review-freeze-candidate-v1.json','final-report-v1.json'].includes(n)).map(n=>({path:dir+'/'+n,sha256:sha(dir+'/'+n)}));
fs.writeFileSync(dir+'/review-freeze-candidate-v1.json',JSON.stringify({status:'REVIEW_CANDIDATE_NOT_PRODUCTION_FREEZE',artifacts,review:{path:target,sha256:sha(target)},humanAcceptFabricated:false},null,2)+'\n');
fs.writeFileSync(dir+'/final-report-v1.json',JSON.stringify({status:'READY_FOR_HUMAN_REVIEW',review:target,providerRequests:0,productionAdmission:false,fullRepositoryPass:checks.fullRepositoryPass,unresolvedGates:checks.unresolvedGates,commit:false,push:false,deploy:false},null,2)+'\n');
console.log(target);
