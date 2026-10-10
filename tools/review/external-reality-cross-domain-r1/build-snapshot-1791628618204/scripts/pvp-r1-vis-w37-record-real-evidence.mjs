import fs from 'node:fs';
import path from 'node:path';

const source = process.env.PVP_W37_REAL_EVIDENCE_FILE;
if (!source) {
  console.error('Set PVP_W37_REAL_EVIDENCE_FILE to a completed W37 real-evidence export JSON.');
  process.exit(2);
}
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const intake = read('content/product-visual-platform-r1/phase13/contracts/pvp-r1-vis-w37-real-evidence-intake-contract-v1.json');
const gate = read('content/product-visual-platform-r1/phase13/contracts/pvp-r1-vis-w37-conversion-pilot-contract-v1.json');
const incoming = read(path.resolve(source));
if (incoming.schemaVersion !== 'PHI-OS-PVP-R1-VIS-W37-REAL-EVIDENCE-EXPORT-v1.0.0') {
  throw new Error('W37_REAL_EVIDENCE_SCHEMA_INVALID');
}
if (!Array.isArray(incoming.events) || incoming.events.length === 0) throw new Error('W37_REAL_EVIDENCE_EMPTY');
const hex64 = /^[a-f0-9]{64}$/i;
const clean = [];
for (const event of incoming.events) {
  const rule = intake.signalRules?.[event.signal];
  if (!rule) throw new Error(`W37_SIGNAL_INVALID:${event.signal}`);
  if (event.evidenceClass !== rule.evidenceClass) throw new Error(`W37_EVIDENCE_CLASS_INVALID:${event.signal}`);
  if (!rule.allowedSourceSystems.includes(event.sourceSystem)) throw new Error(`W37_SOURCE_SYSTEM_INVALID:${event.signal}`);
  if (event.real !== true || event.productionEnvironment !== true || event.synthetic !== false || event.controlledReplay !== false || event.testTransaction !== false || event.ownerVerified !== true || event.privateEvidenceRetainedOutsideRepo !== true) {
    throw new Error(`W37_REAL_PRODUCTION_OWNER_ATTESTATION_REQUIRED:${event.signal}`);
  }
  if (!event.occurredAt || Number.isNaN(Date.parse(event.occurredAt))) throw new Error(`W37_OCCURRED_AT_INVALID:${event.signal}`);
  if (!hex64.test(event.proofDigestSha256 || '')) throw new Error(`W37_PROOF_DIGEST_INVALID:${event.signal}`);
  clean.push({
    signal: event.signal,
    evidenceClass: event.evidenceClass,
    real: true,
    productionEnvironment: true,
    synthetic: false,
    controlledReplay: false,
    testTransaction: false,
    occurredAt: new Date(event.occurredAt).toISOString(),
    sourceSystem: event.sourceSystem,
    surface: typeof event.surface === 'string' ? event.surface.slice(0, 120) : '',
    proofDigestSha256: event.proofDigestSha256.toLowerCase(),
    ownerVerified: true,
    privateEvidenceRetainedOutsideRepo: true
  });
}
const evidencePath = 'content/product-visual-platform-r1/phase13/pilot/pvp-r1-vis-w37-conversion-pilot-evidence-v1.json';
const evidence = read(evidencePath);
const prior = Array.isArray(evidence.events) ? evidence.events : [];
const byKey = new Map();
for (const event of [...prior, ...clean]) byKey.set(`${event.signal}:${event.proofDigestSha256 || event.occurredAt}`, event);
evidence.events = [...byKey.values()].sort((a,b)=>String(a.occurredAt).localeCompare(String(b.occurredAt)));
const counts = { click:0, unlock:0, purchase:0, upgrade:0, reality_return:0 };
for (const event of evidence.events) if (event.real === true && counts[event.signal] != null) counts[event.signal]++;
evidence.summary = counts;
const accepted = Object.entries(gate.requiredSignals).every(([signal, rule]) => counts[signal] >= (rule.minimumRealEvents || 1));
evidence.status = accepted ? 'REAL_CONVERSION_PILOT_ACCEPTED' : 'PENDING_REAL_CONVERSION_EVIDENCE';
evidence.accepted = accepted;
evidence.productionAdmissionClaimed = false;
evidence.lastEvidenceRecordedAt = new Date().toISOString();
evidence.privateEvidenceStoredInPublicRepo = false;
evidence.publicEvidenceStoresDigestOnly = true;
fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n');
console.log(`✓ Recorded ${clean.length} owner-verified real W37 evidence event(s). Current counts: ${Object.entries(counts).map(([k,v])=>`${k}=${v}`).join(', ')}.`);
if (!accepted) {
  const missing = Object.entries(gate.requiredSignals).filter(([signal, rule]) => counts[signal] < (rule.minimumRealEvents || 1)).map(([signal])=>signal);
  console.log(`  W37 remains pending: ${missing.join(', ')}.`);
} else {
  console.log('  W37 evidence set is complete. Run npm run check:pvp-r1:phase13:w37, then perform the Phase 13 final freeze successor.');
}
