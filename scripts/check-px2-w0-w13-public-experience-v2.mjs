import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const exists=p=>fs.existsSync(path.join(root,p));
const pages=['index.html','library.html','articles.html','services.html','knowledge-search.html','books/index.html','professional/personal-runtime/index.html','professional/financial/index.html','reality/index.html','search/index.html','readings/index.html'];
for(const p of pages){const s=read(p);assert.match(s,/\/assets\/css\/phios-public-v2\.css/,`${p}: V2 CSS`);assert.match(s,/\/assets\/js\/public-shell-v2\.js/,`${p}: V2 shell`);for(const bad of ['puxr-v8.css','puxr-shell.js','knowledge-spine.css','runtime-spine.css','service-continuity.css','knowledge-spine-visuals.js','runtime-spine-visuals.js','service-continuity-visuals.js','client-production-surfaces.js'])assert.ok(!s.includes(bad),`${p}: legacy composition ${bad}`)}
const audit=json('content/web-production/px2/audit/px2-w0-current-public-consumer-audit-v1.json');assert.equal(audit.baselineCommit,'09329d4');assert.ok(audit.surfaces.length>=8);
const ia=json('content/web-production/px2/freeze/px2-w1-public-ia-freeze-v1.json');assert.equal(ia.status,'FROZEN');assert.deepEqual(ia.primaryJourney,['SEARCH','ASK','READ','FINANCIAL','MY_REALITY']);
const pointer=json('content/web-production/registries/current-client-visual-registry.json');assert.match(pointer.currentRegistryPath,/client-visual-asset-registry-v1\.7\.json$/);const vr=json(pointer.currentRegistryPath.replace(/^\//,''));for(const code of ['ILL-004','ILL-005','ILL-008','ILL-010']){const a=vr.assets.find(x=>x.sequence===code);assert.ok(a);assert.equal(a.r2.remoteVerified,true,`${code} remote verified`)}
const visual=read('assets/js/runtime/web-production/unified-public-visual-resolver.js');assert.match(visual,/current-client-visual-registry\.json/);assert.ok(!/client-visual-asset-registry-v1\.[0-9]+\.json/.test(visual));
const shell=read('assets/js/public-shell-v2.js');for(const href of ['/knowledge-search','/search/','/readings/','/professional/financial/','/reality/','/library','/account'])assert.ok(shell.includes(href),`shell route ${href}`);
const home=read('index.html');for(const href of ['/search/','/knowledge-search','/readings/','/professional/financial/','/reality/'])assert.ok(home.includes(href));assert.match(home,/data-px2-intent-form/);
assert.match(read('search/index.html'),/data-px2-search-results/);assert.match(read('assets/js/pages/search-v2.js'),/public\/retrieval\/publications\.json/);
assert.match(read('assets/js/components/publications-v2.js'),/\.\.\/public-shell-v2\.js/);
assert.match(read('knowledge-search.html'),/knowledge-search-b\.js/);assert.match(read('assets/js/pages/knowledge-search-b.js'),/isAnswerQuestionRelevant/);
const methods=json('content/web-production/px2/registries/public-method-catalog-v1.json');assert.equal(methods.methods.length,7);assert.ok(methods.methods.every(x=>x.runAllowed===false));for(const m of ['ASTROLOGY','BAZI','HUMAN_DESIGN','NUMEROLOGY','I_CHING','TAROT','ZI_WEI_DOU_SHU'])assert.ok(methods.methods.some(x=>x.methodCode===m));
assert.match(read('professional/financial/index.html'),/Financial Reality Navigation|Financial Runtime/);assert.match(read('articles.html'),/data-puxr-publications/);assert.match(read('books/index.html'),/data-px2-five-volumes/);
const reality=read('reality/index.html');assert.match(reality,/CURRENT REALITY/);assert.match(reality,/ILL-010/);assert.match(reality,/Start with my reality/);
const succ=json('content/web-production/px2/successors/px2-w11-checker-successor-v1.json');assert.equal(succ.status,'ACTIVE');
const zero=json('content/web-production/px2/deletion/px2-w12-zero-consumer-legacy-audit-v1.json');assert.equal(zero.status,'PASS');
const del=json('content/web-production/px2/deletion/px2-w13-physical-deletion-v1.json');for(const p of del.deleted)assert.equal(exists(p),false,`deleted: ${p}`);
console.log('✓ PX2-W0–W13 Public Experience V2 passed.');
console.log('  Search + Ask + Readings + Financial + My Reality IA is frozen; books/articles are visible and client visuals resolve through one pointer.');
console.log('  Legacy PUXR transitional files were physically removed; frozen BFR evidence and secondary legacy surfaces remain preserved until their own zero-consumer migration.');
