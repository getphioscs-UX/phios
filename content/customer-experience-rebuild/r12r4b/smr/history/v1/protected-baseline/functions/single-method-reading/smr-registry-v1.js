const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

export const SMR_VERSIONS=freeze({
  contract:'PHI-OS-SINGLE-METHOD-READING-CONTRACT-v1.0.0',
  ir:'PHI-OS-SINGLE-METHOD-READING-IR-v1.0.0',
  priority:'PHI-OS-SMR-METHOD-PRIORITY-REGISTRY-v1.0.0',
  themes:'PHI-OS-SMR-THEME-CLUSTERING-v1.0.0',
  sections:'PHI-OS-SINGLE-METHOD-READING-SECTION-REGISTRY-v1.0.0',
  composition:'PHI-OS-SMR-COMPOSITION-RULESET-v1.0.0'
});

export const SMR_SUPPORTED_METHODS=freeze(['AST','BZR','NUM','ZWR']);

export const SMR_METHOD_PRIORITY_REGISTRY=freeze({
  schemaVersion:SMR_VERSIONS.priority,
  common:{primary:40,secondary:18,supportRelation:7,tensionRelation:9,activationRelation:8,dependencyRelation:4,sharedProjectionRef:3,repeatedSemanticTag:2,customerIntentMatch:5,authorisedTiming:4},
  methods:{
    AST:{SUN:20,MOON:20,ASC:22,MC:18,CHART_RULER:18,ANGULAR:12,ASPECT:8,HOUSE:6},
    BZR:{DAY:22,DAY_MASTER:22,MONTH:20,MONTH_COMMAND:20,SEASON:15,ROOT:12,TEN_GOD:10,COMBINATION:9,CLASH:9},
    ZWR:{LIFE:22,LIFE_PALACE:22,BODY:20,BODY_PALACE:20,TRANSFORMATION:15,TRIAD:12,OPPOSITE:10,PALACE:7,STAR:6},
    NUM:{LIFE_PATH:22,PRIMARY:18,MASTER_NUMBER:14,BIRTHDAY_NUMBER:12,ATTITUDE_NUMBER:10,REPETITION:9,ABSENCE:8,COMPOUND:7,CYCLE:6}
  },
  boundary:{randomSort:false,rawProjectionMeaning:false,rendererPriority:false}
});

export const SMR_DOMAIN_REGISTRY=freeze({
  schemaVersion:'PHI-OS-SMR-DOMAIN-REGISTRY-v1.0.0',
  order:['CORE_STRUCTURE','IDENTITY_EXPRESSION','REGULATION_PRESSURE','COMMUNICATION_EXCHANGE','RELATIONSHIP_EXCHANGE','WORK_RESOURCES','ENVIRONMENT_DIRECTION','ACTION_RHYTHM'],
  labels:{
    CORE_STRUCTURE:{en:'Core structure',zh:'核心结构'},
    IDENTITY_EXPRESSION:{en:'Identity & expression',zh:'身份与表达'},
    REGULATION_PRESSURE:{en:'Pressure & response',zh:'压力与调节'},
    COMMUNICATION_EXCHANGE:{en:'Mind & communication',zh:'思考与沟通'},
    RELATIONSHIP_EXCHANGE:{en:'Relationship & exchange',zh:'关系与交换'},
    WORK_RESOURCES:{en:'Work & resources',zh:'工作与资源'},
    ENVIRONMENT_DIRECTION:{en:'Environment & direction',zh:'环境与方向'},
    ACTION_RHYTHM:{en:'Action & rhythm',zh:'行动与节律'}
  },
  methodTokens:{
    AST:{
      IDENTITY_EXPRESSION:['SUN','ASC','HOUSE_1','HOUSE_5'],REGULATION_PRESSURE:['MOON','SATURN','HOUSE_6','HOUSE_8','HOUSE_12','TENSION'],COMMUNICATION_EXCHANGE:['MERCURY','HOUSE_3'],RELATIONSHIP_EXCHANGE:['VENUS','HOUSE_7','RELATION'],WORK_RESOURCES:['MC','HOUSE_2','HOUSE_6','HOUSE_10','JUPITER'],ENVIRONMENT_DIRECTION:['HOUSE_4','HOUSE_9','HOUSE_11','NORTH_NODE'],ACTION_RHYTHM:['MARS','ACTIVATION']
    },
    BZR:{
      IDENTITY_EXPRESSION:['DAY','DAY_MASTER'],REGULATION_PRESSURE:['CLASH','TENSION','CONSUMPTION'],COMMUNICATION_EXCHANGE:['OUTPUT','EXPRESSION'],RELATIONSHIP_EXCHANGE:['YEAR','RELATION','COMBINATION'],WORK_RESOURCES:['MONTH','MONTH_COMMAND','RESOURCE','WEALTH','OFFICER'],ENVIRONMENT_DIRECTION:['SEASON','YEAR'],ACTION_RHYTHM:['HOUR','ACTION','EXECUTION']
    },
    ZWR:{
      IDENTITY_EXPRESSION:['LIFE','BODY','IDENTITY'],REGULATION_PRESSURE:['HEALTH','FORTUNE','TENSION','PRESSURE'],COMMUNICATION_EXCHANGE:['COMMUNICATION','SIBLING'],RELATIONSHIP_EXCHANGE:['SPOUSE','RELATION','NETWORK'],WORK_RESOURCES:['CAREER','WEALTH','PROPERTY','WORK'],ENVIRONMENT_DIRECTION:['TRAVEL','MIGRATION','PARENTS','ENVIRONMENT'],ACTION_RHYTHM:['TRANSFORMATION','ACTIVATION']
    },
    NUM:{
      IDENTITY_EXPRESSION:['LIFE_PATH','BIRTHDAY_NUMBER'],REGULATION_PRESSURE:['ABSENCE','TENSION'],COMMUNICATION_EXCHANGE:['ATTITUDE_NUMBER','EXPRESSION'],RELATIONSHIP_EXCHANGE:['RELATION','HEART'],WORK_RESOURCES:['BIRTH_YEAR_NUMBER','RESOURCE','WORK'],ENVIRONMENT_DIRECTION:['LIFE_PATH','CYCLE'],ACTION_RHYTHM:['ATTITUDE_NUMBER','BIRTH_MONTH_NUMBER','TRANSITION']
    }
  }
});

const commonSections=[
  ['CORE_READING','CORE_STRUCTURE'],['CORE_THEMES','CORE_STRUCTURE'],['NATURAL_OPERATION','IDENTITY_EXPRESSION'],['SUPPORT_CONDITIONS','CORE_STRUCTURE'],['COST_PRESSURE','REGULATION_PRESSURE'],['DECISION_DIRECTION','ENVIRONMENT_DIRECTION'],['WORK_RESOURCES','WORK_RESOURCES'],['RELATIONSHIP_EXCHANGE','RELATIONSHIP_EXCHANGE'],['ENVIRONMENT_PRESSURE','REGULATION_PRESSURE'],['TIMING','ACTION_RHYTHM'],['REALITY_VERIFICATION','CORE_STRUCTURE'],['OPEN_UNCERTAINTY','CORE_STRUCTURE'],['FINAL_READING','CORE_STRUCTURE']
];

export const SMR_SECTION_REGISTRY=freeze({
  schemaVersion:SMR_VERSIONS.sections,
  sections:commonSections.map(([sectionId,primaryDomain],index)=>({sectionId,order:index+1,primaryDomain,optional:['TIMING','WORK_RESOURCES','RELATIONSHIP_EXCHANGE','ENVIRONMENT_PRESSURE'].includes(sectionId)})),
  labels:{
    AST:{CORE_READING:['Astrology core structure','占星核心结构'],CORE_THEMES:['Key chart themes','星盘重点主题'],NATURAL_OPERATION:['Identity & expression','身份与表达'],SUPPORT_CONDITIONS:['Supportive configurations','支持这张结构的条件'],COST_PRESSURE:['Pressure & friction','压力与摩擦'],DECISION_DIRECTION:['Environment & direction','环境与方向'],WORK_RESOURCES:['Work & contribution','工作与贡献'],RELATIONSHIP_EXCHANGE:['Relationship & exchange','关系与交换'],ENVIRONMENT_PRESSURE:['Emotional regulation','情绪与内部调节'],TIMING:['Timing','时间层'],REALITY_VERIFICATION:['Reality questions','现实验证'],OPEN_UNCERTAINTY:['What remains open','仍然不能确定什么'],FINAL_READING:['Final reading','最终读取']},
    BZR:{CORE_READING:['BaZi core structure','八字核心结构'],CORE_THEMES:['Structural themes','整体运行主题'],NATURAL_OPERATION:['Day reference in context','日主与整体环境'],SUPPORT_CONDITIONS:['Strongest support','主要支持'],COST_PRESSURE:['Consumption & pressure','主要消耗与压力'],DECISION_DIRECTION:['Action & execution','行动与执行'],WORK_RESOURCES:['Work & roles','工作与角色'],RELATIONSHIP_EXCHANGE:['Relationship structure','关系结构'],ENVIRONMENT_PRESSURE:['Month command & season','月令与季节背景'],TIMING:['Authorised cycles','时间层'],REALITY_VERIFICATION:['Reality questions','现实验证'],OPEN_UNCERTAINTY:['What remains open','仍然不能确定什么'],FINAL_READING:['Final reading','最终读取']},
    ZWR:{CORE_READING:['Zi Wei core structure','紫微核心结构'],CORE_THEMES:['Palace-network themes','宫位网络主题'],NATURAL_OPERATION:['Life & Body palaces','命宫与身宫'],SUPPORT_CONDITIONS:['Strongest palace support','最强宫位支持'],COST_PRESSURE:['Internal pressure','内部压力'],DECISION_DIRECTION:['Change path','现实变化路径'],WORK_RESOURCES:['Work & resources','工作与资源'],RELATIONSHIP_EXCHANGE:['Relationship & collaboration','关系与协作'],ENVIRONMENT_PRESSURE:['External environment & movement','外部环境与迁移'],TIMING:['Current stage','当前阶段'],REALITY_VERIFICATION:['Reality questions','现实验证'],OPEN_UNCERTAINTY:['What remains open','仍然不能确定什么'],FINAL_READING:['Final reading','最终读取']},
    NUM:{CORE_READING:['Numerology core structure','数字结构核心'],CORE_THEMES:['Primary operating themes','主要运行模式'],NATURAL_OPERATION:['Expression & action','表达与行动'],SUPPORT_CONDITIONS:['Repeated emphasis','重复强化的位置'],COST_PRESSURE:['Less-emphasised positions','较少强调的位置'],DECISION_DIRECTION:['Direction','方向'],WORK_RESOURCES:['Work & resources','工作与资源'],RELATIONSHIP_EXCHANGE:['Relationships','关系'],ENVIRONMENT_PRESSURE:['Context & pressure','情境与压力'],TIMING:['Authorised cycle','周期'],REALITY_VERIFICATION:['Reality questions','现实验证'],OPEN_UNCERTAINTY:['What remains open','仍然不能确定什么'],FINAL_READING:['Final reading','最终读取']}
  },
  eligibilityStates:['AVAILABLE','NOT_ESTABLISHED','NOT_APPLICABLE'],
  boundary:{emptySectionFiller:false,technicalFirst:false,timingRequiresAuthority:true}
});

export function localized(value,locale){return Array.isArray(value)?value[locale==='zh-Hans'?1:0]:value?.[locale==='zh-Hans'?'zh':'en']||value?.en||String(value||'')}

