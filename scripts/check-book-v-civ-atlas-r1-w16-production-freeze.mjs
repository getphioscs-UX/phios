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
const maintenancePath='content/civilization-atlas/maintenance/book-v-civ-atlas-r1-m1-customer-projection-recovery-v1.json';
const maintenance=fs.existsSync(path.join(root,maintenancePath))?json(maintenancePath):null;
const authorizedMaintenance=new Map((maintenance?.authorizedFrozenPathChanges||[]).map(item=>[item.path,item]));
const visualSuccessor=json('content/civilization-atlas/maintenance/book-v-civ-atlas-static-visual-successor-v1.json');
assert.equal(visualSuccessor.predecessor,maintenancePath);
assert.equal(visualSuccessor.predecessorSha256,digest(maintenancePath));
assert.equal(visualSuccessor.change.path,'assets/js/pages/civilization-atlas.js');
const priorVisual=authorizedMaintenance.get(visualSuccessor.change.path);
assert.equal(visualSuccessor.change.previousSha256,priorVisual.successorSha256);
assert.equal(visualSuccessor.change.changeClass,priorVisual.changeClass);
assert.deepEqual(visualSuccessor.dependencies.map(item=>item.path),[
  'assets/js/pages/civilization-atlas/atlas-static-visual.js',
  'content/civilization-atlas/visuals/civilization-visual-approved-bindings-v1.json'
]);
const activationPath='content/civilization-atlas/maintenance/book-v-civ-atlas-r1-m1-r2-binding-successor-v1.json';
const activation=fs.existsSync(path.join(root,activationPath))?json(activationPath):null;
const ownerSuccessor=json('content/civilization-atlas/maintenance/book-v-civ-atlas-owner-acceptance-successor-2026-09-19.json');
assert.equal(ownerSuccessor.predecessor,activationPath);
assert.equal(ownerSuccessor.predecessorSha256,digest(activationPath));
assert.equal(ownerSuccessor.acceptanceSha256,digest(ownerSuccessor.acceptance));
assert.equal(json(ownerSuccessor.acceptance).decision,'OWNER_ACCEPTED');
assert.equal(ownerSuccessor.historicalRegistriesChanged,false);
assert.deepEqual(ownerSuccessor.changes.map(c=>c.path),[activation.bindingSuccessor,'assets/js/pages/civilization-atlas/atlas-static-visual.js']);
for(const change of ownerSuccessor.changes){
 const previous=change.path===activation.bindingSuccessor?activation.bindingSuccessorSha256:activation.changes.find(c=>c.path===change.path)?.successorSha256;
 assert.equal(change.previousSha256,previous);
 assert.equal(digest(change.path),change.successorSha256,`owner successor content drift: ${change.path}`);
}
if(activation){
  assert.equal(activation.predecessor,'content/civilization-atlas/maintenance/book-v-civ-atlas-static-visual-successor-v1.json');
  assert.equal(activation.predecessorSha256,digest(activation.predecessor));
  assert.equal(activation.historicalRegistriesChanged,false);
  assert.equal(activation.humanDecision,'PENDING_HUMAN_REVIEW');
  assert.deepEqual(activation.changes.map(c=>c.path),['assets/js/pages/civilization-atlas.js','assets/js/pages/civilization-atlas/atlas-static-visual.js']);
  assert.equal(digest(activation.bindingSuccessor),ownerSuccessor.changes[0].successorSha256);
}
for(const dependency of visualSuccessor.dependencies){
  const change=activation?.changes.find(c=>c.path===dependency.path);
  if(change)assert.equal(change.previousSha256,dependency.sha256);
  const accepted=ownerSuccessor.changes.find(c=>c.path===dependency.path);
  assert.equal(digest(dependency.path),accepted?.successorSha256||change?.successorSha256||dependency.sha256,`static visual dependency drift: ${dependency.path}`);
}
authorizedMaintenance.set(priorVisual.path,{...priorVisual,successorSha256:visualSuccessor.change.successorSha256});
if(activation){
 const change=activation.changes.find(c=>c.path===priorVisual.path);
 assert.equal(change.previousSha256,visualSuccessor.change.successorSha256);
 authorizedMaintenance.set(priorVisual.path,{...priorVisual,successorSha256:change.successorSha256});
}
const editorial=json('content/civilization-atlas/maintenance/book-v-civ-atlas-pis-editorial-successor-v1.json');
assert.equal(editorial.predecessor,maintenancePath);
assert.equal(editorial.predecessorSha256,digest(maintenancePath));
assert.equal(editorial.change.path,'books/reality-differentiation/index.html');
const priorEditorial=authorizedMaintenance.get(editorial.change.path);
assert.equal(editorial.change.previousSha256,priorEditorial.successorSha256);
assert.equal(editorial.change.changeClass,priorEditorial.changeClass);
assert.equal(editorial.productionVerified,false);
const editorialHtml=read(editorial.change.path);
assert.match(editorialHtml,/data-civilization-atlas-root/);
assert.match(editorialHtml,/PIS BOOK CONTEXT START/);
authorizedMaintenance.set(priorEditorial.path,{...priorEditorial,successorSha256:editorial.change.successorSha256});
const eightVolume=json('content/civilization-atlas/maintenance/book-v-eight-volume-publication-successor-v1.json');
assert.equal(eightVolume.predecessor,'content/civilization-atlas/maintenance/book-v-civ-atlas-pis-editorial-successor-v1.json');
assert.equal(eightVolume.change.path,editorial.change.path);
assert.equal(eightVolume.change.previousSha256,editorial.change.successorSha256);
assert.equal(eightVolume.change.changeClass,editorial.change.changeClass);
assert.equal(eightVolume.productionAdmissionChanged,false);
assert.equal(eightVolume.humanReview,'PENDING');
assert.match(editorialHtml,/eight books/i);
authorizedMaintenance.set(priorEditorial.path,{...priorEditorial,successorSha256:eightVolume.change.successorSha256});

// Book VI extends the shared data loader. Reconcile that frozen Book V path
// through a versioned NEW_ATLAS_RELEASE_SUCCESSOR instead of rewriting history.
const bookViDataSuccessor=json('content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-data-loader-successor-v1.json');
assert.equal(bookViDataSuccessor.status,'ACTIVE_VERSIONED_SUCCESSOR');
assert.equal(bookViDataSuccessor.change.path,'assets/js/pages/civilization-atlas/atlas-data.js');
const priorAtlasData=authorizedMaintenance.get(bookViDataSuccessor.change.path);
assert.ok(priorAtlasData,'Book V atlas-data maintenance predecessor is required');
assert.equal(bookViDataSuccessor.change.previousSha256,priorAtlasData.successorSha256);
assert.equal(bookViDataSuccessor.change.changeClass,'NEW_ATLAS_RELEASE_SUCCESSOR');
assert.ok(freeze.freezePolicy.allowedChangeClasses.includes(bookViDataSuccessor.change.changeClass));
assert.equal(bookViDataSuccessor.scope.bookVCanonicalTheoryChanged,false);
assert.equal(bookViDataSuccessor.scope.bookVHistoricalRegistriesChanged,false);
assert.equal(bookViDataSuccessor.scope.parallelAtlasRuntimeCreated,false);
assert.equal(bookViDataSuccessor.scope.parallelAskRuntimeCreated,false);

// v1 is a historical successor step, not necessarily the current file state.
authorizedMaintenance.set(priorAtlasData.path,{...priorAtlasData,successorSha256:bookViDataSuccessor.change.successorSha256,changeClass:bookViDataSuccessor.change.changeClass});

// B6-WEB-C/D extended the same shared loader after v1. Preserve the chain with
// a second versioned successor rather than rewriting v1 or the Book V freeze.
const bookViDataSuccessorV2=json('content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-data-loader-successor-v2.json');
assert.equal(bookViDataSuccessorV2.status,'ACTIVE_VERSIONED_SUCCESSOR');
assert.equal(bookViDataSuccessorV2.predecessor,'content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-data-loader-successor-v1.json');
assert.equal(bookViDataSuccessorV2.change.path,bookViDataSuccessor.change.path);
assert.equal(bookViDataSuccessorV2.change.previousSha256,bookViDataSuccessor.change.successorSha256);
assert.equal(bookViDataSuccessorV2.change.changeClass,'NEW_ATLAS_RELEASE_SUCCESSOR');
assert.ok(freeze.freezePolicy.allowedChangeClasses.includes(bookViDataSuccessorV2.change.changeClass));
assert.match(
  bookViDataSuccessorV2.change.successorSha256,
  /^[0-9a-f]{64}$/,
  'Book VI atlas-data successor v2 must retain a valid historical digest'
);
assert.equal(bookViDataSuccessorV2.scope.bookVCanonicalTheoryChanged,false);
assert.equal(bookViDataSuccessorV2.scope.bookVHistoricalRegistriesChanged,false);
assert.equal(bookViDataSuccessorV2.scope.parallelAtlasRuntimeCreated,false);
assert.equal(bookViDataSuccessorV2.scope.parallelAskRuntimeCreated,false);
const atlasDataSource=read(bookViDataSuccessorV2.change.path);
assert.match(atlasDataSource,/loadReconfigurationRelationships/);
assert.match(atlasDataSource,/loadReconfigurationKnowledgeStates/);
authorizedMaintenance.set(priorAtlasData.path,{...priorAtlasData,successorSha256:bookViDataSuccessorV2.change.successorSha256,changeClass:bookViDataSuccessorV2.change.changeClass});

// B6-WEB-E extended the same shared loader with visual-status and approved-binding
// loaders. Keep that as a third successor step rather than mutating v2 history.
const bookViDataSuccessorV3=json('content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-data-loader-successor-v3.json');
assert.equal(bookViDataSuccessorV3.status,'ACTIVE_VERSIONED_SUCCESSOR');
assert.equal(bookViDataSuccessorV3.predecessor,'content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-data-loader-successor-v2.json');
assert.equal(bookViDataSuccessorV3.change.path,bookViDataSuccessorV2.change.path);
assert.equal(bookViDataSuccessorV3.change.previousSha256,bookViDataSuccessorV2.change.successorSha256);
assert.equal(bookViDataSuccessorV3.change.changeClass,'NEW_ATLAS_RELEASE_SUCCESSOR');
assert.ok(freeze.freezePolicy.allowedChangeClasses.includes(bookViDataSuccessorV3.change.changeClass));
assert.equal(digest(bookViDataSuccessorV3.change.path),bookViDataSuccessorV3.change.successorSha256,'Book VI atlas-data successor v3 digest drift');
assert.equal(bookViDataSuccessorV3.scope.bookVCanonicalTheoryChanged,false);
assert.equal(bookViDataSuccessorV3.scope.bookVHistoricalRegistriesChanged,false);
assert.equal(bookViDataSuccessorV3.scope.parallelAtlasRuntimeCreated,false);
assert.equal(bookViDataSuccessorV3.scope.parallelAskRuntimeCreated,false);
const atlasDataV3Source=read(bookViDataSuccessorV3.change.path);
assert.match(atlasDataV3Source,/loadReconfigurationVisualStatus/);
assert.match(atlasDataV3Source,/loadCivilizationVisualBindings/);
assert.ok(fs.existsSync(path.join(root,'content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json')));
assert.ok(fs.existsSync(path.join(root,'content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json')));
authorizedMaintenance.set(priorAtlasData.path,{...priorAtlasData,successorSha256:bookViDataSuccessorV3.change.successorSha256,changeClass:bookViDataSuccessorV3.change.changeClass});

// Book VI shares the existing Atlas state and URL-state owners with Book V.
// Verify the frozen Book V predecessor bytes first, then authorize only the
// governed Book VI extension through a versioned successor record.
const bookViStateUrlSuccessor=json('content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-state-url-successor-v1.json');
assert.equal(bookViStateUrlSuccessor.status,'ACTIVE_VERSIONED_SUCCESSOR');
assert.equal(bookViStateUrlSuccessor.changeClass,'NEW_ATLAS_RELEASE_SUCCESSOR');
assert.equal(bookViStateUrlSuccessor.changes.length,2);
for(const change of bookViStateUrlSuccessor.changes){
  const frozen=freeze.frozenFiles.find(row=>row.path===change.path);
  assert.ok(frozen,`Book VI state successor path is not W16-frozen: ${change.path}`);
  assert.equal(change.previousSha256,frozen.sha256,`Book VI state predecessor digest mismatch: ${change.path}`);
  assert.equal(digest(change.path),change.successorSha256,`Book VI state successor digest drift: ${change.path}`);
  assert.ok(freeze.freezePolicy.allowedChangeClasses.includes(change.changeClass),`Book VI state change class not allowed: ${change.path}`);
  authorizedMaintenance.set(change.path,{
    path:change.path,
    previousSha256:change.previousSha256,
    successorSha256:change.successorSha256,
    changeClass:change.changeClass
  });
}
assert.equal(bookViStateUrlSuccessor.scope.bookVCanonicalTheoryChanged,false);
assert.equal(bookViStateUrlSuccessor.scope.bookVHistoricalRegistriesChanged,false);
assert.equal(bookViStateUrlSuccessor.scope.bookVStateBehaviorRewritten,false);
assert.equal(bookViStateUrlSuccessor.scope.parallelAtlasRuntimeCreated,false);
assert.equal(bookViStateUrlSuccessor.scope.parallelAskRuntimeCreated,false);

for(const f of freeze.frozenFiles){
  assert.ok(fs.existsSync(path.join(root,f.path)),`frozen file missing: ${f.path}`);
  const current=digest(f.path);
  if(current===f.sha256) continue;
  const successor=authorizedMaintenance.get(f.path);
  assert.ok(successor,`W16 frozen digest drift without maintenance successor: ${f.path}`);
  assert.equal(successor.previousSha256,f.sha256,`maintenance predecessor digest mismatch: ${f.path}`);
  assert.equal(successor.successorSha256,current,`maintenance successor digest mismatch: ${f.path}`);
  assert.ok(freeze.freezePolicy.allowedChangeClasses.includes(successor.changeClass),`maintenance change class not allowed: ${f.path}`);
}

console.log('✓ BOOK-V-CIV-ATLAS-R1-W16 Production Admission + Freeze passed.');
console.log('  W15 human acceptance is explicit; 20/120/6/15/16/32/24 registry surface admitted.');
console.log(`  ${freeze.frozenFiles.length} authority/runtime/customer files are digest-frozen.`);
if(maintenance) console.log(`  Authorized maintenance successor: ${maintenance.work} · ${maintenance.status}.`);
console.log('  Book VI shared data-loader extensions are reconciled through v3 chained NEW_ATLAS_RELEASE_SUCCESSOR records.');
console.log('  Book VI shared state + URL-state extensions are reconciled through a versioned successor; Book V predecessor bytes remain frozen.');
console.log('  Future substantive changes require a versioned successor / maintenance record.');
