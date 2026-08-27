import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT='content/customer-experience-rebuild/r12r4b/cx-r12r4b-hdr-definitive-repository-audit-v1.json';
const ROOTS=['content/professional','content/governance/production-capability-matrix','content/interpretation/integration','functions','assets/customer-ui','assets/js/method-client-delivery','scripts'];
const EXCLUDED=new Set([OUTPUT,'scripts/generate-cx-r12r4b-hdr-repository-audit.mjs']);
const DOMAIN_PATH=/(?:^|\/)(?:[^/]*(?:hdr|human[-_ ]?design|bodygraph)[^/]*)(?:\/|$)/i;
const DOMAIN_TEXT=/\bHUMAN_DESIGN(?:_PROJECTION)?\b|\bbodygraph\b/i;
const TEXT_EXTENSIONS=new Set(['.json','.js','.mjs','.html','.css','.md','.svg']);
const KEY_AUTHORITIES=Object.freeze({
  productionFreeze:'content/professional/core-method-runtime/hdr-production-freeze-v1.json',
  methodRegistry:'content/professional/method-production-activation/registries/method-registry-v4.json',
  productionCapability:'content/governance/production-capability-matrix/registries/production-capability-registry-v7.json',
  rightsBoundary:'content/professional/method-production-activation/registries/mpa-hdr-rights-license-boundary-v1.json',
  mappingBoundary:'content/professional/method-production-activation/registries/mpa-hdr-mapping-authority-boundary-v1.json',
  meaningBoundary:'content/professional/method-production-activation/registries/mpa-hdr-meaning-integration-boundary-v1.json',
  readiness:'content/professional/method-production-activation/registries/mpa-hdr-boundary-readiness-v1.json',
  inputProfile:'content/professional/method-client-delivery/registries/hdr-input-requirement-profile-v1.json',
  clientProjectionContract:'content/professional/method-client-delivery/contracts/mcd-5-hdr-validation-only-projection-contract-v1.json',
  existingCalculationAudit:'content/professional/hdr2/audits/hdr2-existing-calculation-authority-audit-v1.json'
});

function walk(root){
  const out=[];
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    const candidate=path.posix.join(root,entry.name);
    if(entry.isDirectory())out.push(...walk(candidate));
    else if(entry.isFile())out.push(candidate);
  }
  return out;
}

function relevant(file){
  if(EXCLUDED.has(file)||!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()))return false;
  if(DOMAIN_PATH.test(file))return true;
  if(!file.startsWith('content/professional/')&&!file.startsWith('content/governance/production-capability-matrix/')&&!file.startsWith('content/interpretation/integration/')&&!file.startsWith('functions/'))return false;
  return DOMAIN_TEXT.test(fs.readFileSync(file,'utf8'));
}

function category(file){
  if(file.includes('/scripts/lib/')||file.includes('legacy-material-assessment'))return 'DEAD_OR_LEGACY';
  if(file.startsWith('scripts/')||file.includes('/fixtures/')||file.includes('/schemas/')||file.includes('/acceptance/'))return 'TEST';
  if(file.startsWith('assets/')||file.includes('canonical-asset-runtime')||file.includes('mfig-'))return 'VISUAL';
  if(file.includes('method-client-delivery')||file.includes('customer-ui'))return 'CUSTOMER_UI';
  if(file.includes('canonical-meaning')||file.includes('/interpretation-runtime/adapters/'))return 'MEANING';
  if(/data-rights|current-source|rights-license|mapping-authority|source-boundary|source-inventory|source-provenance/.test(file))return 'SOURCE';
  if(file.includes('core-method-runtime')||file.includes('/hdr2/')||file.includes('method-runtime/personal-structure')||file.includes('hdr-boundary-runtime'))return 'CALCULATION';
  return 'DATA_TABLE';
}

const files=[...new Set(ROOTS.flatMap(root=>walk(root)).filter(relevant))].sort();
const inventory=files.map(file=>({path:file,category:category(file)}));
const counts=Object.fromEntries(['CALCULATION','DATA_TABLE','SOURCE','MEANING','VISUAL','CUSTOMER_UI','TEST','DEAD_OR_LEGACY'].map(code=>[code,inventory.filter(item=>item.category===code).length]));
const sha256=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const authorityDigests=Object.fromEntries(Object.entries(KEY_AUTHORITIES).map(([key,file])=>[key,{path:file,sha256:sha256(file)}]));
const audit={
  schemaVersion:'PHI-OS-CX-R12R4B-HDR-DEFINITIVE-REPOSITORY-AUDIT-v1.0.0',
  work:'CX-R12R4B-W09',
  baselineCommit:'4a9ddcaff07abaab4c12be62cd74e0681e528af8',
  status:'W09_AUDIT_COMPLETE_REUSE_REQUIRED_W10_PUBLIC_IDENTITY_BLOCKED',
  search:{
    roots:ROOTS,
    pathTerms:['HDR','human-design','human_design','Human Design','bodygraph'],
    contentTerms:['HUMAN_DESIGN','HUMAN_DESIGN_PROJECTION','bodygraph'],
    broadTermNote:'Generic words such as gate, center, profile and authority were evaluated inside the domain-scoped candidate set; using them globally would classify unrelated PHI OS governance and knowledge files as Human Design.',
    candidateCount:inventory.length,
    categoryCounts:counts
  },
  inventory,
  authorityDigests,
  definitiveFindings:{
    existingCalculationAuthority:{
      exists:true,
      currentSuccessor:'functions/method-runtime/personal-structure/personal-structure-runtime.js',
      existingProjection:'functions/method-runtime/personal-structure/personal-structure-projection-runtime.js',
      reimplementationRequired:false,
      newGateWheelAllowed:false,
      newDesignMomentCalculationAllowed:false,
      newBodygraphCalculationAllowed:false
    },
    methodIdentity:{
      internalMethodId:'HDR',
      methodCode:'HUMAN_DESIGN',
      methodVersion:'1.0.0',
      currentRegistryState:'BLOCKED',
      productionEligible:false,
      publicBrandActivation:false,
      requestedPublicLabelActivationAllowed:false
    },
    calculation:{implemented:true,validated:true,productionExecutionAllowed:false,executionMode:'validation_only'},
    projection:{implemented:true,customerDispatchAllowed:false,contractStatus:'VALIDATION_ONLY_NOT_CLIENT_DISPATCHABLE'},
    meaning:{structureMappingsObserved:100,runtimeMappingsObserved:0,variableMappingsObserved:0,productionAuthorityCreated:false},
    visual:{internalBodygraphRuntimeExists:true,validationRendererExists:true,productionCustomerBodygraphExists:false},
    sourceAndRights:{
      explicitCommercialLicenseArtifactPresent:false,
      authorizedGateMappingDatasetPresent:false,
      authorizedBodygraphStructureDatasetPresent:false,
      productionActivationAllowed:false
    }
  },
  reuseDecision:{
    reuseExistingCalculation:true,
    reuseExistingCanonicalProjection:true,
    reuseExistingValidationMappings:true,
    createSecondHdrAuthority:false,
    createNewGateWheel:false,
    createNewBodygraphRuntime:false,
    validationOnlyArtifactsMayBePromotedByRename:false
  },
  sequentialGate:{
    W09:'ACCEPTED_BY_DEFINITIVE_REPOSITORY_AUDIT',
    W10:'BLOCKED_PUBLIC_LABEL_AND_PRODUCTION_IDENTITY_ACTIVATION_NOT_AUTHORIZED',
    W11:'NOT_REACHABLE_UNTIL_EXPLICIT_RIGHTS_SOURCE_AND_MAPPING_AUTHORITIES_EXIST',
    W12_W78:'NOT_STARTED_SEQUENTIAL_GATE_PRESERVED',
    blockerAuthorityRef:'content/professional/method-production-activation/registries/mpa-hdr-boundary-readiness-v1.json'
  },
  forbiddenWorkarounds:['SCRAPE_EXTERNAL_CHART_SERVICE','RECONSTRUCT_MAPPING_FROM_PUBLIC_OUTPUTS','EMBED_UNVERIFIED_GATE_SEQUENCE','USE_PROMPT_AS_MAPPING_AUTHORITY','RENAME_VALIDATION_ONLY_AS_PRODUCTION','FABRICATE_48_OF_48_HUMAN_ACCEPTANCE']
};
const rendered=`${JSON.stringify(audit,null,2)}\n`;

if(process.argv.includes('--check')){
  assert.ok(fs.existsSync(OUTPUT),'CX_R12R4B_HDR_REPOSITORY_AUDIT_MISSING');
  assert.equal(fs.readFileSync(OUTPUT,'utf8'),rendered,'CX_R12R4B_HDR_REPOSITORY_AUDIT_DRIFT');
  console.log(`✓ CX-R12R4B W09 HDR repository audit is deterministic across ${inventory.length} domain candidates.`);
}else{
  fs.writeFileSync(OUTPUT,rendered);
  console.log(`Generated ${OUTPUT} with ${inventory.length} classified domain candidates.`);
}
