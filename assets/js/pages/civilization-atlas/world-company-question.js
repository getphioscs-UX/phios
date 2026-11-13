// Presentation mapping onto existing admitted company metric IDs; no calculations.
const metricQueries=[
 ['livePrice',/(?:实时|實時|今天|今日|当前|當前)(?:的)?(?:股价|股價|行情)|\b(?:live|current|today(?:['’]s)?)\s+(?:(?:live|stock|share)\s+)*price\b/i],
 ['totalAssets',/总资产|總資產|\btotal assets\b/i],['totalLiabilities',/总负债|總負債|\btotal liabilities\b/i],
 ['equity',/股东权益|股東權益|\bequity\b/i],['marketCap',/市值|\bmarket cap(?:italization)?\b/i],
 ['grossMargin',/毛利率|\bgross margin\b/i],['operatingMargin',/营业利润率|營業利潤率|\boperating margin\b/i],
 ['profitMargin',/净利率|淨利率|\b(?:net )?profit margin\b/i],['netProfit',/净利润|淨利潤|\bnet profit\b(?!\s+margin)/i],
 ['revenueGrowthQoQ',/环比收入增长|環比收入增長|\brevenue growth\s+(?:qoq|quarter)/i],
 ['revenueGrowth',/同比收入增长|同比收入增長|\brevenue growth\s+(?:yoy|year)/i],
 ['revenue',/营业额|營業額|营业收入|營業收入|\brevenue\b(?!\s+growth)/i],
 ['ttmEps',/过去十二个月每股收益|過去十二個月每股收益|\bttm eps\b/i],['eps',/每股收益|\beps\b/i],
 ['pe',/市盈率|\bp\/?e\b/i],['pb',/市净率|市淨率|\bp\/?b\b/i],['roe',/股本回报率|股本回報率|\broe\b/i],
 ['roa',/资产回报率|資產回報率|\broa\b/i],['operatingCashFlow',/经营现金流|經營現金流|\boperating cash flow\b/i],
 ['freeCashFlow',/自由现金流|自由現金流|\bfree cash flow\b/i],['cash',/现金余额|現金餘額|\bcash balance\b/i],
 ['debtToEquity',/借款.{0,3}权益|借款.{0,3}權益|\bdebt.to.equity\b/i],['netDebt',/净债务|淨債務|\bnet debt\b/i],
 ['debt',/借款|\bborrowings\b/i],['currentRatio',/流动比率|流動比率|\bcurrent ratio\b/i],
 ['dividendsPaid',/已付股息|\bdividends paid\b/i],['dividendYield',/股息率|\bdividend yield\b/i]
];
export function companyQuestionEvidence(ctx,projection){
 const company=projection?.company;
 const ids=metricQueries.filter(([,pattern])=>pattern.test(ctx.originalQuestion)).map(([id])=>id).filter(id=>id!=='eps'||!metricQueries.find(([k])=>k==='ttmEps')[1].test(ctx.originalQuestion));
 const identityMatched=!!company&&!!ctx.requestedCompany&&company.symbol===ctx.requestedCompany;
 const metrics=identityMatched?ids.map(id=>{
  const metric=company.metrics?.[id],period=ctx.requestedPeriod;
  const year=Number(metric?.period?.end?.slice(0,4)),periodMatched=period?.start==null||year>=period.start&&year<=period.end;
  const known=metric?.state==='KNOWN'&&Number.isFinite(metric.value)&&periodMatched;
  return {id,known,value:known?metric.value:null,unit:metric?.unit||null,period:metric?.period||null,sourceRefs:metric?.sourceRefs||[],limitations:metric?.limitations||[],reason:!periodMatched?'REQUESTED_PERIOD_NOT_AVAILABLE':metric?.reason||'REQUIRED_INPUT_UNKNOWN'};
 }):[];
 return {identityMatched,metrics,source:identityMatched?company.source:null,answerState:metrics.some(m=>m.known)?'MATCHED_PARTIAL':'NO_MATCHING_SOURCE'};
}

export const companyMetricLabels={livePrice:['实时股价','Live share price'],marketCap:['市值','Market cap'],totalAssets:['总资产','Total assets'],totalLiabilities:['总负债','Total liabilities'],equity:['权益','Equity'],revenue:['收入','Revenue'],netProfit:['净利润','Net profit'],eps:['每股收益','EPS'],pe:['市盈率','PE'],pb:['市净率','PB'],roe:['股本回报率','ROE'],revenueGrowth:['同比收入增长','Revenue growth YoY'],profitMargin:['净利润率','Net profit margin'],grossMargin:['毛利率','Gross margin'],operatingMargin:['营业利润率','Operating margin'],revenueGrowthQoQ:['环比收入增长','Revenue growth QoQ'],cash:['现金','Cash'],debt:['借款','Borrowings'],netDebt:['净债务（负值为净现金）','Net debt (negative means net cash)'],debtToEquity:['借款／权益','Borrowings / equity'],currentRatio:['流动比率','Current ratio'],ttmEps:['过去十二个月每股收益','TTM EPS'],roa:['资产回报率','ROA'],operatingCashFlow:['经营现金流','Operating cash flow'],freeCashFlow:['自由现金流','Free cash flow'],dividendsPaid:['已付股息','Dividends paid'],dividendYield:['过去十二个月股息率','Trailing dividend yield']};
export function companyMetricLabel(id,locale='en'){return companyMetricLabels[id]?.[locale==='zh-Hans'?0:1]||(locale==='zh-Hans'?'来源指标':'Source metric');}
