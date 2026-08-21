import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const phase = (process.argv[2] || 'ALL').toUpperCase();
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const text = (p) => fs.readFileSync(path.join(ROOT,p),'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT,p));
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const j = {
  pf1:'content/web-production/post-freeze/wpr-pf/audits/wpr-pf1-book-drift-audit-v1.json',
  pf2:'content/web-production/post-freeze/wpr-pf/audits/wpr-pf2-asset-drift-audit-v1.json',
  pf3:'content/web-production/post-freeze/wpr-pf/registries/wpr-pf3-runtime-orphan-registry-v1.json',
  pf4:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf4-source-acceptance-v1.json',
  pf5:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf5-route-acceptance-v1.json',
  pf6:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf6-asset-acceptance-v1.json',
  pf7:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf7-composition-acceptance-v1.json',
  pf8:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf8-privacy-acceptance-v1.json',
  pf9:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf9-terminology-acceptance-v1.json',
  pf10:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf10-runtime-consumption-acceptance-v1.json',
  pf11:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf11-visual-coverage-acceptance-v1.json',
  pf12:'content/web-production/post-freeze/wpr-pf/acceptance/wpr-pf12-pre-deployment-production-acceptance-v1.json',
};
const run = (n, fn) => { if (phase === 'ALL' || phase === `PF${n}`) { fn(); console.log(`✓ WPR-PF${n} passed.`); } };

run(1,()=>{
  const out=read(j.pf1), books=read('content/registry/books.json').books, parts=read('content/registry/parts.json').parts;
  assert.equal(out.status,'NO_BOOK_DRIFT'); assert.equal(books.length,5);
  const exp=[['BOOK-1',1,'Reality Formation',[1,2,3,4]],['BOOK-2',2,'Reality Runtime',[5,6,7]],['BOOK-3',3,'Reality Continuity',[8,9]],['BOOK-4',4,'Reality Civilization',[10,11,12]],['BOOK-5',5,'Reality Navigation',[13,14,15]]];
  for (const [code,vol,title,pnums] of exp){ const b=books.find(x=>x.bookCode===code); assert.ok(b,`${code} missing`); assert.equal(b.volume,vol); assert.equal(b.title.en,title); assert.deepEqual(b.parts,pnums); for(const pn of pnums) assert.equal(parts.find(x=>x.number===pn)?.book,`book-${vol}`,`P${pn} owner drift`); }
  const context=read('content/web-production/registries/wpr-five-volume-publication-context-registry-v1.json');
  assert.equal(context.identityPolicy.nodeBPrefixBookInferenceAllowed,false); assert.equal(context.identityPolicy.publicationOwnershipAuthoritative,true);
  const own=Object.fromEntries((context.partOwnership||[]).map(x=>[x.partNumber||x.part,x.publicationBookCode||x.bookCode||x.book]));
  for(const pn of [8,9]) assert.match(String(own[pn]),/BOOK-3|book-3/i); for(const pn of [10,11,12]) assert.match(String(own[pn]),/BOOK-4|book-4/i); for(const pn of [13,14,15]) assert.match(String(own[pn]),/BOOK-5|book-5/i);
  const booksJs=text('assets/js/pages/books.js'); assert.match(booksJs,/registry\.books\.length\s*!==\s*5/); assert.doesNotMatch(booksJs,/KN-B\d[^\n]{0,80}(book|volume)/i);
});

run(2,()=>{
  const out=read(j.pf2), reg=read('content/registry/public-assets.json'); assert.equal(out.status,'NO_ACTIONABLE_ASSET_DRIFT_REPOSITORY_SCOPE'); assert.equal(reg.resolution_policy.fail_closed,true);
  for(const a of reg.assets){ if(a.status==='remote-verified'){assert.equal(a.verification,'verified-remote-head-get',a.asset_code); assert.equal(a.remote?.http_status,200,a.asset_code); assert.ok(a.object_key,a.asset_code);} }
  const deprecated=reg.assets.filter(a=>/deprecated/i.test(a.status||'')); assert.equal(deprecated.length,0,'deprecated asset still in public registry');
  const pub=read('content/professional/canonical-asset-runtime/registries/published-asset-registry-v1.json'); const pubs=pub.publications||pub.records||[];
  if(pubs.length) for(const p of pubs) assert.ok(p.consumer||p.surfaceConsumers?.length,`published asset ${p.assetCode||p.code} has no consumer`);
  const keys=reg.assets.map(a=>a.object_key).filter(Boolean); const htmls=[]; const walk=d=>{for(const e of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const r=path.join(d,e.name); if(e.isDirectory() && !['node_modules','.git'].includes(e.name)) walk(r); else if(e.isFile()&&r.endsWith('.html')) htmls.push(r);}}; walk('.');
  for(const h of htmls){const s=text(h); for(const k of keys) assert.equal(s.includes(k),false,`${h} hard-codes governed object key ${k}`);}
});

run(3,()=>{
  const out=read(j.pf3), rows=out.records||out.runtimes||out.entries||out.runtimeRecords; assert.equal(out.status,'NO_SILENT_RUNTIME_ORPHAN'); assert.ok(Array.isArray(rows)&&rows.length>=10);
  const req=['runtimeCode','architectureState','productionState','webProjection','expectedSurface','actualConsumer','status'];
  for(const r of rows){for(const k of req) assert.ok(Object.hasOwn(r,k),`${r.runtimeCode||'?'} missing ${k}`); assert.notEqual(r.status,'ORPHAN'); if(r.status==='CONSUMED') assert.ok(r.actualConsumer.length>0); if(r.actualConsumer.length===0 && !/NONE_BY_DESIGN/.test(r.webProjection)) assert.ok(/BLOCKED|NOT_ACTIVATED|VALIDATION/.test(`${r.status} ${r.productionState}`),`${r.runtimeCode} silent orphan`);}
});

run(4,()=>{
  const out=read(j.pf4), src=read('content/web-production/registries/wpr-production-source-registry-v1.json'); assert.equal(out.status,'SOURCE_ACCEPTED'); for(const v of Object.values(out.gates)) assert.equal(v,true);
  for(const e of src.entries){assert.ok(exists(e.reference),`${e.sourceCode} source missing`); assert.notEqual(e.sourceClass,'CANDIDATE');}
  const pka=read('content/knowledge/public/authority/published-knowledge-authority.json'); assert.equal(pka.recordCount,pka.records.length); for(const r of pka.records){assert.equal(r.eligibility?.contentReviewed,true);assert.equal(r.eligibility?.approved,true);assert.equal(r.eligibility?.published,true);}
  const runt=read('content/web-production/registries/wpr-runtime-consumption-registry-v1.json').entries; const mpa=runt.find(x=>x.runtimeCode==='MPA'); assert.equal(mpa.productionExecutionActivated,false); const pr=runt.find(x=>x.runtimeCode==='PR'); assert.equal(pr.professionalJudgmentCreatedByWpr,false);
});

const routeToFile=(p)=>{ if(p==='/') return 'index.html'; if(p==='/articles/:slug') return null; const clean=p.replace(/^\//,''); const candidates=[`${clean}.html`,`${clean}/index.html`]; return candidates.find(exists)||null; };
run(5,()=>{
  const out=read(j.pf5), rr=read('content/web-production/registries/wpr-route-registry-v1.1.json'), manifest=read('content/web-production/surface-production-manifest-v1.json'); assert.equal(out.status,'ROUTES_ACCEPTED_REPOSITORY_SCOPE');
  const surfaceAliases={HOME:'HOMEPAGE',BOOK:'BOOKS',ACADEMY_DISCOVERY:'ACADEMY',REALITY_JOURNEY_OVERVIEW:'REALITY_JOURNEY',REALITY_JOURNEY_LOCAL:'REALITY_DASHBOARD',REALITY_ENTRY:'REALITY_JOURNEY',PROFESSIONAL:'SERVICES',FINANCIAL:'FINANCIAL_REALITY',PERSONAL_RUNTIME_SETUP:'PERSONAL_REALITY',PROFESSIONAL_REPORT_VIEWER:'REPORT',LEGAL:false,CHECKOUT:false,ABOUT:false,CONTACT:false};
  for(const r of rr.entries){ assert.equal(r.localeMode,'RUNTIME_LOCALE'); if(r.path==='/articles/:slug'){const pka=read('content/knowledge/public/authority/published-knowledge-authority.json'); for(const rec of pka.records.filter(x=>x.article?.slug)) assert.ok(exists(`articles/${rec.article.slug}.html`),`article route missing ${rec.article.slug}`);} else assert.ok(routeToFile(r.path),`route ${r.path} does not resolve`); const mapped=Object.hasOwn(surfaceAliases,r.surfaceCode)?surfaceAliases[r.surfaceCode]:r.surfaceCode; if(mapped) assert.ok(manifest.surfaces.some(s=>s.surfaceCode===mapped),`route ${r.routeCode} surface not in manifest`); }
  assert.ok(exists('assets/js/locales/en')&&exists('assets/js/locales/zh-Hans')); const re=text('reality-entry.html'); assert.match(re,/url=\/reality\//); assert.match(re,/canonical[^>]+\/reality\//); const red=text('_redirects'); assert.match(red,/\/books\/reality-maintenance\/\s+\/books\/reality-continuity\/\s+308/);
});

run(6,()=>{
  const out=read(j.pf6), reg=read('content/registry/public-assets.json'); assert.equal(out.status,'ASSETS_ACCEPTED_REPOSITORY_RESOLUTION_SCOPE'); const covers=reg.assets.filter(a=>a.category==='book-cover'); assert.equal(covers.length,5); for(const a of covers){assert.equal(a.status,'remote-verified');assert.equal(a.remote?.http_status,200);}
  const h16=read('content/web-production/acceptance/wpr-post-freeze-visual-acceptance-v1.json'); for(const code of h16.assetAccounting.directCurrentConsumptionEvidenceCodes.filter(c=>c.startsWith('FIG-'))){const a=reg.assets.find(x=>x.asset_code===code);assert.ok(a,`${code} not public registered`);assert.equal(a.status,'remote-verified',code);}
  const illustrations=reg.assets.filter(a=>a.category==='illustration'); assert.equal(illustrations.length,0,'unaccepted production illustration unexpectedly registered'); const vr=read('content/web-production/registries/client-visual-asset-registry-v1.2.json').assets; assert.ok(vr.some(a=>a.assetType==='ILLUSTRATION'&&a.state==='PLANNED'));
  const resolver=text('assets/js/runtime/web-production/asset-resolver.js'); assert.match(resolver,/\/api\/public-asset-config/); assert.match(resolver,/fail|unavailable|renderable/i); assert.equal(reg.resolution_policy.fail_closed,true);
});

run(7,()=>{
  const out=read(j.pf7), lin=read('content/web-production/bfr-pds-cpr-wpr-lineage-v1.json'); assert.equal(out.status,'COMPOSITION_ACCEPTED'); const needed=['index.html','library.html','figure.html','books/index.html','academy.html','reality-journey.html','personal-runtime.html','professional-workspace.html','professional/financial/index.html','professional-reports.html']; for(const p of needed){const row=lin.pageLineage.find(x=>x.actualPage===p); assert.ok(row,`lineage missing ${p}`);assert.equal(row.pdsTokenConsumed,true);assert.ok(row.lineage.includes('CPR_COMPOSITION')&&row.lineage.includes('WPR_PROJECTION')&&row.lineage.includes('ACTUAL_CLIENT'));}
  const pka=read('content/knowledge/public/authority/published-knowledge-authority.json'); assert.ok(pka.records.length>0); for(const r of pka.records.filter(x=>x.article?.slug).slice(0,5)){const f=`articles/${r.article.slug}.html`;assert.ok(exists(f));assert.match(text(f),/assets\/css\/tokens\.css/);}
});

run(8,()=>{
  const out=read(j.pf8), manifest=read('content/web-production/surface-production-manifest-v1.json'); assert.equal(out.status,'PRIVACY_ACCEPTED_REPOSITORY_POLICY_SCOPE'); for(const v of Object.values(out.gates)) assert.equal(v,true); const heads=text('_headers');
  for(const p of ['/account*','/reality-dashboard*','/personal-runtime*','/professional-workspace*','/professional-reports*','/reality-entry*']){assert.ok(heads.includes(p),`headers missing ${p}`); const block=heads.slice(heads.indexOf(p),heads.indexOf(p)+300); assert.match(block,/no-store/); assert.match(block,/noindex/);}
  assert.ok(manifest.surfaces.some(s=>s.audience.includes('PUBLIC'))); assert.ok(manifest.surfaces.some(s=>s.audience.includes('CUSTOMER'))); assert.ok(manifest.surfaces.some(s=>s.audience.includes('PROFESSIONAL'))); const pro=manifest.surfaces.find(s=>s.surfaceCode==='PROFESSIONAL_WORKSPACE'); assert.deepEqual(pro.audience,['PROFESSIONAL']);
  const w26=text('scripts/check-wpr-w26-privacy-security-production.mjs'); assert.match(w26,/no-store/i); assert.match(w26,/professional/i);
});

const stripHtml=(s)=>s.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ');
run(9,()=>{
  const out=read(j.pf9), vocab=read('content/web-production/registries/wpr-public-vocabulary-registry-v2.json'); assert.equal(out.status,'PUBLIC_TERMINOLOGY_ACCEPTED'); const restricted=[...new Set(vocab.entries.flatMap(e=>e.restrictedTerms||[]))];
  const pages=['index.html','knowledge-search.html','library.html','books/index.html','figure.html','academy.html','reality-journey.html','personal-runtime.html','professional/financial/index.html','services.html']; const articleFiles=fs.readdirSync(path.join(ROOT,'articles')).filter(x=>x.endsWith('.html')).map(x=>`articles/${x}`); pages.push(...articleFiles);
  const codeRe=/\b(?:WPR(?:-[A-Z0-9.]+)?|MPA|MCD(?:-[A-Z0-9.]+)?|CPR|PDS|KAP|KNR|RDG|RMO|RJX|ALR(?:-[A-Z0-9.]+)?|PJA|CAR)\b/g;
  for(const p of pages){let raw=text(p); if(p==='index.html'){const cut=raw.indexOf('data-hpc2-v8-teaser'); if(cut>0) raw=raw.slice(0,cut);} let visible=stripHtml(raw); for(const t of restricted) if(t) assert.equal(visible.includes(t),false,`${p} leaks restricted term ${t}`); const m=visible.match(codeRe); assert.equal(m,null,`${p} leaks internal code ${m?.[0]}`); assert.doesNotMatch(visible,/four[- ]volume|四册系统|Volume III\s+Reality Civilization|Volume IV\s+Reality Navigation/i);}
  const academyJs=text('assets/js/pages/academy.js'); assert.match(academyJs,/lesson\.slug/); assert.doesNotMatch(academyJs,/href[^\n]+lesson\.code/);
});

run(10,()=>{
  const out=read(j.pf10), pf3=read(j.pf3), rows=pf3.records||pf3.runtimes||pf3.entries||pf3.runtimeRecords; assert.equal(out.status,'RUNTIME_CONSUMPTION_ACCEPTED'); assert.equal(rows.some(r=>r.status==='ORPHAN'),false); for(const r of rows){if(/ACTIVE|PUBLISHED|GOVERNANCE_AUTHORITY/.test(`${r.architectureState} ${r.productionState}`) && !/VALIDATION|BLOCKED|NOT_ACTIVATED/.test(r.productionState)) assert.ok(r.actualConsumer.length>0 || /NONE_BY_DESIGN/.test(r.webProjection),`${r.runtimeCode} lacks WPR consumer`);}
});

run(11,()=>{
  const out=read(j.pf11); assert.equal(out.status,'VISUAL_COVERAGE_ACCEPTED_REPOSITORY_SCOPE'); const req={'Homepage':'HIGH','Library':'MEDIUM_HIGH','Book':'HIGH','Article':'CONTENT_DEPENDENT','Figure':'PRIMARY_VISUAL','Academy':'MEDIUM','Journey':'MEDIUM','Personal Runtime':'FUNCTIONAL_VISUAL','Professional':'MEDIUM','Customer Workspace':'FUNCTIONAL'}; for(const [k,v] of Object.entries(req)){assert.equal(out.coverage[k]?.required,v);assert.equal(out.coverage[k]?.accepted,v);}
  const h16=read('content/web-production/acceptance/wpr-post-freeze-visual-acceptance-v1.json'); for(const [k,v] of Object.entries({HOMEPAGE:'HIGH',LIBRARY:'MEDIUM_HIGH',BOOK:'HIGH',ARTICLE:'CONTENT_DEPENDENT'})) assert.equal(h16.surfaceCoverage[k]?.accepted,v);
  const vr=read('content/web-production/registries/client-visual-asset-registry-v1.2.json').assets; const has=(surface)=>vr.some(a=>a.state==='UPLOADED'&&(a.expectedConsumers||[]).some(c=>c.surfaceCode===surface)); for(const s of ['ACADEMY','REALITY_JOURNEY','PERSONAL_RUNTIME','PROFESSIONAL_WORKSPACE','REALITY_DASHBOARD']) assert.ok(has(s),`no uploaded governed visual supply for ${s}`);
});

run(12,()=>{
  const out=read(j.pf12); assert.equal(out.status,'PRE_DEPLOYMENT_REPOSITORY_PRODUCTION_ACCEPTED'); for(const v of Object.values(out.gates)) assert.equal(v,true); assert.equal(out.deploymentState,'NOT_YET_ACCEPTED'); assert.equal(out.deploymentAccepted,false); assert.equal(out.globalProductionAccepted,false);
  const phase20=read('content/production-integration/phase20/acceptance/phase20-unified-production-integration-acceptance-v1.json'); assert.equal(phase20.acceptanceBoundary.liveDeploymentAccepted,false); const h16=read('content/web-production/acceptance/bfr-production-surface-acceptance-v1.json'); assert.equal(h16.acceptanceSemantics.productionBrowserRevalidationPending,true); assert.equal(h16.acceptanceSemantics.r2LiveEnvironmentRevalidationPending,true);
  const contract=read('content/web-production/post-freeze/wpr-pf/contracts/wpr-pf-production-assurance-contract-v1.json'); assert.equal(contract.acceptanceBoundary?.deploymentAcceptanceAllowed ?? contract.authorityBoundary?.deploymentAcceptanceAllowed ?? false,false);
  const freeze=read('content/web-production/post-freeze/wpr-pf/freeze/wpr-pf-repository-production-assurance-freeze-v1.json'); assert.equal(freeze.globalProductionAccepted,false); for(const a of freeze.artifacts||[]){assert.ok(exists(a.path),`freeze artifact missing ${a.path}`); assert.equal(sha(a.path),a.sha256,`freeze digest drift ${a.path}`);}
});

if (phase === 'ALL') console.log('✓ WPR-PF1–PF12 repository production assurance passed; deployment remains NOT_YET_ACCEPTED.');
