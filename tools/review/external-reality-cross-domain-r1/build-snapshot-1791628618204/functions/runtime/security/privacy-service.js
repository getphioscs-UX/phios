import {
  SECURITY_ERROR_CODES,
  SECURITY_PRIVACY_CONTRACT_ID,
  SecurityPrivacyError,
  assertSecurityPersistence
} from './security-contract.js';
import { createPrivacyLogger } from './privacy-logger.js';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function assertUserAction(input, operation) {
  if (input.user_initiated !== true) {
    throw new SecurityPrivacyError(
      SECURITY_ERROR_CODES.USER_ACTION_REQUIRED,
      `${operation} requires an explicit user action.`
    );
  }
}

function assertOwner(record, userId) {
  if (!record || !userId || cleanText(record.user_id) !== userId) {
    throw new SecurityPrivacyError(
      SECURITY_ERROR_CODES.OWNERSHIP_REQUIRED,
      'The requesting user does not own this Runtime.'
    );
  }
}

async function listAllUserRuntimes(persistence, userId) {
  const records = [];
  const limit = 100;
  let offset = 0;
  while (true) {
    const page = await persistence.list({
      user_id: userId,
      limit,
      offset
    });
    records.push(...page);
    if (page.length < limit) return records;
    offset += limit;
  }
}

export function createPrivacyService(options = {}) {
  const persistence = assertSecurityPersistence(options.persistence);
  const lineageStore = options.lineageStore || null;
  const sessionStore = options.sessionStore || null;
  const identityStore = options.identityStore || null;
  const logger = options.logger || createPrivacyLogger();
  const clock = options.clock || (() => new Date().toISOString());

  async function deleteSession(input = {}) {
    assertUserAction(input, 'Session deletion');
    if (
      !sessionStore ||
      typeof sessionStore.readSession !== 'function' ||
      typeof sessionStore.deleteSession !== 'function'
    ) {
      throw new SecurityPrivacyError(
        SECURITY_ERROR_CODES.SESSION_STORE_REQUIRED,
        'Session deletion requires the active Session Store boundary.'
      );
    }
    const sessionId = cleanText(input.session_id);
    const userId = cleanText(input.user_id);
    const session = await sessionStore.readSession(sessionId);
    if (!session) {
      throw new SecurityPrivacyError(
        SECURITY_ERROR_CODES.NOT_FOUND,
        'Session was not found.'
      );
    }
    if (cleanText(session.user_id) !== userId) {
      throw new SecurityPrivacyError(
        SECURITY_ERROR_CODES.OWNERSHIP_REQUIRED,
        'The requesting user does not own this Session.'
      );
    }
    const deleted = await sessionStore.deleteSession(sessionId);
    logger.info('Runtime Session deleted.', {
      operation: 'delete_session',
      status: deleted ? 'deleted' : 'not_found'
    });
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      operation: 'delete_session',
      session_id: sessionId,
      deleted: deleted === true
    });
  }

  async function deleteRuntime(input = {}) {
    assertUserAction(input, 'Runtime deletion');
    const runtimeId = cleanText(input.runtime_id);
    const userId = cleanText(input.user_id);
    const runtime = await persistence.read(runtimeId);
    if (!runtime) {
      throw new SecurityPrivacyError(
        SECURITY_ERROR_CODES.NOT_FOUND,
        'Runtime was not found.'
      );
    }
    assertOwner(runtime, userId);
    const deleted = await persistence.delete(runtimeId);
    const related = typeof lineageStore?.deleteRuntimeData === 'function'
      ? await lineageStore.deleteRuntimeData(runtimeId)
      : null;
    logger.info('Runtime deleted.', {
      operation: 'delete_runtime',
      status: deleted ? 'deleted' : 'not_found'
    });
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      operation: 'delete_runtime',
      runtime_id: runtimeId,
      deleted: deleted === true,
      related_data_deleted: related
    });
  }

  async function deleteAccount(input = {}) {
    assertUserAction(input, 'Account deletion');
    const userId = cleanText(input.user_id);
    if (input.confirmation !== 'DELETE_ACCOUNT') {
      throw new SecurityPrivacyError(
        SECURITY_ERROR_CODES.ACCOUNT_CONFIRMATION_REQUIRED,
        'Account deletion requires the exact confirmation token.'
      );
    }
    const runtimes = await listAllUserRuntimes(persistence, userId);
    for (const runtime of runtimes) {
      await persistence.delete(runtime.runtime_id);
      if (typeof lineageStore?.deleteRuntimeData === 'function') {
        await lineageStore.deleteRuntimeData(runtime.runtime_id);
      }
    }
    const sessionsDeleted =
      typeof sessionStore?.deleteSessionsByUser === 'function'
        ? await sessionStore.deleteSessionsByUser(userId)
        : 0;
    const identityDeleted =
      typeof identityStore?.deleteUser === 'function'
        ? await identityStore.deleteUser(userId)
        : false;
    logger.info('Runtime account data deleted.', {
      operation: 'delete_account',
      status: 'deleted',
      count: runtimes.length
    });
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      operation: 'delete_account',
      user_id: userId,
      runtimes_deleted: runtimes.length,
      sessions_deleted: Number(sessionsDeleted || 0),
      identity_deleted: identityDeleted === true
    });
  }

  async function exportData(input = {}) {
    assertUserAction(input, 'Data export');
    const userId = cleanText(input.user_id);
    const runtimes = await listAllUserRuntimes(persistence, userId);
    const exportedRuntimes = [];
    for (const runtime of runtimes) {
      assertOwner(runtime, userId);
      const [events, snapshot, revisions, parents, children] =
        await Promise.all([
          persistence.listEvents(runtime.runtime_id, { limit: 1000 }),
          persistence.loadSnapshot(runtime.runtime_id),
          typeof lineageStore?.listRevisions === 'function'
            ? lineageStore.listRevisions(runtime.runtime_id)
            : [],
          typeof lineageStore?.listParentLinks === 'function'
            ? lineageStore.listParentLinks(runtime.runtime_id)
            : [],
          typeof lineageStore?.listChildLinks === 'function'
            ? lineageStore.listChildLinks(runtime.runtime_id)
            : []
        ]);
      exportedRuntimes.push({
        runtime,
        events,
        latest_snapshot: snapshot,
        revisions,
        lineage: {
          parent_links: parents,
          child_links: children
        }
      });
    }
    logger.info('Runtime data export prepared.', {
      operation: 'export_data',
      status: 'prepared',
      count: exportedRuntimes.length,
      classification: 'private'
    });
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      export_version: 'phi-os.runtime-user-export.v1',
      user_id: userId,
      generated_at: clock(),
      classification: 'private',
      owner_requested: true,
      runtimes: Object.freeze(exportedRuntimes),
      runtime_count: exportedRuntimes.length
    });
  }

  return Object.freeze({
    contract: SECURITY_PRIVACY_CONTRACT_ID,
    deleteSession,
    deleteRuntime,
    deleteAccount,
    exportData
  });
}

export default createPrivacyService;
