const freeExplore = Object.freeze({
  freeExplore: {
    skip: '跳至自由探索',
    hero: {
      eyebrow: 'PJA-W2 · 自由探索',
      title: '从一个问题开始，路线始终由你选择。',
      lead: '只选择宽泛、非敏感的预设项。PHI OS 可将问题连接至公共知识或有边界的下一步，不会开启正式 Journey。',
      start: '开始免费探索',
      atlas: '继续浏览现实图谱'
    },
    boundary: {
      title: '付款前自由边界',
      body: '这里不会收集完整人生故事，不会建立正式 Evidence、Reconstruction、个案 Reading、Provider 请求或 Professional Assignment。',
      local: '选择只保留在本浏览器，并且仅在你选择“稍后再看”时保存。'
    },
    progress: {
      label: '自由探索阶段',
      current: '当前阶段：{stage}',
      question: '问题',
      context: '情境',
      concept: '概念',
      example: '例子',
      reflection: '反思',
      navigation: '导航'
    },
    question: {
      eyebrow: '01 · 问题',
      title: '你想探索哪一个问题？',
      lead: '选择一个已发布或已规划的知识问题。这里不收集自由文本或个人经历。',
      legend: '选择问题',
      options: {
        phi_os_needed: '为什么需要 PHI OS？',
        explanation_reality: '为什么解释不等于理解现实？',
        navigation_position: '为什么导航必须先识别现实位置？',
        computation_direction: '为什么计算能力不能自动产生方向？',
        personal_decision_boundary: '我该怎么选择对自己最合适的方向？'
      }
    },
    context: {
      eyebrow: '02 · 情境',
      title: '设定一个轻量探索情境。',
      lead: '这些选择只影响呈现方式，不会对你分类、判断个案或建立 Evidence。',
      themeLabel: '主题',
      themePlaceholder: '选择知识主题',
      contextLegend: '情境',
      preferenceLegend: '内容偏好',
      depthLegend: '理解深度',
      contexts: {
        orientation: '我正在定位',
        learning: '我正在理解概念',
        change: '我正在观察变化',
        decision_boundary: '我正在识别决定边界'
      },
      preferences: {
        article: '文章',
        visual: '图表与图谱',
        book: '书籍',
        mixed: '混合形式'
      },
      depths: {
        orientation: '快速定位',
        working: '工作性理解',
        extended: '深入阅读'
      },
      themes: {
        'TH-PREFACE-01': '技术形成与方向边界',
        'TH-PREFACE-02': '知识分化与 PHI OS 定位',
        'TH-PREFACE-03': '能力扩张与系统失稳',
        'TH-PREFACE-04': '速度失配与运行成本',
        'TH-PREFACE-05': '解释边界与现实语言',
        'TH-PREFACE-06': '现实语法与导航位置'
      }
    },
    concept: {
      eyebrow: '03 · 概念',
      title: '查看规则引擎能够连接什么。',
      lead: '这是基于冻结 Registry 的确定性主题路由，不是诊断、建议或个案判断。',
      themes: '识别主题',
      concepts: '匹配概念',
      complexity: '路由复杂度',
      boundary: '边界',
      noMatch: '没有强制匹配任何规范概念。你可以继续免费探索。',
      levels: {
        1: '直接',
        2: '关联',
        3: '个体边界',
        4: '专业责任边界',
        5: '紧急专业责任边界'
      },
      boundaries: {
        public_knowledge: '公共知识',
        free_observation: '自由观察',
        individual_analysis_required: '个体分析边界',
        professional_responsibility_required: '专业责任边界',
        unclassified: '未分类'
      }
    },
    example: {
      eyebrow: '04 · 例子',
      title: '使用通用观察提示。',
      lead: '提示保持通用与非敏感，不解释原因，也不会生成个案 Reading。',
      label: '规则选择的提示',
      context: '所选情境：{context}',
      unknown: '在 Free Explore 之外有意建立 Evidence 之前，未知仍然保持未知。'
    },
    reflection: {
      eyebrow: '05 · 反思',
      title: '你的理解发生了什么变化？',
      lead: '请选择宽泛反思，不要输入姓名、健康、财务、身份或其他敏感信息。',
      legend: '选择一项反思',
      options: {
        concept_clearer: '概念更清楚了',
        observe_more: '我想继续观察',
        uncertainty_remains: '重要的不确定仍然存在',
        revisit_later: '我想稍后再看'
      }
    },
    navigation: {
      eyebrow: '06 · 导航',
      title: '选择路线，同时保留免费路径。',
      lead: '知识与观察路线优先。Journey 与专业路线只提供可选信息，绝不成为默认推荐。',
      matched: '匹配的公共文章',
      noArticle: '目前没有与这个问题匹配且已审核发布的文章。',
      general: '其他可用路线',
      articles: {
        title: '文章',
        body: '阅读已审核并发布的规范知识。'
      },
      figures: {
        title: '图表',
        body: '通过视觉地图检查关系。'
      },
      books: {
        title: '书籍',
        body: '沿第一册的较长阅读路线继续。'
      },
      atlas: {
        title: '图谱',
        body: '探索架构，不进入正式 Journey。'
      },
      observation: {
        title: '自由观察',
        body: '另存一个有边界、无自由文本的本地观察。'
      },
      journey: {
        title: 'Reality Journey Pass',
        body: '选择前先阅读正式 Journey 信息。'
      },
      professional: {
        title: '专业服务信息',
        body: '查看服务范围与边界；不会创建 Assignment。'
      },
      open: '打开路线',
      boundaryNote: '路线只是信息，不代表你必须采取某项行动。'
    },
    controls: {
      back: '返回',
      next: '继续',
      required: '请完成当前可见选择后继续。',
      restart: '继续免费探索',
      leave: '离开',
      later: '稍后再看',
      saved: '已保存在本浏览器，供稍后继续。',
      storageUnavailable: '本地浏览器存储不可用，未保存任何内容。',
      alwaysLabel: '始终可用的选择'
    },
    saved: {
      title: '本浏览器中稍后再看的路线',
      lead: '这些匿名预设选择不会同步或上传。',
      empty: '尚未保存 Free Explore 路线。',
      expires: '{date} 到期',
      restore: '继续',
      delete: '删除',
      clearAll: '全部清除',
      restored: '已恢复本地路线。',
      cleared: '已清除保存的 Free Explore 路线。'
    },
    state: {
      loading: '正在加载冻结知识 Registry…',
      ready: '规则导航已就绪。',
      unavailable: '规则导航不可用。系统没有推断分类，免费退出路径仍然可用。'
    }
  }
});

export default freeExplore;
