import {previewServer} from './lib/ca-r1-preview-server.mjs';
const server=await previewServer();
console.log(`PHI OS local presentation preview: ${server.origin}`);
console.log(`Review: ${server.origin}/docs/public-index-successor/PIS-R1-HUMAN-REVIEW.html`);
console.log('Local presentation and existing read-only Ask fixture only. No Stripe, account, entitlement, receipt or download E2E. Ctrl+C to stop.');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.close();process.exit(0)});
