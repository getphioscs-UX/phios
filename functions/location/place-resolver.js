import {resolveTimezoneForCoordinates} from './timezone-resolver.js';
const DEFAULT_LOOKUP='https://nominatim.openstreetmap.org/lookup';
const APP_USER_AGENT='PHI-OS/1.0 (+https://getphios.com)';
const clean=v=>String(v??'').trim();
function normalizeRef(v){const ref=clean(v).toUpperCase();return /^[NWR][0-9]+$/.test(ref)?ref:null}
function normalize(row){const a=row?.address||{};return {displayName:clean(row?.display_name),countryCode:clean(a.country_code).toUpperCase()||null,country:clean(a.country)||null,region:clean(a.state||a.region||a.county)||null,locality:clean(a.city||a.town||a.village||a.municipality||a.county||row?.name)||null,latitude:Number(row?.lat),longitude:Number(row?.lon)} }
export async function resolveBirthPlace(providerRef,{birthDate=null,birthTime=null,locale='en',env={}}={}){
  const ref=normalizeRef(providerRef);if(!ref)throw Object.assign(new Error('LOCATION_SELECTION_REQUIRED'),{code:'LOCATION_SELECTION_REQUIRED'});
  const endpoint=clean(env?.PHIOS_GEOCODING_LOOKUP_ENDPOINT)||DEFAULT_LOOKUP;const url=new URL(endpoint);url.searchParams.set('osm_ids',ref);url.searchParams.set('format','jsonv2');url.searchParams.set('addressdetails','1');
  const response=await fetch(url,{headers:{accept:'application/json','accept-language':locale==='zh-Hans'?'zh-CN,zh;q=0.9,en;q=0.7':'en','user-agent':APP_USER_AGENT,'referer':'https://getphios.com/'}});if(!response.ok)throw Object.assign(new Error('LOCATION_RESOLVE_PROVIDER_UNAVAILABLE'),{code:'LOCATION_RESOLVE_PROVIDER_UNAVAILABLE',status:response.status});
  const rows=await response.json();const place=normalize(Array.isArray(rows)?rows[0]:null);if(!place.displayName||!Number.isFinite(place.latitude)||!Number.isFinite(place.longitude))throw Object.assign(new Error('LOCATION_NOT_RESOLVED'),{code:'LOCATION_NOT_RESOLVED'});
  const timezone=await resolveTimezoneForCoordinates({latitude:place.latitude,longitude:place.longitude,birthDate,birthTime,env});
  return Object.freeze({provider:'OPENSTREETMAP_NOMINATIM',providerRef:ref,state:'CONFIRMED',...place,timezone,resolvedAt:new Date().toISOString()});
}
