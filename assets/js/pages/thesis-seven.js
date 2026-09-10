import {getLocale,initializeI18n,onLocaleChange} from '../i18n.js';

const copy={
 en:{title:'Seven books. One architecture.',copy:'The seven books form the human-readable route through the fifteen-part PHI OS architecture.',books:[
  ['BOOK I · PARTS 1–4','Reality Formation','From Reality physics, projection and dynamics to the carrier and continuous Human Runtime.'],
  ['BOOK II · PARTS 5–7','Reality Runtime','From conscious experience through relationships into collective operation.'],
  ['BOOK III · PARTS 8–9','Reality Continuity','From Runtime maintenance and recovery into coordination and continuity.'],
  ['BOOK IV · PARTS 10–11','Reality Expansion','From Runtime expansion through scale transition into civilization runtime.'],
  ['BOOK V · PART 12','Reality Differentiation','Civilization Atlas maps differentiated civilization positions, trajectories, carriers and boundaries.'],
  ['BOOK VI · PART 13','Reality Observation','Reading Science establishes observation, evidence, projection, interpretation and reading governance.'],
  ['BOOK VII · PARTS 14–15','Reality Navigation','Navigation Science turns reading toward diagnosis, direction, action, outcome and Reality Continuation.']
 ]},
 'zh-Hans':{title:'七册书，一套架构。',copy:'七册书构成 PHI OS 十五部架构面向人的完整阅读路径。',books:[
  ['第一册 · 第1–4部','现实形成','从现实物理、投影与动力学，进入载体与持续的人类运行。'],
  ['第二册 · 第5–7部','现实运行','从意识经验、关系进入集体运行。'],
  ['第三册 · 第8–9部','现实维持','从运行维持、恢复进入协调与连续性。'],
  ['第四册 · 第10–11部','现实扩展','从运行扩展与尺度转换进入文明运行。'],
  ['第五册 · 第12部','现实分化','文明图谱描述文明的位置、轨迹、载体、负载与边界。'],
  ['第六册 · 第13部','现实观察','读取科学建立观察、证据、投影、解释与读取治理。'],
  ['第七册 · 第14–15部','现实导航','导航科学让读取进入诊断、方向、行动、结果与现实延续。']
 ]}
};
function render(){const locale=getLocale(),c=copy[locale]||copy.en;const title=document.querySelector('[data-seven-thesis-books-title]');const desc=document.querySelector('[data-seven-thesis-books-copy]');const grid=document.querySelector('[data-seven-thesis-books-grid]');const atlas=document.querySelector('[data-i18n="thesis.implementation.a1"]');if(title)title.textContent=c.title;if(desc)desc.textContent=c.copy;if(grid)grid.innerHTML=c.books.map(([no,name,text])=>`<article class="card book-card"><span class="num">${no}</span><h3>${name}</h3><p>${text}</p><div class="book-status">PHI OS · Seven-volume architecture</div></article>`).join('');if(atlas)atlas.textContent=locale==='zh-Hans'?'以可滚动、可逐层探索的方式呈现十五部知识架构。':'A scrollable and explorable map of the fifteen-part knowledge architecture.'}
initializeI18n();render();onLocaleChange(render);
