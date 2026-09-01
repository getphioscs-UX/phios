import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collectSharedTargetContext,SHARED_TARGET_CONTEXT_VERSION} from '../assets/customer-ui/js/personal-inputs/shared-target-context.js';
import {serializeBaziMethodInput} from '../assets/customer-ui/js/specialists/bazi/input-extension.js';

const read=path=>fs.readFileSync(path,'utf8');
const page=read('perspectives/personal/index.html');
const client=read('assets/customer-ui/js/surfaces/personal-reality.js');
const host=read('assets/customer-ui/js/personal-inputs/method-input-extension-host.js');
const bazi=read('assets/customer-ui/js/specialists/bazi/input-extension.js');
const control=read('assets/customer-ui/js/personal-inputs/target-moment-place-control.js');
const css=read('assets/customer-ui/surfaces/personal-reality.css');
const fakeForm=values=>({elements:new Proxy({}, {get:(_,name)=>({value:String(values?.[name]??'')})})});
const throwsCode=(fn,code)=>{let actual=null;try{fn()}catch(error){actual=error.code}assert.equal(actual,code)};

assert.equal(SHARED_TARGET_CONTEXT_VERSION,'PPR-SHARED-TARGET-CONTEXT-v2.0.0');
assert.equal((page.match(/name="sharedTargetDate"/g)||[]).length,1,'One visible shared target date owner is required.');
for(const field of ['sharedTargetDate','sharedTargetTime','sharedTargetPlaceQuery','sharedTargetPlaceRef','sharedTargetTimezoneIana','sharedTargetUtcOffset','sharedTargetContextSource'])assert(page.includes(`name="${field}"`),field);
for(const legacy of ['astCxTargetDate','baziTargetDate','baziTargetTime','baziTargetTimezoneIana','baziTargetUtcOffset','ziweiTargetDate','ziweiTargetTime','ziweiTargetTimezoneIana','ziweiTargetUtcOffset','numerologyTargetDate','baziTraditionalCalculationSex'])assert.equal(page.includes(`name="${legacy}"`),false,`Legacy UI owner must be retired: ${legacy}`);
assert.equal((page.match(/name="traditionalCalculationSex"/g)||[]).length,2,'One shared two-choice traditional-rule control is required.');
for(const token of ['data-cx-num-name-details','data-cx-num-relationship-details','name="numerologyFullBirthName"','name="numerologyNameConfirmed"','name="numerologyComparisonBirthDate"'])assert(page.includes(token),token);
assert.match(page,/共同时间资料 · 只填一次/);
assert.match(page,/八字与紫微斗数共用同一个传统大运顺逆计算规则/);
assert.doesNotMatch(page,/data-cx-ast-target-input/);
assert.match(client,/syncSharedTargetContext\(form,sharedTimingMethods\(form,methods\)\)/);
assert.match(client,/collectSharedTargetContext\(form,timingMethods\)/);
assert.match(client,/astTargetContext:methods\.includes\('astrology'\)\?\(sharedTarget\?\.astTargetContext\|\|null\)/);
assert.match(client,/ecrTargetContext:methods\.includes\('ecr'\)\?\(sharedTarget\?\.ecrTargetContext\|\|null\)/);
assert.match(client,/hdrTargetContext:form\.elements\.externalProfileEnabled/);
assert.match(client,/baziTemporalContext:methods\.includes\('bazi'\)\?\(sharedTarget\?\.baziTemporalContext\|\|null\)/);
assert.match(client,/ziweiTargetDate:methods\.includes\('ziwei'\)\?\(ziweiTarget\?\.targetDate\|\|null\)/);
assert.match(host,/SHARED_INPUT_SUCCESSORS=new Set\(\['astrology','bazi'\]\)/);
assert.match(host,/!SHARED_INPUT_SUCCESSORS\.has\(entry\.methodKey\)/);
assert.match(bazi,/baziTraditionalCalculationSex/,'Historical BaZi extension remains available for lineage/regression only.');
assert.match(control,/scope\.dataset\.cxTargetDateOnly==='true'/);
assert.match(css,/\.cx-shared-target-context/);
assert.match(css,/\.cx-num-extra-disclosure/);

const numeric=collectSharedTargetContext(fakeForm({sharedTargetDate:'2026-08-31'}),['numeric']);
assert.equal(numeric.targetDate,'2026-08-31');
assert.equal(numeric.astTargetContext,null);assert.equal(numeric.ecrTargetContext,null);assert.equal(numeric.hdrTargetContext,null);

const blankTiming=collectSharedTargetContext(fakeForm({}),['astrology','bazi','ecr','humanDesign']);
assert.equal(blankTiming.targetDate,null);assert.equal(blankTiming.astTargetContext,null);assert.equal(blankTiming.ecrTargetContext,null);assert.equal(blankTiming.hdrTargetContext,null);
throwsCode(()=>collectSharedTargetContext(fakeForm({sharedTargetDate:'2026-08-31'}),['astrology','ecr','humanDesign']),'PPR_SHARED_TARGET_CONTEXT_INCOMPLETE');

const full={sharedTargetDate:'2026-08-31',sharedTargetTime:'09:48',sharedTargetTimezoneIana:'Asia/Kuala_Lumpur',sharedTargetUtcOffset:'+08:00',sharedTargetPlaceRef:'N123',sharedTargetContextSource:'CUSTOMER_EDITED'};
const combined=collectSharedTargetContext(fakeForm(full),['astrology','bazi','numeric','ziwei','ecr','humanDesign']);
assert.equal(combined.targetDate,'2026-08-31');assert.equal(combined.targetPlaceRef,'N123');
for(const key of ['astTargetContext','baziTemporalContext','ziweiTargetContext','ecrTargetContext','hdrTargetContext']){assert.equal(combined[key].targetDate,combined.targetDate,key);assert.equal(combined[key].targetTime,'09:48:00',key);assert.deepEqual(combined[key].targetTimezone,combined.baziTemporalContext.targetTimezone,key)}
assert.equal(combined.ziweiTargetContext.source,'CUSTOMER_EDITED');assert.equal(combined.ecrTargetContext.source,'CUSTOMER_EDITED');assert.equal(combined.hdrTargetContext.source,'CUSTOMER_EDITED');
throwsCode(()=>collectSharedTargetContext(fakeForm({}),['ziwei']),'PPR_SHARED_TARGET_CONTEXT_REQUIRED');

// Historical extension serialization remains deterministic, but current customer UI no longer renders/collects it.
assert.deepEqual(serializeBaziMethodInput({baziTraditionalCalculationSex:'FEMALE'}),{traditionalCalculationSex:'FEMALE'});

console.log('✓ PPR shared target input R2 passed.');
console.log('  Astrology / BaZi / Numerology / Zi Wei / ECR / Human Design share one target owner; BaZi + Zi Wei share one visible traditional direction-rule owner, while frozen historical extensions remain non-visible compatibility witnesses.');
