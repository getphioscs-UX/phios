// Candidate intake for the existing World filing owner. No fetch, storage or AI.
import {normalizeCurrentSourceCandidate,admitCurrentSource,createCurrentEvidence} from '../current-web-authority/current-web-authority-runtime.js';
export const FILING_STAGES=Object.freeze(['DISCOVERED','RETRIEVED_IF_AUTHORIZED','PARSED','VERIFIED','CWA_ADMITTED','CUSTOMER_ELIGIBLE']);
const modes=new Set(['MANUAL_VERIFIED','OFFICIAL_NOTIFICATION','APPROVED_AUTOMATED_FETCH','LICENSED_API']);
const amounts=Object.freeze({Revenue:'revenue','Prior revenue':'priorRevenue','Previous quarter revenue':'previousQuarterRevenue','Gross profit':'grossProfit','Operating profit':'operatingProfit','Profit before tax':'profitBeforeTax','Net profit':'netProfit','Profit attributable to owners':'profitAttributableToOwners','Total assets':'totalAssets','Total liabilities':'totalLiabilities',Equity:'equity',Cash:'cash',Borrowings:'borrowings','Current assets':'currentAssets','Current liabilities':'currentLiabilities','Operating cash flow':'operatingCashFlow',Capex:'capex','Dividends paid':'dividendsPaid','Average assets':'averageAssets','Average equity':'averageEquity'});
const factors=Object.freeze({RM:1,MYR:1,"MYR'000":1000,MYR_THOUSANDS:1000,MYR_MILLION:1000000});
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const day=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const error=code=>{throw Error(code);};
export async function filingDigest(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function parseReportedAmount(raw,unit){
 const original=String(raw).trim();if(/^(?:unknown|n\/a|—|-)$/i.test(original))return {raw:original,rawUnit:unit,value:null,unit:unit==='SEN'?'MYR/share':'MYR',state:'UNKNOWN'};
 if(!/^(?:-?\d+(?:,\d{3})*(?:\.\d+)?|\(\d+(?:,\d{3})*(?:\.\d+)?\))$/.test(original))error('FILING_AMOUNT_SYNTAX');
 if(original.includes('.')&&original.replace(/[^0-9]/g,'').replace(/^0+/,'').length>15)error('FILING_UNIT_OR_PRECISION_INVALID');
 const n=Number(original.replaceAll(',','').replace(/^\((.*)\)$/,'-$1')),factor=unit==='SEN'?.01:unit==='MYR_PER_SHARE'||unit==='SHARES'?1:factors[unit];
 if(!finite(n)||!finite(factor)||Math.abs(n*factor)>Number.MAX_SAFE_INTEGER)error('FILING_UNIT_OR_PRECISION_INVALID');
 if(unit==='SHARES'&&(!Number.isSafeInteger(n)||n<0))error('FILING_SHARES_INVALID');
 return {raw:original,rawUnit:unit,value:n*factor,unit:unit==='SHARES'?'shares':unit==='SEN'||unit==='MYR_PER_SHARE'?'MYR/share':'MYR',state:'KNOWN'};
}
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
function reviewBinding(record){const omit=new Set(['stage','history','reviewHash','reviewBinding','rightsDecisionId','retrievedAt','verification','admission','evidence','publicationState','publicationDecisionId']);return JSON.stringify(stable(Object.fromEntries(Object.entries(record).filter(([k])=>!omit.has(k)))));}
function next(record,stage,delta={}){if(FILING_STAGES.indexOf(stage)!==FILING_STAGES.indexOf(record.stage)+1)error('FILING_STAGE_SKIP');return {...record,...delta,stage,history:[...record.history,stage]};}
function rightsFor(record,rights){if(!rights?.decisionId||rights.sourceId!==record.sourceId||rights.sourceUrl!==record.sourceUrl)error('FILING_RIGHTS_IDENTITY_REQUIRED');return rights;}
export function discoverWorldFiling(input){
 const allowed=new Set(['mode','sourceClass','sourceId','sourceUrl','issuerId','instrumentId','publisher','title','currency','fiscalYear','quarter','periodStart','periodEnd','periodKind','statementBasis','shareClass','accountingStandards','sourceVersion','publishedAt','audited','comparison','capexConvention','previousQuarter','segmentBasis','averageAssetsPeriodMatched','averageEquityPeriodMatched','annualOrTtmPeriodStart']);if(Object.keys(input).some(k=>!allowed.has(k)))error('FILING_UNSUPPORTED_OR_PRIVATE_FIELD');
 if(!modes.has(input.mode)||!['ISSUER_OFFICIAL','REGULATORY_PUBLIC','LICENSED_PROVIDER'].includes(input.sourceClass))error('FILING_SOURCE_OR_MODE_INVALID');
 const url=new URL(input.sourceUrl);if([...url.searchParams.keys()].some(k=>/token|api[-_]?key|authorization|secret|signature/i.test(k)))error('FILING_SOURCE_URL_CREDENTIAL_DENIED');if(url.protocol!=='https:'||url.username||url.password||url.hash||!input.sourceId||!input.issuerId||!/^MYX:\d{4}$/.test(input.instrumentId||''))error('FILING_IDENTITY_INVALID');
 if(input.currency!=='MYR'||!['QUARTER','YTD','ANNUAL','TTM'].includes(input.periodKind)||!day(input.periodStart)||!day(input.periodEnd)||input.periodStart>input.periodEnd)error('FILING_PERIOD_OR_CURRENCY_INVALID');
 const duration=(Date.parse(input.periodEnd)-Date.parse(input.periodStart))/86400000+1;if(['ANNUAL','TTM'].includes(input.periodKind)&&(duration<351||duration>380))error('FILING_FULL_YEAR_BASIS_REQUIRED');if(input.periodKind==='QUARTER'&&(duration<60||duration>120))error('FILING_INDEPENDENT_QUARTER_BASIS_REQUIRED');
 if(!['CONSOLIDATED','COMPANY','UNKNOWN'].includes(input.statementBasis)||!input.shareClass||!input.accountingStandards||!Number.isInteger(input.fiscalYear)||!day(input.publishedAt)||!input.sourceVersion)error('FILING_BASIS_REQUIRED');
 if(input.periodKind==='QUARTER'&&(!Number.isInteger(input.quarter)||input.quarter<1||input.quarter>4))error('FILING_QUARTER_REQUIRED');
 if(input.comparison==='SAME_QUARTER_PRIOR_YEAR'&&input.periodKind!=='QUARTER')error('FILING_COMPARISON_BASIS_INVALID');
 if(!['boolean','undefined'].includes(typeof input.audited))error('FILING_AUDIT_STATUS_INVALID');
 return {...structuredClone(input),stage:'DISCOVERED',history:['DISCOVERED'],contentHash:null,fields:null,publicationState:'WITHHELD',isLatestVerified:false};
}
export async function retrieveWorldFiling(record,text,{rights,retrievedAt}={}){
 if(record.stage!=='DISCOVERED')error('FILING_STAGE_SKIP');rightsFor(record,rights);
 if(!Number.isFinite(Date.parse(retrievedAt)))error('FILING_RETRIEVAL_TIME_REQUIRED');
 if(record.mode==='MANUAL_VERIFIED'?rights.manualProcessingAllowed!==true:record.mode!=='OFFICIAL_NOTIFICATION'&&rights.automatedRetrievalAllowed!==true)error('FILING_RETRIEVAL_RIGHTS_PENDING');
 if(record.mode==='OFFICIAL_NOTIFICATION'&&rights.notificationPayloadAllowed!==true)error('NOTIFICATION_IS_NOT_LINK_FETCH_PERMISSION');
 if(record.mode==='LICENSED_API'&&rights.licenseStatus!=='VERIFIED')error('FILING_LICENSE_REQUIRED');
 if(typeof text!=='string'||new TextEncoder().encode(text).length>262144)error('FILING_TEXT_SIZE_INVALID');
 return next(record,'RETRIEVED_IF_AUTHORIZED',{contentHash:await filingDigest(text),retrievedAt,rightsDecisionId:rights.decisionId});
}
export async function parseWorldFiling(record,text){
 if(record.stage!=='RETRIEVED_IF_AUTHORIZED'||await filingDigest(text)!==record.contentHash)error('FILING_DOCUMENT_HASH_MISMATCH');
 const fields={};let line=0;
 for(const sourceLine of text.split(/\r?\n/)){line++;const match=/^([^\[\]\n]+) \[([^\]]+)\]: (.+)$/.exec(sourceLine.trim());if(!match)continue;const label=match[1],segment=label.startsWith('Segment revenue - ')?label.slice(18).trim():null,key=(segment?'segment:'+segment:null)||amounts[label]||(label==='EPS'?'reportedEps':label==='Outstanding shares'?'sharesOutstanding':label==='Net assets per share'?'netAssetsPerShare':null);if(!key)continue;if(fields[key])error('FILING_DUPLICATE_FIELD');
  const unit=match[2];if(key==='reportedEps'||key==='netAssetsPerShare'){if(!['SEN','MYR_PER_SHARE'].includes(unit))error('FILING_PER_SHARE_UNIT_INVALID');}else if(key==='sharesOutstanding'){if(unit!=='SHARES')error('FILING_SHARES_UNIT_REQUIRED');}else if(factors[unit]===undefined)error('FILING_MONEY_UNIT_REQUIRED');
  fields[key]={...parseReportedAmount(match[3],unit),locator:'line '+line,sourceId:record.sourceId,...(segment?{segmentName:segment}:{})};
 }
 if(!Object.keys(fields).length)error('FILING_NO_SUPPORTED_FIELDS');
 const parsed=next(record,'PARSED',{fields,missingFields:[...Object.values(amounts),'reportedEps','sharesOutstanding','netAssetsPerShare'].filter(k=>!fields[k]||fields[k].value===null)});const binding=reviewBinding(parsed);return {...parsed,reviewBinding:binding,reviewHash:await filingDigest(binding)};
}
export function verifyWorldFiling(record,decision){
 if(record.stage!=='PARSED'||record.reviewBinding!==reviewBinding(record)||decision?.reviewHash!==record.reviewHash||decision?.approved!==true||!decision.id||!decision.reviewer||decision.contentHash!==record.contentHash)error('FILING_EXPLICIT_VERIFICATION_REQUIRED');
 const known=Object.keys(record.fields).filter(k=>record.fields[k].value!==null).sort();if(JSON.stringify([...new Set(decision.verifiedFields||[])].sort())!==JSON.stringify(known))error('FILING_FIELD_VERIFICATION_INCOMPLETE');
 return next(record,'VERIFIED',{verification:{id:decision.id,reviewer:decision.reviewer,contentHash:decision.contentHash,verifiedFields:known}});
}
export function admitWorldFiling(record,{now}={}){
 if(record.stage!=='VERIFIED')error('FILING_STAGE_SKIP');if(record.reviewBinding!==reviewBinding(record))error('FILING_REVIEW_BINDING_CHANGED');
 const candidate=normalizeCurrentSourceCandidate({url:record.sourceUrl,publisher:record.publisher,title:record.title||record.sourceId,publishedAt:record.publishedAt,retrievedAt:record.retrievedAt});
 const admission=admitCurrentSource({candidate,domain:'FINANCIAL_MARKETS',authorityClass:record.sourceClass==='ISSUER_OFFICIAL'?'OFFICIAL_COMPANY':record.sourceClass==='REGULATORY_PUBLIC'?'REGULATOR':'MARKET_DATA_PROVIDER',claimType:'GENERAL_CURRENT_FACT',now,sourceId:record.sourceId,sourceVersionOrDigest:record.contentHash});
 if(admission.admissionState!=='ADMITTED')error('FILING_CWA_'+admission.admissionState);
 const evidence=createCurrentEvidence({claimId:record.sourceId+':'+record.contentHash,claimText:`${record.issuerId}: dated filing for ${record.periodStart} through ${record.periodEnd}; verified fields ${record.verification.verifiedFields.join(', ')}. Not a latest-report or live-price claim.`,claimType:'GENERAL_CURRENT_FACT',admission,jurisdiction:'MY'});
 return next(record,'CWA_ADMITTED',{admission,evidence});
}
export function makeFilingCustomerEligible(record,{rights,publicationDecision,environment}={}){
 if(record.stage!=='CWA_ADMITTED')error('FILING_STAGE_SKIP');if(record.reviewBinding!==reviewBinding(record))error('FILING_REVIEW_BINDING_CHANGED');rightsFor(record,rights);
 if(!['publicDisplayAllowed','redistributionAllowed','derivedUseAllowed'].every(k=>rights[k]===true))error('FILING_CUSTOMER_RIGHTS_PENDING');
 if(environment!=='LOCAL_FIXTURE'||publicationDecision?.scope!=='LOCAL_FIXTURE'||publicationDecision.approved!==true||!publicationDecision.id||publicationDecision.contentHash!==record.contentHash||publicationDecision.reviewHash!==record.reviewHash)error('FILING_PUBLICATION_NOT_AUTHORIZED');
 return next(record,'CUSTOMER_ELIGIBLE',{publicationState:'ELIGIBLE_LOCAL_FIXTURE_ONLY',publicationDecisionId:publicationDecision.id});
}
export function filingToCompanyPacket(record){
 if(!['CWA_ADMITTED','CUSTOMER_ELIGIBLE'].includes(record.stage))error('FILING_NOT_ADMITTED');if(record.reviewBinding!==reviewBinding(record))error('FILING_REVIEW_BINDING_CHANGED');const f={scale:1,statementUnit:'MYR',periodStart:record.periodStart,periodEnd:record.periodEnd,periodKind:record.periodKind,statementBasis:record.statementBasis,accountingStandards:record.accountingStandards,shareClass:record.shareClass,audited:record.audited??null,comparison:record.comparison||null,capexConvention:record.capexConvention||null,previousQuarter:record.previousQuarter||null,segmentBasis:record.segmentBasis||null,averageAssetsPeriodMatched:record.averageAssetsPeriodMatched===true,averageEquityPeriodMatched:record.averageEquityPeriodMatched===true,annualOrTtmPeriodStart:record.annualOrTtmPeriodStart||null};
 for(const k of [...Object.values(amounts),'sharesOutstanding','netAssetsPerShare'])f[k]=record.fields[k]?.value??null;
 f.businessSegments=Object.values(record.fields).filter(row=>row.segmentName).map(row=>({name:row.segmentName,revenue:row.value,sourceId:row.sourceId}));
 const eps=record.fields.reportedEps;f.reportedEps=eps?.value??null;f.epsUnit='MYR';
 if(record.periodKind==='ANNUAL'){f.annualOrTtmBasis='ANNUAL';f.annualOrTtmPeriodEnd=record.periodEnd;f.annualOrTtmEps=eps?.value??null;f.annualOrTtmNetProfit=f.netProfit;}
 return {symbol:record.instrumentId,name:record.issuerId,currency:record.currency,sourceId:record.sourceId,sourceUrl:record.sourceUrl,publishedAt:record.publishedAt,checkedAt:record.retrievedAt,sourceAuthority:record.sourceClass,filing:f,quote:null,rawFields:record.fields,intake:{stage:record.stage,contentHash:record.contentHash,rightsDecisionId:record.rightsDecisionId,environment:'LOCAL_FIXTURE'},limits:['DATED_FILING_NOT_VERIFIED_LATEST','NO_PUBLICATION_WITHOUT_SEPARATE_RELEASE_GATE']};
}
