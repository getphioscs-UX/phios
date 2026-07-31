import fs from 'node:fs/promises';
import path from 'node:path';
import { loadKnowledgeAuthority } from './lib/knowledge-readiness/authority-loader.mjs';
import { writeReadinessInventory } from './lib/knowledge-readiness/inventory.mjs';
import {
  formatReadinessError,
  parseReadinessArgs,
  readinessRelativePath
} from './lib/knowledge-readiness/readiness-config.mjs';
import { buildReadinessSkeleton } from './lib/knowledge-readiness/readiness-record.mjs';
import { resolveKnowledgeScope } from './lib/knowledge-readiness/scope-resolver.mjs';

const root = process.cwd();

async function exists(file) {
  return fs.access(file).then(() => true, () => false);
}

async function main() {
  const args = parseReadinessArgs(process.argv.slice(2));
  const authority = await loadKnowledgeAuthority(root);
  const resolved = resolveKnowledgeScope(authority, args);
  const created = [];
  const preserved = [];
  for (const node of resolved.nodes) {
    const relativePath = readinessRelativePath(node.nodeCode, args.locale);
    const absolutePath = path.join(root, relativePath);
    if (await exists(absolutePath)) {
      preserved.push({ nodeCode: node.nodeCode, relativePath });
      continue;
    }
    const skeleton = buildReadinessSkeleton(
      authority,
      node.nodeCode,
      args.locale
    );
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, `${JSON.stringify(skeleton, null, 2)}\n`);
    created.push({ nodeCode: node.nodeCode, relativePath });
  }
  const inventory = await writeReadinessInventory(authority, args.locale);
  const report = {
    success: true,
    selector: resolved.selector,
    locale: args.locale,
    registeredSelected: resolved.nodes.length,
    blueprintPlannedNotRegistered: resolved.plannedNodes.length,
    created,
    preserved,
    productionReady: inventory.summary.productionReady,
    blocked: inventory.summary.blocked,
    humanTheoryDecisionsCreated: 0,
    automaticApprovals: 0
  };
  if (args.options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`READINESS INITIALIZED: ${resolved.selector}`);
  console.log(`  Created: ${created.length}`);
  console.log(`  Existing preserved: ${preserved.length}`);
  console.log(`  Blueprint-planned, not registered: ${resolved.plannedNodes.length}`);
  console.log(`  Production Ready: ${inventory.summary.productionReady}`);
  console.log(`  Blocked: ${inventory.summary.blocked}`);
  if (!resolved.nodes.length) {
    console.log('  Registration state: NOT_REGISTERED');
  }
}

main().catch(error => {
  console.error(formatReadinessError(error));
  process.exitCode = 2;
});
