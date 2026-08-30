import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {onRequestPost as customerPersonalReality} from '../functions/api/customer-personal-reality.js';
import {resolveSpecialistRendererDescriptor} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';
import {renderZiweiProduct} from '../assets/customer-ui/js/specialists/ziwei/product-renderer.js';
import {isZiweiCustomerSurfaceActivated,isZiweiFinalCustomerSurfaceActivated} from '../functions/personal-reality-product/adapters/ziwei-customer-surface-activation.js';
import {isZiweiCustomerSurfaceActivatedClient,isZiweiFinalCustomerSurfaceActivatedClient} from '../assets/customer-ui/js/specialists/ziwei/ziwei-surface-activation-client.js';
import {auditZiweiDom} from './lib/ziwei-cx-r1-w14-dom-harness.mjs';
import {assertPprR3GovernedPath} from './ppr-r3-governed-successor-support.mjs';

const BASE='content/customer-experience-rebuild/ziwei-cx-r1';
const BASELINE='7c6126404fe8e257b44937a0149bf23c837c538f';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const paths={
 contract:`${BASE}/contracts/ziwei-cx-r1-w17r-browser-delivery-recovery-contract-v1.json`,
 authority:`${BASE}/authority/ziwei-cx-r1-w17r-browser-delivery-recovery-authority-v1.json`,
 shared:`${BASE}/authority/ziwei-cx-r1-w17r-current-shared-baseline-v1.json`,
 fixture:`${BASE}/fixtures/ziwei-cx-r1-w17r-browser-import-regression-v1.json`,
 acceptance:`${BASE}/acceptance/ziwei-cx-r1-w17r-browser-delivery-recovery-acceptance-v1.json`
};
for(const p of Object.values(paths))assert.ok(fs.existsSync(p),`missing ${p}`);
const contract=j(paths.contract),authority=j(paths.authority),shared=j(paths.shared),fixture=j(paths.fixture),acceptance=j(paths.acceptance);
for(const x of [contract,authority,shared,fixture,acceptance])assert.equal(x.integrationBaselineCommit,BASELINE,`${x.schemaVersion} baseline drift`);
assert.equal(contract.rootCause.semanticBackendFailure,false);assert.equal(contract.rootCause.specialistBrowserDeliveryFailure,true);assert.equal(contract.requiredRecovery.sharedPprMutationAllowed,false);
assert.equal(authority.status,'ACTIVE_BROWSER_DELIVERY_RECOVERED');assert.equal(authority.browserModuleClosure,'STATIC_ASSET_ONLY');assert.equal(authority.serverOnlyModuleImportedByBrowser,false);assert.equal(authority.fullProductionVisibleToCustomer,true);
assert.equal(fixture.regression.failedBoundary,'BROWSER_MODULE_REACHABILITY');assert.match(fixture.regression.historicalImport,/functions\/personal-reality-product/);
assert.equal(acceptance.status,'BROWSER_DELIVERY_RECOVERED_CUSTOMER_SURFACE_REACHABLE');assert.equal(Object.values(acceptance.gates).every(Boolean),true);assert.equal(acceptance.result.fullProductionVisibleToCustomer,true);assert.equal(acceptance.blockers.length,0);

// Current PPR shared bytes are inherited, not rewritten by this Zi Wei recovery.
for(const row of shared.files){
 assert.ok(fs.existsSync(row.path),`shared current path missing ${row.path}`);
 const governed=assertPprR3GovernedPath(row.path,row.sha256,'ZIWEI-CX-R1 W17R shared baseline');
 if(governed.state==='UNCHANGED')assert.equal(fs.statSync(row.path).size,row.sizeBytes,`W17R shared size drift: ${row.path}`);
 else assert(['GOVERNED_SUCCESSOR','CURRENT_OWNER_SUCCESSOR'].includes(governed.state),`W17R shared path is not a governed PPR successor: ${row.path}`);
}
for(const p of shared.requiredAbsent)assert.equal(fs.existsSync(p),false,`retired shared file resurrected: ${p}`);

// Browser module closure: every static import reachable from the Zi Wei specialist renderer must stay inside public /assets.
const entry='assets/customer-ui/js/specialists/ziwei/product-renderer.js';
const seen=new Set();
const edges=[];
const importRe=/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
function walk(file){
 const normalized=file.replaceAll('\\','/');if(seen.has(normalized))return;seen.add(normalized);
 assert.ok(normalized.startsWith('assets/'),`browser module escaped static assets: ${normalized}`);assert.ok(fs.existsSync(normalized),`browser module missing: ${normalized}`);
 const src=fs.readFileSync(normalized,'utf8');assert.doesNotMatch(src,/(?:from\s*['"]|import\(\s*['"])(?:\.\.\/)*functions\//,`server-only Functions dependency found in browser module: ${normalized}`);
 for(const m of src.matchAll(importRe)){const spec=m[1]||m[2];if(!spec||spec.startsWith('node:')||spec.startsWith('data:'))continue;let resolved;if(spec.startsWith('/assets/'))resolved=spec.slice(1);else if(spec.startsWith('.'))resolved=path.posix.normalize(path.posix.join(path.posix.dirname(normalized),spec));else throw new Error(`BROWSER_BARE_OR_NONSTATIC_IMPORT:${normalized}:${spec}`);edges.push([normalized,spec,resolved]);walk(resolved);}
}
walk(entry);
assert.ok(seen.size>=4,'unexpectedly small Zi Wei browser module closure');
assert.equal([...seen].some(p=>p.startsWith('functions/')),false);
assert.equal(edges.some(([,spec,resolved])=>spec.includes('/functions/')||resolved.startsWith('functions/')),false);

// Registry descriptor must point to the public specialist entry and cannot be supplied from the customer payload.
const descriptor=resolveSpecialistRendererDescriptor({methodId:'ZWR',productType:'ZIWEI_FULL_PRODUCTION',specialistRenderer:{rendererId:'PPR_R3_ZIWEI_PRODUCT_V1',surfaceContract:'PHI-OS-PPR-R3-SPECIALIST-RENDERER-PORT-v1.0.0'}});
assert.ok(descriptor);assert.equal(descriptor.module,'/assets/customer-ui/js/specialists/ziwei/product-renderer.js');assert.equal(descriptor.export,'renderZiweiProduct');

function mockExternalFetch(){return async input=>{const url=String(input?.url||input);if(url.includes('nominatim.openstreetmap.org/lookup'))return new Response(JSON.stringify([{name:'Hong Kong',lat:'22.3193',lon:'114.1694',display_name:'Hong Kong',address:{city:'Hong Kong',country:'Hong Kong',country_code:'hk'},namedetails:{'name:en':'Hong Kong','name:zh':'香港'}}]),{status:200,headers:{'content-type':'application/json'}});if(url.includes('timeapi.io/api/TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'Asia/Hong_Kong'}),{status:200,headers:{'content-type':'application/json'}});throw new Error(`ZIWEI_CX_R1_W17R_UNEXPECTED_FETCH:${url}`);};}
const oldFetch=globalThis.fetch;globalThis.fetch=mockExternalFetch();try{
 const body={birthDate:'2023-01-22',birthTime:'05:00',birthTimeUnknown:false,placeRef:'N123',methods:['ziwei'],traditionalCalculationSex:'MALE',ziweiTargetDate:'2026-08-30',ziweiTargetTime:'12:00',ziweiTargetTimezoneIana:'Asia/Kuala_Lumpur',ziweiTargetUtcOffset:'+08:00',ziweiTargetContextSource:'EXPLICIT_REQUEST',consent:true,locale:'zh-Hans'};
 const response=await customerPersonalReality({request:new Request('https://getphios.com/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env:{}});const payload=await response.json();assert.equal(response.status,200);assert.equal(payload.ok,true);
 const product=payload.view?.productRoute?.primaryProduct;assert.ok(product);assert.equal(product.methodId,'ZWR');assert.equal(product.state,'CUSTOMER_PUBLISHABLE');assert.equal(product.specialistRenderer?.rendererId,'PPR_R3_ZIWEI_PRODUCT_V1');
 assert.equal(isZiweiCustomerSurfaceActivated(product),true);assert.equal(isZiweiFinalCustomerSurfaceActivated(product),true);assert.equal(isZiweiCustomerSurfaceActivatedClient(product),true);assert.equal(isZiweiFinalCustomerSurfaceActivatedClient(product),true);
 const resolved=resolveSpecialistRendererDescriptor(product);assert.ok(resolved);assert.equal(resolved.module,descriptor.module);
 const plan=renderZiweiProduct({product});assert.equal(plan.status,'RENDERED');assert.equal(plan.fullProductionVisibleToCustomer,true);assert.equal(plan.printableCustomerProduct,true);assert.equal(plan.finalCustomerSurfaceActivation,'W17_ACTIVE');
 const dom=auditZiweiDom(plan);assert.equal(Object.values(dom.invariants).every(Boolean),true);assert.equal(dom.counts.palaceButtons,12);assert.equal(dom.counts.topicTabs,8);assert.equal(dom.counts.timingNodes,3);
 assert.doesNotMatch(plan.visualHtml+plan.readingHtml,/这项受治理视觉仍由方法产品提供|This governed visual remains available through the method product/);
}finally{globalThis.fetch=oldFetch;}

console.log('✓ ZIWEI-CX-R1-W17R browser specialist delivery recovery passed.');
console.log(`  Static browser module closure: ${seen.size} JS modules / ${edges.length} import edges; 0 server-only Functions imports.`);
console.log('  Canonical API returns CUSTOMER_PUBLISHABLE ZWR with approved specialist renderer; specialist plan exposes 12 palaces, 8 topics and 3 timing nodes.');
console.log('  The generic governed-visual placeholder is no longer the expected visible Zi Wei surface when the specialist module is reachable.');
