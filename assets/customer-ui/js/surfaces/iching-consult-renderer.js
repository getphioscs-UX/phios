const arr=value=>Array.isArray(value)?value:[];
const str=value=>String(value??'').normalize('NFKC').trim();
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const zh=locale=>String(locale||'').toLowerCase().startsWith('zh');
const tt=(locale,en,cn)=>zh(locale)?cn:en;

function layer(view,id){return arr(view?.hierarchy).find(item=>item?.id===id)?.data||{};}
function cleanEditorial(value,locale){
  let out=str(value);
  if(!out)return '';
  if(zh(locale)){
    out=out.replace(/候选逐爻解释/g,'逐爻解释').replace(/候选解释/g,'这一解释');
  }else{
    out=out.replace(/^This candidate for line (\d+) of ([^ ]+) /,'This interpretation of line $1 of $2 ')
      .replace(/^This candidate for ([^ ]+) /,'This interpretation of $1 ');
  }
  return out;
}
function lineName(value,locale){return ({6:tt(locale,'old yin · changing','老阴 · 变爻'),7:tt(locale,'young yang · stable','少阳 · 静爻'),8:tt(locale,'young yin · stable','少阴 · 静爻'),9:tt(locale,'old yang · changing','老阳 · 变爻')})[Number(value)]||str(value);}
function lineMark(value){return ({6:'⚋ ×',7:'⚊',8:'⚋',9:'⚊ ○'})[Number(value)]||'—';}
function figureLines(lines,locale){
  const ordered=[...arr(lines)].sort((a,b)=>Number(b.position)-Number(a.position));
  return `<ol class="icx-figure-lines">${ordered.map(item=>`<li class="${item.changing?'is-changing':''}"><span>${esc(item.position===6?tt(locale,'Top','上爻'):item.position===1?tt(locale,'Bottom','初爻'):item.position)}</span><strong>${esc(Number(item.primaryBit)===1?'━━━━━━':'━━  ━━')}</strong>${item.changing?`<em>${esc(tt(locale,'changes','变'))}</em>`:''}</li>`).join('')}</ol>`;
}
function reflectingFigureLines(lines,locale){
  const ordered=[...arr(lines)].sort((a,b)=>Number(b.position)-Number(a.position));
  return `<ol class="icx-figure-lines">${ordered.map(item=>`<li><span>${esc(item.position===6?tt(locale,'Top','上爻'):item.position===1?tt(locale,'Bottom','初爻'):item.position)}</span><strong>${esc(Number(item.relatingBit)===1?'━━━━━━':'━━  ━━')}</strong></li>`).join('')}</ol>`;
}
function bulletList(items,empty,locale){
  const values=arr(items).map(str).filter(Boolean);
  if(!values.length)return `<p class="icx-empty">${esc(empty||tt(locale,'No additional item.','暂无补充。'))}</p>`;
  return `<ul class="icx-reading-list">${values.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
}
function contentCard(title,value,locale){const text=cleanEditorial(value,locale);return text?`<section class="icx-meaning-card"><h4>${esc(title)}</h4><p>${esc(text)}</p></section>`:'';}
function sourceClaims(view){
  const interpretation=layer(view,'SYMBOLIC_INTERPRETATION');
  const out=[]; const seen=new Set();
  for(const item of arr(interpretation.commentaryCandidates)){
    const claim=str(item?.claim); if(!claim||seen.has(claim))continue;seen.add(claim);out.push({claim,linePosition:item?.linePosition||null,role:item?.hexagramRole||null});
  }
  return out;
}
export function createIChingCustomerReadingModel(view,locale='en'){
  const projection=layer(view,'PROJECTION');
  const method=layer(view,'METHOD_EVIDENCE');
  const interpretation=layer(view,'SYMBOLIC_INTERPRETATION');
  const depth=interpretation?.depthInterpretation||{};
  const hex=depth?.hexagram||null;
  const hexContent=hex?.content||{};
  const lineDepth=arr(depth?.lines);
  const question=str(layer(view,'YOUR_INPUT')?.question);
  const lines=arr(projection?.lines||method?.sixLines);
  const primary=projection?.primary||view?.ichingSurface?.primary||{};
  const relating=projection?.relating||view?.ichingSurface?.relating||{};
  const changing=arr(projection?.changingLines||view?.ichingSurface?.changingLines).map(Number);
  return Object.freeze({
    locale,question,lines,primary,relating,changing,
    depthAvailable:depth?.status==='AVAILABLE'&&hex?.humanApproved===true,
    hexContent,
    lineDepth,
    claims:sourceClaims(view),
    sources:arr(view?.sourceVisibility?.sources),
    uncertainty:arr(view?.ichingSurface?.uncertainty?.states),
    reality:layer(view,'REALITY_COMPARISON')
  });
}
export function renderIChingCustomerReading(view,locale='en'){
  const m=createIChingCustomerReadingModel(view,locale);
  const primaryTitle=`${tt(locale,'Hexagram','第')} ${esc(m.primary.number||'—')}${zh(locale)?'卦':''} · ${esc(m.primary.chineseNameZhHans||m.primary.chineseName||'')} · ${esc(m.primary.canonicalName||'')}`;
  const relatingTitle=`${tt(locale,'Relating hexagram','之卦')} ${esc(m.relating.number||'—')}${zh(locale)?' · ': ' · '}${esc(m.relating.chineseNameZhHans||m.relating.chineseName||'')} · ${esc(m.relating.canonicalName||'')}`;
  const movingLabel=m.changing.length?m.changing.join(zh(locale)?'、':', '):tt(locale,'none','无');
  const hex=m.hexContent||{};
  const selectedLineCards=m.lineDepth.map(unit=>{
    const c=unit?.content||{};
    const position=unit?.linePosition;
    return `<article class="icx-moving-line-card"><header><span>${esc(tt(locale,`Changing line ${position}`,`第 ${position} 爻 · 变爻`))}</span><strong>${esc(cleanEditorial(c.plainMeaning,locale))}</strong></header><div class="icx-moving-line-grid">${contentCard(tt(locale,'Stage','所处阶段'),c.situationOrStage,locale)}${contentCard(tt(locale,'Central tension','这一爻的张力'),c.centralTension,locale)}${contentCard(tt(locale,'Constructive movement','较有建设性的方向'),c.constructiveExpressionOrMovement,locale)}${contentCard(tt(locale,'Watch for','需要避免的误读'),c.distortionOrFailureRisk,locale)}</div><section class="icx-observe-box"><h4>${esc(tt(locale,'What to observe now','现在可以观察什么'))}</h4>${bulletList(c.whatToObserve,'',locale)}</section></article>`;
  }).join('');
  const obs=[...arr(hex.whatToObserve),...m.lineDepth.flatMap(unit=>arr(unit?.content?.whatToObserve))];
  const reflections=[...arr(hex.reflectionQuestions),...m.lineDepth.flatMap(unit=>arr(unit?.content?.reflectionQuestions))];
  const claims=m.claims.map(item=>`<li>${item.linePosition?`<span>${esc(tt(locale,`Line ${item.linePosition}`,`第 ${item.linePosition} 爻`))}</span>`:''}<blockquote>${esc(item.claim)}</blockquote></li>`).join('');
  const sources=m.sources.map(source=>`<li><strong>${esc(source.sourceTitle||tt(locale,'Canonical source','原典来源'))}</strong>${source.digitalWitness?`<a href="${esc(source.digitalWitness)}" target="_blank" rel="noopener noreferrer">${esc(tt(locale,'Open source','查看来源'))}</a>`:''}</li>`).join('');
  return `<article class="icx-reading-shell">
    <header class="icx-reading-hero">
      <p class="cx-eyebrow">${esc(tt(locale,'YOUR READING','这次阅读'))}</p>
      <h2>${primaryTitle}</h2>
      <blockquote>${esc(m.question)}</blockquote>
      <div class="icx-reading-meta"><span>${esc(tt(locale,'Changing lines','变爻'))}: <strong>${esc(movingLabel)}</strong></span>${m.changing.length?`<span>${relatingTitle}</span>`:''}</div>
    </header>

    <section class="icx-hexagram-pair">
      <article><p>${esc(tt(locale,'Primary hexagram','本卦'))}</p><h3>${primaryTitle}</h3>${figureLines(m.lines,locale)}</article>
      ${m.changing.length?`<div class="icx-change-arrow">→</div><article><p>${esc(tt(locale,'Relating hexagram','之卦'))}</p><h3>${relatingTitle}</h3>${reflectingFigureLines(m.lines,locale)}</article>`:''}
    </section>

    ${m.depthAvailable?`<section class="icx-reading-section icx-main-meaning"><div class="icx-section-heading"><span>1</span><div><p class="cx-eyebrow">${esc(tt(locale,'HUMAN-REVIEWED INTERPRETATION','人工审核解释'))}</p><h3>${esc(tt(locale,'Start here','先从这里读起'))}</h3></div></div><p class="icx-lead-meaning">${esc(cleanEditorial(hex.plainMeaning,locale))}</p><div class="icx-meaning-grid">${contentCard(tt(locale,'Situation / stage','当前处境 / 阶段'),hex.situationOrStage,locale)}${contentCard(tt(locale,'Central tension','核心张力'),hex.centralTension,locale)}${contentCard(tt(locale,'Constructive movement','较有建设性的方向'),hex.constructiveExpressionOrMovement,locale)}${contentCard(tt(locale,'Condition / timing','条件与阶段'),hex.timingOrCondition,locale)}${contentCard(tt(locale,'Do not over-read it as','不要把它读成'),hex.distortionOrFailureRisk,locale)}</div></section>`:`<section class="icx-reading-section"><h3>${esc(tt(locale,'Interpretation temporarily unavailable','解释暂时不可用'))}</h3><p>${esc(tt(locale,'The hexagram structure is available, but this reading did not return its human-reviewed interpretation.','卦象结构已经形成，但这次响应没有带回相应的人工审核解释。'))}</p></section>`}

    ${m.lineDepth.length?`<section class="icx-reading-section"><div class="icx-section-heading"><span>2</span><div><p class="cx-eyebrow">${esc(tt(locale,'CHANGING LINES','变爻'))}</p><h3>${esc(tt(locale,'Where the change is concentrated','变化集中在哪里'))}</h3></div></div><div class="icx-moving-lines">${selectedLineCards}</div></section>`:''}

    <section class="icx-reading-section"><div class="icx-section-heading"><span>${m.lineDepth.length?3:2}</span><div><p class="cx-eyebrow">${esc(tt(locale,'RETURN TO REALITY','回到现实'))}</p><h3>${esc(tt(locale,'What can you actually check next?','接下来真正可以核对什么？'))}</h3></div></div><p>${esc(tt(locale,'The hexagram gives you a lens. Your next judgment still depends on what is observable in the situation.','卦象提供的是一个观察镜头；你接下来的判断，仍然要回到处境中真正可以观察的事实。'))}</p><div class="icx-reality-grid"><section><h4>${esc(tt(locale,'Observe','观察'))}</h4>${bulletList(obs,tt(locale,'No additional observation prompt.','暂无补充观察问题。'),locale)}</section><section><h4>${esc(tt(locale,'Reflect','反思'))}</h4>${bulletList(reflections,tt(locale,'No additional reflection prompt.','暂无补充反思问题。'),locale)}</section></div></section>

    <section class="icx-reading-section icx-open-section"><div class="icx-section-heading"><span>${m.lineDepth.length?4:3}</span><div><p class="cx-eyebrow">${esc(tt(locale,'WHAT REMAINS OPEN','仍然开放的部分'))}</p><h3>${esc(tt(locale,'What this reading does not settle','这次阅读不会替你决定什么'))}</h3></div></div><ul class="icx-reading-list"><li>${esc(tt(locale,'It does not establish a guaranteed outcome.','它不会确认一个必然结果。'))}</li><li>${esc(tt(locale,'It does not provide an exact date.','它不会提供一个被保证的具体日期。'))}</li><li>${esc(tt(locale,"It does not prove another person's hidden thoughts or intentions.",'它不能证明他人的隐藏内心状态或意图。'))}</li><li>${esc(tt(locale,'It does not replace your decision.','它不会替你作决定。'))}</li></ul></section>

    <details class="icx-source-details"><summary>${esc(tt(locale,'View original text and sources','查看原典与来源'))}</summary><div>${claims?`<h4>${esc(tt(locale,'Selected canonical text','本次相关原典'))}</h4><ul class="icx-source-claims">${claims}</ul>`:''}${sources?`<h4>${esc(tt(locale,'Source witness','来源见证'))}</h4><ul class="icx-source-links">${sources}</ul>`:''}</div></details>
  </article>`;
}
