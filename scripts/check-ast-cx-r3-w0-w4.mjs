import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildAstCustomerWorkspaceCandidate} from '../functions/ast-full-production/ast-customer-reading-production.js';
import {AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA,AST_CX_R3_BASELINE_COMMIT} from '../functions/ast-full-production/ast-customer-product-projection-v3.js';
import {adaptAstPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ast-production-adapter.js';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {resolveSpecialistRendererDescriptor} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base='content/professional/ast-full-production/customer-product-v3';

const w0=json(`${base}/audit/ast-cx-r3-w0-authority-reconciliation-v1.json`);
assert.equal(w0.workCode,'AST-CX-R3-W0');
assert.equal(w0.baselineCommit,AST_CX_R3_BASELINE_COMMIT);
assert.equal(w0.status,'AUTHORITY_RECONCILED_FOR_CUSTOMER_PRODUCT_PROJECTION');
for(const v of Object.values(w0.boundaries))assert.equal(v===false?false:Number(v),v===false?false:0);
assert.equal(w0.protectedPprR3.sharedHostMutationAuthorized,false);

const pprFreeze=json('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
for(const [p,d] of Object.entries(pprFreeze.protectedConvergenceFiles))assert.equal(sha(p),d,`AST-CX-R3 protected PPR drift: ${p}`);
for(const [p,d] of Object.entries(pprFreeze.sharedSingleMethodReadingFiles))assert.equal(sha(p),d,`AST-CX-R3 shared SMR drift: ${p}`);
for(const p of ['assets/customer-ui/js/personal-products/personal-product-renderers.js','assets/customer-ui/js/personal-products/specialist-renderer-host.js','assets/customer-ui/js/personal-products/specialist-renderer-registry.js','assets/customer-ui/surfaces/ppr-r3-specialist-host.css'])assert.equal(sha(p),pprFreeze.successorFiles[p],`AST-CX-R3 shared PPR-R3 host drift: ${p}`);

const w1=json(`${base}/registries/ast-cx-r3-w1-capability-surface-map-v1.json`);
assert.equal(w1.workCode,'AST-CX-R3-W1');
assert.equal(w1.unownedCapabilities.length,0);
const capabilityIds=new Set(w1.capabilities.map(x=>x.capabilityId));
for(const id of ['NATAL_POSITIONS','HOUSE_CUSPS','ANGLES','MAJOR_ASPECTS','APPLYING_SEPARATING','HIGHER_ORDER_PATTERNS','CHART_RULER','HOUSE_RULERS','PLANETARY_DISPOSITORS','DISPOSITOR_CHAINS','FINAL_DISPOSITORS','DISPOSITOR_CYCLES','ELEMENT_DISTRIBUTION','MODALITY_DISTRIBUTION','WHOLE_CHART_SYNTHESIS','SUPPORT_TENSION','INTENT_PRIORITY','GOVERNED_TIMING','UNKNOWN_BOUNDARY','LINEAGE'])assert(capabilityIds.has(id),`missing capability ${id}`);

const w2=json(`${base}/contracts/ast-cx-r3-w2-customer-product-projection-contract-v3.json`);
assert.equal(w2.workCode,'AST-CX-R3-W2');
assert.equal(w2.projectionSchema,AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA);
for(const v of Object.values(w2.boundaries))assert.equal(v,false);

const fixture=json('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
const input={canonicalProjection:fixture.inputProjection,rawIntent:'work role direction',locale:'zh-Hans',sourceMainCommit:AST_CX_R3_BASELINE_COMMIT};
const a=await buildAstCustomerWorkspaceCandidate(input),b=await buildAstCustomerWorkspaceCandidate(input);
const projection=a.customerProductProjection;
assert.equal(projection.schemaVersion,AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA);
assert.equal(projection.baselineCommit,AST_CX_R3_BASELINE_COMMIT);
assert.equal(projection.semanticDigest,b.customerProductProjection.semanticDigest);
assert.deepEqual(projection,b.customerProductProjection);
assert.equal(a.workspace.customerProductProjection?.semanticDigest,projection.semanticDigest);
assert.equal(projection.chart.positions.length,10);
assert.equal(projection.chart.houses.length,12);
assert.equal(projection.chart.angles.length,4);
assert(projection.chart.aspects.length>0);
assert(projection.keyConfigurations.length>=3);
assert(projection.planetHouseDirectory.length===10);
assert(projection.aspectNetwork.patterns.length>0);
assert(projection.rulership.chartRuler);
assert.equal(projection.distribution.scope,'CORE_10_PLANETS_UNWEIGHTED');
assert.equal(projection.realityComparison.state,'NOT_BOUND');
assert.equal(projection.timing.state,'UNAVAILABLE');
assert.equal(projection.technical.defaultCollapsed,true);
for(const [k,v] of Object.entries(projection.governance))if(k!=='projectionOnly'&&k!=='sourceAuthoritiesPreserved')assert.equal(v,false,`projection governance ${k}`);
assert.equal(projection.governance.projectionOnly,true);
assert.equal(projection.governance.sourceAuthoritiesPreserved,true);
assert.doesNotMatch(JSON.stringify(projection),/candidateMeaning/);

const product=adaptAstPersonalRealityProduct({workspace:a.workspace,locale:'zh-Hans'});
assert.equal(product.methodId,'AST');
assert.equal(product.productType,'ASTROLOGY_PROFESSIONAL_READING');
assert.equal(product.state,'CUSTOMER_PUBLISHABLE');
assert.equal(product.lineage.customerProductProjectionSchema,AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA);
assert.equal(product.lineage.customerProductSemanticDigest,projection.semanticDigest);
assert.equal(product.visuals[0].payload.houseSystemId,projection.houseSystemId);
assert.equal(product.specialistRenderer.rendererId,'PPR_R3_AST_PRODUCT_V1');
assert.equal(resolveSpecialistRendererDescriptor(product)?.rendererId,'PPR_R3_AST_PRODUCT_V1');
assert.equal(product.sourceProduct.schemaVersion,'PHI-OS-AST-INTERACTIVE-WORKSPACE-v1.0.0');
assert.equal(product.sourceProduct.customerProductProjection.schemaVersion,AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA);
assert.equal(product.boundaries.newMeaningCreated,false);
assert.equal(product.boundaries.methodRuntimeExecuted,false);
assert.equal(product.boundaries.canonicalProjectionCreated,false);

const route=await buildPersonalRealityProductRoute({selectedKeys:['astrology'],results:[{ok:true,key:'astrology',spec:{methodCode:'ASTROLOGY'},canonicalProjection:fixture.inputProjection}],locale:'zh-Hans',intent:'work role direction'});
assert.equal(route.mode,'SINGLE_METHOD');
assert.equal(route.primaryProduct?.methodId,'AST');
assert.equal(route.primaryProduct?.lineage?.customerProductProjectionSchema,AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA);
assert.equal(route.primaryProduct?.sourceProduct?.customerProductProjection?.schemaVersion,AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA);
assert.equal(resolveSpecialistRendererDescriptor(route.primaryProduct)?.rendererId,'PPR_R3_AST_PRODUCT_V1');

const runtime=text('functions/ast-full-production/ast-customer-product-projection-v3.js');
assert.doesNotMatch(runtime,/calculateHouse|calculateAspect|ephemerisAdapter|executeAstProduction|buildAstProfessionalSemanticProjection|buildAstWholeChartSynthesis/);
assert.match(runtime,/createsMeaning:false/);
assert.match(runtime,/createsCanonicalProjection:false/);

const acceptance=json(`${base}/acceptance/ast-cx-r3-w3-w4-projection-adapter-acceptance-v1.json`);
assert.equal(acceptance.status,'ENGINEERING_ACCEPTED');
assert.equal(acceptance.expectedFixtureSemanticDigest,projection.semanticDigest);
assert.equal(acceptance.pprR3SharedFilesModified,0);
assert.equal(acceptance.sharedSingleMethodReadingModified,0);
console.log(`✓ AST-CX-R3 W0–W4 passed: authority is reconciled, ${w1.capabilities.length} governed capabilities have surface owners, deterministic customer product projection v3 is live, and the AST PPR-R3 adapter consumes it without changing the frozen shared host.`);
console.log(`  Projection digest: ${projection.semanticDigest}; house system: ${projection.houseSystemId}; chart ${projection.chart.positions.length} bodies / ${projection.chart.houses.length} houses / ${projection.chart.aspects.length} aspects; ${projection.keyConfigurations.length} whole-chart configurations.`);
