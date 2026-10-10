export async function prepareRealityOrchestration({sourceType,source,locale=document.documentElement.lang==='zh-Hans'?'zh-Hans':'en',target='REALITY_ENTRY'}={}){
  const response=await fetch('/api/reality-orchestrate',{method:'POST',headers:{'content-type':'application/json',Accept:'application/json'},cache:'no-store',credentials:'same-origin',body:JSON.stringify({sourceType,source,locale,target})});
  const payload=await response.json();if(!response.ok||!payload?.ok)throw new Error(payload?.error?.code||'REALITY_ORCHESTRATION_PREPARE_FAILED');return payload;
}
export async function openRealityEntryWithBundle(options={}){
  const payload=await prepareRealityOrchestration(options);const child=window.open(`/reality-entry?stage15=handoff&source=${encodeURIComponent(options.sourceType||'')}`,'_blank');if(!child)throw new Error('REALITY_ENTRY_POPUP_BLOCKED');
  const handler=event=>{if(event.origin!==location.origin||event.source!==child||event.data?.type!=='PHIOS_REALITY_ENTRY_READY')return;child.postMessage({type:'PHIOS_REALITY_ORCHESTRATION_BUNDLE',bundle:payload.bundle},location.origin);window.removeEventListener('message',handler)};window.addEventListener('message',handler);return payload;
}
