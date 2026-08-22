import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const successor=json('content/professional/method-client-delivery/reconciliation/mcd-8-current-presentation-fingerprint-decoupling-successor-v2.json');
const predecessor=json(successor.predecessor.path);
const freeze=json(successor.historicalFreeze.path);
const acceptance=json('content/professional/method-client-delivery/acceptance/mcd-8-production-acceptance-v1.json');
const handoff=json('content/professional/method-client-delivery/registries/mcd-8-guided-reading-consumption-handoff-v1.json');
const mpa=json('content/professional/method-production-activation/successors/mpa-mcd-1-production-authority-successor-v1.json');
const pkg=json('package.json');

assert.equal(successor.status,'ACTIVE_CURRENT_MCD8_AUTHORITY_PRESERVED_PRESENTATION_DECOUPLED');
assert.equal(sha(successor.predecessor.path),successor.predecessor.sha256,'MCD8_CURRENT_MIR4_HISTORICAL_EVIDENCE_DRIFT');
assert.equal(successor.predecessor.mutated,false);
assert.equal(predecessor.status,'ACTIVE_SCOPED_CANONICAL_PROJECTION_FIELD_RECONCILIATION');
assert.equal(sha(successor.historicalFreeze.path),successor.historicalFreeze.sha256,'MCD8_CURRENT_HISTORICAL_FREEZE_EVIDENCE_DRIFT');
assert.equal(successor.historicalFreeze.mutated,false);
assert.equal(freeze.status,'FROZEN_MCD_ACCEPTED_GUIDED_READING_CANONICAL_PROJECTION_HANDOFF_OPEN');

assert.equal(successor.currentPolicy.wholePackageFingerprintRequired,false);
assert.equal(successor.currentPolicy.wholeProfessionalWorkspaceHtmlFingerprintRequired,false);
assert.equal(successor.currentPolicy.wholeExternalReaderIntakeHtmlFingerprintRequired,false);
assert.equal(successor.currentPolicy.presentationMayEvolve,true);
for(const artifact of successor.exactAuthorityArtifacts){
  assert.equal(sha(artifact.path),artifact.sha256,`MCD8_CURRENT_AUTHORITY_DRIFT:${artifact.path}`);
}
for(const surface of successor.semanticPresentationSurfaces){
  const html=read(surface.path);
  assert.equal(surface.presentationFingerprintRequired,false);
  for(const token of surface.requiredTokens) assert.ok(html.includes(token),`MCD8_CURRENT_SURFACE_CONTRACT_MISSING:${surface.path}:${token}`);
}

assert.equal(pkg.scripts['check:mcd'],'npm run check:mcd-1 && npm run check:mcd-2 && npm run check:mcd-3 && npm run check:mcd-4 && npm run check:mcd-5 && npm run check:mcd-6 && npm run check:mcd-7 && npm run check:mcd-8');
assert.equal(pkg.scripts['check:mcd-8'],successor.packageAliasSuccessor['check:mcd-8']);
for(const code of ['AST','BZR','NUM']){
  const method=mpa.methods.find(item=>item.pluginCode===code);
  assert.ok(method,`MCD8_CURRENT_MPA_METHOD_MISSING:${code}`);
  assert.equal(method.dispatchAllowed,true);
  assert.equal(method.productionEligible,true);
}
const hdr=mpa.methods.find(item=>item.pluginCode==='HDR');
assert.ok(hdr,'MCD8_CURRENT_HDR_AUTHORITY_MISSING');
assert.equal(hdr.state,'BLOCKED');
assert.equal(hdr.dispatchAllowed,false);
assert.equal(hdr.productionEligible,false);

assert.equal(acceptance.status,'ACCEPTED_MCD_PRODUCTION_GUIDED_READING_HANDOFF_OPEN');
assert.equal(handoff.status,'ACTIVE_AFTER_MCD8_ACCEPTANCE');
assert.deepEqual(handoff.allowedPublicMethodCodesAfterAcceptance,['ASTROLOGY_PROJECTION','BAZI_PROJECTION','NUMEROLOGY_PROJECTION']);
assert.deepEqual(handoff.blockedPublicMethodCodes,['PERSONAL_RUNTIME_PROJECTION']);
assert.equal(handoff.authorityBoundary.guidedReadingMayRecalculate,false);

const renderer=read(predecessor.scopedAllowedConsumer);
assert.doesNotMatch(renderer,/core-method-runtime|functions\/method-runtime|shared-calculation-runtime|shared-projection-runtime|canonical-meaning-runtime|reading-runtime|fetch\s*\(/i);
for(const term of ['Human Design','人类图','HUMAN_DESIGN','BodyGraph']) assert.equal(renderer.includes(term),false,`MCD8_CURRENT_RESTRICTED_RENDERER_VOCABULARY:${term}`);
for(const forbidden of predecessor.stillForbidden.filter(value=>!['calculationRuntimeImport','HDR_BRANDED_PUBLIC_SURFACE'].includes(value))) assert.equal(renderer.includes(forbidden),false,`MCD8_CURRENT_FORBIDDEN_RENDERER_FIELD:${forbidden}`);
for(const allowed of predecessor.allowedProjectedFields) assert.equal(renderer.includes(allowed),true,`MCD8_CURRENT_ALLOWED_PROJECTED_FIELD_MISSING:${allowed}`);
const angle=read('assets/js/method-client-delivery/renderers/personal-structure-visual-angle.js');
assert.doesNotMatch(angle,/302|5\.625|0\.9375|GATE_WHEEL_ECLIPTIC_OFFSET/);
for(const value of Object.values(successor.authorityBoundary)) assert.equal(value,false);

console.log('✓ MCD-8 current authority + presentation decoupling passed.');
console.log('  Professional Workspace / External Reader presentation may evolve; MPA dispatch, Guided Reading handoff, renderer scope and restricted-method boundaries remain fail-closed.');
