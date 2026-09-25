/* PHI OS Book VI Reconfiguration Atlas translations. Keep keys aligned with en. */
const book6Atlas = Object.freeze({
  book6Atlas: {
    ui: {
      eyebrow: '文明重组图谱',
      title: '观察已经存在的文明如何重组。',
      lead: '案例、重组窗口、世界横切面、当代运行与日常现实，共用同一套有证据边界的图谱。',
      overview: '总览', search: '搜索', cases: '案例', timeline: '时间线', windows: '重组窗口',
      snapshots: '世界重组横切面', dossiers: '当代运行', lived: '日常现实',
      compare: '比较案例', compareRuntime: '比较运行', unknown: '未知', missing: '缺少视觉资产',
      unverified: '尚未验证', ask: '问 PHI OS 当前重组图谱',
      noRank: '输出结构档案，不做国家排名；条件性投影不等于预测。',
      open: '打开', previous: '上一页', next: '下一页', filters: '筛选', clear: '清除筛选',
      results: '项结果', version: '版本', previousVersion: '历史版本', dataState: '资料状态',
      freshness: '资料新鲜度', layer: '图层', textAlternative: '文字等价信息',
      selectDossier: '选择运行档案', selectSnapshot: '选择世界横切面',
      selectDimension: '选择日常现实维度', pagination: '分页',
      imageBaseNote: '使用同一张静态底图；切换图层不会更换图片。',
      resolverMissing: '当前视觉资产未能通过公共交付解析。',
      relatedCases: '关联案例', state: '状态', all: '全部', allTime: '全部时间',
      allRegions: '全部区域', allTypes: '全部类型', timeWindow: '时间窗口', region: '区域',
      caseType: '案例类型', trigger: '触发', pressureField: '压力场',
      structuralChange: '结构变化', reconfigurationWindow: '重组窗口',
      linkedCases: '个关联案例', dimension: '维度', evidenceDate: '证据日期',
      historicalVersionNote: '历史版本已保留。当前版本与该历史版本都没有获准作为实时资料展示，因此差异维持为未知，直到后续资料通过正式证据门槛。',
      selectCasesFirst: '请先在「案例」选择 2–4 个案例。',
      selectDossiersFirst: '请先在「当代运行」选择 2–4 个档案。',
      noUniversalScore: '不转换为通用分数',
      livedProfile: '日常现实档案',
      visuals: '视觉图谱',
      visualLibrary: '文明图谱视觉资料库',
      visualLibraryLead: '浏览 392 张已验收的文明图谱视觉；页面不会一次加载全部图片。',
      visualFamily: '视觉类别',
      visualSubject: '视觉主题',
      visualCount: '张已验收视觉',
      contextFigures: '相关第六册图件',
      currentDataNotAdmitted: '这个运行档案尚未接入已获准的当前资料。',
      currentDataBoundary: '当前资料结构已经就绪，但尚未发布通过证据门槛的实时数值，因此不会用推断填满。',
      historicalEvidence: '历史证据',
      searchPlaceholder: '搜索案例、区域、时间、触发、继任、窗口、横切面、档案、正文或日常现实'
    },
    resultType: {
      CASE: '案例', WINDOW: '重组窗口', SNAPSHOT: '世界横切面', DOSSIER: '运行档案',
      BOOK_SECTION: '正文节点', LIVED_REALITY: '日常现实'
    },
    knowledgeState: {
      CANONICAL_HISTORY: '已发生历史', HISTORICAL_RECONSTRUCTION: '历史重建',
      CURRENT_DATA: '当前资料', DERIVED_RUNTIME_READOUT: '推导运行读数',
      CONDITIONAL_PROJECTION: '条件性投影', UNKNOWN: '未知'
    },
    caseType: {
      REFORM: '改革', REVOLUTION: '革命', WAR: '战争', COLLAPSE: '崩解',
      SUCCESSION: '继任', DECOLONIZATION: '去殖民化', STATE_FORMATION: '国家形成',
      SYSTEM_REORDERING: '体系重组', ECONOMIC_RECONFIGURATION: '经济重组',
      TECHNOLOGICAL_RECONFIGURATION: '技术重组', NETWORK_RECONFIGURATION: '网络重组',
      SOCIAL_RECONFIGURATION: '社会重组', HYBRID: '混合重组'
    },
    entityType: {
      STATE: '国家', REGION: '区域', MULTI_STATE_SYSTEM: '多国体系', GLOBAL_RUNTIME: '全球运行'
    },
    region: {
      AFRICA: '非洲', ASIA: '亚洲', CHINA: '中国', EAST_ASIA: '东亚', EURASIA: '欧亚',
      EUROPE: '欧洲', GERMANY: '德国', GLOBAL: '全球', GLOBAL_SOUTH: '全球南方', INDIA: '印度',
      INDONESIA: '印度尼西亚', JAPAN: '日本', KOREA: '朝鲜半岛', LATIN_AMERICA: '拉丁美洲',
      MIDDLE_EAST: '中东', NORTH_AMERICA: '北美', RUSSIA: '俄罗斯',
      SOUTHEAST_ASIA: '东南亚', SOUTH_ASIA: '南亚'
    },
    field: {
      priorRuntime: '此前运行', trigger: '触发', pressure: '压力', successorRuntime: '继任运行',
      transitionDuration: '转换时长', unknown: '未知', reconfiguration: '重组', successorState: '继任状态',
      threshold: '阈值', removed: '移除', preserved: '保留', added: '新增', carrierChange: '载体变化',
      capacityGain: '容量增加', loadTransfer: '负载转移', dependencyCreated: '新增依赖', legacy: '历史遗留',
      stage: '运行阶段', scale: '尺度', density: '密度', capacity: '容量', load: '负载', alignment: '对齐',
      resilience: '韧性', adaptability: '适应能力', expansionCapacity: '扩展能力', futureCapacity: '未来容量',
      externalDependency: '外部依赖', direction: '方向', transitionSignals: '转换讯号',
      personalFutureCapacity: '个人未来容量', evidenceDate: '证据日期', livedReality: '日常现实'
    },
    layer: {
      political: '政治', population: '人口', industry: '工业', energy: '能源', finance: '金融',
      trade: '贸易', military: '军事', technology: '技术', information: '信息',
      colonialPostcolonial: '殖民／后殖民'
    },
    change: {
      carrier: '载体变化', boundary: '边界变化', institutional: '制度变化', economic: '经济变化'
    },
    phrase: {
      PRIOR_REFORM: '改革前既有制度配置',
      PRIOR_SYSTEM: '此前的体系配置',
      PRIOR_REVOLUTION: '革命前的政治与制度配置',
      PRIOR_WAR: '战争前的政治与制度配置',
      PRIOR_COLLAPSE: '崩解前的体系配置',
      PRIOR_ECONOMIC: '此前的经济与协调配置',
      PRIOR_TECH: '此前的技术与网络配置',
      PRIOR_COLONIAL: '殖民时期的政治与行政配置',
      TRIGGER_REFORM: '受治理的改革与政策重组',
      TRIGGER_SYSTEM: '体系重组压力',
      TRIGGER_REVOLUTION: '革命性断裂',
      TRIGGER_WAR: '武装冲突／战时动员',
      TRIGGER_COLLAPSE: '体系崩解／协调连续性丧失',
      TRIGGER_ECONOMIC: '经济体系压力或制度变化',
      TRIGGER_TECH: '技术采用／基础设施转换',
      TRIGGER_DECOLONIZATION: '去殖民化／主权转移',
      SUCCESSOR_REFORM: '修订后的制度与经济配置',
      SUCCESSOR_SYSTEM: '继任体系配置',
      SUCCESSOR_POLITICAL: '继任的政治与制度配置',
      SUCCESSOR_CONFLICT: '冲突后的制度与体系配置',
      SUCCESSOR_STATES: '继任国家或制度',
      SUCCESSOR_ECONOMIC: '重新配置的经济与网络安排',
      SUCCESSOR_TECH: '重新配置的技术与协调层',
      SUCCESSOR_POSTCOLONIAL: '后殖民国家或区域配置',
      CASE_PRESSURE_BOUNDARY: '压力范围以书稿已建立的案例边界为准；B6-WEB-C 不额外断言细颗粒因果权重。',
      CASE_UNKNOWN_BOUNDARY: '细颗粒因果归因、量化影响与争议性解释，不以推断补填。',
      WINDOW_PRESSURE_BOUNDARY: '窗口压力由其重叠案例的受治理集合表示；不会生成合成排名。',
      WINDOW_SUCCESSOR_BOUNDARY: '继任配置仍以各案例为边界；这个窗口不主张单一确定结果。',
      WINDOW_UNKNOWN_BOUNDARY: '窗口层面的因果权重仍保持未知；关联案例各自保留证据边界。',
      DOSSIER_CURRENT_NOT_ADMITTED: '当前资料证据尚未通过正式接纳；未知是当前受治理结果。'
    },
    value: {
      UNKNOWN: '未知', UNVERIFIED: '尚未验证', NOT_APPLICABLE: '不适用',
      NOT_CURRENT_DATA: '不是当前资料', CURRENT_DATA_NOT_ADMITTED: '当前资料尚未获准',
      CONTRACT_READY_CURRENT_DATA_NOT_ADMITTED: '结构已就绪；当前资料尚未获准',
      ACTIVE: '启用', SUPERSEDED: '已被继任'
    }
  }
});
export default book6Atlas;
