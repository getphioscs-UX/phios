import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeReviewFile} from './lib/w11r6-review-io.mjs';
const dir='content/profile/successors/personal-evidence-r1/w11r6/',read=p=>JSON.parse(fs.readFileSync(p)),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),git=(...args)=>execFileSync('git',args,{maxBuffer:64*1024*1024}).toString();
const baseline=read(dir+'baseline.json'),machine=read(dir+'machine-results.json'),browser=read(dir+'browser-results.json'),review=read(dir+'review-browser-results.json'),pdf=read(dir+'pdf-results.json'),map=read(dir+'PRD-W11R6-FIGURE-AUTHORITY-MAP.json'),results=read(dir+'PRD-W11R6-REGRESSION-RESULTS.json');
assert.equal(machine.status,'PASS');assert.equal(machine.results.length,11);assert.equal(browser.status,'PASS');assert.equal(browser.results.length,11);assert.equal(review.status,'PASS');assert.equal(pdf.length,3);
const required=['check:profile:prd-w11r6','check:profile:prd-w11r5','check:profile:pfig-authority','check:profile:personal-evidence-prd-w3-w5','check:profile:personal-evidence-prd-w6','check:profile:personal-evidence-prd-w7','check:profile:personal-evidence-prd-w8','check:rr-v2','check:rmo','check:profile','check:ppr-current-shared-owner','check:relationship:w0-w8','check:runtime-position-48','check:pages-build'];
for(const key of required)assert.equal(results.find(r=>r.command===key)?.status,'PASS',key);
for(const entry of machine.results)assert.equal(hash(fs.readFileSync('tools/review/personal-evidence-r1/'+entry.id+'-bilingual-dossier.html')),entry.htmlSha256,'Post-check HTML changed');
assert.equal(hash(fs.readFileSync(baseline.reviewReference.path)),baseline.reviewReference.sha256,'Original 49-page PDF must be preserved');
for(const name of ['browser-results.json','case-01-radar.png','case-01-radar-mobile.png']){const p='content/profile/successors/personal-evidence-r1/w11r5/'+name;assert.equal(hash(fs.readFileSync(p)),hash(execFileSync('git',['show',baseline.head+':'+p],{maxBuffer:16*1024*1024})),'W11R5 receipt drift '+name);}
const beforeCpr=fs.readFileSync(dir+'cpr-before.log','utf8'),afterCpr=fs.readFileSync(dir+'check-cpr.log','utf8'),pair=s=>[s.match(/actual: '([a-f0-9]+)'/)?.[1],s.match(/expected: '([a-f0-9]+)'/)?.[1]];
assert.deepEqual(pair(beforeCpr),pair(afterCpr),'CPR baseline failure changed');assert(pair(beforeCpr).every(Boolean));
const processes=fs.readFileSync(dir+'zero-cost-processes.jsonl','utf8').trim().split('\n').map(x=>JSON.parse(x));assert(processes.length>0);assert(processes.every(p=>p.providerCalls===0&&p.openAiCalls===0));
const zero={timestamp:new Date().toISOString(),providerCalls:0,openAiCalls:0,processRecords:processes.length,externalAttemptsBlocked:processes.reduce((n,p)=>n+p.externalAttemptsBlocked,0),guard:'scripts/lib/w11r6-zero-cost-preload.mjs',runner:'scripts/run-zero-cost-regression.mjs',credentialStripping:true,nodeEvidence:'zero-cost-processes.jsonl',browserEvidence:browser.networkEvidence,reviewBrowserExternalRequests:review.externalRequests,buildersAndCapture:'Local file-backed fixture composition; images decoded from preserved embedded bytes; no ingestion or model API in these commands.',productionActivated:false};
writeReviewFile(dir+'PRD-W11R6-ZERO-COST-EVIDENCE.json',JSON.stringify(zero,null,2));
const changed=baseline.scopeCandidates.filter(p=>fs.existsSync(p.path)&&hash(fs.readFileSync(p.path))!==p.sha256).map(p=>p.path);
const scripts=fs.readdirSync('scripts').filter(n=>/w11r6/.test(n)).map(n=>'scripts/'+n),libs=fs.readdirSync('scripts/lib').filter(n=>/^w11r6/.test(n)).map(n=>'scripts/lib/'+n);
const walk=(p)=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+e.name+'/'):[p+e.name]);
const created=[...scripts,...libs,...walk(dir),...pdf.map(p=>p.path.replaceAll('\\','/'))];
const currentHead=git('rev-parse','HEAD').trim(),worktreeAfter=git('status','--porcelain=v1');
const failure=results.filter(r=>r.status==='FAIL');assert(failure.every(r=>r.command==='check:cpr'));
const report=`BASELINE HEAD / CURRENT HEAD / WORKTREE BEFORE / WORKTREE AFTER
Baseline execution HEAD: ${baseline.head}
Current HEAD: ${currentHead}
Historical requested baseline: 67254e3d039c842fca0cbd8edc392691ccd2166b; reported historical HEAD 8888f647bd85f21a45397690fb3479de9b339c17. No reset/checkout performed. Owner commits occurred in the shared worktree; current main code was reconciled.
UTC run start: ${baseline.timestamp}; completed: ${new Date().toISOString()}
Worktree before:
\`\`\`
${baseline.worktreeBefore}\`\`\`
Worktree after (includes unrelated owner changes; not all are W11R6):
\`\`\`
${worktreeAfter}\`\`\`
Original candidate backups: ${baseline.backup}

CANONICAL FIGURE-ID → SECTION → REVIEW-PAGE MAP
${map.figures.map(f=>`${f.figureId} → ${f.sectionId} → PDF ${f.reviewPage} · ${f.title['zh-Hans']} / ${f.title.en}`).join('\n')}
Review-label reconciliation: instruction's personality/radar = canonical PFIG-002; decision = 008; relationship = 007; context = 004; cross-source = 005. Canonical IDs and titles were not renamed. SEC-02 remains the protected narrative evidence-structure section; no extra PFIG was invented.

ROOT CAUSES VERIFIED (not guessed)
W11R5 figure payloads and IR visualBlocks were intact. The renderer represented most UNKNOWN figures with one placeholder paragraph; ready dimension lanes looked like tables; the radar used numerals without named-axis legend; relationship/decision nodes lacked explicit connective meaning. The repair replaces only the existing bilingual figure composition with distinct source-bound graph grammars. No new projection engine or API is introduced.
CASE-06/08 A4 overflow was measured and repaired by compact source topology and independent native-scale legends. Protected body/background CSS is byte-prefix exact; only figure-local rules were appended. Local backup files initially leaked into Pages build; backup/review exclusions now prevent that.

PFIG-001 ... PFIG-009: evidence authority / visual status / structural validation / review link
${map.figures.map(f=>`${f.figureId}: authority ${f.status}; DATA_READY=${f.DATA_READY}; VISUAL_RENDERED=true; INTERPRETATION_READY=false; HUMAN_APPROVED=false; ${f.visualGrammar} structurally checked PASS; ${review.verifiedUrl}#${f.figureId}`).join('\n')}
All figures use the unchanged functions/profile/profile-customer-visual-projection.js payloads, canonical primary bindings, RR/Publication IR lineage, and existing CPR renderer entry point. UNKNOWN presentation is not evidence promotion.

CASE-01 PAGE COUNT BEFORE/AFTER and per-page anomalies
49 → ${pdf[0].pageCount}; no arbitrary growth. Full HTML/PDF page count and A4 metadata match; zero blank body pages, footer overlaps or truncated figures. 15 original opening/master artwork pages remain. Actual PDF pages 9, 24, 36 and 46 rasterized and visually inspected; remaining nine full-figure and page-context screenshots reviewed.
Original 49-page PDF SHA-256 preserved: ${baseline.reviewReference.sha256}. Reference was located in working tree; separate attachment bytes were not provided. Original 40-page PDF unavailable; no pixel equivalence asserted.

11-CASE / CASE-08 / CASE-09 / synthetic fixture results
11/11 source hashes, trace hashes, protected body DOM, native payloads and nine distinct semantic structures PASS. Each canonical figure renders exactly once; duplicates=0.
CASE-01 six values remain 75; one CUSTOMER_SELF_REPORT class; source date/coverage preserved. The polygon is a response configuration, not a personality/ability composite.
CASE-08 PASS: self-report polygon and imported IPIP source-native value remain separate; no normalization/master polygon. Source-specific screenshot pair in before/after.
CASE-09 PASS: only existing admitted comparison refs are shown; PFIG-004 remains UNKNOWN; PFIG-005 and 009 retain their original READY states, not extra individualized interpretation.
Synthetic explicit-observation test PASS for 004/005/009; clearly labeled TEST_FIXTURE_ONLY, separate HTML/screenshot, never merged into CASE-01 customer facts.

PDF / A4 / MOBILE results
${pdf.map(p=>`${p.caseId}: ${p.pageCount} A4 pages; blank body pages=0; ${p.path}; SHA-256 ${p.sha256}`).join('\n')}
11/11 390px mobile audits PASS: no horizontal overflow; figure text ≥13px. A4 210×297mm HTML and 595×842pt PDF verified. Browser artwork decoded locally; nine before/after full-figure pairs and page-context pairs prepared.

PROTECTED ASSET DIFF
PASS: all 16 embedded artworks including P01–P05, SEC01–SEC10 Masters and shared body artwork hash-exact. Protected body paragraphs/tables/source notes/static page DOM exact across 11 cases. Profile payloads/source dates/values/trace hashes exact. W11R5 reference PDF and three prior generated audit files preserved. Diff artifact: PRD-W11R6-PROTECTED-ASSET-DIFF.json.

PROVIDER CALLS / OPENAI CALLS / ZERO COST EVIDENCE
0 / 0. ${processes.length} actual Node process records; all external Node networking blocked, inherited zero-cost guard and credential stripping; browser external requests=0. Proof: PRD-W11R6-ZERO-COST-EVIDENCE.json and zero-cost-processes.jsonl. No paid report regeneration or external ingestion.

CHECKS PASS / CHECKS FAIL / BASELINE_EXTERNAL / NOT_RUN
PASS: ${results.filter(r=>r.status==='PASS').map(r=>r.command).join('; ')}
Within aggregate check:profile:prd-w11r6: semantic-grammar, provenance-preservation, publication-legibility and review-browser PASS (real nested command output in its log).
FAIL / BASELINE_EXTERNAL: check:cpr, identical starting/current public-assets digest assertion. Before actual/expected: ${pair(beforeCpr).join(' / ')}; after: ${pair(afterCpr).join(' / ')}. Independent freeze/checker left unchanged.
Previous full npm run check (before W11R6) also failed in Book W1F WPR successor SHA check; outside this repair, no freeze rewritten. Log: .tmp/full-check-import-compat-verified.log.
NOT_RUN: new full repository npm run check after W11R6 (targeted required regressions run); live account/customer proof; native interactive print dialog; PRD-W12; human acceptance; production activation/deploy. None are claimed PASS.

FILES CREATED / MODIFIED (scoped only) / UNTOUCHED PROTECTED ASSETS
Modified against captured originals:
${changed.join('\n')}
Additional scoped compatibility patch: scripts/check-profile-personal-evidence-w11r5-browser.mjs redirects local recheck evidence into w11r6/legacy-w11r5; existing W11R5 receipts restored/preserved. Backed up before its targeted edit.
Created W11R6 artifacts/scripts (some may have been committed by owner concurrently; no agent commit):
${created.join('\n')}
All untracked/dirty unrelated financial, ZiWei, shared-delivery, QA script, receipt and product-convergence files retained. No stage-all, reset, clean or stash performed.

LOCAL HUMAN REVIEW URL (confirmed accessible)
${review.verifiedUrl}
HTTP local image/report loading verified at desktop and 390px; no external image fetching. Decision template is non-interactive; owner must return a clear message. No click or prefilled choice records governance acceptance.

OWNER DECISIONS REQUIRED
Per-figure ACCEPT / REJECT for all nine canonical IDs, plus WHOLE REPORT ACCEPT / REJECT. PFIG/source readiness is distinct from interpretation and HUMAN_APPROVED. PC-R1 PROFILE DEMOTION ACCEPT and other authorization gates must be independently satisfied.
W11R6: READY_FOR_HUMAN_REVIEW
PRD-W12: BLOCKED
COMMIT / PUSH / DEPLOY: NOT PERFORMED
`;
writeReviewFile(dir+'PRD-W11R6-FINAL-REPORT.md',report);
writeReviewFile(dir+'completion.json',JSON.stringify({timestamp:new Date().toISOString(),status:'READY_FOR_HUMAN_REVIEW',startingHead:baseline.head,currentHead,caseCount:11,figuresPerCase:9,case01Pages:49,providerCalls:0,openAiCalls:0,reviewUrl:review.verifiedUrl,externalFailures:['check:cpr BASELINE_EXTERNAL'],humanApproved:false,w12:'BLOCKED',commit:false,push:false,deploy:false},null,2));
console.log('W11R6 READY_FOR_HUMAN_REVIEW; PRD-W12 BLOCKED; no commit/push/deploy.');
