export const FINANCE_R3_VERSION='FINANCE_PUBLICATION_R3';
export const FINANCE_R3_LAYOUT='FINANCE_EDITORIAL_A4_R3';
export const FINANCE_R3_ASSETS={cover:{objectKey:'images/reports/financial/editorial/bilingual/RPT-FINANCIAL-P01-COVER-v1.webp',localPath:'/assets/reports/financial/r3/RPT-FINANCIAL-P01-COVER-v1.webp',width:1055,height:1491,sha256:'fac87c668c178d2221026fb28ca6852620af4a1057c4aa5804e540db9ec777d4'},body:{objectKey:'images/reports/financial/editorial/bilingual/VIS-REPORT-FINANCIAL-BODY.webp',localPath:'/assets/reports/financial/r3/VIS-REPORT-FINANCIAL-BODY.webp',width:1055,height:1491,sha256:'cc04a2f25f58eb9628ef63cca2e20703aaff6493b773f5c098ca5227f7d712a1'}};
export const FINANCE_R3_THEMES={
 overview:{zh:'阅读总览',en:'REPORT GUIDE',icon:'compass',color:'#173d58'},
 analysis:{zh:'财务分析',en:'FINANCIAL ANALYSIS',icon:'chart',color:'#173d58'},
 resources:{zh:'资源规划',en:'RESOURCE PLANNING',icon:'target',color:'#176b67'},
 risk:{zh:'风险评估',en:'RISK ASSESSMENT',icon:'shield',color:'#996b24'},
 strategy:{zh:'行动路径',en:'STRATEGIC NEXT STEPS',icon:'arrow',color:'#275d62'},
 notes:{zh:'资料与方法',en:'DATA & METHOD',icon:'check',color:'#173d58'}
};
const definitions=[
 ['cover','overview','封面与阅读范围','Cover and scope',['cover-art'],['identity','scope','saved-version'],['source']],
 ['overview','overview','报告总览','Report overview',['kpi-cards','donut','comparison-bars'],['four-kpis','snapshot','four-pillars'],['CASH_FLOW','NET_WORTH']],
 ['executive','overview','重点摘要','Executive summary',['numbered-findings','snapshot-cards'],['findings','supporting-snapshot','interpretation'],['CASH_FLOW','NET_WORTH','LIQUIDITY']],
 ['income','analysis','收入与支出','Income and expenses',['grouped-bars','annualized-cashflow'],['monthly-comparison','annualized-basis','interpretation'],['CASH_FLOW']],
 ['flow','analysis','现金流结构','Cash flow structure',['stacked-bar','expense-donut'],['inflow-outflow','expense-categories','commitments','interpretation'],['CASH_FLOW','expenses']],
 ['stability','analysis','变化与稳定性','Trend and stability',['history-line-or-single-point','scenario-comparison'],['dated-observations','comparison-state','stability-note'],['source','scenarios']],
 ['allocation','resources','资产配置','Asset allocation',['allocation-donut','category-bars'],['asset-categories','asset-total','interpretation'],['NET_WORTH','assets']],
 ['reserves','resources','储蓄与流动性','Savings and liquidity',['savings-bars','coverage-meter'],['liquid-assets','outflow-basis','coverage','interpretation'],['NET_WORTH','LIQUIDITY','EMERGENCY_RESERVE']],
 ['goals','resources','目标资金安排','Goal funding plan',['funding-bars','goal-timeline'],['goals','earmarked-funds','readiness','interpretation'],['goals','assets']],
 ['liabilities','risk','负债与偿债安排','Liabilities and debt commitments',['liability-table','debt-bars','ratio-card'],['balances','payments','debt-ratios','interpretation'],['DEBT','liabilities']],
 ['shock','risk','流动性与应变能力','Liquidity and shock capacity',['coverage-meter','shortfall-bars'],['coverage','surplus-or-shortfall','scenario-boundaries','interpretation'],['LIQUIDITY','EMERGENCY_RESERVE','CASH_FLOW']],
 ['protection','risk','保障资料与风险画像','Protection and risk profile',['evidence-radar','coverage-gap-state'],['risk-dimensions','policy-records','gap-boundaries','interpretation'],['PROTECTION_NEED','DEBT','LIQUIDITY','assets']],
 ['priorities','strategy','当前优先事项','Key priorities',['icon-cards','numbered-priorities'],['priorities','why-now','interpretation'],['CASH_FLOW','unknowns','goals']],
 ['roadmap','strategy','分阶段行动路线','Action roadmap',['roadmap','dependency-arrows'],['near-term','medium-term','long-term','dependencies'],['source','unknowns','goals']],
 ['checklist','strategy','行动清单与追踪','Action checklist',['checklist','status-badges'],['actions','status','next-move','interpretation'],['source','unknowns']],
 ['notes','notes','资料、方法与边界','Data, methods and boundaries',['completeness-strip','source-index'],['completeness','annualization','assumptions','followups','sources'],['source','calculationDigest','assumptions']]
];
export const FINANCE_R3_PAID_PAGES=definitions.map(([id,theme,zh,en,chartTypes,contentBlocks,dataDependencies],i)=>({page:i+1,id,theme,title:{'zh-Hans':zh,en},chartTypes,contentBlocks,dataDependencies,visibility:['PAID'],deepeningSlots:id==='cover'||id==='notes'?[]:[`${id}.interpretation`]}));
const freeIds=['cover','overview','executive','income','allocation','protection','priorities','notes'];
const freeTitles={income:{'zh-Hans':'财务分析概览',en:'Financial analysis overview'},allocation:{'zh-Hans':'资源规划概览',en:'Resource planning overview'},protection:{'zh-Hans':'风险评估概览',en:'Risk assessment overview'},priorities:{'zh-Hans':'行动路径概览',en:'Strategic next steps overview'}};
export const FINANCE_R3_FREE_PAGES=freeIds.map((id,i)=>({...FINANCE_R3_PAID_PAGES.find(p=>p.id===id),...(freeTitles[id]?{title:freeTitles[id]}:{}),page:i+1,visibility:['FREE'],deepeningSlots:[],condensed:true}));
export function financeR3PageMap(tier){if(!['FREE','PAID'].includes(tier))throw Error('FINANCE_R3_TIER_INVALID');return structuredClone(tier==='FREE'?FINANCE_R3_FREE_PAGES:FINANCE_R3_PAID_PAGES);}
