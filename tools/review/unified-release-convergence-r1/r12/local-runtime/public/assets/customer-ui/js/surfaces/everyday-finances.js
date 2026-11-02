import {esc,tr} from './runtime-ui.js';
import {installFinanceReportCoverage} from './finance-report-coverage.js';
const label=(en,zh)=>`<span data-cx-en="${esc(en)}" data-cx-zh="${esc(zh)}">${esc(tr(en,zh))}</span>`;
export function installEverydayFinanceTasks(form,taskNav){
 installFinanceReportCoverage();
 taskNav.remove();
 const host=document.createElement('section');host.className='cx-section--tight';host.id='everyday-finance-tasks';
 const tasks=[['incomeStreams','Monthly income and spending','每月收支','Do income and spending fit together?','我的收入和支出是否配得上？'],['assets','Accessible reserves','备用资金','How much is ready if life changes?','生活有变化时，我手边准备了多少？'],['goals','Savings goals','储蓄目标','What does my next goal still need?','我想完成的事，还需要准备多少？']];
 host.innerHTML=`<div class="cx-container"><div class="finance-everyday-cards">${tasks.map(([group,en,zh,qen,qzh])=>`<a class="cx-card" href="#financial-information" data-finance-task="${group}"><h2>${label(en,zh)}</h2><p>${label(qen,qzh)}</p></a>`).join('')}</div><details class="finance-further"><summary>${label('Organize a little more','进一步整理')}</summary><div class="finance-task-links">${[['assets','Assets and debts','资产与负债'],['people','Household responsibilities and protection','家庭责任与已有保障'],['goals','Major spending and goals','大额支出和目标'],['assumptions','Annual records and important documents','年度资料与重要文件']].map(([group,en,zh])=>`<a href="#financial-information" class="cx-button cx-button--secondary" data-finance-task="${group}">${label(en,zh)}</a>`).join('')}</div></details><p>${label('Input, saving, reopening, basic calculations and individual tools remain free.','资料输入、保存重开、基本计算和单项工具继续免费。')}</p></div>`;
 document.querySelector('main .cx-p1-hero').after(host);
 document.addEventListener('click',event=>{
  const link=event.target.closest('[data-finance-task]');if(!link)return;
  event.preventDefault();const group=link.dataset.financeTask;
  document.dispatchEvent(new CustomEvent('phios:financial-stage-request',{detail:{index:({incomeStreams:1,assets:3,goals:6,people:0,assumptions:7})[group]}}));
  form.scrollIntoView({behavior:'smooth',block:'start'});
  const field=form.querySelector(`[data-inventory-group="${group}"] input:not([type="hidden"])`);
  if(field&&!field.closest('[hidden]'))field.focus({preventScroll:true});
 });
}
