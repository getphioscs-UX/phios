import {execFileSync} from 'node:child_process';
const checks=[
 'scripts/check-hd-rel-r1-w0-source-ontology.mjs',
 'scripts/check-hd-rel-r1-w1-composite-structure.mjs',
 'scripts/check-hd-rel-r1-w2-interaction-admission.mjs',
 'scripts/check-hd-rel-r1-w3-semantic-corpus.mjs',
 'scripts/check-hd-rel-r1-w4-ownership-dedup.mjs',
 'scripts/check-hd-rel-r1-w5-reality-composition.mjs',
 'scripts/check-hd-rel-r1-w6-machine-campaign.mjs',
 'scripts/check-hd-rel-r1-w7-human-review.mjs',
 'scripts/check-hd-rel-r1-w8-production-admission.mjs'
];
for(const file of checks)execFileSync(process.execPath,[file],{stdio:'inherit'});
console.log('✓ HD-REL-R1 W0-W8 aggregate passed; production remains fail-closed until the new W7 24-case Human review is accepted.');
