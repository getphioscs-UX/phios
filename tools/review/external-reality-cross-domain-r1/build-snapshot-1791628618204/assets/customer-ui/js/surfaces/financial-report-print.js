import {esc,tr} from './runtime-ui.js';
import {resolveCustomerAsset} from '../assets.js';
// An explicit local print action. No report or customer data is uploaded or published.
export function addReportPrintButton(container,{expiresAt=null}={}){
 const report=container.querySelector('.fw-navigation');if(!report)return;
 const button=document.createElement('button');button.type='button';button.className='cx-button cx-button--secondary';button.textContent=tr('Print this preliminary report','打印此初步报告');button.dataset.reportPrint='';container.insertBefore(button,report);
 button.addEventListener('click',async()=>{
  if(expiresAt&&Date.now()>=Date.parse(expiresAt)){button.disabled=true;button.textContent=tr('Prepare a fresh report before printing','请重新整理报告后再打印');return;}
  // Printing cannot depend on scrolling every lazy figure into view first.
  button.disabled=true;
  await Promise.all([...report.querySelectorAll('img[data-cx-asset]')].map(async node=>{try{const asset=await resolveCustomerAsset(node.dataset.cxAsset);node.loading='eager';node.src=asset.publicUrl;await node.decode();}catch{node.hidden=true;}}));
  button.disabled=false;
  const frame=document.createElement('iframe');frame.title=tr('Report print preview','报告打印预览');frame.style.cssText='position:fixed;width:1px;height:1px;left:-10000px;border:0';
  frame.addEventListener('load',()=>{frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.focus();frame.contentWindow.print();},{once:true});
  frame.srcdoc=`<!doctype html><html lang="${esc(document.documentElement.lang)}"><meta charset="utf-8"><title>${esc(report.querySelector('h2')?.textContent||'PHI OS')}</title><style>@page{size:A4;margin:18mm}body{font:12pt/1.65 Georgia,"Noto Serif SC",serif;color:#172f43;background:white}h2{font-size:25pt}h3{font-size:17pt}header{border-bottom:1pt solid #baa16e;padding-bottom:16pt}section{break-before:page}dt,dd,p,li{overflow-wrap:anywhere}dl>div{padding:8pt 0;border-bottom:1pt solid #ddd}dd{margin:4pt 0}small{display:block;color:#536775}li{margin-bottom:10pt}img{max-width:100%;max-height:240px}figure{margin:12pt 0}.fw-dashboard{display:grid;grid-template-columns:1fr 1fr;gap:12pt}.fw-dashboard strong{display:block}</style><body>${report.outerHTML}</body></html>`;document.body.append(frame);
 });
}
