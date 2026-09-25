import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {normalizeReconfigurationAtlasState} from '../assets/js/pages/civilization-atlas/atlas-state.js';
import {reconfigurationAtlasStateFromUrl,reconfigurationAtlasUrlFromState} from '../assets/js/pages/civilization-atlas/atlas-url-state.js';
import {normalizeAtlasRetrievalScope,retrieveAtlasScope} from '../functions/_lib/atlas-retrieval-scope.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=p=>fs.readFile(path.join(root,p),'utf8');
const renderer=await read('assets/js/pages/civilization-atlas/reconfiguration-renderer.js'),discovery=await read('assets/js/knowledge/public-discovery.js'),knowledge=await read('assets/customer-ui/js/surfaces/knowledge.js'),book=await read('assets/js/pages/book-volume-seven.js');
for(const token of ['data-window-filter','data-region','data-type','data-trigger','data-pressure','data-change','civ-reconfig-timeline','compareCaseIds','snapshotLayer','previousVersion','compareDossierIds','livedRealityDimensionId'])assert.match(renderer,new RegExp(token));
assert.match(renderer,/slice\(0,4\)/);assert.match(renderer,/One static base visual|同一张静态底图/);assert.match(renderer,/No universal score|不转换为通用分数/);
for(const type of ['CASE','WINDOW','SNAPSHOT','DOSSIER','BOOK_SECTION','LIVED_REALITY']){assert.match(discovery,new RegExp("type:'"+type+"'"));assert.match(knowledge,new RegExp(type));}
for(const type of ['CASE','WINDOW','SNAPSHOT','DOSSIER','BOOK_SECTION','LIVED_REALITY'])assert.match(discovery,new RegExp("locale:l,type:'"+type+"'"));
assert.match(knowledge,/BOOK-6':\{en:'Reality Reconfiguration'/);
for(const token of ['External Dependency','Pressure','Direction','Transition Signals'])assert.match(renderer,new RegExp(token));
assert.match(renderer,/history\.filter\(h=>h\.id===d\.id\)/);
assert.match(renderer,/dimMap\.get\(id\)\|\|id/);

for(const entry of ['atlas=snapshots','atlas=compare','atlas=dossiers','atlas=lived'])assert.match(book,new RegExp(entry));
const normalized=normalizeReconfigurationAtlasState({activeLayer:'compare',compareCaseIds:['RC-04','RC-05','RC-06','RC-07','RC-08'],snapshotLayer:'finance'});assert.equal(normalized.compareCaseIds.length,4);assert.equal(normalized.snapshotLayer,'finance');
const u=reconfigurationAtlasUrlFromState('https://getphios.com/books/reality-configuration/',{...normalized,activeLayer:'snapshots',snapshotId:'WORLD_RECONFIGURATION_SNAPSHOT_2026'});const round=reconfigurationAtlasStateFromUrl(u,'en');assert.equal(round.activeLayer,'snapshots');assert.equal(round.snapshotId,'WORLD_RECONFIGURATION_SNAPSHOT_2026');assert.equal(u.hash,'#atlas');
const scope=normalizeAtlasRetrievalScope({scopeType:'CIVILIZATION_RECONFIGURATION_ATLAS',bookCode:'BOOK-6',partCode:'PART-13',activeLayer:'compare',comparisonIds:['RC-04','RC-05']});assert.deepEqual(scope.comparisonIds,['RC-04','RC-05']);
const env={ASSETS:{fetch:async req=>{const rel=new URL(req.url).pathname.replace(/^\//,'');try{return new Response(await fs.readFile(path.join(root,rel)),{status:200});}catch{return new Response('',{status:404});}}}};
const result=await retrieveAtlasScope({env,scope,locale:'en',question:'compare First World War and Russian transition'});assert(result.sources.some(s=>s.atlasEntityId==='RC-04'));assert(result.sources.some(s=>s.atlasEntityId==='RC-05'));assert(result.sources.some(s=>s.sourceId.includes('RECONFIGURATION_WINDOW')));assert(result.sources.some(s=>s.sourceId.includes('BOOK_VI_CANONICAL_SECTION')));
const manifest=JSON.parse(await read('content/civilization-atlas/reconfiguration/atlas-manifest-v2.json'));assert.equal(manifest.status,'B6_WEB_D_CUSTOMER_UI_IMPLEMENTED');assert.equal(manifest.customerUi.browserAcceptance,'NOT_RUN');
console.log('✓ B6-WEB-D Customer UI PASS: existing Atlas owners extended with filters, timeline, 2–4 comparisons, snapshot layers, dossier/version history, lived reality, global Search and linked Ask scope.');
console.log('  Browser/Human acceptance NOT_RUN; R2/i18n/accessibility/performance closure remains B6-WEB-E/F.');
