import {onLocaleChange} from '../i18n.js';
const p=(en,zh)=>document.documentElement.lang==='zh-Hans'?zh:en;
// Retired embedded form delegates to the existing Ask journey and handler.
function render(){const host=document.querySelector('[data-scam-intelligence]');if(!host)return;host.replaceChildren();const title=document.createElement('h2');title.textContent=p('Check something suspicious','核对可疑信息');const link=document.createElement('a');link.href='/knowledge/ask/?task=SCAM_CHECK';link.textContent=p('Review the message, exposure and official sources in Ask','在 Ask 核对消息、暴露状态与官方来源');host.append(title,link);}
async function renderSourceDirectory(){
 const root=document.querySelector('[data-scam-source-directory]');if(!root)return;root.replaceChildren();
 const label=document.createElement('label'),select=document.createElement('select'),output=document.createElement('div');
 label.append(document.createTextNode(p('Official source country','官方来源国家')));label.append(select);output.setAttribute('aria-live','polite');root.append(label,output);
 for(const [code,en,zh]of[['UNKNOWN','Choose a country','请选择国家'],['MY','Malaysia','马来西亚'],['SG','Singapore','新加坡'],['US','United States','美国'],['GB','United Kingdom','英国'],['AU','Australia','澳大利亚']]){const o=document.createElement('option');o.value=code;o.textContent=p(en,zh);select.append(o);}
 let sequence=0;
 select.onchange=async()=>{const ticket=++sequence;output.textContent=p('Loading official references…','正在载入官方参考……');try{const response=await fetch('/api/customer-contextual-ask?catalog=scam&jurisdiction='+encodeURIComponent(select.value),{signal:AbortSignal.timeout(10000)});const data=await response.json();if(!response.ok||!Array.isArray(data.sources))throw Error('UNAVAILABLE');if(ticket!==sequence)return;output.replaceChildren();const note=document.createElement('p');note.textContent=data.sources.length?p('Direct official references; no live incident, phone or company lookup.','官方直接参考；未进行实时个案、电话或公司查询。'):p('No verified local references selected. Use your bank and local official channels.','尚未选择已核实的当地来源，请联系银行及当地官方机构。');output.append(note);for(const source of data.sources){const a=document.createElement('a');a.href=source.url;a.textContent=source.publisher+' · '+source.jurisdiction+' · '+source.verifiedAt;a.rel='noopener noreferrer';a.target='_blank';output.append(a,document.createElement('br'));}}catch{if(ticket===sequence)output.textContent=p('Sources unavailable; no lookup result established.','来源暂不可用；未取得查询结果。');}};
}
render();renderSourceDirectory();onLocaleChange(render);onLocaleChange(renderSourceDirectory);
