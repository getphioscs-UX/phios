import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createSqliteD1Adapter, enableSqliteNumberedParameterCompatibility, loadRuntimeMigrations } from './runtime-migration-loader.mjs';
import { applyRuntimeMigrations } from '../functions/runtime/migrations/migration-runner.js';
import { normalizeVerifiedSymbolicAccountIdentity, symbolicPersistenceProviderState } from '../functions/symbolic-method-persistence/symbolic-account-identity-v1.js';
import { createSymbolicReadingPersistenceEnvelope } from '../functions/symbolic-method-persistence/symbolic-reading-envelope-v1.js';
import { createSymbolicReadingD1Store } from '../functions/symbolic-method-persistence/symbolic-reading-store-d1-v1.js';
import { onRequestPost as saveApi } from '../functions/api/symbolic-method-save.js';
import { onRequestGet as readingsGet, onRequestPatch as readingsPatch } from '../functions/api/symbolic-method-readings.js';
import { onRequestGet as contextApi } from '../functions/api/symbolic-method-context.js';
import { projectOne } from './lib/tarot/tari-fixtures-v1.mjs';
import { createTarotReadingIR } from '../functions/interpretation-runtime/tarot-reading-ir-v1.js';
import { createTarotProductPublicViewModel } from '../functions/symbolic-method-public-ux/tarot-product-view-model-v1.js';

const BASE='306b84652102583690a7f7665167f8dfdbb82541';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const P={
 account:'content/public-ux/symbolic-method/contracts/tarot-account-persistence-contract-v1.json',
 guest:'content/public-ux/symbolic-method/contracts/tarot-guest-persistence-contract-v1.json',
 consent:'content/public-ux/symbolic-method/contracts/tarot-reality-context-consent-contract-v1.json',
 saveContinue:'content/public-ux/symbolic-method/contracts/tarot-save-continue-contract-v1.json',
 identity:'functions/symbolic-method-persistence/symbolic-account-identity-v1.js',
 envelope:'functions/symbolic-method-persistence/symbolic-reading-envelope-v1.js',
 store:'functions/symbolic-method-persistence/symbolic-reading-store-d1-v1.js',
 saveApi:'functions/api/symbolic-method-save.js',
 readingsApi:'functions/api/symbolic-method-readings.js',
 contextApi:'functions/api/symbolic-method-context.js',
 successor:'content/interpretation/tarot/reconciliation/tarot-persistence-current-successor-v1.json',
 acceptance:'content/interpretation/tarot/acceptance/tarot-persistence-acceptance-v1.json',
 page:'readings/symbolic/index.html',
 client:'assets/js/pages/symbolic-perspective.js',
 execute:'functions/api/symbolic-method-execute.js',
 pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
 catalog:'content/web-production/px2/successors/public-method-catalog-v2.json',
 accountPage:'account.html'
};
for(const p of Object.values(P)) assert.ok(fs.existsSync(p),`missing ${p}`);

// Contracts: truthful source-ready state, no invented live account provider.
const account=readJson(P.account), guest=readJson(P.guest), consent=readJson(P.consent), saveContinue=readJson(P.saveContinue);
for(const x of [account,guest,consent,saveContinue]) assert.equal(x.baselineCommit,BASE);
assert.equal(account.provider.binding,'RUNTIME_DB');assert.equal(account.provider.newMigrationRequired,false);assert.equal(account.identity.clientSuppliedIdentityAllowed,false);assert.equal(account.retention.localStorageFallbackAllowed,false);
assert.equal(guest.rules.hiddenPersistentReadingHistory,false);assert.equal(guest.rules.localStorageReadingPersistenceAllowed,false);assert.equal(guest.rules.sessionStorageReadingPersistenceAllowed,false);
assert.equal(consent.rules.explicitUseRequired,true);assert.equal(consent.rules.silentContextConsumptionAllowed,false);assert.equal(consent.rules.rawPrivateContextMayBeAddedToPersistenceEnvelope,false);
assert.match(saveContinue.actions.saveReading,/symbolic-method-save/);assert.match(saveContinue.actions.listSavedReadings,/symbolic-method-readings/);assert.equal(saveContinue.currentSurface.liveAccountProviderConnected,false);

// Identity accepts only explicit server-side verified/authenticated context.
assert.equal(normalizeVerifiedSymbolicAccountIdentity({userId:'u1',providerId:'p1'}),null);
assert.equal(normalizeVerifiedSymbolicAccountIdentity({userId:'u1',providerId:'p1',verified:true,authenticated:true}).userId,'u1');
assert.equal(symbolicPersistenceProviderState({env:{},data:{symbolicAccountIdentity:{userId:'u1',providerId:'p1',verified:true,authenticated:true}}}).providerReady,false);

// Reuse the existing 5 migrations; Phase H does not mutate the frozen migration sequence.
const database=new DatabaseSync(':memory:');enableSqliteNumberedParameterCompatibility(database);database.exec('PRAGMA foreign_keys=ON;');
const db=createSqliteD1Adapter(database);const {migrations}=loadRuntimeMigrations(process.cwd());assert.equal(migrations.length,5);
let tick=0;const clock=()=>new Date(Date.UTC(2026,7,24,13,0,tick++)).toISOString();
await applyRuntimeMigrations({db,migrations,now:clock});

// Build a genuine Tarot product view from the frozen corpus for persistence tests.
const paths={cards:'content/professional/core-method-runtime/tarot-card-registry-v1.json',visual:'content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json',visualLoc:'content/interpretation/tarot/registries/tarot-visual-evidence-locator-v1.json',sourceRegistry:'content/interpretation/tarot/registries/tarot-source-registry-v2.json',perspective:'content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v2.json',waite:'content/interpretation/tarot/corpus/tarot-waite-source-bound-corpus-v1.json',meaning:'content/interpretation/tarot/corpus/tarot-minimum-source-bound-corpus-v1.json',lens:'content/interpretation/tarot/registries/tarot-reflective-lens-registry-v1.json',blend:'content/interpretation/tarot/contracts/tarot-no-source-blending-contract-v1.json',freeze:'content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json',rcc:'content/interpretation/tarot/contracts/tarot-rcc-mandatory-contract-v1.json',agency:'content/interpretation/tarot/contracts/tarot-agency-contract-v1.json',uncertainty:'content/interpretation/tarot/contracts/tarot-uncertainty-contract-v1.json',comp:'content/interpretation/tarot/contracts/tarot-composition-evidence-contract-v1.json'};
const authorities={cardRegistry:readJson(paths.cards),visualCorpus:readJson(paths.visual),visualLocator:readJson(paths.visualLoc),sourceRegistry:readJson(paths.sourceRegistry),perspectiveRegistry:readJson(paths.perspective),waiteCorpus:readJson(paths.waite),predecessorMeaningCorpus:readJson(paths.meaning),reflectiveLensRegistry:readJson(paths.lens),noSourceBlendingContract:readJson(paths.blend),corpusFreeze:readJson(paths.freeze)};
const projection=await projectOne('RWS-MAJOR-00','TPAH-SAVE');
const ir=createTarotReadingIR({question:'What deserves attention before I decide?',contextDisclosure:{currentRealityContextUsed:true,currentRealityContextLabel:'Current Reality R-H',contextUseWasExplicit:true},projections:projection,authorities,realityEvidence:{supportingEvidence:['A deadline is documented.'],unknown:['One stakeholder has not replied.']},compositionEvidence:{generatedAt:'2026-08-24T13:00:00.000Z',authorityDigests:{corpusFreezeSha256:sha(paths.freeze)},boundaryContractVersions:{rcc:readJson(paths.rcc).contractVersion,agency:readJson(paths.agency).contractVersion,uncertainty:readJson(paths.uncertainty).contractVersion,compositionEvidence:readJson(paths.comp).contractVersion}}});
const view=createTarotProductPublicViewModel(ir);
const envelope=createSymbolicReadingPersistenceEnvelope({method:'TAROT',question:ir.question,methodEvidence:view.hierarchy[1].data,projection:view.hierarchy[2].data,reading:view,userNotes:'Review after the meeting.'});
assert.equal(envelope.methodCode,'TAROT');assert.equal(envelope.contextConsent.currentRealityContextUsed,true);assert.equal(envelope.contextConsent.explicitUseConfirmed,true);assert.equal(envelope.governance.canonicalRawReadingIrPersisted,false);assert.equal(envelope.governance.publicIrProjectionPersisted,true);assert.equal(JSON.stringify(envelope).includes('TAR-SRC-PRIV-LUA'),false);

// W31: real D1 persistence over existing canonical runtime tables, scoped to verified identity.
let seq=0;const createId=p=>`${p}_tpah_${++seq}`;const store=createSymbolicReadingD1Store({db,clock,createId});
const alice={userId:'acct_alice',providerId:'TEST_VERIFIED_PROVIDER',verified:true,authenticated:true};const bob={userId:'acct_bob',providerId:'TEST_VERIFIED_PROVIDER',verified:true,authenticated:true};
const saved=await store.save({identity:alice,envelope});assert.match(saved.recordId,/symbolic_reading/);assert.equal((await store.list({identity:alice})).length,1);assert.equal((await store.list({identity:bob})).length,0);
const loaded=await store.read({identity:alice,readingId:saved.recordId});assert.equal(loaded.reading.question,ir.question);assert.equal(loaded.reading.userNotes,'Review after the meeting.');assert.equal(await store.read({identity:bob,readingId:saved.recordId}),null);
const updated=await store.update({identity:alice,readingId:saved.recordId,patch:{userNotes:'Updated note',reviewState:'REVIEW_LATER',realityHandoff:{status:'USER_SELECTED_NOT_CANONICAL'}}});assert.equal(updated.reviewState,'REVIEW_LATER');assert.equal((await store.read({identity:alice,readingId:saved.recordId})).reading.userNotes,'Updated note');
assert.equal(database.prepare("SELECT COUNT(*) AS count FROM runtime_events WHERE event_type LIKE 'symbolic.reading.%'").get().count,2);
assert.equal(database.prepare("SELECT COUNT(*) AS count FROM runtime_artifacts WHERE artifact_type='symbolic_reading'").get().count,1);

// API fail-closed tests + verified provider success path.
const req=(url,method='GET',body=null)=>new Request(url,{method,headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
let response=await saveApi({request:req('https://example.com/api/symbolic-method-save','POST',{reading:view,question:ir.question,method:'TAROT'}),env:{RUNTIME_DB:db},data:{ckaAccess:{accountState:'GUEST'}}});assert.equal(response.status,401);
response=await saveApi({request:req('https://example.com/api/symbolic-method-save','POST',{reading:view,question:ir.question,method:'TAROT'}),env:{RUNTIME_DB:db},data:{ckaAccess:{accountState:'ACCOUNT',retentionPolicyAccepted:true}}});assert.equal(response.status,503);
const trustedData={ckaAccess:{accountState:'ACCOUNT',retentionPolicyAccepted:true,permission:true,privacy:true,entitlement:true,roles:['ELIGIBLE_CUSTOMER']},symbolicAccountIdentity:alice,ckaRealityContext:{realityCaseId:'R-H',contextLabel:'Current Reality R-H',retrievalSummary:'One governed summary.',disclosureItems:[{label:'Work',value:'Deadline this week',category:'CONTEXT'}]}};
response=await saveApi({request:req('https://example.com/api/symbolic-method-save','POST',{reading:view,question:ir.question,method:'TAROT',userNotes:'API save'}),env:{RUNTIME_DB:db},data:trustedData});assert.equal(response.status,200);const saveBody=await response.json();assert.equal(saveBody.ok,true);assert.equal(saveBody.governance.runtimeDbD1Used,true);
response=await readingsGet({request:req('https://example.com/api/symbolic-method-readings'),env:{RUNTIME_DB:db},data:trustedData});assert.equal(response.status,200);assert.ok((await response.json()).records.length>=2);
response=await readingsPatch({request:req('https://example.com/api/symbolic-method-readings','PATCH',{readingId:saveBody.recordId,userNotes:'API note',reviewState:'REVIEW_LATER'}),env:{RUNTIME_DB:db},data:trustedData});assert.equal(response.status,200);assert.equal((await response.json()).reviewState,'REVIEW_LATER');

// W32/W33: guest remains memory-free; Reality context requires explicit authorized opt-in and exposes disclosure only.
response=await contextApi({request:req('https://example.com/api/symbolic-method-context?method=TAROT'),env:{RUNTIME_DB:db},data:{ckaAccess:{accountState:'GUEST'}}});let contextBody=await response.json();assert.equal(contextBody.account.saveContractAvailable,false);assert.equal(contextBody.guest.hiddenPersistentReadingHistory,false);
response=await contextApi({request:req('https://example.com/api/symbolic-method-context?method=TAROT&useCurrentRealityContext=1'),env:{RUNTIME_DB:db},data:trustedData});contextBody=await response.json();assert.equal(contextBody.account.saveContractAvailable,true);assert.equal(contextBody.realityContext.usingCurrentRealityContext,true);assert.equal(contextBody.realityContext.silentPrivateContextConsumption,false);assert.equal(contextBody.realityContext.contextItems[0].label,'Work');

// W34: backend Save / list / open / notes / review-later exists; existing surface actions remain visible without predecessor mutation.
const page=text(P.page), client=text(P.client);for(const token of ['data-symbolic-save','Ask PHI OS','Add to Reality','data-review-later','data-compare-evidence'])assert.ok(page.includes(token),`missing action ${token}`);
for(const bad of ['localStorage','sessionStorage']) assert.equal(client.includes(bad),false);
assert.match(text(P.accountPage),/Account services are not connected in this release/);

// Acceptance/successor and production closure remain truthful.
const acceptance=readJson(P.acceptance), successor=readJson(P.successor);assert.equal(acceptance.baselineCommit,BASE);assert.equal(successor.baselineCommit,BASE);assert.equal(successor.productionBoundary.globalAccountIdentityProviderConnected,false);assert.equal(successor.productionBoundary.verifiedLiveAccountPersistenceClaimed,false);assert.equal(successor.productionBoundary.publicRunAllowedChanged,false);
for(const [name,item] of Object.entries(acceptance.artifacts)){assert.ok(fs.existsSync(item.path),`acceptance artifact missing ${name}`);assert.equal(item.sha256,sha(item.path),`acceptance drift ${name}`);}
assert.match(text(P.execute),/SYMBOLIC_LIMITED_PRODUCTION_NOT_ACTIVATED/);
const pcm=readJson(P.pcm),tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT');assert.equal(tarPcm.userExecutable,false);assert.equal(tarPcm.productionAccepted,false);
const catalog=readJson(P.catalog),tarPublic=catalog.methods.find(x=>x.methodCode==='TAROT');assert.equal(tarPublic.runAllowed,false);

database.close();
console.log('✓ TPA-W31 Account Persistence source binding passed: verified server identity + explicit retention saves to existing RUNTIME_DB D1 runtime/artifact/event tables; cross-account access is blocked.');
console.log('✓ TPA-W32 Guest Contract passed: no hidden history, localStorage fallback, sessionStorage fallback, automatic question retention or guest identity fabrication.');
console.log('✓ TPA-W33 Reality Context Consent passed: context is used only after explicit authorized opt-in and only disclosed context enters the save envelope.');
console.log('✓ TPA-W34 Save / Continue backend passed: save, list, open, notes, review state and handoff metadata are user-scoped; persistence does not create Reality truth.');
console.log('  Source persistence is D1-ready, but the global Account UI/authentication provider is still not connected; live verified-account persistence is therefore not claimed and public Tarot execution remains closed.');
