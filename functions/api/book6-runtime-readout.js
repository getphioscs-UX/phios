import dossiers from '../../content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json';
import cases from '../../content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json';
import inputContract from '../../content/runtime/reality-readout-engine/contracts/reality-readout-input-contract-v1.json';
import dimensionRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-observable-dimension-registry-v1.json';
import signatureRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-runtime-signature-role-registry-v1.json';
import patternRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-pattern-runtime-registry-v1.json';
import constraintRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-constraint-reading-class-registry-v1.json';
import loadRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-load-reading-state-registry-v1.json';
import stabilityRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-stability-reading-registry-v1.json';
import driftRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-drift-reading-registry-v1.json';
import recoveryRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-recovery-reading-registry-v1.json';
import resolutionRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-resolution-limit-registry-v1.json';
import confidenceRegistry from '../../content/runtime/reality-readout-engine/registries/canonical-confidence-runtime-registry-v1.json';
import rmoConstraintRegistry from '../../content/runtime/reality-model-runtime/registries/canonical-constraint-type-registry-v1.json';
import rmoUnknownRegistry from '../../content/runtime/reality-model-runtime/registries/canonical-unknown-kind-registry-v1.json';
import successorRegistry from '../../content/governance/reality-data-governance/extensions/rre-readout/registries/rre-readout-data-contract-successor-v1.json';
import targetRegistry from '../../content/runtime/reality-readout-engine/registries/rre-cpr-projection-target-registry-v1.json';
import cprSurfaceRegistry from '../../content/professional/canonical-presentation-runtime/registries/cpr-surface-projection-registry-v1.json';
import {buildBook6DossierRreProjection} from '../../scripts/lib/civilization-atlas/book6-rre-adapter-v1.mjs';

const REGISTRIES=Object.freeze({
  inputContract,
  dimensionRegistry,
  signatureRegistry,
  patternRegistry,
  constraintRegistry,
  loadRegistry,
  stabilityRegistry,
  driftRegistry,
  recoveryRegistry,
  resolutionRegistry,
  confidenceRegistry,
  rmoConstraintRegistry,
  rmoUnknownRegistry,
  successorRegistry,
  targetRegistry,
  cprSurfaceRegistry
});

const json=(body,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'public, max-age=300, stale-while-revalidate=900'
  }
});

export async function onRequestGet({request}){
  const url=new URL(request.url);
  const dossierId=String(url.searchParams.get('dossier')||'').trim().toUpperCase();
  if(!/^DOSSIER-[A-Z0-9-]+$/.test(dossierId))return json({ok:false,error:'BOOK6_DOSSIER_ID_REQUIRED'},400);
  const dossier=(dossiers.dossiers||[]).find(row=>row.id===dossierId);
  if(!dossier)return json({ok:false,error:'BOOK6_DOSSIER_NOT_FOUND'},404);
  try{
    const projection=buildBook6DossierRreProjection({dossier,cases:cases.cases||[],registries:REGISTRIES});
    return json({ok:true,projection});
  }catch(error){
    return json({ok:false,error:'BOOK6_RRE_PROJECTION_FAILED',detail:String(error?.message||error)},500);
  }
}

export async function onRequest(){
  return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
}
