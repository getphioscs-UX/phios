import {writePackageDReports} from './lib/knowledge-runtime/knr-package-d-v1.mjs';
const {quality,integration}=await writePackageDReports();
console.log(`KNR Package D rebuilt: quality=${quality.summary.status}, score=${quality.summary.score}, integration=${integration.outcome}.`);
