import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { writeVapW1RepairedPublishedKnowledgeAuthority, REPAIR_PATH } from './lib/visual-article-production/published-knowledge-integrity-repair-v1.mjs';
import { writePublishedRetrievalIndex } from './lib/knowledge-public/published-retrieval-index-v1.mjs';
import { writePackageDReports } from './lib/knowledge-runtime/knr-package-d-v1.mjs';
const root = process.cwd();
const stableObject = value => Array.isArray(value) ? value.map(stableObject) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stableObject(value[k])])) : value;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(stableObject(value), null, 2) + '\n').digest('hex');
const authority = writeVapW1RepairedPublishedKnowledgeAuthority(root);
const retrieval = await writePublishedRetrievalIndex();
const packageD = await writePackageDReports(root);
const repair = JSON.parse(await fs.readFile(path.join(root, REPAIR_PATH), 'utf8'));
const resultBase = {
  resultCode: 'PHI-OS-VAP-W1-PUBLISHED-KNOWLEDGE-INTEGRITY-REPAIR-RESULT-v1',
  resultVersion: '1.0.0',
  work: 'VAP-W1',
  status: 'REPAIRED_PROJECTION_READY',
  baselineCommit: repair.baselineCommit,
  repairReference: REPAIR_PATH,
  targetAuthorityRecordCode: authority.repairResult.targetAuthorityRecordCode,
  authority: {
    recordCount: authority.registry.recordCount,
    beforeTargetAuthorityDigest: authority.repairResult.beforeAuthorityDigest,
    afterTargetAuthorityDigest: authority.repairResult.afterAuthorityDigest
  },
  retrieval: {
    authorityDigest: retrieval.authorityDigest,
    indexDigest: retrieval.indexDigest,
    nodeCount: retrieval.recordCounts.nodes
  },
  quality: {
    status: packageD.quality.summary.status,
    score: packageD.quality.summary.score,
    findings: packageD.quality.findings.map(x => x.code),
    zhSummaryArtifactContaminationPresent: packageD.quality.findings.some(x => x.code === 'ZH_SUMMARY_ARTIFACT_CONTAMINATION')
  },
  preservation: repair.effects
};
const result = { ...resultBase, resultDigest: `sha256:${digest(resultBase)}` };
const out = path.join(root, 'content/production/visual-article/repairs/vap-w1-published-knowledge-integrity-repair-result-v1.json');
await fs.writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log('✓ VAP-W1 Published Knowledge Integrity Repair applied.');
console.log(`  Authority target: ${authority.repairResult.targetAuthorityRecordCode}`);
console.log(`  Retrieval index: ${retrieval.indexDigest}`);
console.log(`  Quality: ${packageD.quality.summary.status} / ${packageD.quality.summary.score}`);
