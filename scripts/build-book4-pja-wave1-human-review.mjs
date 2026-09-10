import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const manifest = read('content/knowledge/production-planning/production/book4-wave1/manifest-v1.json');
const audit = read('content/knowledge/manuscripts/review/book4-a1-canonical-coverage-audit-v1.json');
const zh = manifest.records
  .filter(r => r.locale === 'zh-Hans')
  .sort((a,b) => a.candidateId.localeCompare(b.candidateId))
  .map(r => read(r.path));

const outIndex = process.argv.indexOf('--out');
const outDir = path.resolve(outIndex >= 0 && process.argv[outIndex + 1]
  ? process.argv[outIndex + 1]
  : path.join(root, 'dist/book4-pja-wave1-human-review'));
const manifestDigest = crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
const data = zh.map(a => ({
  candidateId:a.candidateId,
  title:a.article.title,
  summary:a.article.summary,
  sourceBindings:a.sourceBindings,
  blocks:a.blocks,
  status:a.status
}));
const reviewMeta = {
  schemaVersion:'PHI-OS-BOOK4-PJA-WAVE1-HUMAN-REVIEW-v1.0.0',
  baselineCommit:manifest.baselineCommit,
  sourceSha256:manifest.sourceSha256,
  manifestDigest,
  recordCount:data.length,
  masterPhase:'PHASE 15',
  formalAdmissionStatus:'BOOK-IV-A1_RECONCILIATION_REQUIRED'
};
const html = `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BOOK IV · PJA Wave 1 Article Review</title><style>
:root{font-family:Inter,system-ui,-apple-system,"Noto Sans SC",sans-serif;color:#1f241f;background:#eef1eb}*{box-sizing:border-box}body{margin:0}main{max-width:1100px;margin:auto;padding:42px 24px 90px}.hero,.card,.alert{background:#fff;border:1px solid #d1d8cc;border-radius:22px;box-shadow:0 10px 35px #1f35110c}.hero{padding:32px;margin-bottom:22px}.alert{padding:20px 24px;margin:18px 0;background:#fff9ec;border-color:#e2ca93}.card{padding:30px;margin:24px 0}.eyebrow{letter-spacing:.13em;font-size:12px;font-weight:800;color:#55704c}.source{font-size:13px;color:#5f695a;line-height:1.65}.summary{font-size:18px;line-height:1.7}.body{line-height:1.9}.key,.q{padding:14px 18px;border-left:4px solid #728f64;background:#f6f8f3;margin:18px 0}.controls{display:grid;grid-template-columns:180px 1fr;gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid #e0e5dc}select,textarea,button{font:inherit}select,textarea{width:100%;border:1px solid #c9d1c4;border-radius:10px;padding:10px;background:#fff}textarea{min-height:72px}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}button{border:0;border-radius:999px;padding:10px 16px;background:#263124;color:#fff;cursor:pointer}button.secondary{background:#e5eadf;color:#263124}.pill{display:inline-block;border:1px solid #d1d8cc;border-radius:999px;padding:6px 10px;margin:4px 6px 0 0;font-size:13px}.muted{color:#677164;font-size:14px;line-height:1.65}@media(max-width:700px){.controls{grid-template-columns:1fr}main{padding:20px 14px 60px}.hero,.card{padding:20px}}
</style></head><body><main><section class="hero"><div class="eyebrow">PHI OS · BOOK IV · PJA WAVE 1 · PRE-ADMISSION</div><h1>《世界如何扩展》Article 人工审阅</h1><p>本页审阅 8 篇中文 Article 候选。它们已绑定第四册最终 PDF 的具体章节与页码，但 <strong>BOOK-IV-A1 Canonical Coverage 尚未完成</strong>，因此即使 8/8 ACCEPT，也不会自动成为 A3 完成、不会加入 KIR、不会发布。</p><div id="summary"></div><div class="toolbar"><button id="acceptAll">全部 ACCEPT</button><button class="secondary" id="clearAll">清空决定</button><button id="export">导出 Article Decisions JSON</button></div></section>
<section class="alert"><strong>A1 需要处理的来源发现</strong><p>最终 PDF 共 127 个正文 section：P10 81、P11 46。机器审计发现 P10 中有 2 组重复章节标题/内容：成本递延（S048 / S050）与资源压缩（S049 / S051）。系统没有自动删除、合并或更改 manuscript；需在后续 Canonical Reconciliation 中由人决定。</p><p class="muted">现有 active canonical registry 的 P10/P11 候选记录数为 ${audit.candidateCanonicalRecordCensus.total}；最终 manuscript 仅 ${audit.exactHeadingMatchCount}/127 可按标题直接命中，其他必须语义/人工 reconciliation。</p></section>
<div id="records"></div></main><script>
const DATA=${JSON.stringify(data)}; const META=${JSON.stringify(reviewMeta)};
const KEY='phios-book4-pja-wave1-human-decisions-v1';
let decisions=JSON.parse(localStorage.getItem(KEY)||'{}');
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function save(){localStorage.setItem(KEY,JSON.stringify(decisions))}
function decision(id){return decisions[id]?.decision||'PENDING'}
function render(){
 const accepted=DATA.filter(a=>decision(a.candidateId)==='ACCEPT').length;
 const decided=DATA.filter(a=>decision(a.candidateId)!=='PENDING').length;
 document.querySelector('#summary').innerHTML='<span class="pill">8 篇中文 Article</span><span class="pill">已决定 '+decided+'/8</span><span class="pill">ACCEPT '+accepted+'/8</span><span class="pill">A1 pending</span><span class="pill">Publication closed</span>';
 document.querySelector('#records').innerHTML=DATA.map(a=>{
  const paras=a.blocks.filter(b=>b.type==='paragraph').map(b=>'<p>'+esc(b.text)+'</p>').join('');
  const key=a.blocks.find(b=>b.type==='key_judgment'); const q=a.blocks.find(b=>b.type==='reality_question');
  const src=a.sourceBindings.map(s=>esc(s.sourceSectionCode)+' · '+esc(s.sourceHeading)+' · PDF '+s.sourcePages[0]+'–'+s.sourcePages[1]+'页').join('<br>');
  return '<article class="card"><div class="eyebrow">'+esc(a.candidateId)+' · '+esc(a.status)+'</div><h2>'+esc(a.title)+'</h2><p class="summary">'+esc(a.summary)+'</p><div class="source"><strong>Source bindings</strong><br>'+src+'</div><div class="body">'+paras+'</div><div class="key"><strong>'+esc(key.label)+'</strong><div>'+esc(key.text)+'</div></div><div class="q"><strong>'+esc(q.label)+'</strong><div>'+esc(q.text)+'</div></div><div class="controls"><div><label>决定</label><select data-id="'+esc(a.candidateId)+'"><option>PENDING</option><option>ACCEPT</option><option>REVISE</option><option>REJECT</option></select></div><div><label>备注</label><textarea data-note="'+esc(a.candidateId)+'" placeholder="可选"></textarea></div></div></article>';
 }).join('');
 DATA.forEach(a=>{const s=document.querySelector('select[data-id="'+a.candidateId+'"]');const t=document.querySelector('textarea[data-note="'+a.candidateId+'"]');s.value=decision(a.candidateId);t.value=decisions[a.candidateId]?.note||'';s.onchange=()=>{decisions[a.candidateId]={...(decisions[a.candidateId]||{}),decision:s.value,note:t.value};save();render()};t.oninput=()=>{decisions[a.candidateId]={...(decisions[a.candidateId]||{}),decision:s.value,note:t.value};save()}})
}
document.querySelector('#acceptAll').onclick=()=>{DATA.forEach(a=>decisions[a.candidateId]={decision:'ACCEPT',note:decisions[a.candidateId]?.note||''});save();render()};
document.querySelector('#clearAll').onclick=()=>{decisions={};save();render()};
document.querySelector('#export').onclick=()=>{const records=DATA.map(a=>({candidateId:a.candidateId,locale:'zh-Hans',decision:decision(a.candidateId),note:decisions[a.candidateId]?.note||''}));const payload={schemaVersion:'PHI-OS-BOOK4-PJA-WAVE1-HUMAN-DECISIONS-v1.0.0',stage:'BOOK4-PJA-WAVE1-PRE_ADMISSION',baselineCommit:META.baselineCommit,sourceSha256:META.sourceSha256,manifestDigest:META.manifestDigest,recordCount:records.length,exportedAt:new Date().toISOString(),records};const u=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\\n'],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='book4-pja-wave1-human-decisions-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
render();
</script></body></html>`;
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'BOOK4-PJA-WAVE1-HUMAN-REVIEW.html'),html,'utf8');
fs.writeFileSync(path.join(outDir,'book4-pja-wave1-review-metadata-v1.json'),JSON.stringify({...reviewMeta,status:'HUMAN_EDITORIAL_REVIEW_PENDING'},null,2)+'\n','utf8');
console.log(`✓ BOOK-4 PJA pre-admission Wave 1 human review built: ${data.length} zh-Hans article candidates.`);
console.log(`  ${path.join(outDir,'BOOK4-PJA-WAVE1-HUMAN-REVIEW.html')}`);
