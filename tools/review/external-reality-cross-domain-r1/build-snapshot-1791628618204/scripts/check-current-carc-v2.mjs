import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const registry=JSON.parse(fs.readFileSync('content/governance/current-authority-reconciliation/carc-symbolic-current-chain-successor-v2.json','utf8'));
if(registry.predecessorMutated!==false) throw new Error('historical current chain must remain preserved');
for(const gate of registry.checks){
  console.log(`\n=== CURRENT v2 ${gate.id} ===`);
  const r=spawnSync(gate.command,{shell:true,stdio:'inherit'});
  if(r.status!==0) process.exit(r.status ?? 1);
}
console.log(`\n✓ PHI OS CARC current v2 successor passed (${registry.checks.length} current gates).`);
console.log('  Historical CARC chain remains unchanged; MIR-8 current page drift is reconciled by successor evidence, not historical rewrite.');
