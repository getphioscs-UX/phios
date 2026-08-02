import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  READINESS_IDENTITY_INDEX, resolveReadiness, validateReadinessIdentity
} from './lib/knowledge-readiness/readiness-identity.mjs';

const root = process.cwd();
const index = JSON.parse(await fs.readFile(path.join(root, READINESS_IDENTITY_INDEX), 'utf8'));
const failures = [];
for (const entry of index.entries) {
  const record = JSON.parse(await fs.readFile(path.join(root, entry.readinessFile), 'utf8'));
  const validation = await validateReadinessIdentity(root, record, entry.nodeCode);
  if (!validation.valid) failures.push({ nodeCode: entry.nodeCode, errors: validation.errors });
  const resolved = await resolveReadiness(root, entry.nodeCode);
  if (!resolved.exists) failures.push({ nodeCode: entry.nodeCode, errors: ['RESOLVER_NOT_FOUND'] });
}
if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exit(1); }
console.log(`✓ ${index.entries.length} Readiness Skeletons and Index entries passed.`);
