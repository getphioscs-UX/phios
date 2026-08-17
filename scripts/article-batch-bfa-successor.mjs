import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DEFAULT_TARGET_LOCALES, writeCandidateOrchestration } from './lib/article-simplification/candidate-orchestrator-v1.mjs';
import { buildBfaBatchFromAps, isSuccessorBatch } from './lib/bilingual-final-approval/bfa-batch-builder-v1.mjs';
import { buildBfaArticleActivationReadiness, buildSuccessorBatchPlan } from './lib/bilingual-final-approval/bfa-article-activation-v1.mjs';
import { currentProgressionBatch, buildCompatibleBatchPlan } from './lib/bilingual-final-approval/bfa-progression-v2.mjs';
const args=process.argv.slice(2),valueAfter=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null};
const bookCode=valueAfter('--book'),countRaw=valueAfter('--count'),locale=valueAfter('--locale')||'zh-Hans',requestedBatch=valueAfter('--batch')||null,targetLocalesRaw=valueAfter('--locales');
if(!bookCode){console.error('article:batch requires --book, for example --book BOOK-1');process.exit(2)}
if(!countRaw||!/^\d+$/.test(countRaw)){console.error('article:batch requires a positive integer --count');process.exit(2)}
if(requestedBatch&&!isSuccessorBatch(requestedBatch)){const r=spawnSync(process.execPath,['scripts/frozen/aps8/article-batch.mjs',...args],{stdio:'inherit',cwd:process.cwd()});process.exit(r.status??1);}
const root=process.cwd(),count=Number(countRaw);
// BFA Progression v2 owns BATCH-003+ selection. It freezes canonical order and
// a 24-node single-book window instead of scavenging whichever later nodes
// happen to be ARTICLE_READY. Historical BATCH-002 remains on the v1 path.
const progressionCurrent=currentProgressionBatch(root,{bookCode});
if(progressionCurrent && Number(progressionCurrent.batchCode.slice(6))>=3){
  if(requestedBatch && requestedBatch!==progressionCurrent.batchCode){console.error(`BFA_PROGRESSION_CURRENT_BATCH_IS_${progressionCurrent.batchCode}: later batch may not leapfrog the current canonical window.`);process.exit(2)}
  if(count!==progressionCurrent.maximumNewArticles)console.log(`ℹ BFA Progression v2 freezes ${progressionCurrent.maximumNewArticles} nodes for ${progressionCurrent.batchCode}; requested --count ${count} is treated as an operator ceiling, not a reason to change the frozen window.`);
  const {plan,readiness}=buildCompatibleBatchPlan(root,progressionCurrent.batchCode);
  if(!plan){
    console.error(`BFA_PROGRESSION_UPSTREAM_REVIEW_REQUIRED: ${readiness.summary.productionReadyCount}/${readiness.summary.nodeCount} nodes are production-ready in ${progressionCurrent.batchCode}.`);
    console.error(`Review: npm run bfa:prog:c2-review -- --batch ${progressionCurrent.batchCode}`);
    process.exit(2);
  }
  const batchDir=path.join(root,'content/production/article-simplification/batches',progressionCurrent.batchCode);fs.mkdirSync(batchDir,{recursive:true});const planPath=path.join(batchDir,'batch-plan.v1.json');
  if(fs.existsSync(planPath)){const old=JSON.parse(fs.readFileSync(planPath,'utf8'));if(old.batchDigest!==plan.batchDigest)throw new Error(`${progressionCurrent.batchCode} exists with different Progression v2 selection evidence`)}else fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n');
  console.log(`✓ BFA Progression v2 activated ${progressionCurrent.batchCode}: ${plan.entries.length} canonical-order ARTICLE-ready nodes.`);
  const targetLocales=targetLocalesRaw?targetLocalesRaw.split(',').map(v=>v.trim()).filter(Boolean):[...DEFAULT_TARGET_LOCALES];
  const candidateResult=writeCandidateOrchestration(root,plan,{targetLocales});
  console.log(`✓ Candidate orchestration ${candidateResult.reusedExistingOrchestration?'reused':'created'}: ${candidateResult.outputPath}`);
  const bfa=await buildBfaBatchFromAps(root,progressionCurrent.batchCode,{write:true});
  console.log(`✓ BFA package workspace: ${bfa.entries.filter(x=>x.package).length}/${bfa.entries.length} complete packages.`);
  console.log(`✓ Review: npm run bfa:review -- --batch ${progressionCurrent.batchCode}`);
  process.exit(0);
}
const baseDir=path.join(root,'content/production/article-simplification/batches');
const existing=fs.existsSync(baseDir)?fs.readdirSync(baseDir).filter(x=>/^BATCH-\d{3,}$/.test(x)).sort():[];
const readiness=buildBfaArticleActivationReadiness(root,{bookCode,locale});
const equivalentBatch=()=>{if(requestedBatch)return null;for(const code of [...existing].reverse()){if(!isSuccessorBatch(code))continue;const p=path.join(baseDir,code,'batch-plan.v1.json');if(!fs.existsSync(p))continue;const x=JSON.parse(fs.readFileSync(p,'utf8'));if(x?.request?.bookCode===bookCode&&x?.request?.locale===locale&&x?.request?.requestedCount===count&&x?.sourceReadiness?.readinessDigest===readiness.readinessDigest)return code;}return null;};
const next=()=>`BATCH-${String(Math.max(1,...existing.map(x=>Number(x.slice(6))||0))+1).padStart(3,'0')}`;
const batchCode=requestedBatch||equivalentBatch()||next();
const prospectivePlanPath=path.join(baseDir,batchCode,'batch-plan.v1.json');
const existingPlan=fs.existsSync(prospectivePlanPath)?JSON.parse(fs.readFileSync(prospectivePlanPath,'utf8')):null;
const plan=buildSuccessorBatchPlan(root,{bookCode,locale,count,batchCode,createdAt:existingPlan?.createdAt??null});
if(!plan.entries.length){console.error(`BFA_NO_ARTICLE_READY_NODES: ${readiness.summary.readyCount} successor ARTICLE_READY nodes for ${bookCode}/${locale}. No batch artifacts were written.`);process.exit(2);}
const batchDir=path.join(baseDir,batchCode),planPath=path.join(batchDir,'batch-plan.v1.json'),activationPath=path.join(batchDir,'bfa-article-activation-readiness.v1.json');
fs.mkdirSync(batchDir,{recursive:true});
if(fs.existsSync(planPath)){const old=JSON.parse(fs.readFileSync(planPath,'utf8'));if(old.batchDigest!==plan.batchDigest)throw new Error(`${batchCode} already exists with different BFA successor selection evidence`);}else fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n');
fs.writeFileSync(activationPath,JSON.stringify(readiness,null,2)+'\n');
const targetLocales=targetLocalesRaw?targetLocalesRaw.split(',').map(v=>v.trim()).filter(Boolean):[...DEFAULT_TARGET_LOCALES];
console.log(`✓ BFA successor created ${batchCode}: content/production/article-simplification/batches/${batchCode}/batch-plan.v1.json`);
console.log(`✓ Selected ${plan.selection.selectedCount}/${plan.selection.availableReadyCount} Human-governed C2/C3 ARTICLE-ready nodes; historical Wave-1 production roles remain unchanged.`);
const candidateResult=writeCandidateOrchestration(root,plan,{targetLocales});
console.log(`✓ APS-4 Candidate Orchestration ${candidateResult.reusedExistingOrchestration?'reused':'created'}: ${candidateResult.outputPath}`);
console.log('✓ BFA successor intentionally skips APS-5/APS-6 historical Human choreography for BATCH-002+.');
const bfa=await buildBfaBatchFromAps(root,batchCode,{write:true});
console.log(`✓ BFA Complete Publication Package workspace assembled: ${bfa.entries.filter(x=>x.package).length}/${bfa.entries.length} complete packages.`);
console.log(`✓ Review: npm run bfa:review -- --batch ${batchCode}`);
console.log('✓ No TL Final Approval or publication decision was synthesized.');
