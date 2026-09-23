export function resolveReportRoute(delivery,{technical=false,locked=false}={}){
 const state=delivery?.access?.state;
 if(state==='ENTITLED')return technical?'SPECIALIST_EXPLORER':'PUBLICATION_FULL';
 if(state==='FREE'||state==='LOCKED')return locked||state==='LOCKED'?'PUBLICATION_LOCKED':'PUBLICATION_PREVIEW';
 return state==='DATA_REQUIRED'?'DATA_REQUIRED':'UNAVAILABLE';
}
