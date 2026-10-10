import crypto from 'node:crypto';
import {ZWR_MEANING_AUTHORITIES} from './zi-wei-meaning-authorities.generated.js';

const {ontology:ONTOLOGY,mapping:MAPPING,locale:LOCALE,activation:ACTIVATION}=ZWR_MEANING_AUTHORITIES;

const stable=v=>{const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;return crypto.createHash('sha256').update(JSON.stringify(canon(v))).digest('hex')};
const group=(p,c)=>(p.calculation?.structures||[]).find(x=>x.code===c);
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};

function assertProjection(p){
  if(p?.schemaVersion!=='PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0'||p?.method?.publicMethodCode!=='ZI_WEI_PROJECTION'||p?.projection?.productionResult!==true||p?.execution?.mpaDecision?.authorityOwner!=='MPA'||p?.execution?.mpaDecision?.dispatchAllowed!==true)
    throw Object.assign(new Error('CMP_ZWR_PRODUCTION_PROJECTION_REQUIRED'),{code:'CMP_ZWR_PRODUCTION_PROJECTION_REQUIRED'});
  const active=ACTIVATION.methods.find(x=>x.pluginCode==='ZWR');
  if(!active?.productionActivated||!active?.acceptancePassed)
    throw Object.assign(new Error('CMP_METHOD_PRODUCTION_NOT_ACTIVATED'),{code:'CMP_METHOD_PRODUCTION_NOT_ACTIVATED'});
}

export function buildZiWeiCanonicalMeaningBundle(projection){
  assertProjection(projection);
  const ontology=new Map(ONTOLOGY.items.map(x=>[x.meaningCode,x]));
  const items=[];
  for(const m of MAPPING.mappings){
    const g=group(projection,m.selector.groupCode);
    if(!(g?.items||[]).some(x=>x.code===m.selector.code))continue;
    const o=ontology.get(m.targetMeaningCode);
    if(!o)throw Object.assign(new Error('CMP_ZWR_MEANING_NOT_ADMITTED'),{code:'CMP_ZWR_MEANING_NOT_ADMITTED'});
    items.push(freeze({meaningCode:o.meaningCode,meaningVersion:'1.0.0',meaningType:o.meaningType,sourceProjectionRef:{projectionId:projection.projectionId,publicMethodCode:'ZI_WEI_PROJECTION',selector:m.selector},sourceFields:m.sourceFields,mappingLineage:{mappingCode:m.mappingCode,mappingVersion:m.mappingVersion},semanticDigest:o.semanticDigest,status:'PRODUCTION'}));
  }
  if(!items.length)throw Object.assign(new Error('CMP_ZWR_MEANING_UNRESOLVED'),{code:'CMP_ZWR_MEANING_UNRESOLVED'});
  const core={schemaVersion:'PHI-OS-CANONICAL-MEANING-PRODUCTION-BUNDLE-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',publicMethodCode:'ZI_WEI_PROJECTION',sourceProjection:{projectionId:projection.projectionId,projectionSchemaVersion:projection.schemaVersion},items};
  return freeze({...core,bundleDigest:stable(core),bundleCode:`CMP-ZWR-${stable(core).slice(0,20).toUpperCase()}`});
}

export function projectZiWeiMeaningLocale(bundle,locale='en'){
  const use=locale==='zh-Hans'?'zh-Hans':'en',by=new Map(LOCALE.items.map(x=>[x.meaningCode,x]));
  const items=bundle.items.map(x=>{const l=by.get(x.meaningCode)?.locales?.[use];if(!l)throw Object.assign(new Error('CMP_ZWR_LOCALE_MISSING'),{code:'CMP_ZWR_LOCALE_MISSING'});return freeze({meaningCode:x.meaningCode,label:l.label,definition:l.definition})});
  return freeze({schemaVersion:'PHI-OS-CANONICAL-MEANING-LOCALE-PROJECTION-v1.0.0',locale:use,bundleCode:bundle.bundleCode,items});
}
