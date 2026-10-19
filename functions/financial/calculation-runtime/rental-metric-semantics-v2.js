// Versioned metric algebra. Missing precision/timing is not a new customer fact.
export const RENTAL_METRIC_CONTRACT='RENTAL_METRICS_V2';
export const rentalPrecision=metrics=>metrics.some(m=>m.value===null||m.precision==='UNKNOWN')?'UNKNOWN':metrics.some(m=>m.precision==='UNSPECIFIED')?'UNSPECIFIED':metrics.some(m=>m.precision==='APPROXIMATE')?'APPROXIMATE':'EXACT';
export function rentalMetric(value,precision='EXACT',reasons=[]){return {value,precision:value===null?'UNKNOWN':precision,availability:value===null?'UNKNOWN':'AVAILABLE',reasons:[...new Set(reasons)]};}
export function rentalAggregate(items,{money,minor,subtract=false}){
 const precision=rentalPrecision(items),reasons=items.flatMap(m=>m.reasons||[]);
 if(items.some(m=>m.value===null))return rentalMetric(null,'UNKNOWN',reasons);
 const signed=v=>v.startsWith('-')?-minor(v.slice(1)):minor(v);
 return rentalMetric(money(items.reduce((n,m,i)=>n+(subtract&&i>0?-1n:1n)*signed(m.value),0n)),precision,reasons);
}
