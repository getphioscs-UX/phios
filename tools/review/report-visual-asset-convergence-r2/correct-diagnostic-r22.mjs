import fs from 'node:fs';
const d='tools/review/report-visual-asset-convergence-r2/recovery-r22/';
const p=d+'ASSET-DELIVERY-MATRIX.json',m=JSON.parse(fs.readFileSync(p));m.rows.find(r=>r.report==='BZR').httpBefore='WITHDRAWN_MALFORMED_DIAGNOSTIC_URL';fs.writeFileSync(p,JSON.stringify(m,null,2));
const review='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';let s=fs.readFileSync(review,'utf8');const start=s.indexOf('<!-- R22-SUCCESSOR-BEGIN -->'),end=s.indexOf('<!-- R22-SUCCESSOR-END -->',start);const part=s.slice(start,end).replace(/(<tr><td>BZR<\/td>[\s\S]*?<td>)404 → 200/, '$1旧诊断URL无效，撤回 → 200');s=s.slice(0,start)+part+s.slice(end);fs.writeFileSync(review,s);
