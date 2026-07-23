import {
  getLocale,
  onLocaleChange
} from '../i18n.js';

const architectureContainer = document.querySelector('[data-book-architecture]');
const figuresContainer = document.querySelector('[data-book-selected-figures]');

let figures;

const BOOK_ARCHITECTURE = [
  {
    number: 'P',
    title: { en: 'Prelude · Reality Breakdown', 'zh-Hans': '序章 · 文明断裂' },
    question: {
      en: 'Why are inherited systems losing their ability to stabilize Reality?',
      'zh-Hans': '为什么旧系统正在失去稳定现实的能力？'
    },
    summary: {
      en: 'Civilizational fracture, system mismatch, projection limits, the Reality Lifecycle and the shared Reality Grammar.',
      'zh-Hans': '从文明断裂、系统错位与投影限制，进入现实生命周期与共同现实语法。'
    },
    groups: [
      {
        title: { en: 'Reality Breakdown', 'zh-Hans': '文明断裂序章' },
        items: {
          en: [
            'Civilizational fracture is already occurring',
            'Systems are losing stability rather than simply evolving',
            'AI, crypto and networks reveal instability',
            'Cost becomes the only stable variable',
            'Old language can no longer describe new Reality',
            'Reality Lifecycle Architecture',
            'Reality Grammar · G1–G16'
          ],
          'zh-Hans': [
            '文明断裂不是未来，而是正在发生',
            '文明不是在进化，而是在失去稳定能力',
            'AI、Crypto 与网络成为失稳显影器',
            '成本成为唯一稳定变量',
            '旧语言为什么无法描述新现实',
            '现实生命周期架构',
            '现实语法 · G1–G16'
          ]
        }
      }
    ]
  },
  {
    number: '01',
    title: { en: 'Reality Physics', 'zh-Hans': '现实物理学' },
    question: {
      en: 'How does Reality form sustainable structure?',
      'zh-Hans': '现实如何形成可持续结构？'
    },
    summary: {
      en: 'Difference becomes constraint, structure, topology, field, coordinate and navigable constructed Reality.',
      'zh-Hans': '差异经过约束、结构、拓扑、场域、坐标与人工建造，成为可导航现实。'
    },
    groups: [
      {
        title: { en: 'A · Structural Formation', 'zh-Hans': 'A · 结构形成' },
        items: { en: ['Difference', 'Constraint', 'Structure', 'Structural Topology', 'Structural Configuration', 'Structural Continuity'], 'zh-Hans': ['差异', '约束', '结构', '结构拓扑', '结构配置', '结构连续性'] }
      },
      {
        title: { en: 'B · Structural Architecture', 'zh-Hans': 'B · 结构架构' },
        items: { en: ['Structural Differentiation Units', 'Connectivity', 'Regions', 'Network Architecture'], 'zh-Hans': ['结构差异单元', '结构连接', '结构区域', '网络架构'] }
      },
      {
        title: { en: 'C · Navigation Physics', 'zh-Hans': 'C · 导航物理' },
        items: { en: ['Directional Architecture', 'Position', 'Coordinate', 'Navigation Mechanics', 'Navigation Resolution'], 'zh-Hans': ['方向架构', '结构位置', '结构坐标', '导航机制', '导航解析度'] }
      },
      {
        title: { en: 'D–Final · Field and Constructed Reality', 'zh-Hans': 'D–Final · 场域与建构现实' },
        items: { en: ['Field Emergence', 'Propagation', 'Gradient', 'Boundary', 'Artificial Structure', 'Institutional Structure', 'Synthetic Field', 'Algorithmic Topology', 'Observable Reality'], 'zh-Hans': ['场域涌现', '传播', '梯度', '边界', '人工结构', '制度结构', '合成场域', '算法拓扑', '可观察现实'] }
      }
    ]
  },
  {
    number: '02',
    title: { en: 'Projection System', 'zh-Hans': '投影系统' },
    question: {
      en: 'How does structure become an experienced world?',
      'zh-Hans': '结构如何成为可经验的世界？'
    },
    summary: {
      en: 'Projection compresses Reality into surfaces, meaning, domains, collective worlds and synthetic co-projection.',
      'zh-Hans': '投影把现实压缩成表面、意义、领域、集体世界与人机共同投影。'
    },
    groups: [
      {
        title: { en: 'A · Projection Foundation', 'zh-Hans': 'A · 投影基础' },
        items: { en: ['Projection Necessity', 'Projection Surface', 'Compression', 'Resolution', 'World Formation'], 'zh-Hans': ['投影必要性', '投影表面', '投影压缩', '投影解析度', '世界形成'] }
      },
      {
        title: { en: 'B · Projection Meaning', 'zh-Hans': 'B · 投影意义' },
        items: { en: ['Meaning', 'Narrative', 'Interpretation', 'Belief', 'Projected Identity', 'Symbol', 'Archetype', 'Shared Meaning', 'Civilizational Narrative'], 'zh-Hans': ['意义', '叙事', '解释', '信念', '投影身份', '符号', '原型', '共享意义', '文明叙事'] }
      },
      {
        title: { en: 'C–E · Domains, Conditions and Collective Projection', 'zh-Hans': 'C–E · 领域、条件与集体投影' },
        items: { en: ['Structural', 'Functional', 'Relational', 'Network', 'Positional', 'Perceptual', 'Behavioral', 'Role', 'Directional', 'Bias', 'Distortion', 'Shared Reality', 'Institutions', 'Economy', 'History', 'Civilization'], 'zh-Hans': ['结构投影', '功能投影', '关系投影', '网络投影', '位置投影', '感知投影', '行为投影', '角色投影', '方向投影', '偏向', '失真', '共享现实', '制度', '经济', '历史', '文明'] }
      },
      {
        title: { en: 'F–Final · Synthetic Reality and Limits', 'zh-Hans': 'F–Final · 合成现实与投影边界' },
        items: { en: ['Synthetic Reality', 'Synthetic Meaning', 'Projection Acceleration', 'Instability', 'Human–AI Co-Projection', 'Projection Readers', 'Convergence', 'Projection Limits'], 'zh-Hans': ['合成现实', '合成意义', '投影加速', '投影不稳定', '人机共同投影', '投影读取模型', '投影收敛', '投影边界'] }
      }
    ]
  },
  {
    number: '03',
    title: { en: 'Reality Dynamics', 'zh-Hans': '现实动力学' },
    question: {
      en: 'How does Reality enter continuous Runtime?',
      'zh-Hans': '现实如何进入持续运行？'
    },
    summary: {
      en: 'Time, orientation, grammar, questions, capabilities, drivers, coordinates, motion and activation form the current Reality State.',
      'zh-Hans': '时间、方向、语法、问题、能力、驱动、坐标、运动与激活，共同形成当前现实状态。'
    },
    groups: [
      {
        title: { en: 'A–B · Temporal Entry, Orientation and Questions', 'zh-Hans': 'A–B · 时间入口、方向与问题' },
        items: { en: ['Temporal Medium', 'Runtime Entry Interface', 'Cosmological Orientation', 'Reality Grammar', 'Sixteen Fundamental Questions'], 'zh-Hans': ['时间介质', '运行入口界面', '宇宙方向', '现实语法', '十六基础问题'] }
      },
      {
        title: { en: 'C–D · Capability and Driver', 'zh-Hans': 'C–D · 运行能力与驱动' },
        items: { en: ['Nine Runtime Capabilities', 'Capability Selection', 'Twelve Runtime Drivers', 'Driver Priority'], 'zh-Hans': ['九种运行能力', '能力选择', '十二种运行驱动', '驱动优先级'] }
      },
      {
        title: { en: 'E–G · Coordinate, Motion and Activation', 'zh-Hans': 'E–G · 坐标、运动与激活' },
        items: { en: ['Runtime Coordinate', 'Bagua Motion Grammar', 'Eight Motion Primitives', 'Motion Network', 'Activation Window', 'Alignment Window', 'Activation State'], 'zh-Hans': ['运行坐标', '八卦运动语法', '八种基础运动', '运动网络', '激活窗口', '对齐窗口', '激活状态'] }
      },
      {
        title: { en: 'H · Runtime State Integration', 'zh-Hans': 'H · 运行状态整合' },
        items: { en: ['Runtime Network', 'State Formation', 'Consequences', 'Feedback', 'Recomposition', 'New Question', 'Continuity'], 'zh-Hans': ['运行网络', '状态形成', '运行后果', '反馈', '现实重组', '新问题', '持续运行'] }
      }
    ]
  },
  {
    number: '04',
    title: { en: 'Human Runtime Carrier', 'zh-Hans': '人类运行载体' },
    question: {
      en: 'How does continuous Runtime become human Runtime?',
      'zh-Hans': '持续运行如何成为人类运行？'
    },
    summary: {
      en: 'Runtime enters a biological carrier, becomes initialized, filtered, processed, stabilized, maintained, recovered and sometimes displaced or failed.',
      'zh-Hans': '运行进入生命载体，经过初始化、过滤、处理、稳定、维护、恢复，并可能发生漂移或失效。'
    },
    groups: [
      {
        title: { en: 'A · Human Initialization', 'zh-Hans': 'A · 人类初始化' },
        items: { en: ['Carrier Entry', 'Carrier Compression', 'Biological Compression', 'Design Layer', 'Reality Initialization State', 'Coordinate Embedding'], 'zh-Hans': ['载体入口', '载体压缩', '生物压缩', '设计层', '现实初始化状态', '坐标嵌入'] }
      },
      {
        title: { en: 'B–C · Carrier Architecture and Reality Intake', 'zh-Hans': 'B–C · 载体架构与现实输入' },
        items: { en: ['Body as Carrier', 'Capacity', 'Constraint', 'Integrity', 'Sensory Interface', 'Environment Runtime', 'Attention', 'Cognition'], 'zh-Hans': ['身体作为载体', '承载能力', '载体约束', '载体完整性', '感官界面', '环境运行', '注意架构', '认知界面'] }
      },
      {
        title: { en: 'D · Biological Runtime', 'zh-Hans': 'D · 生物运行' },
        items: { en: ['Nervous Runtime', 'Hormonal Runtime', 'State Override', 'Circadian Runtime', 'Metabolic Runtime', 'Biological Noise', 'Adaptive Biology', 'Runtime Mediums', 'External Runtime Systems'], 'zh-Hans': ['神经运行', '荷尔蒙运行', '状态覆写', '昼夜节律', '代谢运行', '生物噪声', '适应性生物学', '运行介质', '外部运行系统'] }
      },
      {
        title: { en: 'E–F · Stabilization and Continuity', 'zh-Hans': 'E–F · 稳定与连续' },
        items: { en: ['Carrier Inertia', 'Stability', 'Organization', 'Adaptation', 'Maintenance', 'Recovery', 'Drift', 'Failure', 'Human Runtime Architecture'], 'zh-Hans': ['载体惯性', '载体稳定', '载体组织', '运行适应', '运行维护', '运行恢复', '运行漂移', '运行失效', '人类运行架构'] }
      }
    ]
  },
  {
    number: '05',
    title: { en: 'Conscious Runtime', 'zh-Hans': '意识运行' },
    question: {
      en: 'How does Reality become conscious experience?',
      'zh-Hans': '现实如何成为意识体验？'
    },
    summary: {
      en: 'Experience becomes awareness, self-model, emotion, adaptation, expression, agency, identity and conscious completion.',
      'zh-Hans': '体验进一步形成觉察、自我模型、情绪、适应、表达、行动、身份与意识闭合。'
    },
    groups: [
      {
        title: { en: 'A–C · Experience, Self and Emotion', 'zh-Hans': 'A–C · 体验、自我与情绪' },
        items: { en: ['Runtime Visibility', 'Experience Emergence', 'Awareness', 'Dream Runtime', 'Subjective Reality', 'Self Construction', 'Emotional Runtime'], 'zh-Hans': ['运行可见性', '体验涌现', '觉察', '梦境运行', '主观现实', '自我建构', '情绪运行'] }
      },
      {
        title: { en: 'D–E · Adaptive Runtime and Experience Configuration', 'zh-Hans': 'D–E · 适应运行与体验配置' },
        items: { en: ['Adaptive Imprinting', 'Adaptive Reconfiguration', 'Adaptive Reintegration', 'Experience Selection', 'Perspective', 'Motivation'], 'zh-Hans': ['适应印记', '适应重构', '适应再整合', '体验选择', '观察视角', '动机运行'] }
      },
      {
        title: { en: 'F–G · Expression and Agency', 'zh-Hans': 'F–G · 表达与行动' },
        items: { en: ['Expression Emergence', 'Compression', 'Expression Threshold', 'Medium', 'Intention', 'Decision Architecture', 'Responsibility', 'Commitment', 'Agency Collapse'], 'zh-Hans': ['表达涌现', '压缩与表达', '表达阈值', '表达介质', '意图形成', '决策架构', '责任形成', '承诺稳定', '行动瓦解'] }
      },
      {
        title: { en: 'Identity and Conscious Closure', 'zh-Hans': '身份与意识闭合' },
        items: { en: ['Identity Stabilization', 'Identity Compression', 'Identity Drift', 'Identity Reconfiguration', 'Self-model Dissolution', 'Meaning Residue', 'Synthetic Self-model', 'Synthetic Consciousness'], 'zh-Hans': ['身份稳定', '身份压缩', '身份漂移', '身份重组', '自我模型消解', '意义残留', '合成自我模型', '合成意识'] }
      }
    ]
  }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function localized(value, locale) {
  return value?.[locale] || value?.en || '';
}

function figureImage(number) {
  return `/assets/images/figures/book-1/web/${number}.webp`;
}

function renderArchitecture(locale) {
  if (!architectureContainer) return;
  architectureContainer.innerHTML = BOOK_ARCHITECTURE.map((part, index) => `
    <details class="knowledge-book-part"${index === 0 ? ' open' : ''}>
      <summary>
        <span class="knowledge-book-part__number">${escapeHtml(part.number)}</span>
        <span class="knowledge-book-part__heading">
          <strong>${escapeHtml(localized(part.title, locale))}</strong>
          <small>${escapeHtml(localized(part.question, locale))}</small>
        </span>
        <span class="knowledge-book-part__toggle" aria-hidden="true">+</span>
      </summary>
      <div class="knowledge-book-part__body">
        <p class="knowledge-book-part__summary">${escapeHtml(localized(part.summary, locale))}</p>
        <div class="knowledge-book-part__groups">
          ${part.groups.map(group => `
            <section>
              <h3>${escapeHtml(localized(group.title, locale))}</h3>
              <ul>
                ${(group.items[locale] || group.items.en).map(item => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            </section>
          `).join('')}
        </div>
      </div>
    </details>
  `).join('');
}

function renderFigures(locale) {
  if (!figuresContainer || !figures) return;
  const selected = ['figure-0a', 'figure-1a', 'figure-2a', 'figure-3a', 'figure-4d', 'figure-5e']
    .map(id => figures.find(figure => figure.figure_id === id))
    .filter(Boolean);

  figuresContainer.innerHTML = selected.map(figure => `
    <article class="figure-card">
      <img src="${figureImage(figure.figure_number)}" alt="${escapeHtml(figure.title[locale] || figure.title.en)}" width="720" height="1023" loading="lazy">
      <div class="figure-card__body">
        <span class="knowledge-chip">Figure ${escapeHtml(figure.figure_number)}</span>
        <h3>${escapeHtml(figure.title[locale] || figure.title.en)}</h3>
        <a href="/figure?id=${encodeURIComponent(figure.figure_id)}">${escapeHtml(figure.title[locale] || figure.title.en)}</a>
      </div>
    </article>
  `).join('');
}

function render() {
  const locale = getLocale();
  renderArchitecture(locale);
  renderFigures(locale);
}

fetch('/content/registry/figures.json')
  .then(response => response.json())
  .then(figureRegistry => {
    figures = figureRegistry.figures;
    render();
  });

render();
onLocaleChange(render);
