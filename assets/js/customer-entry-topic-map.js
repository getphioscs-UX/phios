import {worldQuestionTarget} from './pages/civilization-atlas/world-journey-state-r3.js';
// Discovery mapping only; public source and destination owners retain authority.
export const CUSTOMER_TOPICS=[
  {
    "id": "relationships",
    "name": {
      "zh-Hans": "感情与关系",
      "en": "Love & relationships"
    },
    "pattern": "爱情|恋爱|感情|伴侣|沟通|关系|\\b(?:love|relationships?|partner|communication)\\b",
    "query": {
      "zh-Hans": "关系中的沟通与共同生活",
      "en": "Communication and shared life"
    },
    "source": "READING:BOOK-1:expression-media-influence-and-drift",
    "choices": [
      {
        "label": {
          "zh-Hans": "为什么沟通会影响关系？",
          "en": "How does communication shape a relationship?"
        },
        "href": "/world/?reading=BOOK-1%3Aexpression-media-influence-and-drift",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "怎样理解长期关系与家庭？",
          "en": "How do long-term relationships and families work?"
        },
        "href": "/world/?reading=BOOK-2%3Along-term-relationships-parenting-and-intergenerational-runtime",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "想主动选择个人探索方法？",
          "en": "Would you like to choose a personal perspective?"
        },
        "href": "/perspectives/personal/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "表达如何进入关系：能力、媒介、影响与偏离",
      "en": "How Expression Enters Relationship: Capacity, Media, Influence, and Drift"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B1-P5-041",
        "version": "1.0.0",
        "sha256": "7aa7642cdd73d14887aafbbfe7b564e1ebe1bcff76d32b7fcc2b324f43704115"
      },
      "en": {
        "nodeId": "KN-B1-P5-041",
        "version": "1.0.0",
        "sha256": "2549747219fbbbca6a3cc3f45a792e09077b5a37558d222965cda0d3ba5cf9b6"
      }
    }
  },
  {
    "id": "work",
    "name": {
      "zh-Hans": "工作与方向",
      "en": "Work & direction"
    },
    "pattern": "工作|职业|职场|\\b(?:work|career|job|employment)\\b",
    "source": "READING:BOOK-1:from-foundational-questions-to-capabilities-and-runtime-drives",
    "choices": [
      {
        "label": {
          "zh-Hans": "职业方向与能力：先阅读",
          "en": "Direction and capabilities: start reading"
        },
        "href": "/world/?reading=BOOK-1%3Afrom-foundational-questions-to-capabilities-and-runtime-drives",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "职场压力：整理现实处境",
          "en": "Workplace pressure: organize your situation"
        },
        "href": "/reality/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "工作与收入：查看财务准备工具",
          "en": "Work and income: explore financial preparation"
        },
        "href": "/professional/financial/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "从问题到能力：现实如何组织需求、资源与行动驱动力",
      "en": "From Foundational Questions to Capabilities: How Reality Organizes Need, Resources, and Runtime Drive"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B1-P3-006",
        "version": "1.0.0",
        "sha256": "df44d13fc2691e59fa227e0888ec9bf4f5c704e368f59f97efe87c63381522c4"
      },
      "en": {
        "nodeId": "KN-B1-P3-006",
        "version": "1.0.0",
        "sha256": "5e77f7865531ed8168843344822142e5efe4cf66b24732f80d79e0beb4222682"
      }
    }
  },
  {
    "id": "money",
    "name": {
      "zh-Hans": "金钱与生活",
      "en": "Money & everyday life"
    },
    "pattern": "钱|金钱|预算|收支|收入|现金流|\\b(?:money|budget|income|cash flow|expenses?)\\b|make ends meet",
    "source": "READING:BOOK-2:culture-economic-runtime-value-storage-credit",
    "choices": [
      {
        "label": {
          "zh-Hans": "理解价值、交换与信用",
          "en": "Understand value, exchange and credit"
        },
        "href": "/world/?reading=BOOK-2%3Aculture-economic-runtime-value-storage-credit",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "整理收入、支出与准备资料",
          "en": "Organize income, expenses and preparation"
        },
        "href": "/professional/financial/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "需要财务方面的专业支持？",
          "en": "Looking for professional financial support?"
        },
        "href": "/professional/#services",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "文化如何进入经济现实：模因、共同实践、价值储存与信用如何连接",
      "en": "How Culture Becomes Economic Reality: Memes, Shared Practice, Value Storage, and Credit"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B2-P7-013",
        "version": "1.0.0",
        "sha256": "df39d50a98437c786fa2c32b558b34fefb6ad3f0e33ea64671f32fd0b385b094"
      },
      "en": {
        "nodeId": "KN-B2-P7-013",
        "version": "1.0.0",
        "sha256": "9d8c9c4a95a36dab463734c0903049ee781a09387a87227de9239568fd4aa5e7"
      }
    }
  },
  {
    "id": "family",
    "name": {
      "zh-Hans": "家庭与成长",
      "en": "Family & growth"
    },
    "pattern": "家庭|养育|孩子|父母|成长|\\b(?:family|parenting|children|parents|growing up)\\b",
    "source": "READING:BOOK-2:long-term-relationships-parenting-and-intergenerational-runtime",
    "choices": [
      {
        "label": {
          "zh-Hans": "家庭与养育怎样相互影响？",
          "en": "How do family life and parenting connect?"
        },
        "href": "/world/?reading=BOOK-2%3Along-term-relationships-parenting-and-intergenerational-runtime",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "阅读不同个人视角",
          "en": "Explore different personal perspectives"
        },
        "href": "/perspectives/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "需要真人支持？",
          "en": "Would professional support help?"
        },
        "href": "/professional/#services",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "长期关系如何成为跨世代运行：养育、儿童与家庭复制",
      "en": "How Long-Term Relationships Become Intergenerational Runtime: Parenting, Children, and Family Replication"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B2-P6-026",
        "version": "1.0.0",
        "sha256": "282fab8f9bd67a0f6cff064803930d7c53ab6d37645d12298ab37121df5205f3"
      },
      "en": {
        "nodeId": "KN-B2-P6-026",
        "version": "1.0.0",
        "sha256": "20138c4160c2fa5cb2c081a949b91097550ce49146c61d59c02e936579358d94"
      }
    }
  },
  {
    "id": "self",
    "name": {
      "zh-Hans": "认识自己",
      "en": "Understand yourself"
    },
    "pattern": "认识自己|了解自己|我是谁|个人画像|\\b(?:understand myself|know myself|who am i|self understanding)\\b",
    "source": "READING:BOOK-1:from-foundational-questions-to-capabilities-and-runtime-drives",
    "choices": [
      {
        "label": {
          "zh-Hans": "认识需求、资源与能力",
          "en": "Read about needs, resources and capabilities"
        },
        "href": "/world/?reading=BOOK-1%3Afrom-foundational-questions-to-capabilities-and-runtime-drives",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "个人画像：整理自陈与已有评估",
          "en": "Profile: organize self-report and existing assessments"
        },
        "href": "/perspectives/profile/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "PHI 构型：阅读独立模型与输入说明",
          "en": "PHI Configuration: explore the model and its inputs"
        },
        "href": "/perspectives/phi-configuration/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "从问题到能力：现实如何组织需求、资源与行动驱动力",
      "en": "From Foundational Questions to Capabilities: How Reality Organizes Need, Resources, and Runtime Drive"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B1-P3-006",
        "version": "1.0.0",
        "sha256": "df44d13fc2691e59fa227e0888ec9bf4f5c704e368f59f97efe87c63381522c4"
      },
      "en": {
        "nodeId": "KN-B1-P3-006",
        "version": "1.0.0",
        "sha256": "5e77f7865531ed8168843344822142e5efe4cf66b24732f80d79e0beb4222682"
      }
    }
  },
  {
    "id": "world",
    "name": {
      "zh-Hans": "世界正在发生什么",
      "en": "Understand the world"
    },
    "pattern": "马来西亚|经济|世界|地区|人口|政策|能源|\\b(?:malaysia|economy|world|region|population|policy|energy)\\b",
    "source": "READING:BOOK-6:book6-internet-supply-chains-global-cities",
    "choices": [
      {
        "label": {
          "zh-Hans": "选择地区，查看事实与来源年份",
          "en": "Choose a region; check facts and observation dates"
        },
        "href": "/world/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "理解网络、城市与经济联系",
          "en": "Read about networks, cities and economic connections"
        },
        "href": "/world/?worldJourney=connections",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "搜索更多公开知识",
          "en": "Search more published knowledge"
        },
        "href": "/knowledge/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "互联网、供应链与全球城市网络",
      "en": "The Internet, Global Supply Chains and Global City Networks"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "ART-B6-P13-019",
        "version": "1.0.0",
        "sha256": "6f9864f068ac23033d3f566966084b085e5da70aac3be5f9f286dcd2fab3206a"
      },
      "en": {
        "nodeId": "ART-B6-P13-019",
        "version": "1.0.0",
        "sha256": "e1e4d8771c361cc3d9495a8852665c54d3fb00aea3658854afcf230386a22555"
      }
    }
  }
];
export function topicRoute(question,locale='en',selected=null){
 const wt=worldQuestionTarget(question,{selected:selected==='world'});if(wt){const lang=locale==='zh-Hans'?'zh-Hans':'en',zh=lang==='zh-Hans',generic=wt.journey==='landing',title=zh?'世界探索':'World exploration';const targetURL=new URL(wt.href,'https://getphios.com');targetURL.searchParams.set('locale',lang);const href=targetURL.pathname+targetURL.search+targetURL.hash;return {outcome:generic?'TOPIC_PATHWAYS':'MATCHED_CAPABILITY',worldPresentation:wt.journey,topicIds:['world'],selectedTopic:'world',candidates:[],href,primaryAction:{href,label:zh?'开始探索世界':'Start exploring World'},clarification:zh?'按你明确选择的公开主题进入对应工作区；没有生成或保存个人资料。':'Open the workspace for your explicit public topic. No personal information has been generated or saved.',navigationActions:[{href:'/world/?worldJourney=now&locale='+lang,label:zh?'选择地区，查看事实与来源年份':'Choose a region; check facts and dates'},{href:'/world/?worldJourney=connections&locale='+lang,label:zh?'理解网络、城市与经济联系':'Explore networks, cities and economic connections'},{href:'/knowledge/?locale='+lang,label:zh?'搜索更多公开知识':'Search more published knowledge'}],providerCalls:0,generationMode:'DETERMINISTIC',boundaries:{automaticPersistence:false,methodChosenByClientRouter:false}};}

 const zh=locale==='zh-Hans',q=String(question||'').normalize('NFKC').trim().replace(/(?:不要|不想|不需要|别推荐|不是问|don't want|do not want|not asking about|not interested in)\s*[^，,。.;；!?！？]*(?=[，,。.;；!?！？]|$)/ig,'');
 if(!q)return null;const matches=CUSTOMER_TOPICS.filter(t=>selected?t.id===selected:new RegExp(t.pattern,'i').test(q));if(!matches.length)return null;
 const t=matches[0],choices=matches.length>1&&!selected?matches.map(t=>({label:t.name[locale],labels:t.name,topicId:t.id})):t.choices.map(c=>({href:c.href,label:c.label[locale],labels:c.label}));
 if(matches.length===1&&t.id==='world'&&/马来西亚|malaysia/i.test(q))choices[0].href='/world/?locale='+locale+'#v=2&region=MYS&topic=economy';
 return {outcome:'TOPIC_PATHWAYS',candidates:[],topicIds:matches.map(t=>t.id),selectedTopic:t.id,clarification:matches.length>1&&!selected?(zh?'你提到了几个方面，想先探索哪一个？':'You mentioned several areas. Which would you like to explore first?'):(zh?'先选一个方向。这里提供相关阅读和入口，不会分析你的个人状况。':'Choose a direction. These are related readings and entrances, not an assessment of your situation.'),navigationActions:choices,sourceTitle:t.sourceTitle[locale],providerCalls:0,providerInvoked:false,generationMode:'DETERMINISTIC',href:choices[0].href||'/knowledge/',boundaries:{methodChosenByClientRouter:false,automaticPersistence:false}};
}

// Offline shortcut only for exact topic labels/short names. Free questions must use the existing server safety owner.
export function localTopicRoute(question,locale,selected){const q=String(question||'').normalize('NFKC').trim().toLowerCase(),aliases={relationships:['爱情','感情','关系','恋爱','love','relationships'],work:['工作','职业','职场','work','career','job'],money:['钱不够用','金钱','预算','money','not enough money','money is tight'],family:['家庭','养育','family','parenting'],self:['认识自己','了解自己','understand myself'],world:['马来西亚经济','世界','malaysian economy','malaysia economy','world']};const match=CUSTOMER_TOPICS.find(t=>q===t.name[locale]?.toLowerCase()||(aliases[t.id]||[]).includes(q));return match?topicRoute(question,locale,selected||match.id):null;}
