import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const phase=(process.argv[2]||'ALL').toUpperCase();
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p));
const exists=p=>fs.existsSync(path.join(ROOT,p));
const check=(id,fn)=>{if(phase!=='ALL'&&phase!==id)return;fn();console.log(`✓ CX-${id} current customer-system contract passed.`)};
const redirects=read('_redirects').split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#')).map(x=>x.split(/\s+/));
const redirectMap=new Map(redirects.map(([from,to,status])=>[from,{to,status}]));
const routeFile=r=>r==='/'?'index.html':`${r.replace(/^\//,'').replace(/\/$/,'')}/index.html`;
const cxPage=p=>{assert(exists(p),`${p} missing`);const h=read(p);assert.match(h,/data-cx-surface=/);assert.match(h,/data-cx-header/);assert.match(h,/data-cx-footer/);assert.match(h,/\/assets\/customer-ui\/js\/shell\.js/);assert.doesNotMatch(h,/\/assets\/css\/(?:public-experience|design\/|tokens\.css)/);assert.doesNotMatch(h,/data-public-header-placeholder|data-public-footer-placeholder|class="public-page"|puxr-/);return h};
const bilingual=h=>{assert.match(h,/data-cx-en=/);assert.match(h,/data-cx-zh=/)};

check('R11',()=>{
 const a=json('content/customer-experience-rebuild/authority/cx-r11-source-aware-perspectives-v1.json');assert.equal(a.status,'ENGINEERING_COMPLETE');
 const hub=cxPage('perspectives/index.html');const rel=cxPage('perspectives/relationship/index.html');const prof=cxPage('perspectives/profile/index.html');
 for(const s of ['PERSONAL','RELATIONSHIP','PROFILE & ASSESSMENT','CURRENT CONTEXT','SYMBOLIC / INTERPRETIVE','REFLECTIVE'])assert(hub.includes(s),`R11 hub missing ${s}`);
 for(const s of ['Measured / task-based','Self-reported','External profile','Symbolic / interpretive','Current Reality','Professional evidence'])assert(hub.includes(s)||rel.includes(s),`R11 source legend missing ${s}`);
 assert.match(rel,/Person A/);assert.match(rel,/Person B/);assert.doesNotMatch(rel,/compatibility\s*\d+%/i);assert.equal(a.boundaries.relationshipMeaningCreated,false);assert.equal(a.boundaries.profileScoringCreated,false);bilingual(hub);bilingual(rel);bilingual(prof);
});
check('R14',()=>{
 const a=json('content/customer-experience-rebuild/authority/cx-r14-r16-customer-continuity-v1.json');assert.equal(a.professional.releasedReportsOnly,true);assert.equal(a.professional.draftReportSearchAllowed,false);
 for(const p of ['professional/index.html','professional/authority/index.html','professional/reports/index.html','professional/services/index.html','professional/appointments/index.html'])bilingual(cxPage(p));
 const reports=read('professional/reports/index.html');assert.match(reports,/released/i);assert.doesNotMatch(reports,/search draft|draft search/i);
});
check('R15',()=>{
 const a=json('content/customer-experience-rebuild/authority/cx-r14-r16-customer-continuity-v1.json');const h=cxPage('account/index.html');
 for(const s of a.account.sections)assert(h.toLowerCase().includes(s.toLowerCase()),`Account missing ${s}`);assert.equal(a.account.guestHiddenHistory,true);assert.equal(a.account.futureLrmVisibleWhenFalse,false);assert.doesNotMatch(h,/\bLRM\b|\bRCL\b|coming soon/i);assert(exists('assets/customer-ui/js/surfaces/account.js'));bilingual(h);
});
check('R16',()=>{
 const a=json('content/customer-experience-rebuild/authority/cx-r14-r16-customer-continuity-v1.json');const home=cxPage('academy/index.html');const lesson=cxPage('academy/lesson/index.html');const js=read('assets/customer-ui/js/surfaces/academy.js');
 for(const p of a.academy.sourceRegistries)assert(exists(p),`ALR registry missing ${p}`);assert.equal(a.academy.learningRuntimeRebuiltByCx,false);assert.equal(a.academy.fakeProgressAllowed,false);assert.match(js,/learning-path-registry-v1\.json/);assert.match(js,/lesson-registry-v1\.json/);assert.doesNotMatch(home+lesson,/\d+% complete|certificate earned/i);bilingual(home);bilingual(lesson);
});
check('R17',()=>{
 const a=json('content/customer-experience-rebuild/authority/cx-r17-r19-quality-system-v1.json');assert.deepEqual(a.locale.supported,['en','zh-Hans']);assert(exists(a.locale.authority));
 for(const p of ['perspectives/index.html','perspectives/relationship/index.html','professional/index.html','account/index.html','academy/index.html']){const h=read(p);bilingual(h);assert.doesNotMatch(h,/puxr-lang|class="(?:zh|en)"/)}
});
check('R18',()=>{
 const a=json('content/customer-experience-rebuild/authority/cx-r17-r19-quality-system-v1.json');assert.deepEqual(a.responsive.validationWidths,[320,360,390,430,768,1024,1440,1920]);const css=read('assets/customer-ui/surfaces/customer-system.css');assert.match(css,/@media\s*\(max-width:\s*52rem\)/);assert.doesNotMatch(css,/min-width:\s*(?:[89]\d{2}|1\d{3})px/);assert.equal(a.responsive.horizontalOverflowAllowed,false);
});
check('R19',()=>{
 const a=json('content/customer-experience-rebuild/authority/cx-r17-r19-quality-system-v1.json');assert.equal(a.accessibility.keyboardRequired,true);assert.equal(a.accessibility.focusVisibleRequired,true);assert.match(read('assets/customer-ui/base.css'),/:focus-visible/);assert.match(read('assets/customer-ui/motion.css'),/prefers-reduced-motion/);
 for(const p of ['professional/reports/index.html','academy/lesson/index.html']){const h=read(p);assert.match(h,/<main\b/);assert.match(h,/cx-skip/)}
});
check('R21',()=>{
 const a=json('content/customer-experience-rebuild/contracts/cx-r21-customer-consent-ux-v1.json');assert.equal(a.noSilentAccountContext,true);assert.equal(a.protectedContextClientSelfAuthorizationAllowed,false);assert(exists(a.predecessorAskRegistry));const ask=read('assets/customer-ui/js/surfaces/contextual-ask.js');assert.match(ask,/resolvedAskContexts|knowledgeContext|context/i);
});
check('R22',()=>{
 const a=json('content/customer-experience-rebuild/contracts/cx-r22-future-runtime-slots-v1.json');assert.equal(a.futureRuntimeCreatedByCx,false);assert.equal(a.slots.LRM.visibleNow,false);assert.equal(a.slots.RCL.visibleNow,false);assert.equal(a.slots.VAL.fakeBadgeAllowedNow,false);assert.equal(a.slots.RME.precreatedMetricCardsAllowed,false);assert.doesNotMatch(read('account/index.html'),/\bLRM\b|\bRCL\b/);
});
check('R23',()=>{
 const a=json('content/customer-experience-rebuild/acceptance/cx-r23-visual-review-matrix-v1.json');assert.equal(a.status,'MACHINE_READY_HUMAN_VISUAL_REVIEW_REQUIRED');assert.equal(a.humanAcceptedClaimed,false);assert(a.surfaces.length>=12);assert(a.surfaces.every(x=>x.machineState==='READY'&&x.humanVisualState==='PENDING'));
});
check('R24',()=>{
 const a=json('content/customer-experience-rebuild/audits/cx-r24-performance-budget-v1.json');assert.equal(a.rules.externalFontDependencyOnNewCxSurfaces,false);assert(exists(a.newPhase1SurfaceBundle));for(const p of a.newPhase1Scripts)assert(exists(p));
 for(const p of ['perspectives/index.html','perspectives/relationship/index.html','professional/index.html','professional/authority/index.html','professional/reports/index.html','professional/services/index.html','professional/appointments/index.html','account/index.html','academy/index.html','academy/lesson/index.html'])assert.doesNotMatch(read(p),/fonts\.googleapis\.com|fonts\.gstatic\.com/);
});
check('R25',()=>{
 const a=json('content/customer-experience-rebuild/migration/customer-route-cutover-registry-v1.json');assert.equal(a.status,'CURRENT_CUTOVER_RECONCILED');for(const e of a.entries){const r=redirectMap.get(e.legacyPath);assert(r,`missing redirect ${e.legacyPath}`);assert.equal(r.status,'308',`${e.legacyPath} must be 308`);assert.equal(r.to,e.newPath,`${e.legacyPath} target drift`);assert(exists(e.successorFile),`successor missing ${e.successorFile}`)}
});
check('R26',()=>{
 const a=json('content/customer-experience-rebuild/migration/cx-r26-legacy-presentation-retirement-successor-v1.json');for(const p of a.physicallyDeletedInBaseline)assert.equal(exists(p),false,`retired presentation restored: ${p}`);for(const p of a.compatibilityOnlyButMayStillExist){const legacy='/'+p;const r=redirectMap.get(legacy);assert(r&&r.status==='308',`compatibility page missing 308: ${legacy}`)}
 for(const p of ['perspectives/index.html','perspectives/relationship/index.html','professional/index.html','account/index.html','academy/index.html'])cxPage(p);
});
check('R27',()=>{
 const a=json('content/customer-experience-rebuild/audits/cx-r27-customer-surface-parity-v1.json');assert.equal(a.secondBackendReadinessAuthorityCreated,false);for(const x of a.matrix){const f=routeFile(x.surface);assert(exists(f),`parity surface missing ${x.surface} -> ${f}`)}
});
check('R28',()=>{const a=json('content/customer-experience-rebuild/acceptance/cx-r28-full-regression-v1.json');assert.equal(a.status,'ENGINEERING_REGRESSION_READY');assert.equal(a.fullRepositoryPassClaimed,false);assert(a.required.includes('npm run check:cx-rebuild'));assert(a.required.includes('npm run check'))});
check('R29',()=>{const a=json('content/customer-experience-rebuild/freeze/customer-experience-v1-freeze.json');assert.equal(a.status,'FREEZE_CANDIDATE_BLOCKED');assert.equal(a.frozenClaimed,false);assert(a.blockers.includes('CX_R23_HUMAN_VISUAL_ACCEPTANCE_PENDING'));assert(a.blockers.includes('CX_R28_FULL_REAL_REPOSITORY_NPM_CHECK_PENDING_AFTER_DELTA_APPLY'))});
check('R30',()=>{const a=json('content/customer-experience-rebuild/contracts/cx-r30-post-cutover-protection-v1.json');assert.equal(a.status,'PROTECTION_ACTIVE');assert.equal(a.rules.majorInlineStyleOnProductionCxPageAllowed,false);assert.equal(a.rules.runtimeOwnedUiFrameworkAllowed,false);assert.equal(a.rules.newRuntimeMustProvideCustomerProjectionContract,true);for(const p of ['perspectives/relationship/index.html','professional/index.html','account/index.html','academy/index.html'])assert.doesNotMatch(read(p),/<style\b|!important|data-public-header-placeholder|\/assets\/css\/public-experience\.css/)});

if(phase==='ALL') console.log('✓ CX-R10–R30 current customer-system engineering chain passed; R23/R28/R29 remain intentionally fail-closed where declared.');
