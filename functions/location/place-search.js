const DEFAULT_ENDPOINT='https://nominatim.openstreetmap.org/search';
const APP_USER_AGENT='PHI-OS/1.0 (+https://getphios.com)';
const cache=new Map();
const clean=v=>String(v??'').trim();
function clampLimit(v){const n=Number(v);return Number.isFinite(n)?Math.max(1,Math.min(8,Math.trunc(n))):6}
function language(locale){return locale==='zh-Hans'?'zh-CN,zh;q=0.9,en;q=0.7':'en'}
function candidate(row){
  const a=row?.address||{};
  const locality=a.city||a.town||a.village||a.municipality||a.county||row?.name||'';
  const region=a.state||a.region||a.county||'';
  const country=a.country||'';
  const label=clean(row?.display_name)||[locality,region,country].filter(Boolean).join(', ');
  const type=String(row?.osm_type||'').toUpperCase();
  const prefix=type==='NODE'?'N':type==='WAY'?'W':type==='RELATION'?'R':'';
  return Object.freeze({provider:'OPENSTREETMAP_NOMINATIM',providerRef:prefix&&row?.osm_id?`${prefix}${row.osm_id}`:null,label,locality:clean(locality)||null,region:clean(region)||null,country:clean(country)||null,countryCode:clean(a.country_code).toUpperCase()||null,latitude:Number(row?.lat),longitude:Number(row?.lon)});
}
export async function searchBirthPlaces(query,{locale='en',limit=6,env={}}={}){
  const q=clean(query); if(q.length<2) return Object.freeze([]);
  const key=`${locale}:${q.toLowerCase()}:${limit}`; const hit=cache.get(key); if(hit&&Date.now()-hit.at<10*60*1000)return hit.value;
  const endpoint=clean(env?.PHIOS_GEOCODING_SEARCH_ENDPOINT)||DEFAULT_ENDPOINT;
  const url=new URL(endpoint);url.searchParams.set('q',q);url.searchParams.set('format','jsonv2');url.searchParams.set('addressdetails','1');url.searchParams.set('limit',String(clampLimit(limit)));url.searchParams.set('dedupe','1');
  const response=await fetch(url,{headers:{'accept':'application/json','accept-language':language(locale),'user-agent':APP_USER_AGENT,'referer':'https://getphios.com/'}});
  if(!response.ok)throw Object.assign(new Error('LOCATION_SEARCH_PROVIDER_UNAVAILABLE'),{code:'LOCATION_SEARCH_PROVIDER_UNAVAILABLE',status:response.status});
  const rows=await response.json();
  const out=Object.freeze((Array.isArray(rows)?rows:[]).map(candidate).filter(x=>x.providerRef&&Number.isFinite(x.latitude)&&Number.isFinite(x.longitude)&&x.label).slice(0,clampLimit(limit)));
  cache.set(key,{at:Date.now(),value:out}); return out;
}
export const LOCATION_SEARCH_ATTRIBUTION=Object.freeze({label:'OpenStreetMap contributors',url:'https://www.openstreetmap.org/copyright'});
