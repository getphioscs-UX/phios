import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { isDeepStrictEqual } from 'node:util';
import {
  READINESS_IDENTITY_CONTRACT, READINESS_IDENTITY_DIRECTORY,
  READINESS_IDENTITY_INDEX, readinessIdentityPath
} from './lib/knowledge-readiness/readiness-identity.mjs';

const root = process.cwd();
const apply = process.argv.includes('--apply');
if (apply && process.argv.includes('--dry-run')) fail('ARGUMENT_CONFLICT', '--apply and --dry-run are mutually exclusive.');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const registry = readJson('content/knowledge/registry/nodes.json');
const blueprintRegistry = readJson('content/knowledge/blueprints/blueprint-registry.json');
const blueprints = blueprintRegistry.books.map(entry => ({
  entry,
  blueprint: readJson(entry.blueprintPath)
}));
const localized = readJson('content/knowledge/registry/localized-content.json');
const contract = readJson(READINESS_IDENTITY_CONTRACT);
const nodeCodes = registry.nodes.map(node => node.nodeCode);
const blueprintNodes = blueprints.flatMap(({ entry, blueprint }) =>
  (blueprint.nodes || []).map(node => ({ ...node, bookCode: entry.bookCode, blueprintContract: blueprint.contract }))
);
const blueprintCodes = new Set(blueprintNodes.map(node => node.nodeCode));
const blueprintContractByCode = new Map(blueprintNodes.map(node => [node.nodeCode, node.blueprintContract]));
const localizedCodes = new Set(localized.localizedContent.filter(item => item.locales?.['zh-Hans']).map(item => item.nodeCode));
const conflicts = [];
if (nodeCodes.length !== 78 || new Set(nodeCodes).size !== 78) conflicts.push(conflict('REGISTRY_NODE_SET_CONFLICT', null, 'nodeCode', nodeCodes.length, 78, 'Canonical Registry'));
for (const code of nodeCodes) {
  if (!blueprintCodes.has(code)) conflicts.push(conflict('BLUEPRINT_IDENTITY_NOT_FOUND', code, 'nodeCode', code, null, 'Knowledge Blueprint Registry'));
  if (!localizedCodes.has(code)) conflicts.push(conflict('LOCALIZED_IDENTITY_NOT_FOUND', code, 'locale', null, 'zh-Hans', 'Localized Identity Registry'));
}

const expected = new Map(nodeCodes.map(code => [readinessIdentityPath(code), buildRecord(code)]));
const expectedIndex = {
  schemaVersion: 'PHI-OS-CANONICAL-READINESS-INDEX-v1.0.0',
  recordType: 'canonical_readiness_index', sourceOfTruth: false,
  registryVersion: registry.version, nodeCount: 78,
  entries: nodeCodes.map(code => ({ nodeCode: code, locale: 'zh-Hans', readinessFile: readinessIdentityPath(code) }))
};
const existing = [];
const create = [];
for (const [relative, record] of expected) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) create.push(relative);
  else if (isDeepStrictEqual(readJson(relative), record)) existing.push(relative);
  else conflicts.push(conflict('READINESS_RECORD_CONFLICT', record.nodeCode, 'record', readJson(relative), record, 'Readiness Identity Layer'));
}
let indexAction = 'create';
if (fs.existsSync(path.join(root, READINESS_IDENTITY_INDEX))) {
  if (isDeepStrictEqual(readJson(READINESS_IDENTITY_INDEX), expectedIndex)) indexAction = 'existing';
  else conflicts.push(conflict('READINESS_INDEX_CONFLICT', null, 'index', readJson(READINESS_IDENTITY_INDEX), expectedIndex, 'Readiness Identity Layer'));
}
const filesThatWouldChange = [...create, ...(indexAction === 'create' ? [READINESS_IDENTITY_INDEX] : [])];
const report = {
  stage: 'PJA-W2F-C1', mode: apply ? 'apply' : 'dry-run', registryNodes: nodeCodes.length,
  existing: existing.length, create: create.length, conflict: conflicts.length,
  missing: nodeCodes.length - existing.length - create.length,
  indexAction, filesThatWouldChange, conflicts
};
console.log(JSON.stringify(report, null, 2));
if (conflicts.length) process.exit(2);
if (!apply || filesThatWouldChange.length === 0) {
  if (apply) console.log('PJA-W2F-C1 apply no-op; Readiness Layer is byte-stable.');
  process.exit(0);
}

const readinessRoot = path.join(root, 'content/knowledge/readiness');
const temporaryRoot = path.join(root, 'content/knowledge/readiness.pja-w2f-c1.tmp');
const backupRoot = path.join(root, 'content/knowledge/readiness.pja-w2f-c1.backup');
fs.rmSync(temporaryRoot, { recursive: true, force: true });
fs.rmSync(backupRoot, { recursive: true, force: true });
fs.mkdirSync(path.join(temporaryRoot, 'records'), { recursive: true });
for (const [relative, record] of expected) {
  const destination = path.join(temporaryRoot, path.relative('content/knowledge/readiness', relative));
  fs.writeFileSync(destination, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}
for (const filename of ['readiness-identity.schema.json', 'readiness-identity.contract.json']) {
  fs.copyFileSync(path.join(readinessRoot, filename), path.join(temporaryRoot, filename));
}
fs.writeFileSync(path.join(temporaryRoot, path.basename(READINESS_IDENTITY_INDEX)), `${JSON.stringify(expectedIndex, null, 2)}\n`, 'utf8');
try {
  if (fs.existsSync(readinessRoot)) fs.renameSync(readinessRoot, backupRoot);
  fs.renameSync(temporaryRoot, readinessRoot);
  fs.rmSync(backupRoot, { recursive: true, force: true });
} catch (error) {
  if (fs.existsSync(readinessRoot)) fs.rmSync(readinessRoot, { recursive: true, force: true });
  if (fs.existsSync(backupRoot)) fs.renameSync(backupRoot, readinessRoot);
  throw error;
}
console.log('PJA-W2F-C1 Readiness Skeleton Population applied.');

function buildRecord(nodeCode) {
  const blocking = contract.blockingContract.map(item => ({ code: item.code, message: item.message, ownerStage: item.ownerStage, active: true }));
  return {
    schemaVersion: contract.schemaVersion, recordType: 'canonical_readiness_skeleton', nodeCode, locale: 'zh-Hans',
    readinessStatus: 'skeleton', productionStatus: 'not_production_ready',
    review: { status: 'not_started', humanFrozen: false },
    blocking, missing: contract.blockingContract.map(item => item.missing),
    thesis: { status: 'not_ready' }, boundary: { status: 'not_ready' }, claims: { status: 'not_ready' },
    sources: { status: 'not_ready' }, questions: { status: 'not_ready' }, figures: { status: 'not_ready' },
    export: { status: 'blocked' },
    audit: { ownerStage: 'PJA-W2F-C1', registryVersion: registry.version, blueprintContract: blueprintContractByCode.get(nodeCode), recordVersion: '1.0.0' }
  };
}
function conflict(code, nodeCode, field, currentValue, proposedValue, authoritySource) {
  return { code, nodeCode, field, currentValue, proposedValue, authoritySource, resolutionRequired: true };
}
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(2); }
