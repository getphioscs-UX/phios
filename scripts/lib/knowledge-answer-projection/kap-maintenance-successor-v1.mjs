import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {readPreConsumerSource,unifiedConsumerSuccessors} from '../unified-country-consumer-reception-r1.mjs';

const PATHS = Object.freeze([
  'content/knowledge/answer-projection/maintenance/kap-m1-ask-retrieval-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m2-ptrc-ask-quality-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m3-optional-quality-outcome-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m4-formation-grounding-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m5-structured-ask-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m6-structured-customer-presentation-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m7-selected-article-consumption-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m8-book-v-publication-grounding-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m9-preview-manuscript-isolation-v1.json',
  'content/knowledge/answer-projection/reconciliation/kap-book-vii-observation-science-successor-v1.json',
  'content/knowledge/answer-projection/reconciliation/kap-book-vii-production-admission-successor-v1.json',
  'content/knowledge/answer-projection/reconciliation/kap-book-vii-production-live-cutover-r1-successor.json',
  'content/knowledge/answer-projection/reconciliation/kap-book-vii-v2-publication-source-successor-v1.json',
  'content/knowledge/structured/successors/master-a-v2-batch6/kap-source-unavailable-maintenance-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m10-atlas-selection-isolation-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m11-world-public-recovery-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m12-founder-static-publication-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m13-public-ask-execution-policy-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m14-manuscript-source-access-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m15-public-retrieval-coverage-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m16-contextual-navigation-reconciliation-v1.json',
  'content/civilization-atlas/maintenance/main-convergence-r1-successor.json',
  'content/knowledge/answer-projection/maintenance/kap-free-ask-monthly-budget-r1-source-successor.json'
]);
const digest = path => crypto.createHash('sha256').update(readPreConsumerSource(path)).digest('hex');

const KAP_FREE_MONTHLY_RECORD='content/knowledge/answer-projection/maintenance/kap-free-ask-monthly-budget-r1-source-successor.json';
const KAP_FREE_MONTHLY_CONTRACT={
  "status": "ENGINEERING_SOURCE_SUCCESSOR_PENDING_OWNER_APPROVAL",
  "scope": "Register only the previously received Free Ask composition and this strict KAP validator successor. No runtime modification, production activation, content admission or expanded release authority.",
  "baseline": "096b22df9e43d2bed0a82ba5bb010b2eea337ca3",
  "frozenCandidate": {
    "head": "555e4ef6cde74d0d22d8042ad4abb995d1ca66ba",
    "sourceSetSHA256": "55439dd65e14cbd915b3702e42a4dfce7935bcf319695ed42521b9e901457032"
  },
  "source": {
    "owner": "CODEX3_APPROVED_PUBLIC_CONSUMER",
    "branch": "codex/codex3-finance-world-ask-continuation-r1",
    "head": "a05cbb00dd240f8b304d1f52334500f77885812a",
    "sourceSetSHA256": "c3d07a44fd9faa7a742e8f775436ee900421d2cd5034bae5de82bf91c0638066"
  },
  "predecessorRecord": {
    "path": "content/civilization-atlas/maintenance/main-convergence-r1-successor.json",
    "sha256": "552e26c15384d0d2d5f2fd41b514315feb3ce2363dbe002f5aa68cbed0cc4144"
  },
  "validatorPredecessorSha256": "c28c183bf3971e92e24c94d57217eb3de31f6c58468aa81913e481fd703c910c",
  "boundaries": {
    "canonicalKnowledgeCreated": false,
    "secondAskRuntimeCreated": false,
    "historicalFreezeRewritten": false,
    "checksumValidationRelaxed": false,
    "humanAccepted": false,
    "productionAccepted": false,
    "providerLiveEnabled": false,
    "contentAdmissionGranted": false,
    "commercialAdmissionGranted": false,
    "additionalRuntimePathGranted": false
  }
};
const KAP_FREE_MONTHLY_RUNTIME_CHANGE={"path":"functions/_lib/knowledge-answer-composition.js","predecessorSha256":"3de96383d13c1d13e77f20b43c13c76f7a9314bf50a766d6b095ca0cd2231bb5","successorSha256":"e5e4a0633c991bbcd6ea1ab1edbe047a68d8ecb5b3eeee56f58ec65f0980b418","changeClass":"EXISTING_SERVER_ADMITTED_FREE_ASK_MONTHLY_BUDGET_COMPOSITION_ONLY"};
const KAP_FREE_MONTHLY_VALIDATOR='scripts/lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs';
export function validateKapFreeAskMonthlySuccessor(doc,{readGit=(ref,path)=>execFileSync('git',['show',ref+':'+path],{maxBuffer:4*1024*1024})}={}){
 const validatorChange={path:KAP_FREE_MONTHLY_VALIDATOR,predecessorSha256:KAP_FREE_MONTHLY_CONTRACT.validatorPredecessorSha256,successorSha256:digest(KAP_FREE_MONTHLY_VALIDATOR),changeClass:'STRICT_KAP_FREE_MONTHLY_REGISTRATION_ONLY'};
 assert.deepEqual(doc,{...KAP_FREE_MONTHLY_CONTRACT,changes:[KAP_FREE_MONTHLY_RUNTIME_CHANGE,validatorChange]},'Exact two-entry KAP source contract; no extra keys, paths, digest substitutions or release authority');
 const gitDigest=path=>crypto.createHash('sha256').update(readGit(KAP_FREE_MONTHLY_CONTRACT.baseline,path)).digest('hex');
 assert.equal(gitDigest(KAP_FREE_MONTHLY_RUNTIME_CHANGE.path),KAP_FREE_MONTHLY_RUNTIME_CHANGE.predecessorSha256,'Immutable Main096 composition predecessor');
 assert.equal(gitDigest(KAP_FREE_MONTHLY_VALIDATOR),KAP_FREE_MONTHLY_CONTRACT.validatorPredecessorSha256,'Immutable Main096 validator predecessor');
 assert.equal(gitDigest(KAP_FREE_MONTHLY_CONTRACT.predecessorRecord.path),KAP_FREE_MONTHLY_CONTRACT.predecessorRecord.sha256,'Immutable Main convergence record');
 assert.equal(digest(KAP_FREE_MONTHLY_CONTRACT.predecessorRecord.path),KAP_FREE_MONTHLY_CONTRACT.predecessorRecord.sha256,'Original freeze unchanged');
 assert.equal(digest(KAP_FREE_MONTHLY_RUNTIME_CHANGE.path),KAP_FREE_MONTHLY_RUNTIME_CHANGE.successorSha256,'Exact already received composition bytes');
 return doc;
}

const maintenanceDocs = () => PATHS.filter(path => {if(path===KAP_FREE_MONTHLY_RECORD)assert.ok(fs.existsSync(path),'MISSING_KAP_FREE_MONTHLY_RECORD');return fs.existsSync(path);}).map(path => {const doc=JSON.parse(fs.readFileSync(path,'utf8'));return path===KAP_FREE_MONTHLY_RECORD?validateKapFreeAskMonthlySuccessor(doc):doc;});
const changesFor = path => maintenanceDocs().flatMap(doc => (doc.changes || []).filter(item => item.path === path).map(item => ({ doc, item })));

export function kapMaintenanceSuccessorSha(path, fallback = null) {
  const changes = changesFor(path);
  if(changes.length && fallback) assertKapEvidenceOrMaintenance({path,sha256:fallback});
  return unifiedConsumerSuccessors().get(path) ?? (changes.length ? changes.at(-1).item.successorSha256 : fallback);
}

export function assertKapEvidenceOrMaintenance(entry) {
  assert.ok(fs.existsSync(entry.path), `MISSING_FILE:${entry.path}`);
  const actual = digest(entry.path);
  if (actual === entry.sha256) return;
  const changes = changesFor(entry.path);
  assert.ok(changes.length, `DIGEST_DRIFT:${entry.path}`);

  let expected = entry.sha256;
  let chainStarted = false;
  for (const { doc, item } of changes) {
    const predecessors = [item.frozenSha256, item.baselineSha256, item.predecessorSha256].filter(Boolean);
    if (!chainStarted) {
      if (!predecessors.includes(expected)) continue;
      chainStarted = true;
    } else {
      assert.ok(predecessors.includes(expected), `MAINTENANCE_SUCCESSOR_CHAIN_MISMATCH:${entry.path}`);
    }
    expected = item.successorSha256;
    assert.equal(doc.boundaries?.canonicalKnowledgeCreated, false);
    assert.equal(doc.boundaries?.secondAskRuntimeCreated, false);
    if ('historicalFreezeRewritten' in (doc.boundaries || {})) assert.equal(doc.boundaries.historicalFreezeRewritten, false);
    if ('checksumValidationRelaxed' in (doc.boundaries || {})) assert.equal(doc.boundaries.checksumValidationRelaxed, false);
  }
  assert.ok(chainStarted, `MAINTENANCE_FROZEN_DIGEST_MISMATCH:${entry.path}`);
  assert.equal(actual, expected, `MAINTENANCE_SUCCESSOR_DIGEST_MISMATCH:${entry.path}`);
}
