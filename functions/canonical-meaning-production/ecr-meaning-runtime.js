import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
import {ECR_ATOMIC_MEANING_REGISTRY_RUNTIME} from '../embodied-configuration/ecr-meaning-registry-runtime.js';

const freeze=deepFreeze;const list=v=>Array.isArray(v)?v:[];const group=(p,c)=>list(p?.calculation?.structures).find(x=>x?.code===c);function fail(code){throw Object.assign(new Error(code),{code});}
const ACTIVE_GROUPS=Object.freeze(['ECR_CONTEXT','ECR_GRAMMAR','ECR_QUESTION','ECR_CAPABILITIES','ECR_DRIVER_PRIORITY','ECR_MOTION','ECR_CONFIGURATION','ECR_ACTIVATION']);
function selectedCodes(projection){const set=new Set();for(const code of ACTIVE_GROUPS)for(const item of list(group(projection,code)?.items)){if(code==='ECR_DRIVER_PRIORITY'&&item?.meta?.rank>3)continue;set.add(item.code)}return set;}
export async function buildEcrCanonicalMeaningBundle(projection){
 if(projection?.method?.publicMethodCode!=='EMBODIED_CONFIGURATION_PROJECTION'||projection?.projection?.status!=='COMPLETE')fail('ECR_MEANING_REQUIRES_COMPLETE_ECR_PROJECTION');
 const selected=selectedCodes(projection),entries=ECR_ATOMIC_MEANING_REGISTRY_RUNTIME.entries.filter(x=>selected.has(x.coordinate));
 const items=entries.map(entry=>freeze({meaningId:entry.meaningCode,meaningCode:entry.meaningCode,meaningVersion:entry.meaningVersion,status:'PRODUCTION',mappingLineage:freeze({mappingCode:`ECR-MAP-${entry.layer}-${entry.coordinate}-v1`,authorityClass:entry.authorityClass}),sourceProjectionRef:freeze({projectionId:projection.projectionId,selector:entry.selector}),sourceAuthority:freeze({authorityClass:entry.authorityClass,registry:'PHI-OS-ECR-ATOMIC-MEANING-REGISTRY-v1.0.0'})}));
 const base={schemaVersion:'PHI-OS-ECR-CANONICAL-MEANING-BUNDLE-v1.0.0',bundleCode:'ECR-MEANING-BUNDLE-v1.0.0',status:'PRODUCTION',activationState:'PRODUCTION_ACTIVE',sourceProjection:freeze({projectionId:projection.projectionId,methodCode:'EMBODIED_CONFIGURATION',publicMethodCode:'EMBODIED_CONFIGURATION_PROJECTION'}),items:freeze(items),authority:freeze({owner:'PHI_OS_ECR_CANONICAL_MEANING',firstParty:true,atomicMeaningIsCustomerInterpretation:false,rendererCreatesMeaning:false,aiCreatesMeaning:false})};
 const bundleDigest=await sha256Stable(base);return freeze({...base,bundleDigest});
}
export function projectEcrMeaningLocale(bundle,locale='en'){
 if(bundle?.status!=='PRODUCTION'||bundle?.activationState!=='PRODUCTION_ACTIVE')fail('ECR_PRODUCTION_MEANING_BUNDLE_REQUIRED');const use=locale==='zh-Hans'?'zh-Hans':'en';
 const byCode=new Map(ECR_ATOMIC_MEANING_REGISTRY_RUNTIME.entries.map(x=>[x.meaningCode,x]));const items=bundle.items.map(item=>{const src=byCode.get(item.meaningCode);if(!src)fail(`ECR_MEANING_SOURCE_MISSING:${item.meaningCode}`);return freeze({meaningId:item.meaningId,meaningCode:item.meaningCode,meaningVersion:item.meaningVersion,label:use==='zh-Hans'?src.labelZhHans:src.label,definition:use==='zh-Hans'?src.definitionZhHans:src.definition,sourceProjectionRef:item.sourceProjectionRef,mappingLineage:item.mappingLineage})});
 return freeze({schemaVersion:'PHI-OS-ECR-MEANING-LOCALE-PROJECTION-v1.0.0',locale:use,sourceBundleCode:bundle.bundleCode,sourceBundleDigest:bundle.bundleDigest,items,boundary:freeze({translationCreatesMeaning:false,localeProjectionOnly:true})});
}
export default Object.freeze({buildEcrCanonicalMeaningBundle,projectEcrMeaningLocale});
