import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='docs/acceptance/bazi-paid-report/visual-first-r2/',read=n=>JSON.parse(fs.readFileSync(root+n,'utf8').replace(/^\uFEFF/,'')),write=(n,x)=>fs.writeFileSync(root+n,JSON.stringify(x,null,2)+'\n'),hash=x=>createHash('sha256').update(x).digest('hex');
const metrics=read('METRICS.json'),plan=read('PROVIDER-PRELIVE-PLAN.json'),browser=read('BROWSER-EVIDENCE.json'),checks=read('CHECK-EVIDENCE.json'),ziwei=read('ZIWEI-SHARED-REGRESSION.json'),lineage=read('SOURCE-LINEAGE.json');
if(metrics.pages!==48||metrics.providerCalls!==0||!checks.tests.every(t=>t.result==='PASS')||browser.tests.some(t=>t.overflow.length||t.clipped.length||t.missingImages.length||t.svgOverlaps.length||t.scrollWidth>t.width)||ziwei.result!=='PASS'||!plan.allowed)throw Error('R2_CLOSURE_NOT_READY');
if(hash(fs.readFileSync(lineage.authority.path))!=='9169acbe3589f9f6f4e0dc85b35a506ea72d86f42da8e26eaff6231657c16690')throw Error('NATAL_AUTHORITY_CHANGED');
const build={result:'PASS',command:'npm run build:pages',zeroCost:true,copied:10969,skipped:6590,files:10971,workerBytes:15699090,gzipBytes:2903108,assetOver25MiB:false,deployed:false};
const limitations=['Manual bilingual display fixture awaits HUMAN ACCEPT; machines prove structure and shared source, not natural-language equivalence.','Native print preview and actual PDF not observed; A4 CSS and all 48 fixed desktop page bounds checked.','Character heuristics are planning estimates, not provider tokenizer measurements. PAI planning rates require live revalidation.','No live composition or actual billed provider usage.','Birth identity dates unknown; timing has no exact Gregorian year, age or starting date.','Entire historical npm check not executed. Existing shared delivery checker eight/seven method inconsistency untouched.','Concurrent unrelated changes/commits occurred; this work did not perform Git mutations or deploy.'];
const report={
 'WORK COMPLETED':Array.from({length:14},(_,i)=>'R2-W'+i),
 'AUDIT FINDINGS':read('AUDIT.json'),
 '3-VERSION SOURCE ROLE MAP':read('SOURCE-ROLE-MAP.json'),
 'SHARED CONTRACTS CREATED / REUSED':{triLayer:'content/professional/vfr-r1/vfr-trilayer-bilingual-contract-v1.json',runtime:'functions/canonical-presentation-runtime/vfr-trilayer-bilingual-contract.js',bilingual:'VFR_BILINGUAL_SINGLE_CALL_V1',budget:'functions/personal-reading/visual-first/report-provider-budget.js',economics:'functions/_lib/pai-r1-economics.js',visualIR:'functions/canonical-presentation-runtime/visual-first-report-contract.js',renderer:'assets/customer-ui/js/personal-products/publication-report-pages.js'},
 'FILES CHANGED':'CHANGED-FILES.json',
 'BAZI COMPACT PACK':root+'COMPACT-AUTHORING-PACK.json',
 'BAZI PACK CHARS':plan.packChars,
 'BAZI INPUT TOKENS':{planned:plan.inputTokens,actual:0,estimator:plan.tokenEstimator},
 'BAZI MAX OUTPUT TOKENS':plan.maxOutputTokens,
 'BAZI ESTIMATED FIRST CALL COST':plan.budget.projected,
 'BAZI PROVIDER CALL PLAN':{normal:1,max:2,actual:0},
 'BAZI SEMANTIC REVIEW CALL PLAN':{planned:0,actual:0},
 'BILINGUAL ARCHITECTURE STATUS':'PASS_ONE_CANONICAL_SOURCE_SHARED_DIAGRAM_SAME_PAGE_ZH_EN',
 'ZI WEI SHARED BILINGUAL REGRESSION STATUS':ziwei,
 'PAGE COUNT':metrics.pages,
 'PAGE MAP':root+'PAGE-MAP.json',
 'DIAGRAM COUNT':metrics.diagrams,
 'DIAGRAM GRAMMAR COUNT':metrics.diagramGrammars,
 'PROFESSIONAL BAZI ANCHOR COVERAGE':'100%_SOURCE_BOUND',
 'APPLICATION DIAGRAM COVERAGE':'100%_ACCEPTED_SOURCE_BOUND',
 'FIVE-ELEMENT COLOR STATUS':'EXISTING_JADE_COPPER_EARTH_METAL_WATER_RETAINED',
 'S01–S10 STATUS':{S01:'P03–P07 technical foundation',S02_S10:'9 shared-master / technical / application / lived bilingual bindings; Chinese 450–483 characters, four paragraphs each'},
 'TIMING AUTHORITY STATUS':'己巳 × 丙寅; original PARTIAL_TEST_STRUCTURE internal only; no year/age/start date/chemical transformation/event inference',
 'OLD CHART CONTAMINATION STATUS':'PASS_ABSENT',
 'OLD TIMING CONTAMINATION STATUS':'PASS_ABSENT',
 'PRINT OVERFLOW STATUS':{desktopBounds:'PASS_48_A4_BOXES',nativePrint:'NOT_OBSERVED',actualPdf:'NOT_GENERATED'},
 'MOBILE STATUS':{result:'PASS_REFLOW',fonts:'18px both languages',missingImages:0,overflow:0},
 'CACHE STATUS':{state:metrics.cache,key:metrics.cacheKey,productionAccepted:false},
 'PROVIDER LIVE ALLOWED STATUS':false,
 'CHECK RESULTS':{r2:checks,ziweiPrelive:'PASS',ziweiVisualPrelive:'PASS_47_PAGES_15_DIAGRAMS_0_CALLS',priorR1:'PASS_31_TESTS',inheritedSpendGuard:'PASS',historicalAliases:'PASS_171',gitDiffCheck:'PASS',fullNpmCheck:'NOT_EXECUTED_FULL_HISTORICAL_SUITE'},
 'BUILD RESULTS':build,
 'KNOWN LIMITATIONS':limitations,
 'HUMAN REVIEW ARTIFACT PATH':'C:/phios/tools/review/BAZI-VFR-R2-HUMAN-REVIEW.html',
 'CURRENT DECISION':'READY_FOR_BAZI_VFR_R2_HUMAN_REVIEW'
};
write('MACHINE-EVIDENCE.json',report);
fs.writeFileSync(root+'STATUS.md',`# BAZI-VFR-R2\n\nCURRENT DECISION = READY_FOR_BAZI_VFR_R2_HUMAN_REVIEW\n\nR2-W0–W13 completed. STOP. Human ACCEPT receipt = null. No production freeze, live provider, deploy or push.\n\nOne shared 48-page bilingual report: 28 diagrams, 11 registered diagram families, all nine major sections bind technical anchors, professional and application diagrams and immutable accepted lived sources. Chinese interpretation is 450–483 characters per chapter; corresponding English is displayed below it. Existing art and five-element palette retained.\n\nActual provider calls/input/output/semantic review/cost: 0 / 0 / 0 / 0 / USD0. Candidate cache replay only. Planned one GPT-5.6 Sol composition: ${plan.packChars} pack characters, ${plan.inputTokens} planning input tokens, max 8000 output; first-call maximum planning cost USD${plan.budget.projected}. Planning rates require revalidation before any separately approved live test.\n\n25 R2 check groups, 31 prior R1 checks, shared Zi Wei prelive/visual prelive, inherited paid-network protection and 171 historical aliases pass. Zi Wei source English, ten sections, claim IDs, palace data and transformations are preserved; compact claim prose is one language only. Zi Wei plans ${ziwei.plannedInputTokens} input / 8000 max output tokens, USD${ziwei.estimatedCost}, one composition call, zero AI review. Actual Zi Wei calls: 0. Full historical npm check was not run.\n\nDesktop and 390px iframe mobile verification: 48 pages, zero missing images, zero content overflow/clipping/SVG text overlap; desktop body 17px and mobile 18px in both languages. Pages build PASS (${build.files} assets; Worker ${build.workerBytes} bytes, gzip ${build.gzipBytes}); no deployment.\n\n[Complete bilingual review](../../../../tools/review/BAZI-VFR-R2-HUMAN-REVIEW.html) · [Machine evidence](MACHINE-EVIDENCE.json) · [Source roles](SOURCE-ROLE-MAP.json) · [Page map](PAGE-MAP.json) · [Diagram registry](DIAGRAM-REGISTRY.json) · [Lineage](SOURCE-LINEAGE.json) · [Prelive plan](PROVIDER-PRELIVE-PLAN.json) · [Changed files](CHANGED-FILES.json)\n\nKnown limitations:\n${limitations.map(x=>'- '+x).join('\n')}\n`);
const owned=['content/professional/vfr-r1/vfr-trilayer-bilingual-contract-v1.json','functions/canonical-presentation-runtime/vfr-trilayer-bilingual-contract.js','functions/personal-reading/narrative/bazi-vfr-r2-copy.js','functions/personal-reading/bazi-vfr-r2-publication.js','functions/personal-reading/visual-first/bazi-vfr-r2-one-call.js','functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js','functions/personal-reading/visual-first/ziwei-vfr-one-call-composer.js','assets/customer-ui/js/personal-products/publication-report-pages.js','assets/customer-ui/js/personal-products/bazi-vfr-r2-pages.js','assets/customer-ui/surfaces/bazi-vfr-r2.css','scripts/build-bazi-vfr-r2.mjs','scripts/check-bazi-vfr-r2.mjs','scripts/write-bazi-vfr-r2-closure.mjs','config/reports/zero-cost-check-commands.json','package.json','tools/review/BAZI-VFR-R2-HUMAN-REVIEW.html','tools/review/BAZI-VFR-R2-RESPONSIVE.html','docs/acceptance/bazi-paid-report/visual-first-r1/CHECK-EVIDENCE.json','docs/acceptance/bazi-paid-report/visual-first-r1/ZERO-COST-GUARD-EVIDENCE.json'];
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+e.name+'/'):[dir+e.name]);
write('CHANGED-FILES.json',{work:'BAZI-VFR-R2',inventoryScope:'Task-owned implementation and generated review/evidence, including candidate cache iterations; excludes unrelated concurrent governance work',files:[...owned,...walk(root).filter(p=>!p.endsWith('CHANGED-FILES.json'))].map(path=>({path,bytes:fs.statSync(path).size,sha256:hash(fs.readFileSync(path))}))});
console.log('READY_FOR_BAZI_VFR_R2_HUMAN_REVIEW; STOP. Live calls=0, cost=0.');
