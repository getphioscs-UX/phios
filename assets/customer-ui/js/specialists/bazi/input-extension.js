const CSS_HREF='/assets/customer-ui/surfaces/bazi-input-extension.css';
const clean=value=>String(value??'').trim();
const fail=(code,message)=>{const error=new Error(message||code);error.code=code;throw error};
const zh=()=>typeof document!=='undefined'&&document.documentElement?.lang==='zh-Hans';
const tr=(en,cn)=>zh()?cn:en;
function ensureCss(){if(typeof document==='undefined'||document.querySelector('link[data-ppr-r4-bazi-input-css="true"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href=CSS_HREF;link.dataset.pprR4BaziInputCss='true';document.head?.appendChild(link)}
export const BAZI_INPUT_EXTENSION_ID='PPR_R4_BAZI_INPUT_EXTENSION_V1';
export const BAZI_TARGET_FIELD_NAMES=Object.freeze(['baziTargetDate','baziTargetTime','baziTargetTimezoneIana','baziTargetUtcOffset']);

export function render(){
 return `<section class="cx-bazi-input-extension" data-ppr-r4-method-input="bazi" data-cx-bazi-target-context>
  <header><p class="cx-eyebrow">${tr('BAZI · METHOD INPUT','八字 · 方法输入')}</p><h3 class="cx-heading">${tr('Choose the calculation rule first. Add a timing target only when you want one.','先选择传统大运顺逆计算规则；只有你想读取特定时间层时，才填写目标时间。')}</h3><p class="cx-body cx-muted">${tr('These controls belong to the BaZi method. They do not describe identity or personality, and no current date or timezone is filled automatically.','这些控件只属于八字方法。传统顺逆选项不是人格或身份标签；目标日期与时区也不会由浏览器或服务器自动填写。')}</p></header>
  <fieldset class="cx-bazi-input-rule"><legend>${tr('Traditional Da Yun direction calculation rule','传统大运顺逆计算规则')}</legend><div class="cx-personal-choice-row"><label><input type="radio" name="baziTraditionalCalculationSex" value="MALE"><span>${tr('Male rule','男性规则')}</span></label><label><input type="radio" name="baziTraditionalCalculationSex" value="FEMALE"><span>${tr('Female rule','女性规则')}</span></label></div><small>${tr('Used only by the classical Da Yun direction calculation.','只用于古典大运顺逆计算，不作为人格、身份或价值判断。')}</small></fieldset>
  <details class="cx-bazi-target-disclosure"><summary>${tr('Da Yun / Liu Nian target context (optional)','大运／流年目标时间（可选）')}</summary><p class="cx-body cx-muted">${tr('Leave all four fields blank for a natal-only reading. If you add a target, all four values are required together and are sent exactly from your visible input.','只看原局时四项全部留空；若加入目标时间，四项必须一起填写，并以你可见的输入值送入运行时。')}</p><div class="cx-bazi-target-grid"><label class="cx-p1-field"><span>${tr('Target date','目标日期')}</span><input type="date" name="baziTargetDate" data-cx-bazi-target-field="date"></label><label class="cx-p1-field"><span>${tr('Target time','目标时间')}</span><input type="time" name="baziTargetTime" step="60" data-cx-bazi-target-field="time"></label><label class="cx-p1-field"><span>${tr('IANA timezone','IANA 时区')}</span><input type="text" name="baziTargetTimezoneIana" spellcheck="false" autocomplete="off" placeholder="Asia/Kuala_Lumpur" data-cx-bazi-target-field="timezone"></label><label class="cx-p1-field"><span>${tr('UTC offset at target','目标时刻 UTC 偏移')}</span><input type="text" name="baziTargetUtcOffset" spellcheck="false" autocomplete="off" placeholder="+08:00" pattern="[+-](?:0[0-9]|1[0-4]):[0-5][0-9]" data-cx-bazi-target-field="offset"></label></div><p class="cx-p1-note">${tr('No browser-now, server-now, device timezone or hidden current-year default is used.','不会使用浏览器当前时间、服务器当前时间、装置时区或隐藏的当前年份默认值。')}</p></details>
 </section>`;
}
export function install(){ensureCss()}

export function serializeBaziMethodInput(values={},methods=[]){
 const sex=clean(values.baziTraditionalCalculationSex);
 if(!sex)fail('PPR_R4_BAZI_TRADITIONAL_CALCULATION_RULE_REQUIRED','BaZi traditional calculation rule is required.');
 if(!['MALE','FEMALE'].includes(sex))fail('PPR_R4_BAZI_TRADITIONAL_CALCULATION_RULE_INVALID');
 const target=BAZI_TARGET_FIELD_NAMES.map(name=>clean(values[name])),supplied=target.filter(Boolean).length;
 if(supplied>0&&supplied<4)fail('PPR_R4_BAZI_TARGET_CONTEXT_INCOMPLETE','BaZi target context is all-or-nothing.');
 if(supplied===4){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(target[0]))fail('PPR_R4_BAZI_TARGET_DATE_INVALID');
  if(!/^\d{2}:\d{2}(?::\d{2})?$/.test(target[1]))fail('PPR_R4_BAZI_TARGET_TIME_INVALID');
  if(!/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(target[2]))fail('PPR_R4_BAZI_TARGET_TIMEZONE_INVALID');
  if(!/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(target[3]))fail('PPR_R4_BAZI_TARGET_OFFSET_INVALID');
 }
 const ziweiSex=methods.includes('ziwei')?clean(values.traditionalCalculationSex):'';
 if(ziweiSex&&ziweiSex!==sex)fail('PPR_R4_BAZI_ZIWEI_TRADITIONAL_RULE_CONFLICT','BaZi and Zi Wei selected different traditional calculation rules.');
 return Object.freeze({traditionalCalculationSex:sex,baziTemporalContext:supplied===4?Object.freeze({targetDate:target[0],targetTime:target[1],targetTimezone:Object.freeze({iana:target[2],utcOffsetAtTarget:target[3]})}):null});
}

export function collect({form,methods=[]}={}){
 const fd=new FormData(form),values={traditionalCalculationSex:fd.get('traditionalCalculationSex')};
 for(const name of ['baziTraditionalCalculationSex',...BAZI_TARGET_FIELD_NAMES])values[name]=fd.get(name);
 return serializeBaziMethodInput(values,methods);
}
export default Object.freeze({BAZI_INPUT_EXTENSION_ID,BAZI_TARGET_FIELD_NAMES,render,install,serializeBaziMethodInput,collect});
