// Deterministic English agreement only; numbers, claims and authority are preserved.
export function repairPersonalEvidenceEnglish(text){
 return String(text).replace(/All 1 domains here come from the evidence records: ([^.]+)\. They are entry points into the material, rather than interchangeable ability scores\./g,'The 1 recorded domain here comes from the evidence records: $1. It is an entry point into the material, rather than an interchangeable ability score.')
 .replace(/\b1 evidence records\b/g,'1 evidence record').replace(/\b1 recorded domains\b/g,'1 recorded domain').replace(/\b1 source-identified records\b/g,'1 source-identified record').replace(/\b1 records come\b/g,'1 record comes').replace(/\b1 task records provide\b/g,'1 task record provides');
}
export function grammarOnlySnapshot(value){
 if(Array.isArray(value))return value.map(grammarOnlySnapshot);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,grammarOnlySnapshot(v)]));
 return typeof value==='string'?repairPersonalEvidenceEnglish(value):value;
}
