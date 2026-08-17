import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const reg=read('content/professional/method-runtime/canonical-mfig-authority-registry-v1.json');
const roles=read('content/professional/method-runtime/canonical-mfig-role-classification-registry-v1.json');
assert.equal(reg.entries.length,50);
const expected=Array.from({length:50},(_,i)=>`MFIG-${String(i+1).padStart(3,'0')}`);
assert.deepEqual(reg.entries.map(x=>x.mfigId),expected);
assert.equal(new Set(reg.entries.map(x=>x.mfigId)).size,50);
assert.equal(new Set(reg.entries.map(x=>x.canonicalTitle)).size,50);
const scopes=new Set(reg.allowedScopes), allowedRoles=new Set(reg.allowedRoles);
for (const e of reg.entries) {
  assert.ok(scopes.has(e.scope),`bad scope ${e.mfigId}`);
  assert.ok(allowedRoles.has(e.role),`bad role ${e.mfigId}`);
  assert.equal(e.authorityOwner,'CANONICAL_MFIG_AUTHORITY_REGISTRY');
  for (const k of ['sourceRefs','manuscriptRefs','knowledgeRefs','methodRefs','runtimeRefs','upstreamMfigRefs','downstreamMfigRefs']) assert.ok(Array.isArray(e[k]),`${e.mfigId} ${k}`);
  for (const k of ['clientResultEligible','carPublicationEligible','mcdRendererEligible','interpretationBindingEligible']) assert.equal(typeof e[k],'boolean',`${e.mfigId} ${k}`);
  assert.notEqual(e.status,'UNRESOLVED');
}
assert.equal(reg.authorityBoundary.carFigureIsMfig,false);
assert.equal(reg.authorityBoundary.mcdRendererIsMfig,false);
assert.equal(reg.authorityBoundary.irFigureRegistryOwnsMfigIdentity,false);
assert.equal(roles.classifications.length,50);
const byId=new Map(reg.entries.map(e=>[e.mfigId,e]));
for (const c of roles.classifications) { const e=byId.get(c.mfigId); assert.ok(e); assert.equal(c.canonicalTitle,e.canonicalTitle); assert.equal(c.scope,e.scope); assert.equal(c.role,e.role); }
console.log('✓ MFIG canonical authority registry passed: 50/50 unique semantic identities, no duplicate title authority, no runtime authority transfer.');
