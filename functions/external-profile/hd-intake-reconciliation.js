// Additive intake policy; calculations and chart authority remain with their existing owners.
export const TYPE_RULES=Object.freeze({
  Generator:['To Respond','Frustration'],
  'Manifesting Generator':['To Respond','Frustration'],
  Projector:['Wait for the Invitation','Bitterness'],
  Manifestor:['Inform','Anger'],
  Reflector:['Wait a Lunar Cycle','Disappointment']
});
const TYPE_ALIASES={'生产者':'Generator','生產者':'Generator','生成者':'Generator','显示生产者':'Manifesting Generator','顯示生產者':'Manifesting Generator','显示者':'Manifestor','顯示者':'Manifestor','投射者':'Projector','反映者':'Reflector'};
const typeKey=value=>TYPE_ALIASES[String(value||'').trim()]||Object.keys(TYPE_RULES).find(key=>key.toLowerCase()===String(value||'').replaceAll('_',' ').toLowerCase());
const comparable=(field,value)=>JSON.stringify(Array.isArray(value)?value.map(item=>field==='channels'?String(item).split('-').map(Number).sort((a,b)=>a-b).join('-'):typeof item==='object'?JSON.stringify(item):String(item).toLowerCase()).sort():String(value??'').trim().toLowerCase().replace(/^wait to respond$/,'to respond'));
export function reconcileIntakeField(field,items,intakeId,selected){
  const value=selected?.normalizedValue??null;
  const conflict=items.some(item=>comparable(field,item.normalizedValue)!==comparable(field,value));
  const manual=selected?.customerConfirmed===true;
  const source=manual?'CURRENT_SESSION_MANUAL_CONFIRMATION':selected?.sourceType==='PHIOS_HDR_INTERNAL_CALCULATION_REFERENCE'?'CURRENT_BIRTH_CALCULATION':['CUSTOMER_UPLOADED_DOCUMENT','CUSTOMER_UPLOADED_IMAGE'].includes(selected?.sourceType)?'CURRENT_OFFICIAL_CHART':'UNKNOWN';
  return {currentReadingId:intakeId,source,status:value==null?'UNKNOWN':conflict?'CONFLICT':manual?'CONFIRMED':items.length>1?'CONFIRMED':source==='CURRENT_BIRTH_CALCULATION'?'CALCULATED':'EXTRACTED',manuallyOverridden:manual,lastValidatedAt:null,evidence:items.map(item=>({value:item.normalizedValue,sourceType:item.sourceType,sourceRegion:item.sourceRegion,confidence:item.extractionConfidence}))};
}
export function deriveIntakeFields(fields,intakeId){
  const type=fields.type;
  if(!type?.value||type.status==='CONFLICT')return;
  const rule=TYPE_RULES[typeKey(type.value)];if(!rule)return;
  ['strategy','notSelfTheme'].forEach((field,index)=>{
    const original=fields[field],value=rule[index];
    if(original?.manuallyOverridden)return;
    if(original?.value&&comparable(field,original.value)!==comparable(field,value)){
      fields[field]={...original,value,source:'DERIVED_FROM_CONFIRMED_STRUCTURE',sourceType:'DERIVED_FROM_CONFIRMED_STRUCTURE',status:'CONFLICT',derivedFrom:'type',alternatives:[...(original.alternatives||[]),original.value]};return;
    }
    fields[field]={...original,field,value,source:'DERIVED_FROM_CONFIRMED_STRUCTURE',sourceType:'DERIVED_FROM_CONFIRMED_STRUCTURE',status:'DERIVED',currentReadingId:intakeId,manuallyOverridden:false,derivedFrom:'type',customerConfirmed:false};
  });
}
// The existing canonical chart stores one free-text variable scalar. Preserve the established Pxx Dxx display format.
export function variableFromArrows(arrows){return Array.isArray(arrows)&&arrows.length===4&&arrows.every(x=>x==='L'||x==='R')?`P${arrows[2]}${arrows[3]} D${arrows[0]}${arrows[1]}`:null}
export function arrowsFromVariable(value){const text=String(value||'').replace(/[\s-]/g,'').toUpperCase();const d=text.match(/D([LR])([LR])/),p=text.match(/P([LR])([LR])/);return /^(D[LR]{2}P[LR]{2}|P[LR]{2}D[LR]{2})$/.test(text)?[d[1],d[2],p[1],p[2]]:[null,null,null,null]}
