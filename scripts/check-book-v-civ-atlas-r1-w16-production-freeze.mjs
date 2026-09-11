import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const json=p=>JSON.parse(read(p));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const freeze=json('content/civilization-atlas/freeze/book-v-civ-atlas-r1-production-freeze-v1.json');
assert.equal(freeze.status,'PRODUCTION_ADMITTED_FROZEN');
assert.equal(freeze.work,'BOOK-V-CIV-ATLAS-R1-W16');
assert.equal(freeze.releaseIdentity.bookId,'book-5');
assert.equal(freeze.releaseIdentity.partId,'part-12');
assert.equal(freeze.releaseIdentity.canonicalRoute,'/books/reality-differentiation/');
assert.equal(freeze.admission.w15Human,'HUMAN_ACCEPTED');

const decision=json('tools/review/BOOK-V-CIV-ATLAS-R1-W15-HUMAN-DECISION.json');
assert.equal(decision.status,'HUMAN_ACCEPTED');
assert.equal(decision.reviewerDeclaration,'USER_EXPLICIT_ALL_HUMAN_ACCEPTED');
assert.deepEqual(decision.requiredViewports,[360,768,1440]);
assert.equal(decision.dimensions.length,11);
assert.ok(decision.dimensions.every(x=>x.status==='ACCEPTED'));

const audit=json('content/civilization-atlas/audits/book-v-civ-atlas-r1-w15-acceptance-v1.json');
assert.equal(audit.status,'HUMAN_ACCEPTED');
assert.equal(audit.w16BlockedUntil,'SATISFIED_HUMAN_ACCEPTED');

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
for(const f of freeze.frozenFiles){assert.ok(fs.existsSync(path.join(root,f.path)),`frozen file missing: ${f.path}`);assert.equal(digest(f.path),f.sha256,`W16 frozen digest drift: ${f.path}`);}

console.log('✓ BOOK-V-CIV-ATLAS-R1-W16 Production Admission + Freeze passed.');
console.log('  W15 human acceptance is explicit; 20/120/6/15/16/32/24 registry surface admitted.');
console.log(`  ${freeze.frozenFiles.length} authority/runtime/customer files are digest-frozen.`);
console.log('  Future substantive changes require a versioned successor / maintenance record.');
