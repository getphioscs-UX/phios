export default {
  personalRuntime: {
    metaTitle: '个人运行设置 — PHI OS',
    skip: '跳到个人运行设置',
    eyebrow: 'WPR-W21 · Personal Runtime',
    title: '先准备出生资料，不提前启动任何 Method。',
    lead: '此页面只检查出生资料结构是否完整。这里不会执行 Method 计算、解释、上传或持久化。',
    privacyTitle: '出生资料只停留在当前页面',
    privacyCopy: '本设置采用临时输入。WPR-W21 不会把这些字段提交到服务器、写入浏览器储存，也不会建立 Canonical Consent Record。',
    inputTitle: '出生初始化资料',
    inputCopy: '未知就保持未知。PHI OS 不会把未知出生时间自动设为中午 12:00，不会从当前浏览器推断出生时区，也不会根据地点名称自行制造坐标。',
    birthDate: '出生日期', birthTime: '出生时间', birthPlace: '出生地点', timezone: '时区', coordinates: '坐标（选填）', latitude: '纬度', longitude: '经度',
    precision: '精确度', exact: '准确', approximate: '大约', unknown: '未知', source: '资料来源', sourceHuman: '本人提供',
    confirm: '我确认这里填写的是我目前实际知道的资料。',
    check: '检查输入准备度', clear: '清除资料', resultTitle: '输入准备度',
    ready: '资料结构已可供未来受治理的 Method 请求使用；Production Execution 目前仍未开放。',
    incomplete: '部分资料缺失，或与所选精确度冲突。没有任何资料被提交。',
    noStorage: '不发送资料 · 不写入浏览器储存 · 不执行计算',
    methodsTitle: 'Method 可用状态', methodsCopy: '可用状态来自 MPA 治理，而不是仓库里是否已经存在代码。',
    status: { readyW26: 'Method 专属证据已完成 · 等待 W26/W27', candidate: 'Activation Candidate · 尚不可生产执行', blocked: 'Public Execution 尚未开放', registered: '已注册 · 尚未进入生产实现' },
    methodBoundary: '看得到 Method 卡片，不等于拥有 Production Eligibility、Public Eligibility 或 Professional Authority。',
    consentTitle: '真正执行仍需要 Consent Gate', consentCopy: '实际 Method Execution 必须拥有 RDG 治理的 Consent Record 与允许的 Data Purpose。本页面不会建立这两者。',
    journeyAction: '返回 Reality Journey', professionalAction: '查看专业服务',
    authorityUnavailable: '无法读取 Personal Runtime Authority，因此 Method 可用状态保持关闭。'
  }
};
