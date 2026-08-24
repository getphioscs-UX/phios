/** CMP Production Meaning API. Consumes an already accepted CanonicalMethodProjection; never recalculates a Method. */
import { buildCanonicalMeaningProductionBundle } from './meaning-bundle-builder-production.js';
import { buildAstV2CanonicalMeaningProductionBundle } from './meaning-bundle-builder-ast-v2.js';
import { projectCanonicalMeaningLocale } from './locale-projector.js';
import { buildNumRuntimeReadingIR } from '../runtime-reading/num-reading-ir.js';
import { buildBzrRuntimeReadingIR } from '../runtime-reading/bzr-reading-ir.js';
import { buildAstRuntimeReadingIR } from '../runtime-reading/ast-reading-ir.js';
import { buildZiWeiCanonicalMeaningBundle, projectZiWeiMeaningLocale } from './zi-wei-meaning-runtime.js';
import { buildZiWeiRuntimeReadingIR } from '../runtime-reading/zi-wei-reading-ir.js';
import {
  CMP_PRODUCTION_ADMISSION_REGISTRY,
  CMP_PRODUCTION_MAPPING_REGISTRY,
  CMP_PRODUCTION_ACTIVATION_REGISTRY,
  CMP_PRODUCTION_LOCALE_REGISTRY
} from './production-registry-current-v3.js';

const REQUEST_SCHEMA='PHI-OS-CMP-METHOD-MEANING-REQUEST-v1.0.0';
const V1='PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0';
const V2='PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0';
function json(payload,status=200,headers={}){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}})}
function clean(v){return typeof v==='string'?v.trim():''}
function safeLocale(v){return v==='zh-Hans'?'zh-Hans':'en'}
function validateProjection(projection){
 if(!projection)throw Object.assign(new Error('CMP_CANONICAL_PROJECTION_REQUIRED'),{code:'CMP_CANONICAL_PROJECTION_REQUIRED'});
 const method=projection.method?.publicMethodCode;
 const expected=method==='ASTROLOGY_PROJECTION'?V2:V1;
 if(projection.schemaVersion!==expected)throw Object.assign(new Error('CMP_CANONICAL_PROJECTION_REQUIRED'),{code:'CMP_CANONICAL_PROJECTION_REQUIRED'});
 if(projection.projection?.productionResult!==true||projection.projection?.clientRenderable!==true)throw Object.assign(new Error('CMP_PRODUCTION_PROJECTION_REQUIRED'),{code:'CMP_PRODUCTION_PROJECTION_REQUIRED'});
 if(projection.execution?.mpaDecision?.authorityOwner!=='MPA'||projection.execution?.mpaDecision?.dispatchAllowed!==true)throw Object.assign(new Error('CMP_MPA_PRODUCTION_AUTHORITY_REQUIRED'),{code:'CMP_MPA_PRODUCTION_AUTHORITY_REQUIRED'});
 if(projection.interpretation?.included!==false||projection.interpretation?.meaningAuthorityCreated!==false)throw Object.assign(new Error('CMP_UPSTREAM_MEANING_BOUNDARY_INVALID'),{code:'CMP_UPSTREAM_MEANING_BOUNDARY_INVALID'});
 return projection;
}
export async function onRequestPost({request}){
 let body;try{body=await request.json();}catch{return json({ok:false,error:'INVALID_JSON'},400)}
 if(clean(body?.schemaVersion)!==REQUEST_SCHEMA)return json({ok:false,error:'CMP_MEANING_REQUEST_SCHEMA_INVALID'},400);
 const locale=safeLocale(clean(body?.locale));
 if(body?.canonicalProjection?.method?.publicMethodCode==='ASTROLOGY_PROJECTION'&&body?.canonicalProjection?.schemaVersion!==V2)return json({ok:false,error:'CMP_METHOD_PRODUCTION_MEANING_NOT_ACTIVATED',publicMethodCode:'ASTROLOGY_PROJECTION',requiredProjectionSchemaVersion:V2},423);
 try{
  const projection=validateProjection(body?.canonicalProjection);
  const publicMethodCode=projection.method?.publicMethodCode;
  if(!['NUMEROLOGY_PROJECTION','BAZI_PROJECTION','ASTROLOGY_PROJECTION','ZI_WEI_PROJECTION'].includes(publicMethodCode))return json({ok:false,error:'CMP_METHOD_PRODUCTION_MEANING_NOT_ACTIVATED',publicMethodCode:publicMethodCode||null},423);
  const meaningBundle=publicMethodCode==='ZI_WEI_PROJECTION'
   ?buildZiWeiCanonicalMeaningBundle(projection)
   :publicMethodCode==='ASTROLOGY_PROJECTION'
    ?await buildAstV2CanonicalMeaningProductionBundle({projection,admissionRegistry:CMP_PRODUCTION_ADMISSION_REGISTRY,mappingRegistry:CMP_PRODUCTION_MAPPING_REGISTRY,activationRegistry:CMP_PRODUCTION_ACTIVATION_REGISTRY})
    :await buildCanonicalMeaningProductionBundle({projection,admissionRegistry:CMP_PRODUCTION_ADMISSION_REGISTRY,mappingRegistry:CMP_PRODUCTION_MAPPING_REGISTRY,activationRegistry:CMP_PRODUCTION_ACTIVATION_REGISTRY,mode:'production'});
  if(!meaningBundle.items.length)return json({ok:false,error:'CMP_PRODUCTION_MEANING_UNRESOLVED'},422);
  const localeProjection=publicMethodCode==='ZI_WEI_PROJECTION'
   ?projectZiWeiMeaningLocale(meaningBundle,locale)
   :await projectCanonicalMeaningLocale({bundle:meaningBundle,localeRegistry:CMP_PRODUCTION_LOCALE_REGISTRY,locale});
  const reading=publicMethodCode==='ZI_WEI_PROJECTION'
   ?buildZiWeiRuntimeReadingIR({projection,bundle:meaningBundle,localeProjection})
   :publicMethodCode==='ASTROLOGY_PROJECTION'
    ?buildAstRuntimeReadingIR({projection,bundle:meaningBundle,localeProjection})
    :publicMethodCode==='BAZI_PROJECTION'
     ?buildBzrRuntimeReadingIR({projection,bundle:meaningBundle,localeProjection})
     :buildNumRuntimeReadingIR({projection,bundle:meaningBundle,localeProjection});
  return json({ok:true,capabilityAvailability:'AVAILABLE',capabilityVersion:'1.0.0',executionCompleteness:reading.executionCompleteness,meaningBundle,localeProjection,reading},200);
 }catch(error){
  const code=error?.code||'CMP_MEANING_FAILED_CLOSED';
  const status=code==='CMP_METHOD_PRODUCTION_NOT_ACTIVATED'?423:code.includes('PROJECTION')||code.includes('BOUNDARY')?422:500;
  return json({ok:false,error:code},status);
 }
}
export async function onRequestGet(){return json({ok:false,error:'CMP_MEANING_POST_ONLY'},405,{Allow:'POST'})}
