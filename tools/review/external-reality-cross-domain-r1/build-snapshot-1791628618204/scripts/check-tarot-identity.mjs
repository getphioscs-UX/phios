import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8')); const h=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ROOT='content/professional/core-method-runtime';
const rec=j(`${ROOT}/tarot-identity-reconciliation-v1.json`), mr1=j('content/professional/method-runtime/method-registry-v1.json'), mr2=j('content/professional/method-production-activation/registries/method-registry-v2.json'), sym=j('content/professional/method-production-activation/successors/method-registry-symbolic-category-successor-v1.json'), ich=j(`${ROOT}/iching-runtime-freeze-v1.json`), deck=j(`${ROOT}/tarot-deck-contract-v1.json`), cards=j(`${ROOT}/tarot-card-registry-v1.json`);
assert.equal(rec.work,'TAR-W0'); assert.equal(rec.status,'RECONCILED_EXISTING_IDENTITY_NO_SECOND_AUTHORITY'); assert.deepEqual(rec.canonicalIdentity,{methodCode:'TAROT',pluginCode:'TAR',projectionType:'CARD'});
for(const ref of Object.values(rec.predecessors)) assert.equal(h(ref.path),ref.sha256,`TAR-W0 predecessor drift: ${ref.path}`);
assert.equal(rec.phaseEntryGate.requiredPredecessor,'I Ching Runtime Frozen v1'); assert.equal(rec.phaseEntryGate.satisfied,true); assert.equal(ich.status,'I Ching Runtime Frozen v1');
assert.equal(rec.rules.newMethodIdentityCreated,false); assert.equal(rec.rules.newPluginIdentityCreated,false); assert.equal(rec.rules.newProjectionTypeCreated,false); assert.equal(rec.rules.predecessorMutationAllowed,false);
const a=mr1.methods.filter(x=>x.methodCode==='TAROT'), b=mr2.methods.filter(x=>x.methodCode==='TAROT'), s=sym.categoryEntries.filter(x=>x.methodCode==='TAROT');
assert.equal(a.length,1); assert.equal(b.length,1); assert.equal(s.length,1); assert.equal(a[0].pluginCode,'TAR'); assert.equal(a[0].targetTrack,'TAR'); assert.equal(b[0].pluginCode,'TAR'); assert.equal(b[0].internalTrack,'TAR'); assert.equal(b[0].state,'REGISTERED'); assert.equal(s[0].pluginCode,'TAR'); assert.equal(s[0].projectionType,'CARD');
assert.equal(deck.canonicalDeckFamily.deckId,'RWS_1909_STRUCTURAL_FAMILY'); assert.equal(cards.entries.length,78); assert.equal(new Set(cards.entries.map(x=>x.cardId)).size,78); assert.equal(new Set(cards.entries.map(x=>x.cardIdentity)).size,78);
for(const x of cards.entries){assert.equal(x.deckId,deck.canonicalDeckFamily.deckId); assert.equal(x.deckVersion,deck.canonicalDeckFamily.deckVersion); assert.equal(x.cardIdentity,`${x.deckId}@${x.deckVersion}/${x.cardId}`);}
console.log('✓ TAR-W0 Existing TAROT / TAR / CARD identity reconciliation passed.');
console.log('  I Ching Runtime Frozen v1 is present; no second Tarot method/plugin/projection identity was created.');
