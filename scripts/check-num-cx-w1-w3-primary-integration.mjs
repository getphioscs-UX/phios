import assert from 'node:assert/strict';
import fs from 'node:fs';
import {onRequestPost as executeCustomerPersonalReality} from '../functions/api/customer-personal-reality.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const t=p=>fs.readFileSync(p,'utf8');
const contract=j('content/professional/num-production/customer/numerology-customer-reading-envelope-contract-v1.json');
const html=t('perspectives/personal/index.html');
const client=t('assets/customer-ui/js/surfaces/personal-reality.js');
const api=t('functions/api/customer-personal-reality.js');
const envelope=t('functions/customer-projection/numerology-customer-reading-envelope-v1.js');
const meaningHandler=t('functions/canonical-meaning-production/api-method-meaning-handler.js');
assert.equal(contract.work,'NUM-CX-W1');
assert.equal(contract.runtimeSchemaVersion,'PHI-OS-NUM-CX-CUSTOMER-READING-ENVELOPE-v1.0.0');
assert.equal(contract.chartSchemaVersion,'PHI-OS-NUM-CX-CHART-MODEL-v1.0.0');
for(const key of ['methodId','calculationSummary','chartModel','integratedReading','sourceLineage','availability','inputCoverage','boundaries','readingDigest'])assert(contract.required.includes(key),key);
for(const key of ['overviewTiles','coreNumberMap','wholeChartPattern','nameLayerMap','secondaryChartMap','cycleTimeline','timingBand','energyPatternMap','relationshipOverlay','priorityThemes'])assert(contract.chartBlocks.includes(key),key);
assert.equal(contract.publicBoundary.rawCanonicalProjectionExposed,false);
assert.equal(contract.publicBoundary.browserCreatesMeaning,false);
assert.equal(contract.publicBoundary.chartCreatesMeaning,false);
assert.equal(contract.publicBoundary.compatibilityScoreAllowed,false);
assert.equal(contract.publicBoundary.fortunePredictionAllowed,false);

// W2: the primary API consumes the same admitted production meaning composition as /api/method-meaning.
assert.match(api,/buildProductionMethodMeaningPayload/);
assert.match(api,/buildNumerologyCustomerReadingEnvelope/);
assert.match(api,/projectNumerologyEnvelopeForCustomer/);
assert.match(api,/const numerology=projectNumerologyEnvelopeForCustomer/);
assert.match(meaningHandler,/export async function buildProductionMethodMeaningPayload/);
assert.match(envelope,/PHI-OS-NUM-CX-CHART-MODEL-v1\.0\.0/);
assert.match(envelope,/NUM_D8_FULL_PRODUCTION_ACTIVE/);

// W3: the primary form can progressively unlock NUM depth without making these fields global requirements.
for(const token of ['data-cx-numerology-details','name="numerologyTargetDate"','name="numerologyFullBirthName"','name="numerologyNameConfirmed"','name="numerologyComparisonBirthDate"'])assert(html.includes(token),token);
for(const token of ['numerologyTargetDate','numerologyFullBirthName','numerologyNameConfirmed','numerologyComparisonBirthDate'])assert(client.includes(token),token);
assert.match(client,/methods\.includes\('numeric'\)/);
assert.match(client,/view\?\.numerology/);
assert.match(client,/renderNumerologyPrimaryBridge/);
assert.match(client,/m\.methodId==='NUM'&&view\?\.numerology\?\.integratedReading\?\.customerPublishable===true/);
assert.equal(client.includes('globalThis.fetch'),false,'Primary NUM route must not depend on fetch monkey-patching to create meaning.');

async function run(body){
 const response=await executeCustomerPersonalReality({request:new Request('https://phios.local/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env:{}});
 const payload=await response.json();
 assert.equal(response.status,200,JSON.stringify(payload));
 assert.equal(payload.ok,true);
 return payload;
}

const minimal=await run({birthDate:'1990-01-15',birthTimeUnknown:true,methods:['numeric'],consent:true,locale:'en'});
assert.equal(minimal.location,null,'NUM-only core reading must not require birth place.');
const min=minimal.view.numerology;
assert(min,'Primary view must include NUM envelope.');
assert.equal(min.schemaVersion,contract.runtimeSchemaVersion);
assert.equal(min.publicMethodCode,'NUMEROLOGY_PROJECTION');
assert.equal(min.integratedReading.customerPublishable,true);
assert.equal(min.integratedReading.numD8State,'NUM_D8_FULL_PRODUCTION_ACTIVE');
assert.equal(min.chartModel.schemaVersion,contract.chartSchemaVersion);
assert.equal(min.chartModel.overviewTiles.length,3);
assert.deepEqual(min.chartModel.overviewTiles.map(x=>x.id),['LIFE_PATH','BIRTHDAY_NUMBER','ATTITUDE_NUMBER']);
assert.equal(min.inputCoverage.birthDate,true);
assert.equal(min.inputCoverage.targetDate,false);
assert.equal(min.inputCoverage.confirmedBirthName,false);
assert.equal(min.inputCoverage.relationshipComparison,false);
assert.equal(Object.hasOwn(min,'canonicalProjection'),false,'Raw canonical projection must not be public.');

const full=await run({birthDate:'1989-11-15',birthTimeUnknown:true,methods:['numeric'],consent:true,locale:'en',numerologyTargetDate:'2025-05-15',numerologyFullBirthName:'Thomas John Hancock',numerologyNameConfirmed:true,numerologyComparisonBirthDate:'1988-03-20'});
const num=full.view.numerology;
assert.equal(num.integratedReading.customerPublishable,true);
assert.equal(num.integratedReading.numD8State,'NUM_D8_FULL_PRODUCTION_ACTIVE');
assert.equal(num.inputCoverage.birthDate,true);
assert.equal(num.inputCoverage.targetDate,true);
assert.equal(num.inputCoverage.confirmedBirthName,true);
assert.equal(num.inputCoverage.relationshipComparison,true);
assert(num.chartModel.wholeChartPattern);
assert(num.chartModel.nameLayerMap,'Confirmed name must unlock the name chart model.');
assert(num.chartModel.secondaryChartMap,'Confirmed source-aligned name must unlock the secondary chart model.');
assert(num.chartModel.cycleTimeline);
assert(num.chartModel.timingBand?.energy,'Explicit target date must reach the governed alternative timing model even when standard-cycle timezone context is absent.');
assert(num.chartModel.relationshipOverlay,'Comparison birth date must unlock structural relationship overlay.');
assert.equal(num.chartModel.relationshipOverlay.boundaries.compatibilityScoreCreated,false);
assert.equal(num.chartModel.boundaries.fortunePredictionCreated,false);
assert.equal(num.chartModel.energyPatternMap.unknownMeaningInvented,false);
assert(num.integratedReading.roleReadings.length>=3,'Admitted role meanings must reach the primary envelope.');
assert(num.integratedReading.depth.nameRoleMeanings.length>=4,'D8 name-role meanings must reach the primary envelope.');
assert(num.integratedReading.depth.longCycleMeanings.length>=1,'D8 long-cycle meanings must reach the primary envelope.');
assert(num.integratedReading.narrative.some(x=>/target date was supplied/i.test(x)),'Public narrative must not claim target date is missing when the customer supplied one.');
assert(!num.integratedReading.narrative.some(x=>/No target date was supplied/i.test(x)));
assert.equal(Object.hasOwn(num,'canonicalProjection'),false);
const publicNum=JSON.stringify(num);
assert.doesNotMatch(publicNum,/\b(?:AVAILABLE|PARTIAL|DETERMINISTIC|STRUCTURE_ONLY|HUMAN_REVIEW_REQUIRED|COMPOSITION_SUPPORTED|SOURCE_ADMITTED)\b|projectionId|projectionDigest|reasonCode/,'Internal lifecycle/projection state leaked into public NUM envelope.');
console.log('✓ NUM-CX-W1–W3 primary NUM integration passed.');
console.log('  /api/customer-personal-reality returns a public NUM-D8 integrated reading plus canonical chartModel; progressive target/name/relationship inputs reach the production runtime without raw projection leakage.');
