import { spawnSync } from 'node:child_process';
import { writeBatchPlan } from './lib/article-simplification/batch-orchestrator-v1.mjs';
import { DEFAULT_TARGET_LOCALES, writeCandidateOrchestration } from './lib/article-simplification/candidate-orchestrator-v1.mjs';
import { buildBfaBatchFromAps, isSuccessorBatch } from './lib/bilingual-final-approval/bfa-batch-builder-v1.mjs';
const args=process.argv.slice(2),valueAfter=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null};
const bookCode=valueAfter('--book'),countRaw=valueAfter('--count'),locale=valueAfter('--locale')||'zh-Hans',requestedBatch=valueAfter('--batch')||null,targetLocalesRaw=valueAfter('--locales');
if(!bookCode){console.error('article:batch requires --book, for example --book BOOK-1');process.exit(2)}if(!countRaw||!/^\d+$/.test(countRaw)){console.error('article:batch requires a positive integer --count');process.exit(2)}
if(requestedBatch&&!isSuccessorBatch(requestedBatch)){
 const r=spawnSync(process.execPath,['scripts/frozen/aps8/article-batch.mjs',...args],{stdio:'inherit',cwd:process.cwd()});process.exit(r.status??1);
}
const count=Number(countRaw),root=process.cwd();const {plan,outputPath,reusedExistingPlan}=writeBatchPlan(root,{bookCode,locale,count,batchCode:requestedBatch});
if(!isSuccessorBatch(plan.batchCode)){
 const legacyArgs=[...args];if(!requestedBatch)legacyArgs.push('--batch',plan.batchCode);const r=spawnSync(process.execPath,['scripts/frozen/aps8/article-batch.mjs',...legacyArgs],{stdio:'inherit',cwd:root});process.exit(r.status??1);
}
const targetLocales=targetLocalesRaw?targetLocalesRaw.split(',').map(v=>v.trim()).filter(Boolean):[...DEFAULT_TARGET_LOCALES];
console.log(`✓ APS-3 successor ${reusedExistingPlan?'reused':'created'} ${plan.batchCode}: ${outputPath}`);console.log(`✓ Selected ${plan.selection.selectedCount}/${plan.selection.availableReadyCount} ARTICLE_READY nodes; requested maximum ${plan.request.requestedCount}.`);
const candidateResult=writeCandidateOrchestration(root,plan,{targetLocales});console.log(`✓ APS-4 Candidate Orchestration ${candidateResult.reusedExistingOrchestration?'reused':'created'}: ${candidateResult.outputPath}`);console.log('✓ BFA successor intentionally skips APS-5/APS-6 historical Human choreography for BATCH-002+.');
const bfa=await buildBfaBatchFromAps(root,plan.batchCode,{write:true});console.log(`✓ BFA Complete Publication Package workspace assembled: ${bfa.entries.filter(x=>x.package).length}/${bfa.entries.length} complete packages.`);console.log(`✓ Review: npm run bfa:review -- --batch ${plan.batchCode}`);console.log('✓ Missing locale Candidate authority remains BLOCKED and is never replaced by a placeholder or inferred translation authority.');
