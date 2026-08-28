import fs from 'node:fs';
const gate=JSON.parse(fs.readFileSync('content/professional/num-production/full-production/admission/num-fp-w18-full-production-gate-v1.json','utf8'));
if(gate.status!=='FULL_PRODUCTION_ADMITTED'||gate.gates?.humanAcceptance12Pass!==true||gate.gates?.richNumberMeaningSourceAdmission!==true||gate.gates?.richRoleSpecificMeaningAdmission!==true||gate.gates?.defaultCustomerCutover!==true){console.error('NUM_FP_FULL_PRODUCTION_BLOCKED');for(const x of gate.blockingReasons||[])console.error(`- ${x}`);process.exit(1)}
console.log('✓ NUM-FP Full Production admission gate passed.');
