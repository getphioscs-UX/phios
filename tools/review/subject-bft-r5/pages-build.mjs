import fs from 'node:fs';
import {requireDiskSpace} from '../../../scripts/lib/disk-space-guard.mjs';
await requireDiskSpace({task:'subject-bft-r5-functions',estimatedBytes:30000000});
let source=fs.readFileSync('tools/review/subject-bft-r3/pages-build.mjs','utf8');
source=source.replace("'functions/profile/subject-bft-authority-candidate-r3.js'","'functions/professional/financial/business-owner-admission-candidate-r5.js'").replaceAll('subject-bft-r3','subject-bft-r5');
fs.writeFileSync('.tmp/subject-bft-r5/pages-builder.mjs',source);
await import('../../../.tmp/subject-bft-r5/pages-builder.mjs');
