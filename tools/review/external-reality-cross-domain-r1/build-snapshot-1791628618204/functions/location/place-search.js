const DEFAULT_ENDPOINT='https://nominatim.openstreetmap.org/search';
const APP_USER_AGENT='PHI-OS/1.0 (+https://getphios.com)';
const cache=new Map();
const clean=v=>String(v??'').trim();
const unique=items=>[...new Set(items.map(clean).filter(Boolean))];
function clampLimit(v){const n=Number(v);return Number.isFinite(n)?Math.max(1,Math.min(8,Math.trunc(n))):6}
function hasHan(value){return /[\u3400-\u9fff]/u.test(String(value||''))}
function hasLatin(value){return /[A-Za-z]/.test(String(value||''))}
function language(locale,query=''){
  if(locale!=='zh-Hans')return 'en';
  // A Chinese interface must still accept the place name the person actually knows.
  // Latin queries are searched against English names first, while namedetails lets us
  // present the Chinese name when the provider has one (Seremban -> 芙蓉).
  if(hasLatin(query)&&!hasHan(query))return 'en,zh-CN;q=0.95,zh;q=0.9';
  return 'zh-CN,zh;q=0.95,en;q=0.75';
}
function named(row,code){return clean(row?.namedetails?.[code])}
function preferredNames(row,locale){
  const a=row?.address||{};
  const fallback=clean(a.city||a.town||a.village||a.municipality||a.county||row?.name);
  const zh=named(row,'name:zh-Hans')||named(row,'name:zh-CN')||named(row,'name:zh');
  const en=named(row,'name:en')||clean(row?.name)||fallback;
  const local=locale==='zh-Hans'?(zh||fallback||en):(en||fallback||zh);
  const alternate=locale==='zh-Hans'&&en&&en!==local?en:locale!=='zh-Hans'&&zh&&zh!==local?zh:null;
  return {local,alternate,zh:zh||null,en:en||null};
}
function candidate(row,{locale='en'}={}){
  const a=row?.address||{};const names=preferredNames(row,locale);
  const locality=names.local||clean(a.city||a.town||a.village||a.municipality||a.county||row?.name);
  const region=clean(a.state||a.region||a.county);
  const country=clean(a.country);
  const type=String(row?.osm_type||'').toUpperCase();
  const prefix=type==='NODE'?'N':type==='WAY'?'W':type==='RELATION'?'R':'';
  const secondary=unique([names.alternate,region,country]).filter(x=>x!==locality).join(' · ');
  const providerDisplayName=clean(row?.display_name)||[locality,region,country].filter(Boolean).join(', ');
  return Object.freeze({
    provider:'OPENSTREETMAP_NOMINATIM',providerRef:prefix&&row?.osm_id?`${prefix}${row.osm_id}`:null,
    label:locality||providerDisplayName,primaryLabel:locality||providerDisplayName,secondaryLabel:secondary||null,
    localizedName:names.zh,englishName:names.en,providerDisplayName,
    locality:clean(locality)||null,region:region||null,country:country||null,countryCode:clean(a.country_code).toUpperCase()||null,
    latitude:Number(row?.lat),longitude:Number(row?.lon)
  });
}
export async function searchBirthPlaces(query,{locale='en',limit=6,env={}}={}){
  const q=clean(query); if(q.length<2) return Object.freeze([]);
  const key=`${locale}:${q.toLowerCase()}:${limit}`; const hit=cache.get(key); if(hit&&Date.now()-hit.at<10*60*1000)return hit.value;
  const endpoint=clean(env?.PHIOS_GEOCODING_SEARCH_ENDPOINT)||DEFAULT_ENDPOINT;
  const url=new URL(endpoint);url.searchParams.set('q',q);url.searchParams.set('format','jsonv2');url.searchParams.set('addressdetails','1');url.searchParams.set('namedetails','1');url.searchParams.set('limit',String(clampLimit(limit)));url.searchParams.set('dedupe','1');
  const response=await fetch(url,{headers:{'accept':'application/json','accept-language':language(locale,q),'user-agent':APP_USER_AGENT,'referer':'https://getphios.com/'}});
  if(!response.ok)throw Object.assign(new Error('LOCATION_SEARCH_PROVIDER_UNAVAILABLE'),{code:'LOCATION_SEARCH_PROVIDER_UNAVAILABLE',status:response.status});
  const rows=await response.json();
  const seen=new Set();const out=[];
  for(const row of Array.isArray(rows)?rows:[]){const item=candidate(row,{locale});if(!item.providerRef||!Number.isFinite(item.latitude)||!Number.isFinite(item.longitude)||!item.label||seen.has(item.providerRef))continue;seen.add(item.providerRef);out.push(item);if(out.length>=clampLimit(limit))break;}
  const frozen=Object.freeze(out);cache.set(key,{at:Date.now(),value:frozen});return frozen;
}
export const LOCATION_SEARCH_ATTRIBUTION=Object.freeze({label:'OpenStreetMap contributors',url:'https://www.openstreetmap.org/copyright'});
