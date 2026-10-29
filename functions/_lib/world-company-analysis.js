// Deterministic extension of World / Current Facts. No model or provider calls.
import {evaluateCurrentness} from '../current-web-authority/current-web-authority-runtime.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const unknown=(unit,reason)=>({value:null,unit,state:'UNKNOWN',reason});
const metric=(value,unit,formula,sourceRefs)=>finite(value)?{value,unit,state:'KNOWN',formula,sourceRefs}:unknown(unit,'REQUIRED_INPUT_UNKNOWN');
export function companySymbol(value){if(typeof value!=='string'||!/^MYX:\d{4}$/.test(value))throw Error('PUBLIC_COMPANY_SYMBOL_INVALID');return value;}
export function analyzeWorldCompany(packet,{now=new Date().toISOString(),peMultiples=[]}={}){
 const symbol=companySymbol(packet.symbol);if(!Array.isArray(peMultiples)||peMultiples.length>5||peMultiples.some(x=>!finite(x)||x<=0||x>200))throw Error('SCENARIO_ASSUMPTIONS_INVALID');
 const f=packet.filing||{},refs=packet.sourceId?[packet.sourceId]:[],unit=packet.currency;
 const validCurrency=/^[A-Z]{3}$/.test(unit||''),validFiling=validCurrency&&f.scale>0&&finite(f.scale)&&/^\d{4}-\d{2}-\d{2}$/.test(f.periodEnd||'')&&refs.length&&/^https:\/\//.test(packet.sourceUrl||'');
 const money=k=>validFiling&&finite(f[k])?f[k]*f.scale:null;
 const annualReady=validFiling&&['ANNUAL','TTM'].includes(f.annualOrTtmBasis)&&f.annualOrTtmPeriodEnd===f.periodEnd;
 const revenue=money('revenue'),profit=money('netProfit'),annualProfit=annualReady?money('annualOrTtmNetProfit'):null,averageEquity=annualReady&&f.averageEquityPeriodMatched===true?money('averageEquity'):null;
 let quoteState='PROVIDER_GAP',price=null;const q=packet.quote;
 if(q){quoteState='RIGHTS_OR_IDENTITY_NOT_VERIFIED';if(q.redistributionAllowed===true&&q.symbol===symbol&&q.currency===unit&&q.sourceId&&q.priceType==='LAST_TRADED'&&finite(q.price)&&q.price>=0&&q.retrievedAt===q.asOf){try{const fresh=evaluateCurrentness({claimType:'STOCK_OR_MARKET_PRICE',retrievedAt:q.asOf,now});quoteState=fresh.freshnessState;if(quoteState==='FRESH')price=q.price;}catch{quoteState='INVALID_QUOTE_TIME';}}}
 const out={revenue:metric(revenue,unit,'reported revenue × statement scale',refs),netProfit:metric(profit,unit,'reported profit × statement scale',refs),totalAssets:metric(money('totalAssets'),unit,'reported assets × statement scale',refs),totalLiabilities:metric(money('totalLiabilities'),unit,'reported liabilities × statement scale',refs),equity:metric(money('equity'),unit,'reported equity × statement scale',refs),eps:metric(validFiling&&finite(f.reportedEps)&&['SEN','MYR'].includes(f.epsUnit)?f.reportedEps/(f.epsUnit==='SEN'?100:1):null,unit+'/share','reported EPS; sen ÷ 100 for MYR',refs)};
 const priorRevenue=money('priorRevenue');out.revenueGrowth=metric(f.comparison==='SAME_QUARTER_PRIOR_YEAR'&&priorRevenue>0&&revenue!==null?(revenue-priorRevenue)/priorRevenue*100:null,'percent','(revenue − comparable prior revenue) / prior revenue × 100',refs);
 out.profitMargin=metric(revenue>0&&profit!==null?profit/revenue*100:null,'percent','net profit / revenue × 100',refs);
 out.marketCap=metric(price!==null&&validFiling&&finite(f.sharesOutstanding)&&f.sharesOutstanding>0&&f.sharesAsOf===q?.asOf?.slice(0,10)?price*f.sharesOutstanding:null,unit,'fresh price × dated current shares outstanding',[...refs,...(q?.sourceId?[q.sourceId]:[])]);
 out.pe=metric(price!==null&&annualReady&&f.annualOrTtmEps>0?price/f.annualOrTtmEps:null,'multiple','fresh price / annual or TTM EPS',refs);
 out.pb=metric(price!==null&&validFiling&&f.netAssetsPerShare>0?price/f.netAssetsPerShare:null,'multiple','fresh price / dated net assets per share (dates remain explicit)',refs);
 out.roe=metric(annualProfit!==null&&averageEquity>0?annualProfit/averageEquity*100:null,'percent','annual or TTM net profit / matching average equity × 100',refs);
 const scenarios=peMultiples.map(pe=>({assumption:{peMultiple:pe,basis:'USER_DECLARED_NOT_FORECAST'},price:metric(annualReady&&f.annualOrTtmEps>0?f.annualOrTtmEps*pe:null,unit+'/share','annual or TTM EPS × declared PE assumption',refs)}));
 return {symbol,name:packet.name||symbol,currency:unit||null,state:validFiling?'PARTIAL_DATED_FILING':'SOURCE_GAP',metrics:out,period:{start:f.periodStart||null,end:f.periodEnd||null,kind:f.periodKind||null,comparison:f.comparison||null,audited:f.audited===true},source:{id:packet.sourceId||null,url:packet.sourceUrl||null,publishedAt:packet.publishedAt||null,checkedAt:packet.checkedAt||null,authority:packet.sourceAuthority||null},freshness:{filing:'HISTORICAL_AS_FILED_NOT_VERIFIED_LATEST',quote:quoteState,computedAt:now},scenarios,limits:[...(packet.limits||[]),'NO_QUARTERLY_ANNUALISATION','NO_PRICE_TARGET_OR_INVESTMENT_RECOMMENDATION'],providerCalls:0,modelCalls:0,personalFactsCreated:false};
}
