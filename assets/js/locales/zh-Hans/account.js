const account = Object.freeze({
  accountPublic: {
    metaTitle: '账户 — PHI OS', skip: '跳到账户内容', eyebrow: 'M4C 账户',
    title: '一个账户，清楚掌控。', lead: '管理身份、隐私与账户生命周期，同时不把账户资料混入 Runtime Evidence。',
    preview: '本版本尚未连接账户服务。这些控件仅展示预期的安全流程，不会建立或更改账户。',
    registration: '注册', login: '登录', verification: '电子邮箱验证', reset: '重设密码',
    profile: '个人资料', privacy: '隐私设置', deletion: '删除账户',
    pending: '需要连接服务提供方', secure: '此预览不会保存密码或验证 token。',
    deletionCopy: '删除资料前必须完成身份验证、提交请求并作最终确认。',
    myReality: '打开 My Reality', membership: '查看会员方案'
  },
  myRealityAccount: {
    metaTitle: 'My Reality — PHI OS', skip: '跳到 My Reality', eyebrow: '账户总览',
    title: 'My Reality', lead: '在同一账户视图查看 Journey、权限、进度与专业服务活动。',
    unavailable: '目前没有已授权的账户投影。本页不会搜索浏览器中的 Runtime 资料。',
    current: '当前 Journeys', past: '过去 Journeys', reports: '报告', books: '书籍权限',
    progress: 'Reading 进度', appointments: '预约', shared: '共享权限',
    empty: '目前没有内容。', runtimeLink: '打开此设备上的 Runtime 连续性'
  },
  membershipPublic: {
    metaTitle: '会员方案 — PHI OS', skip: '跳到会员方案', eyebrow: '会员方案',
    title: '四种清楚的 PHI OS 使用方式。', lead: '会员方案负责组织权限，不会改变任何 Reality Journey 的证据或结论。',
    explorer: 'Explorer', reader: 'Reader', navigator: 'Navigator', professional: 'Professional',
    explorerCopy: '探索公开知识系统，并开始有限次数的 Journey。',
    readerCopy: '持续进行常规 Reading，并使用标准报告。',
    navigatorCopy: '以更完整的连续性进行 Reading 与 Navigation。',
    professionalCopy: '在获准范围内使用受治理的 Professional Workspace。',
    monthly: '月付', annual: '年付', lifecycle: '订阅生命周期',
    upgrade: '升级', downgrade: '降级', cancel: '取消',
    grace: '宽限期', failed: '付款失败',
    entitlements: '权限', book: '书籍权限', quota: 'Journey 配额', reports: '报告权限',
    review: '专业审阅', academy: 'Academy 权限',
    boundary: '页面所示权限须经账户服务验证后才生效。本页尚未启用结账或付款资料收集。'
  }
});
export default account;
