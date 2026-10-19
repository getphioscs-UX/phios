import fs from 'node:fs';
import {reviewFinancialProfessionalAdmission} from '../functions/professional/access/financial-professional-admission-review.js';
// Read-only review: intentionally no apply/import/write-authority switch.
const file=process.argv[2];if(!file||process.argv.length!==3)throw Error('Usage: node scripts/prepare-finance-professional-admission.mjs CANDIDATE_JSON');
const value=JSON.parse(fs.readFileSync(file,'utf8'));console.log(JSON.stringify(reviewFinancialProfessionalAdmission(value),null,2));
