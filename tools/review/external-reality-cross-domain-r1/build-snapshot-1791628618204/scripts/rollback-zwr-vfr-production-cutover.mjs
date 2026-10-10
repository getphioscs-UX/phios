import fs from 'node:fs';
import assert from 'node:assert/strict';

const root='docs/reports/ziwei/vfr-r1';
const bindingPath='functions/report-delivery/ziwei-canonical-person-binding.js';
const cutoverPath=root+'/PRODUCTION-CUTOVER.json';
assert(fs.existsSync(bindingPath),'canonical binding missing');
assert(fs.existsSync(cutoverPath),'production cutover receipt missing');

let src=fs.readFileSync(bindingPath,'utf8');
if(src.includes("import {generateZiweiProfessionalSynthesisR5Candidate} from './ziwei-professional-synthesis-r5-generation.js';")){
 console.log('PASS ZWR-VFR rollback already applied; legacy R5 binding active.');
 process.exit(0);
}

const newImport="import {generateZiweiVfrR1Candidate} from './ziwei-vfr-r1-generation.js';";
const newDefault='generateCandidate=generateZiweiVfrR1Candidate';
assert(src.includes(newImport),'unexpected canonical binding import for rollback');
assert(src.includes(newDefault),'unexpected canonical binding generator default for rollback');

src=src.replace(newImport,"import {generateZiweiProfessionalSynthesisR5Candidate} from './ziwei-professional-synthesis-r5-generation.js';");
src=src.replace(newDefault,'generateCandidate=generateZiweiProfessionalSynthesisR5Candidate');
fs.writeFileSync(bindingPath,src);

fs.writeFileSync(root+'/PRODUCTION-ROLLBACK.json',JSON.stringify({
 schemaVersion:'ZWR-VFR-R1-DEEP-PRODUCTION-ROLLBACK-v1',
 rolledBackAt:new Date().toISOString(),
 from:'ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3',
 to:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5-GENERATION-v1',
 reason:'EXPLICIT_OPERATOR_ROLLBACK',
 providerCalls:0
},null,2)+'\n');

console.log('PASS ZWR-VFR production rollback applied: canonical binding restored to legacy R5 hot path; provider calls=0.');
