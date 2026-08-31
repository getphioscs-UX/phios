import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {renderBaziDayMasterStrengthSurface,renderBaziFiveElementSurface,renderBaziWholeChartFirst} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';

const fixture=JSON.parse(fs.readFileSync(new URL('../content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json',import.meta.url),'utf8'));
const product=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});

global.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild:()=>{}}};
global.queueMicrotask=global.queueMicrotask||((fn)=>fn());

assert.equal(product.productVersion,'BAZI-FP-v1.0.0@PPR-C1-W12');
assert.equal(product.governance.fiveElementVisualProjectionAuthorized,true);
assert.equal(product.governance.tenGodProfessionalCompositionAuthorized,true);
assert.equal(product.governance.dayMasterStrengthProfessionalCompositionAuthorized,true);

const modules=product.professionalModules;
assert.ok(['BAZI-CX-PRO-W5-v1.0.0','BAZI-CX-PRO-W6-v1.0.0'].includes(modules.moduleVersion));
assert.equal(modules.fiveElements.schemaVersion,'PHI-OS-BAZI-CX-PRO-FIVE-ELEMENT-VISUAL-PROJECTION-v1.0.0');
assert.equal(modules.tenGods.schemaVersion,'PHI-OS-BAZI-CX-PRO-TEN-GOD-PROFESSIONAL-COMPOSITION-v1.0.0');
assert.equal(modules.dayMasterStrength.schemaVersion,'PHI-OS-BAZI-CX-PRO-DAY-MASTER-STRENGTH-PROFESSIONAL-COMPOSITION-v1.0.0');

assert.equal(modules.tenGods.items.length,10);
assert.equal(modules.tenGods.functionGroups.length,5);
assert.equal(modules.tenGods.totalTouches,modules.tenGods.items.reduce((sum,item)=>sum+item.count,0));
assert.equal(modules.tenGods.items.find(item=>item.tenGodCode==='PIAN_CAI')?.count,2);
assert.equal(modules.tenGods.items.find(item=>item.tenGodCode==='PIAN_CAI')?.ratio,18.2);
assert.equal(modules.tenGods.items.find(item=>item.tenGodCode==='BI_JIAN')?.count,1);
assert.equal(modules.tenGods.items.find(item=>item.tenGodCode==='ZHENG_GUAN')?.count,0);
assert.equal(modules.tenGods.boundaries.goodBadScoreCreated,false);

const signalCodes=modules.dayMasterStrength.signals.map(item=>item.signalCode);
assert.deepEqual(signalCodes,['DE_LING','DE_DI','DE_ZHU','XIE','HAO','KE','GEN_QI','TOU_GAN']);
assert.equal(modules.dayMasterStrength.seasonalSupport.getLingState,'CONTROLLED_BY_MONTH_COMMAND');
assert.equal(modules.dayMasterStrength.roots.total,1);
assert.equal(modules.dayMasterStrength.transparentStems.count,3);
assert.equal(modules.dayMasterStrength.supportBalance.supportVisible,4);
assert.equal(modules.dayMasterStrength.supportBalance.outwardVisible,1);
assert.equal(modules.dayMasterStrength.supportBalance.pressureVisible,2);
assert.equal(modules.dayMasterStrength.boundaries.strongWeakLabelCreated,false);

const strengthHtml=renderBaziDayMasterStrengthSurface(product,{embedded:true});
assert.match(strengthHtml,/data-bazi-cx-pro-day-master-strength="true"/);
assert.match(strengthHtml,/得令/);
assert.match(strengthHtml,/整体承载倾向/);
assert.match(strengthHtml,/身强/);

const elementHtml=renderBaziFiveElementSurface(product,{embedded:true});
assert.match(elementHtml,/data-bazi-cx-pro-five-elements="true"/);
assert.match(elementHtml,/data-bazi-cx-pro-ten-gods="true"/);
assert.match(elementHtml,/个十神落点/);
assert.match(elementHtml,/偏财/);
assert.match(elementHtml,/功能组/);

const wholeChartHtml=renderBaziWholeChartFirst(product,{embedded:true});
assert.match(wholeChartHtml,/data-bazi-cx-pro-day-master-strength="true"/);
assert.match(wholeChartHtml,/data-bazi-cx-pro-ten-gods="true"/);
assert.match(wholeChartHtml,/data-ppr-bazi-customer-safe-graph="true"/);

const rendered=renderBaziProduct({product:{sourceProduct:product,state:'PUBLISHED'}});
assert.equal(rendered.status,'RENDERED');
assert.match(rendered.readingHtml,/id="bazi-section-chart"/);
assert.match(rendered.readingHtml,/id="bazi-section-elements"/);
assert.match(rendered.readingHtml,/data-bazi-cx-pro-day-master-strength="true"/);
assert.match(rendered.readingHtml,/data-bazi-cx-pro-ten-gods="true"/);

const css=fs.readFileSync(new URL('../assets/customer-ui/surfaces/bazi-professional-reading.css',import.meta.url),'utf8');
assert.match(css,/\.cx-bazi-ten-god-column-grid/);
assert.match(css,/\.cx-bazi-strength-signal-grid/);
assert.match(css,/\.cx-bazi-strength-balance-bar/);

const tenGodContract=JSON.parse(fs.readFileSync(new URL('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-ten-god-professional-composition-v1.json',import.meta.url),'utf8'));
const strengthContract=JSON.parse(fs.readFileSync(new URL('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-day-master-strength-professional-composition-v1.json',import.meta.url),'utf8'));
const acceptance=JSON.parse(fs.readFileSync(new URL('../content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w3-w4-engineering-acceptance-v1.json',import.meta.url),'utf8'));
assert.equal(tenGodContract.status,'ADMITTED');
assert.equal(strengthContract.status,'ADMITTED');
assert.equal(acceptance.status,'MACHINE_VERIFIED');
assert.equal(acceptance.acceptance.tenGodProfessionalCompositionAuthorized,true);
assert.equal(acceptance.acceptance.dayMasterStrengthProfessionalCompositionAuthorized,true);

console.log('✓ BAZI-CX-PRO W3/W4 passed.');
console.log(`  Product ${product.productVersion}; ten-god touches ${modules.tenGods.totalTouches}; carrying tendency ${modules.dayMasterStrength.carriers.overallTendency}.`);
