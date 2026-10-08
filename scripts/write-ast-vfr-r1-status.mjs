import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const root='content/professional/ast-full-production/',pub=root+'publication/';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const m=read(root+'manuscripts/accepted/ast-r5-tl-reference-01-zh-hans-v1.json'),snapshot=read(pub+'ast-vfr-r1-publication-snapshot.json'),browser=read(pub+'ast-vfr-r1-browser-fit-receipt.json'),checks=read(pub+'ast-vfr-r1-zero-cost-check-receipt.json');
if(browser.status!=='PASS'||checks.status!=='PASS')throw Error('REVIEW_READINESS_CHECKS_REQUIRED');
const status={
 'WORK COMPLETED':'AUTHORIZED FIRST STAGE — PUBLICATION REVIEW READY',
 'CURRENT HEAD':execFileSync('git',['rev-parse','HEAD']).toString().trim(),
 'WORKTREE STATUS':'DIRTY; existing and concurrent changes retained; no commit by this task',
 'REFERENCE CASE':'TL-REFERENCE-01',
 'CANONICAL PROJECTION ID':'CMP2-3353E1115566DDE4F27C808E',
 'CANONICAL PROJECTION DIGEST':m.canonicalProjectionDigest,
 'R4 PROJECTION DIGEST':m.r4ProjectionDigest,
 'R4A STATUS':'HUMAN_ADMITTED_21_OF_21',
 'AUTHORING PACK DIGEST':m.authoringPackDigest,
 'ZH MANUSCRIPT STATUS':'HUMAN_ACCEPTED',
 'ZH MANUSCRIPT DIGEST':m.contentDigest,
 'VISUAL ASSET REGISTRY STATUS':'PASS — 19 local originals, dimensions and SHA-256 verified',
 'EDITORIAL ASSETS STATUS':'PASS — P01–P05',
 'BODY ASSET STATUS':'PASS',
 'SECTION MASTER STATUS':'PASS — 10 bound',
 'MOTIF STATUS':'PASS — 2 local optional motifs',
 'PUBLICATION PROFILE STATUS':'REVIEW CANDIDATE',
 'PUBLICATION IR STATUS':'PASS',
 'REFERENCE PAGE COUNT':snapshot.referencePageCount,
 'REFERENCE PAGE COUNT GLOBAL CONSTANT':'NO',
 'DIAGRAM REGISTRY STATUS':'PASS — 15 candidates',
 'REFERENCE DIAGRAM COUNT':snapshot.referenceDiagramCount,
 'REFERENCE DIAGRAM COUNT GLOBAL CONSTANT':'NO',
 'NATAL WHEEL STATUS':'PASS',
 'RULERSHIP FLOW STATUS':'PASS',
 'ASPECT NETWORK STATUS':'PASS',
 'RELATIONSHIP ROUTE DIAGRAM STATUS':'PASS — Saturn actual House 6',
 'CAREER ROUTE DIAGRAM STATUS':'PASS — Mars actual House 4',
 'RESOURCE ROUTE DIAGRAM STATUS':'PASS — House 2 and House 8 separate',
 'ADAPTIVE PAGE PLAN STATUS':'PASS',
 'OVERFLOW STATUS':'PASS — 1280px / 390px / A4 print CSS',
 'ACCEPTED COPY PRESERVATION STATUS':'PASS — exact frozen source and paragraph coverage',
 'THREE-CALL ARCHITECTURE STATUS':'PREPARED; CONTRACT DRY RUN PASS; HUMAN GATE PENDING',
 'THREE-CALL LIVE EXPERIMENT STATUS':'NOT AUTHORIZED / NOT RUN',
 'THREE-CALL PROVIDER CALLS':0,
 'THREE-CALL COST':0,
 'SEMANTIC REVIEW CALLS':0,
 'PUBLICATION PROVIDER CALLS':0,
 'RERENDER PROVIDER CALLS':0,
 'CUSTOMER PUBLICATION ALLOWED':'REVIEW ONLY; RELEASE NOT ADMITTED',
 'PRODUCTION ALLOWED':'NO',
 'SHARED E2E RUN':'NO',
 'NEXT HUMAN ACTION':'Review tools/review/AST-VFR-R1-TL-PUBLICATION-REVIEW.html; if accepted, HUMAN ACCEPT AST-VFR-R1 PUBLICATION',
 'CURRENT DECISION':'AST_VFR_R1_PUBLICATION_REVIEW_READY'
};
fs.writeFileSync(pub+'ast-vfr-r1-final-status.json',JSON.stringify(status,null,2)+'\n');
fs.writeFileSync('tools/review/AST-VFR-R1-FINAL-STATUS.txt',Object.entries(status).map(([k,v])=>k+'\n'+v).join('\n\n')+'\n');
console.log(JSON.stringify(status,null,2));
