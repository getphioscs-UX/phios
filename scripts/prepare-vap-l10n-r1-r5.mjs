import { writePreparedCandidates } from './lib/visual-article-production/vap-l10n-r1-r5-v1.mjs';
const out = writePreparedCandidates();
console.log(`✓ VAP-L10N-R1 prepared: ${out.r1.status}`);
console.log(`✓ VAP-L10N-R2 shared-physical-figure projection prepared: ${out.r2.projectionCode}`);
console.log(`✓ VAP-L10N-R3 EN CPR presentation prepared: ${out.r3.presentationCode}`);
console.log(`✓ VAP-L10N-R4 EN visual article projection prepared: ${out.r4.status}`);
console.log(`✓ VAP-L10N-R5 same-route preflight prepared: ${out.r5.status}`);
