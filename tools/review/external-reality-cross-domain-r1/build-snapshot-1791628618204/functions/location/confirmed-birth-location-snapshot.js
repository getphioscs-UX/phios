export const CONFIRMED_BIRTH_LOCATION_SNAPSHOT_SCHEMA='PHI-OS-CONFIRMED-BIRTH-LOCATION-SNAPSHOT-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const clean=value=>String(value??'').trim();
const normalizeTime=value=>{const v=clean(value);if(!v)return null;if(/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v))return `${v}:00`;if(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(v))return v;return null};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(new Date(`${value}T00:00:00.000Z`).valueOf());
const validOffset=value=>/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(value||'');
function validIana(value){try{new Intl.DateTimeFormat('en',{timeZone:value}).format(new Date(0));return true}catch{return false}}
function fail(code){const error=new Error(code);error.code=code;throw error}
function stableLocation(location){
  const latitude=Number(location?.latitude),longitude=Number(location?.longitude),providerRef=clean(location?.providerRef).toUpperCase();
  if(!/^[NWR][0-9]+$/.test(providerRef))fail('CONFIRMED_BIRTH_LOCATION_PROVIDER_REF_INVALID');
  if(!Number.isFinite(latitude)||latitude < -90||latitude > 90||!Number.isFinite(longitude)||longitude < -180||longitude > 180)fail('CONFIRMED_BIRTH_LOCATION_COORDINATES_INVALID');
  const iana=clean(location?.timezone?.iana),utcOffsetAtBirth=clean(location?.timezone?.utcOffsetAtBirth);
  if(!validIana(iana))fail('CONFIRMED_BIRTH_LOCATION_TIMEZONE_INVALID');
  if(!validOffset(utcOffsetAtBirth))fail('CONFIRMED_BIRTH_LOCATION_OFFSET_INVALID');
  return freeze({
    provider:clean(location?.provider)||'OPENSTREETMAP_NOMINATIM',providerRef,state:'CONFIRMED',
    displayName:clean(location?.displayName)||null,customerLabel:clean(location?.customerLabel)||null,
    localizedName:clean(location?.localizedName)||null,englishName:clean(location?.englishName)||null,
    countryCode:clean(location?.countryCode).toUpperCase()||null,country:clean(location?.country)||null,region:clean(location?.region)||null,locality:clean(location?.locality)||null,
    latitude,longitude,
    timezone:freeze({iana,utcOffsetAtBirth,historicalOffsetMinutes:Number.isFinite(Number(location?.timezone?.historicalOffsetMinutes))?Number(location.timezone.historicalOffsetMinutes):null,source:'GOVERNED_RESOLUTION',confidence:'HIGH'})
  });
}
export function createConfirmedBirthLocationSnapshot(location,{birthDate,birthTime=null}={}){
  const date=clean(birthDate),time=normalizeTime(birthTime);
  if(!validDate(date))fail('CONFIRMED_BIRTH_LOCATION_BIRTH_DATE_INVALID');
  if(clean(birthTime)&&!time)fail('CONFIRMED_BIRTH_LOCATION_BIRTH_TIME_INVALID');
  return freeze({schemaVersion:CONFIRMED_BIRTH_LOCATION_SNAPSHOT_SCHEMA,state:'CONFIRMED',binding:freeze({birthDate:date,birthTime:time}),location:stableLocation(location)});
}
export function consumeConfirmedBirthLocationSnapshot(snapshot,{providerRef,birthDate,birthTime=null}={}){
  if(snapshot?.schemaVersion!==CONFIRMED_BIRTH_LOCATION_SNAPSHOT_SCHEMA||snapshot?.state!=='CONFIRMED')fail('CONFIRMED_BIRTH_LOCATION_SNAPSHOT_REQUIRED');
  const date=clean(birthDate),time=normalizeTime(birthTime),ref=clean(providerRef).toUpperCase();
  if(!validDate(date)||snapshot?.binding?.birthDate!==date)fail('CONFIRMED_BIRTH_LOCATION_SNAPSHOT_DATE_MISMATCH');
  if(clean(birthTime)&&!time)fail('CONFIRMED_BIRTH_LOCATION_BIRTH_TIME_INVALID');
  if((snapshot?.binding?.birthTime??null)!==(time??null))fail('CONFIRMED_BIRTH_LOCATION_SNAPSHOT_TIME_MISMATCH');
  const location=stableLocation(snapshot.location);
  if(ref&&location.providerRef!==ref)fail('CONFIRMED_BIRTH_LOCATION_SNAPSHOT_PROVIDER_MISMATCH');
  return location;
}
export default Object.freeze({createConfirmedBirthLocationSnapshot,consumeConfirmedBirthLocationSnapshot});
