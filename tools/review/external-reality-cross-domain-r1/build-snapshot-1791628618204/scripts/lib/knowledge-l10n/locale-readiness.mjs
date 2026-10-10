import fs from 'node:fs'; import path from 'node:path';
const load=(root,rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
export function assertLocaleBriefReady(root,nodeCode,locale){
 const freeze=load(root,'content/knowledge/l10n/knr-l10n-w1-freeze-v1.json');
 if(freeze.status!=='KNR-L10N-W1-v1.0.0-Frozen') throw Object.assign(new Error('KNR-L10N_W1_FREEZE_REQUIRED'),{code:'KNR_L10N_W1_FREEZE_REQUIRED'});
 const allowed=load(root,'content/knowledge/l10n/locale-controlled-values.json').supportedLocales;
 if(!allowed.includes(locale)) throw Object.assign(new Error(`Unsupported locale: ${locale}`),{code:'LOCALE_NOT_SUPPORTED'});
 const projection=load(root,'content/knowledge/l10n/multilingual-node-projection-registry.json').records.find(x=>x.nodeCode===nodeCode);
 if(!projection) throw Object.assign(new Error(`Missing multilingual projection: ${nodeCode}`),{code:'LOCALE_PROJECTION_MISSING'});
 const p=projection.locales[locale]; if(!p||p.availability!=='available') throw Object.assign(new Error(`Locale discovery/review incomplete: ${nodeCode} ${locale}`),{code:'LOCALE_DISCOVERY_INCOMPLETE'});
 if(p.authority==='unassigned'||p.translationMode==='none'||p.stalenessStatus==='stale') throw Object.assign(new Error(`Locale authority not ready: ${nodeCode} ${locale}`),{code:'LOCALE_AUTHORITY_NOT_READY'});
 return true;
}
