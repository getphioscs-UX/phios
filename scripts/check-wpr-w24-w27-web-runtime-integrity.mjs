import {spawnSync} from 'node:child_process';
const checks=['scripts/check-wpr-w24-hydration-runtime.mjs','scripts/check-wpr-w25-public-discovery.mjs','scripts/check-wpr-w26-privacy-security-production.mjs','scripts/check-wpr-w27-pds-responsive-accessibility.mjs'];
for(const file of checks){const r=spawnSync(process.execPath,[file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
const {readFileSync}=await import('node:fs');const a=JSON.parse(readFileSync('content/web-production/acceptance/wpr-w24-w27-web-runtime-integrity-acceptance-v1.json','utf8'));if(a.status!=='ACCEPT_WEB_RUNTIME_INTEGRITY_LIMITED_PRODUCTION_PRODUCTION_BROWSER_REVALIDATION_REQUIRED'||a.postcheckExpanded!==false)process.exit(1);
console.log('✓ WPR-G W24-W27 Web Runtime Integrity passed.');console.log('✓ Hydration, discovery, response security and PDS integration are governed without expanding WPR authority or central postcheck.');
