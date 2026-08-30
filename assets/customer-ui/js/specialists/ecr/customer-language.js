// ECR customer-language presentation helper.
// This module only re-orders and labels authority-owned values already present
// in the customer Mandala projection. It never calculates ECR or creates meaning.
const arr=value=>Array.isArray(value)?value:[];
export const isZh=projection=>projection?.locale==='zh-Hans';
export const local=(projection,en,zh)=>isZh(projection)?zh:en;
export const by=(items,key,id)=>arr(items).find(item=>item?.[key]===id)||null;
export const list=arr;

export function authorityLabel(projection,item){
  if(!item)return '';
  if(isZh(projection))return item.labelZhHans||item.questionZhHans||item.chineseNameZhHans||item.trigramZhHans||item.label||item.question||item.canonicalName||'';
  return item.label||item.question||item.canonicalName||item.labelZhHans||item.questionZhHans||item.chineseNameZhHans||'';
}

export function codeOf(item){
  return item?.contextId||item?.grammarId||item?.questionId||item?.capabilityId||item?.driverId||item?.motionId||item?.configurationId||item?.activationId||'';
}

export function customerLayerLabel(projection,layer,item,{role=null}={}){
  const code=codeOf(item),label=authorityLabel(projection,item);
  if(layer==='CC12')return Object.freeze({primary:isZh(projection)?`${label}背景区间`:`${label} context interval`,secondary:`${code} · ${local(projection,'Long-range context','长期方向背景')}`,code});
  if(layer==='G16')return Object.freeze({primary:label,secondary:`${code} · ${local(projection,'Reality Grammar','现实语法')}`,code});
  if(layer==='Q16')return Object.freeze({primary:label,secondary:`${code} · ${local(projection,'Baseline question','基础问题')}`,code});
  if(layer==='R9')return Object.freeze({primary:label,secondary:`${code} · ${role==='SUPPORTING'?local(projection,'Supporting response capability','辅助回应能力'):local(projection,'Primary response capability','主要回应能力')}`,code});
  if(layer==='D12')return Object.freeze({primary:label,secondary:`${code} · ${local(projection,'Birth-baseline driver','出生基线驱动')}`,code});
  if(layer==='M8')return Object.freeze({primary:[item?.trigramZhHans,label].filter(Boolean).join(' · '),secondary:`${code} · ${local(projection,'Change motion','变化运动')}`,code});
  if(layer==='H64')return Object.freeze({primary:isZh(projection)?`${item?.chineseNameZhHans||label} · ${local(projection,'Environment-response configuration','环境—回应构型')}`:`${item?.canonicalName||label} · ${local(projection,'Environment-response configuration','环境—回应构型')}`,secondary:`${code} · ${local(projection,'Configuration index','构型索引')}`,code});
  if(layer==='A8')return Object.freeze({primary:label,secondary:`${code} · ${local(projection,'Activation stage','激活阶段')}`,code});
  return Object.freeze({primary:label||code,secondary:code,code});
}

export function selectedCatalog(projection){
  const s=projection?.selected||{};
  return Object.freeze({
    context:by(projection?.catalogs?.contexts,'contextId',s.contextId),
    grammar:by(projection?.catalogs?.grammars,'grammarId',s.grammarId),
    question:by(projection?.catalogs?.questions,'questionId',s.questionId),
    primaryCapability:by(projection?.catalogs?.capabilities,'capabilityId',s.primaryCapabilityId),
    supportingCapabilities:arr(s.supportingCapabilityIds).map(id=>by(projection?.catalogs?.capabilities,'capabilityId',id)).filter(Boolean),
    topDriver:arr(s.driverPriority)[0]||null,
    motion:by(projection?.catalogs?.motions,'motionId',s.motionId),
    configuration:by(projection?.catalogs?.configurations,'configurationId',s.configurationId),
    activation:by(projection?.catalogs?.activations,'activationId',s.activationId)
  });
}

export default Object.freeze({isZh,local,by,list,authorityLabel,codeOf,customerLayerLabel,selectedCatalog});
