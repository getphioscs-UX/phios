import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {renderBaziCustomerNarrativeSurface,renderBaziProfessionalTopicSurface,renderBaziTimingSurface,renderBaziWholeChartFirst} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';

const readJson=rel=>JSON.parse(fs.readFileSync(new URL(rel,import.meta.url),'utf8'));
const fixture=readJson('../content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const contract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-customer-narrative-composer-v1.json');
const acceptance=readJson('../content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w10-engineering-acceptance-v1.json');
const expectedTopics=['CAREER','WEALTH','RELATIONSHIPS','FAMILY','CAPABILITY','PRESSURE','LIFE_OPERATION'];
const banned=/Reading IR|semantic owner|\bauthority\b|\badmitted\b|Full Production|BAZI-CX-PRO-W\d+|PPR-C1-W\d+/i;
const zhText=node=>node?.zhHans||'';
const enText=node=>node?.en||'';
function visibleTexts(n){
 const out=[];const add=x=>{if(x?.en)out.push(x.en);if(x?.zhHans)out.push(x.zhHans)};
 add(n.opening?.headline);for(const x of n.opening?.paragraphs||[])add(x);
 for(const x of n.priorityChapters||[]){add(x.title);add(x.thesis);add(x.development);add(x.condition)}
 for(const x of n.topicNarratives||[]){add(x.headline);add(x.lead);add(x.development);add(x.condition)}
 if(n.timingNarrative?.available){add(n.timingNarrative.headline);for(const x of n.timingNarrative.paragraphs||[])add(x)}
 return out;
}

assert.equal(contract.workId,'BAZI-CX-PRO-W10');
assert.equal(acceptance.baseline.commit,'8d66f4c885175d6cc16c8d031b3ec96b59635a81');
assert.equal(acceptance.baseline.librarySnapshot,'data.zip');

const noTarget=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
assert.equal(noTarget.governance.customerNarrativeComposerAuthorized,true);
assert.equal(noTarget.professionalModules.narrativeExtensionVersion,'BAZI-CX-PRO-W10-v1.0.0');
const n=noTarget.professionalModules.customerNarrative;
assert.equal(n.schemaVersion,'PHI-OS-BAZI-CX-PRO-CUSTOMER-NARRATIVE-v1.0.0');
assert(n.priorityChapters.length>=3&&n.priorityChapters.length<=5);
assert.equal(n.priorityChapters.length,noTarget.professionalModules.wholeChartPriority.themeCount);
assert.deepEqual(n.priorityChapters.map(x=>x.priorityRef),noTarget.professionalModules.wholeChartPriority.themes.map(x=>x.priorityId));
assert.deepEqual(n.topicNarratives.map(x=>x.topicCode),expectedTopics);
assert.equal(n.topicNarratives.length,7);
assert.equal(n.timingNarrative.available,false);
assert.equal(n.dedup.exactDuplicateCount,0);
assert.equal(n.boundaries.newChartFactCreated,false);
assert.equal(n.boundaries.rendererMayNotInventNarrative,true);
for(const text of visibleTexts(n)){assert(text.trim().length>0);assert.doesNotMatch(text,banned)}
assert.match(zhText(n.opening.headline),/日主/);
assert.match(zhText(n.opening.paragraphs[0]),/整盘|主线/);
assert(n.priorityChapters.some(x=>x.themeType==='RELATIONSHIP'));
assert(n.priorityChapters.some(x=>x.themeType==='PATTERN'));
assert(n.priorityChapters.some(x=>x.themeType==='TEN_GOD_GROUP'));
assert(n.priorityChapters.some(x=>x.themeType==='CARRYING'));
assert.equal(new Set(n.topicNarratives.map(x=>zhText(x.development))).size,7);
assert.equal(new Set(n.topicNarratives.map(x=>zhText(x.condition))).size,7);

const first=buildInputs(generateCampaignCases()[0]);
const explicit=await buildBaziMethodNativeReading({canonicalProjection:first.canonicalProjection,temporalProjectionOverride:first.temporalProjection,locale:'zh-Hans'});
const en=explicit.professionalModules.customerNarrative;
assert.equal(en.timingNarrative.available,true);
assert.equal(en.timingNarrative.paragraphs.length,2);
assert(en.timingNarrative.topicCodes.length>=1&&en.timingNarrative.topicCodes.length<=3);
assert(en.timingNarrative.priorityRefs.length>=1);
assert.match(zhText(en.timingNarrative.headline),/大运|流年/);
for(const text of visibleTexts(en)){assert.doesNotMatch(text,banned)}

// Browser-like customer rendering.
globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({dataset:{}}),head:{appendChild:()=>{}}};
globalThis.queueMicrotask=globalThis.queueMicrotask||((fn)=>fn());
const narrativeHtml=renderBaziCustomerNarrativeSurface(noTarget,{embedded:true});
assert.match(narrativeHtml,/data-bazi-cx-pro-customer-narrative="true"/);
assert.match(narrativeHtml,/你的整盘主线/);
assert.match(narrativeHtml,/整盘最先要看的接口|组织路径|十神结构中进入前景/);
assert.doesNotMatch(narrativeHtml,banned);
const topicHtml=renderBaziProfessionalTopicSurface(noTarget,{embedded:true});
assert.match(topicHtml,/cx-bazi-topic-narrative/);
assert.match(topicHtml,/这段解读怎么拿捏/);
const timingHtml=renderBaziTimingSurface(explicit,{embedded:true});
assert.match(timingHtml,/data-bazi-cx-pro-timing-narrative="true"/);
assert.match(timingHtml,/当前时间主线/);
assert.match(timingHtml,/不是另起一张命盘/);
const rendered=renderBaziProduct({product:{sourceProduct:noTarget,state:'PUBLISHED'}});
assert.equal(rendered.status,'RENDERED');
assert.match(rendered.readingHtml,/data-bazi-cx-pro-customer-narrative="true"/);
assert.match(rendered.readingHtml,/为什么先读这些主线/);
const whole=renderBaziWholeChartFirst(noTarget);
assert.match(whole,/data-bazi-cx-pro-customer-narrative="true"/);

// 24-case deterministic narrative regression.
let checked=0;const chapterCounts=new Set(),timingTopicCounts=new Set();
for(const spec of generateCampaignCases().slice(0,24)){
 const {canonicalProjection,temporalProjection}=buildInputs(spec);
 const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection,temporalProjection,locale:'zh-Hans'});
 const modules=buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'});
 const narrative=modules.customerNarrative;
 assert(narrative.priorityChapters.length>=3&&narrative.priorityChapters.length<=5);
 assert.equal(narrative.topicNarratives.length,7);
 assert.equal(narrative.dedup.exactDuplicateCount,0);
 assert.equal(new Set(narrative.priorityChapters.map(x=>x.priorityRef)).size,narrative.priorityChapters.length);
 assert.equal(new Set(narrative.topicNarratives.map(x=>x.topicCode)).size,7);
 assert.equal(new Set(narrative.topicNarratives.map(x=>zhText(x.development))).size,7);
 for(const txt of visibleTexts(narrative))assert.doesNotMatch(txt,banned);
 chapterCounts.add(narrative.priorityChapters.length);timingTopicCounts.add(narrative.timingNarrative.topicCodes.length);checked++;
}
assert.equal(checked,24);
assert(chapterCounts.size>=1);
assert([...timingTopicCounts].every(x=>x>=1&&x<=3));

const css=fs.readFileSync(new URL('../assets/customer-ui/surfaces/bazi-professional-reading.css',import.meta.url),'utf8');
for(const token of ['.cx-bazi-customer-narrative','.cx-bazi-narrative-opening','.cx-bazi-narrative-thread','.cx-bazi-narrative-chapter','.cx-bazi-topic-narrative','.cx-bazi-topic-condition','.cx-bazi-timing-narrative'])assert(css.includes(token),`W10 CSS missing ${token}`);
assert.equal(acceptance.status,'MACHINE_VERIFIED');
assert.equal(acceptance.acceptance.customerNarrativeComposerAuthorized,true);

console.log('✓ BAZI-CX-PRO W10 Customer Narrative Composer passed.');
console.log(`  Fixture narrative ${n.priorityChapters.length} priority chapters + ${n.topicNarratives.length}/7 topic narratives; explicit timing narrative ${en.timingNarrative.topicCodes.length} foreground topic(s); 24-case regression PASS.`);
