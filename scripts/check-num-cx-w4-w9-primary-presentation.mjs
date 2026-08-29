import assert from 'node:assert/strict';
import fs from 'node:fs';
import {onRequestPost as executeCustomerPersonalReality} from '../functions/api/customer-personal-reality.js';
import {numerologyLabelRegistry,numerologyPublicLabel} from '../functions/customer-projection/numerology-public-labels-v1.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const t=p=>fs.readFileSync(p,'utf8');
const labels=j('content/professional/num-production/customer/numerology-public-label-registry-v1.json');
const ia=j('content/professional/num-production/customer/numerology-reading-ia-v1.json');
const spec=j('content/professional/num-production/customer/numerology-chart-spec-v1.json');
const contract=j('content/professional/num-production/customer/numerology-customer-reading-envelope-contract-v1.json');const status=j('content/professional/num-production/customer/num-cx-w4-w9-status-v1.json');const successor=j('content/professional/num-production/customer/manifest/num-cx-w0-w9-primary-surface-successor-manifest-v1.json');
const html=t('perspectives/personal/index.html');const client=t('assets/customer-ui/js/surfaces/personal-reality.js');const smrClient=t('assets/customer-ui/js/surfaces/single-method-reading.js');const css=t('assets/customer-ui/surfaces/numerology-reading.css');

assert.equal(status.status,'CHART_FIRST_PRIMARY_PRESENTATION_IMPLEMENTED_PRE_W18');assert.equal(status.boundaries.fullCustomerProductionCutoverClaimed,false);assert.equal(successor.status,'PRIMARY_SURFACE_SUCCESSOR_ACTIVE_PRE_W18');assert.equal(successor.fullCustomerProductionCutoverClaimed,false);

// W4 label authority
assert.equal(labels.work,'NUM-CX-W4');assert.equal(labels.fallbackPolicy,'HUMANIZED_CODE_NOT_GENERIC_STRUCTURE_ITEM');
for(const code of ['LIFE_PATH','BIRTHDAY_NUMBER','ATTITUDE_NUMBER','BIRTH_YEAR_NUMBER','BIRTH_MONTH_NUMBER','BIRTH_DAY_NUMBER','EXPRESSION','SOUL_URGE','PERSONALITY','MATURITY','PERIOD_CYCLE','PINNACLE_CYCLE','CHALLENGE_CYCLE'])assert(labels.labels[code],code);
assert.equal(labels.labels.LIFE_PATH['zh-Hans'],'生命路径');assert.equal(numerologyPublicLabel('LIFE_PATH','zh-Hans'),'生命路径');assert.notEqual(numerologyPublicLabel('SOME_NEW_CODE','zh-Hans'),'结构项');
for(const forbidden of labels.forbiddenPrimaryFallbacks)assert(!Object.values(numerologyLabelRegistry()).flat().includes(forbidden));

// W5 IA + W6 chart spec
assert.equal(ia.work,'NUM-CX-W5');assert.equal(ia.status,'CHART_FIRST_PRIMARY_CUSTOMER_IA');assert.equal(ia.presentationOrder[0],'READING_HERO');assert.equal(ia.presentationOrder.at(-1),'METHOD_EVIDENCE');assert.equal(ia.rules.chartBeforeLongProse,true);assert.equal(ia.rules.genericAtomicCardLoopForbiddenAsPrimaryReading,true);
assert.equal(spec.work,'NUM-CX-W6');assert.equal(spec.status,'PRIMARY_CUSTOMER_CHART_SYSTEM');for(const id of ['CORE_NUMBER_MAP','WHOLE_CHART_PATTERN','NAME_LAYER_MAP','LONG_CYCLE_TIMELINE','CURRENT_TIMING','ENERGY_PATTERN_MAP','RELATIONSHIP_OVERLAY'])assert(spec.charts.some(x=>x.chartId===id),id);assert(spec.charts.every(x=>x.meaningCreated===false));
for(const key of ['priorityNarrative','readingIA','chartSpecVersion'])assert(contract.chartBlocks.includes(key),key);

// W7 client surface ownership
assert(html.includes('/assets/customer-ui/surfaces/numerology-reading.css'));assert(html.includes('data-cx-numerology-reading'));assert(client.includes("../numerology/reading-renderer.js"));assert(client.includes('renderNumerologyReading(view)'));assert(smrClient.includes('numerologyChartFirst'));assert(css.includes('Chart-first Numerology primary customer surface'));
assert(!client.includes('NUMEROLOGY · PRIMARY DATA BRIDGE'),'W0-W3 bridge prose must not remain primary presentation copy.');

async function run(body){const response=await executeCustomerPersonalReality({request:new Request('https://phios.local/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env:{}});const payload=await response.json();assert.equal(response.status,200,JSON.stringify(payload));assert.equal(payload.ok,true);return payload.view}
const minimal=await run({birthDate:'1990-01-15',birthTimeUnknown:true,methods:['numeric'],consent:true,locale:'zh-Hans'});
const full=await run({birthDate:'1989-11-15',birthTimeUnknown:true,methods:['numeric'],consent:true,locale:'zh-Hans',numerologyTargetDate:'2025-05-15',numerologyFullBirthName:'Thomas John Hancock',numerologyNameConfirmed:true,numerologyComparisonBirthDate:'1988-03-20'});
for(const view of [minimal,full]){const num=view.numerology;assert(num);assert.equal(num.integratedReading.customerPublishable,true);assert.equal(num.chartModel.chartSpecVersion,spec.schemaVersion);assert.equal(num.chartModel.readingIA.schemaVersion,ia.schemaVersion);assert.equal(num.chartModel.readingIA.presentation,'CHART_FIRST');assert.equal(num.chartModel.priorityNarrative.schemaVersion,'PHI-OS-NUM-CX-PRIORITY-NARRATIVE-v1.0.0');assert.equal(num.chartModel.priorityNarrative.boundaries.newMeaningCreated,false);assert.equal(num.chartModel.priorityNarrative.boundaries.semanticDedupApplied,true);const summaries=num.chartModel.priorityNarrative.items.map(x=>String(x.summary||'').trim().toLowerCase());assert.equal(new Set(summaries).size,summaries.length,'Priority narrative duplicated semantic copy.');assert.doesNotMatch(JSON.stringify(num),/结构项/);for(const x of num.chartModel.coreNumberMap.nodes)assert(x.label&&x.label!=='结构项',x.id)}
assert.equal(minimal.numerology.chartModel.nameLayerMap,null);assert.equal(minimal.numerology.chartModel.relationshipOverlay,null);
assert(full.numerology.chartModel.nameLayerMap);assert(full.numerology.chartModel.secondaryChartMap);assert(full.numerology.chartModel.energyPatternMap.patterns.length);assert(full.numerology.chartModel.relationshipOverlay);

// W8 NUM-specific SMR successor is active on the primary single-method route.
assert(full.singleMethodReading,'NUM-only primary request must have a single-method reading.');assert.equal(full.singleMethodReading.methodId,'NUM');assert.equal(full.singleMethodReading.numChartFirst.customerReadingRef,'PHI-OS-NUM-CX-INTEGRATED-READING-PUBLIC-v1.0.0');assert.equal(full.singleMethodReading.layout.presentation,'CHART_FIRST');assert.equal(full.singleMethodReading.governance.predecessorGenericNumSmrSuppressedOnPrimarySurface,true);

// W7 rendered DOM contract, evaluated from the same public envelope.
globalThis.document={documentElement:{lang:'zh-Hans'}};
const {buildNumerologyReadingHtml}=await import('../assets/customer-ui/js/numerology/reading-renderer.js');
const minHtml=buildNumerologyReadingHtml(minimal.numerology);const fullHtml=buildNumerologyReadingHtml(full.numerology);
for(const out of [minHtml,fullHtml]){assert(out.includes('data-num-cx-surface="W4-W9"'));assert(out.includes('data-num-section="CORE_NUMBER_MAP"'));assert(out.includes('data-num-section="KEY_SYNTHESIS"'));assert(out.includes('data-num-section="METHOD_EVIDENCE"'));assert(!out.includes('结构项'));assert(!out.includes('角色与推导'));assert(!out.includes('PRIMARY DATA BRIDGE'));assert(!out.includes('主页面数据桥接'))}
assert(!minHtml.includes('data-num-section="NAME_LAYER"'));assert(!minHtml.includes('data-num-section="RELATIONSHIP_OVERLAY"'));assert(fullHtml.includes('data-num-section="NAME_LAYER"'));assert(fullHtml.includes('data-num-section="SECONDARY_CHART"'));assert(fullHtml.includes('data-num-section="LONG_CYCLES"'));assert(fullHtml.includes('data-num-section="CURRENT_TIMING"'));assert(fullHtml.includes('data-num-section="ENERGY_PATTERNS"'));assert(fullHtml.includes('data-num-section="RELATIONSHIP_OVERLAY"'));
assert(!/%\s*(?:compatible|match)|compatibility\s*score\s*[:=]\s*\d/i.test(fullHtml));
console.log('✓ NUM-CX-W4–W9 chart-first primary presentation passed.');
console.log(`  Priority items: ${full.numerology.chartModel.priorityNarrative.items.length}; chart blocks available: ${full.numerology.chartModel.readingIA.blocks.filter(x=>x.available).length}.`);
console.log('  The primary route now renders NUM-D8 as chart-first IA, suppresses predecessor generic NUM prose, keeps evidence collapsed, and preserves no-score/no-fortune boundaries.');
