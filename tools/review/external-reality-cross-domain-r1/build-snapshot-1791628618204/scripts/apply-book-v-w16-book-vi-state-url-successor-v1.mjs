import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const readText = p => fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
const readJson = p => JSON.parse(readText(p));
const shaText = s => crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const shaFile = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const freezePath='content/civilization-atlas/freeze/book-v-civ-atlas-r1-production-freeze-v1.json';
const checkerPath='scripts/check-book-v-civ-atlas-r1-w16-production-freeze.mjs';
const successorPath='content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-state-url-successor-v1.json';
const statePath='assets/js/pages/civilization-atlas/atlas-state.js';
const urlPath='assets/js/pages/civilization-atlas/atlas-url-state.js';

const freeze=readJson(freezePath);
const freezeByPath=new Map(freeze.frozenFiles.map(row=>[row.path,row]));

const stateFreeze=freezeByPath.get(statePath);
const urlFreeze=freezeByPath.get(urlPath);
assert.ok(stateFreeze,'atlas-state.js missing from W16 freeze');
assert.ok(urlFreeze,'atlas-url-state.js missing from W16 freeze');

// ---- Prove Book V atlas-state predecessor is byte-preserved before the Book VI append.
const state=readText(statePath);
for(const token of [
  'export const RECONFIG_ATLAS_LAYERS',
  'export const DEFAULT_RECONFIGURATION_ATLAS_STATE',
  'export function normalizeReconfigurationAtlasState',
  'export function createReconfigurationAtlasState'
]) assert.ok(state.includes(token),`Missing Book VI state extension: ${token}`);

const stateMarker='\nexport const RECONFIG_ATLAS_LAYERS';
const stateMarkerAt=state.indexOf(stateMarker);
assert.ok(stateMarkerAt>0,'Book VI atlas-state append marker missing');
const reconstructedStatePredecessor=state.slice(0,stateMarkerAt);
assert.equal(
  shaText(reconstructedStatePredecessor),
  stateFreeze.sha256,
  'Book V atlas-state predecessor bytes changed; successor cannot be auto-recorded'
);

// ---- Prove Book V atlas-url-state predecessor is recoverable exactly.
// Book VI changed only the import to add its state helpers, then appended reconfiguration URL handling.
const urlState=readText(urlPath);
for(const token of [
  'normalizeReconfigurationAtlasState',
  'RECONFIG_ATLAS_LAYERS',
  'export function reconfigurationAtlasStateFromUrl',
  'export function reconfigurationAtlasUrlFromState',
  'export function bindReconfigurationAtlasUrlState'
]) assert.ok(urlState.includes(token),`Missing Book VI URL-state extension: ${token}`);

const currentImport="import {normalizeAtlasState,ATLAS_LAYERS,normalizeReconfigurationAtlasState,RECONFIG_ATLAS_LAYERS} from './atlas-state.js';";
const historicalImport="import {normalizeAtlasState,ATLAS_LAYERS} from './atlas-state.js';";
assert.ok(urlState.startsWith(currentImport),'Unexpected atlas-url-state import shape');
const urlMarker='\nconst RECONFIG_PARAMS=';
const urlMarkerAt=urlState.indexOf(urlMarker);
assert.ok(urlMarkerAt>0,'Book VI atlas-url-state append marker missing');
const reconstructedUrlPredecessor=(
  historicalImport + urlState.slice(currentImport.length,urlMarkerAt)
);
assert.equal(
  shaText(reconstructedUrlPredecessor),
  urlFreeze.sha256,
  'Book V atlas-url-state predecessor bytes changed; successor cannot be auto-recorded'
);

const stateCurrentSha=shaFile(statePath);
const urlCurrentSha=shaFile(urlPath);

const successor={
  schemaVersion:'PHI-OS-BOOK-VI-ATLAS-STATE-URL-SUCCESSOR-v1.0.0',
  work:'BOOK-VI-ATLAS-STATE-URL-SUCCESSOR-V1',
  status:'ACTIVE_VERSIONED_SUCCESSOR',
  baselineCommit:'435238410d45939911313de23c86f0da7c74520e',
  predecessorFreeze:freezePath,
  changeClass:'NEW_ATLAS_RELEASE_SUCCESSOR',
  reason:'Book VI reconfiguration extends the existing shared Civilization Atlas state and URL-state owners while preserving the frozen Book V predecessor bytes.',
  changes:[
    {
      path:statePath,
      previousSha256:stateFreeze.sha256,
      successorSha256:stateCurrentSha,
      changeClass:'NEW_ATLAS_RELEASE_SUCCESSOR',
      bookVPredecessorBytePreserved:true,
      bookVIExtension:[
        'RECONFIG_ATLAS_LAYERS',
        'DEFAULT_RECONFIGURATION_ATLAS_STATE',
        'normalizeReconfigurationAtlasState',
        'createReconfigurationAtlasState'
      ]
    },
    {
      path:urlPath,
      previousSha256:urlFreeze.sha256,
      successorSha256:urlCurrentSha,
      changeClass:'NEW_ATLAS_RELEASE_SUCCESSOR',
      bookVPredecessorReconstructionVerified:true,
      bookVIExtension:[
        'reconfigurationAtlasStateFromUrl',
        'reconfigurationAtlasUrlFromState',
        'bindReconfigurationAtlasUrlState'
      ]
    }
  ],
  scope:{
    bookVCanonicalTheoryChanged:false,
    bookVHistoricalRegistriesChanged:false,
    bookVStateBehaviorRewritten:false,
    bookVIStateAdded:true,
    bookVIUrlStateAdded:true,
    parallelAtlasRuntimeCreated:false,
    parallelAskRuntimeCreated:false,
    productionAdmissionChanged:false
  },
  boundary:'The historical W16 freeze is not rewritten. This successor only admits the verified Book VI append/import extension on the two shared state-owner files.'
};

fs.mkdirSync('content/civilization-atlas/maintenance',{recursive:true});
fs.writeFileSync(successorPath,JSON.stringify(successor,null,2)+'\n');

// ---- Make the W16 checker consume this successor before its final frozen-file loop.
let checker=readText(checkerPath);
const sentinel="const bookViStateUrlSuccessor=json('content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-state-url-successor-v1.json');";
if(!checker.includes(sentinel)){
  const loopAnchor='for(const f of freeze.frozenFiles){';
  const at=checker.lastIndexOf(loopAnchor);
  assert.ok(at>0,'PATCH_CONTEXT_MISMATCH: final W16 freeze loop not found');
  const block=`// Book VI shares the existing Atlas state and URL-state owners with Book V.
// Verify the frozen Book V predecessor bytes first, then authorize only the
// governed Book VI extension through a versioned successor record.
const bookViStateUrlSuccessor=json('content/civilization-atlas/maintenance/book-v-civ-atlas-book-vi-state-url-successor-v1.json');
assert.equal(bookViStateUrlSuccessor.status,'ACTIVE_VERSIONED_SUCCESSOR');
assert.equal(bookViStateUrlSuccessor.changeClass,'NEW_ATLAS_RELEASE_SUCCESSOR');
assert.equal(bookViStateUrlSuccessor.changes.length,2);
for(const change of bookViStateUrlSuccessor.changes){
  const frozen=freeze.frozenFiles.find(row=>row.path===change.path);
  assert.ok(frozen,\`Book VI state successor path is not W16-frozen: \${change.path}\`);
  assert.equal(change.previousSha256,frozen.sha256,\`Book VI state predecessor digest mismatch: \${change.path}\`);
  assert.equal(digest(change.path),change.successorSha256,\`Book VI state successor digest drift: \${change.path}\`);
  assert.ok(freeze.freezePolicy.allowedChangeClasses.includes(change.changeClass),\`Book VI state change class not allowed: \${change.path}\`);
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

`;
  checker=checker.slice(0,at)+block+checker.slice(at);
}

const oldMsg="console.log('  Future substantive changes require a versioned successor / maintenance record.');";
const newMsg="console.log('  Book VI shared state + URL-state extensions are reconciled through a versioned successor; Book V predecessor bytes remain frozen.');\n"+oldMsg;
if(!checker.includes('Book VI shared state + URL-state extensions are reconciled')){
  checker=checker.replace(oldMsg,newMsg);
}

fs.writeFileSync(checkerPath,checker);
console.log(`Applied Book VI state/URL-state successor. state=${stateCurrentSha} url=${urlCurrentSha}`);
