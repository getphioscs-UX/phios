import fs from 'node:fs';
import path from 'node:path';
import { C2_INDEX, validateC2 } from './lib/knowledge-readiness/canonical-thesis-boundary.mjs';
const root=process.cwd();
const result=validateC2(root);
if(!result.valid){console.error(result.errors.join('\n'));process.exit(2);}
const index=JSON.parse(fs.readFileSync(path.join(root,C2_INDEX),'utf8'));
const frozen=index.entries.filter(entry=>entry.status==='frozen').length;
const humanReviewRequired=index.entries.filter(entry=>entry.status==='human_review_required').length;
console.log(`✓ PJA-W2F-C2 canonical thesis/boundary records valid: ${index.entries.length} assessed, ${frozen} frozen, ${humanReviewRequired} human review required.`);
