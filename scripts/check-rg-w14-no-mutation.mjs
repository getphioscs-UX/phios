import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const contract=await read('content/governance/runtime-checker-governance/contracts/checker-no-mutation-contract-v1.json');
assert.deepEqual(contract.allowedOperations,['read','resolve','validate','execute','report']);
const forbiddenPatterns=[/\bwriteFile(?:Sync)?\s*\(/,/\bappendFile(?:Sync)?\s*\(/,/\brename(?:Sync)?\s*\(/,/\bunlink(?:Sync)?\s*\(/,/\brm(?:Sync)?\s*\(/,/\bmkdir(?:Sync)?\s*\(/,/\bcreateWriteStream\s*\(/];
for(const file of contract.governanceImplementationScope){const source=await fs.readFile(path.join(root,file),'utf8');for(const pattern of forbiddenPatterns)assert.doesNotMatch(source,pattern,`${file} violates no-mutation`)}
console.log('✓ RG-W14 No-Mutation Checker passed.');
