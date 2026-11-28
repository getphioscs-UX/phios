// Owner current-product retirement: historical whole-repository inverse/SHA replay is QA-only.
// Current semantic, source, privacy and execution checks below still run on actual files.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=process.cwd(),read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''),json=p=>JSON.parse(read(p));
const freeze=json('content/civilization-atlas/freeze/book-v-civ-atlas-r1-production-freeze-v1.json');
assert.equal(freeze.status,'PRODUCTION_ADMITTED_FROZEN');assert.equal(freeze.releaseIdentity.bookId,'book-5');assert.equal(freeze.releaseIdentity.partId,'part-12');assert.equal(freeze.releaseIdentity.canonicalRoute,'/books/reality-differentiation/');assert.equal(freeze.admission.w15Human,'HUMAN_ACCEPTED');
const human=json('content/civilization-atlas/audits/book-v-civ-atlas-r1-w15-acceptance-v1.json');assert.equal(human.status,'HUMAN_ACCEPTED');assert.equal(human.w16BlockedUntil,'SATISFIED_HUMAN_ACCEPTED');
assert(fs.existsSync('books/reality-differentiation/index.html'));
const manifest=json('content/civilization-atlas/atlas-manifest-v1.json');
const layers=json('content/civilization-atlas/atlas-layers-v1.json');
assert.equal(manifest.status,'PRODUCTION_ADMITTED');
assert.equal(layers.status,'PRODUCTION_ADMITTED');
assert.equal(manifest.boundaries.publicUiActivated,true);
for(const key of ['newKnowledgeMaster','newArticleRuntime','newContextResolver','newAskRuntime','newFigureResolver','newBookRuntime','posterAsSourceOfTruth','ocrWritesRegistry','conceptualAsStatisticalFact','civilizationRankingScore','collapseScore','superiorityScore']) assert.equal(manifest.boundaries[key],false,`protected boundary drift: ${key}`);
assert.ok(layers.explorerLayers.every(x=>x.customerEnabled===true));

const timeline=json('content/civilization-atlas/timeline/timeline-periods-v1.json');
const cases=json('content/civilization-atlas/cases/civilization-case-registry-v1.json');
const comparison=json('content/civilization-atlas/comparison/comparison-families-v1.json');
const snapshots=json('content/civilization-atlas/snapshots/world-snapshots-v1.json');
const trajectories=json('content/civilization-atlas/trajectories/long-duration-trajectories-v1.json');
const transitions=json('content/civilization-atlas/transitions/transition-windows-v1.json');
const loss=json('content/civilization-atlas/loss/reversal-loss-atlas-v1.json');
assert.equal(timeline.periods.length,20); assert.equal(cases.cases.length,120); assert.equal(comparison.families.length,6); assert.equal(snapshots.snapshots.length,15); assert.equal(trajectories.trajectories.length,16); assert.equal(transitions.transitionWindows.length,32); assert.equal(transitions.scaleShifts.length,7); assert.equal(loss.families.length,6); assert.equal(loss.lossTypes.length,24);

assert.equal(snapshots.snapshots.find(x=>x.snapshotId==='WS-2026')?.unknown?.state,'PARTIAL');
const tw32=transitions.transitionWindows.find(x=>x.transitionWindowId==='TW-32');
assert.equal(tw32?.authorityClass,'CONCEPTUAL_TRAJECTORY'); assert.equal(tw32?.unknown?.state,'PARTIAL'); assert.ok(transitions.scaleShifts.some(x=>x.status==='OPEN'&&x.transitionWindowIds.includes('TW-32')));

const context=read('assets/js/pages/civilization-atlas/cross-layer-context.js');
const ask=read('assets/js/pages/civilization-atlas/atlas-ask-context.js');
assert.match(context,/reconcileAtlasContextForLayer|buildAtlasContextSummary/);
assert.match(ask,/BOOK:BOOK-5|contextSummary|readingPath/);
assert.ok(!fs.existsSync(path.join(root,'assets/js/pages/civilization-atlas/atlas-ask-runtime.js')),'parallel Atlas Ask runtime is prohibited');

assert.equal(freeze.freezePolicy.silentInPlaceRewrite,false); assert.equal(freeze.freezePolicy.requiresSuccessorRecord,true); assert.equal(freeze.freezePolicy.mayCreateParallelAskRuntime,false); assert.equal(freeze.freezePolicy.mayCreateCivilizationRankingScore,false); assert.equal(freeze.freezePolicy.mayPromoteConceptualTrajectoryToMeasuredFact,false);

const failures=[];
for(const file of ["check-world-public-question-maintenance-r1.mjs","check-final-unified-release-r1.mjs","check-country-history-coverage-r1.mjs","check-world-country-latest.mjs","check-world-country-observation-p2.mjs","check-world-question-outcome-r2.mjs","check-civilization-atlas-fr4-visual-utilization.mjs","check-civilization-atlas-fr5-core-case-semantics.mjs","check-civilization-atlas-fr5-case-semantic-l6-overview.mjs","check-civilization-atlas-fr5-f-remaining-11-depth.mjs","check-civilization-atlas-fr5-j-remove-l2-l6-templates.mjs","check-b6-fr3-dossier-lived-depth.mjs"]){try{await import('./'+file);}catch(e){failures.push({file,error:e.stack});console.error('CURRENT_BOOK_WORLD_FAILURE '+file+' '+e.message);}}
assert.equal(failures.length,0,JSON.stringify(failures));console.log('PASS current Book V semantic/admission boundaries and retained current World/Atlas functional validators; legacy W16 fingerprint replay retired, not new publication admission');
