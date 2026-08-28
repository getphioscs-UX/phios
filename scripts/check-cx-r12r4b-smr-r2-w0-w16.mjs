import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/check-cx-r12r4b-smr-r2-w0-w11.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-cx-r12r4b-smr-r2-five-benchmarks.mjs'],{stdio:'inherit'});
console.log('✓ CX-R12R4B SMR-R2 W0-W16 aggregate passed.');
