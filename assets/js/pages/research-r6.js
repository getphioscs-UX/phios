import {resolveApprovedVisual} from '/assets/js/runtime/web-production/asset-resolver.js';
import {preferredCustomerLocale} from '/assets/customer-ui/js/locale.js';

const DB={
  "data": [
    {
      "roman": "I",
      "name": "Formation",
      "zh": "世界如何形成",
      "foundation": "Formation conditions, boundaries, structures and carriers",
      "foundationZh": "形成条件、边界、结构与载体",
      "tech": "Reality Structure & Context Modelling",
      "techZh": "现实结构与情境建模",
      "question": "What makes a situation possible?",
      "questionZh": "一个现实处境是如何形成的？",
      "overview": "Identify the conditions, boundaries and structures that shape a situation before interpreting it.",
      "overviewZh": "在解释处境之前，先辨认形成它的条件、边界与结构。",
      "example": "A family is considering a move. What conditions, resources and constraints define the decision?",
      "exampleZh": "一个家庭考虑搬家：哪些条件、资源与限制构成了这个决定？",
      "subjects": [
        "Personal",
        "Family",
        "Business",
        "Institution",
        "Country"
      ],
      "id": 1,
      "why": [
        "Without a model of formation, an answer can miss the actual conditions that make a situation possible.",
        "没有形成条件的模型，分析可能从错误的起点出发，忽略真正构成处境的边界。"
      ],
      "case": [
        "What is already true about the business: demand, capital, location, legal and contractual constraints?",
        "先辨认企业已有条件：需求、资金、地点，以及法律和合约约束。"
      ]
    },
    {
      "roman": "II",
      "name": "Runtime",
      "zh": "世界如何运行",
      "foundation": "Experience, awareness, agency, relationships and collective life",
      "foundationZh": "经验、觉察、行动能力、关系与共同生活",
      "tech": "Contextual Reality Profiles",
      "techZh": "情境化现实画像",
      "question": "How does reality operate in everyday life?",
      "questionZh": "现实如何在日常生活中运行？",
      "overview": "Examine lived experience, agency and relationships within their actual context.",
      "overviewZh": "在真实情境中理解经验、行动能力与关系。",
      "example": "A team is struggling to coordinate. How do roles, agency and relationships shape daily work?",
      "exampleZh": "团队协作不顺：角色、行动能力和关系如何影响日常工作？",
      "subjects": [
        "Personal",
        "Family",
        "Team",
        "Institution"
      ],
      "id": 2,
      "why": [
        "A situation is not just a static profile: it changes through people, decisions and relationships.",
        "现实不是一张静态画像，而是通过人的行动、决定与关系持续变化。"
      ],
      "case": [
        "How do the founder, staff, suppliers and customers actually interact?",
        "创办人、员工、供应商与客户实际上如何互动？"
      ]
    },
    {
      "roman": "III",
      "name": "Continuity",
      "zh": "世界如何维持",
      "foundation": "Maintenance, load, recovery, resources and resilience",
      "foundationZh": "维持、负荷、恢复、资源与韧性",
      "tech": "Resource & Constraint Analysis",
      "techZh": "资源与约束分析",
      "question": "What allows a system to keep going?",
      "questionZh": "什么让一个现实系统得以持续？",
      "overview": "Consider the resources, burdens and recovery capacity needed to sustain a situation.",
      "overviewZh": "理解维持现状所需的资源、承担的负荷与恢复能力。",
      "example": "A household or business faces rising costs. Which resources and commitments shape continuity?",
      "exampleZh": "家庭或企业面对成本上升：哪些资源和承诺影响持续经营或生活？",
      "subjects": [
        "Personal",
        "Family",
        "Team",
        "Business",
        "Institution",
        "Country"
      ],
      "id": 3,
      "why": [
        "A viable decision must account for the resources and recovery capacity needed to sustain it.",
        "可行的决定必须考虑维持所需的资源与恢复能力，而不只是眼前目标。"
      ],
      "case": [
        "Can current cash flow, workload and reserves sustain operations during the transition?",
        "现有现金流、工作负荷与储备是否足以支撑转型期间的经营？"
      ]
    },
    {
      "roman": "IV",
      "name": "Expansion",
      "zh": "世界如何扩展",
      "foundation": "Capacity, scale, interfaces and coordination",
      "foundationZh": "容量、尺度、接口与协调",
      "tech": "Growth & Cross-Scale Analysis",
      "techZh": "增长与跨尺度分析",
      "question": "What changes when a system grows?",
      "questionZh": "当一个系统扩大时，什么会改变？",
      "overview": "Consider capacity, scale and coordination when moving from one level of activity to another.",
      "overviewZh": "在活动规模扩大时，理解容量、尺度及协调方式的变化。",
      "example": "A small business wants to expand. What capacity and coordination questions arise?",
      "exampleZh": "一家小企业准备扩张：需要面对哪些容量与协调问题？",
      "subjects": [
        "Team",
        "Business",
        "Institution",
        "Country"
      ],
      "id": 4,
      "why": [
        "Operating successfully at one scale does not establish readiness to operate at another.",
        "能够在现有规模运行，并不等于已具备扩大规模的条件。"
      ],
      "case": [
        "What additional management, capital and coordination would a second branch require?",
        "第二家分店会增加哪些管理、资本和协调需求？"
      ]
    },
    {
      "roman": "V",
      "name": "Differentiation",
      "zh": "世界如何分化",
      "foundation": "Multidimensional civilization atlas and historical pathways",
      "foundationZh": "多维文明图谱与历史路径",
      "tech": "World & Country Intelligence",
      "techZh": "世界与国家智能",
      "question": "Why do societies develop differently?",
      "questionZh": "为什么不同社会走出不同的发展路径？",
      "overview": "Explore historical pathways and multidimensional differences across civilizations and countries.",
      "overviewZh": "探索不同文明及国家的历史路径和多维差异。",
      "example": "Two countries have different development paths. Which historical and institutional contexts matter?",
      "exampleZh": "两个国家发展路径不同：哪些历史与制度背景值得关注？",
      "subjects": [
        "Institution",
        "Country"
      ],
      "id": 5,
      "why": [
        "Context matters: the same strategy may behave differently across markets, institutions and histories.",
        "相同策略在不同市场、制度及历史背景中可能出现不同结果。"
      ],
      "case": [
        "How do local market conditions and national policies differ across candidate locations?",
        "不同候选地点的市场条件与国家政策有哪些差异？"
      ]
    },
    {
      "roman": "VI",
      "name": "Reconfiguration",
      "zh": "世界如何重组",
      "foundation": "Changing relationships of power, resources, responsibility and risk",
      "foundationZh": "权力、资源、责任与风险关系的变化",
      "tech": "Transformation & Scenario Analysis",
      "techZh": "转型与情景分析",
      "question": "What changes when relationships are reorganized?",
      "questionZh": "当现实关系发生重组时，会有什么改变？",
      "overview": "Explore shifts in the distribution of power, resources, responsibilities and risks.",
      "overviewZh": "理解权力、资源、责任及风险分配方式的变化。",
      "example": "An institution changes its operating model. How might responsibilities and risks be redistributed?",
      "exampleZh": "机构改变运行模式：责任与风险可能如何重新分配？",
      "subjects": [
        "Family",
        "Team",
        "Business",
        "Institution",
        "Country"
      ],
      "id": 6,
      "why": [
        "Change may redistribute resources, responsibilities and risks rather than simply increase output.",
        "变化不只是产出增减，也可能重新分配资源、责任和风险。"
      ],
      "case": [
        "What changes if the firm franchises, takes on debt or changes ownership?",
        "加盟、负债或股权调整会怎样改变责任与风险？"
      ]
    },
    {
      "roman": "VII",
      "name": "Observation",
      "zh": "世界如何被观察",
      "foundation": "Traces, signals, evidence, models and the unknown",
      "foundationZh": "痕迹、信号、证据、模型与未知",
      "tech": "Evidence Validation & Trust Architecture",
      "techZh": "证据验证与信任架构",
      "question": "How do we know what we know?",
      "questionZh": "我们如何知道自己所知道的事？",
      "overview": "Distinguish observations, evidence, models and uncertainty before relying on a conclusion.",
      "overviewZh": "在依赖结论之前，区分观察、证据、模型与不确定性。",
      "example": "A claim about an economic trend appears online. What evidence is available and what remains unknown?",
      "exampleZh": "网上出现一项经济趋势的说法：有哪些证据，哪些仍然未知？",
      "subjects": [
        "Personal",
        "Family",
        "Team",
        "Business",
        "Institution",
        "Country"
      ],
      "id": 7,
      "why": [
        "A coherent explanation is not enough: its evidence, assumptions and unknowns must be distinguishable.",
        "解释听起来合理并不足够，必须区分证据、假设及未知。"
      ],
      "case": [
        "Which figures are verified, which forecasts are assumptions, and which inputs are missing?",
        "哪些数据已经核实、哪些预测属于假设、哪些输入仍然缺失？"
      ]
    },
    {
      "roman": "VIII",
      "name": "Navigation",
      "zh": "世界将如何继续",
      "foundation": "Choice, responsibility, reversibility and adaptive review",
      "foundationZh": "选择、责任、可逆性与适应性复核",
      "tech": "Reality Navigation & Continuity",
      "techZh": "现实导航与延续",
      "question": "How can we move forward responsibly?",
      "questionZh": "如何负责任地走向下一步？",
      "overview": "Compare choices, consider responsibility and reversibility, and revisit decisions as conditions change.",
      "overviewZh": "比较选择、责任和可逆性，并随条件变化重新审视决定。",
      "example": "A person faces several career options. Which choices can be reviewed or reversed as circumstances change?",
      "exampleZh": "一个人面对多个职业选项：哪些选择能够随着处境变化而复核或调整？",
      "subjects": [
        "Personal",
        "Family",
        "Team",
        "Business",
        "Institution",
        "Country"
      ],
      "id": 8,
      "why": [
        "Even a well-supported reading is not a decision. Alternatives, human responsibility and later review must remain explicit.",
        "即使读取有充分证据，也不等于替人作决定；选项、人的责任及后续复核必须明确。"
      ],
      "case": [
        "Compare staying, piloting and expanding; define review conditions before committing.",
        "比较维持现状、试点及扩张，在承诺之前明确复核条件。"
      ]
    }
  ],
  "registry": [
    {
      "route": "/books/reality-formation/",
      "subtitle": [
        "Foundations of Reality Formation and Runtime",
        "现实形成与运行基础"
      ],
      "parts": [
        [
          1,
          "Reality Physics",
          "现实物理学"
        ],
        [
          2,
          "Projection System",
          "投影系统"
        ],
        [
          3,
          "Reality Dynamics",
          "现实动力学"
        ],
        [
          4,
          "Human Runtime Carrier",
          "人类运行载体"
        ]
      ],
      "orientation": [
        "What makes a situation take shape?",
        "一个处境如何形成？",
        "Begin with the conditions, perspectives, changes and carriers through which a reality takes shape. This volume is a useful starting point when you want to understand the foundations before moving into interaction or navigation.",
        "从条件、投影、变化与载体，理解现实怎样形成。想先了解基础，再进入人与世界的互动或导航时，可以从这一册开始。"
      ],
      "preview": 50,
      "figures": 13,
      "figureId": "0A",
      "figureEn": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-1/en/0A.webp",
      "figureZh": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-1/0A.webp"
    },
    {
      "route": "/books/reality-runtime/",
      "subtitle": [
        "How Humans and the World Run Together",
        "人与世界如何共同运行"
      ],
      "parts": [
        [
          5,
          "Conscious Runtime",
          "意识运行"
        ],
        [
          6,
          "Relational Runtime",
          "共同运行"
        ],
        [
          7,
          "Collective Runtime",
          "集体运行"
        ]
      ],
      "orientation": [
        "How do experience, relationships and collective life interact?",
        "经验、关系与集体生活如何相互作用？",
        "Follow the movement from conscious experience into relationships and collective activity. This volume is useful when a question involves more than one person or when individual and shared patterns need to be considered together.",
        "从意识经验进入关系与集体活动。当问题涉及不止一个人，或需要一起理解个人与共同模式时，可以从这一册继续。"
      ],
      "preview": 39,
      "figures": 13,
      "figureId": "5A",
      "figureEn": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-2/en/5A.webp",
      "figureZh": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-2/5A.webp"
    },
    {
      "route": "/books/reality-continuity/",
      "subtitle": [
        "How Runtime Is Maintained, Recovered and Coordinated",
        "运行如何被维护、恢复与协调"
      ],
      "parts": [
        [
          8,
          "Runtime Maintenance",
          "运行维持"
        ],
        [
          9,
          "Coordination Runtime",
          "协调运行"
        ]
      ],
      "orientation": [
        "What allows something to keep going—and recover?",
        "什么让一件事得以持续，并能够恢复？",
        "Explore maintenance, recovery, coordination and continuity. This volume is useful when a situation can begin but struggles to remain workable, or when restoring conditions matters more than simply adding more activity.",
        "探索维持、恢复、协调与连续性。当一件事能够开始，却难以持续；或恢复条件比继续增加活动更重要时，可以阅读这一册。"
      ],
      "preview": 34,
      "figures": 9,
      "figureId": "8A",
      "figureEn": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-3/en/8A.webp",
      "figureZh": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-3/8A.webp"
    },
    {
      "route": "/books/reality-expansion/",
      "subtitle": [
        "Runtime Expansion and Civilization Runtime",
        "运行扩展与文明运行"
      ],
      "parts": [
        [
          10,
          "Runtime Expansion",
          "运行扩展"
        ],
        [
          11,
          "Civilization Runtime",
          "文明运行"
        ]
      ],
      "orientation": [
        "Why does a larger scale change the problem?",
        "为什么规模变大，问题也会改变？",
        "Explore expansion and changes of scale, including the questions that arise in civilization. This volume is useful when continued operation is being mistaken for readiness to expand. Read the distinctions in context rather than treating a summary as a numerical threshold.",
        "探索扩展与尺度变化，以及文明中的相关问题。当持续运行被误认为已经适合扩展时，可以阅读这一册。请结合正文理解区分，总结本身不是数值阈值。"
      ],
      "preview": 50,
      "figures": 11,
      "figureId": "10A",
      "figureEn": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-4/en/10A.webp",
      "figureZh": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-4/10A.webp"
    },
    {
      "route": "/books/reality-differentiation/",
      "subtitle": [
        "Civilization Atlas",
        "文明图谱"
      ],
      "parts": [
        [
          12,
          "Civilization Atlas",
          "文明图谱"
        ]
      ],
      "orientation": [
        "How can civilizations be compared without ranking them?",
        "怎样比较文明，而不把它们排成高低？",
        "Explore the Civilization Atlas through its cases, positions and changing trajectories. This volume is useful for noticing different carriers and boundaries in historical context. Illustrations support exploration; they are not independent proof of a historical claim.",
        "通过案例、位置与变化轨迹探索文明图谱。这一册帮助结合历史情境，理解不同载体与边界。插图辅助探索，本身不独立证明历史主张。"
      ],
      "preview": 50,
      "figures": 6,
      "figureId": "12A",
      "figureEn": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-5/en/12A.webp",
      "figureZh": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-5/12A.webp"
    },
    {
      "route": "/books/reality-reconfiguration/",
      "subtitle": [
        "Civilization Reconfiguration Atlas",
        "文明重组图谱"
      ],
      "parts": [
        [
          13,
          "Civilization Reconfiguration Atlas",
          "文明重组图谱"
        ]
      ],
      "orientation": [
        "How does an existing civilization reconfigure?",
        "既有文明如何重组？",
        "",
        ""
      ],
      "preview": 50,
      "figures": 9,
      "figureId": "13A",
      "figureEn": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-6/en/13A.webp",
      "figureZh": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-6/13A.webp"
    },
    {
      "route": "/books/reality-observation/",
      "subtitle": [
        "Reading Science",
        "读取科学"
      ],
      "parts": [
        [
          14,
          "Reading Science",
          "读取科学"
        ]
      ],
      "orientation": [
        "What did we observe, and what did we interpret?",
        "哪些是观察，哪些是解释？",
        "Explore the relationship between observation, evidence, models and interpretation. This volume is useful before relying on a reading or comparing methods: it helps you ask what a statement is based on and what remains uncertain.",
        "探索观察、证据、模型与解释之间的关系。依赖某次读取或比较方法之前，这一册帮助追问：陈述根据什么，又有哪些仍不确定。"
      ],
      "preview": 0,
      "figures": 9,
      "figureId": "14A",
      "figureEn": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-7/en/14A.webp",
      "figureZh": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-7/14A.webp"
    },
    {
      "route": "/books/reality-navigation/",
      "subtitle": [
        "Navigation Science and Reality Continuation",
        "导航科学与现实延续"
      ],
      "parts": [
        [
          15,
          "Navigation Science and Reality Continuation",
          "导航科学与现实延续"
        ]
      ],
      "orientation": [
        "Reality Navigation",
        "世界将如何继续",
        "The eighth volume is PHI OS’s internal operating doctrine: how understanding a situation leads to a next step and how outcomes inform continuation. It is not offered as a public book, full text or download.",
        "第八册并不对外出售。到了这里，它已经不再只是一本书，而是 PHI OS 如何从理解现实进入下一步的运行层。它是内部运行 doctrine，不提供公开完整正文或下载。"
      ],
      "preview": 0,
      "figures": 9,
      "figureId": "15A",
      "figureEn": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-8/en/15A.webp",
      "figureZh": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/books/book-8/15A.png"
    }
  ],
  "subjects": [
    [
      "Personal",
      "个人",
      "Understand your situation and choices.",
      "理解自身处境与选择。"
    ],
    [
      "Family",
      "家庭",
      "Understand shared life and responsibilities.",
      "理解共同生活与责任。"
    ],
    [
      "Team",
      "团队",
      "Understand roles and coordination.",
      "理解角色与协作。"
    ],
    [
      "Business",
      "企业",
      "Understand resources and operations.",
      "理解资源与经营。"
    ],
    [
      "Institution",
      "机构",
      "Understand service and accountability.",
      "理解服务与责任。"
    ],
    [
      "Country",
      "国家",
      "Understand history and national context.",
      "理解历史与国家现实。"
    ]
  ]
};const AS={"hero-8": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hero-8.webp", "art-4": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/art-4.webp", "hero-6": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hero-6.webp", "hard-8": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hard-8.webp", "positioning": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/positioning.webp", "art-3": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/art-3.webp", "art-7": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/art-7.webp", "hard-4": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hard-4.webp", "art-5": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/art-5.webp", "art-6": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/art-6.webp", "hard-2": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hard-2.webp", "art-2": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/art-2.webp", "hard-1": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hard-1.webp", "hero-7": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hero-7.webp", "hard-3": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hard-3.webp", "hero-1": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hero-1.webp", "art-1": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/art-1.webp", "art-8": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/art-8.webp", "hero-2": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hero-2.webp", "hard-7": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hard-7.webp", "hero-3": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hero-3.webp", "hard-6": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hard-6.webp", "hard-5": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hard-5.webp", "hero-4": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hero-4.webp", "hero-5": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/hero-5.webp", "access": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/PHIOS-access-hero.webp", "system": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/PHIOS-system-hero.webp", "library": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/PHIOS-library-hero.webp", "reading": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/PHIOS-reading-hero.webp", "journey": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/PHIOS-journey-hero.webp", "visual": "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/research/r6/PHIOS-visual-hero.webp"};const {data,registry,subjects}=DB;let lang=preferredCustomerLocale()==='zh-Hans'?'zh':'en',selected=0,tab=0;const $=id=>document.getElementById(id),t=(en,zh)=>lang==='zh'?zh:en,v=(d,k)=>lang==='zh'?d[k+'Zh']:d[k],pair=a=>t(a[0],a[1]),esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),title=d=>t('Reality '+d.name,d.zh),src=(k,i)=>AS[`${k}-${i}`],a=(href,en,zh,primary=false)=>`<a class="btn ${primary?'primary':''}" href="${esc(href)}">${t(en,zh)} ↗</a>`;
await Promise.all(Object.keys(AS).map(async key=>{const file=AS[key].split('/').pop();const resolved=await resolveApprovedVisual('RESEARCH-R6-'+file.slice(0,-5).toUpperCase(),{surface:'research-r6'});if(!resolved.renderable)throw Error('Research visual unavailable: '+key);AS[key]=resolved.src;}));
const navs=[['#why','Why navigation','为何需要导航'],['#foundation','Foundation','思想基础'],['#library','Eight volumes','八册原著'],['#architecture','Architecture','技术架构'],['#applications','Applications','现实应用']];
const pillars=[['Proprietary Knowledge Architecture','原创知识架构','The eight volumes and registered knowledge structures provide the conceptual vocabulary.','八册原著与既有知识结构提供共同的概念语言。'],['Application-Specific Reasoning','领域推理','Combine domain rules and deterministic calculation where valid; distinguish models and interpretation.','在适用范围内结合领域规则及确定性计算，区分模型与解释。'],['Hybrid AI Orchestration','混合 AI 编排','Select appropriate tools, models and computing services as needed; the ecosystem in the positioning figure is not a list of enabled services.','按需选择适合的工具、模型与计算服务；定位图中的能力生态不等于现有全部已接入。'],['Contextual Reality Profiles','情境化现实画像','Represent relevant facts, relationships, resources and changing conditions across six subject perspectives.','从六主体表达相关事实、关系、资源及不断变化的条件。'],['Evidence Validation','证据验证','Trace sources, distinguish fact from inference and scenario, preserve unknowns, and revise when evidence changes.','追溯来源，区分事实、推断与情景，保留未知，并在证据变化时修订。'],['Responsible AI Governance','负责任的 AI 治理','Set boundaries for consent, privacy, security, compliance, professional advice and human decision authority.','明确同意、隐私、安全、合规、专业服务及人的决策权边界。']];
const btns=()=>`<div class="btns"><a class="btn primary" href="#library">${t('Explore the eight volumes','探索八册原著')} ↓</a><a class="btn" href="#architecture">${t('Explore the architecture','探索技术架构')} ↓</a></div>`;
const problems=[[["Complexity Explosion", "复杂性急剧增长"], ["More interacting conditions make single-factor explanations insufficient.", "相互作用的条件越来越多，单一因素难以充分解释现实。"]], [["Fragmented Knowledge", "知识碎片化"], ["Relevant knowledge is distributed across disciplines, sources and tools.", "相关知识分散在不同学科、来源和工具中。"]], [["Fragmented Representation", "现实表示碎片化"], ["Different models describe different aspects of the same situation without a shared context.", "不同模型描述同一处境的不同方面，却未必共享情境。"]], [["Intelligence-to-Action Gap", "智能到行动的落差"], ["An insightful answer does not by itself establish a feasible, responsible next step.", "有洞见的答案本身，并不保证下一步可行且负责任。"]], [["Runtime Gap", "现实运行的落差"], ["Conditions change after a decision; understanding must be open to review and revision.", "决定之后条件仍会变化，理解需要持续复核与修订。"]]];
const framework=[[["Reality Ontology", "现实本体"], ["Shared concepts and representation boundaries.", "共同概念与表示边界。"]], [["Runtime Engine", "运行引擎"], ["Represent states and changes.", "表示状态与变化。"]], [["Evidence Engine", "证据引擎"], ["Associate sources, claims and uncertainty.", "关联来源、主张与不确定性。"]], [["Navigation Engine", "导航引擎"], ["Structure alternatives and reviewable next steps.", "组织选项与可复核的下一步。"]], [["Runtime Graph", "运行关系图"], ["Represent connected entities and relationships.", "表示相关实体与关系。"]], [["Reality Memory", "现实记忆"], ["Maintain authorised context and history.", "维持获授权的情境与历史。"]], [["Continuous Learning", "持续学习"], ["Continuous evidence-based revision; not automatic model training.", "持续依据证据修订；不等于自动模型训练。"]]];
const malaysia=[[["World & Country", "世界与国家"], ["Distinguish historical evidence, current facts and future scenarios; preserve dates and unknowns.", "区分历史证据、当前事实与未来情景，保留日期与未知。"]], [["Business & Financial", "企业与财务"], ["Examine demand, costs, cash flow, debt and constraints using qualified inputs and existing calculations.", "使用合格输入与既有计算检视需求、成本、现金流、债务及限制。"]], [["Family & Personal", "家庭与个人"], ["Include household commitments, personal resources, responsibilities and risk tolerance only with permission.", "仅在授权下纳入家庭责任、个人资源、承诺与风险承受能力。"]], [["Adaptive navigation", "适应性导航"], ["Compare feasible alternatives, record assumptions and review triggers; humans retain decisions.", "比较可行选项，登记假设与复核触发条件，决定权保留给人。"]]];
const problemIcons=['<circle cx="12" cy="12" r="3"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/><path d="m6 7 4 3m4 0 4-3m-8 7-4 4m8-4 4 4"/>','<path d="M3 5h7v15H3zM14 5h7v15h-7zM5 9h3m8 0h3"/>','<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M14 3h7v7M3 14v7h7M10 10l4 4"/>','<path d="M3 5h7v7H3zM14 14h7v7h-7zM10 8h9v4m-3-3 3 3 3-3"/>','<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2M2 8l3-3M19 19l3-3"/>'];
function node(label,group,i,icon='',active=false){return `<button class="node" data-insight="${group}" data-index="${i}" aria-pressed="${active}">${icon?`<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`:''}<span>${esc(label)}</span></button>`}
function merge(n){return `<svg class="merge-lines" viewBox="0 0 1000 30" preserveAspectRatio="none" aria-hidden="true">${Array.from({length:n},(_,i)=>`<path d="M${(i+.5)*1000/n} 0 V12 H500 V30"/>`).join('')}</svg>`}
function showInsight(group,i){const arr=group==='problem'?problems:group==='framework'?framework:group==='pillar'?pillars:group==='case'?data:malaysia;const p=arr[i];if(!p)return;const host=$(group==='framework'||group==='pillar'?'arch-insight':group+'-insight');if(!host)return;const heading=group==='pillar'?t(p[0],p[1]):group==='case'?title(p):pair(p[0]);const desc=group==='pillar'?t(p[2],p[3]):group==='case'?pair(p.case):pair(p[1]);host.replaceChildren();const b=document.createElement('strong');b.textContent=heading;host.append(b,document.createTextNode(desc));if(['framework','pillar'].includes(group)&&host.getBoundingClientRect().top>innerHeight-100)host.scrollIntoView({block:'nearest',behavior:'instant'});document.querySelectorAll('[data-insight]').forEach(el=>{const g=el.dataset.insight;if(g===group||(['pillar','framework'].includes(group)&&['pillar','framework'].includes(g)))el.setAttribute('aria-pressed',String(g===group&&Number(el.dataset.index)===i))});}

function render(){document.documentElement.lang=lang==='zh'?'zh-Hans':'en';$('navlinks').innerHTML=navs.map(x=>`<a href="${x[0]}">${t(x[1],x[2])}</a>`).join('');$('main').innerHTML=`
<section class="hero"><div class="wrap"><div class="hero-grid"><div><div class="eyebrow">PHI OS · UNIFIED REALITY INTELLIGENCE PLATFORM</div><h1>${t('Reality is interconnected.<br><span class="accent">Intelligence needs direction.</span>','现实相互联系。<br><span class="accent">智能需要方向。</span>')}</h1><p class="lead">${t('Navigating reality requires more than isolated intelligence.','导航现实，需要的不只是孤立的智能。')}</p>${btns()}<div class="mini-metrics"><div><b>8</b><span>${t('Original volumes','原创著作')}</span></div><div><b>1</b><span>${t('Developing platform','发展中的平台')}</span></div><div><b>6</b><span>${t('Perspectives','主体视角')}</span></div></div></div><figure class="hero-image"><img src="${AS.journey}" alt="${t('Conceptual journey through a connected world','相互关联的现实旅程概念图')}" fetchpriority="high"></figure></div><div class="hero-foot"><strong>One Real World. Six Perspectives.</strong><span>${t('Developed in Malaysia. Designed for the World.','在马来西亚开发，面向世界设计。')}</span><span>${t('From Information to Intelligence to Reality Navigation.','从信息到智能，再到现实导航。')}</span></div></div></section>
<section class="section white" id="why"><div class="wrap"><div class="intro"><div class="eyebrow">01 / THE COMPLETE REALITY PROBLEM</div><h2>${t('Five gaps. One interconnected reality.','五大缺口，一个相互联系的现实。')}</h2><p class="lead">${t('Select a problem to see why it matters.','点击任一问题，了解它为何重要。')}</p></div><div class="visual-panel diagram"><div class="diagram-row problems-row" style="--cols:5">${problems.map((p,i)=>node(pair(p[0]),'problem',i,problemIcons[i],i===0)).join('')}</div>${merge(5)}<div class="dark-node"><strong>${t('Fragmented understanding','碎片化理解')}</strong><p>${t('The same reality, many disconnected views.','同一个现实，多种分散的理解。')}</p></div><div class="arrow">↓</div><div class="flow-result"><div>${t('Unified Reality Intelligence','统一现实智能')}</div><div class="arrow">→</div><div>${t('Reality Navigation','现实导航')}</div></div><div class="insight" id="problem-insight" aria-live="polite"><strong>${pair(problems[0][0])}</strong>${pair(problems[0][1])}</div></div></div></section>
<section class="section" id="foundation"><div class="wrap"><div class="intro"><div class="eyebrow">02 / INTELLECTUAL ORIGINS</div><h2>${t('From observing life to understanding reality.','从生活观察，到理解现实。')}</h2></div><div class="image-split"><figure><img src="${AS.reading}" loading="lazy" alt="${t('Conceptual knowledge and navigation landscape','知识与现实导航概念图')}"><figcaption>${t('Original research shaped by observation and inquiry.','源于观察与探究的原创思想。')}</figcaption></figure><div class="diagram"><div class="diagram-label">${t('Intellectual origins','思想来源')}</div><div class="diagram-row research-origin" style="--cols:3">${[['Lived observation','生活观察'],['Cross-domain inquiry','跨领域探究'],['Original synthesis','原创思想整理']].map(p=>`<div class="node">${pair(p)}</div>`).join('')}</div>${merge(3)}<div class="dark-node"><strong>${t('Eight Original Volumes','八册原创著作')}</strong><p>${t('Eight complementary perspectives on reality','八种互补的现实研究视角')}</p></div><div class="diagram-row foundation-volumes" style="--cols:4">${data.map((d,i)=>`<button class="node" data-select="${i}"><b>${d.roman}</b><span>${t(d.name,d.zh)}</span></button>`).join('')}</div><div class="arrow" aria-hidden="true">↓</div><div class="flow-result"><div>Unified Runtime Framework</div><div class="arrow">→</div><div>PHI OS</div></div><p class="diagram-note">${t('Original knowledge → proposed framework → developing technology','原创知识 → 拟议框架 → 发展中的技术实现')}</p></div></div></div></section>
<section class="section white" id="library"><div class="wrap"><div class="intro"><div class="eyebrow">03 / ORIGINAL INTELLECTUAL FOUNDATION</div><h2>${t('Eight volumes. One connected inquiry.','八册原著，一套相互关联的探索。')}</h2><p class="lead">${t('Eight complementary lenses, not a mandatory reading sequence. Select any volume.','八种互补的研究视角，并非强制阅读顺序。请选择任一册。')}</p></div><div class="library-visual"><figure><img src="${AS.library}" loading="lazy" alt="${t('Original knowledge library artwork','原创知识书库概念图')}"></figure><figure class="network"><img src="${AS.system}" loading="lazy" alt="${t('Eight-volume system conceptual artwork','八册系统概念图')}"></figure></div><div class="book-grid" id="book-grid"></div><div class="detail" id="volume-detail" aria-label="${t('Selected volume details','所选单册详情')}"></div><div class="reading-access"><img src="${AS.access}" loading="lazy" alt="${t('Digital book access artwork','数字书籍阅读概念图')}"><div><h3>${t('Continue reading','继续阅读原著')}</h3><div class="links">${a('/search/?type=book','Search books','搜索原著')}${a('/books/','Original library','完整书库')}${a('/figures/','Summary figures','总结图')}${a('/articles/','Published articles','已发布文章')}</div><p class="small">${t('Original access and publication boundaries remain unchanged.','原有阅读及出版权限保持不变。')}</p></div></div><details class="fold"><summary>${t('Original eight-volume knowledge network','查看原八册知识关系图')}</summary><a href="https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/Entrance/PHIOS-FIGURE-EIGHT-VOLUME-KNOWLEDGE-NETWORK-v1.webp" target="_blank" rel="noopener"><img loading="lazy" style="max-height:500px;object-fit:contain;margin:16px auto" src="https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/figures/Entrance/PHIOS-FIGURE-EIGHT-VOLUME-KNOWLEDGE-NETWORK-v1.webp" alt="${t('Original eight-volume knowledge network','原八册知识网络图')}"></a></details></div></section>
<section class="section" id="architecture"><div class="wrap"><div class="image-split architecture-intro"><div><div class="eyebrow">04 / FROM KNOWLEDGE TO TECHNOLOGY</div><h2>${t('One architecture. Many capabilities.','一个架构，多种能力。')}</h2><p class="lead">${t('Explore how the research, existing AI ecosystem and six subject perspectives connect.','探索原创研究、AI 能力生态与六主体如何连接。')}</p></div><figure><img src="${AS.visual}" loading="lazy" alt="${t('Visual knowledge architecture','视觉知识架构概念图')}"></figure></div><div class="arch-layout"><div class="arch-top">${t('RESPONSIBLE AI GOVERNANCE · THROUGHOUT THE LIFECYCLE','负责任 AI 治理 · 贯穿全生命周期')}</div><div class="arch-main"><div class="dark-node"><strong>Reality Navigation</strong><p>${t('Understanding · Direction · Scenario Evaluation · Decision Support · Adaptation','理解 · 方向 · 情景评估 · 决策支持 · 适应调整')}</p></div><div class="arrow">↑</div><div class="diagram-row" style="--cols:6">${subjects.map(p=>`<a class="node" href="/subjects/${p[0].toLowerCase()}/">${t(p[0],p[1])}</a>`).join('')}</div><div class="arrow">↑</div><div class="arch-layer implementation"><h3>PHI OS · ${t('Developing implementation','发展中的技术实现')}</h3><div class="diagram-row" style="--cols:2">${pillars.slice(0,4).map((p,i)=>node(t(p[0],p[1]),'pillar',i,'',false)).join('')}</div></div><div class="arrow">↑</div><div class="arch-layer framework"><h3>Unified Runtime Framework</h3><div class="diagram-row" style="--cols:4">${framework.map((p,i)=>node(pair(p[0]),'framework',i,'',i===0)).join('')}</div></div><div class="arrow">↑</div><div class="arch-layer"><h3>${t('Original Intellectual Foundation','原创思想基础')}</h3><div class="diagram-row" style="--cols:4">${data.map((d,i)=>`<button class="node" data-select="${i}"><b>${d.roman}</b>${t(d.name,d.zh)}</button>`).join('')}</div><div class="diagram-label" style="margin-top:8px">${t('Eight complementary research perspectives','八种互补的研究视角')}</div></div></div><aside class="evidence-spine"><h3>${t('Evidence Validation','证据验证')}</h3>${[['Source','来源'],['Context','情境'],['Logic','逻辑'],['Uncertainty','不确定性'],['Output','输出']].map(p=>`<span>${pair(p)}</span>`).join('')}</aside><div class="arch-bottom">${t('Privacy · Permissions · Safety · Human Oversight · Accountability','隐私 · 权限 · 安全 · 人工监督 · 问责')}</div></div><div class="diagram-label" style="margin-top:18px">${t('Enabling technology → PHI OS implementation','支撑技术 → PHI OS 技术实现')}</div><div class="arch-ecosystem"><h3>${t('AI & Digital Capability Landscape','AI 与数字能力生态')}</h3><div class="diagram-row" style="--cols:4">${[['LLMs','大语言模型'],['Search & retrieval','搜索与检索'],['Data & analytics','数据与分析'],['Image & video','图像与视频'],['Voice & vision','语音与视觉'],['AI agents','AI 智能体'],['Deterministic software','确定性软件'],['Local & cloud computing','本地与云计算']].map(p=>`<div class="node">${pair(p)}</div>`).join('')}</div><p class="diagram-note">${t('Existing ecosystem and potential integration resources—not a live service inventory.','现有技术生态与潜在整合资源，并非已上线服务清单。')}</p></div><div class="insight" id="arch-insight" aria-live="polite" style="margin-top:12px"><strong>${pair(framework[0][0])}</strong>${pair(framework[0][1])}</div><p class="status-note">${t('Select a framework or implementation capability to read its role. Evidence validation and governance apply across the lifecycle; the diagram expresses a proposed architecture, not a verified production inventory.','点击框架或实现能力查看其作用。证据验证与治理贯穿全生命周期；架构图表达拟议设计，并非生产验收清单。')}</p><details class="fold mapping-details"><summary>${t('Eight-volume research → technology mapping','展开八册研究与技术映射')}</summary><div class="map-grid">${data.map((d,i)=>`<article class="maprow"><span class="roman">${d.roman}</span><div><h3>${title(d)}</h3><p>${v(d,'foundation')}</p><strong>→ ${v(d,'tech')}</strong><p>${pair(d.why)}</p><button class="open" style="background:none;border:0;color:#184d70;padding:8px 0;font-weight:650" data-select="${i}">${t('View volume','查看本册')} ↑</button></div></article>`).join('')}</div></details><details class="fold"><summary>${t('Evidence validation and responsible AI governance','证据验证与负责任 AI 治理')}</summary><div class="split">${pillars.slice(4).map(p=>`<article><h3>${t(p[0],p[1])}</h3><p>${t(p[2],p[3])}</p></article>`).join('')}</div></details><details class="fold"><summary>${t('Original AI-era positioning illustration','查看原 AI 时代定位图')}</summary><figure class="original-figure"><button data-zoom aria-label="${t('Enlarge positioning illustration','放大定位图')}"><img src="${AS.positioning}" loading="lazy" alt="PHI OS positioning in the AI era"></button><figcaption class="small">${t('Conceptual illustration · click to enlarge.','概念插图 · 点击放大。')}</figcaption></figure></details></div></section>
<section class="section white" id="applications"><div class="wrap"><div class="intro"><div class="eyebrow">05 / REAL-WORLD APPLICATION</div><h2>${t('One decision. Eight complementary questions.','一个决定，八种互补的提问。')}</h2><p class="lead">${t('Example: should a business open a second branch?','示例：企业是否适合开设第二家分店？')}</p></div><div class="visual-panel diagram"><div class="diagram-row case-selector" style="--cols:4">${data.map((d,i)=>node(d.roman+' · '+t(d.name,d.zh),'case',i,'',i===0)).join('')}</div>${merge(4)}<div class="dark-node"><strong>${t('Understand the situation before choosing','先理解处境，再作选择')}</strong></div><div class="insight" id="case-insight" aria-live="polite"><strong>${title(data[0])}</strong>${pair(data[0].case)}</div><div class="flow-result"><div>${t('Evidence-informed alternatives','证据支持的选项')}</div><div class="arrow">→</div><div>${t('Human choice & review','人的选择与复核')}</div></div></div><details class="fold"><summary>${t('Malaysia 2026–2036 · cross-perspective acceptance example','马来西亚 2026–2036 · 跨主体整合验收示例')}</summary><div class="acceptance-case" style="margin-top:0"><h3>${t('From national conditions to household and business choices','从国家条件到家庭与企业选择')}</h3><div class="diagram-row" style="--cols:4;margin-top:15px">${malaysia.map((p,i)=>node(pair(p[0]),'malaysia',i,'',i===0)).join('')}</div><div class="insight" id="malaysia-insight" aria-live="polite" style="margin-top:12px"><strong>${pair(malaysia[0][0])}</strong>${pair(malaysia[0][1])}</div><div class="links">${a('/world/','World','世界')}${a('/subjects/country/','Country','国家')}${a('/subjects/business/','Business','企业')}${a('/subjects/family/','Family','家庭')}</div><p class="small">${t('Illustrative acceptance case only; no forecast, financial advice or executed production assessment.','仅为整合验收示例，不提供预测、金融建议或实际生产评估结果。')}</p></div></details><div class="intro" style="margin-top:30px;margin-bottom:10px"><div class="eyebrow">ONE REAL WORLD. SIX PERSPECTIVES.</div><h2>${t('Explore from where you stand.','从自己的现实位置出发。')}</h2></div><div class="subject-grid">${subjects.map(s=>`<a class="subject" href="/subjects/${s[0].toLowerCase()}/"><h3>${t(s[0],s[1])} ↗</h3><p>${t(s[2],s[3])}</p></a>`).join('')}</div><div class="links">${a('/world/','World','世界')}${a('/knowledge/ask/','Ask about knowledge','知识提问')}${a('/academy/','Academy','学院')}</div><p class="status-note">${t('Examples illustrate questions, not recommendations or predictions.','示例展示如何提问，并非建议或预测。')}</p></div></section><section class="section compact-end" id="research-status"><div class="wrap"><details class="fold" style="border:0;margin:0;padding:0"><summary>${t('Research & validation boundaries','研究与验证边界')}</summary><div class="master-claim">${[['Author-confirmed research','作者确认的研究','Eight original volumes as the intellectual foundation.','八册原著构成原创思想基础。'],['Proposed software mapping','拟议软件映射','Architectural relationships are proposals.','架构关系属于设计主张。'],['Local experience','本地体验','Layout and interaction tests are not scientific validation.','排版与交互测试不等同科学验证。'],['Production-verified functionality','生产验证功能','Requires independent live acceptance.','须有独立线上验收。']].map(p=>`<article><h3>${t(p[0],p[1])}</h3><p>${t(p[2],p[3])}</p></article>`).join('')}</div></details></div></section>`;
$('main').insertAdjacentHTML('beforeend','<nav class="wrap r6-local-nav" aria-label="More research"><a href="/research/why-reality-navigation/">Why Reality Navigation / 为什么研究现实导航</a><a href="/research/human-reading-systems/">Human reading systems / 传统读取方法</a><a href="/ai-disclosure">AI disclosure / AI使用说明</a></nav>');renderBooks();renderDetail();}
function renderBooks(){$('book-grid').innerHTML=data.map((d,i)=>`<article class="book ${selected===i?'active':''}"><button class="art" data-select="${i}" aria-label="${esc(t('Explore ','探索 ')+title(d))}" aria-pressed="${selected===i}"><img loading="lazy" src="${src('art',d.id)}" alt="${esc(title(d))} ${t('series identity artwork','书系艺术图')}"></button><div class="volume">VOLUME ${d.roman}</div><h3>${title(d)}</h3><p>${v(d,'question')}</p><button class="open" data-select="${i}">${t('Explore volume','探索本册')} →</button></article>`).join('');}
function renderDetail(){const d=data[selected],r=registry[selected];const tabs=[['Why it exists','为何存在'],['Research & technology','研究与技术'],['Reading & contents','阅读与目录']];const status=selected<7?t('Public English preview · publication and delivery follow original page','英文试读已开放 · 出版与交付以原页面为准'):t('Internal operating volume · not for public sale','内部运行卷 · 不对外出售');let body='';if(tab===0){body=`<div><div class="eyebrow">${t('Original reading orientation','原著阅读导向')}</div><h3>${t(r.orientation[0],r.orientation[1])}</h3><p>${t(r.orientation[2],r.orientation[3])||v(d,'overview')}</p><h3 style="margin-top:22px">${t('The gap this volume addresses','这一册补足的问题')}</h3><p>${pair(d.why)}</p></div><aside><h3>${t('Example in reality','现实问题示例')}</h3><p>${v(d,'example')}</p><h3 style="margin-top:20px">${t('Technology connection','技术连接')}</h3><p>${v(d,'tech')}</p></aside>`}else if(tab===1){body=`<div><div class="eyebrow">${t('Research foundation','原著研究基础')}</div><h3>${v(d,'foundation')}</h3><p>${v(d,'overview')}</p><div class="research-note"><h3>${v(d,'tech')}</h3><p>${pair(d.why)}</p></div></div><aside><h3>${t('Relevant perspectives','相关主体视角')}</h3><p>${subjects.filter(s=>d.subjects.includes(s[0])).map(s=>t(s[0],s[1])).join(' · ')}</p><h3 style="margin-top:20px">${t('Illustrative application','应用示例')}</h3><p>${pair(d.case)}</p><p class="small">${t('Editorial mapping, not a verified runtime result.','研究导读映射，并非已验证的运行结果。')}</p></aside>`}else{body=`<div><div class="eyebrow">${t('Canonical publication structure','正式出版架构')}</div><div class="part"><b>Part 0</b><span>${t('PHI OS Core Language · shared across the series','PHI OS 核心语言 · 八册共用')}</span></div>${r.parts.map(p=>`<div class="part"><b>Part ${p[0]}</b><span>${t(p[1],p[2])}</span></div>`).join('')}<div class="stats"><div><strong>${lang==='en'&&selected<7?30:r.preview}</strong><span>${lang==='en'?'English free preview pages':'原中文登记试读页'}</span></div><div><strong>${r.figures}</strong><span>${t('Registered figure objects','登记总结图')}</span></div>${[4,5].includes(selected)?`<div><strong>${selected===4?42:28}</strong><span>${t('Published readings listed','原页列出文章')}</span></div>`:''}</div><p>${status}</p><div class="links">${a(r.route,'Original volume page','原著完整页面',true)}${a(r.route+'#r42-summary-figures','Summary figures','总结图')}${selected<6?a([4,5].includes(selected)?r.route+'#static-published-book-'+d.id:r.route+'#structured-sources','Published readings and sources','已发布阅读与来源'):''}${[4,5].includes(selected)?a(r.route+'#static-manuscript-book-'+d.id,'Manuscript structure','完整书稿结构'):''}${selected===4?a(r.route+'#atlas','Civilization Atlas','文明图谱'):''}${selected===5?a('/world?view=reconfiguration','Reconfiguration Atlas','文明重组图谱'):''}${selected===7?a(registry[2].route,'Book III','第三册')+a(registry[3].route,'Book IV','第四册')+a(registry[6].route,'Book VII','第七册'):''}</div><p class="small" style="margin-top:13px">${t('Counts come from the repository registry, not a fresh live availability audit. The original pages retain their access boundaries, reading and purchase logic.','数量来自仓库登记表，并非本轮生产在线可用性核验；原有权限、阅读与购买逻辑仍由原页面负责。')}</p></div><aside><h3>${t('Registered summary figure','已登记总结图')} · ${r.figureId}</h3><a target="_blank" rel="noopener" href="${lang==='zh'?r.figureZh:r.figureEn}"><img loading="lazy" class="figure-sample" src="${lang==='zh'?r.figureZh:r.figureEn}" alt="${title(d)} · ${r.figureId}"></a><p class="small" style="margin-top:10px">${t('Original registered image; network required. Language rendition and editorial approval follow the source catalogue.','原登记图，需要联网；语言版本及编辑审核以原目录为准。')}</p></aside>`};$('volume-detail').innerHTML=`<div class="detail-banner"><img src="${src('hero',d.id)}" alt="${title(d)} ${t('original banner','原著横幅')}"></div><div class="detail-head"><div><div class="eyebrow">VOLUME ${d.roman} / ORIGINAL RESEARCH</div><h2 id="detail-title" tabindex="-1">${title(d)}</h2><p>${pair(r.subtitle)}</p><p class="why">${v(d,'question')}</p><p class="small" style="margin-top:13px">${status}</p><div class="links">${a(r.route,'Original volume page','进入原著页面',true)}${selected<7?a(r.route+'?locale=en&preview=en#free-samples','Read Free Preview · English · 30 pages','免费阅读英文前30页'):''}</div></div><figure class="hardcover"><img src="${src('hard',d.id)}" alt="${title(d)} ${t('hardcover artwork','立体书模')}"><figcaption>${t('Individual hardcover presentation','单册立体书模')}</figcaption></figure></div><div class="detail-content"><div class="tabs" role="tablist">${tabs.map((x,i)=>`<button role="tab" id="tab-${i}" aria-selected="${i===tab}" aria-controls="panel" data-tab="${i}" tabindex="${i===tab?0:-1}">${pair(x)}</button>`).join('')}</div><div class="panel" id="panel" role="tabpanel" aria-labelledby="tab-${tab}">${body}</div></div><div class="booknav"><button data-select="${selected-1}" ${selected===0?'disabled':''}>← ${selected?title(data[selected-1]):t('Previous','上一册')}</button><button data-select="${selected+1}" ${selected===7?'disabled':''}>${selected<7?title(data[selected+1]):t('Next','下一册')} →</button></div>`;}
function selectBook(i){if(i<0||i>7)return;selected=i;tab=0;renderBooks();renderDetail();$('detail-title').focus({preventScroll:true});$('volume-detail').scrollIntoView({block:'start'});}
$('zoom-close').onclick=()=>$('zoom').close();document.addEventListener('click',e=>{const info=e.target.closest('[data-insight]');if(info){showInsight(info.dataset.insight,Number(info.dataset.index));return}if(e.target.closest('[data-zoom]')){$('zoom-image').src=AS.positioning;$('zoom').showModal();return}const b=e.target.closest('button[data-select]');if(b){selectBook(Number(b.dataset.select));return}const q=e.target.closest('button[data-tab]');if(q){tab=Number(q.dataset.tab);renderDetail();$('tab-'+tab).focus({preventScroll:true})}});document.addEventListener('keydown',e=>{if(!e.target.matches('[role=tab]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();tab=e.key==='Home'?0:e.key==='End'?2:(tab+(e.key==='ArrowRight'?1:2))%3;renderDetail();$('tab-'+tab).focus({preventScroll:true})});window.addEventListener('phios:localechange',e=>{const next=e.detail.locale==='zh-Hans'?'zh':'en';if(next!==lang){lang=next;render()}});render();
