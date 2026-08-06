import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizeBookCode, normalizePartCode } from '../knowledge-blueprint/registry-authority.mjs';

export const PUBLICATION_OWNERSHIP_PATH =
  'content/knowledge/migrations/node-publication-ownership-v2.json';

const readJson = async (root, relative) =>
  JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));

export async function loadPublicationOwnership(root) {
  const migration = await readJson(root, PUBLICATION_OWNERSHIP_PATH);
  const byNodeCode = new Map((migration.nodes || []).map(entry => [entry.nodeCode, entry]));
  return { migration, byNodeCode };
}

export async function resolvePublicationContext(root, nodeOrCode, options = {}) {
  const authorities = options.authorities;
  if (!authorities) throw new Error('Publication Context requires Canonical Registry Authority.');
  const nodeCode = typeof nodeOrCode === 'string' ? nodeOrCode : nodeOrCode?.nodeCode;
  const node = typeof nodeOrCode === 'string'
    ? authorities.byNodeCode.get(nodeCode)
    : nodeOrCode;
  if (!node || !nodeCode || !authorities.byNodeCode.has(nodeCode)) {
    throw new Error(`Canonical Node is not registered: ${nodeCode || 'unknown'}`);
  }
  const ownership = options.ownership || await loadPublicationOwnership(root);
  const blueprintNode = options.blueprintNode || null;
  const migrated = ownership.byNodeCode.get(nodeCode) || null;
  const sourceBookCode = normalizeBookCode(
    migrated?.sourceBookCode || node.sourceBookCode || node.publicationBookCode || blueprintNode?.bookCode
  );
  const publicationBookCode = normalizeBookCode(
    migrated?.publicationBookCode || node.publicationBookCode || blueprintNode?.bookCode
  );
  const publicationPartCode = normalizePartCode(
    migrated?.publicationPartCode || node.publicationPartCode || node.partCode || blueprintNode?.partCode
  );
  const authorityPart = authorities.byPartCode.get(publicationPartCode);
  if (!sourceBookCode || !publicationBookCode || !authorityPart ||
      authorityPart.bookCode !== publicationBookCode) {
    throw new Error(`Publication Context conflicts with Registry Authority: ${nodeCode}`);
  }
  if (migrated && (
    normalizeBookCode(node.sourceBookCode) !== sourceBookCode ||
    normalizeBookCode(node.publicationBookCode) !== publicationBookCode ||
    normalizePartCode(node.publicationPartCode || node.partCode) !== publicationPartCode
  )) {
    throw new Error(`Publication ownership migration conflicts with Canonical Node: ${nodeCode}`);
  }
  return Object.freeze({
    nodeCode,
    sourceBookCode,
    publicationBookCode,
    publicationPartCode,
    authority: migrated ? 'node-publication-ownership-v2' : 'canonical-node-registry',
    migrated: Boolean(migrated)
  });
}

export async function resolveSourceLineage(root, nodeOrCode, options = {}) {
  const context = await resolvePublicationContext(root, nodeOrCode, options);
  return Object.freeze({
    nodeCode: context.nodeCode,
    sourceBookCode: context.sourceBookCode,
    publicationBookCode: context.publicationBookCode,
    publicationPartCode: context.publicationPartCode
  });
}
