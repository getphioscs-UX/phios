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


export function customerLayerExplanation(projection,layer,item,{role=null}={}){
  if(!item)return '';
  const code=codeOf(item);
  if(layer==='CC12')return local(projection,
    `Your Solar Anchor falls inside the ${item.startLongitudeInclusive}° to <${item.endLongitudeExclusive}° long-range context interval. ${code} is its technical index; the zodiac name is a position label, not a personality claim.`,
    `你的太阳锚点位于 ${item.startLongitudeInclusive}°–<${item.endLongitudeExclusive}° 的长期背景区间。${code} 是这个区间的技术编号；星座名称只用于位置标记，不代表人格判断。`);
  if(layer==='G16')return local(projection,
    `This is the selected Reality Grammar position in the calculated baseline. ${code} is a coordinate index, not a fixed identity label.`,
    `这是计算基线中命中的现实语法位置。${code} 是坐标编号，不是固定人格或身份标签。`);
  if(layer==='Q16')return local(projection,
    `This baseline question is paired to the same Grammar ordinal. It is a question to observe when that grammar becomes relevant, not a predetermined life conclusion.`,
    `这个基础问题与同序号的现实语法配对。它用于观察该语法出现时什么问题会变得重要，并不是预先决定的人生结论。`);
  if(layer==='R9')return local(projection,
    `${role==='SUPPORTING'?'Supporting':'Primary'} response capability selected by the versioned Question → Capability matrix. The mapping describes a governed response resource, not a score of personal ability.`,
    `这是版本化“问题 → 能力”矩阵映射出的${role==='SUPPORTING'?'辅助':'主要'}回应能力。它描述受治理的回应资源，不是个人能力高低评分。`);
  if(layer==='D12')return local(projection,
    `This driver is ranked from circular distance to the Solar Anchor in the twelve-driver baseline profile. The rank does not state what is most important in your current Reality.`,
    `这个驱动来自 12 项驱动与太阳锚点的圆周距离排序。这里的名次只表示出生基线亲和度，不代表你此刻现实中真正最重要的驱动力。`);
  if(layer==='M8')return local(projection,
    `This is the selected PHI OS organization-change motion. The trigram identity is reused as a structural symbol without importing I Ching fortune meaning.`,
    `这是当前命中的 PHI OS 组织变化运动。这里只复用卦象身份作为结构符号，不导入易经吉凶或占卜意义。`);
  if(layer==='H64')return local(projection,
    `This configuration combines an upper-trigram Environment Priority with a lower-trigram Embodied Response Position. ${code} is the configuration index, not a traditional hexagram fortune judgment.`,
    `这个构型把上卦作为“环境优先运动”，下卦作为“载体回应位置”。${code} 是构型索引，不是传统卦辞的吉凶判断。`);
  if(layer==='A8')return local(projection,
    `This is the position within the selected H64 segment. It describes a runtime activation stage, not luck, success probability or a guaranteed event.`,
    `这是当前 H64 构型区间内部的位置阶段，用来描述运行激活状态；它不是吉凶、成功概率或必然事件。`);
  return local(projection,'Technical index retained for traceability.','技术编号仅用于追溯。');
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

export default Object.freeze({isZh,local,by,list,authorityLabel,codeOf,customerLayerLabel,customerLayerExplanation,selectedCatalog});
