import {locale,postJson,tr} from './surfaces/runtime-ui.js';
// One-time, same-origin transport. Private data stays in memory, never in a URL or browser storage.
export async function handoffToMyReality({sourceType,viewModel,statusNode}={}){
 const nonce=crypto.randomUUID(),child=window.open('/reality/?handoff=1&locale='+encodeURIComponent(locale())+'#'+nonce,'_blank');
 if(!child)throw new Error('MY_REALITY_WINDOW_BLOCKED');
 let payload=null,ready=false,sent=false;
 const tell=text=>{if(statusNode)statusNode.textContent=text;};
 const send=()=>{if(payload&&ready&&!sent){sent=true;child.postMessage({type:'PHIOS_CX_REALITY_HANDOFF',nonce,viewModel:payload.workspace||payload.view},location.origin);}};
 const handler=event=>{
  if(event.origin!==location.origin||event.source!==child||event.data?.nonce!==nonce)return;
  if(event.data.type==='PHIOS_CX_MY_REALITY_READY'){ready=true;send();}
  if(event.data.type==='PHIOS_CX_MY_REALITY_RECEIVED'&&sent){cleanup();tell(tr('My Reality received the selected information. Nothing was saved automatically.','My Reality 已收到所选资料；没有自动保存。'));}
 };
 const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',handler);payload=null;};
 const timer=setTimeout(()=>{cleanup();tell(tr('The handoff timed out. Your result remains here; return and try again.','交接超时。本次结果仍保留在这里，请返回后重试。'));},15000);
 window.addEventListener('message',handler);
 try{payload=await postJson('/api/customer-reality-handoff',{sourceType,viewModel,locale:locale(),consent:{explicit:true,accepted:true}});send();return payload;}
 catch(error){cleanup();if(!child.closed)child.close();throw error;}
}
