const CSS_HREF='/assets/customer-ui/surfaces/bazi-input-extension.css';
const clean=value=>String(value??'').trim();
const fail=(code,message)=>{const error=new Error(message||code);error.code=code;throw error};
const zh=()=>typeof document!=='undefined'&&document.documentElement?.lang==='zh-Hans';
const tr=(en,cn)=>zh()?cn:en;
function ensureCss(){if(typeof document==='undefined'||document.querySelector('link[data-ppr-r4-bazi-input-css="true"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href=CSS_HREF;link.dataset.pprR4BaziInputCss='true';document.head?.appendChild(link)}
export const BAZI_INPUT_EXTENSION_ID='PPR_R4_BAZI_INPUT_EXTENSION_V1';

export function render(){
 return `<section class="cx-bazi-input-extension" data-ppr-r4-method-input="bazi">
  <header><p class="cx-eyebrow">${tr('BAZI · METHOD INPUT','八字 · 方法输入')}</p><h3 class="cx-heading">${tr('Choose the traditional Da Yun direction rule.','选择传统大运顺逆计算规则。')}</h3><p class="cx-body cx-muted">${tr('The target date, time and place are entered once in the shared timing section above. BaZi consumes that shared target only when you choose a timing layer.','目标日期、时间与地点统一在上方共同时间资料填写一次；只有你选择时间层时，八字才会读取那份共同目标资料。')}</p></header>
  <fieldset class="cx-bazi-input-rule"><legend>${tr('Traditional Da Yun direction calculation rule','传统大运顺逆计算规则')}</legend><div class="cx-personal-choice-row"><label><input type="radio" name="baziTraditionalCalculationSex" value="MALE"><span>${tr('Male rule','男性规则')}</span></label><label><input type="radio" name="baziTraditionalCalculationSex" value="FEMALE"><span>${tr('Female rule','女性规则')}</span></label></div><small>${tr('Used only by the classical Da Yun direction calculation.','只用于古典大运顺逆计算，不作为人格、身份或价值判断。')}</small></fieldset>
 </section>`;
}
export function install(){ensureCss()}

export function serializeBaziMethodInput(values={},methods=[]){
 const sex=clean(values.baziTraditionalCalculationSex);
 if(!sex)fail('PPR_R4_BAZI_TRADITIONAL_CALCULATION_RULE_REQUIRED','BaZi traditional calculation rule is required.');
 if(!['MALE','FEMALE'].includes(sex))fail('PPR_R4_BAZI_TRADITIONAL_CALCULATION_RULE_INVALID');
 const ziweiSex=methods.includes('ziwei')?clean(values.traditionalCalculationSex):'';
 if(ziweiSex&&ziweiSex!==sex)fail('PPR_R4_BAZI_ZIWEI_TRADITIONAL_RULE_CONFLICT','BaZi and Zi Wei selected different traditional calculation rules.');
 return Object.freeze({traditionalCalculationSex:sex});
}

export function collect({form,methods=[]}={}){
 const fd=new FormData(form);
 return serializeBaziMethodInput({baziTraditionalCalculationSex:fd.get('baziTraditionalCalculationSex'),traditionalCalculationSex:fd.get('traditionalCalculationSex')},methods);
}
export default Object.freeze({BAZI_INPUT_EXTENSION_ID,render,install,serializeBaziMethodInput,collect});
