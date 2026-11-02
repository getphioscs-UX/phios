import {tr} from './runtime-ui.js';
// Each new export re-enters the authenticated owner. A visible copy is not an
// enduring authorization token and cannot be retroactively recalled.
export function showFinancialSavedReport(host,html,loadFresh){
 const frame=document.createElement('iframe');frame.sandbox='allow-same-origin allow-modals';frame.title=tr('Saved financial report','已保存财务报告');frame.style.cssText='width:100%;height:750px;border:1px solid #ccc';frame.srcdoc=html;
 const status=document.createElement('p');status.setAttribute('role','status');
 const download=document.createElement('button'),print=document.createElement('button');
 for(const b of [download,print]){b.type='button';b.className='cx-button cx-button--secondary';}
 download.dataset.savedReportDownload='';download.textContent=tr('Download this saved report (HTML)','下载此保存报告（HTML）');print.dataset.savedReportPrint='';print.textContent=tr('Print / save this report as PDF','打印／将此报告存为 PDF');
 async function run(action){try{status.textContent='';const fresh=await loadFresh();if(!host.isConnected||!host.contains(frame))return;await action(fresh);}catch{frame.remove();status.textContent=tr('Access must be verified again. Reopen your saved report before exporting.','须重新核验访问。请重开保存报告后再导出。');}}
 download.addEventListener('click',()=>run(async fresh=>{const url=URL.createObjectURL(new Blob([fresh],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='saved-financial-report.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
 print.addEventListener('click',()=>run(async fresh=>{frame.addEventListener('load',()=>frame.contentWindow?.print(),{once:true});frame.srcdoc=fresh;}));
 host.replaceChildren(download,print,status,frame);return frame;
}
