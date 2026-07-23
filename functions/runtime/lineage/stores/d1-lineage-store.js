import {
  LINEAGE_ERROR_CODES,
  LineageContractError
} from '../lineage-contract.js';
import {
  normalizeLineageRecord,
  normalizeRevisionRecord
} from '../lineage-records.js';

function assertD1(db) {
  if (!db || typeof db.prepare !== 'function') {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.STORAGE_REQUIRED,
      'Production Lineage requires the RUNTIME_DB D1 binding.'
    );
  }
  return db;
}

function parseJson(value, field) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : (value || {});
  } catch {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.INVALID_INPUT,
      `D1 returned invalid JSON for ${field}.`
    );
  }
}

function revisionFromRow(row) {
  if (!row) return null;
  return {
    revision_id: row.revision_id,
    runtime_id: row.runtime_id,
    parent_revision_id: row.parent_revision_id || null,
    reason: row.reason,
    changes: parseJson(row.changes, 'revision.changes'),
    schema_version: row.schema_version,
    created_at: row.created_at
  };
}

function lineageFromRow(row) {
  if (!row) return null;
  return {
    lineage_id: row.lineage_id,
    parent_runtime_id: row.parent_runtime_id,
    child_runtime_id: row.child_runtime_id,
    relationship_type: row.relationship_type,
    metadata: parseJson(row.metadata, 'lineage.metadata'),
    created_at: row.created_at
  };
}

async function run(statement, code, message) {
  try {
    const result = await statement.run();
    if (result?.success === false) throw new Error(message);
    return result;
  } catch {
    throw new LineageContractError(code, message);
  }
}

export function createD1LineageStore(options = {}) {
  const db = assertD1(options.db);
  const clock = options.clock || (() => new Date().toISOString());
  const createId = options.createId;

  async function createRevision(input) {
    const record = normalizeRevisionRecord(input, {
      now: clock(),
      createId
    });
    if (record.parent_revision_id) {
      const parentResult = await db.prepare(`
        SELECT runtime_id
        FROM runtime_revisions
        WHERE revision_id = ?1
        LIMIT 1
      `).bind(record.parent_revision_id).all();
      const parent = parentResult?.results?.[0];
      if (!parent || parent.runtime_id !== record.runtime_id) {
        throw new LineageContractError(
          LINEAGE_ERROR_CODES.REVISION_CONFLICT,
          'A parent Revision must exist in the same Runtime.'
        );
      }
    }
    await run(
      db.prepare(`
        INSERT INTO runtime_revisions (
          revision_id, runtime_id, parent_revision_id, reason, changes,
          schema_version, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      `).bind(
        record.revision_id,
        record.runtime_id,
        record.parent_revision_id,
        record.reason,
        JSON.stringify(record.changes),
        record.schema_version,
        record.created_at
      ),
      LINEAGE_ERROR_CODES.REVISION_CONFLICT,
      `Could not create Revision: ${record.revision_id}`
    );
    return record;
  }

  async function listRevisions(runtimeId) {
    try {
      const result = await db.prepare(`
        SELECT revision_id, runtime_id, parent_revision_id, reason, changes,
               schema_version, created_at
        FROM runtime_revisions
        WHERE runtime_id = ?1
        ORDER BY created_at ASC, revision_id ASC
      `).bind(String(runtimeId || '').trim()).all();
      return (result?.results || []).map(revisionFromRow);
    } catch (error) {
      if (error instanceof LineageContractError) throw error;
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.INVALID_INPUT,
        'Could not read Runtime Revision chain.'
      );
    }
  }

  async function createLineage(input) {
    const record = normalizeLineageRecord(input, {
      now: clock(),
      createId
    });
    await run(
      db.prepare(`
        INSERT INTO runtime_lineages (
          lineage_id, parent_runtime_id, child_runtime_id,
          relationship_type, metadata, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      `).bind(
        record.lineage_id,
        record.parent_runtime_id,
        record.child_runtime_id,
        record.relationship_type,
        JSON.stringify(record.metadata),
        record.created_at
      ),
      LINEAGE_ERROR_CODES.RELATIONSHIP_CONFLICT,
      `Could not create Runtime relationship: ${record.lineage_id}`
    );
    return record;
  }

  async function queryLineages(where, values = []) {
    try {
      const result = await db.prepare(`
        SELECT lineage_id, parent_runtime_id, child_runtime_id,
               relationship_type, metadata, created_at
        FROM runtime_lineages
        ${where}
        ORDER BY created_at ASC, lineage_id ASC
      `).bind(...values).all();
      return (result?.results || []).map(lineageFromRow);
    } catch (error) {
      if (error instanceof LineageContractError) throw error;
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.INVALID_INPUT,
        'Could not read Runtime Lineage.'
      );
    }
  }

  const listParentLinks = runtimeId => queryLineages(
    'WHERE child_runtime_id = ?1',
    [String(runtimeId || '').trim()]
  );
  const listChildLinks = runtimeId => queryLineages(
    'WHERE parent_runtime_id = ?1',
    [String(runtimeId || '').trim()]
  );

  async function listLineages(input = {}) {
    const runtimeIds = Array.isArray(input.runtime_ids)
      ? [...new Set(input.runtime_ids.map(value =>
          String(value || '').trim()
        ).filter(Boolean))]
      : [];
    if (!runtimeIds.length) return queryLineages('');
    const parentParameters = runtimeIds.map(
      (_, index) => `?${index + 1}`
    );
    const childParameters = runtimeIds.map(
      (_, index) => `?${runtimeIds.length + index + 1}`
    );
    return queryLineages(
      `WHERE parent_runtime_id IN (${parentParameters.join(', ')})
         OR child_runtime_id IN (${childParameters.join(', ')})`,
      [...runtimeIds, ...runtimeIds]
    );
  }

  return Object.freeze({
    name: 'd1',
    createRevision,
    listRevisions,
    createLineage,
    listParentLinks,
    listChildLinks,
    listLineages
  });
}

export default createD1LineageStore;
