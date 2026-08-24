const n=v=>String(v||'').toLowerCase();
export function resolveWarningSignals(text, registry={}){const q=n(text);return (registry.signals||[]).filter(s=>(s.triggers||[]).some(t=>q.includes(n(t))));}
export function highestCareState(signals=[]){const r={EMERGENCY:5,URGENT_EVALUATION:4,PROMPT_MEDICAL_REVIEW:3,ROUTINE_CLINIC_REVIEW:2,ROUTINE_SELF_OBSERVATION:1};return [...signals].sort((a,b)=>(r[b.responseClass]||0)-(r[a.responseClass]||0))[0]?.responseClass||'CONTEXT_REQUIRED';}
