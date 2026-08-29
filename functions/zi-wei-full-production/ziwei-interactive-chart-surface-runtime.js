import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';

export const ZIWEI_INTERACTIVE_CHART_SURFACE_SCHEMA='PHI-OS-ZIWEI-INTERACTIVE-CHART-SURFACE-v1.0.0';
export const ZIWEI_INTERACTIVE_CHART_SURFACE_VERSION='1.0.0';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];const uniq=v=>[...new Set(list(v).filter(Boolean))];
function fail(code){const e=new Error(code);e.code=code;throw e;}
const isZh=l=>l==='zh-Hans';
const t=(l,zh,en)=>isZh(l)?zh:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sentence=(text,l)=>{const s=String(text||'').trim();if(!s)return '';const m=isZh(l)?s.match(/^(.+?[。！？])/u):s.match(/^(.+?[.!?])/);return (m?.[1]||s).trim();};
const join=(xs,l)=>{xs=list(xs).filter(Boolean);if(!xs.length)return '';if(isZh(l))return xs.join('、');if(xs.length===1)return xs[0];if(xs.length===2)return `${xs[0]} and ${xs[1]}`;return `${xs.slice(0,-1).join(', ')}, and ${xs.at(-1)}`};

const BRANCH_GRID=Object.freeze([
  Object.freeze(['SI','WU','WEI','SHEN']),
  Object.freeze(['CHEN','CENTER','CENTER','YOU']),
  Object.freeze(['MAO','CENTER','CENTER','XU']),
  Object.freeze(['YIN','CHOU','ZI','HAI'])
]);
const BRANCH_POSITION=Object.freeze(BRANCH_GRID.flatMap((row,rowIndex)=>row.map((branch,colIndex)=>({branch,row:rowIndex+1,col:colIndex+1}))).reduce((acc,item)=>{acc[item.branch]=Object.freeze({row:item.row,col:item.col});return acc;},{}));

function bySection(report,code){return list(report?.sections).find(x=>x.sectionCode===code)||null;}
function labelOfFocusTag(tag,l){return ({LIFE_PALACE:t(l,'命','Life'),BODY_PALACE:t(l,'身','Body'),DA_XIAN_FOCUS:t(l,'大限','Da Xian'),LIU_NIAN_FOCUS:t(l,'流年','Liu Nian'),STRUCTURAL_FOCUS:t(l,'重点','Focus'),OPEN_BOUNDARY:t(l,'空白','Open boundary'),EMPTY_MAIN_STAR:t(l,'空宫','Empty main-star palace')})[tag]||tag;}

function deriveContext(report){
  const foundation=bySection(report,'FOUNDATION')?.items?.[0];
  const timing=list(bySection(report,'TIMING')?.items);
  const da=timing.find(x=>x.kind==='DA_XIAN')||null;
  const ly=timing.find(x=>x.kind==='LIU_NIAN')||null;
  return freeze({
    lifePalaceCode:foundation?.lifePalace?.palaceCode||null,
    bodyPalaceCode:foundation?.bodyPalace?.palaceCode||null,
    daXianPalaceCode:da?.focus?.natalDomainCode||null,
    liuNianPalaceCode:ly?.focus?.natalDomainCode||null,
    daXianLabel:da?.focus?.natalDomainLabel||null,
    liuNianLabel:ly?.focus?.natalDomainLabel||null,
    liuNianYear:ly?.focus?.lunarYear||null,
    structuralFocusPalaceCodes:uniq(report?.summary?.structuralFocusPalaceCodes),
    technicalDefaultDisplay:report?.technicalEvidence?.defaultDisplay||'COLLAPSED'
  });
}

function focusTagsForPalace(block,ctx){
  const tags=[];
  if(block?.palaceCode===ctx.lifePalaceCode||block?.isLifePalace)tags.push('LIFE_PALACE');
  if(block?.palaceCode===ctx.bodyPalaceCode||block?.isBodyPalace)tags.push('BODY_PALACE');
  if(block?.palaceCode===ctx.daXianPalaceCode)tags.push('DA_XIAN_FOCUS');
  if(block?.palaceCode===ctx.liuNianPalaceCode)tags.push('LIU_NIAN_FOCUS');
  if(list(ctx.structuralFocusPalaceCodes).includes(block?.palaceCode)&&!tags.includes('STRUCTURAL_FOCUS'))tags.push('STRUCTURAL_FOCUS');
  if(block?.openBoundary)tags.push('OPEN_BOUNDARY');
  if(block?.networkContext?.emptyMainStarPalace===true)tags.push('EMPTY_MAIN_STAR');
  return tags;
}

function teaserOf(block,l){
  const first=sentence(block?.paragraphs?.[0],l);
  const second=block?.networkContext?.summary||block?.openBoundary||'';
  return first||sentence(second,l)||'';
}

function buildPalaceCard(block,ctx,l){
  if(!block?.palaceCode||!block?.branch)fail('ZIWEI_FP_W19_PALACE_BLOCK_MISSING_COORDINATE');
  const position=BRANCH_POSITION[block.branch];if(!position)fail(`ZIWEI_FP_W19_UNKNOWN_BRANCH_LAYOUT:${block.branch}`);
  const focusTags=focusTagsForPalace(block,ctx);
  const starNames=list(block.starSummary).map(x=>`${x.label}${x.stateLabel?`（${x.stateLabel}）`:''}`);
  const txNames=list(block.transformationSummary).map(x=>`${x.label}${x.targetStarLabel?`→${x.targetStarLabel}`:''}`);
  const overlayLinks=[];
  if(list(block.networkContext?.triadPalaces).length)overlayLinks.push(t(l,`三方：${join(block.networkContext.triadPalaces,l)}`,`Triads: ${join(block.networkContext.triadPalaces,l)}`));
  if(block.networkContext?.oppositePalace)overlayLinks.push(t(l,`对宫：${block.networkContext.oppositePalace}`,`Opposite: ${block.networkContext.oppositePalace}`));
  if(list(block.networkContext?.flankPalaces).length)overlayLinks.push(t(l,`夹宫：${join(block.networkContext.flankPalaces,l)}`,`Flanks: ${join(block.networkContext.flankPalaces,l)}`));
  return freeze({
    palaceCode:block.palaceCode,
    title:block.title,
    branch:block.branch,
    branchLabel:block.branchLabel,
    row:position.row,
    col:position.col,
    resolutionState:block.resolutionState,
    resolutionLabel:block.resolutionLabel,
    focusTags,
    focusLabels:focusTags.map(tag=>labelOfFocusTag(tag,l)),
    teaser:teaserOf(block,l),
    starNames,
    transformationNames:txNames,
    isLifePalace:block.isLifePalace===true,
    isBodyPalace:block.isBodyPalace===true,
    isStructuralFocus:block.isStructuralFocus===true,
    hasOpenBoundary:!!block.openBoundary,
    openBoundary:block.openBoundary||null,
    emptyMainStarPalace:block.networkContext?.emptyMainStarPalace===true,
    oppositeMainStarReference:list(block.networkContext?.oppositeMainStarReference).map(x=>x.label),
    inspector:{
      title:`${block.title} · ${block.branchLabel}`,
      paragraphs:list(block.paragraphs),
      networkSummary:block.networkContext?.summary||'',
      triadPalaces:list(block.networkContext?.triadPalaces),
      oppositePalace:block.networkContext?.oppositePalace||null,
      flankPalaces:list(block.networkContext?.flankPalaces),
      overlayLinks,
      stars:list(block.starSummary).map(x=>({label:x.label,stateLabel:x.stateLabel,standaloneMeaningAvailable:x.standaloneMeaningAvailable===true})),
      transformations:list(block.transformationSummary).map(x=>({label:x.label,targetStarLabel:x.targetStarLabel||null})),
      why:{
        defaultDisplay:'COLLAPSED',
        readingUnitRef:block.why?.readingUnitRef||null,
        evidenceCount:list(block.why?.evidenceRefs).length,
        meaningCount:list(block.why?.meaningRefs).length,
        counterEvidenceCount:list(block.why?.counterEvidenceRefs).length,
        unknownCount:list(block.why?.unknownRefs).length
      }
    }
  });
}

export function buildZiweiInteractiveChartSurface({customerReport,locale}={}){
  if(customerReport?.schemaVersion!=='PHI-OS-ZIWEI-CUSTOMER-REPORT-v1.0.0')fail('ZIWEI_FP_W19_REQUIRES_W18_CUSTOMER_REPORT');
  const snap=stableStringify(customerReport),l=locale||customerReport.locale;if(l!==customerReport.locale||!['zh-Hans','en'].includes(l))fail('ZIWEI_FP_W19_LOCALE_MUST_MATCH_W18_REPORT');
  const palaceSection=bySection(customerReport,'PALACES');if(!palaceSection||list(palaceSection.items).length!==12)fail('ZIWEI_FP_W19_REQUIRES_12_PALACE_W18_REPORT_BLOCKS');
  const ctx=deriveContext(customerReport);
  const palaces=list(palaceSection.items).map(block=>buildPalaceCard(block,ctx,l));
  if(new Set(palaces.map(x=>x.palaceCode)).size!==12)fail('ZIWEI_FP_W19_REQUIRES_UNIQUE_PALACE_CODES');
  const defaultSelectedPalaceCode=ctx.lifePalaceCode||customerReport.summary?.structuralFocusPalaceCodes?.[0]||palaces[0]?.palaceCode||null;
  const openBoundaryItems=list(bySection(customerReport,'OPEN_BOUNDARIES')?.items).map(x=>({starLabel:x.starLabel||null,affectedPalaceLabels:list(x.affectedPalaceLabels),customerCopy:x.customerCopy}));
  const centerPanel={
    title:t(l,'十二宫互动结构图','Interactive twelve-palace chart'),
    subtitle:customerReport.subtitle,
    boundary:customerReport.boundary,
    instructions:t(l,'点击任一宫位，只展开该宫唯一解释 owner。三方、对宫、夹宫与空宫参照只作为同一个宫位的语境，不再生成第二篇解释。','Select any palace to open its one owned explanation. Triads, opposite-palace, flank-palace and empty-palace references remain context for the same palace instead of becoming second essays.'),
    anchors:list(customerReport.readingFirst?.anchors).map(x=>({label:x.label,value:x.value})),
    legend:[
      {code:'LIFE_PALACE',label:labelOfFocusTag('LIFE_PALACE',l)},
      {code:'BODY_PALACE',label:labelOfFocusTag('BODY_PALACE',l)},
      {code:'DA_XIAN_FOCUS',label:labelOfFocusTag('DA_XIAN_FOCUS',l)},
      {code:'LIU_NIAN_FOCUS',label:labelOfFocusTag('LIU_NIAN_FOCUS',l)},
      {code:'OPEN_BOUNDARY',label:labelOfFocusTag('OPEN_BOUNDARY',l)},
      {code:'EMPTY_MAIN_STAR',label:labelOfFocusTag('EMPTY_MAIN_STAR',l)}
    ],
    timingSummary:list(bySection(customerReport,'TIMING')?.items).map(x=>({title:x.title,paragraph:sentence(x.paragraphs?.[0],l)}))
  };
  const tableFallbackRows=palaces.slice().sort((a,b)=>a.row-b.row||a.col-b.col).map(x=>({palace:x.title,branch:x.branchLabel,focus:join(x.focusLabels,l)||'—',stars:x.starNames.slice(0,4).join(isZh(l)?'、':', ')||'—',teaser:x.teaser||'—'}));
  const base={schemaVersion:ZIWEI_INTERACTIVE_CHART_SURFACE_SCHEMA,work:'ZIWEI-FP-W19',runtimeVersion:ZIWEI_INTERACTIVE_CHART_SURFACE_VERSION,locale:l,surface:'personal-runtime.html#ziwei-chart',source:{customerReportDigest:customerReport.reportDigest,readingDigest:customerReport.source?.readingDigest||null},layout:{type:'BRANCH_GRID_4X4',rows:4,cols:4,branchGrid:BRANCH_GRID.map(row=>row.map(cell=>cell==='CENTER'?cell:cell))},defaultSelectedPalaceCode,palaces,centerPanel,openBoundaries:{title:t(l,'仍保留的解释空白','Visible interpretation gaps'),count:openBoundaryItems.length,items:openBoundaryItems},tableFallbackRows,summary:{palaceCount:palaces.length,openBoundaryPalaceCount:palaces.filter(x=>x.hasOpenBoundary).length,openBoundaryCount:openBoundaryItems.length,emptyMainStarPalaceCount:palaces.filter(x=>x.emptyMainStarPalace).length,focusTaggedPalaceCount:palaces.filter(x=>x.focusTags.length).length,technicalEvidenceDefaultDisplay:ctx.technicalDefaultDisplay},boundaries:{consumesW18CustomerReportOnly:true,oneInspectorOwnerPerPalace:true,secondEssayCreated:false,newMeaningCreated:false,newFindingCreated:false,newTimingPredictionCreated:false,technicalEvidenceDefaultDisplayCollapsed:ctx.technicalDefaultDisplay==='COLLAPSED',customerCutoverAllowed:false,humanAcceptedCustomerSurface:false}};
  const surfaceDigest=sha256Stable(base);if(stableStringify(customerReport)!==snap)fail('ZIWEI_FP_W19_INPUT_MUTATION_FORBIDDEN');return freeze({...base,surfaceDigest});
}

export function renderZiweiInteractiveChartSurfaceHtml(surface){
  if(surface?.schemaVersion!==ZIWEI_INTERACTIVE_CHART_SURFACE_SCHEMA)fail('ZIWEI_FP_W19_HTML_REQUIRES_SURFACE_MODEL');
  const l=surface.locale;const defaultCode=surface.defaultSelectedPalaceCode;
  const palaceMap=new Map(surface.palaces.map(x=>[x.branch,x]));
  const legend=surface.centerPanel.legend.map(x=>`<li><span class="legend-chip legend-${esc(x.code)}">${esc(x.label)}</span></li>`).join('');
  const anchorHtml=surface.centerPanel.anchors.map(x=>`<li><span>${esc(x.label)}</span><strong>${esc(x.value)}</strong></li>`).join('');
  const timingHtml=surface.centerPanel.timingSummary.map(x=>`<li><strong>${esc(x.title)}</strong><span>${esc(x.paragraph)}</span></li>`).join('');
  const grid=BRANCH_GRID.map((row,rowIndex)=>row.map((cell,colIndex)=>{
    if(cell==='CENTER'){
      if(rowIndex===1&&colIndex===1){
        return `<section class="chart-center" style="grid-row:2 / span 2;grid-column:2 / span 2"><p class="eyebrow">ZIWEI-FP-W19</p><h1>${esc(surface.centerPanel.title)}</h1><p class="subtitle">${esc(surface.centerPanel.subtitle)}</p><p class="boundary">${esc(surface.centerPanel.boundary)}</p><p>${esc(surface.centerPanel.instructions)}</p><div class="meta-grid"><section><h2>${esc(t(l,'先看这几件事','Read first'))}</h2><ul>${anchorHtml}</ul></section><section><h2>${esc(t(l,'图例','Legend'))}</h2><ul class="legend">${legend}</ul></section><section><h2>${esc(t(l,'当前时间层','Current timing layers'))}</h2><ul>${timingHtml}</ul></section></div></section>`;
      }
      return '';
    }
    const palace=palaceMap.get(cell);if(!palace)return `<div class="chart-cell chart-cell--empty" style="grid-row:${rowIndex+1};grid-column:${colIndex+1}"><span>${esc(cell)}</span></div>`;
    const tags=palace.focusTags.map(tag=>`<span class="tag tag-${esc(tag)}">${esc(labelOfFocusTag(tag,l))}</span>`).join('');
    const stars=palace.starNames.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('');
    return `<button type="button" data-palace-button="${esc(palace.palaceCode)}" class="chart-cell${palace.palaceCode===defaultCode?' is-active':''}" style="grid-row:${rowIndex+1};grid-column:${colIndex+1}" aria-controls="panel-${esc(palace.palaceCode)}" aria-pressed="${palace.palaceCode===defaultCode?'true':'false'}"><span class="branch">${esc(palace.branchLabel)}</span><span class="palace">${esc(palace.title)}</span><span class="resolution">${esc(palace.resolutionLabel)}</span><span class="tags">${tags}</span><ul class="stars">${stars}</ul><p class="teaser">${esc(palace.teaser)}</p></button>`;
  }).join('')).join('');
  const panels=surface.palaces.map(p=>`<article id="panel-${esc(p.palaceCode)}" class="inspector-panel${p.palaceCode===defaultCode?' is-active':''}" data-palace-panel="${esc(p.palaceCode)}"><header><div><p class="eyebrow">${esc(p.branchLabel)}</p><h2>${esc(p.inspector.title)}</h2></div><div class="badge-stack">${p.focusLabels.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div></header><div class="panel-copy">${p.inspector.paragraphs.map(x=>`<p>${esc(x)}</p>`).join('')}</div><dl class="detail-list"><div><dt>${esc(t(l,'关系网络','Relationship context'))}</dt><dd>${esc(p.inspector.networkSummary||'—')}</dd></div><div><dt>${esc(t(l,'星曜','Stars'))}</dt><dd>${p.inspector.stars.length?`<ul>${p.inspector.stars.map(x=>`<li>${esc(`${x.label}${x.stateLabel?`（${x.stateLabel}）`:''}${x.standaloneMeaningAvailable?'':t(l,' · 未获准独立星意',' · standalone meaning not admitted')}`)}</li>`).join('')}</ul>`:'—'}</dd></div><div><dt>${esc(t(l,'四化','Transformations'))}</dt><dd>${p.inspector.transformations.length?`<ul>${p.inspector.transformations.map(x=>`<li>${esc(`${x.label}${x.targetStarLabel?` → ${x.targetStarLabel}`:''}`)}</li>`).join('')}</ul>`:'—'}</dd></div>${p.openBoundary?`<div><dt>${esc(t(l,'解释空白','Open boundary'))}</dt><dd>${esc(p.openBoundary)}</dd></div>`:''}</dl><details><summary>${esc(t(l,'为什么这里会出现这一段','Why this block appears'))}</summary><p>${esc(t(l,`本宫引用 ${p.inspector.why.evidenceCount} 条证据、${p.inspector.why.meaningCount} 条已准入意义，保留 ${p.inspector.why.unknownCount} 个未知与 ${p.inspector.why.counterEvidenceCount} 条 counter-evidence。`,`This palace cites ${p.inspector.why.evidenceCount} evidence items and ${p.inspector.why.meaningCount} admitted meanings, while preserving ${p.inspector.why.unknownCount} unknowns and ${p.inspector.why.counterEvidenceCount} counter-evidence items.`))}</p></details></article>`).join('');
  const gapItems=surface.openBoundaries.items.map(x=>`<li><strong>${esc(x.starLabel||t(l,'未具名结构','Unnamed structure'))}</strong><span>${esc(x.customerCopy)}</span></li>`).join('');
  const tableRows=surface.tableFallbackRows.map(x=>`<tr><th>${esc(x.palace)}</th><td>${esc(x.branch)}</td><td>${esc(x.focus)}</td><td>${esc(x.stars)}</td><td>${esc(x.teaser)}</td></tr>`).join('');
  return `<!doctype html><html lang="${esc(l)}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${esc(surface.centerPanel.title)}</title><style>
  :root{color-scheme:light dark;--bg:#0b1020;--panel:#141c31;--soft:#1d2842;--text:#edf2ff;--muted:#b5bfd6;--line:#2d3c61;--accent:#9bc2ff;--accent2:#d0b3ff;--success:#83d3b0;--warn:#f6d48d}
  *{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Noto Sans CJK SC,sans-serif;background:linear-gradient(180deg,#09101d,#10182a 32%,#0c1220);color:var(--text)}main{max-width:1500px;margin:0 auto;padding:24px}h1,h2,h3,p,ul,li,dl,dd,dt{margin:0}button{font:inherit} .eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)} .subtitle,.boundary{color:var(--muted)}
  .chart-wrap{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(360px,.95fr);gap:20px;align-items:start}.chart-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(150px,1fr));gap:12px}.chart-cell,.chart-center,.chart-cell--empty,.inspector-panel,.table-wrap,.open-boundary-panel{background:rgba(20,28,49,.92);border:1px solid var(--line);border-radius:20px;box-shadow:0 12px 40px rgba(0,0,0,.22)}
  .chart-cell{padding:14px;text-align:left;display:flex;flex-direction:column;gap:8px;cursor:pointer;color:var(--text)}.chart-cell.is-active{outline:2px solid var(--accent);transform:translateY(-1px)} .chart-cell .branch{font-size:12px;color:var(--accent)} .chart-cell .palace{font-size:20px;font-weight:700}.chart-cell .resolution,.chart-cell .teaser{font-size:13px;color:var(--muted)} .chart-cell ul{padding-left:18px;margin:0}.chart-cell .stars{font-size:12px;color:var(--text)} .chart-cell .tags,.badge-stack{display:flex;flex-wrap:wrap;gap:6px}.tag,.legend-chip{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;border:1px solid var(--line);background:#17223a;color:var(--muted);font-size:12px}.tag-LIFE_PALACE,.legend-LIFE_PALACE{border-color:var(--accent);color:var(--accent)} .tag-BODY_PALACE,.legend-BODY_PALACE{border-color:var(--accent2);color:var(--accent2)} .tag-DA_XIAN_FOCUS,.legend-DA_XIAN_FOCUS{border-color:var(--success);color:var(--success)} .tag-LIU_NIAN_FOCUS,.legend-LIU_NIAN_FOCUS{border-color:var(--warn);color:var(--warn)} .tag-OPEN_BOUNDARY,.legend-OPEN_BOUNDARY{border-color:#e8a6a6;color:#ffbdbd} .tag-EMPTY_MAIN_STAR,.legend-EMPTY_MAIN_STAR{border-color:#a4d8d8;color:#a4d8d8}
  .chart-center{padding:20px}.meta-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:18px}.meta-grid section{background:rgba(10,16,30,.45);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:14px}.meta-grid h2{font-size:15px;margin-bottom:8px}.meta-grid ul{padding-left:18px;display:grid;gap:8px}.meta-grid li{color:var(--muted)}.meta-grid li strong{display:block;color:var(--text)} .legend{padding-left:0;list-style:none;display:flex;flex-wrap:wrap;gap:8px}
  .inspector{display:grid;gap:16px}.inspector-panel{padding:18px;display:none}.inspector-panel.is-active{display:block}.inspector-panel header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.panel-copy{display:grid;gap:10px;margin-bottom:14px}.detail-list{display:grid;gap:10px}.detail-list div{background:rgba(10,16,30,.35);border-radius:14px;padding:12px;border:1px solid rgba(255,255,255,.04)}.detail-list dt{font-size:13px;color:var(--accent);margin-bottom:6px}.detail-list dd{margin:0;color:var(--muted)}.detail-list ul{padding-left:18px;display:grid;gap:6px}details{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}summary{cursor:pointer;color:var(--accent)}
  .open-boundary-panel,.table-wrap{padding:18px}.open-boundary-panel ul{padding-left:18px;display:grid;gap:10px}.open-boundary-panel li{display:grid;gap:4px;color:var(--muted)} table{width:100%;border-collapse:collapse} th,td{padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);vertical-align:top} th{color:var(--text)} td{color:var(--muted)}
  @media (max-width:1120px){.chart-wrap{grid-template-columns:1fr}.meta-grid{grid-template-columns:1fr 1fr 1fr}}@media (max-width:820px){main{padding:14px}.chart-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none}.chart-center{grid-column:1 / -1 !important;grid-row:auto !important}.chart-cell{min-height:220px}.meta-grid{grid-template-columns:1fr}.inspector-panel header{flex-direction:column}.chart-cell{grid-row:auto !important;grid-column:auto !important}}
  </style></head><body><main><div class="chart-wrap"><section><div class="chart-grid">${grid}</div><section class="open-boundary-panel"><h2>${esc(surface.openBoundaries.title)} · ${surface.openBoundaries.count}</h2><p class="boundary" style="margin:8px 0 14px">${esc(t(l,'这些项目已经进入结构计算，但还没有被 W11 独立星义准入。图面会保留这个空白，而不是自动补写一般化解释。','These items are present in the governed structure, but do not yet have admitted standalone meanings in W11. The surface keeps that gap visible instead of filling it with a generic interpretation.'))}</p><ul>${gapItems}</ul></section><section class="table-wrap"><h2>${esc(t(l,'表格后备读取','Table fallback'))}</h2><table><thead><tr><th>${esc(t(l,'宫位','Palace'))}</th><th>${esc(t(l,'地支','Branch'))}</th><th>${esc(t(l,'焦点标签','Focus tags'))}</th><th>${esc(t(l,'星曜','Stars'))}</th><th>${esc(t(l,'摘要','Summary'))}</th></tr></thead><tbody>${tableRows}</tbody></table></section></section><aside class="inspector">${panels}</aside></div></main><script>
  const buttons=[...document.querySelectorAll('[data-palace-button]')];
  const panels=[...document.querySelectorAll('[data-palace-panel]')];
  function activate(code){buttons.forEach(btn=>{const on=btn.dataset.palaceButton===code;btn.classList.toggle('is-active',on);btn.setAttribute('aria-pressed',on?'true':'false')});panels.forEach(panel=>panel.classList.toggle('is-active',panel.dataset.palacePanel===code));}
  buttons.forEach(btn=>btn.addEventListener('click',()=>activate(btn.dataset.palaceButton)));
  activate(${JSON.stringify(defaultCode)});
  </script></body></html>`;
}

export default Object.freeze({buildZiweiInteractiveChartSurface,renderZiweiInteractiveChartSurfaceHtml});
