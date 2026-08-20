import { readJson, writeJson, argValue, hasArg, now, criticalCodes } from './lib.mjs';
if(!hasArg('--confirm')) throw new Error('HPC2_PRE_EXPLICIT_CONFIRM_REQUIRED');
const reviewer=String(argValue('--reviewer')||'').trim(); const deployment=String(argValue('--deployment-url')||'').trim();
if(!reviewer) throw new Error('HPC2_PRE_REVIEWER_REQUIRED');
if(!deployment) throw new Error('HPC2_PRE_DEPLOYMENT_URL_REQUIRED');
const u=new URL(deployment); if(u.protocol!=='https:')throw new Error('HPC2_PRE_DEPLOYMENT_URL_INVALID');
const critical=readJson('content/web/homepage/hpc2-pre/hpc2-pre-critical-asset-registry-v1.json');
if(critical.records.filter(r=>criticalCodes.includes(r.assetCode)&&r.remoteVerified).length!==16)throw new Error('HPC2_PRE_CRITICAL_REMOTE_VERIFICATION_REQUIRED');
if(critical.records.filter(r=>criticalCodes.includes(r.assetCode)&&r.humanAccepted).length!==16)throw new Error('HPC2_PRE_CRITICAL_HUMAN_ACCEPTANCE_REQUIRED');
const remote=readJson('content/web/homepage/hpc2-pre/evidence/r2-live-verification-v1.json');
const evidence=remote.records.filter(r=>criticalCodes.includes(r.assetCode)&&r.ok).map(r=>({assetCode:r.assetCode,family:r.assetCode.startsWith('HERO')?'HERO':r.assetCode.startsWith('FIG')?'FIGURE':'BOOK_COVER',objectKey:r.objectKey,requestedURL:r.requestedURL,httpStatus:r.httpStatus,contentType:r.contentType,contentLength:r.contentLength,etag:r.etag,verifiedAt:r.verifiedAt}));
if(evidence.length!==16)throw new Error('HPC2_PRE_NETWORK_EVIDENCE_INCOMPLETE');
const path='content/web/homepage/hpc2-pre/review/browser-visual-review-v1.json'; const review=readJson(path); const at=now();
for(const row of review.matrix){row.deploymentUrl=deployment;row.networkEvidence=evidence.map(x=>({...x,surface:'HOME',viewport:row.viewportWidth,locale:row.locale}));for(const k of Object.keys(row.checks))row.checks[k]='ACCEPTED';row.decision='ACCEPTED';row.reviewer=reviewer;row.reviewedAt=at;}
review.status='HUMAN_BROWSER_VISUAL_ACCEPTED';review.acceptedBy=reviewer;review.acceptedAt=at;writeJson(path,review);
const pre12=readJson('content/web/homepage/hpc2-pre/hpc2-pre-browser-visual-acceptance-v1.json');pre12.status='BROWSER_VISUAL_ACCEPTED';pre12.acceptedBy=reviewer;pre12.acceptedAt=at;pre12.deploymentUrl=deployment;writeJson('content/web/homepage/hpc2-pre/hpc2-pre-browser-visual-acceptance-v1.json',pre12);
await import('./refresh-status.mjs');
console.log(`✓ HPC2-PRE browser matrix 6/6 accepted by ${reviewer} for ${deployment}.`);
