import filings from '../../content/world/company-filings-r1.json';
import {analyzeWorldCompany,companySymbol} from '../_lib/world-company-analysis.js';
import {compareWorldObjects} from '../../assets/js/pages/civilization-atlas/world-r42-contract.js';
// Bounded public symbols and declared numeric scenarios only. No free-text/private query.
export function retrievePublicCompany(input,{now=new Date().toISOString()}={}){
 if(Object.keys(input).some(k=>!['operation','symbol','compare','pe'].includes(k))||input.operation!=='company')throw Error('PUBLIC_COMPANY_QUERY_INVALID');
 const symbol=companySymbol(input.symbol),comparison=input.compare?companySymbol(input.compare):null;
 if(input.pe!==undefined&&!/^\d{1,3}(?:\.\d{1,2})?(?:,\d{1,3}(?:\.\d{1,2})?){0,4}$/.test(input.pe))throw Error('SCENARIO_ASSUMPTIONS_INVALID');
 const peMultiples=input.pe?input.pe.split(',').map(Number):[];
 const resolve=s=>analyzeWorldCompany(filings.companies.find(x=>x.symbol===s)||{symbol:s,currency:'MYR'},{now,peMultiples});
 const company=resolve(symbol),other=comparison?resolve(comparison):null;
 const object=c=>({id:c.symbol,type:'COMPANY_FINANCIAL_'+c.period.kind,unit:c.currency,source:c.source.id,time:{start:c.period.start,end:c.period.end},comparisonBasis:c.period.kind,indicatorId:c.period.kind});
 const comparability=other?compareWorldObjects(object(company),object(other)):null;
 return {company,comparison:other?{company:other,state:comparability.state==='COMPARABLE'?'COMPARABLE_PERIOD':'INCOMPARABLE_OR_MISSING_PERIOD',ownerResult:comparability,rankingProduced:false}:null,providerState:'NO_LIVE_PROVIDER_CALLED',storageWrites:0,feeUSD:0};
}
