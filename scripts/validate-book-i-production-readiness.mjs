import { validateProductionReadiness } from './lib/knowledge-readiness/universal-production-readiness.mjs';
const result = validateProductionReadiness(process.cwd());
if (!result.valid) { console.error(result.errors.join('\n')); process.exit(2); }
console.log('✓ PJA-W2F-C3 Universal Production Readiness assessments valid.');
