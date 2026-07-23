import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPersistenceRouter } from
  '../functions/runtime/persistence/persistence-router.js';
import { createMemoryLineageStore } from
  '../functions/runtime/lineage/stores/memory-lineage-store.js';
import {
  SECURITY_ERROR_CODES,
  SecurityPrivacyError,
  authorizeProfessionalAccess,
  authorizeResearchUse,
  classifyRuntimeData,
  createPrivacyLogger,
  createPrivacyService
} from '../functions/runtime/security/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function sequenceClock() {
  let tick = 0;
  return () => `2026-07-23T12:00:${String(tick++).padStart(2, '0')}.000Z`;
}

function idFactory() {
  let value = 0;
  return prefix => `${prefix}_${++value}`;
}

async function rejectsCode(action, code) {
  await assert.rejects(action, error =>
    error instanceof SecurityPrivacyError && error.code === code
  );
}

assert.equal(classifyRuntimeData({ path: 'runtime.state' }).classification, 'private');
assert.equal(
  classifyRuntimeData({
    published: true,
    owner_approved: true
  }).classification,
  'public'
);
assert.equal(
  classifyRuntimeData({ path: 'entry.answer' }).classification,
  'sensitive'
);
assert.equal(
  classifyRuntimeData({ path: 'professional_review.record' }).classification,
  'professional'
);
assert.equal(
  classifyRuntimeData({
    research_consent: { status: 'granted', withdrawn: false }
  }).classification,
  'research-consented'
);

const capturedLogs = [];
const logger = createPrivacyLogger({
  sink: record => capturedLogs.push(record)
});
const log = logger.error('Runtime operation failed.', {
  operation: 'export_data',
  status: 'failed',
  payload: { answer: 'I am afraid to spend money.' },
  email: 'private@example.com',
  arbitrary: 'This is private free text.',
  count: 2
});
assert.equal(log.context.operation, 'export_data');
assert.equal(log.context.count, 2);
assert.equal(log.context.payload, '[REDACTED]');
assert.equal(log.context.email, '[REDACTED]');
assert.equal(log.context.arbitrary, '[REDACTED]');
assert.equal(JSON.stringify(log).includes('private@example.com'), false);
assert.equal(JSON.stringify(log).includes('afraid to spend'), false);

const clock = sequenceClock();
const createId = idFactory();
const persistence = createPersistenceRouter({
  environment: 'test',
  clock,
  createId
});
for (const runtime of [
  {
    runtime_id: 'runtime_root',
    user_id: 'user_a',
    current_stage: 'continuity_active',
    state: { private_text: 'root private state' }
  },
  {
    runtime_id: 'runtime_child',
    user_id: 'user_a',
    current_stage: 'reading_ready',
    state: { private_text: 'child private state' }
  },
  {
    runtime_id: 'runtime_other',
    user_id: 'user_b',
    current_stage: 'entry_collecting',
    state: { private_text: 'other user state' }
  }
]) {
  await persistence.create(runtime);
}
await persistence.appendEvent({
  runtime_id: 'runtime_root',
  event_type: 'entry.completed',
  payload: { private_text: 'owner export content' }
});
await persistence.saveSnapshot({
  runtime_id: 'runtime_root',
  stage: 'continuity_active',
  state: { private_text: 'snapshot export content' }
});

const lineageStore = createMemoryLineageStore({ clock, createId });
await lineageStore.createRevision({
  revision_id: 'revision_root_1',
  runtime_id: 'runtime_root',
  reason: 'owner edit',
  changes: { field: 'changed' }
});
await lineageStore.createLineage({
  lineage_id: 'lineage_root_child',
  parent_runtime_id: 'runtime_root',
  child_runtime_id: 'runtime_child',
  relationship_type: 'branch'
});

const sessions = new Map([
  ['session_a', { session_id: 'session_a', user_id: 'user_a' }],
  ['session_b', { session_id: 'session_b', user_id: 'user_b' }]
]);
const sessionStore = {
  async readSession(id) {
    return sessions.get(id) || null;
  },
  async deleteSession(id) {
    return sessions.delete(id);
  },
  async deleteSessionsByUser(userId) {
    let count = 0;
    for (const [id, session] of sessions) {
      if (session.user_id === userId) {
        sessions.delete(id);
        count += 1;
      }
    }
    return count;
  }
};
const deletedUsers = [];
const identityStore = {
  async deleteUser(userId) {
    deletedUsers.push(userId);
    return true;
  }
};

const service = createPrivacyService({
  persistence,
  lineageStore,
  sessionStore,
  identityStore,
  logger,
  clock
});

await rejectsCode(
  () => service.exportData({ user_id: 'user_a' }),
  SECURITY_ERROR_CODES.USER_ACTION_REQUIRED
);
const exported = await service.exportData({
  user_id: 'user_a',
  user_initiated: true
});
assert.equal(exported.runtime_count, 2);
assert.equal(exported.classification, 'private');
assert.equal(
  exported.runtimes.some(item =>
    item.runtime.runtime_id === 'runtime_other'
  ),
  false
);
assert.equal(
  exported.runtimes.find(item =>
    item.runtime.runtime_id === 'runtime_root'
  ).events.length,
  1
);
assert.equal(
  exported.runtimes.find(item =>
    item.runtime.runtime_id === 'runtime_root'
  ).revisions.length,
  1
);

await rejectsCode(
  () => service.deleteRuntime({
    runtime_id: 'runtime_other',
    user_id: 'user_a',
    user_initiated: true
  }),
  SECURITY_ERROR_CODES.OWNERSHIP_REQUIRED
);
const runtimeDeletion = await service.deleteRuntime({
  runtime_id: 'runtime_child',
  user_id: 'user_a',
  user_initiated: true
});
assert.equal(runtimeDeletion.deleted, true);
assert.equal(await persistence.read('runtime_child'), null);
assert.equal((await lineageStore.listChildLinks('runtime_root')).length, 0);

await rejectsCode(
  () => service.deleteSession({
    session_id: 'session_b',
    user_id: 'user_a',
    user_initiated: true
  }),
  SECURITY_ERROR_CODES.OWNERSHIP_REQUIRED
);
const sessionDeletion = await service.deleteSession({
  session_id: 'session_a',
  user_id: 'user_a',
  user_initiated: true
});
assert.equal(sessionDeletion.deleted, true);
assert.equal(sessions.has('session_a'), false);

const professionalGrant = {
  status: 'granted',
  professional_id: 'professional_1',
  runtime_ids: ['runtime_root'],
  purpose: 'financial evidence review',
  consent_version: '1.0',
  expires_at: '2026-08-01T00:00:00.000Z'
};
assert.equal(authorizeProfessionalAccess({
  runtime_id: 'runtime_root',
  professional_id: 'professional_1',
  grant: professionalGrant
}, {
  now: '2026-07-23T12:00:00.000Z'
}).allowed, true);
await rejectsCode(
  async () => authorizeProfessionalAccess({
    runtime_id: 'runtime_other',
    professional_id: 'professional_1',
    grant: professionalGrant
  }),
  SECURITY_ERROR_CODES.PROFESSIONAL_SCOPE_DENIED
);
await rejectsCode(
  async () => authorizeProfessionalAccess({
    runtime_id: 'runtime_root',
    professional_id: 'professional_1',
    grant: { ...professionalGrant, runtime_ids: ['*'] }
  }),
  SECURITY_ERROR_CODES.PROFESSIONAL_SCOPE_DENIED
);

await rejectsCode(
  async () => authorizeResearchUse({
    runtime_id: 'runtime_root',
    consent: { status: 'pending' }
  }),
  SECURITY_ERROR_CODES.RESEARCH_CONSENT_REQUIRED
);
const researchUse = authorizeResearchUse({
  runtime_id: 'runtime_root',
  consent: {
    status: 'granted',
    runtime_ids: ['runtime_root'],
    purpose: 'bounded Runtime research',
    consent_version: '1.0',
    community_use: false
  }
});
assert.equal(researchUse.allowed, true);
assert.equal(researchUse.classification, 'research-consented');
assert.equal(researchUse.community_use_allowed, false);
await rejectsCode(
  async () => authorizeResearchUse({
    runtime_id: 'runtime_root',
    consent: {
      status: 'granted',
      withdrawn: true,
      runtime_ids: ['runtime_root'],
      purpose: 'bounded Runtime research',
      consent_version: '1.0'
    }
  }),
  SECURITY_ERROR_CODES.RESEARCH_CONSENT_REQUIRED
);

await rejectsCode(
  () => service.deleteAccount({
    user_id: 'user_a',
    user_initiated: true,
    confirmation: 'delete'
  }),
  SECURITY_ERROR_CODES.ACCOUNT_CONFIRMATION_REQUIRED
);
const accountDeletion = await service.deleteAccount({
  user_id: 'user_a',
  user_initiated: true,
  confirmation: 'DELETE_ACCOUNT'
});
assert.equal(accountDeletion.runtimes_deleted, 1);
assert.equal(accountDeletion.identity_deleted, true);
assert.equal(await persistence.read('runtime_root'), null);
assert.notEqual(await persistence.read('runtime_other'), null);
assert.deepEqual(deletedUsers, ['user_a']);

const registry = JSON.parse(read(
  'content/registry/runtime-security-privacy.json'
));
assert.equal(registry.status, 'closed');
assert.deepEqual(registry.classifications, [
  'public',
  'private',
  'sensitive',
  'professional',
  'research-consented'
]);
assert.equal(registry.logging.full_sensitive_text_allowed, false);
assert.equal(
  registry.professional_boundary.automatic_account_access,
  false
);
assert.equal(
  registry.research_boundary.private_runtime_used_by_default,
  false
);
assert.equal(registry.storage.old_migration_modified, false);

const docs = read('docs/runtime/M2-W8-SECURITY-AND-PRIVACY.md');
assert.match(docs, /Professional Access Boundary/);
assert.match(docs, /Research Consent Boundary/);
assert.match(docs, /DELETE_ACCOUNT/);
assert.doesNotMatch(
  read('functions/runtime/security/privacy-service.js'),
  /console\.(log|warn|error)/
);
assert.match(
  read('package.json'),
  /check:runtime-security-privacy/
);

console.log(
  '✓ M2-W8 Runtime classification, privacy logging, deletion/export, ' +
  'Professional Access, and Research Consent Boundary checks passed.'
);
