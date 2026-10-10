// Projection of existing source records, bounded by W8-I accepted references.
// Never promotes an unaccepted lane or infers freshness from acceptance.
const cache=new Map();
export async function loadWorldAcceptedClaims(id,projection){
 if(!projection?.acceptedPositions?.length)return [];
 const code=id.replace('DOSSIER-','').toLowerCase();const p=['us','cn'].includes(code)?'/content/civilization-atlas/reconfiguration/runtime-position-w8c-current-evidence-ir-v1.json':'/content/civilization-atlas/reconfiguration/dossier-'+code+'-w8c-current-authority-admission-v1.json';
 if(!cache.has(p))cache.set(p,fetch(p).then(r=>{if(!r.ok)throw Error('CURRENT_CLAIM_SOURCE_UNAVAILABLE');return r.json();}).catch(e=>{cache.delete(p);throw e;}));
 const sources=await cache.get(p),refs=new Set(projection.acceptedPositions.flatMap(x=>x.evidenceRefs));
 return (sources.records||[]).filter(r=>refs.has(r.claimId)&&(!r.dossierId||r.dossierId===id)&&r.claimText&&(r.admissionDecision==='ADMITTED'||r.evidenceState==='CWA_ADMITTED')).map(r=>({claimId:r.claimId,text:r.claimText,sourceUrl:r.sourceUrl,retrievedAt:projection.sourceEvidence?.find(s=>s.claimId===r.claimId)?.retrievedAt||null,subsystems:projection.acceptedPositions.filter(p=>p.evidenceRefs.includes(r.claimId)).map(p=>p.subsystem)}));
}
