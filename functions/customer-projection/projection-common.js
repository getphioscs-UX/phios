export const CX_PROJECTION_VERSION='PHI-OS-CX-CUSTOMER-PROJECTION-v1.0.0';
export const clean=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
export const list=value=>Array.isArray(value)?value:[];
export const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
export const localeOf=value=>value==='zh-Hans'?'zh-Hans':'en';
export const text=(locale,en,zh)=>localeOf(locale)==='zh-Hans'?zh:en;
export const finite=value=>Number.isFinite(value)?value:null;
export const uniq=items=>[...new Set(list(items).filter(v=>v!==null&&v!==undefined&&v!==''))];
export function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))deepFreeze(item)}return value;}
export function safeUrl(value){const v=clean(value);if(!v)return null;try{const u=new URL(v,'https://phios.invalid');if(u.origin==='https://phios.invalid')return u.pathname+u.search+u.hash;if(u.protocol!=='https:')return null;return u.toString()}catch{return null}}
export function humanize(code){return clean(code).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
export function displayValue(value){if(value===null||value===undefined||value==='')return null;if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return value;if(Array.isArray(value))return value.map(displayValue).filter(v=>v!==null);return null;}
export function customerEmpty(locale,code='NOT_AVAILABLE'){return deepFreeze({state:code,label:text(locale,'Not available yet','目前尚不可用')});}
export function boundary(){return deepFreeze({createsAuthority:false,calculates:false,infersNewFinding:false,changesMeaning:false,recommends:false,createsTruth:false});}
