import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const run = (cmd,args) => {
  const r=spawnSync(cmd,args,{stdio:'inherit',shell:process.platform==='win32'});
  assert.equal(r.status,0,`${cmd} ${args.join(' ')} failed`);
};
run(process.execPath,['scripts/check-ir-w0-baseline-audit.mjs']);
run(process.execPath,['scripts/check-ir-w1-authority-boundary.mjs']);
run(process.execPath,['scripts/check-ir-w2-source-authority-hierarchy.mjs']);
run(process.platform==='win32'?'npm.cmd':'npm',['run','check:mcd']);
const p='content/reconciliation/mir/mir-1-authority-baseline-reconciliation-v1.json';
const x=JSON.parse(fs.readFileSync(p,'utf8'));
const sha = q => crypto.createHash('sha256').update(fs.readFileSync(q)).digest('hex');
assert.equal(x.work,'MIR-1');
assert.equal(x.mcdFrozenBaseline.preservationMode,'BYTE_PRESERVED_NO_IN_PLACE_MUTATION');
assert.ok(x.mcdFrozenBaseline.evidenceCount >= 15);
for (const e of x.mcdFrozenBaseline.evidence) {
  assert.ok(fs.existsSync(e.path),`missing frozen MCD evidence: ${e.path}`);
  assert.equal(sha(e.path),e.sha256,`MCD frozen byte drift: ${e.path}`);
}
for (const [gate,value] of Object.entries(x.exitGate)) assert.equal(value,true,`MIR-1 exit gate failed: ${gate}`);
for (const d of ['docs/interpretation/IR-W0-BASELINE-AUDIT.md','docs/interpretation/IR-W1-AUTHORITY-BOUNDARY.md','docs/interpretation/IR-W2-SOURCE-AUTHORITY-HIERARCHY.md']) assert.ok(fs.existsSync(d),`missing documentation: ${d}`);
console.log('✓ MIR-1 Authority Baseline Reconciliation passed. No duplicate authority, no second Interpretation/Meaning runtime, MCD frozen bytes preserved.');
