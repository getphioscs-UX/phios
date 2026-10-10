import { validateEditorialPackage } from './lib/knowledge-production/editorial-package.mjs';
const result = validateEditorialPackage(process.cwd());
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exit(1);
