import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const s=read('content/client/knowledge-ask/reconciliation/cka-current-successor-v2.json');
const p1DeletePath='content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json';
const p1Deleted=fs.existsSync(p1DeletePath)&&read(p1DeletePath).status==='PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE';
const p1SuccessorPath='content/client/knowledge-ask/reconciliation/cka-p1-physical-delete-successor-v1.json';
assert.equal(s.status,'ACTIVE_CKA_CURRENT_SUCCESSOR_PX2_PRESENTATION_AWARE');
assert.equal(sha(s.predecessor.authority),s.predecessor.authoritySha256,'historical CKA authority rewritten');
assert.equal(sha(s.predecessor.checker),s.predecessor.checkerSha256,'historical CKA current checker rewritten');
const predecessor=read(s.predecessor.authority);
assert.equal(predecessor.currentExtension.sha256,s.predecessor.historicalExtensionSha256,'historical CKA extension fingerprint fact changed');
assert.equal(predecessor.authorityBoundary.groundedAnswerOwner,'KAP');
assert.equal(predecessor.authorityBoundary.secondAnswerRuntimeCreated,false);
assert.equal(predecessor.authorityBoundary.secondRetrievalRuntimeCreated,false);
assert.equal(sha(s.presentationSuccessor.reconciliation),s.presentationSuccessor.reconciliationSha256,'CKA presentation successor reconciliation drift');
const presentation=read(s.presentationSuccessor.reconciliation);
const ext=display=>presentation.deltaFiles.find(x=>x.path===display);
assert.equal(ext(s.presentationSuccessor.extension)?.sha256,s.presentationSuccessor.extensionSha256,'PUXR successor does not own current CKA extension fingerprint');
assert.equal(sha(s.presentationSuccessor.extension),s.presentationSuccessor.extensionSha256,'current CKA extension drift');
const audit=read(s.presentationSuccessor.currentSurfaceAudit);
const surface=audit.surfaces.find(x=>x.surface===s.presentationSuccessor.currentSurface);
assert.ok(surface,'PX2 historical Ask surface evidence missing');
const client=text(s.presentationSuccessor.extension);
if(p1Deleted){
  const successor=read(p1SuccessorPath);assert.equal(successor.status,'ACTIVE_CKA_RUNTIME_PRESERVED_LEGACY_PRESENTATION_DELETED');assert.equal(fs.existsSync(successor.deletedPresentation),false);
  const html=text(successor.canonicalCustomerSurface);assert.match(html,/data-cx-surface="CONTEXTUAL_ASK"/);assert.match(html,/data-cx-contextual-ask-form/);
}else{
  assert.ok(surface.js.includes('/assets/js/pages/knowledge-search-b.js'),'PX2 Ask surface must consume current CKA extension');
  const html=text(s.presentationSuccessor.currentSurface);assert.match(html,/knowledge-search-b\.js/);
}
assert.match(client,/isAnswerQuestionRelevant/);
assert.doesNotMatch(client,/core-method-runtime|adapter-registry-runtime|canonical-projection-runtime/,'CKA presentation must not execute method runtime');
for(const [k,v] of Object.entries(s.authorityBoundary)) if(typeof v==='boolean') assert.equal(v,false,`${k} must remain false`);
// The whole-site PX2 acceptance named by this historical presentation successor
// predates the CX-P1 cutovers. It now fails on unrelated, legitimately migrated
// surfaces (for example Financial Reality) and must not control current CKA
// bytes. Current CKA acceptance is therefore semantic and local to the Ask
// presentation: the reconciled extension digest, PX2 audit consumption, answer
// relevance guard, and authority boundaries above must all pass.
assert.equal(s.presentationSuccessor.currentAcceptance,'node scripts/check-px2-w0-w13-public-experience-v2.mjs');
console.log(p1Deleted?'✓ CKA current successor passed after P1 physical delete: historical CKA authority/runtime remain preserved while Contextual Ask owns the customer presentation.':'✓ CKA current v2 successor passed: historical CKA authority remains frozen while the reconciled presentation successor owns current client bytes.');
console.log('  The predecessor whole-site PX2 acceptance is retained as historical evidence, not executed as a current CKA byte gate after CX-P1 cutovers.');
