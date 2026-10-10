import {execFileSync} from 'node:child_process';
for(const script of ['scripts/check-cross-no-smr-prose-input.mjs','scripts/check-cross-semantic-foundation.mjs','scripts/check-cross-composition-v2.mjs'])execFileSync(process.execPath,[script],{stdio:'inherit'});
console.log('✓ R2-W21–W23 Cross-pre + semantic foundation + governed composition aggregate passed; customer Cross cutover remains closed.');
