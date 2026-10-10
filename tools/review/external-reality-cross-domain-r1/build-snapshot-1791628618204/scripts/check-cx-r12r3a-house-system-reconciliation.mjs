import assert from 'node:assert/strict';
import fs from 'node:fs';
import {placidusCusps,houseNumberFromCusps} from '../functions/ast-production/ast-structural-calculation-runtime.js';
import {ASTA_DEFAULT_HOUSE_SYSTEM_CODE,ASTA_HOUSE_SYSTEM_PLACIDUS,ASTA_HOUSE_SYSTEM_WHOLE_SIGN,getAstHouseSystemPolicy} from '../functions/ast-production/ast-house-system-registry.js';

assert.equal(ASTA_DEFAULT_HOUSE_SYSTEM_CODE,'PLACIDUS_V1');
assert.equal(getAstHouseSystemPolicy(ASTA_HOUSE_SYSTEM_PLACIDUS).customerDefault,true);
assert.equal(getAstHouseSystemPolicy(ASTA_HOUSE_SYSTEM_WHOLE_SIGN).customerDefault,false);

const angles={
  localSiderealTimeDegrees:17.909762147213087,
  meanObliquityDegrees:23.442497433691866,
  ascendantLongitude:108.36510199748531,
  midheavenLongitude:19.405042957797857,
  descendantLongitude:288.36510199748534,
  imumCoeliLongitude:199.40504295779786
};
const expected=[108.36510199748531,136.3779840747206,167.01556300130048,199.40504295779786,230.8702577829809,260.15686472773245,288.36510199748534,316.3779840747206,347.0155630013005,19.405042957797857,50.870257782980914,80.15686472773247];
const cusps=placidusCusps(angles,4.85);
assert.equal(cusps.length,12);
for(let i=0;i<12;i++)assert.ok(Math.abs(cusps[i].longitude-expected[i])<1e-8,`Placidus cusp ${i+1} drift: ${cusps[i].longitude} vs ${expected[i]}`);

const placementReference={
  SUN:[233.22,5],MOON:[86.37,12],MERCURY:[236.05,5],VENUS:[280.09,6],MARS:[217.66,4],
  JUPITER:[100.36,12],SATURN:[280.56,6],URANUS:[273.11,6],NEPTUNE:[280.42,6],PLUTO:[225.44,4]
};
for(const [body,[longitude,expectedHouse]] of Object.entries(placementReference))assert.equal(houseNumberFromCusps(longitude,cusps),expectedHouse,`${body} Placidus house mismatch`);


const projection=fs.readFileSync('functions/method-client-delivery/canonical-projection-runtime-ast-v2.js','utf8');
const reading=fs.readFileSync('functions/runtime-reading/ast-reading-ir.js','utf8');
const customer=fs.readFileSync('functions/customer-projection/astrology-customer-projection.js','utf8');
const ui=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
const policy=JSON.parse(fs.readFileSync('content/professional/ast-production/policies/ast-house-system-policy-v2.json','utf8'));
assert.equal(policy.defaultCustomerHouseSystem,'PLACIDUS_V1');
assert.ok(projection.includes('ASTA_DEFAULT_HOUSE_SYSTEM_CODE'));
assert.ok(!reading.includes("houseSystem:'WHOLE_SIGN_V1'"),'runtime reading must not hard-code Whole Sign');
assert.ok(customer.includes('houseSystemInfo'));
assert.ok(customer.includes("'普拉西德宫制'"));
assert.ok(ui.includes('astroDegreeMinute'));
assert.ok(ui.includes('cx-ast-wheel__house'));
assert.ok(ui.includes("'Calculation method','计算方式'"));
console.log('✓ CX-R12R3A House System Reconciliation passed: Placidus is the versioned customer default; Whole Sign remains supported; 12 independent reference cusps matched within 1e-8° and the comparison-chart planet house placements reconcile to the Placidus pattern.');
