import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const registry=JSON.parse(fs.readFileSync('content/governance/current-authority-reconciliation/carc-w7-current-chain-v1.json','utf8'));
for(const gate of registry.checks){
  console.log(`\n=== CURRENT ${gate.id} ===`);
  const r=spawnSync(gate.command,{shell:true,stdio:'inherit'});
  if(r.status!==0) process.exit(r.status ?? 1);
}
console.log(`\n✓ PHI OS current authority chain passed (${registry.checks.length} current gates).`);
console.log('  Deployment acceptance remains fail-closed until repo/build/Cloudflare SHA alignment is observed.');
