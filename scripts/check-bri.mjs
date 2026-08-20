import { execFileSync } from 'node:child_process';
for (const file of ['scripts/check-bri-branding-logo.mjs','scripts/check-bri-illustration.mjs','scripts/check-bri-instruction.mjs']) execFileSync(process.execPath,[file],{stdio:'inherit'});
console.log('✓ BRI-0–3 complete reconciliation passed.');
