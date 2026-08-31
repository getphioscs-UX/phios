import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collectSharedTargetContext,SHARED_TARGET_CONTEXT_VERSION} from '../assets/customer-ui/js/personal-inputs/shared-target-context.js';
import {serializeBaziMethodInput} from '../assets/customer-ui/js/specialists/bazi/input-extension.js';

const read=path=>fs.readFileSync(path,'utf8');
const page=read('perspectives/personal/index.html');
const client=read('assets/customer-ui/js/surfaces/personal-reality.js');
const bazi=read('assets/customer-ui/js/specialists/bazi/input-extension.js');
const control=read('assets/customer-ui/js/personal-inputs/target-moment-place-control.js');
const css=read('assets/customer-ui/surfaces/personal-reality.css');
const fakeForm=values=>({elements:new Proxy({}, {get:(_,name)=>({value:String(values?.[name]??'')})})});
const throwsCode=(fn,code)=>{let actual=null;try{fn()}catch(error){actual=error.code}assert.equal(actual,code)};

assert.equal(SHARED_TARGET_CONTEXT_VERSION,'PPR-SHARED-TARGET-CONTEXT-v1.0.0');
assert.equal((page.match(/name="sharedTargetDate"/g)||[]).length,1,'One visible shared target date owner is required.');
for(const field of ['sharedTargetDate','sharedTargetTime','sharedTargetPlaceQuery','sharedTargetPlaceRef','sharedTargetTimezoneIana','sharedTargetUtcOffset','sharedTargetContextSource'])assert(page.includes(`name="${field}"`),field);
for(const legacy of ['baziTargetDate','baziTargetTime','baziTargetTimezoneIana','baziTargetUtcOffset','ziweiTargetDate','ziweiTargetTime','ziweiTargetTimezoneIana','ziweiTargetUtcOffset','numerologyTargetDate'])assert.equal(page.includes(`name="${legacy}"`),false,`Legacy UI owner must be retired: ${legacy}`);
for(const token of ['data-cx-num-name-details','data-cx-num-relationship-details','name="numerologyFullBirthName"','name="numerologyNameConfirmed"','name="numerologyComparisonBirthDate"'])assert(page.includes(token),token);
assert.equal(/<details[^>]*data-cx-num-name-details[^>]*\sopen(?:\s|>)/.test(page),false,'Birth-name extension must start collapsed.');
assert.equal(/<details[^>]*data-cx-num-relationship-details[^>]*\sopen(?:\s|>)/.test(page),false,'Relationship extension must start collapsed.');
assert.match(client,/syncSharedTargetContext\(form,methods\)/);
assert.match(client,/collectSharedTargetContext\(form,methods\)/);
assert.match(client,/numerologyTargetDate:methods\.includes\('numeric'\)\?\(sharedTarget\?\.targetDate\|\|null\)/);
assert.match(client,/baziTemporalContext:methods\.includes\('bazi'\)\?\(sharedTarget\?\.baziTemporalContext\|\|null\)/);
assert.match(client,/ziweiTargetDate:methods\.includes\('ziwei'\)\?\(ziweiTarget\?\.targetDate\|\|null\)/);
assert.match(bazi,/baziTraditionalCalculationSex/);
for(const legacy of ['baziTargetDate','baziTargetTime','baziTargetTimezoneIana','baziTargetUtcOffset'])assert.doesNotMatch(bazi,new RegExp(`name="${legacy}"`));
assert.match(page,/data-cx-traditional-sex/);
assert.match(bazi,/Used only by the classical Da Yun direction calculation/);
assert.match(bazi,/PPR_R4_BAZI_ZIWEI_TRADITIONAL_RULE_CONFLICT/);
assert.match(control,/scope\.dataset\.cxTargetDateOnly==='true'/);
assert.match(css,/\.cx-shared-target-context/);
assert.match(css,/\.cx-num-extra-disclosure/);

const numeric=collectSharedTargetContext(fakeForm({sharedTargetDate:'2026-08-31'}),['numeric']);
assert.equal(numeric.targetDate,'2026-08-31');
assert.equal(numeric.baziTemporalContext,null);
assert.equal(numeric.ziweiTargetContext,null);

const blankBazi=collectSharedTargetContext(fakeForm({}),['bazi']);
assert.equal(blankBazi.targetDate,null);
assert.equal(blankBazi.baziTemporalContext,null);
throwsCode(()=>collectSharedTargetContext(fakeForm({sharedTargetDate:'2026-08-31'}),['bazi']),'PPR_SHARED_TARGET_CONTEXT_INCOMPLETE');

const full={sharedTargetDate:'2026-08-31',sharedTargetTime:'09:48',sharedTargetTimezoneIana:'Asia/Kuala_Lumpur',sharedTargetUtcOffset:'+08:00',sharedTargetPlaceRef:'N123',sharedTargetContextSource:'CUSTOMER_EDITED'};
const combined=collectSharedTargetContext(fakeForm(full),['bazi','numeric','ziwei']);
assert.equal(combined.targetDate,'2026-08-31');
assert.equal(combined.targetPlaceRef,'N123');
assert.equal(combined.baziTemporalContext.targetDate,combined.targetDate);
assert.equal(combined.baziTemporalContext.targetTime,'09:48:00');
assert.equal(combined.ziweiTargetContext.targetDate,combined.targetDate);
assert.equal(combined.ziweiTargetContext.targetTime,combined.baziTemporalContext.targetTime);
assert.deepEqual(combined.ziweiTargetContext.targetTimezone,combined.baziTemporalContext.targetTimezone);
assert.equal(combined.ziweiTargetContext.source,'CUSTOMER_EDITED');
throwsCode(()=>collectSharedTargetContext(fakeForm({}),['ziwei']),'PPR_SHARED_TARGET_CONTEXT_REQUIRED');

const baziRule=serializeBaziMethodInput({baziTraditionalCalculationSex:'FEMALE'});
assert.deepEqual(baziRule,{traditionalCalculationSex:'FEMALE'});
assert.deepEqual(serializeBaziMethodInput({baziTraditionalCalculationSex:'FEMALE',traditionalCalculationSex:'FEMALE'},['bazi','ziwei']),{traditionalCalculationSex:'FEMALE'});
throwsCode(()=>serializeBaziMethodInput({}),'PPR_R4_BAZI_TRADITIONAL_CALCULATION_RULE_REQUIRED');
throwsCode(()=>serializeBaziMethodInput({baziTraditionalCalculationSex:'FEMALE',traditionalCalculationSex:'MALE'},['bazi','ziwei']),'PPR_R4_BAZI_ZIWEI_TRADITIONAL_RULE_CONFLICT');

console.log('✓ PPR shared target input R1 passed.');
console.log('  BaZi / Zi Wei / Numerology have one target-date owner; full local target context is projected only to BaZi/Zi Wei, while method-specific traditional rules remain separate and Numerology birth-name / relationship inputs are independently collapsed.');
