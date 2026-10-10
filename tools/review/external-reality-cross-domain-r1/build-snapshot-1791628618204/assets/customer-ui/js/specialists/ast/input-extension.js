const CSS_HREF='/assets/customer-ui/surfaces/astrology-input-extension.css';
const clean=value=>String(value??'').trim();
const fail=(code,message)=>{const error=new Error(message||code);error.code=code;throw error};
const zh=()=>typeof document!=='undefined'&&document.documentElement?.lang==='zh-Hans';
const tr=(en,cn)=>zh()?cn:en;
function ensureCss(){if(typeof document==='undefined'||document.querySelector('link[data-ppr-r4-ast-input-css="true"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href=CSS_HREF;link.dataset.pprR4AstInputCss='true';document.head?.appendChild(link)}
function validIana(value){try{new Intl.DateTimeFormat('en-US',{timeZone:value}).format(new Date(0));return true}catch{return false}}
export const AST_INPUT_EXTENSION_ID='PPR_R4_AST_INPUT_EXTENSION_V1';
export const AST_TARGET_FIELD_NAMES=Object.freeze(['astCxTargetDate','astCxTargetTime','astCxTargetTimezone','astCxTargetUtcOffset']);

export function render(){
 return `<section class="cx-ast-input-extension" data-ppr-r4-method-input="astrology" data-cx-ast-target-context-v2>
  <header><p class="cx-eyebrow">${tr('ASTROLOGY · OPTIONAL TIMING INPUT','占星 · 可选时间输入')}</p><h3 class="cx-heading">${tr('Add a target moment only when you want current activation.','只有想查看当前激活时，才加入目标时刻。')}</h3><p class="cx-body cx-muted">${tr('Natal reading works without these fields. A timing request requires all four visible values together; PHI OS will not infer the current time or device timezone for you.','本命读取不需要这些字段。若要查看时间激活，四项可见资料必须一起填写；PHI OS 不会替你推断当前时间或装置时区。')}</p></header>
  <details class="cx-ast-target-disclosure"><summary>${tr('Timing & activation target (optional)','时间与激活目标（可选）')}</summary><div class="cx-ast-target-grid"><label class="cx-p1-field"><span>${tr('Target date','目标日期')}</span><input type="date" name="astCxTargetDate" data-cx-ast-target-field="date"></label><label class="cx-p1-field"><span>${tr('Target time','目标时间')}</span><input type="time" name="astCxTargetTime" step="60" data-cx-ast-target-field="time"></label><label class="cx-p1-field"><span>${tr('IANA timezone','IANA 时区')}</span><input type="text" name="astCxTargetTimezone" spellcheck="false" autocomplete="off" placeholder="Asia/Kuala_Lumpur" data-cx-ast-target-field="timezone"></label><label class="cx-p1-field"><span>${tr('UTC offset at target','目标时刻 UTC 偏移')}</span><input type="text" name="astCxTargetUtcOffset" spellcheck="false" autocomplete="off" placeholder="+08:00" pattern="[+-](?:0[0-9]|1[0-4]):[0-5][0-9]" data-cx-ast-target-field="offset"></label></div><p class="cx-p1-note">${tr('All blank = natal only. One to three fields = rejected. Four fields = validated and transported to the existing governed ASTT runtime.','全部留空＝只看本命；填写一至三项＝拒绝；四项完整＝验证后送入现有受治理 ASTT runtime。')}</p></details>
 </section>`;
}
export function install(){ensureCss()}

export function serializeAstMethodInput(values={}){
 const target=AST_TARGET_FIELD_NAMES.map(name=>clean(values[name])),supplied=target.filter(Boolean).length;
 if(supplied===0)return Object.freeze({astTargetContext:null});
 if(supplied<4)fail('PPR_R4_AST_TARGET_CONTEXT_INCOMPLETE','Astrology target context is all-or-nothing.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(target[0])||Number.isNaN(Date.parse(`${target[0]}T00:00:00Z`)))fail('PPR_R4_AST_TARGET_DATE_INVALID');
 if(!/^\d{2}:\d{2}(?::\d{2})?$/.test(target[1]))fail('PPR_R4_AST_TARGET_TIME_INVALID');
 const [hh,mm,ss='00']=target[1].split(':').map(Number);if(hh>23||mm>59||ss>59)fail('PPR_R4_AST_TARGET_TIME_INVALID');
 if(!validIana(target[2]))fail('PPR_R4_AST_TARGET_TIMEZONE_INVALID');
 if(!/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(target[3]))fail('PPR_R4_AST_TARGET_OFFSET_INVALID');
 return Object.freeze({astTargetContext:Object.freeze({targetDate:target[0],targetTime:`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`,targetTimezone:Object.freeze({iana:target[2],utcOffsetAtTarget:target[3]})})});
}

export function collect({form}={}){const fd=new FormData(form),values={};for(const name of AST_TARGET_FIELD_NAMES)values[name]=fd.get(name);return serializeAstMethodInput(values)}
export default Object.freeze({AST_INPUT_EXTENSION_ID,AST_TARGET_FIELD_NAMES,render,install,serializeAstMethodInput,collect});
