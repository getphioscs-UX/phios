import {arr,esc,tr} from './runtime-ui.js';

function methodTitle(methodId){return ({AST:tr('Your Astrology reading','你的占星读取'),BZR:tr('Your BaZi reading','你的八字读取'),ZWR:tr('Your Zi Wei reading','你的紫微读取'),NUM:tr('Your Numerology reading','你的数字读取')})[methodId]||tr('Your reading','你的读取')}
function reports(view){const direct=view?.singleMethodReading?[view.singleMethodReading]:[];if(direct.length)return direct;return arr(view?.reading?.methods).map(item=>item?.singleMethodReading).filter(Boolean)}
function explanation(report){return arr(report.whyThisReading).map(item=>`<details class="cx-smr-why"><summary>${esc(item.summary)}</summary><p>${esc(tr('This explanation remains linked to the accepted structures used in the reading.','这项说明继续绑定到本次读取所使用的已获接受结构。'))}</p></details>`).join('')}
function executive(report){const value=report.executiveReading||{};return `<header class="cx-smr-executive"><p class="cx-eyebrow">${esc(tr('READING FIRST','先看读取'))}</p><h2>${esc(methodTitle(report.methodId))}</h2><p>${esc(report.governance?.reportBoundary||'')}</p><div class="cx-smr-theme-grid">${arr(value.coreThemes).map(theme=>`<article><span>${esc(theme.tier==='CORE_THEME'?tr('Core theme','核心主题'):tr('Supporting theme','支持主题'))}</span><h3>${esc(theme.headline)}</h3></article>`).join('')}</div>${value.strongestSupport?`<article class="cx-smr-callout" data-kind="support"><span>${esc(tr('Strongest support','最支持这个结构的条件'))}</span><p>${esc(value.strongestSupport.text)}</p></article>`:''}${value.highestCost?`<article class="cx-smr-callout" data-kind="cost"><span>${esc(tr('Where cost can increase','容易增加运行成本的位置'))}</span><p>${esc(value.highestCost.text)}</p></article>`:''}${value.observationQuestion?`<article class="cx-smr-callout" data-kind="observe"><span>${esc(tr('Worth observing now','目前最值得观察'))}</span><p>${esc(value.observationQuestion.text)}</p></article>`:''}</header>`}
function section(section){if(section.state!=='AVAILABLE'||!arr(section.paragraphs).length)return '';return `<section class="cx-smr-section" data-section="${esc(section.sectionId)}"><h3>${esc(section.title)}</h3>${arr(section.paragraphs).map(item=>item.kind==='REALITY_QUESTION'?`<blockquote>${esc(item.text)}</blockquote>`:`<p>${esc(item.text)}</p>`).join('')}</section>`}
function technical(report){return `<details class="cx-smr-technical"><summary>${esc(tr('View sources and structure details','查看来源与结构详情'))}</summary><dl><dt>${esc(tr('Perspective','视角'))}</dt><dd>${esc(report.methodId)}</dd><dt>${esc(tr('Why this reading is traceable','为什么这份读取可以追溯'))}</dt><dd>${esc(tr('Every paragraph remains linked to accepted interpretation units and versioned composition rules.','每一段都继续绑定到已获接受的解释单元与版本化组合规则。'))}</dd><dt>${esc(tr('Report reference','报告参考'))}</dt><dd>${esc(report.readingId)}</dd></dl></details>`}
function reportHtml(report){return `<article class="cx-smr-report">${executive(report)}<div class="cx-smr-body">${arr(report.sections).map(section).join('')}<section class="cx-smr-section"><h3>${esc(tr('Why this reading?','为什么这样读？'))}</h3>${explanation(report)}</section>${technical(report)}</div></article>`}

export function renderSingleMethodReading(view){
  const tab=document.querySelector('[data-cx-tab="my-reading"]'),panel=document.querySelector('[data-cx-panel="my-reading"]'),node=document.querySelector('[data-cx-single-method-reading]');
  if(!tab||!panel||!node)return;
  const workspaceActive=view?.astrologyWorkspace?.surfaceCutoverActive===true;
  const numerologyChartFirst=view?.numerology?.integratedReading?.customerPublishable===true&&Boolean(view?.numerology?.chartModel);
  const available=reports(view).filter(report=>!(workspaceActive&&report?.methodId==='AST')&&!(numerologyChartFirst&&report?.methodId==='NUM'));
  tab.hidden=!available.length&&!workspaceActive&&!numerologyChartFirst;panel.dataset.available=String(Boolean(available.length||workspaceActive||numerologyChartFirst));
  if(!available.length){node.innerHTML='';if(!workspaceActive&&!numerologyChartFirst)panel.hidden=true;return}
  node.innerHTML=available.map(reportHtml).join('');
}

