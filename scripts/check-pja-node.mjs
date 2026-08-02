import fs from 'node:fs';
import path from 'node:path';
import { buildPreparedPackage, NODE_ROOT } from './lib/knowledge-production/scalable-article-workflow.mjs';
const nodeCode = process.argv.slice(2).find(arg => !arg.startsWith('--'));
if (!nodeCode) { console.error('NODE_CODE_REQUIRED'); process.exit(2); }
const began = performance.now(), root = process.cwd();
try { const built = buildPreparedPackage(root, nodeCode), packageRoot = NODE_ROOT(nodeCode); const required = ['production-package.json', 'draft.md', 'source-manuscript-reference.json', 'review-status.json']; const missing = required.filter(name => !fs.existsSync(path.join(root, packageRoot, name))); if (missing.length) throw new Error(`PACKAGE_FILES_MISSING:${missing.join(',')}`); console.log(JSON.stringify({ status: 'passed', nodeCode, productionReady: true, packageStatus: built.manifest.status, draftHash: built.draftHash, claimCoverage: built.review.claimCoverage.percentage, boundaryCoverage: built.review.boundaryCoverage.mustEstablish, reviewStatus: built.review.status, fullRepositoryCheckExecuted: false, checkerExecutions: 1, elapsedMs: Math.round(performance.now() - began) }, null, 2)); } catch (error) { console.error(error.code || error.message); process.exit(1); }
