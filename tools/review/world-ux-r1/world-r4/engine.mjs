import fs from 'node:fs';import crypto from 'node:crypto';
import {admitLocalMeasurementDataset,measurementFromRow,boundedMeasurementReadout,compareMeasurements,describeObservationTrend,indexChange} from '../../../../functions/_lib/world-measurement-observations.js';
import {answerMeasurementWorldSession} from '../../../../functions/customer-projection/ric-world-session.js';
import {getAcceptedBook6Projection} from '../../../../functions/_lib/book6-current-source.js';
import {projectKnowledgeGroundingForHandoff} from '../../../../functions/_lib/knowledge-reality-handoff.js';
import {validateObservationReference} from '../../../../functions/customer-projection/world-observation-impact.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const requireValue=(v,c)=>{if(!v)throw Object.assign(new Error(c),{code:c});};
const base='tools/review/world-ux-r1/world-r4';
export function createWorldR4Engine(){
 const endpointProbes=JSON.parse(fs.readFileSync(base+'/ENDPOINT-PROBES.json')),additionalProbes=JSON.parse(fs.readFileSync(base+'/ADDITIONAL-PROBES.json'));
 const bnm=JSON.parse(fs.readFileSync(base+'/BNM-PUBLIC-READS.json')),forecast=endpointProbes.find(r=>r.id==='met_forecast')?.sample?.[0];
 const wbBackground=[['SP.POP.TOTL',endpointProbes.find(r=>r.id==='wb_population')?.sample,'persons'],['NY.GDP.MKTP.CD',additionalProbes.find(r=>r.id==='wb_gdp')?.body,'CURRENT_USD']].flatMap(([indicator,body,unit])=>{const row=body?.[1]?.[0];return row?.indicator?.id===indicator&&row?.country?.id==='MY'?[{kind:'REGIONAL_BACKGROUND_ONLY',indicator,period:row.date,unit,value:row.value,source:'WORLD_BANK',sourceUrl:`https://api.worldbank.org/v2/country/MY/indicator/${indicator}?format=json&date=${row.date}&per_page=1`,sourceVersion:body[0].lastupdated,notConsumerPrices:true}]:[];});
 const data=JSON.parse(fs.readFileSync('.tmp/world-r4/datasets.json'));const tables=new Map(),admissions=new Map();
 const registry=JSON.parse(fs.readFileSync('content/world/successors/world-r4-local-validation/registry.json'));requireValue(registry.successorOf==='content/world/world-evidence-series-v1.json'&&registry.productionEligible===false&&JSON.stringify(registry.datasets)===JSON.stringify(data.datasets),'CANONICAL_SUCCESSOR_DATASET_BINDING_CHANGED');
 const labels=JSON.parse(fs.readFileSync('.tmp/world-r4/category-labels.json'));requireValue(hash(fs.readFileSync('.tmp/world-r4/raw/mcoicop.csv'))===labels.sha256,'CLASSIFICATION_BYTES_CHANGED');
 for(const d of data.datasets){const bytes=fs.readFileSync('.tmp/world-r4/raw/'+d.datasetId+'.csv'),metaId=new URL(d.metadataUrl).pathname.split('/').at(-1),meta=fs.readFileSync('.tmp/world-r4/raw/'+metaId+'-metadata.html');
  const admission=admitLocalMeasurementDataset(d,{actualSha256:hash(bytes),metadataSha256:hash(meta)});const lines=bytes.toString('utf8').replace(/^\uFEFF/,'').split(/\r?\n/);requireValue(lines[0].split(',').join('|')===d.columns.join('|'),'SOURCE_COLUMNS_CHANGED');requireValue(!lines.some(l=>l.includes('"')),'UNSUPPORTED_CSV_QUOTING_FAIL_CLOSED');tables.set(d.datasetId,{d,lines});admissions.set(d.datasetId,admission);
 }
 const observations=data.records.map(r=>{const{d,lines}=tables.get(r.datasetId);const values=lines[r.rowNumber-1]?.split(',');requireValue(values?.length===d.columns.length,'ROW_POSITION_MISSING');const exact=Object.fromEntries(d.columns.map((key,i)=>[key,values[i]]));return measurementFromRow(r,d,admissions.get(r.datasetId),exact);});
 requireValue(new Set(observations.map(o=>o.observationId)).size===observations.length,'DUPLICATE_OBSERVATIONS');
 const foundation=getAcceptedBook6Projection('DOSSIER-SEA');
 const select=(geo,division='overall',metric='CPI_INDEX')=>observations.filter(o=>o.geographyName===geo&&o.division===division&&o.metricId===metric);
 const readout=(geo='Malaysia',period='latest',division='overall')=>{const r=boundedMeasurementReadout(observations,{geo,period,division});return {...r,categoryObservations:observations.filter(o=>o.geographyName===geo&&o.observationPeriod===r.observationPeriod&&o.metricId==='CPI_YOY'&&o.division!=='overall').map(o=>({...o,labelEn:labels.rows.find(l=>l.division===o.division)?.desc_en,labelZh:labels.rows.find(l=>l.division===o.division)?.labelZh})),foundation:{dossier:'DOSSIER-SEA',acceptedProjectionAvailable:!!foundation,owner:'functions/_lib/book6-current-source.js',scope:'SUBSYSTEM_ONLY_NOT_MALAYSIA_CURRENT_STATE'},relatedEconomicContext:geo==='Malaysia'?wbBackground:[]};};
 function query(input){
  requireValue(Object.keys(input).every(k=>['dataset','mode','geo','other','period','division','metric','id'].includes(k)),'PUBLIC_ENUM_FIELDS_ONLY');
  const {mode='readout',geo='Malaysia',other='Selangor',period='latest',division='overall',metric='CPI_YOY'}=input;requireValue(['Malaysia','Johor','Selangor'].includes(geo)&&['Malaysia','Johor','Selangor'].includes(other),'UNMAPPED_GEOGRAPHY');requireValue(division==='overall'||/^0[1-9]$|^1[0-3]$/.test(division),'DIVISION_INVALID');requireValue(period==='latest'||/^20\d{2}-(0[1-9]|1[0-2])$/.test(period),'PERIOD_INVALID');
  if(mode==='observation'){const observation=observations.find(o=>o.observationId===input.id);requireValue(observation,'OBSERVATION_NOT_FOUND');return {observation};}
  const a=readout(geo,period,division);
  if(mode==='readout')return {readout:a};
  if(mode==='compare'){requireValue(['CPI_INDEX','CPI_YOY','CPI_MOM'].includes(metric),'METRIC_INVALID');const b=readout(other,a.observationPeriod||period,division);return {left:a,right:b,comparison:compareMeasurements(a.observedIndicators.find(o=>o.metricId===metric),b.observedIndicators.find(o=>o.metricId===metric))};}
  if(mode==='trend'){const points=select(geo,division,metric).filter(o=>o.observationPeriod<=(a.observationPeriod||''));return {trend:describeObservationTrend(points.slice(-12)),twoPoint:indexChange(select(geo,division),a.observationPeriod,'TWO_POINT_CHANGE'),yoy:indexChange(select(geo,division),a.observationPeriod,'YoY'),mom:indexChange(select(geo,division),a.observationPeriod,'MoM')};}
  requireValue(false,'MODE_INVALID');
 }
 const gapB={state:'INSUFFICIENT_LINKED_MEASUREMENT',available:{forecast:{source:'METMalaysia via data.gov.my',receipt:'ENDPOINT-PROBES.json',location:forecast?.location?.location_name||null,locationId:forecast?.location?.location_id||null,date:forecast?.date||null,type:'FORECAST_NOT_OBSERVED_RAINFALL',rainfallMillimetres:null},geometry:{source:'MyGDI catalogue / existing generalized World geometry',state:'CATALOGUE_ACCESS_ONLY_NO_WATERSHED_LAYER_LICENSE',receipt:'ENDPOINT-PROBES.json'}},missing:['MEASURED_RAINFALL_WITH_GAUGE_AND_PERIOD','CATCHMENT_AND_WATER_STORAGE','CROP_OR_FISHERY_OUTPUT_WITH_PERIOD','SHARED_GEOGRAPHIC_JOIN_AND_LICENSE'],causalConclusion:null};
 const gapC={state:'INSUFFICIENT_EVIDENCE',available:{authority:'BNM',receipt:'BNM-PUBLIC-READS.json',periods:Object.fromEntries(bnm.filter(r=>['applied','approved'].includes(r.id)&&r.status===200).map(r=>[r.id,`${r.body.data.year_dt}-${String(r.body.data.month_dt).padStart(2,'0')}`])),institutionScope:'type=total',fields:bnm.filter(r=>['applied','approved'].includes(r.id)).flatMap(r=>Object.keys(r.body?.data||{}).filter(k=>['pur_res_pro','tot_loa_app','tot_loa_fin_apr'].includes(k))),unit:'NOT_ESTABLISHED_FROM_THIS_API_SCHEMA',matchedApplicationCounts:false,matchedApprovalOrRejectionCounts:false},missing:['MATCHED_APPLICATION_COUNTS','COMPARABLE_APPROVAL_AND_REJECTION_COUNTS','SAME_COHORT_AND_PRODUCT_SCOPE','CONSISTENT_OUTCOME_DEFINITION','TIME_SERIES_WITH_SAME_COVERAGE'],approvalRate:null,proxyAmountsNotUsed:true};
 function answer({caseType='A',geo='Malaysia',period='latest',locale='en',question=''}){
  if(caseType==='A')return answerMeasurementWorldSession(readout(geo,period),{question,locale});
  const gap=caseType==='B'?gapB:gapC;requireValue(['B','C'].includes(caseType),'CASE_INVALID');const zh=locale==='zh-Hans';
  const text=caseType==='B'?(zh?'目前核实到的是 Langkawi 的天气预报接口，不是实测降雨、水库储量或农业产量。没有同地区、同期间的水文与产量资料，不能据此断定当地供应或家庭生活已经受影响。':'The verified endpoint supplies a Langkawi weather forecast, not measured rainfall, reservoir storage or agricultural output. Without aligned hydrology and production observations, it cannot establish local supply changes or household impacts.'):(zh?'现有 BNM 接口可以读取按用途分类的贷款申请和批准字段，但本次来源未提供可匹配的申请件数、批准／拒绝件数及相同批次口径，计量单位也未在本次 API schema 中确立。因此不能计算房贷批准率，更不能断定批准越来越难；利率或贷款总量不能替代这些证据。':'The BNM endpoints expose loan application and approval fields by purpose, but these sources do not establish matched application counts, approval/rejection counts or a common cohort; the measurement unit was not established in the inspected API schema. They cannot yield a mortgage approval rate or establish that approval is becoming harder. Rates and loan totals do not replace those missing observations.');
  const met=endpointProbes.find(r=>r.id==='met_forecast');
  const sourceObjects=caseType==='B'?[{sourceId:'MET:DATA_GOV_FORECAST',sourceUrl:met.url,sourceVersion:met.sha256,versionKind:'ORIGINAL_HTTP_BYTES_SHA256',retrievedAt:met.at,publishedAt:null,geography:forecast?.location,period:forecast?.date,recordNature:'FORECAST_NOT_OBSERVED_RAINFALL',sourceState:'CANDIDATE_FORECAST_NOT_MEASUREMENT',sourceLanguage:'ms',requiredMeasurementFieldsMissing:gap.missing}]:bnm.filter(r=>['applied','approved'].includes(r.id)).map(r=>({sourceId:'BNM:'+r.id,sourceUrl:r.url,sourceVersion:hash(Buffer.from(JSON.stringify(r.body))),versionKind:'CANONICAL_JSON_SHA256_NOT_HTTP_BYTE_DIGEST',retrievedAt:r.at,publishedAt:null,period:gap.available.periods[r.id],institutionScope:'type=total',sourceState:'READ_ONLY_CANDIDATE_UNIT_LICENSE_COHORT_NOT_ADMITTED',requiredAcceptHeader:'application/vnd.BNM.API.v1+json',requiredMeasurementFieldsMissing:gap.missing}));
  const grounding=projectKnowledgeGroundingForHandoff({bundleId:'WORLD-R4:GAP:'+caseType,sources:sourceObjects.map(s=>({sourceId:s.sourceId,sourceType:s.sourceState,href:s.sourceUrl})),unknowns:gap.missing.map(code=>({code}))});
  return {question,locale,answer:text,answerState:'INSUFFICIENT_EVIDENCE',gap,sourceObjects,grounding,observations:[],backHref:'/world/?r4Case='+caseType+'&locale='+locale,providerCalls:0};
 }
 function validateEvidence(source,{now=new Date().toISOString()}={}){
  const observation=observations.find(o=>o.observationId===source.observationId),state=validateObservationReference(source,observation,{now});
  if(state.state!=='VALID')return state;
  const ids=new Set([source.sourceRef,...(source.explanation?.supports||[]).map(s=>s.sourceId)]);
  for(const id of ids){const d=data.datasets.find(d=>'DOSM:'+d.datasetId===id);if(!d)return {state:'SOURCE_NO_LONGER_AVAILABLE'};
   const metaId=new URL(d.metadataUrl).pathname.split('/').at(-1);
   try{if(hash(fs.readFileSync('.tmp/world-r4/raw/'+d.datasetId+'.csv'))!==d.sourceVersion||hash(fs.readFileSync('.tmp/world-r4/raw/'+metaId+'-metadata.html'))!==d.metadataSha256)return {state:'SOURCE_BYTES_OR_METADATA_CHANGED'};}catch{return {state:'SOURCE_VALIDATION_UNAVAILABLE'};}
  }
  if(source.explanation){const x=source.explanation;const payload={question:x.question,locale:x.locale,answer:x.answer,answerState:x.answerState,supports:x.supports,limits:x.limits};if(hash(Buffer.from(JSON.stringify(payload)))!==x.digest)return {state:'EXPLANATION_IDENTITY_CHANGED'};
   if(x.supports.some(s=>{const o=observations.find(o=>o.observationId===s.observationId);return !o||o.sourceVersion!==s.sourceVersion||o.sourceSnapshotReference!==s.supportLocation;}))return {state:'EXPLANATION_SOURCE_CHANGED'};
  }
  return {state:'VALID'};
 }
 return {observations,admissions:[...admissions.values()],data,query,readout,answer,gapB,gapC,select,validateEvidence};
}
