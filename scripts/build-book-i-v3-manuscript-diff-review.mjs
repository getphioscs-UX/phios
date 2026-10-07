import fs from 'node:fs';
import path from 'node:path';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const v2=read('content/knowledge/manuscripts/extraction/book-1-full-section-inventory-v1.json');
const v3=read('content/knowledge/manuscripts/extraction/book-1-v3-full-section-inventory-v1.json');
const integrity=read('content/knowledge/manuscripts/extraction/book-1-v3-section-integrity-v1.json');
const impacts=read('content/knowledge/reconciliation/book-1-v3-canonical-impact-candidates-v1.json');

if(v3.status!=='EXTRACTED_INTEGRITY_VERIFIED_HUMAN_REVIEW_PENDING') throw new Error('BOOK_I_V3_INVENTORY_NOT_READY');
if(integrity.status!=='INTEGRITY_VERIFIED_HUMAN_REVIEW_PENDING') throw new Error('BOOK_I_V3_INTEGRITY_NOT_READY');

const oldSections=v2.sections.filter(x=>x.segmentType!=='FRONT_MATTER');
const newSections=v3.sections.filter(x=>x.segmentType!=='FRONT_MATTER');
const max=Math.max(oldSections.length,newSections.length);
const rows=[];
const summary={sameHeadingSameHash:0,sameHeadingChangedHash:0,renamedSamePosition:0,added:0,removed:0};
for(let i=0;i<max;i++){
 const a=oldSections[i]||null,b=newSections[i]||null;
 let state;
 if(!a){state='ADDED';summary.added++;}
 else if(!b){state='REMOVED';summary.removed++;}
 else if(a.heading===b.heading && a.textSha256===b.textSha256){state='UNCHANGED';summary.sameHeadingSameHash++;}
 else if(a.heading===b.heading){state='CONTENT_CHANGED';summary.sameHeadingChangedHash++;}
 else {state='HEADING_CHANGED';summary.renamedSamePosition++;}
 rows.push({
   index:i+1,
   partCode:b?.partCode??a?.partCode??null,
   oldSectionCode:a?.sectionCode??null,
   newSectionCode:b?.sectionCode??null,
   oldHeading:a?.heading??null,
   newHeading:b?.heading??null,
   oldHash:a?.textSha256??null,
   newHash:b?.textSha256??null,
   oldPages:a?[a.startPage,a.endPage]:null,
   newPages:b?[b.startPage,b.endPage]:null,
   state
 });
}
const changed=rows.filter(r=>r.state!=='UNCHANGED');
const report={
 schemaVersion:'PHI-OS-BOOK-I-V3-MANUSCRIPT-DIFF-REVIEW-v1.0.0',
 status:'READY_FOR_HUMAN_REVIEW',
 bookCode:'BOOK-1',
 sourceV2:{sha256:v2.sourceSha256,pageCount:402,sectionSegments:oldSections.length},
 sourceV3:{sha256:v3.sourceSha256,pageCount:v3.sourcePageCount,sectionSegments:newSections.length},
 counts:{...summary,totalCompared:rows.length,changed:changed.length,unchanged:rows.length-changed.length},
 partCountsV2:v2.partCounts,
 partCountsV3:v3.partCounts,
 canonicalImpactCandidates:impacts.likelyNewCanonicalCandidates,
 rows
};
fs.mkdirSync('content/knowledge/manuscripts/reconciliation',{recursive:true});
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('content/knowledge/manuscripts/reconciliation/book-1-v3-manuscript-diff-review-v1.json',JSON.stringify(report,null,2)+'\n');

const tableRows=changed.map(r=>`<tr>
<td>${r.index}</td><td>${esc(r.partCode)}</td><td><strong>${esc(r.state)}</strong></td>
<td>${esc(r.oldHeading)}</td><td>${esc(r.newHeading)}</td>
<td>${esc(r.oldPages?.join('–')||'—')}</td><td>${esc(r.newPages?.join('–')||'—')}</td>
</tr>`).join('');
const impactCards=(impacts.likelyNewCanonicalCandidates||[]).map(c=>`
<section class="card"><h3>${esc(c.candidateId)}</h3><h4>${esc(c.titleCandidate)}</h4>
<p><b>Source themes:</b> ${esc((c.sourceThemes||[]).join(' · '))}</p>
<p>${esc(c.rationale)}</p></section>`).join('');

const html=`<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8">
<title>Book I v3 Manuscript Diff Human Review</title>
<style>
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;background:#0f1115;color:#eceff4}
main{max-width:1500px;margin:auto;padding:36px}
h1,h2{letter-spacing:.02em}.meta,.card{background:#171b22;border:1px solid #303743;border-radius:12px;padding:18px;margin:16px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.metric{background:#202631;padding:14px;border-radius:10px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{border-bottom:1px solid #303743;padding:10px;text-align:left;vertical-align:top}
th{position:sticky;top:0;background:#171b22}.warn{color:#ffd166}.ok{color:#8bd49c}
code{word-break:break-all} .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}
</style></head><body><main>
<h1>Book I v3 · Manuscript Diff Human Review</h1>
<div class="meta">
<p><b>v2:</b> 402 pages · 274 sections · <code>${esc(v2.sourceSha256)}</code></p>
<p><b>v3:</b> ${v3.sourcePageCount} pages · ${newSections.length} sections · <code>${esc(v3.sourceSha256)}</code></p>
<p class="warn">此页面只做 manuscript 差异与 canonical impact 人审；不会自动建立、改名或删除 canonical nodes，也不会自动 production cutover。</p>
</div>
<div class="grid">
<div class="metric"><b>Changed</b><br>${changed.length}</div>
<div class="metric"><b>Content changed</b><br>${summary.sameHeadingChangedHash}</div>
<div class="metric"><b>Heading changed</b><br>${summary.renamedSamePosition}</div>
<div class="metric"><b>Added</b><br>${summary.added}</div>
<div class="metric"><b>Removed</b><br>${summary.removed}</div>
<div class="metric"><b>Unchanged</b><br>${summary.sameHeadingSameHash}</div>
</div>
<h2>Changed manuscript sections</h2>
<table><thead><tr><th>#</th><th>Part</th><th>State</th><th>v2 heading</th><th>v3 heading</th><th>v2 pages</th><th>v3 pages</th></tr></thead>
<tbody>${tableRows}</tbody></table>
<h2>Canonical impact candidates</h2>
<div class="cards">${impactCards}</div>
<div class="meta"><h2>Human decision boundary</h2>
<p>ACCEPT only means this diff is an accurate basis for canonical reconciliation. It does not itself modify nodes.</p>
<p>Review focus: title identity, semantic boundary, Method vs Reality separation, RIS, initialization continuity, path dependence, and current-runtime authority.</p>
</div>
</main></body></html>`;
fs.writeFileSync('tools/review/BOOK-I-V3-MANUSCRIPT-DIFF-HUMAN-REVIEW.html',html);
console.log(JSON.stringify({
 status:'READY_FOR_HUMAN_REVIEW',
 outputJson:'content/knowledge/manuscripts/reconciliation/book-1-v3-manuscript-diff-review-v1.json',
 outputHtml:'tools/review/BOOK-I-V3-MANUSCRIPT-DIFF-HUMAN-REVIEW.html',
 counts:report.counts,
 canonicalNodesModified:false,
 productionCutover:false
},null,2));
