// Isolated owner adapter. A real public read may renew freshness only when both original CSV and metadata identities are unchanged.
export function createLocalWorldRevalidator(engine,receipt,receiptSHA256,{clock=()=>new Date().toISOString()}={}){
 return observation=>{
 const dataset=engine.data.datasets.find(d=>'DOSM:'+d.datasetId===observation.sourceId);if(!dataset||dataset.sourceVersion!==observation.sourceVersion)return null;
 const select=(url,digest)=>receipt?.checks?.find(r=>r.url===url&&r.httpStatus===200&&r.status==='BYTE_IDENTICAL_REMOTE_READ'&&r.credentialsSent===false&&r.expectedSHA256===digest&&r.actualSHA256===digest);
 const raw=select(observation.sourceUrl,dataset.sourceVersion),meta=select(observation.metadataUrl,dataset.metadataSha256);if(!raw||!meta)return null;
 const checked=Math.min(Date.parse(raw.checkedAt),Date.parse(meta.checkedAt)),now=Date.parse(clock());if(!Number.isFinite(checked)||!Number.isFinite(now)||checked>now+60000||checked+86400000<=now)return null;
 return {kind:'REAL_PUBLIC_BYTE_IDENTICAL_REVALIDATION',sourceVersion:dataset.sourceVersion,metadataSHA256:dataset.metadataSha256,checkedAt:new Date(checked).toISOString(),validUntil:new Date(checked+86400000).toISOString(),receiptSHA256,originalRetrievalPreserved:true,newDatasetOrProductionAdmission:false};
 };
}
