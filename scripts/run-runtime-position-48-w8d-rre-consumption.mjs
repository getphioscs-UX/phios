import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {consumeW8dRreEvidence} from './lib/civilization-atlas/runtime-position-w8d-rre-consumption-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(value,null,2)+'\n');

const handoff=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-rre-eligible-handoff-v1.json');
const dossiers=read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const cases=read('content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json');
const readiness=read('content/civilization-atlas/reconfiguration/runtime-position-w7-readiness-v1.json');
const REGISTRIES={
  inputContract:read('content/runtime/reality-readout-engine/contracts/reality-readout-input-contract-v1.json'),
  dimensionRegistry:read('content/runtime/reality-readout-engine/registries/canonical-observable-dimension-registry-v1.json'),
  signatureRegistry:read('content/runtime/reality-readout-engine/registries/canonical-runtime-signature-role-registry-v1.json'),
  patternRegistry:read('content/runtime/reality-readout-engine/registries/canonical-pattern-runtime-registry-v1.json'),
  constraintRegistry:read('content/runtime/reality-readout-engine/registries/canonical-constraint-reading-class-registry-v1.json'),
  loadRegistry:read('content/runtime/reality-readout-engine/registries/canonical-load-reading-state-registry-v1.json'),
  stabilityRegistry:read('content/runtime/reality-readout-engine/registries/canonical-stability-reading-registry-v1.json'),
  driftRegistry:read('content/runtime/reality-readout-engine/registries/canonical-drift-reading-registry-v1.json'),
  recoveryRegistry:read('content/runtime/reality-readout-engine/registries/canonical-recovery-reading-registry-v1.json'),
  resolutionRegistry:read('content/runtime/reality-readout-engine/registries/canonical-resolution-limit-registry-v1.json'),
  confidenceRegistry:read('content/runtime/reality-readout-engine/registries/canonical-confidence-runtime-registry-v1.json'),
  rmoConstraintRegistry:read('content/runtime/reality-model-runtime/registries/canonical-constraint-type-registry-v1.json'),
  rmoUnknownRegistry:read('content/runtime/reality-model-runtime/registries/canonical-unknown-kind-registry-v1.json'),
  successorRegistry:read('content/governance/reality-data-governance/extensions/rre-readout/registries/rre-readout-data-contract-successor-v1.json'),
  targetRegistry:read('content/runtime/reality-readout-engine/registries/rre-cpr-projection-target-registry-v1.json'),
  cprSurfaceRegistry:read('content/professional/canonical-presentation-runtime/registries/cpr-surface-projection-registry-v1.json')
};
const output=consumeW8dRreEvidence({handoff,dossiers,cases:cases.cases||[],readiness,registries:REGISTRIES});
const partial=output.records.filter(x=>x.state==='RRE_PARTIAL_EVIDENCE_CONSUMED').length;
const complete=output.records.filter(x=>x.state==='RRE_REQUIRED_LANES_CONSUMED').length;

write('content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-readouts-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-RRE-READOUTS-v1.0.0',version:'1.0.0',status:output.records.length?'RRE_CURRENT_EVIDENCE_CONSUMED':'IDLE_NO_RRE_ELIGIBLE_EVIDENCE',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D',contract:'content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-consumption-contract-v1.json',records:output.records});
write('content/civilization-atlas/reconfiguration/runtime-position-w8d-position-derivation-readiness-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-POSITION-DERIVATION-READINESS-v1.0.0',version:'1.0.0',status:output.derivationReadiness.length?'RRE_READOUTS_EVALUATED':'IDLE_NO_RRE_READOUTS',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D',successorWork:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8E',records:output.derivationReadiness,boundary:'REQUIRED_LANES_COMPLETE means evidence coverage is complete for the next derivation stage; it is not a runtime-position candidate or admission.'});
write('content/civilization-atlas/reconfiguration/runtime-position-w8d-status-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-STATUS-v1.0.0',version:'1.0.0',status:output.records.length?'RRE_CURRENT_EVIDENCE_CONSUMED':'RRE_CONSUMPTION_ACTIVE__NO_EVIDENCE',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D',completed:{rreEligibleEvidence:(handoff.records||[]).length,dossiersWithEligibleEvidence:output.records.length,rreReadouts:output.records.length,partialEvidenceReadouts:partial,requiredLanesCompleteReadouts:complete,positionDerivationReadyDossiers:complete,canonicalDossiersMutated:0,runtimePositionCandidates:0,positionsAdmitted:0},next:complete?'Continue to W8E for evidence-bounded grammar/domain derivation candidates.':'Add/complete real admitted current evidence before position derivation. W8D readouts remain limited by missing required lanes.',reviewHtml:'tools/review/PHI-OS-48-RUNTIME-POSITION-W8D-RRE-CONSUMPTION.html'});

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const cards=output.records.map(x=>'<article class="card"><h2>'+esc(x.dossierId)+'</h2><p><strong>State:</strong> '+esc(x.state)+'</p><p><strong>Evidence:</strong> '+x.evidenceCount+'</p><p><strong>Required lanes:</strong> '+(x.requiredLaneIds.length-x.missingRequiredLanes.length)+' / '+x.requiredLaneIds.length+'</p><p><strong>Missing:</strong> '+esc(x.missingRequiredLanes.join(' · ')||'none')+'</p><p><strong>RRE:</strong> '+esc(x.readoutReference?.code||'')+'</p></article>').join('');
const html='<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>R1-W8D RRE Current Evidence Consumption</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;max-width:1200px;margin:0 auto;padding:32px;line-height:1.6;background:#f6f4ef;color:#1f2833}.card{background:#fff;border:1px solid #d8d2c4;border-radius:18px;padding:22px;margin:20px 0}.boundary{padding:12px 14px;background:#f0eee7;border-left:4px solid #8b7b52}</style></head><body><h1>R1-W8D｜RRE CURRENT EVIDENCE CONSUMPTION</h1><p>RRE-eligible Evidence → Dossier Grouping → Evidence Lineage → RRE Readout → Position Derivation Readiness</p><div class="boundary"><strong>Boundary:</strong> RRE readout ≠ grammar/domain derivation ≠ runtime-position candidate. No evidence means no Dossier readout is created.</div>'+(cards||'<article class="card"><h2>当前没有 RRE Readout</h2><p>W8C 目前没有 RRE_ELIGIBLE evidence，因此 W8D 正确保持 0 records。加入真实来源后重新运行即可。</p></article>')+'</body></html>';
fs.writeFileSync(path.join(root,'tools/review/PHI-OS-48-RUNTIME-POSITION-W8D-RRE-CONSUMPTION.html'),html);
console.log('PASS runtime-position-48 W8D RRE consumption: eligibleEvidence='+(handoff.records||[]).length+', readouts='+output.records.length+', partial='+partial+', requiredComplete='+complete+', positions=0.');
