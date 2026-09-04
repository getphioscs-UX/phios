import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runFinancialProduct} from '../functions/financial/product-activation/financial-product-runtime.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const p1DeletePath='content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json';const p1Deleted=fs.existsSync(p1DeletePath)&&read(p1DeletePath).status==='PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE';
for(const p of [...(p1Deleted?[]:['financial-reality.html']),'assets/js/pages/financial-runtime-product.js','assets/css/financial-runtime-product.css','functions/api/financial-runtime-preview.js','content/financial/product-activation/contracts/financial-runtime-product-contract-v1.json','content/financial/product-activation/registries/financial-runtime-product-capability-registry-v1.json','content/financial/product-activation/acceptance/stage14-financial-runtime-product-acceptance-v1.json','content/financial/product-activation/freeze/stage14-financial-runtime-product-freeze-v1.json']) assert.ok(fs.existsSync(p),`missing ${p}`);
const contract=read('content/financial/product-activation/contracts/financial-runtime-product-contract-v1.json');assert.deepEqual(contract.flow,['FINANCIAL_INTAKE','NORMALIZED_FINANCIAL_STATE','CALCULATION','FINANCIAL_SNAPSHOT','SCENARIO','FINDINGS','PROFESSIONAL_HANDOFF']);assert.equal(contract.rules.modelFinancialCalculationAllowed,false);assert.equal(contract.rules.hiddenScenarioDefaultsAllowed,false);assert.equal(contract.rules.automaticPersistenceAllowed,false);
const reg=read('content/financial/product-activation/registries/financial-runtime-product-capability-registry-v1.json');const by=Object.fromEntries(reg.capabilities.map(x=>[x.code,x]));assert.equal(by.BASE_CALCULATION.authority,'FCR');assert.equal(by.STRUCTURAL_FINDINGS.authority,'FAR');assert.equal(by.PROFESSIONAL_RECOMMENDATION.authority,'PFR');assert.equal(by.SCENARIO.hiddenDefaultsAllowed,false);assert.match(by.USE_MY_FINANCIAL_REALITY_IN_ASK.state,/PENDING|PREPARED/);
const policy=read('content/financial/analysis-runtime/policies/financial-analysis-policy-set-base-v1.json');
const result=await runFinancialProduct({input:{asOfDate:'2026-08-24',baseCurrency:'MYR',monthlyIncome:8000,monthlyExpenses:5000,liquidAssets:30000,investments:50000,property:500000,liabilities:250000,monthlyDebtRepayment:1800},analysisPolicySet:policy});
assert.equal(result.schemaVersion,'PHI-OS-FINANCIAL-RUNTIME-PRODUCT-v1.0.0');assert.equal(result.snapshot.persisted,false);assert.equal(result.snapshot.canonicalCaseCreated,false);assert.equal(result.calculation.runtimeCode,'FINANCIAL_CALCULATION_RUNTIME');assert.match(result.calculation.resultDigest,/^[a-f0-9]{64}$/);assert.equal(result.scenario.hiddenDefaultsUsed,false);assert.equal(result.boundaries.modelCalculationAllowed,false);assert.equal(result.boundaries.recommendationCreated,false);assert.ok(Array.isArray(result.findings));
if(p1Deleted){assert.equal(fs.existsSync('financial-reality.html'),false);const current=fs.readFileSync('professional/financial/index.html','utf8');assert.match(current,/data-cx-surface="FINANCIAL_REALITY"/);}else{const html=fs.readFileSync('financial-reality.html','utf8');for(const s of ['Financial Reality','data-frp-form','data-frp-results','financialReality=ephemeral','/professional/financial/']) assert.ok(html.includes(s),s);assert.ok(!html.includes('guaranteed return'));}
const currentFinancialHtml=fs.readFileSync('professional/financial/index.html','utf8');
const cxRoutePath='content/customer-experience-rebuild/authority/canonical-customer-route-registry-v2.json';
if(fs.existsSync(cxRoutePath)){
  const cxRoutes=read(cxRoutePath);
  const financialRoute=cxRoutes.routes.find(route=>route.routeId==='FINANCIAL_REALITY');
  assert.equal(financialRoute?.canonicalPath,'/professional/financial/','current CX Financial Reality canonical route drift');
  assert.equal(financialRoute?.currentOperationalPath,'/professional/financial/','current CX Financial Reality operational route drift');
  assert.match(currentFinancialHtml,/data-cx-surface="FINANCIAL_REALITY"/,'current Financial Reality surface identity missing');
  const redirects=fs.readFileSync('_redirects','utf8');
  assert.ok(redirects.includes('/financial-reality /professional/financial/ 308'),'legacy Financial Reality route must remain a compatibility redirect');
}else{
  assert.ok(currentFinancialHtml.includes('href="/financial-reality"'),'existing Financial surface must hand off to Financial Reality');
}
assert.ok(fs.readFileSync('sitemap.xml','utf8').includes('/financial-reality'),'sitemap must expose Financial Reality compatibility route');
console.log('✓ STAGE 14 Financial Runtime Product Activation passed.');console.log('  FDR-compatible ephemeral intake → real FCR → real FAR → bounded snapshot/findings → PFR handoff.');console.log('  Scenario stays explicit-assumption-only; no hidden defaults, model calculation, automatic persistence or recommendation authority.');
