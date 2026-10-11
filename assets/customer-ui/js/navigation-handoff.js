// Selectors only: identity, admission and source version are resolved server-side.
export function installNavigationHandoff(host,selection){
 const zh=()=>document.documentElement.lang.startsWith('zh');
 const button=document.createElement('button');button.type='button';button.textContent=zh()?'以此来源继续':'Continue with this source';host.append(button);
 button.onclick=async()=>{
  const isPrivate=!['ACADEMY','BOOKS'].includes(selection.productFamily);
  if(isPrivate&&!window.confirm(zh()?'同意处理这份已保存来源以建立交接情境？':'Consent to process this saved source for a navigation handoff?'))return;
  button.disabled=true;const panel=document.createElement('section');host.append(panel);
  const status=document.createElement('p');panel.append(status);
  async function request(input){const response=await fetch('/api/customer-navigation-handoff',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...selection,locale:zh()?'zh-Hans':'en',...input})});const result=await response.json();if(!response.ok)throw Error(result.code||'NAVIGATION_UNAVAILABLE');return result.handoff;}
  try{
   const result=await request({action:'PROJECT',...(isPrivate?{currentRealityConsent:{processing:true}}:{})});status.textContent=(zh()?'来源版本：':'Source version: ')+result.sourceVersion+' · '+(zh()?'方向和位置尚未确定':'Direction and position not established');
   const label=document.createElement('label'),consent=document.createElement('input');consent.type='checkbox';label.append(consent,document.createTextNode(zh()?'同意处理并保存此来源情境 7 天':'Consent to process and retain this source context for 7 days'));panel.append(label);
   const save=document.createElement('button');save.type='button';save.textContent=zh()?'保存至 My Reality':'Save to My Reality';panel.append(save);
   save.onclick=async()=>{if(!consent.checked)return;save.disabled=true;try{const record=await request({action:'SAVE',sourceVersion:result.sourceVersion,retentionDays:7,currentRealityConsent:{processing:true,persistence:true,retention:true}});status.textContent=zh()?'已保存；未创建方向、位置或历史。':'Saved; no direction, position or history was created.';for(const target of record.handoffTargets){const a=document.createElement('a');a.href=target.href;a.textContent=target.label;panel.append(a);}}catch(error){status.textContent=error.message;save.disabled=false;}};
  }catch(error){status.textContent=error.message;button.disabled=false;}
 };
}
