const clean=value=>String(value??'').trim();
const fail=(code,message)=>{const error=new Error(message||code);error.code=code;throw error};
const TARGET_METHODS=Object.freeze(['bazi','numeric','ziwei']);
const METHOD_LABELS=Object.freeze({bazi:{en:'BaZi',zh:'八字'},numeric:{en:'Numerology',zh:'数字学'},ziwei:{en:'Zi Wei',zh:'紫微斗数'}});
const zh=()=>typeof document!=='undefined'&&document.documentElement?.lang==='zh-Hans';
const tr=(en,cn)=>zh()?cn:en;
const activeMethods=methods=>TARGET_METHODS.filter(key=>Array.isArray(methods)&&methods.includes(key));
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
const validTime=value=>/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
const validOffset=value=>/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(value);
function validIana(value){try{new Intl.DateTimeFormat('en-US',{timeZone:value}).format(new Date(0));return true}catch{return false}}
function valueOf(form,name){return clean(form?.elements?.[name]?.value)}
function setLocalized(node,en,cn){if(!node)return;node.dataset.cxEn=en;node.dataset.cxZh=cn;node.textContent=tr(en,cn)}

export const SHARED_TARGET_CONTEXT_VERSION='PPR-SHARED-TARGET-CONTEXT-v1.0.0';
export const SHARED_TARGET_FIELD_NAMES=Object.freeze(['sharedTargetDate','sharedTargetTime','sharedTargetTimezoneIana','sharedTargetUtcOffset']);

export function syncSharedTargetContext(form,methods=[]){
 const root=document.querySelector('[data-cx-shared-target-context]');if(!root)return;
 const selected=activeMethods(methods),needsLocal=selected.some(key=>key==='bazi'||key==='ziwei'),requiresLocal=selected.includes('ziwei');
 root.hidden=selected.length===0;
 root.dataset.cxTargetDateOnly=needsLocal?'false':'true';
 root.dataset.cxSharedTargetRequired=requiresLocal?'true':'false';
 root.querySelectorAll('[data-cx-shared-target-local]').forEach(node=>{node.hidden=!needsLocal});
 const date=form?.elements?.sharedTargetDate,time=form?.elements?.sharedTargetTime,place=form?.elements?.sharedTargetPlaceQuery;
 if(date){date.disabled=selected.length===0;date.required=requiresLocal}
 if(time){time.disabled=!needsLocal;time.required=requiresLocal}
 if(place){place.disabled=!needsLocal;place.required=requiresLocal}
 for(const name of ['sharedTargetPlaceRef','sharedTargetTimezoneIana','sharedTargetUtcOffset']){const input=form?.elements?.[name];if(input)input.disabled=!needsLocal}
 const methodsNode=root.querySelector('[data-cx-shared-target-methods]');
 if(methodsNode){const labels=selected.map(key=>METHOD_LABELS[key]?.[zh()?'zh':'en']).filter(Boolean);methodsNode.textContent=labels.join(' · ')}
 const heading=root.querySelector('[data-cx-shared-target-heading]'),copy=root.querySelector('[data-cx-shared-target-copy]'),dateHelp=root.querySelector('[data-cx-shared-target-date-help]'),useNowLabel=root.querySelector('[data-cx-target-use-now] span');
 if(useNowLabel){if(needsLocal)setLocalized(useNowLabel,'Use today and now','使用今天和现在');else setLocalized(useNowLabel,'Use today','使用今天')}
 if(requiresLocal){
  setLocalized(heading,'Choose one target moment for the selected timing methods.','为所选时间方法填写一次目标时刻。');
  setLocalized(copy,'Zi Wei requires a complete target date, time and confirmed place. The same target is reused by BaZi and Numerology when they are selected, so you do not enter it again.','紫微需要完整的目标日期、时间与已确认地点。同一次组合读取中，如也选择八字或数字学，这份目标资料会直接共用，不需要重复填写。');
 }else if(needsLocal){
  setLocalized(heading,'Add one target moment only when you want a timing layer.','只有想加入时间层时，才填写一次共同目标时刻。');
  setLocalized(copy,'Leave the shared target blank for a natal-only BaZi reading. If you add a target, date, time and confirmed place travel together; Numerology reuses the same date when selected.','只看八字原局时可把共同目标留空；若加入时间层，日期、时间与已确认地点需要一起填写。如同时选择数字学，它会直接共用同一个目标日期。');
 }else{
  setLocalized(heading,'Add a target date only when you want Numerology timing.','只有想加入数字学时间层时，才填写目标日期。');
  setLocalized(copy,'Your birth date is enough for the core Numerology chart. This shared target date adds the governed timing layer without changing any other calculation rule.','出生日期已经足够建立核心数字图。这一个共同目标日期只用于加入受治理的数字学时间层，不会改变其他计算规则。');
 }
 if(dateHelp){
  if(needsLocal)setLocalized(dateHelp,'Shared by every selected timing method.','由所有已选择的时间方法共用。');
  else setLocalized(dateHelp,'Used only for the optional Numerology timing layer.','只用于可选的数字学时间层。');
 }
}

export function collectSharedTargetContext(form,methods=[]){
 const selected=activeMethods(methods);if(!selected.length)return Object.freeze({targetDate:null,baziTemporalContext:null,ziweiTargetContext:null,targetPlaceRef:null});
 const targetDate=valueOf(form,'sharedTargetDate'),targetTime=valueOf(form,'sharedTargetTime'),iana=valueOf(form,'sharedTargetTimezoneIana'),offset=valueOf(form,'sharedTargetUtcOffset'),placeRef=valueOf(form,'sharedTargetPlaceRef'),source=valueOf(form,'sharedTargetContextSource')||'EXPLICIT_REQUEST';
 if(targetDate&&!validDate(targetDate))fail('PPR_SHARED_TARGET_DATE_INVALID','Shared target date is invalid.');
 const needsLocal=selected.some(key=>key==='bazi'||key==='ziwei'),requiresLocal=selected.includes('ziwei');
 if(!needsLocal)return Object.freeze({targetDate:targetDate||null,baziTemporalContext:null,ziweiTargetContext:null,targetPlaceRef:null});
 const supplied=[targetDate,targetTime,iana,offset,placeRef].filter(Boolean).length;
 if(requiresLocal&&supplied!==5)fail('PPR_SHARED_TARGET_CONTEXT_REQUIRED','Zi Wei requires the complete shared target context.');
 if(!requiresLocal&&supplied>0&&supplied<5)fail('PPR_SHARED_TARGET_CONTEXT_INCOMPLETE','Shared BaZi target context is all-or-nothing.');
 if(supplied===0)return Object.freeze({targetDate:null,baziTemporalContext:null,ziweiTargetContext:null,targetPlaceRef:null});
 if(!validDate(targetDate))fail('PPR_SHARED_TARGET_DATE_INVALID');
 if(!validTime(targetTime))fail('PPR_SHARED_TARGET_TIME_INVALID');
 if(!validIana(iana))fail('PPR_SHARED_TARGET_TIMEZONE_INVALID');
 if(!validOffset(offset))fail('PPR_SHARED_TARGET_OFFSET_INVALID');
 const normalizedTime=targetTime.length===5?`${targetTime}:00`:targetTime;
 const targetTimezone=Object.freeze({iana,utcOffsetAtTarget:offset});
 const base=Object.freeze({targetDate,targetTime:normalizedTime,targetTimezone});
 return Object.freeze({
  targetDate,
  targetPlaceRef:placeRef,
  baziTemporalContext:selected.includes('bazi')?base:null,
  ziweiTargetContext:selected.includes('ziwei')?Object.freeze({...base,source}):null
 });
}

export function installSharedTargetContext(form){
 const root=document.querySelector('[data-cx-shared-target-context]');if(!root||root.dataset.cxSharedTargetInstalled==='true')return;
 root.dataset.cxSharedTargetInstalled='true';
 const markEdited=()=>{const source=form?.elements?.sharedTargetContextSource;if(source)source.value='CUSTOMER_EDITED'};
 root.querySelectorAll('[data-cx-target-date],[data-cx-target-time],[data-cx-target-place-input]').forEach(input=>input.addEventListener('input',markEdited));
 root.addEventListener('phios:target-context-change',markEdited);
}

export default Object.freeze({SHARED_TARGET_CONTEXT_VERSION,SHARED_TARGET_FIELD_NAMES,syncSharedTargetContext,collectSharedTargetContext,installSharedTargetContext});
