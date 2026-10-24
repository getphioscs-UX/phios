// Local-validation successor over existing CWA, World Compare and source handoff owners.
// A caller must validate pinned raw bytes before supplying rows; no production data import.
import {normalizeCurrentSourceCandidate,admitCurrentSource,createCurrentEvidence} from '../current-web-authority/current-web-authority-runtime.js';
import {compareWorldObjects} from '../../assets/js/pages/civilization-atlas/world-r42-contract.js';
import {projectKnowledgeGroundingForHandoff} from './knowledge-reality-handoff.js';
import thresholdContract from '../../content/civilization-atlas/reconfiguration/runtime-position-w6-contract-v1.json';
const need=(v,code)=>{if(!v)throw Object.assign(new Error(code),{code});};
const fieldInfo={index:['CPI_INDEX','index_2010_100','INDEX_LEVEL'],inflation_yoy:['CPI_YOY','percent','CHANGE_FROM_SAME_MONTH_PREVIOUS_YEAR'],inflation_mom:['CPI_MOM','percent','CHANGE_FROM_PREVIOUS_MONTH']};
export function admitLocalMeasurementDataset(dataset,{actualSha256,metadataSha256,now=new Date().toISOString()}={}){
 need(dataset.admissionScope==='LOCAL_VALIDATION_ONLY'&&dataset.productionEligible===false,'LOCAL_SCOPE_REQUIRED');
 need(actualSha256===dataset.sourceVersion&&metadataSha256===dataset.metadataSha256,'SOURCE_BYTES_OR_METADATA_CHANGED');
 need(dataset.license==='CC_BY_4_0'&&Object.values(dataset.verification||{}).length>=5&&Object.values(dataset.verification).every(v=>v===true),'DATASET_VERIFICATION_REQUIRED');
 need(dataset.sourceUrl===`https://storage.dosm.gov.my/cpi/${dataset.datasetId}.csv`&&dataset.metadataUrl.startsWith('https://open.dosm.gov.my/data-catalogue/'),'EXACT_OFFICIAL_DATASET_REQUIRED');
 const candidate=normalizeCurrentSourceCandidate({url:dataset.sourceUrl,publisher:dataset.publisher,title:dataset.datasetId,publishedAt:dataset.publishedAt,retrievedAt:dataset.retrievedAt});
 const admission=admitCurrentSource({candidate,domain:'GENERAL_CURRENT',authorityClass:'OFFICIAL_PRIMARY',claimType:'GENERAL_CURRENT_FACT',sourceId:'DOSM:'+dataset.datasetId,sourceVersionOrDigest:dataset.sourceVersion,now});
 need(admission.admissionState==='ADMITTED','LOCAL_CWA_ADMISSION_FAILED');
 return {...admission,usageScope:'LOCAL_VALIDATION_ONLY',productionEligible:false};
}
export function measurementFromRow(row,dataset,admission,verifiedRawRow){
 need(admission?.admissionState==='ADMITTED'&&admission.usageScope==='LOCAL_VALIDATION_ONLY'&&admission.source.sourceVersionOrDigest===dataset.sourceVersion,'LOCAL_ADMISSION_REQUIRED');
 need(row.datasetId===dataset.datasetId&&fieldInfo[row.field]&&Number.isInteger(row.rowNumber)&&row.rowNumber>=2,'ROW_IDENTITY_INVALID');
 need(verifiedRawRow&&JSON.stringify(verifiedRawRow)===JSON.stringify(row.sourceRow),'EXACT_RAW_ROW_REQUIRED');
 need(/^20\d{2}-(0[1-9]|1[0-2])$/.test(row.period)&&row.sourceRow.date===row.period+'-01'&&row.sourceRow.division===row.division&&(row.sourceRow.state||'Malaysia')===row.geo,'ROW_SCOPE_MISMATCH');
 const sourceValue=row.sourceRow[row.field]===''?null:Number(row.sourceRow[row.field]);need((sourceValue===null||Number.isFinite(sourceValue))&&sourceValue===row.value,'ROW_VALUE_MISMATCH');
 need(row.field!=='index'||row.value===null||row.value>0,'CPI_INDEX_MUST_BE_POSITIVE');
 const [metricId,unit,denominator]=fieldInfo[row.field];
 const observationId=`DOSM:${dataset.sourceVersion.slice(0,16)}:${row.geo}:${row.period}:${row.division}:${row.field}`;
 const jurisdiction={Malaysia:'MY',Johor:'MY-01',Selangor:'MY-10'}[row.geo];need(jurisdiction,'GEOGRAPHY_CROSSWALK_REQUIRED');
 const evidence=createCurrentEvidence({claimId:'EVIDENCE:'+observationId,claimText:`${row.geo} ${row.period} ${row.division} ${row.field}=${row.value}`,claimType:'GENERAL_CURRENT_FACT',admission,jurisdiction});
 return {type:'MEASUREMENT_OBSERVATION',observationId,admittedEvidenceId:evidence.claimId,evidence,sourceId:evidence.sourceId,sourceVersion:dataset.sourceVersion,metricId,division:row.division,value:row.value,unit,geographyId:row.geo==='Malaysia'?'MYS':'DOSM_STATE:'+row.geo,geographyName:row.geo,geographicLevel:dataset.geographicLevel,observationPeriod:row.period,frequency:dataset.frequency,publishedAt:dataset.publishedAt,retrievedAt:dataset.retrievedAt,datasetUpdatedAt:dataset.datasetUpdatedAt,definition:metricId+':'+denominator,statisticalMethod:dataset.statisticalMethod,denominator,population:dataset.population,coverage:'DOSM_'+dataset.geographicLevel+'_CPI_BASKET',baseYear:dataset.baseYear,sourceUrl:dataset.sourceUrl,metadataUrl:dataset.metadataUrl,sourceSnapshotReference:`${dataset.sourceVersion}#csv-row=${row.rowNumber}&field=${row.field}`,sourceRow:row.sourceRow,transformationVersion:'WORLD-R4-MEASUREMENT-ROW-v1',qualityFlags:row.value===null?['MISSING_VALUE']:['PINNED_VINTAGE','ROW_REVISION_STATUS_NOT_STATED'],admissionStatus:'LOCAL_CWA_ADMITTED',verificationStatus:'RAW_BYTES_COLUMNS_ROW_SCOPE_METADATA_LICENSE_CHECKED',productionEligible:false};
}
const objectForCompare=o=>({id:o.observationId,type:o.type,indicatorId:o.metricId+':'+o.division,unit:o.unit,methodology:o.statisticalMethod,spatialLevel:o.geographicLevel,priceBasis:o.baseYear,source:o.sourceId,time:{start:o.observationPeriod,end:o.observationPeriod},comparisonBasis:[o.metricId,o.division,o.statisticalMethod,o.baseYear,o.frequency,o.denominator,o.coverage].join('|')});
export function compareMeasurements(a,b){
 if(!a||!b)return {state:'NOT_COMPARABLE',reasons:['OBSERVATION_MISSING'],difference:null};
 const reasons=[];for(const [k,reason]of [['definition','DEFINITION_DIFFERS'],['division','DIVISION_DIFFERS'],['unit','UNIT_DIFFERS'],['statisticalMethod','METHOD_DIFFERS'],['baseYear','BASE_DIFFERS'],['frequency','FREQUENCY_DIFFERS'],['denominator','DENOMINATOR_DIFFERS'],['observationPeriod','PERIOD_DIFFERS']])if(a[k]!==b[k])reasons.push(reason);
 if(a.value==null||b.value==null)reasons.push('MISSING_VALUE_NOT_ZERO');
 if(a.admissionStatus!=='LOCAL_CWA_ADMITTED'||b.admissionStatus!=='LOCAL_CWA_ADMITTED')reasons.push('ADMISSION_REQUIRED');
 if(a.sourceId===b.sourceId&&a.sourceVersion!==b.sourceVersion)reasons.push('MIXED_REVISION_VINTAGES');
 if(reasons.length)return {state:'NOT_COMPARABLE',reasons,difference:null};
 if(a.geographicLevel!==b.geographicLevel||a.coverage!==b.coverage)return {state:'CONTEXT_ONLY',reasons:['DIFFERENT_GEOGRAPHIC_OR_POPULATION_SCOPE'],difference:null};
 if(a.geographyId!==b.geographyId&&a.metricId==='CPI_INDEX')return {state:'CONTEXT_ONLY',reasons:['INDEX_BASE_IS_NOT_CROSS_AREA_PRICE_LEVEL'],difference:null};
 const existing=compareWorldObjects(objectForCompare(a),objectForCompare(b));
 if(existing.state!=='COMPARABLE')return {...existing,state:existing.state==='PARTIALLY_COMPARABLE'?'CONTEXT_ONLY':'NOT_COMPARABLE',difference:null};
 return {state:'COMPARABLE',reasons:[],difference:a.value-b.value,differenceUnit:a.unit==='percent'?'percentage_points':a.unit,leftRef:a.observationId,rightRef:b.observationId,limits:['Different local baskets: inflation-rate comparison is not a cost-of-living rank or household outcome.']};
}
const monthNumber=p=>Number(p.slice(0,4))*12+Number(p.slice(5))-1;
const compatibleSeries=(a,b)=>['geographyId','metricId','division','unit','statisticalMethod','baseYear','frequency','denominator','sourceVersion'].every(k=>a[k]===b[k]);
export function indexChange(rows,currentPeriod,mode){
 need(['YoY','MoM','TWO_POINT_CHANGE'].includes(mode),'CHANGE_MODE_INVALID');const sorted=[...rows].sort((a,b)=>a.observationPeriod.localeCompare(b.observationPeriod)),end=sorted.find(r=>r.observationPeriod===currentPeriod);
 const earlier=mode==='TWO_POINT_CHANGE'?sorted[0]:sorted.find(r=>monthNumber(r.observationPeriod)===monthNumber(currentPeriod)-(mode==='YoY'?12:1));
 if(!end||!earlier||end.value==null||earlier.value==null||!compatibleSeries(earlier,end)||end.metricId!=='CPI_INDEX'||earlier.value<=0||monthNumber(earlier.observationPeriod)>=monthNumber(end.observationPeriod))return {state:'INSUFFICIENT_SERIES',mode,reason:'EXACT_BASE_PERIOD_OR_MATCHING_DEFINITION_MISSING',value:null};
 return {state:mode==='TWO_POINT_CHANGE'?'TWO_POINT_CHANGE':mode,mode,value:(end.value/earlier.value-1)*100,unit:'percent_change_in_index',firstRef:earlier.observationId,lastRef:end.observationId,periods:[earlier.observationPeriod,end.observationPeriod],formula:'(current CPI / base CPI - 1) × 100',notLongTermTrend:mode==='TWO_POINT_CHANGE'};
}
export function describeObservationTrend(rows,{minimumMonths=12}={}){
 const sorted=[...rows].sort((a,b)=>a.observationPeriod.localeCompare(b.observationPeriod));const reasons=[];
 if(sorted.length<minimumMonths)reasons.push('INSUFFICIENT_SERIES');
 for(let i=0;i<sorted.length;i++){const x=sorted[i];if(x.value==null)reasons.push('MISSING_VALUE');if(x.frequency!=='MONTHLY')reasons.push('NON_MONTHLY_SERIES');if(i){if(monthNumber(x.observationPeriod)-monthNumber(sorted[i-1].observationPeriod)!==1)reasons.push('MISSING_OR_DUPLICATE_PERIOD');if(!compatibleSeries(sorted[0],x))reasons.push('METHOD_UNIT_BASE_SCOPE_OR_VINTAGE_CHANGED');}}
 if(reasons.length)return {state:'INSUFFICIENT_SERIES',reasons:[...new Set(reasons)],points:[],noInterpolation:true};
 return {state:'TIME_SERIES_TREND',scope:'DESCRIPTIVE_OBSERVED_SEQUENCE_NOT_FORECAST',periods:[sorted[0].observationPeriod,sorted.at(-1).observationPeriod],count:sorted.length,first:sorted[0].value,last:sorted.at(-1).value,change:sorted.at(-1).value-sorted[0].value,unit:sorted[0].unit==='percent'?'percentage_points':sorted[0].unit,points:sorted.map(x=>({period:x.observationPeriod,value:x.value,observationId:x.observationId})),qualityFlags:[...(sorted.some(x=>Math.abs(x.value)>30&&x.metricId!=='CPI_INDEX')?['ANOMALY_REVIEW_THRESHOLD_30_PERCENT']:[]),'REVISION_STATUS_NOT_STATED_NO_VINTAGE_INFERENCE'],noInterpolation:true};
}
export function boundedMeasurementReadout(observations,{geo='Malaysia',period='latest',division='overall'}={}){
 const group=observations.filter(o=>o.geographyName===geo&&o.division===division);const latest=[...new Set(group.map(o=>o.observationPeriod))].sort().at(-1),selected=period==='latest'?latest:period;const rows=group.filter(o=>o.observationPeriod===selected);
 return {schemaVersion:'WORLD-R4-BOUNDED-READOUT-v1',geography:geo,topic:'CONSUMER_PRICES',requestedPeriod:period,observationPeriod:selected||null,timeWindow:rows.map(o=>({indicator:o.metricId,period:o.observationPeriod,updatedAt:o.datasetUpdatedAt,retrievedAt:o.retrievedAt})),state:rows.length?'BOUNDED_OBSERVED':'MISSING_PERIOD',observedIndicators:rows,evidenceStatus:'LOCAL_VALIDATION_ONLY',freshness:'LATEST_IN_PINNED_RETRIEVED_DATASET_NOT_REALTIME',missingEvidence:['HOUSEHOLD_EXPENDITURE_WEIGHTS','CURRENT_HOUSEHOLD_INCOME','LOCAL_RENT_OR_PERSONAL_BILLS','CAUSAL_CONTRIBUTION_WEIGHTS'],interpretiveBoundary:'CPI describes a representative price basket. It does not establish an individual budget, regional affordability rank or whole-world state.',dossierFoundation:{href:'/books/book-6/',scope:'ACCEPTED_SUBSYSTEM_POSITIONS_ARE_NOT_THIS_MALAYSIA_CURRENT_MEASUREMENT'},productionEligible:false};
}
export function measurementAskHandoff(readout,{question,locale='en'}={}){
 const rows=readout.observedIndicators;const detail=[...(readout.categoryObservations||[])].filter(o=>o.value!=null&&o.value>0).sort((a,b)=>b.value-a.value).slice(0,3);const used=[...rows,...detail];const bundleId='WORLD-R4:'+readout.geography+':'+readout.observationPeriod;
 const grounding=projectKnowledgeGroundingForHandoff({bundleId,sources:used.map(o=>({sourceId:o.sourceId,sourceType:'ADMITTED_LOCAL_MEASUREMENT',href:o.sourceUrl})),unknowns:readout.missingEvidence.map(code=>({code}))});
 const zh=locale==='zh-Hans',yoy=rows.find(o=>o.metricId==='CPI_YOY'),mom=rows.find(o=>o.metricId==='CPI_MOM');
 const answer=rows.length?(zh?`${readout.geography} ${readout.observationPeriod} 的消费价格同比变化为 ${yoy?.value??'未取得'}%，环比为 ${mom?.value??'未取得'}%。这是代表性消费篮子的价格变化，不是个人账单。解释生活成本压力还需要收入、支出权重与实际账单；不能只凭同比率判断生活是否更便宜。`:`For ${readout.geography} in ${readout.observationPeriod}, reported consumer-price change was ${yoy?.value??'unavailable'}% year on year and ${mom?.value??'unavailable'}% month on month. This describes a representative basket, not personal bills. Income, spending weights and actual bills are still needed to explain household cost pressure; the inflation rate alone does not establish affordability.`):(zh?'指定范围没有观测值，不能用其他地区或月份兜底。':'No observation is available for this scope; another area or month is not substituted.');
 const categoryText=detail.length?(zh?` 本次可见涨幅较高的类别包括${detail.map(o=>`${o.labelZh||o.division}（${o.value}%）`).join('、')}；这是各类涨幅，不是对总通胀的贡献分解，也不能据此认定主要成因。`:` Categories with higher observed increases include ${detail.map(o=>`${o.labelEn||o.division} (${o.value}%)`).join(', ')}. These are category rates, not contributions to total inflation or established causes.`):'';
 const structuralEvidenceCandidate={owner:'runtime-position-w6-contract-v1',state:'EVIDENCE_CANDIDATE_ONLY',sourceRefs:rows.map(o=>({observationId:o.observationId,sourceVersion:o.sourceVersion,supportLocation:o.sourceSnapshotReference,knowledgeState:'CURRENT_DATA',admissionScope:'LOCAL_VALIDATION_ONLY'})),grammarCandidates:[],domainCandidates:[],positionCandidates:[],humanPositionAdmission:'NOT_REQUESTED',thresholdState:'NOT_EVALUATED',criteria:thresholdContract.observationThresholdCriteria.map(c=>({id:c.id,state:'UNKNOWN',evidenceRefs:[],reason:'Price-series persistence does not establish persistent structural relation change, cross-system breadth, feedback change or irreversibility.'})),possibilityProjection:'NOT_EVALUATED',missing:['EMPLOYMENT_AND_INCOME','HOUSEHOLD_EXPENDITURE','FISCAL_ENERGY_AND_INSTITUTIONAL_RELATIONS','DATED_CROSS_SYSTEM_CHANGE_AND_COUNTEREVIDENCE']};
 const structuralBoundary=zh?' 单一价格序列不足以证明社会重组、运行位置变化或观察阈值跨越；还需要就业与收入、实际消费，以及财政、能源、制度等跨系统关系变化的证据。':' A price series alone does not establish societal reconfiguration, a runtime-position change or a crossed observation threshold. Employment, income, actual spending and dated changes in fiscal, energy and institutional relationships are still needed.';
 return {question,locale,answer:answer+categoryText+structuralBoundary,answerState:rows.length?'PARTIAL_OBSERVED_PRICES_ONLY':'INSUFFICIENT_EVIDENCE',grounding,observations:used,structuralEvidenceCandidate,scope:{geography:readout.geography,period:readout.observationPeriod},missingEvidence:readout.missingEvidence,backHref:'/world/?r4Geo='+encodeURIComponent(readout.geography)+'&r4Period='+encodeURIComponent(readout.observationPeriod||'')+'&locale='+locale,sourceLanguage:'en/ms',providerCalls:0,membershipAsk:'NOT_VERIFIED_BY_THIS_WORK'};
}
