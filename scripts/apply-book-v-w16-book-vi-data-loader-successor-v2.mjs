import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='scripts/check-book-v-civ-atlas-r1-w16-production-freeze.mjs';
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');

const oldBlock=`assert.ok(freeze.freezePolicy.allowedChangeClasses.includes(bookViDataSuccessor.change.changeClass));
assert.equal(digest(bookViDataSuccessor.change.path),bookViDataSuccessor.change.successorSha256,'Book VI atlas-data successor digest drift');
assert.equal(bookViDataSuccessor.scope.bookVCanonicalTheoryChanged,false);
assert.equal(bookViDataSuccessor.scope.bookVHistoricalRegistriesChanged,false);
assert.equal(bookViDataSuccessor.scope.parallelAtlasRuntimeCreated,false);
assert.equal(bookViDataSuccessor.scope.parallelAskRuntimeCreated,false);
authorizedMaintenance.set(priorAtlasData.path,{...priorAtlasData,successorSha256:bookViDataSuccessor.change.successorSha256,changeClass:bookViDataSuccessor.change.changeClass});`;

const newBlock=`assert.ok(freeze.freezePolicy.allowedChangeClasses.includes(bookViDataSuccessor.change.changeClass));
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
assert.equal(digest(bookViDataSuccessorV2.change.path),bookViDataSuccessorV2.change.successorSha256,'Book VI atlas-data successor v2 digest drift');
assert.equal(bookViDataSuccessorV2.scope.bookVCanonicalTheoryChanged,false);
assert.equal(bookViDataSuccessorV2.scope.bookVHistoricalRegistriesChanged,false);
assert.equal(bookViDataSuccessorV2.scope.parallelAtlasRuntimeCreated,false);
assert.equal(bookViDataSuccessorV2.scope.parallelAskRuntimeCreated,false);
const atlasDataSource=read(bookViDataSuccessorV2.change.path);
assert.match(atlasDataSource,/loadReconfigurationRelationships/);
assert.match(atlasDataSource,/loadReconfigurationKnowledgeStates/);
authorizedMaintenance.set(priorAtlasData.path,{...priorAtlasData,successorSha256:bookViDataSuccessorV2.change.successorSha256,changeClass:bookViDataSuccessorV2.change.changeClass});`;

if(source.includes(oldBlock)){
  source=source.replace(oldBlock,newBlock);
} else if(!source.includes("bookViDataSuccessorV2=json(")){
  throw new Error('PATCH_CONTEXT_MISMATCH:BOOK_VI_ATLAS_DATA_SUCCESSOR_V1_BLOCK');
}

const oldMessage=`console.log('  Book VI shared data-loader extension is reconciled by a versioned NEW_ATLAS_RELEASE_SUCCESSOR record.');`;
const newMessage=`console.log('  Book VI shared data-loader extensions are reconciled by chained versioned NEW_ATLAS_RELEASE_SUCCESSOR records.');`;
source=source.replace(oldMessage,newMessage);

assert.ok(source.includes("book-v-civ-atlas-book-vi-data-loader-successor-v2.json"));
assert.ok(source.includes("loadReconfigurationRelationships"));
assert.ok(source.includes("loadReconfigurationKnowledgeStates"));

fs.writeFileSync(file,source);
console.log('Applied Book V W16 / Book VI atlas-data successor chain v2 reconciliation.');
