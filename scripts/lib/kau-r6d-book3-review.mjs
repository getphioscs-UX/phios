import { createHash } from 'node:crypto';

export const DECISIONS = [
  'PENDING',
  'APPROVE_TEXT',
  'APPROVE_WITH_FIGURE_EXCLUSION',
  'CORRECT_TEXT',
  'REEXTRACT',
  'REPLACE_FROM_SOURCE',
  'IGNORE_DECORATIVE_TEXT',
  'SOURCE_PDF_FIX_REQUIRED'
];

export const sha256 = value => createHash('sha256').update(value).digest('hex');

export function classify(record) {
  const text = String(record.text ?? '');
  const heading = String(record.heading ?? '');
  const characters = [...text];
  const length = Math.max(1, characters.length);
  const replacementCharacters = characters.filter(char => char === '\uFFFD').length;
  const controlCharacters = characters.filter(char => char.charCodeAt(0) < 32 && !['\n', '\r', '\t'].includes(char)).length;
  const unusualCharacters = characters.filter(char => {
    if (/\s/u.test(char) || /[\p{L}\p{N}]/u.test(char)) return false;
    return !'，。！？；：、“”‘’（）()【】《》—…·,.!?;:-_/|+%◈✦→↓↑←=<>~@#$^&*[]{}\\'.includes(char);
  }).length;
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const tinyLineRatio = lines.length ? lines.filter(line => line.length <= 2).length / lines.length : 0;
  const unusualSymbolRatio = unusualCharacters / length;
  const figureLikely = /(figure|diagram|illustration|结构图|流程图|示意图|图\s*\d|表\s*\d)/i.test(`${heading}\n${text.slice(0, 600)}`);
  const findingCodes = [];

  if (replacementCharacters) findingCodes.push('REPLACEMENT_CHARACTER');
  if (controlCharacters) findingCodes.push('CONTROL_CHARACTER');
  if (unusualSymbolRatio > 0.12) findingCodes.push('HIGH_UNUSUAL_SYMBOL_RATIO');
  let riskLevel = findingCodes.length ? 'HIGH' : 'LOW';
  if (riskLevel !== 'HIGH') {
    if (figureLikely && text.length < 1200) findingCodes.push('FIGURE_OR_DIAGRAM_TEXT_LIKELY');
    if (tinyLineRatio > 0.45 && lines.length >= 8) findingCodes.push('FRAGMENTED_LAYOUT_TEXT');
    if (text.length < 80 && record.segmentType !== 'FRONT_MATTER') findingCodes.push('VERY_SHORT_EXTRACTED_TEXT');
    if (record.segmentType === 'FRONT_MATTER') findingCodes.push('FRONT_MATTER_LAYOUT');
    if (findingCodes.length) riskLevel = 'MEDIUM';
  }

  return {
    riskLevel,
    runtimeEligibility: riskLevel === 'HIGH' ? 'EXCLUDE_UNTIL_REVIEW' : riskLevel === 'MEDIUM' ? 'SOURCE_ONLY_WITH_CAUTION' : 'ELIGIBLE_UNREVIEWED',
    findingCodes,
    metrics: {
      charCount: characters.length,
      lineCount: lines.length,
      tinyLineRatio: Number(tinyLineRatio.toFixed(4)),
      unusualSymbolRatio: Number(unusualSymbolRatio.toFixed(4)),
      figureLikely
    }
  };
}

function fail(message) {
  throw new Error(`KAU-R6D integrity failure: ${message}`);
}

export function recordsFromCorpusText(corpusText, inventory, expectedCorpus = {}) {
  if (typeof corpusText !== 'string') fail('corpus text must be a string');
  const corpusCharacters = [...corpusText];
  if (Number.isInteger(expectedCorpus.charCount) && corpusCharacters.length !== expectedCorpus.charCount) {
    fail(`corpus character count ${corpusCharacters.length} != ${expectedCorpus.charCount}`);
  }
  if (expectedCorpus.sha256 && sha256(corpusText) !== expectedCorpus.sha256) fail('corpus SHA-256 mismatch');
  if (!Array.isArray(inventory.sections) || inventory.sections.length !== inventory.totalSegments) fail('invalid frozen section inventory');

  return inventory.sections.map((section, index) => {
    if (index === 0 && section.startOffset !== 0) fail('first segment does not start at zero');
    if (index > 0 && inventory.sections[index - 1].endOffset !== section.startOffset) fail(`gap or overlap before ${section.sectionCode}`);
    const text = corpusCharacters.slice(section.startOffset, section.endOffset).join('');
    if ([...text].length !== section.charCount) fail(`character count mismatch for ${section.sectionCode}`);
    if (sha256(text) !== section.textSha256) fail(`text SHA-256 mismatch for ${section.sectionCode}`);
    return {
      sectionCode: section.sectionCode,
      segmentType: section.segmentType,
      partCode: section.partCode,
      sequence: section.sequence,
      heading: section.heading,
      headingRaw: section.headingRaw,
      startPage: section.startPage,
      endPage: section.endPage,
      textSha256: section.textSha256,
      text,
      quality: classify({ ...section, text })
    };
  });
}

export function validateCorpusRecords(records, inventory) {
  if (!Array.isArray(records) || records.length !== inventory.totalSegments) fail(`record count ${records?.length ?? 'invalid'} != ${inventory.totalSegments}`);
  return records.map((record, index) => {
    const section = inventory.sections[index];
    for (const field of ['sectionCode', 'segmentType', 'partCode', 'startPage', 'endPage']) {
      if (record[field] !== section[field]) fail(`${field} mismatch at inventory index ${index}`);
    }
    if (typeof record.text !== 'string' || [...record.text].length !== section.charCount) fail(`text length mismatch for ${section.sectionCode}`);
    const digest = sha256(record.text);
    if (digest !== section.textSha256 || (record.textSha256 && record.textSha256 !== digest)) fail(`text SHA-256 mismatch for ${section.sectionCode}`);
    return { ...record, textSha256: digest, quality: classify(record) };
  });
}

function jsonForScript(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

export function buildReviewHtml(records, metadata) {
  const embedded = jsonForScript(records);
  const embeddedMetadata = jsonForScript(metadata);
  return `<!doctype html>
<html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KAU-R6D｜Book III Manuscript Readability Review</title>
<style>
:root{font-family:Inter,"Noto Sans SC",system-ui,sans-serif;color:#20201e;background:#f3f1ec;--line:#d9d5cc;--ink2:#68645e}*{box-sizing:border-box}body{margin:0}.shell{max-width:1240px;margin:auto;padding:28px}.hero,.toolbar,.card{background:#fff;border:1px solid var(--line);border-radius:16px}.hero{padding:24px;margin-bottom:16px}.hero h1{margin:0 0 10px;font-size:clamp(24px,4vw,38px)}.hero p{color:var(--ink2);max-width:900px}.toolbar{padding:14px;display:grid;grid-template-columns:1.5fr repeat(3,1fr) auto;gap:10px;position:sticky;top:8px;z-index:5;box-shadow:0 6px 24px #2221}.toolbar input,.toolbar select,.review select,.review input,.review textarea,button{width:100%;padding:10px;border:1px solid #c9c4ba;border-radius:9px;background:#fff;color:inherit}button{width:auto;cursor:pointer;background:#20201e;color:#fff}.summary{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.pill{background:#ece9e2;border-radius:999px;padding:6px 10px;font-size:13px}.card{padding:20px;margin:14px 0}.meta{font-size:13px;color:var(--ink2)}.risk-HIGH{border-left:6px solid #9e3228}.risk-MEDIUM{border-left:6px solid #c88b25}.risk-LOW{border-left:6px solid #77937b}.source{white-space:pre-wrap;line-height:1.8;font-family:"Noto Serif SC",serif;background:#f8f7f4;padding:18px;border-radius:10px;max-height:560px;overflow:auto}.review{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-top:14px}.review textarea{min-height:110px;grid-column:1/-1}.empty{text-align:center;padding:48px;color:var(--ink2)}@media(max-width:820px){.shell{padding:14px}.toolbar,.review{grid-template-columns:1fr;position:static}.review textarea{grid-column:auto}button{width:100%}}</style></head>
<body><main class="shell"><section class="hero"><h1>KAU-R6D｜Book III Manuscript Readability Review</h1><p>《世界如何维持》全文人工可读性审查。自动风险仅用于排序，不等于人工批准、Canonical authority 或发布许可。遇到图示或排版问题，请结合原 PDF 页码复核。</p><div class="summary" id="summary"></div></section>
<section class="toolbar"><input id="search" aria-label="搜索" placeholder="搜索 section / 标题 / 正文"><select id="part" aria-label="部"><option value="">全部部分</option></select><select id="risk" aria-label="风险"><option value="">全部风险</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select><select id="decision" aria-label="决定"><option value="">全部决定</option></select><button id="export">导出决定</button></section><div id="records"></div></main>
<script>const DATA=${embedded};const META=${embeddedMetadata};
const KEY='phios-kau-r6d-book3-readability-decisions-v1';const decisions=JSON.parse(localStorage.getItem(KEY)||'{}');const OPTIONS=${jsonForScript(DECISIONS)};
const els={records:document.querySelector('#records'),search:document.querySelector('#search'),part:document.querySelector('#part'),risk:document.querySelector('#risk'),decision:document.querySelector('#decision'),summary:document.querySelector('#summary')};
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function save(){localStorage.setItem(KEY,JSON.stringify(decisions))}function selected(value,current){return value===current?' selected':''}
function currentDecision(code){return decisions[code]?.decision||'PENDING'}
function render(){const q=els.search.value.trim().toLowerCase();const visible=DATA.filter(r=>(!els.part.value||r.partCode===els.part.value)&&(!els.risk.value||r.quality.riskLevel===els.risk.value)&&(!els.decision.value||currentDecision(r.sectionCode)===els.decision.value)&&(!q||[r.sectionCode,r.heading,r.headingRaw,r.text].join(' ').toLowerCase().includes(q)));const decided=DATA.filter(r=>currentDecision(r.sectionCode)!=='PENDING').length;const reviewedSections=DATA.filter(r=>r.segmentType==='SECTION'&&currentDecision(r.sectionCode)!=='PENDING').length;els.summary.innerHTML='<span class="pill">'+DATA.length+' 个完整片段</span><span class="pill">'+META.sectionSegments+' 个正文 section</span><span class="pill">当前显示 '+visible.length+'</span><span class="pill">已决定 '+decided+'</span><span class="pill">正文进度 '+reviewedSections+'/'+META.sectionSegments+'</span><span class="pill">PDF '+META.pageCount+' 页</span>';els.records.innerHTML=visible.length?visible.map(r=>{const d=decisions[r.sectionCode]||{};return '<article class="card risk-'+r.quality.riskLevel+'"><div class="meta">'+esc(r.partCode)+' · pp. '+r.startPage+'–'+r.endPage+' · '+esc(r.segmentType)+' · '+esc(r.sectionCode)+'</div><h2>'+esc(r.heading)+'</h2><p class="meta">自动风险 '+r.quality.riskLevel+' · '+esc(r.quality.findingCodes.join(', ')||'无自动发现')+' · SHA '+esc(r.textSha256.slice(0,12))+'…</p><details open><summary>提取正文</summary><div class="source">'+esc(r.text)+'</div></details><div class="review"><select aria-label="审查决定" data-decision="'+esc(r.sectionCode)+'">'+OPTIONS.map(o=>'<option'+selected(o,d.decision||'PENDING')+'>'+o+'</option>').join('')+'</select><input aria-label="审查备注" data-note="'+esc(r.sectionCode)+'" value="'+esc(d.note||'')+'" placeholder="审查备注"><textarea aria-label="修订文本" data-text="'+esc(r.sectionCode)+'" placeholder="可选修订文本；CORRECT_TEXT 或 APPROVE_WITH_FIGURE_EXCLUSION 时填写。">'+esc(d.reviewedText||'')+'</textarea></div></article>'}).join(''):'<div class="empty">没有符合当前筛选条件的片段。</div>';document.querySelectorAll('[data-decision]').forEach(x=>x.onchange=e=>{const k=e.target.dataset.decision;decisions[k]={...(decisions[k]||{}),decision:e.target.value};save();render()});document.querySelectorAll('[data-note]').forEach(x=>x.oninput=e=>{const k=e.target.dataset.note;decisions[k]={...(decisions[k]||{}),note:e.target.value};save()});document.querySelectorAll('[data-text]').forEach(x=>x.oninput=e=>{const k=e.target.dataset.text;decisions[k]={...(decisions[k]||{}),reviewedText:e.target.value};save()})}
els.part.innerHTML+=[...new Set(DATA.map(r=>r.partCode))].map(v=>'<option>'+esc(v)+'</option>').join('');els.decision.innerHTML+=OPTIONS.map(v=>'<option>'+v+'</option>').join('');els.search.oninput=render;els.part.onchange=render;els.risk.onchange=render;els.decision.onchange=render;document.querySelector('#export').onclick=()=>{const records=DATA.map(r=>({sectionCode:r.sectionCode,segmentType:r.segmentType,partCode:r.partCode,pageRange:{start:r.startPage,end:r.endPage},sourceDigest:r.textSha256,decision:currentDecision(r.sectionCode),note:decisions[r.sectionCode]?.note||'',reviewedText:decisions[r.sectionCode]?.reviewedText||null}));const payload={schemaVersion:'PHI-OS-KAU-R6D-BOOK3-READABILITY-DECISIONS-v1.0.0',stage:'KAU-R6D',sourceSha256:META.sourceSha256,corpusSha256:META.corpusSha256,recordCount:records.length,exportedAt:new Date().toISOString(),records};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kau-r6d-book3-readability-decisions-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};render();</script></body></html>`;
}
