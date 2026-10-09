import fs from 'node:fs';import assert from 'node:assert/strict';
import {searchWorld} from '../assets/js/pages/civilization-atlas/world-search.js';
import {resolveAtlasVisualById} from '../assets/js/pages/civilization-atlas/atlas-static-visual.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),base='content/civilization-atlas',index=read(base+'/search/world-search-index-v1.json'),bindings=read(base+'/visuals/civilization-visual-approved-bindings-v2.json');
assert.equal(new Set(index.rows.map(x=>x.book+':'+x.type+':'+x.id)).size,index.rows.length);
for(const locale of ['en','zh-Hans'])for(const r of index.rows){assert(r.title[locale]);assert(r.href.startsWith('/world?'));if(r.type!=='visual'){const found=searchWorld(index.rows,r.title[locale],{locale});assert(found.some(x=>x.row.id===r.id&&x.row.type===r.type),'Search cannot find '+r.id);}}
for(const family of ['snapshot','civilization','period','macro-era','comparison','trajectory','transition','loss-family','loss-type','book-section','reconfiguration-case','reconfiguration-window','reconfiguration-snapshot','current-dossier','lived-dimension','visual','admitted-current-evidence','runtime-position'])assert(index.rows.some(r=>r.type===family));
for(const a of bindings.assets.filter(a=>a.reviewState==='ACCEPTED')){assert(resolveAtlasVisualById(bindings,a.assetId));assert(index.rows.some(r=>r.id===a.assetId&&r.type==='visual'),'Accepted visual orphan '+a.assetId);}
for(const [file,id]of [['snapshots/world-snapshots-v1.json','snapshotId'],['reconfiguration/world-reconfiguration-snapshots-v1.json','id']])for(const r of read(base+'/'+file).snapshots){const family=id==='snapshotId'?'WORLD_SNAPSHOT_ATMOSPHERE':'WORLD_RECONFIGURATION_SNAPSHOT',asset=bindings.assets.find(a=>a.subjectId===r[id]&&a.family===family);assert(asset,'Snapshot binding missing '+r[id]);assert(resolveAtlasVisualById(bindings,asset.assetId));}
const home=fs.readFileSync('world/index.html','utf8'),shell=fs.readFileSync('assets/js/public-shell.js','utf8');assert(!home.includes('data-cx-en='));assert(!shell.includes('data-cx-en="World"'));assert(home.includes('data-i18n="worldRecovery.'));assert(shell.includes('worldRecovery.nav'));
const snapshot=fs.readFileSync('assets/js/pages/civilization-atlas/world-slice-renderer.js','utf8');assert(snapshot.includes('primaryVisualMarkup'));assert(!snapshot.includes('◎'));
assert.equal(searchWorld(index.rows,'zxqvnonexistent12345',{locale:'zh-Hans'}).length,0);
const r=index.rows.find(r=>r.type==='civilization');assert.equal(searchWorld(index.rows,r.title.en,{locale:'en'})[0].row.title.en,r.title.en);
const orphan=read('docs/acceptance/world-recovery/orphan-report.json');assert.equal(orphan.unexplainedAcceptedOrphans.length,0);
console.log('PASS World localization source contract, complete bilingual search, accepted visual reachability, zero orphans, Book V/VI snapshot binding separation and canonical routes. Browser consumption remains a separate required gate.');
