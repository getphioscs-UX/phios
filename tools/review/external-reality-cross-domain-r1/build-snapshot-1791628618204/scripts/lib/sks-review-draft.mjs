export function validateDraft(packet,draft){
 const errors=[],allowed=['NOT_REVIEWED','APPROVE_PROPOSAL','REQUEST_CHANGE','NEEDS_EVIDENCE','REJECT'];
 if(draft.sourceDigest!==packet.sourceDigest)errors.push('STALE_PACKET');
 if(typeof draft.reviewer!=='string'||!draft.reviewer.trim())errors.push('REVIEWER_REQUIRED');
 if(draft.humanAcceptanceApplied!==false)errors.push('DRAFT_CANNOT_APPLY_ACCEPTANCE');
 const rows=Array.isArray(draft.decisions)?draft.decisions:[];
 if(rows.length!==packet.decisions.length||new Set(rows.map(r=>r.id)).size!==rows.length)errors.push('INCOMPLETE_OR_DUPLICATE_DECISIONS');
 for(const row of rows){if(!packet.decisions.some(d=>d.id===row.id))errors.push('UNKNOWN_DECISION');if(!allowed.includes(row.decision))errors.push('INVALID_DECISION');if(['REQUEST_CHANGE','NEEDS_EVIDENCE','REJECT'].includes(row.decision)&&!row.note?.trim())errors.push('REASON_REQUIRED');}
 return {validDraft:!errors.length,errors,unreviewed:rows.filter(r=>r.decision==='NOT_REVIEWED').length,humanAcceptanceApplied:false,productionActivationAllowed:false};
}
