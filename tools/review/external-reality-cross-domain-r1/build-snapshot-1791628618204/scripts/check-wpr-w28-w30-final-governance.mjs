import {spawnSync} from 'node:child_process';
for(const file of ['scripts/check-wpr-w28-drift-observability-deployment.mjs','scripts/check-wpr-w29-full-production-acceptance.mjs','scripts/check-wpr-w30-freeze.mjs']){const r=spawnSync(process.execPath,[file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}console.log('✓ WPR-W28-W30 Final Production Governance passed.');
