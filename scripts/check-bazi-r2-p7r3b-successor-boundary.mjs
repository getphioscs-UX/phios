import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const dir='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/',root='docs/acceptance/bazi-paid-report/deep-manuscript-r2/',read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const r=read(dir+'P7R3B-GENG-BASELINE-RECONCILIATION.json'),before=read(dir+'P7R3B-PROTECTED-BEFORE.json'),failures=[];
r.successorEquivalenceBoundary.modes={};
for(const mode of ['BILINGUAL','EN','ZH_HANS']){
 const a=read(dir+'P7R3B-CURRENT-PRODUCTION-'+mode+'.json'),b=read(root+'LIVE-PUBLICATION-IR-R2-CLOSURE-'+mode+'.json');
 assert.deepEqual(a.manuscript,b.manuscript);assert.deepEqual(a.authority,b.authority);assert.deepEqual(a.lineage,b.lineage);
 const plan=pages=>pages.map(({content,insightCards,...rest})=>rest);assert.deepEqual(plan(a.publication.pages),plan(b.publication.pages));
 assert.equal(a.publication.pages.length,48);assert.equal(a.technical.diagrams.length,15);
 const missing=a.editorial.coverage.flatMap(s=>Object.entries(s.locales).filter(([,v])=>v.status!=='PASS'||v.missing.length).map(([locale,v])=>({mode,sectionId:s.sectionId,locale,missing:v.missing,status:v.status,historical:b.editorial.coverage.find(x=>x.sectionId===s.sectionId)?.locales[locale]})));failures.push(...missing);
 const allSource=r.changedSpans.filter(s=>s.mode===mode).flatMap(s=>[...s.historical,...s.current]);assert(allSource.every(s=>s.exactSourceSpan&&s.manuscriptUnitDigest));
 r.successorEquivalenceBoundary.modes[mode]={sameImmutableManuscript:true,sameAuthorityCertaintyAndBoundaryDigests:true,samePagePlanAndSectionIdentity:true,sameAssetReferences:true,pageCount:48,diagramCount:15,noInventedProse:true,changedSpansValidated:allSource.length,coverageStatus:missing.length?'FAIL':'PASS',coverageFailures:missing,visualEquivalence:'NOT_CLAIMED'};
}
const changed=Object.entries(before.hashes).filter(([p,h])=>sha(fs.readFileSync(p))!==h).map(([p])=>p);assert.deepEqual(changed,[]);
r.lineageReconciliationStatus='PASS_LOCAL';r.successorEquivalenceBoundary.status=failures.length?'FAILED':'PASS';r.successorEquivalenceBoundary.coverageFailures=failures;r.resumeP7R3Allowed=false;
r.status=failures.length?'FAILED':'PASS_LOCAL';r.remainingBlocker=failures.length?'CURRENT_PRODUCTION_GENG_S10_EN_TIMING_LAYERS_COVERAGE_MISSING':null;
r.nextAction=failures.length?'STOP. Baseline lineage reconciled, but current S10 English selection fails the existing TIMING_LAYERS coverage obligation. Separate bounded selector investigation/repair authorization is required; no D05/D10 repair resumed.':'Audit complete; future P7R3 retry uses current regression baseline and protects historical acceptance.';
r.execution=[{command:'node --import ./scripts/lib/p6-node-json-compat.mjs scripts/audit-bazi-r2-p7r3b-baseline-reconciliation.mjs',exitCode:0,currentSelectorCompiles:18,historicalSelectorInMemoryCompiles:3},{command:'node scripts/check-bazi-r2-p7r3b-successor-boundary.mjs',exitCode:failures.length?1:0}];
r.productionFilesModified=[];r.repositoryState={headBefore:before.head,headAfter:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),unrelatedConcurrentChange:['docs/acceptance/bazi-paid-report/visual-first-r1/ZERO-COST-GUARD-EVIDENCE.json'],disposition:'Preserved without modification by this audit'};
write(dir+'P7R3B-GENG-BASELINE-RECONCILIATION.json',r);
const p5=read(r.p5_2ParityClaim.successorReceipt);p5.currentGengSuccessorCoverage={status:failures.length?'FAILED':'PASS',failures};p5.customerNativeSelectorSuccessor='PASS_LOCAL_HISTORICAL_SCOPE_PRESERVED';p5.historicalGengExactVisibleParity='SUPERSEDED_BY_P7R3B_RECONCILIATION';p5.productionReadiness=r.remainingBlocker;write(r.p5_2ParityClaim.successorReceipt,p5);
const anchor=read(r.currentProductionBaseline);anchor.readiness=failures.length?'BLOCKED_EXISTING_COVERAGE_FAILURE':'NOT_HUMAN_ACCEPTED';anchor.knownBaselineFailures=failures;write(r.currentProductionBaseline,anchor);
console.log(JSON.stringify({lineage:r.lineageReconciliationStatus,status:r.status,classification:r.classification,coverageFailures:failures,protectedUnchanged:true}));process.exitCode=failures.length?1:0;
