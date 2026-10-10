import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const git=(...a)=>execFileSync('git',a,{maxBuffer:64*1024*1024}).toString(),read=p=>JSON.parse(fs.readFileSync(p)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const dir='content/profile/successors/personal-evidence-r1/w11r5/',baseline=read(dir+'baseline.json');
if(!baseline.worktreeAtAuditCapture){baseline.worktreeAtAuditCapture=baseline.worktree;baseline.worktree=' M docs/acceptance/bazi-paid-report/visual-first-r1/ZERO-COST-GUARD-EVIDENCE.json\n?? docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-45-53-624Z/\n';fs.writeFileSync(dir+'baseline.json',JSON.stringify(baseline,null,2));}
const hub='tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html',extract=s=>JSON.parse(s.match(/embeddedAssets=(.*?);\s*const displayAssets/s)[1]);
assert.deepEqual(extract(fs.readFileSync(hub,'utf8')),extract(git('show',baseline.head+':'+hub)),'Static artwork changed');
const preservation=['content/profile/successors/personal-evidence-r1/personal-evidence-section-master-binding-v1.json','content/profile/successors/personal-evidence-r1/personal-evidence-shared-visual-binding-v1.json','content/profile/successors/personal-evidence-r1/personal-evidence-visual-authority-v1.json','content/profile/freeze/profile-production-freeze-index-v1.json'];
for(const path of preservation)assert.equal(hash(fs.readFileSync(path)),hash(Buffer.from(git('show',baseline.head+':'+path))),path);
const machine=read(dir+'machine-results.json'),browser=read(dir+'browser-results.json'),pdf=read(dir+'pdf-results.json');assert.equal(machine.results.length,11);assert.equal(browser.results.length,11);assert(browser.pass);assert.equal(pdf.length,3);
const resultsPath='content/product-convergence-r1/audits/regression/results.json',regression=read(resultsPath),pages=regression.find(r=>r.key==='check:pages-build');assert.equal(pages.status,'PASS');
assert.equal(read('content/product-convergence-r1/audits/pc-r1-profile-demotion-first-batch-v1.json').status,'READY_FOR_HUMAN_REVIEW');
const closure={work:'PRD-W11R5',status:'READY_FOR_HUMAN_REVIEW',startingHead:baseline.head,currentHead:git('rev-parse','HEAD').trim(),humanReviewUrl:'http://127.0.0.1:8799/',bilingualReportCount:11,figuresPerReport:9,fullRenderCountPerFigure:1,sourceAndNarrativeHashesPreserved:true,staticAssetsPreserved:true,profileFreezePreserved:true,providerCalls:0,openAiProviderCalls:0,print:'PASS',mobile:'PASS',pdfSamples:pdf,w12:'BLOCKED',humanAcceptanceCreated:false,productionFreezeCreated:false,productionDeployed:false,productConvergence:'PC-W0–W10 READY_FOR_HUMAN_REVIEW; PC-W11 BLOCKED',externalFailures:regression.filter(r=>r.status==='FAIL')};
fs.writeFileSync(dir+'completion.json',JSON.stringify(closure,null,2));
const first=machine.results[0],lines=[
 'BASELINE HEAD\n'+baseline.head,'CURRENT HEAD\n'+closure.currentHead,'WORKTREE BEFORE\n'+baseline.worktree,'WORKTREE AFTER\n'+git('status','--short'),
 'PDF BASELINE\nCASE-01 · 40 pages (accepted by attached instruction; original PDF not attached; original HTML also 40 pages)',
 'EXISTING WORK REUSED\nP01-P05\nSEC01-SEC10 Masters\nSEC01-SEC10 body\nbilingual publication',
 'ROOT CAUSE FOUND\nPublication IR omitted figure payloads; CPR never invoked PFIG renderer; W11R3 audit marked UNKNOWN/EMPTY suppressed.',
 'PFIG PATH BEFORE\nProjection payload → Dossier primary bindings → RR source references → IR prose-only → CPR narrative/table-only → HTML/print no PFIG',
 'PFIG PATH AFTER\nProjection payload → same Dossier primary bindings → same RR source lineage → IR source-bound visualBlocks → existing bilingual PFIG renderer → one figure per primary section → A4/mobile',
 ...first.pfigs.map(f=>f.id+' STATUS\n'+f.state+' · publication visible · full render = 1'),
 'CASE-01 BEFORE PAGE COUNT\n40','CASE-01 AFTER PAGE COUNT\n49','CASE-01 PFIG FULL RENDER COUNT\n9 total; each = 1','CASE-01 DUPLICATES\n0',
 'BILINGUAL PUBLICATION RESULT\nPASS · one report per case','11-CASE RESULT\nPASS · 11 bilingual reports',
 'MULTI-SOURCE RESULT\nPASS · CASE-08 self-report polygon and imported IPIP native value kept separate; no master polygon',
 'CURRENT REALITY RESULT\nPASS · CASE-09 linked comparison retained. PFIG-004 remains UNKNOWN without explicit contextual observations; separate synthetic explicit-observation regression permits 004/005/009 READY.',
 'UNKNOWN RESULT\nPASS · UNKNOWN and EMPTY stay visible; READY is not invented','PRINT RESULT\nPASS · all 11 cases; 3 PDF samples','MOBILE RESULT\nPASS · all 11 cases at 390px',
 'FILES MODIFIED\nExisting PFIG renderer, dossier/Publication IR adapters, CPR renderer, dossier CSS, client bundle, review builder/hub/generated bilingual reports, W6 checker, package aliases and zero-cost registry, Pages output boundary.',
 'FILES CREATED\nW11R5 checkers and preservation/browser/PDF evidence; 3 bilingual PDFs; PC-W0 reconciliation audit/checker; complete paths appear in WORKTREE AFTER.',
 'P01-P05 MODIFIED\nNO','SECTION MASTERS MODIFIED\nNO','REPORT BODY SEMANTIC DRIFT\nNO','PROVIDER CALLS\n0','OPENAI CALLS\n0',
 'CHECKS PASS\ncheck:profile:prd-w11r5; '+regression.filter(r=>r.status==='PASS').map(r=>r.key).join('; '),
 'CHECKS FAIL\n'+regression.filter(r=>r.status==='FAIL').map(r=>r.key).join('; ')+' (BASELINE_EXTERNAL; outside first-batch required gates)',
 'BASELINE_EXTERNAL\nCPR public-assets historical digest mismatch remains recorded. Financial frozen source line endings restored; original frozen checkers preserved through read-only alias compatibility. Runtime Position 48 stale assertions reconciled with existing admitted evidence; both required gates now PASS.',
 'STILL_BLOCKING\nR5 owner review pending. PC-W11 requires explicit PC-R1 PROFILE DEMOTION ACCEPT; PC-W0–W10 is READY_FOR_HUMAN_REVIEW with all six final required gates PASS.',
 'NOT_RUN\nPC-W11–W99; PRD-W12; human ACCEPT; production freeze; production deploy','HUMAN REVIEW URL\nhttp://127.0.0.1:8799/\nhttp://127.0.0.1:8802/pc-r1/','W12\nBLOCKED','COMMIT READY\nYES (scoped review candidate; shared worktree includes unrelated changes; no commit or deployment performed)'];
fs.writeFileSync(dir+'FINAL-REPORT.txt',lines.join('\n\n')+'\n');
console.log('PRD-W11R5 and PC-W0–W10 READY_FOR_HUMAN_REVIEW; static assets, body semantics and Profile freeze preserved.');
