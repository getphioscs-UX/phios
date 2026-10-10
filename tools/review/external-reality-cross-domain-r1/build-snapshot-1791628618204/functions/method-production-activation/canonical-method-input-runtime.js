const METHOD_RULES = Object.freeze({
  NUMEROLOGY: Object.freeze({ capabilities: ['CALCULATION'], require: ['birthDate','calendarCode'] }),
  ASTROLOGY: Object.freeze({ capabilities: ['CALCULATION','PLANETS','HOUSES','ASPECTS'], require: ['birthDate','birthTime','birthPlace','timezone','calendarCode'], knownTime: true }),
  BAZI: Object.freeze({ capabilities: ['CALCULATION','THREE_PILLARS','FOUR_PILLARS','LUCK_CYCLE'], require: ['birthDate','birthPlace','timezone','calendarCode'] }),
  HUMAN_DESIGN: Object.freeze({ capabilities: ['CALCULATION'], require: ['birthDate','birthTime','birthPlace','timezone','calendarCode'], knownTime: true }),
  I_CHING: Object.freeze({ capabilities: [] }), TAROT: Object.freeze({ capabilities: [] }), PSYCHOLOGY: Object.freeze({ capabilities: [] })
});
const PRECISIONS = new Set(['exact','approximate','unknown']);
function text(v){ return typeof v === 'string' && v.trim() ? v.trim() : null; }
function validDate(v){ if(!/^\d{4}-\d{2}-\d{2}$/.test(v||'')) return false; const d=new Date(`${v}T00:00:00.000Z`); return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10)===v; }
function validTime(v){ return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v||''); }
function assertPrecision(p,label){ if(!PRECISIONS.has(p)) throw new TypeError(`${label} precision is invalid.`); }
function coords(v){ if(v==null) return null; if(typeof v!=='object'||Array.isArray(v)) throw new TypeError('coordinates must be an object or null.'); const latitude=Number(v.latitude), longitude=Number(v.longitude); if(!Number.isFinite(latitude)||latitude < -90||latitude > 90||!Number.isFinite(longitude)||longitude < -180||longitude > 180) throw new TypeError('coordinates are invalid.'); return Object.freeze({latitude,longitude,elevationM:v.elevationM==null?null:Number(v.elevationM),accuracyM:v.accuracyM==null?null:Number(v.accuracyM)}); }
export function createCanonicalMethodInput(input={}){
  const rule=METHOD_RULES[input.methodCode]; if(!rule) throw new TypeError('Unknown methodCode.');
  if(rule.capabilities.length===0) throw new Error('METHOD_INPUT_CONTRACT_NOT_DEFINED');
  const caps=[...(input.requestedCapabilities||[])]; if(caps.length===0||caps.some(x=>!rule.capabilities.includes(x))) throw new TypeError('requestedCapabilities are not allowed for this Method input contract.');
  const precision={...(input.inputPrecision||{})}; for(const key of ['date','time','place','timezone','coordinates']) assertPrecision(precision[key],key);
  const birthDate=text(input.birthDate), birthTime=text(input.birthTime), birthPlace=text(input.birthPlace), timezone=text(input.timezone), calendarCode=text(input.calendarCode);
  if(birthDate!==null&&!validDate(birthDate)) throw new TypeError('birthDate must be a valid YYYY-MM-DD date.');
  if(birthTime!==null&&!validTime(birthTime)) throw new TypeError('birthTime must be HH:MM or HH:MM:SS.');
  if(precision.date==='unknown' && birthDate!==null) throw new TypeError('Unknown birthDate precision requires null birthDate.');
  if(precision.time==='unknown' && birthTime!==null) throw new TypeError('Unknown birthTime precision requires null birthTime.');
  if(precision.place==='unknown' && birthPlace!==null) throw new TypeError('Unknown birthPlace precision requires null birthPlace.');
  if(precision.timezone==='unknown' && timezone!==null) throw new TypeError('Unknown timezone precision requires null timezone.');
  if(timezone!==null && !/^[A-Za-z_+\-]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(timezone)) throw new TypeError('timezone must be an IANA zone identifier.');
  const coordinates=coords(input.coordinates); if(precision.coordinates==='unknown' && coordinates!==null) throw new TypeError('Unknown coordinate precision requires null coordinates.');
  const values={birthDate,birthTime,birthPlace,timezone,calendarCode};
  for(const field of rule.require||[]) if(values[field]==null) throw new TypeError(`${field} is required for ${input.methodCode}.`);
  if(rule.knownTime && precision.time==='unknown') throw new TypeError(`${input.methodCode} requires known birthTime for this calculation profile.`);
  if(input.methodCode==='BAZI' && (caps.includes('FOUR_PILLARS')||caps.includes('LUCK_CYCLE')) && (birthTime===null||precision.time==='unknown')) throw new TypeError('BAZI FOUR_PILLARS/LUCK_CYCLE requires known birthTime.');
  if(input.fabricatedDefaultsUsed===true) throw new Error('FABRICATED_DEFAULT_FORBIDDEN');
  if(typeof input.customerConfirmation!=='boolean') throw new TypeError('customerConfirmation must be explicit boolean.');
  const source=input.source; if(!source||typeof source!=='object'||!text(source.sourceType)||!text(source.sourceReference)||!text(source.sourceVersion)) throw new TypeError('source is required.');
  const consentRecordId=text(input.consentRecordId), purposeCode=text(input.purposeCode); if(!consentRecordId||!purposeCode) throw new TypeError('consentRecordId and purposeCode are required.');
  return Object.freeze({schemaVersion:'PHI-OS-MPA-CANONICAL-METHOD-INPUT-v1.0.0',inputId:text(input.inputId)||(()=>{throw new TypeError('inputId is required.');})(),subjectReference:text(input.subjectReference)||(()=>{throw new TypeError('subjectReference is required.');})(),methodCode:input.methodCode,methodVersion:text(input.methodVersion)||(()=>{throw new TypeError('methodVersion is required.');})(),requestedCapabilities:Object.freeze(caps),birthDate,birthTime,birthPlace,timezone,coordinates,calendarCode,inputPrecision:Object.freeze(precision),source:Object.freeze({...source}),customerConfirmation:input.customerConfirmation,consentRecordId,purposeCode,fabricatedDefaultsUsed:false});
}
export default Object.freeze({createCanonicalMethodInput});
