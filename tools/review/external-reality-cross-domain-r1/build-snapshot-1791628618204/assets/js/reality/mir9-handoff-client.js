async function post(payload){const r=await fetch('/api/reality-escalation-v1',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});const data=await r.json().catch(()=>({ok:false,error:{code:'INVALID_RESPONSE'}}));if(!r.ok||data.ok===false)throw Object.assign(new Error(data?.error?.code||'MIR9_REALITY_ESCALATION_FAILED'),{code:data?.error?.code||'MIR9_REALITY_ESCALATION_FAILED'});return data;}
export const evaluateRealityEscalation=input=>post({action:'EVALUATE',...input});
export const createRealityEscalationHandoff=input=>post({action:'HANDOFF',...input});
export const MIR9_CANONICAL_WORKSPACE='/reality/';
