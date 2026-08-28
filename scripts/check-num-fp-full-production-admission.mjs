import fs from 'node:fs';
const p='content/professional/num-production/full-production/rich-meaning/admission/num-r8-w18-full-production-cutover-v1.json';
const gate=JSON.parse(fs.readFileSync(p,'utf8'));
const g=gate.preCutoverGates||{};
if(g.numR7HumanAcceptance12Pass!==true||g.richClaimRuntimeAdmission!==true||g.defaultCustomerCutover!==true){console.error('NUM_R8_FULL_PRODUCTION_CUTOVER_BLOCKED');for(const x of gate.blockingReasons||[])console.error(`- ${x}`);console.error('Review: content/professional/num-production/full-production/rich-meaning/review/num-r7-human-review.html');process.exit(1)}
console.log('✓ NUM-R8 / NUM-FP Full Production cutover gate passed.');
