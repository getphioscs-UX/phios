import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const h=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ROOT='content/professional/core-method-runtime';
const rec=j(`${ROOT}/iching-identity-reconciliation-v1.json`);
const mr1=j('content/professional/method-runtime/method-registry-v1.json');
const mr2=j('content/professional/method-production-activation/registries/method-registry-v2.json');
const sym=j('content/professional/method-production-activation/successors/method-registry-symbolic-category-successor-v1.json');
const line=j(`${ROOT}/iching-line-model-v1.json`);
const tri=j(`${ROOT}/iching-trigram-registry-v1.json`);
const hex=j(`${ROOT}/iching-hexagram-registry-v1.json`);

assert.equal(rec.work,'ICH-W0');
assert.equal(rec.status,'RECONCILED_EXISTING_IDENTITY_NO_SECOND_AUTHORITY');
assert.deepEqual(rec.canonicalIdentity,{methodCode:'I_CHING',pluginCode:'ICH',projectionType:'HEXAGRAM'});
for (const ref of Object.values(rec.predecessors)) assert.equal(h(ref.path),ref.sha256,`ICH-W0 predecessor drift: ${ref.path}`);
assert.equal(rec.rules.newMethodIdentityCreated,false);
assert.equal(rec.rules.newPluginIdentityCreated,false);
assert.equal(rec.rules.newProjectionTypeCreated,false);
assert.equal(rec.rules.predecessorMutationAllowed,false);

const a=mr1.methods.filter(x=>x.methodCode==='I_CHING');
const b=mr2.methods.filter(x=>x.methodCode==='I_CHING');
assert.equal(a.length,1); assert.equal(b.length,1);
assert.equal(a[0].pluginCode,'ICH'); assert.equal(a[0].targetTrack,'ICH');
assert.equal(b[0].pluginCode,'ICH'); assert.equal(b[0].internalTrack,'ICH'); assert.equal(b[0].state,'REGISTERED');
const se=sym.categoryEntries.filter(x=>x.methodCode==='I_CHING');
assert.equal(se.length,1); assert.equal(se[0].pluginCode,'ICH'); assert.equal(se[0].projectionType,'HEXAGRAM');

assert.deepEqual(line.entries.map(x=>x.lineValue),[6,7,8,9]);
assert.deepEqual(line.entries.map(x=>x.lineState),['CHANGING_YIN','STABLE_YANG','STABLE_YIN','CHANGING_YANG']);
assert.equal(tri.entries.length,8);
assert.equal(new Set(tri.entries.map(x=>x.trigramId)).size,8);
assert.equal(new Set(tri.entries.map(x=>x.binary)).size,8);
assert.deepEqual([...new Set(tri.entries.flatMap(x=>x.allowedHexagramPositions))].sort(),['LOWER','UPPER']);
const triById=new Map(tri.entries.map(x=>[x.trigramId,x]));
assert.equal(hex.entries.length,64);
assert.equal(new Set(hex.entries.map(x=>x.hexagramId)).size,64);
assert.equal(new Set(hex.entries.map(x=>x.number)).size,64);
assert.equal(new Set(hex.entries.map(x=>x.binary)).size,64);
assert.deepEqual(hex.entries.map(x=>x.number),Array.from({length:64},(_,i)=>i+1));
for (const x of hex.entries) {
  assert.match(x.hexagramId,/^HEXAGRAM-\d{2}$/);
  assert.match(x.binary,/^[01]{6}$/);
  assert.equal(x.binary,triById.get(x.lowerTrigramId).binary+triById.get(x.upperTrigramId).binary);
  assert.deepEqual(x.lineStructure,x.binary.split('').map(Number));
}
assert.equal(hex.rules.commentaryIncluded,false); assert.equal(hex.rules.interpretationIncluded,false);
console.log('✓ ICH-W0/W2/W3/W4 identity + canonical structural registries passed.');
console.log('  Existing I_CHING / ICH / HEXAGRAM lineage is reused; 8 trigrams + 64 King Wen identities are unique.');
