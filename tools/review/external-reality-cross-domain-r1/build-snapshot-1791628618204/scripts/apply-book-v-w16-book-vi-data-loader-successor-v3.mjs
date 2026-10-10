import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='scripts/check-book-v-civ-atlas-r1-w16-production-freeze.mjs';
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');

const anchor=`authorizedMaintenance.set(priorAtlasData.path,{...priorAtlasData,successorSha256:bookViDataSuccessorV2.change.successorSha256,changeClass:bookViDataSuccessorV2.change.changeClass});

for(const f of freeze.frozenFiles){`;

const inserted=`authorizedMaintenance.set(priorAtlasData.path,{...priorAtlasData,successorSha256:bookViDataSuccessorV2.change.successorSha256,changeClass:bookViDataSuccessorV2.change.changeClass});

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

for(const f of freeze.frozenFiles){`;

if(!source.includes("bookViDataSuccessorV3=json(")){
  assert.ok(source.includes(anchor),'PATCH_CONTEXT_MISMATCH:BOOK_VI_ATLAS_DATA_SUCCESSOR_V2_FINALIZATION');
  source=source.replace(anchor,inserted);
}

source=source.replace(
  `console.log('  Book VI shared data-loader extensions are reconciled by chained versioned NEW_ATLAS_RELEASE_SUCCESSOR records.');`,
  `console.log('  Book VI shared data-loader extensions are reconciled through v3 chained NEW_ATLAS_RELEASE_SUCCESSOR records.');`
);

assert.ok(source.includes("book-v-civ-atlas-book-vi-data-loader-successor-v3.json"));
assert.ok(source.includes("loadReconfigurationVisualStatus"));
assert.ok(source.includes("loadCivilizationVisualBindings"));

fs.writeFileSync(file,source);
console.log('Applied Book V W16 / Book VI atlas-data successor chain v3 reconciliation.');
