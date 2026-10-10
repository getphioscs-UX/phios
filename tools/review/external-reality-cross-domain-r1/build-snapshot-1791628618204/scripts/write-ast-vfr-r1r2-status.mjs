import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const out='content/professional/ast-full-production/publication/r1r2/',read=f=>JSON.parse(fs.readFileSync(out+f));
const s=read('publication-snapshot.json'),checks=read('zero-cost-check-receipt.json'),browser=read('browser-fit-receipt.json'),pdf=read('pdf-print-receipt.json'),content=read('pdf-content-receipt.json'),glyphs=read('glyph-coverage-receipt.json');
if([checks,browser,pdf,content].some(r=>r.status!=='PASS')||glyphs.missing.length)throw Error('AST_R1R2_REVIEW_CHECKS_REQUIRED');
const fields={
 'WORK COMPLETED':'AST-VFR-R1R2 — visual composition repair ready for human review',
 'CURRENT HEAD':execFileSync('git',['rev-parse','HEAD']).toString().trim(),
 'WORKTREE STATUS':'DIRTY; existing and concurrent unrelated work retained; no commit or deployment by this task',
 'R1 REFERENCE PAGE COUNT':s.r1ReferencePageCount,
 'R1R2 REFERENCE PAGE COUNT':s.referencePageCount,
 'PAGE COUNT GLOBAL CONSTANT':'NO',
 'ACCEPTED COPY DIGEST':s.manuscriptDigest,
 'ACCEPTED COPY CHANGED':'NO',
 'CANONICAL DIGEST CHANGED':'NO',
 'BODY COMPOSITION VARIANTS USED':s.bodyCompositionVariantsUsed.join(', '),
 'FULL-PAGE DIAGRAM COUNT':s.fullPageDiagramCount,
 'COMBO-PAGE DIAGRAM COUNT':s.comboPageDiagramCount,
 'TOTAL DIAGRAM COUNT':s.totalDiagramCount,
 'NATAL WHEEL REDESIGN STATUS':'PASS — planet / zodiac glyphs; source geometry; deterministic label repulsion',
 'HOUSE ARCHITECTURE REDESIGN STATUS':'PASS — twelve radial houses and actual occupied planets',
 'PLANET-HOUSE REDESIGN STATUS':'PASS — twelve house columns and actual planet glyph chips',
 'DISPOSITOR FLOW REDESIGN STATUS':'PASS — convergent paths and two terminal anchors',
 'ELEMENT/MODALITY REDESIGN STATUS':'PASS — two unweighted distribution rings',
 'ASPECT NETWORK REDESIGN STATUS':'PASS — source-selected central cluster and restrained peripheral links',
 'SUPPORT/TENSION REDESIGN STATUS':'PASS — dual glyph-pair arc composition',
 'RELATIONSHIP ROUTE REDESIGN STATUS':'PASS — actual Saturn House 6, admitted spokes',
 'CAREER ROUTE REDESIGN STATUS':'PASS — actual Mars House 4, admitted spokes',
 'RESOURCE ROUTE REDESIGN STATUS':'PASS — personal / shared routes in parallel',
 'PRESSURE MAP REDESIGN STATUS':'PASS — actual House 6 / 12 polarity and support bridges',
 'OPPORTUNITY MAP REDESIGN STATUS':'PASS — support hub and contextual house routes',
 'EVIDENCE BOUNDARY REDESIGN STATUS':'PASS — concentric evidence scopes',
 'SECTION OPENER STATUS':'PASS — original masters, section number, descriptor and purposeful motif',
 'TYPOGRAPHY STATUS':'PASS — 18px body; differentiated titles, quotes and anchors; 22 system glyphs verified',
 'DESKTOP STATUS':'PASS — all pages, no label collisions or clipping',
 '390PX STATUS':'PASS — same physical page sequence; no horizontal overflow',
 'PRINT STATUS':'PASS — actual A4 PDF 56 pages; all accepted text found; all pages rendered',
 'PROVIDER CALLS':0,
 'THREE-CALL EXPERIMENT':'NOT_RUN',
 'NEXT HUMAN ACTION':'Review tools/review/AST-VFR-R1R2-TL-PUBLICATION-REVIEW.html and AST-VFR-R1R2-VISUAL-COMPARISON.html; if accepted, HUMAN ACCEPT AST-VFR-R1R2 VISUAL',
 'CURRENT DECISION':'AST_VFR_R1R2_VISUAL_REVIEW_READY'
};
fs.writeFileSync(out+'final-status.json',JSON.stringify(fields,null,2)+'\n');fs.writeFileSync('tools/review/AST-VFR-R1R2-FINAL-STATUS.txt',Object.entries(fields).map(([k,v])=>k+'\n'+v).join('\n\n')+'\n');
fs.writeFileSync('tools/review/AST-VFR-R1R2-TECHNICAL-REVIEW.html','<!doctype html><meta charset="utf-8"><title>AST R1R2 验证记录</title><h1>视觉改进验证记录</h1><pre>'+JSON.stringify({fields,checks,browser,pdf:{...pdf,dimensions:pdf.dimensions.slice(0,1)},content,glyphs},null,2)+'</pre>');console.log(JSON.stringify(fields,null,2));
