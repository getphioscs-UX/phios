const freeObservation = Object.freeze({
  freeObservation: {
    metaTitle: '免费观察 — PHI OS',
    skip: '跳至免费观察',
    hero: {
      eyebrow: '免费探索 · 隐私默认开启',
      title: '不开始正式 Journey，也可以先观察一个变化。',
      lead: '只需选择宽泛且非敏感的预设选项。页面不会上传服务器、不会要求身份，也不会建立 Professional Queue。',
      start: '开始本地观察',
      privacy: '查看隐私边界'
    },
    privacy: {
      eyebrow: 'PWS-I8 隐私基础',
      title: '本地优先、匿名、可以清除。',
      lead: '免费观察是非正式浏览器工具，不是 Runtime、Reading、诊断、专业 Intake 或 Evidence Record。',
      localTitle: '只保存在当前浏览器',
      localCopy: '只有当您选择“保存到本地”时才会建立记录，并且记录只留在这个浏览器。',
      anonymousTitle: '不需要账户或身份',
      anonymousCopy: '不收集姓名、邮箱、账户、Journey ID 或专业服务编号。',
      sensitiveTitle: '不提供敏感资料输入',
      sensitiveCopy: '表单没有自由文字或文件字段。请勿提供健康、财务、身份、联络或登录凭证资料。',
      clearTitle: '随时清除',
      clearCopy: '您可以删除单一记录，或清除当前浏览器内的全部本地观察。',
      separationTitle: '与正式系统分离',
      separationCopy: '保存不会建立 Journey、Formal Evidence、Runtime Memory、Assignment 或 Professional Queue 项目。',
      retention: '本地记录会在 {days} 天后自动失效。'
    },
    form: {
      eyebrow: '有边界的观察',
      title: '选择三个宽泛信号。',
      lead: '这些预设只支持初步定位，不收集个人历史。',
      focusLegend: '您想先注意什么？',
      signalLegend: '目前出现哪一种信号？',
      horizonLegend: '哪一个时间范围最有用？',
      action: '建立本地导向',
      required: '请在每个部分选择一个选项。',
      save: '保存到本地',
      saved: '只保存在这个浏览器。',
      reset: '重新观察',
      storageUnavailable: '当前浏览器无法使用本地储存；没有保存任何内容。'
    },
    options: {
      focus: {
        change: '变化',
        direction: '方向',
        constraint: '限制',
        continuity: '连续性'
      },
      signal: {
        new_difference: '出现新的差异',
        unclear_context: '背景仍不清楚',
        competing_priorities: '优先事项互相竞争',
        repeating_pattern: '某种模式重复出现'
      },
      horizon: {
        today: '今天',
        this_week: '这一周',
        this_month: '这个月'
      }
    },
    result: {
      eyebrow: '本地导向',
      title: '一个有边界的开始位置。',
      focus: '关注',
      signal: '信号',
      horizon: '时间范围',
      orientation: '观察',
      evidence: '证据边界',
      next: '小范围下一步',
      boundary: '这只是一般性导向；原因、意义与持续性仍然未知。'
    },
    orientation: {
      focus: {
        change: '先注意现在与之前有什么不同，再决定这个差异意味着什么。',
        direction: '先辨认当前位置，再比较可能的方向。',
        constraint: '把固定边界与仍然可以移动的部分分开。',
        continuity: '注意哪些内容需要保留，哪些内容可能需要更新。'
      },
      signal: {
        new_difference: '一个差异只是信号，不足以证明原因或持续性。',
        unclear_context: '缺少的背景仍然未知，不能由假设补上。',
        competing_priorities: '优先事项竞争显示决策边界，但不能证明哪一项必然正确。',
        repeating_pattern: '重复现象支持继续观察，但不能建立普遍规律。'
      },
      next: {
        change: '在所选时间范围内比较一项变化前后的观察。',
        direction: '记录一项当前条件，以及一项能够显示移动的条件。',
        constraint: '辨认一个边界，以及一个仍可逆的小行动。',
        continuity: '辨认一项需要保留的内容，以及一项需要重新复核的信号。'
      }
    },
    saved: {
      eyebrow: '保存在这个浏览器',
      title: '您的本地观察。',
      lead: '这些记录不会同步、上传，也不会提供给 PHI OS、专业人士或其他设备。',
      count: '{count} 项本地记录',
      empty: '尚未保存本地观察。',
      expires: '将于 {date} 失效',
      delete: '删除这项记录',
      deleted: '本地记录已删除。',
      clearAll: '清除全部本地记录',
      confirmClearAll: '确认清除全部',
      cleared: '全部免费观察本地记录已经清除。'
    },
    upload: {
      eyebrow: '服务器上传边界',
      title: '本阶段尚未启用服务器上传。',
      lead: '未来上传不能从本地保存中推定。上传前必须另行主动确认，并清楚显示用途、字段范围、保留期限与 PWS-I8 撤回路径。',
      purpose: '同意前必须说明用途。',
      scope: '范围只允许包含已选择的预设字段。',
      retention: '必须显示保留与删除条款。',
      action: '本页面不会发出任何上传请求。',
      state: '功能尚未启用 · 维持纯本地状态'
    },
    exits: {
      eyebrow: '由您选择是否继续',
      title: '免费观察不会强制导向服务。',
      articles: '阅读已发布文章',
      journeyOverview: '了解现实旅程',
      journey: '了解 Reality Journey',
      leave: '返回发现首页'
    }
  }
});

export default freeObservation;
