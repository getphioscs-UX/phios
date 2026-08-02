import { validateC2 } from './lib/knowledge-readiness/canonical-thesis-boundary.mjs';
const result = validateC2(process.cwd());
if (!result.valid) { console.error(result.errors.join('\n')); process.exit(2); }
console.log('✓ PJA-W2F-C2 canonical thesis/boundary records valid: 78 assessed, 1 frozen, 77 human review required.');
