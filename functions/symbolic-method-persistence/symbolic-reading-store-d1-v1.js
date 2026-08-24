import { assertVerifiedSymbolicAccountIdentity } from './symbolic-account-identity-v1.js';
import { patchSymbolicReadingPersistenceEnvelope, SYMBOLIC_READING_PERSISTENCE_SCHEMA } from './symbolic-reading-envelope-v1.js';

const RUNTIME_SCHEMA = 'PHI-OS-SYMBOLIC-READING-RUNTIME-v1.0.0';
const ARTIFACT_SCHEMA = 'PHI-OS-SYMBOLIC-READING-ARTIFACT-v1.0.0';
const ARTIFACT_TYPE = 'symbolic_reading';
const STAGE = 'symbolic_reading_saved';
const clean = value => String(value ?? '').trim();
const parse = value => { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return null; } };

function assertD1(db) {
  if (!db || typeof db.prepare !== 'function') {
    const error = new Error('SYMBOLIC_RUNTIME_DB_NOT_CONFIGURED');
    error.code = 'SYMBOLIC_RUNTIME_DB_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }
  return db;
}
function nowIso(clock) { return String((clock || (() => new Date().toISOString()))()); }
function uuid(prefix, createId) { return createId ? createId(prefix) : `${prefix}_${crypto.randomUUID()}`; }
async function all(db, sql, ...values) { return (await db.prepare(sql).bind(...values).all())?.results || []; }
async function first(db, sql, ...values) { return await db.prepare(sql).bind(...values).first(); }

function projectRow(row, { includePayload = false } = {}) {
  if (!row) return null;
  const payload = parse(row.payload);
  const summary = {
    readingId: row.runtime_id,
    artifactId: row.artifact_id,
    methodCode: payload?.methodCode || null,
    question: payload?.question || '',
    reviewState: payload?.reviewState || 'SAVED',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contextUsed: payload?.contextConsent?.currentRealityContextUsed === true,
    drawEvidenceId: payload?.drawEvidence?.drawEvidenceId || null
  };
  return includePayload ? { ...summary, reading: payload } : summary;
}

export function createSymbolicReadingD1Store({ db, clock, createId } = {}) {
  db = assertD1(db);
  const store = {
    provider: 'RUNTIME_DB_D1',
    schemaVersion: SYMBOLIC_READING_PERSISTENCE_SCHEMA,

    async save({ identity: identityInput, envelope }) {
      const identity = assertVerifiedSymbolicAccountIdentity(identityInput);
      if (envelope?.schemaVersion !== SYMBOLIC_READING_PERSISTENCE_SCHEMA) throw new TypeError('SYMBOLIC_PERSISTENCE_ENVELOPE_REQUIRED');
      const timestamp = nowIso(clock);
      const readingId = uuid('symbolic_reading', createId);
      const artifactId = uuid('symbolic_artifact', createId);
      const eventId = uuid('symbolic_event', createId);
      const runtimeState = JSON.stringify({
        methodCode: envelope.methodCode,
        artifactId,
        reviewState: envelope.reviewState,
        persistenceClass: 'ACCOUNT_EXPLICIT_SAVE',
        realityTruthCreated: false
      });
      const artifactPayload = JSON.stringify(envelope);
      const eventPayload = JSON.stringify({ artifactId, methodCode: envelope.methodCode, reviewState: envelope.reviewState, retentionExplicit: true });
      const statements = [
        db.prepare(`INSERT INTO runtime_users (user_id,status,created_at,updated_at) VALUES (?1,'active',?2,?2) ON CONFLICT(user_id) DO UPDATE SET updated_at=excluded.updated_at`).bind(identity.userId, timestamp),
        db.prepare(`INSERT INTO runtimes (runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES (?1,?2,'active',?3,?4,?5,?6,?6)`).bind(readingId, identity.userId, STAGE, RUNTIME_SCHEMA, runtimeState, timestamp),
        db.prepare(`INSERT INTO runtime_artifacts (artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?7)`).bind(artifactId, readingId, ARTIFACT_TYPE, STAGE, artifactPayload, ARTIFACT_SCHEMA, timestamp),
        db.prepare(`INSERT INTO runtime_events (event_id,runtime_id,event_type,payload,event_version,created_at) VALUES (?1,?2,'symbolic.reading.saved',?3,'1.0.0',?4)`).bind(eventId, readingId, eventPayload, timestamp)
      ];
      if (typeof db.batch === 'function') await db.batch(statements); else { for (const statement of statements) await statement.run(); }
      return Object.freeze({ recordId: readingId, artifactId, createdAt: timestamp, provider: store.provider });
    },

    async list({ identity: identityInput, limit = 20 } = {}) {
      const identity = assertVerifiedSymbolicAccountIdentity(identityInput);
      const n = Math.max(1, Math.min(50, Number(limit) || 20));
      const rows = await all(db, `SELECT r.runtime_id,a.artifact_id,a.payload,r.created_at,a.updated_at FROM runtimes r JOIN runtime_artifacts a ON a.runtime_id=r.runtime_id WHERE r.user_id=?1 AND a.artifact_type=?2 ORDER BY a.updated_at DESC LIMIT ?3`, identity.userId, ARTIFACT_TYPE, n);
      return Object.freeze(rows.map(row => Object.freeze(projectRow(row))));
    },

    async read({ identity: identityInput, readingId }) {
      const identity = assertVerifiedSymbolicAccountIdentity(identityInput);
      const id = clean(readingId);
      if (!id) throw new TypeError('SYMBOLIC_READING_ID_REQUIRED');
      const row = await first(db, `SELECT r.runtime_id,a.artifact_id,a.payload,r.created_at,a.updated_at FROM runtimes r JOIN runtime_artifacts a ON a.runtime_id=r.runtime_id WHERE r.user_id=?1 AND r.runtime_id=?2 AND a.artifact_type=?3 LIMIT 1`, identity.userId, id, ARTIFACT_TYPE);
      return row ? Object.freeze(projectRow(row, { includePayload: true })) : null;
    },

    async update({ identity: identityInput, readingId, patch = {} }) {
      const identity = assertVerifiedSymbolicAccountIdentity(identityInput);
      const current = await store.read({ identity, readingId });
      if (!current) {
        const error = new Error('SYMBOLIC_READING_NOT_FOUND'); error.code = 'SYMBOLIC_READING_NOT_FOUND'; error.status = 404; throw error;
      }
      const next = patchSymbolicReadingPersistenceEnvelope(current.reading, patch);
      const timestamp = nowIso(clock);
      const eventId = uuid('symbolic_event', createId);
      const statements = [
        db.prepare(`UPDATE runtime_artifacts SET payload=?1,updated_at=?2 WHERE artifact_id=?3 AND runtime_id=?4`).bind(JSON.stringify(next), timestamp, current.artifactId, current.readingId),
        db.prepare(`UPDATE runtimes SET state=?1,updated_at=?2 WHERE runtime_id=?3 AND user_id=?4`).bind(JSON.stringify({methodCode:next.methodCode,artifactId:current.artifactId,reviewState:next.reviewState,persistenceClass:'ACCOUNT_EXPLICIT_SAVE',realityTruthCreated:false}), timestamp, current.readingId, identity.userId),
        db.prepare(`INSERT INTO runtime_events (event_id,runtime_id,event_type,payload,event_version,created_at) VALUES (?1,?2,'symbolic.reading.updated',?3,'1.0.0',?4)`).bind(eventId, current.readingId, JSON.stringify({reviewState:next.reviewState,userNotesChanged:patch.userNotes!==undefined,realityHandoffChanged:patch.realityHandoff!==undefined}), timestamp)
      ];
      if (typeof db.batch === 'function') await db.batch(statements); else { for (const statement of statements) await statement.run(); }
      return Object.freeze({ recordId: current.readingId, updatedAt: timestamp, reviewState: next.reviewState });
    }
  };
  return Object.freeze(store);
}
