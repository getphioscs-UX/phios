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

  // Part Registry is the current publication-ownership authority. Canonical Node
  // publicationBookCode fields and nodeCode prefixes are historical lineage only.
  const publicationPartCode = normalizePartCode(
    migrated?.publicationPartCode || blueprintNode?.partCode || node.publicationPartCode || node.partCode
  );
  const authorityPart = authorities.byPartCode.get(publicationPartCode);
  const authorityPublicationBookCode = authorityPart?.bookCode || null;
  const blueprintPublicationBookCode = normalizeBookCode(blueprintNode?.bookCode);
  const migratedPublicationBookCode = normalizeBookCode(migrated?.publicationBookCode);
  const publicationBookCode = migratedPublicationBookCode || authorityPublicationBookCode || blueprintPublicationBookCode;
  const sourceBookCode = normalizeBookCode(
    migrated?.sourceBookCode || node.sourceBookCode || node.publicationBookCode || blueprintNode?.bookCode
  );

  if (!sourceBookCode || !publicationBookCode || !authorityPart ||
      authorityPublicationBookCode !== publicationBookCode) {
    throw new Error(`Publication Context conflicts with Registry Authority: ${nodeCode}`);
  }
  if (blueprintPublicationBookCode && blueprintPublicationBookCode !== publicationBookCode) {
    throw new Error(`Blueprint publication projection conflicts with Registry Authority: ${nodeCode}`);
  }

  // The explicit P5 migration remains binding historical evidence and therefore
  // must agree with current Part authority. Non-migrated node publicationBookCode
  // fields are intentionally not treated as publication authority after KAU-R0.
  if (migrated && (
    normalizeBookCode(node.sourceBookCode) !== sourceBookCode ||
    normalizePartCode(node.publicationPartCode || node.partCode) !== publicationPartCode
  )) {
    throw new Error(`Publication ownership migration conflicts with Canonical Node: ${nodeCode}`);
  }

  return Object.freeze({
    nodeCode,
    sourceBookCode,
    publicationBookCode,
    publicationPartCode,
    authority: migrated ? 'node-publication-ownership-v2+part-registry' : 'part-registry',
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
