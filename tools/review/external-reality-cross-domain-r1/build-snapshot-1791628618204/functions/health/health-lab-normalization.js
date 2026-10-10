const n=v=>String(v??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export function normalizeLabObservation(observation={},registry={}){
  const label=n(observation.label||observation.name),unit=String(observation.unit||'').trim();
  const analyte=(registry.analytes||[]).find(a=>(a.aliases||[]).map(n).includes(label));
  if(!analyte)return {matched:false,code:null,label:observation.label||null,value:observation.value??null,unit:unit||null,referenceRange:observation.referenceRange||null,governance:{clinicalInterpretation:false}};
  return {matched:true,code:analyte.code,canonicalLabel:analyte.label,sourceLabel:observation.label||observation.name,value:observation.value??null,unit:unit||null,unitRecognized:!unit||analyte.units.includes(unit),referenceRange:observation.referenceRange||null,governance:{referenceRangePreservedFromSourceOnly:true,normalAbnormalClassification:false,unitConverted:false,clinicalInterpretation:false}};
}
