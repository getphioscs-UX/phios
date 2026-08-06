import fs from 'node:fs/promises';
import path from 'node:path';
import { resolvePublicationContext } from './publication-context.mjs';

const readOptionalJson = async (root, relative) => {
  try { return JSON.parse(await fs.readFile(path.join(root, relative), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};

export async function resolveProductionState(root, node, options = {}) {
  const publicationContext = options.publicationContext ||
    await resolvePublicationContext(root, node, options);
  const readinessPath = `content/knowledge/editorial/readiness/${node.nodeCode.toLowerCase()}-production-readiness.json`;
  const readiness = options.readiness === undefined
    ? await readOptionalJson(root, readinessPath)
    : options.readiness;
  const readinessStatus = readiness?.productionReadiness?.status ||
    readiness?.publicationRequirement?.productionReadiness || 'not_assessed';
  const productionReady = node.productionReady === true && readinessStatus === 'production_ready';
  return Object.freeze({
    nodeCode: node.nodeCode,
    publicationContext,
    registryStatus: node.registryStatus,
    productionReady,
    readinessStatus,
    reviewStatus: readiness?.review?.status || readiness?.editorialOutline?.status || 'not_assessed',
    approvalStatus: readiness?.approval?.status || 'not_assessed',
    articleStatus: node.articleStatus || 'not_created',
    candidateStatus: node.candidateStatus || 'not_created',
    published: node.articleStatus === 'published',
    readinessPath: readiness ? readinessPath : null
  });
}

export function isProductionEligible(binding) {
  return binding.productionState.productionReady === true &&
    binding.productionState.reviewStatus !== 'changes_required' &&
    binding.productionState.approvalStatus !== 'rejected' &&
    binding.productionState.published === false;
}
