// URL scope is server-owned; client fields cannot select another engine.
const methods=Object.freeze({bazi:'bazi',ziwei:'ziwei',astrology:'astrology',numerology:'numeric','phi-configuration':'ecr'});
export function scopedMethodReadingR2(owner){return async context=>{
 const response=(error,status)=>Response.json({ok:false,error},{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
 const slug=context.params?.method;if(!Object.hasOwn(methods,slug))return response(slug==='human-design'?'HD_CONFIRMATION_OWNER_REQUIRED':'METHOD_ROUTE_INVALID',422);
 let body;try{body=await context.request.clone().json();}catch{return response('INVALID_JSON',400);}
 if(!Array.isArray(body?.methods)||body.methods.length!==1||body.methods[0]!==methods[slug])return response('METHOD_SCOPE_MISMATCH',403);
 if(body.confirmedExternalProfile!=null||body.externalProfileContextConsent===true)return response('METHOD_SCOPE_MISMATCH',403);
 if(body.consent!==true)return response('PERSONAL_REALITY_PROCESSING_CONSENT_REQUIRED',403);
 const result=await owner(context);if(result.ok){const payload=await result.clone().json();const view=payload.view;const freeChart=view?.productRoute?.primaryProduct?.freeChartSource;const hasFreeBaziChart=slug==='bazi'&&freeChart?.methodId==='BZR'&&freeChart.publicationDecision?.customerPublishable===true&&[3,4].includes(freeChart.structuralModel?.pillars?.length)&&['YEAR','MONTH','DAY'].every(position=>freeChart.structuralModel.pillars.some(p=>p.position===position))&&new Set(freeChart.structuralModel.pillars.map(p=>p.position)).size===freeChart.structuralModel.pillars.length&&freeChart.structuralModel.pillars.every(p=>['YEAR','MONTH','DAY','HOUR'].includes(p.position)&&p.stem?.sourceRef&&p.branch?.sourceRef);const visible=(view?.reading?.methods?.length||0)+(view?.structure?.methods?.length||0)+Object.keys(view?.methodNativeReading||{}).length+(hasFreeBaziChart?1:0);if(payload.ok&&visible===0)return response('METHOD_FREE_READING_UNAVAILABLE',422);}return result;
};}
