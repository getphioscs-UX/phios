import fs from 'node:fs/promises';
import path from 'node:path';

export const READINESS_IDENTITY_DIRECTORY = 'content/knowledge/readiness/records';
export const READINESS_IDENTITY_INDEX = 'content/knowledge/readiness/canonical-readiness-index.json';
export const READINESS_IDENTITY_SCHEMA = 'content/knowledge/readiness/readiness-identity.schema.json';
export const READINESS_IDENTITY_CONTRACT = 'content/knowledge/readiness/readiness-identity.contract.json';
export const READINESS_IDENTITY_SCHEMA_VERSION = 'PHI-OS-READINESS-IDENTITY-v1.0.0';

export class ReadinessIdentityError extends Error {
  constructor(code, message) { super(message); this.name = 'ReadinessIdentityError'; this.code = code; }
}

export function readinessIdentityPath(nodeCode) {
  return `${READINESS_IDENTITY_DIRECTORY}/${nodeCode.toLowerCase()}-readiness.json`;
}

export async function compileReadinessIdentitySchema(root) {
  const { default: Ajv2020 } = await import('ajv/dist/2020.js');
  const schema = JSON.parse(await fs.readFile(path.join(root, READINESS_IDENTITY_SCHEMA), 'utf8'));
  return new Ajv2020({ allErrors: true, strict: true }).compile(schema);
}

export async function resolveReadiness(root, nodeCode) {
  const registry = JSON.parse(await fs.readFile(path.join(root, 'content/knowledge/registry/nodes.json'), 'utf8'));
  if (!registry.nodes.some(node => node.nodeCode === nodeCode)) {
    throw new ReadinessIdentityError('NODE_NOT_FOUND', `${nodeCode} is not registered.`);
  }
  const index = JSON.parse(await fs.readFile(path.join(root, READINESS_IDENTITY_INDEX), 'utf8'));
  const entry = index.entries.find(item => item.nodeCode === nodeCode);
  if (!entry) throw new ReadinessIdentityError('READINESS_FILE_NOT_FOUND', `${nodeCode} has no Readiness index entry.`);
  let record;
  try {
    record = JSON.parse(await fs.readFile(path.join(root, entry.readinessFile), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new ReadinessIdentityError('READINESS_FILE_NOT_FOUND', `${nodeCode} has no Readiness file.`);
    throw error;
  }
  return {
    exists: true,
    nodeCode,
    status: record.readinessStatus,
    productionStatus: record.productionStatus,
    blocking: record.blocking,
    missing: record.missing,
    readinessFile: entry.readinessFile
  };
}

export async function validateReadinessIdentity(root, record, nodeCode) {
  const validate = await compileReadinessIdentitySchema(root);
  const errors = [];
  if (!validate(record)) errors.push(...(validate.errors || []).map(error => `${error.instancePath} ${error.message}`));
  if (record.nodeCode !== nodeCode) errors.push('NODE_CODE_MISMATCH');
  if (record.readinessStatus !== 'skeleton') errors.push('SKELETON_STATUS_REQUIRED');
  if (record.productionStatus !== 'not_production_ready') errors.push('PRODUCTION_STATUS_FORBIDDEN');
  if (record.review?.humanFrozen !== false) errors.push('HUMAN_FREEZE_FORBIDDEN');
  if (record.export?.status !== 'blocked') errors.push('EXPORT_MUST_BE_BLOCKED');
  return { valid: errors.length === 0, errors };
}
