// Preserve the R2.1 runner and receipts. Reuse its bounded compile/regression logic.
import fs from 'node:fs';import cp from 'node:child_process';
const root='tools/review/report-visual-asset-convergence-r2/';
let source=fs.readFileSync(root+'verify.mjs','utf8').replace("const d='tools/review/report-visual-asset-convergence-r2/'","const d='tools/review/report-visual-asset-convergence-r2/recovery-r22/'").replace('tools/review/report-visual-asset-convergence-r2/test-r21.mjs','tools/review/report-visual-asset-convergence-r2/test-r22.mjs').replace("run('r21-targeted'","run('r22-targeted'");
const path=root+'recovery-r22/.bounded-verify.mjs';
fs.writeFileSync(path,source);
const r=cp.spawnSync(process.execPath,[path],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
process.exitCode=r.status??1;
