import { readJson, writeJson, argValue, hasArg, criticalCodes, now } from './lib.mjs';
if(!hasArg('--confirm')) throw new Error('HPC2_PRE_EXPLICIT_CONFIRM_REQUIRED');
const reviewer=String(argValue('--reviewer')||'').trim();
if(!reviewer) throw new Error('HPC2_PRE_REVIEWER_REQUIRED');
const reviewPath='content/web/homepage/hpc2-pre/review/critical-assets-human-review-v1.json';
const criticalPath='content/web/homepage/hpc2-pre/hpc2-pre-critical-asset-registry-v1.json';
const review=readJson(reviewPath), critical=readJson(criticalPath), at=now();
if(review.records.length!==16) throw new Error('HPC2_PRE_CRITICAL_REVIEW_COUNT_INVALID');
for(const r of review.records){if(!criticalCodes.includes(r.assetCode))throw new Error(`HPC2_PRE_UNEXPECTED_CRITICAL_ASSET:${r.assetCode}`);r.decision='ACCEPTED';r.reviewer=reviewer;r.reviewedAt=at;r.notes='Explicit visual-asset acceptance recorded by operator command; no knowledge, method, professional or route authority is granted.';}
review.status='HUMAN_VISUAL_ACCEPTED'; review.acceptedCount=16; writeJson(reviewPath,review);
for(const r of critical.records){if(criticalCodes.includes(r.assetCode)){r.humanAccepted=true;r.humanAcceptedBy=reviewer;r.humanAcceptedAt=at;}}
writeJson(criticalPath,critical);
await import('./refresh-status.mjs');
console.log(`✓ HPC2-PRE 16/16 critical visual assets accepted by ${reviewer}.`);
