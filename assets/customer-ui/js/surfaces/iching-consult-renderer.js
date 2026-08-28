import {composeIChingCustomerReading,customerCopy} from './iching-consult-composition.js';

const arr=value=>Array.isArray(value)?value:[];
const str=value=>String(value??'').normalize('NFKC').trim();
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const zh=locale=>String(locale||'').toLowerCase().startsWith('zh');
const tt=(locale,en,cn)=>zh(locale)?cn:en;

function layer(view,id){return arr(view?.hierarchy).find(item=>item?.id===id)?.data||{};}
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
function answerCard(title,value,accent=''){return value?`<section class="icx-answer-card ${accent}"><h4>${esc(title)}</h4><p>${esc(value)}</p></section>`:'';}
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
  const composition=composeIChingCustomerReading({locale,question,primary,relating,changing,hexContent,lineDepth});
  return Object.freeze({
    locale,question,lines,primary,relating,changing,
    depthAvailable:depth?.status==='AVAILABLE'&&hex?.humanApproved===true,
    hexContent,lineDepth,composition,
    claims:sourceClaims(view),
    sources:arr(view?.sourceVisibility?.sources)
  });
}
function hexTitle(hexagram,locale,prefix=''){
  const number=hexagram?.number||'—';
  const zhName=hexagram?.chineseNameZhHans||hexagram?.chineseName||'';
  const enName=hexagram?.canonicalName||'';
  if(zh(locale)) return `${prefix}${prefix?' ':''}第${esc(number)}卦 · ${esc(zhName)}${enName?` · ${esc(enName)}`:''}`;
  return `${prefix}${prefix?' ':''}Hexagram ${esc(number)}${enName?` · ${esc(enName)}`:''}${zhName?` · ${esc(zhName)}`:''}`;
}
function renderLineCards(model){
  const locale=model.locale;
  return model.composition.lineSummaries.map(line=>`<article class="icx-moving-line-card">
    <header>
      <span>${esc(tt(locale,`CHANGING LINE ${line.position}`,`第 ${line.position} 爻 · 变化点`))}</span>
      <h4>${esc(tt(locale,'What changes here','这一爻正在改变什么'))}</h4>
      ${line.stage?`<p class="icx-line-lead">${esc(line.stage)}</p>`:''}
    </header>
    <div class="icx-moving-line-grid">
      ${answerCard(tt(locale,'The key at this stage','这一步的关键'),line.focus,'is-focus')}
      ${answerCard(tt(locale,'A better way to handle it','更合适的处理方式'),line.direction,'is-direction')}
      ${answerCard(tt(locale,'How to recognise the stage','如何判断阶段是否到了'),line.condition)}
      ${answerCard(tt(locale,'The easiest mistake','最容易误判的地方'),line.risk,'is-caution')}
    </div>
    ${line.observe.length?`<section class="icx-observe-box"><h4>${esc(tt(locale,'Check these signs next','接下来核对这些迹象'))}</h4>${bulletList(line.observe,'',locale)}</section>`:''}
  </article>`).join('');
}
export function renderIChingCustomerReading(view,locale='en'){
  const m=createIChingCustomerReadingModel(view,locale);
  const c=m.composition;
  const primaryTitle=hexTitle(m.primary,locale);
  const relatingTitle=hexTitle(m.relating,locale,tt(locale,'Relating','之卦'));
  const movingLabel=m.changing.length?m.changing.join(zh(locale)?'、':', '):tt(locale,'none','无');
  const claims=m.claims.map(item=>`<li>${item.linePosition?`<span>${esc(tt(locale,`Line ${item.linePosition}`,`第 ${item.linePosition} 爻`))}</span>`:''}<blockquote>${esc(item.claim)}</blockquote></li>`).join('');
  const sources=m.sources.map(source=>`<li><strong>${esc(source.sourceTitle||tt(locale,'Canonical source','原典来源'))}</strong>${source.digitalWitness?`<a href="${esc(source.digitalWitness)}" target="_blank" rel="noopener noreferrer">${esc(tt(locale,'Open source','查看来源'))}</a>`:''}</li>`).join('');
  const lineCards=renderLineCards(m);
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

    ${m.depthAvailable?`<section class="icx-reading-section icx-direct-reading">
      <div class="icx-section-heading"><span>1</span><div><h3>${esc(tt(locale,'What this hexagram is pointing to','这次卦象的重点'))}</h3></div></div>
      <div class="icx-answer-lead">
        <p>${esc(c.answerLead)}</p>
        ${c.practicalLead?`<strong>${esc(c.practicalLead)}</strong>`:''}
      </div>
      <div class="icx-answer-grid">
        ${answerCard(tt(locale,'Where you are now','你现在处在什么位置'),c.situation)}
        ${answerCard(tt(locale,'What really needs judging','真正要判断的是什么'),c.tension,'is-focus')}
        ${answerCard(tt(locale,'A clearer next direction','现在更适合怎么做'),c.direction,'is-direction')}
        ${answerCard(tt(locale,'What conditions matter','看哪些条件是否成熟'),c.condition)}
      </div>
      ${c.risk?`<div class="icx-reading-caution"><strong>${esc(tt(locale,'Watch this','留意这一点'))}</strong><span>${esc(c.risk)}</span></div>`:''}
    </section>`:`<section class="icx-reading-section"><h3>${esc(tt(locale,'Interpretation temporarily unavailable','解释暂时不可用'))}</h3><p>${esc(tt(locale,'The hexagram structure is available, but its customer interpretation did not return with this response.','卦象结构已经形成，但这次响应没有带回相应的客户解读。'))}</p></section>`}

    ${m.changing.length?`<section class="icx-reading-section icx-change-reading"><div class="icx-section-heading"><span>2</span><div><h3>${esc(tt(locale,'What is changing now','这次变化说明什么'))}</h3></div></div><p class="icx-transition-lead">${esc(c.transitionText)}</p><div class="icx-moving-lines">${lineCards}</div></section>`:''}

    <section class="icx-reading-section icx-reality-reading"><div class="icx-section-heading"><span>${m.changing.length?3:2}</span><div><h3>${esc(tt(locale,'Bring it back to your question','把它放回你的问题'))}</h3></div></div><p class="icx-reality-intro">${esc(tt(locale,'If this reading is useful, it should make the situation easier to examine—not harder to understand. Use the prompts below to decide what deserves attention next.','如果这次阅读有用，它应该让你更容易看清问题，而不是让问题变得更玄。下面这些问题可以帮助你判断，接下来真正值得注意的是什么。'))}</p><div class="icx-reality-grid"><section><h4>${esc(tt(locale,'Check these first','先核对这些'))}</h4>${bulletList(c.observation,tt(locale,'No additional observation prompt.','暂无补充观察问题。'),locale)}</section><section><h4>${esc(tt(locale,'Then ask yourself','再问自己这些'))}</h4>${bulletList(c.reflection,tt(locale,'No additional reflection prompt.','暂无补充反思问题。'),locale)}</section></div></section>

    <details class="icx-source-details"><summary>${esc(tt(locale,'Original text, sources & reading note','原典、来源与阅读说明'))}</summary><div>${claims?`<h4>${esc(tt(locale,'Selected canonical text','本次相关原典'))}</h4><ul class="icx-source-claims">${claims}</ul>`:''}${sources?`<h4>${esc(tt(locale,'Source witness','来源见证'))}</h4><ul class="icx-source-links">${sources}</ul>`:''}<p class="icx-source-note">${esc(tt(locale,'Use this reading to clarify the structure of the question. Decisions still need to be made with the facts, responsibilities and consequences of the real situation in view.','把这份阅读用来帮助你看清问题结构；真正作决定时，仍要把现实中的事实、责任与后果一起放进来。'))}</p></div></details>
  </article>`;
}
