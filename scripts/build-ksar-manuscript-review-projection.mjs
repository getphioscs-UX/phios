import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stable = value => JSON.stringify(value, null, 2) + '\n';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function resolveCorpus(root, relative) {
  const candidates = [
    path.join(root, relative),
    path.join(root, relative.replace(/^books[\\/]/, ''))
  ];
  const found = candidates.find(fs.existsSync);
  if (!found) throw new Error(`Missing private retrieval corpus: ${relative}`);
  return found;
}

function classify(record) {
  const text = String(record.text || '');
  const heading = String(record.heading || '');
  const length = Math.max(1, text.length);
  const replacementCharacters = [...text].filter(char => char === '\uFFFD').length;
  const controlCharacters = [...text].filter(char => char.charCodeAt(0) < 32 && !['\n', '\r', '\t', '\f'].includes(char)).length;
  const unusualCharacters = [...text].filter(char => {
    if (/\s/u.test(char)) return false;
    if (/[\p{L}\p{N}]/u.test(char)) return false;
    return !'，。！？；：、“”‘’（）()【】《》—…·,.!?;:-_/|+%◈→↓↑←=<>~@#$^&*[]{}\\'.includes(char);
  }).length;
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const tinyLineRatio = lines.length ? lines.filter(line => line.length <= 2).length / lines.length : 0;
  const unusualSymbolRatio = unusualCharacters / length;
  const figureLikely = /(figure|diagram|illustration|结构图|流程图|示意图|图\s*\d|表\s*\d)/i.test(`${heading}\n${text.slice(0, 600)}`);
  const findingCodes = [];
  let riskLevel = 'LOW';

  if (replacementCharacters > 0) findingCodes.push('REPLACEMENT_CHARACTER');
  if (controlCharacters > 0) findingCodes.push('CONTROL_CHARACTER');
  if (unusualSymbolRatio > 0.12) findingCodes.push('HIGH_UNUSUAL_SYMBOL_RATIO');
  if (replacementCharacters > 0 || controlCharacters > 0 || unusualSymbolRatio > 0.12) riskLevel = 'HIGH';

  if (riskLevel !== 'HIGH') {
    if (figureLikely && text.length < 1200) findingCodes.push('FIGURE_OR_DIAGRAM_TEXT_LIKELY');
    if (tinyLineRatio > 0.45 && lines.length >= 8) findingCodes.push('FRAGMENTED_LAYOUT_TEXT');
    if (text.length < 80 && record.segmentType !== 'FRONT_MATTER') findingCodes.push('VERY_SHORT_EXTRACTED_TEXT');
    if (record.segmentType === 'FRONT_MATTER') findingCodes.push('FRONT_MATTER_LAYOUT');
    if (findingCodes.length) riskLevel = 'MEDIUM';
  }

  return {
    riskLevel,
    runtimeEligibility: riskLevel === 'HIGH'
      ? 'EXCLUDE_UNTIL_REVIEW'
      : riskLevel === 'MEDIUM'
        ? 'SOURCE_ONLY_WITH_CAUTION'
        : 'ELIGIBLE_UNREVIEWED',
    findingCodes,
    metrics: {
      charCount: text.length,
      lineCount: lines.length,
      tinyLineRatio: Number(tinyLineRatio.toFixed(4)),
      unusualSymbolRatio: Number(unusualSymbolRatio.toFixed(4)),
      figureLikely
    }
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const corpusRoot = path.resolve(arg('--corpus-dir', process.env.KSAR_PRIVATE_CORPUS_DIR || ''));
if (!corpusRoot || corpusRoot === ROOT) throw new Error('Provide --corpus-dir or KSAR_PRIVATE_CORPUS_DIR for the private retrieval corpora.');
const outputDir = path.resolve(arg('--out', path.join(ROOT, 'dist/ksar-manuscript-review')));
const registryOut = path.resolve(arg('--registry-out', path.join(ROOT, 'content/knowledge/source-access/registries/manuscript-readability-review-v1.json')));

const sources = [
  { bookCode: 'BOOK-1', title: '世界如何形成', relative: 'books/book-1/materialized/v2/retrieval-corpus.json' },
  { bookCode: 'BOOK-2', title: '世界如何运行', relative: 'books/book-2/materialized/v1/retrieval-corpus.json' }
];

const reviewRecords = [];
const privateRecords = [];
for (const source of sources) {
  const file = resolveCorpus(corpusRoot, source.relative);
  const corpus = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const record of corpus.records || []) {
    const quality = classify(record);
    reviewRecords.push({
      sectionCode: record.sectionCode,
      bookCode: source.bookCode,
      partCode: record.partCode,
      heading: record.heading,
      pageRange: { start: record.startPage, end: record.endPage },
      sourceDigest: record.textSha256,
      reviewStatus: 'PENDING_HUMAN_READABILITY_REVIEW',
      ...quality
    });
    privateRecords.push({ ...record, bookCode: source.bookCode, bookTitle: source.title, quality });
  }
}

const counts = reviewRecords.reduce((acc, record) => {
  acc[record.riskLevel] = (acc[record.riskLevel] || 0) + 1;
  return acc;
}, {});
const registry = {
  schemaVersion: 'PHI-OS-MANUSCRIPT-READABILITY-REVIEW-v1.0.0',
  stage: 'KSAR-R2-R3',
  status: 'AUTOMATED_TRIAGE_COMPLETE_HUMAN_REVIEW_PENDING',
  authorityBoundary: {
    automatedRiskIsNotHumanReadabilityApproval: true,
    sourceIntegrityIsNotReadabilityIntegrity: true,
    noCanonicalAuthorityCreated: true,
    fullManuscriptBodyStoredInPublicRegistry: false
  },
  recordCount: reviewRecords.length,
  riskCounts: counts,
  records: reviewRecords
};
fs.mkdirSync(path.dirname(registryOut), { recursive: true });
fs.writeFileSync(registryOut, stable(registry), 'utf8');

fs.mkdirSync(outputDir, { recursive: true });
const embedded = JSON.stringify(privateRecords).replaceAll('</script', '<\\/script');
const html = `<!doctype html>
<html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PHI OS Manuscript Readability Review</title>
<style>
:root{font-family:Inter,system-ui,sans-serif;color:#171717;background:#f5f3ef}body{margin:0}.shell{max-width:1180px;margin:auto;padding:28px}.hero,.toolbar,.card{background:#fff;border:1px solid #ddd8cf;border-radius:16px}.hero{padding:24px;margin-bottom:16px}.toolbar{padding:14px;display:grid;grid-template-columns:1.4fr repeat(3,1fr) auto;gap:10px;position:sticky;top:8px;z-index:5}.toolbar input,.toolbar select,.review select,.review textarea{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cfc9bf;border-radius:9px;background:#fff}.summary{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.pill{background:#ece8e0;border-radius:999px;padding:6px 10px}.card{padding:18px;margin:14px 0}.meta{font-size:13px;color:#666}.risk-HIGH{border-left:6px solid #333}.risk-MEDIUM{border-left:6px solid #888}.risk-LOW{border-left:6px solid #ccc}.source{white-space:pre-wrap;line-height:1.65;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#f8f7f4;padding:14px;border-radius:10px;max-height:420px;overflow:auto}.review{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-top:12px}.review textarea{min-height:100px;grid-column:1/-1}.hidden{display:none}@media(max-width:800px){.toolbar,.review{grid-template-columns:1fr}.review textarea{grid-column:auto}}</style></head>
<body><main class="shell"><section class="hero"><h1>PHI OS Manuscript Readability Review</h1><p>此页面只用于人工 readability review。自动 LOW/MEDIUM/HIGH 只是 triage，不是 Canonical 或 publication authority。Figure / layout / garble 可在这里标记；最终 decisions 可导出 JSON。</p><div class="summary" id="summary"></div></section>
<section class="toolbar"><input id="search" placeholder="Search section / heading / text"><select id="book"><option value="">All books</option><option>BOOK-1</option><option>BOOK-2</option></select><select id="risk"><option value="">All risk</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select><select id="part"><option value="">All parts</option></select><button id="export">Export decisions</button></section><div id="records"></div></main>
<script>const DATA=${embedded};
const decisions=JSON.parse(localStorage.getItem('phios-ksar-review-decisions')||'{}');
const els={records:document.querySelector('#records'),search:document.querySelector('#search'),book:document.querySelector('#book'),risk:document.querySelector('#risk'),part:document.querySelector('#part'),summary:document.querySelector('#summary')};
const options=['PENDING','APPROVE_TEXT','APPROVE_WITH_FIGURE_EXCLUSION','CORRECT_TEXT','REEXTRACT','REPLACE_FROM_SOURCE','IGNORE_DECORATIVE_TEXT','SOURCE_PDF_FIX_REQUIRED'];
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function save(){localStorage.setItem('phios-ksar-review-decisions',JSON.stringify(decisions))}
function rebuildParts(){const values=[...new Set(DATA.filter(r=>!els.book.value||r.bookCode===els.book.value).map(r=>r.partCode))].sort();const old=els.part.value;els.part.innerHTML='<option value="">All parts</option>'+values.map(v=>'<option>'+esc(v)+'</option>').join('');if(values.includes(old))els.part.value=old}
function render(){const q=els.search.value.trim().toLowerCase();const visible=DATA.filter(r=>(!els.book.value||r.bookCode===els.book.value)&&(!els.risk.value||r.quality.riskLevel===els.risk.value)&&(!els.part.value||r.partCode===els.part.value)&&(!q||[r.sectionCode,r.heading,r.text].join(' ').toLowerCase().includes(q)));const approved=Object.values(decisions).filter(d=>d.decision&&d.decision!=='PENDING').length;els.summary.innerHTML='<span class="pill">448 sections</span><span class="pill">Visible '+visible.length+'</span><span class="pill">Decided '+approved+'</span><span class="pill">Source page images: not embedded in retrieval corpus</span>';els.records.innerHTML=visible.map(r=>{const d=decisions[r.sectionCode]||{};return '<article class="card risk-'+r.quality.riskLevel+'"><div class="meta">'+esc(r.bookCode)+' · '+esc(r.partCode)+' · pp. '+r.startPage+'–'+r.endPage+' · '+esc(r.sectionCode)+'</div><h2>'+esc(r.heading)+'</h2><p class="meta">Risk '+r.quality.riskLevel+' · '+esc(r.quality.findingCodes.join(', ')||'no automated finding')+'</p><details><summary>Extracted manuscript text</summary><div class="source">'+esc(r.text)+'</div></details><div class="review"><select data-decision="'+esc(r.sectionCode)+'">'+options.map(o=>'<option '+((d.decision||'PENDING')===o?'selected':'')+'>'+o+'</option>').join('')+'</select><input data-note="'+esc(r.sectionCode)+'" value="'+esc(d.note||'')+'" placeholder="Review note"><textarea data-text="'+esc(r.sectionCode)+'" placeholder="Optional corrected/approved text. Required when using CORRECT_TEXT or APPROVE_WITH_FIGURE_EXCLUSION.">'+esc(d.reviewedText||'')+'</textarea></div></article>'}).join('');document.querySelectorAll('[data-decision]').forEach(x=>x.onchange=e=>{const k=e.target.dataset.decision;decisions[k]={...(decisions[k]||{}),decision:e.target.value};save()});document.querySelectorAll('[data-note]').forEach(x=>x.oninput=e=>{const k=e.target.dataset.note;decisions[k]={...(decisions[k]||{}),note:e.target.value};save()});document.querySelectorAll('[data-text]').forEach(x=>x.oninput=e=>{const k=e.target.dataset.text;decisions[k]={...(decisions[k]||{}),reviewedText:e.target.value};save()})}
['input','change'].forEach(evt=>els.search.addEventListener(evt,render));els.book.onchange=()=>{rebuildParts();render()};els.risk.onchange=render;els.part.onchange=render;document.querySelector('#export').onclick=()=>{const records=DATA.map(r=>({sectionCode:r.sectionCode,bookCode:r.bookCode,partCode:r.partCode,pageRange:{start:r.startPage,end:r.endPage},sourceDigest:r.textSha256,decision:decisions[r.sectionCode]?.decision||'PENDING',note:decisions[r.sectionCode]?.note||'',reviewedText:decisions[r.sectionCode]?.reviewedText||null}));const payload={schemaVersion:'PHI-OS-KSAR-MANUSCRIPT-READABILITY-DECISIONS-v1.0.0',stage:'KSAR-R2-R4',recordCount:records.length,records};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\\n'],{type:'application/json'}));a.download='ksar-manuscript-readability-decisions-v1.json';a.click();URL.revokeObjectURL(a.href)};rebuildParts();render();</script></body></html>`;
fs.writeFileSync(path.join(outputDir, 'review-index.html'), html, 'utf8');
fs.writeFileSync(path.join(outputDir, 'review-projection-manifest.json'), stable({
  schemaVersion: 'PHI-OS-KSAR-MANUSCRIPT-REVIEW-PROJECTION-MANIFEST-v1.0.0',
  stage: 'KSAR-R2-R3',
  status: 'HUMAN_REVIEW_READY',
  recordCount: privateRecords.length,
  publicRegistry: path.relative(ROOT, registryOut).replaceAll('\\', '/'),
  html: 'review-index.html',
  sourcePageImagesEmbedded: false,
  note: 'Retrieval corpus contains extracted text and page ranges but not rendered PDF page images. Use the original private PDF when a figure/layout finding requires visual confirmation.'
}), 'utf8');
console.log(`✓ KSAR manuscript review projection built: ${privateRecords.length} records.`);
console.log(`  Registry: ${registryOut}`);
console.log(`  Review UI: ${path.join(outputDir, 'review-index.html')}`);
