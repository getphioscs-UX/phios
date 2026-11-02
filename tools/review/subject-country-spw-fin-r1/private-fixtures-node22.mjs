import {createStrictSqliteD1TestAdapter} from 'file:///C:/Users/Guest%20Account/.codex/worktrees/world-customer-experience-r3/phios/scripts/lib/sqlite-d1-test-adapter.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createUniversalRegistry} from 'file:///C:/Users/Guest%20Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/universal-registry.js';
import {SUBJECT_CONTEXT_VERSION} from 'file:///C:/Users/Guest%20Account/.codex/worktrees/world-customer-experience-r3/phios/functions/profile/subject-context-r1.js';
import {admitLocalMeasurementDataset,measurementFromRow,describeObservationTrend} from 'file:///C:/Users/Guest%20Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/world-measurement-observations.js';
export const sha=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
export function sqliteAdapter(sql){return createStrictSqliteD1TestAdapter(sql);}
export async function seedSubjectFixtures(sql,accounts) {
 sql.exec(fs.readFileSync('db/migrations/0005_pws_universal_registry.sql','utf8'));
 const registry=createUniversalRegistry({db:sqliteAdapter(sql)}),now=new Date().toISOString(),context={actor_id:'LOCAL_QA_SEED',correlation_id:'SUBJECT-R1-SYNTHETIC-ONLY'};
 const register=async(object_id,object_type,name,metadata,owner='PROFILE')=>{
  if(!await registry.query.getObject(object_id))await registry.registerObject({object_id,object_code:object_id,object_type,canonical_name:name,owner_module:owner,metadata},context);
 };
 for(const [alias,uid] of Object.entries(accounts))await register('account-ref:'+alias,'ACCOUNT_REFERENCE','Synthetic QA '+alias,{canonicalAccountId:uid,referenceOnly:true},'ACCOUNT');
 const synthetic=(id,statement,position)=>({id,statement,statementZh:id==='personal-note'?'示例中的使用者表示，作出改变前倾向先规划。':'合成季度报表：营业收入 10,000、销售成本 6,000、现金余额 1,800 马币。',position,version:'QA-FIXTURE-v1',kind:'ILLUSTRATIVE_EXAMPLE',access:'PRIVATE'});
 const geometry=JSON.parse(fs.readFileSync('content/civilization-atlas/geography/world-selection-geometry-r2.json','utf8')),country=geometry.features.find(f=>f.iso2==='MY');if(!country||country.id!=='MYS'||country.name.en!=='Malaysia')throw Error('WORLD_COUNTRY_REFERENCE_UNVERIFIED');
 const data=[
 {id:'qa-personal-A',type:'PERSONAL',name:'Personal example A',visibility:'PRIVATE',canonicalSubjectRef:{owner:'ACCOUNT',id:accounts.A},evidence:[synthetic('personal-note','A stated preference for planning before making a change.','synthetic personal note / 1')],dimensions:{identity:['personal-note']},constraints:['No private birth data, score or report is inferred.']},
 {id:'qa-business',type:'BUSINESS',name:'Sample Studio',visibility:'PRIVATE',canonicalSubjectRef:{owner:'PWS',id:'qa-business'},legalForm:'SOLE_PROPRIETORSHIP',evidence:[synthetic('business-statement','Synthetic quarterly statement: revenue 10000; cost of sales 6000; cash position 1800 MYR.','synthetic statement / period 2026-Q3')],dimensions:{identity:['business-statement'],growth:['business-statement']},financial:{scope:'BUSINESS_OPERATIONS',currency:'MYR',period:'2026-Q3',accountingBasis:'ACCRUAL',consolidationBoundary:'STUDIO_OPERATIONS_ONLY',metrics:Object.fromEntries([['revenue',1000000],['costOfSales',600000],['cashPosition',180000],['currentAssets',450000],['currentLiabilities',200000]].map(([id,value])=>[id,{value,currency:'MYR',period:'2026-Q3',unit:'CURRENCY_MINOR',sourceRef:'business-statement'}]))},constraints:['Turnover is not the proprietor’s disposable income.','This operating boundary does not create a separate legal person.']},
 // A public observation profile points to the existing World entity; it does not own Malaysia.
 {id:'qa-world-MY-ref',type:'COUNTRY',name:'Malaysia · public observation',visibility:'PUBLIC',canonicalSubjectRef:{owner:'WORLD',id:country.id,source:'content/civilization-atlas/geography/world-selection-geometry-r2.json',sourceGeoCode:country.iso2},evidence:[],dimensions:{},constraints:['No government revenue, expenditure or GDP value is inferred from CPI.']}
 ];
 // Reuse an existing registered, dated public context. No new measurements and no network fetch.
 const endpoint=JSON.parse(fs.readFileSync('tools/review/world-ux-r1/world-r4/ENDPOINT-PROBES.json','utf8'));
 const row=endpoint.find(r=>r.id==='wb_population');
 const observation=row?.sample?.[1]?.[0];
 if(observation?.country?.id==='MY'&&Number.isFinite(observation.value)&&observation.date){
  const e={id:'WORLD_BANK:MY:SP.POP.TOTL:'+observation.date,version:sha(row.sample),position:'World Bank response / data[0]',kind:'OBSERVED_FACT',access:'PUBLIC',statement:`Population: ${observation.value}`,sourceUrl:'https://api.worldbank.org/v2/country/MY/indicator/SP.POP.TOTL?format=json&date='+observation.date,publisher:'World Bank',period:String(observation.date),unit:'persons',geography:'MY',retrievedAt:row.at||row.retrievedAt||'',revision:'ARCHIVED_RESPONSE_NOT_LATEST',limitation:'Archived regional background only; not government revenue, personal outcomes or present-day population.'};
  e.statementZh=`人口：${observation.value}`;e.limitationZh='存档的地区背景，不代表政府收入、个人处境或当前人口。';
  data[2].evidence.push(e);data[2].dimensions.environment=[e.id];data[2].worldContext=[e];
 }
 const datasets=JSON.parse(fs.readFileSync('C:/phios/.tmp/world-r4/datasets.json','utf8')),d=datasets.datasets.find(x=>x.datasetId==='cpi_2d');
 const canonical=JSON.parse(fs.readFileSync('content/world/successors/world-r4-local-validation/registry.json','utf8'));
 if(canonical.successorOf!=='content/world/world-evidence-series-v1.json'||canonical.productionEligible!==false||JSON.stringify(canonical.datasets)!==JSON.stringify(datasets.datasets))throw Error('WORLD_EXISTING_BINDING_CHANGED');
 const raw=fs.readFileSync('C:/phios/.tmp/world-r4/raw/cpi_2d.csv'),metadata=fs.readFileSync('C:/phios/.tmp/world-r4/raw/cpi_headline-metadata.html');
 // Replay the original archival admission at its real collection time. No freshness renewal.
 const admission=admitLocalMeasurementDataset(d,{actualSha256:sha(raw),metadataSha256:sha(metadata),now:d.retrievedAt}),lines=raw.toString('utf8').replace(/^\uFEFF/,'').split(/\r?\n/);
 const selected=datasets.records.filter(r=>r.datasetId==='cpi_2d'&&r.geo==='Malaysia'&&r.division==='overall'&&r.field==='index').slice(-12);
 const measurements=selected.map(r=>measurementFromRow(r,d,admission,Object.fromEntries(d.columns.map((c,i)=>[c,lines[r.rowNumber-1].split(',')[i]]))));
 for(let i=0;i<selected.length;i++){
  const r=selected[i],o=measurements[i],id=o.observationId;
  const e={id,version:d.sourceVersion,position:'CSV row '+r.rowNumber,kind:'OBSERVED_FACT',access:'PUBLIC',statement:`CPI index: ${r.value}`,statementZh:`消费价格指数：${r.value}`,numericValue:r.value,sourceUrl:d.sourceUrl,publisher:d.publisher,period:r.period,unit:'index_2010_100',geography:'MY',retrievedAt:d.retrievedAt,revision:'ARCHIVED_LOCAL_VALIDATION_NOT_LATEST',limitation:'Historical national consumer basket; not a household loss or company cost result.',limitationZh:'历史全国消费篮子指标，不代表家庭损失或企业实际成本。'};
  data[2].evidence.push(e);data[2].dimensions.growth??=[];data[2].dimensions.growth.push(id);data[2].worldContext.push(e);
 }
 data[2].worldTrend={owner:'functions/_lib/world-measurement-observations.js',mode:'ARCHIVED_LOCAL_REPLAY_NOT_CURRENT_FACT_REVALIDATION',inputRefs:measurements.map(o=>o.observationId),result:describeObservationTrend(measurements)};
 // Background is deliberately marked as background, not a causal explanation of the studio's ledger.
 data[1].worldContext=data[2].worldContext.filter(e=>e.unit==='index_2010_100');
 for(const d of data){
  const payload={canonicalSubjectRef:d.type==='COUNTRY'?d.canonicalSubjectRef:undefined,displayNames:{en:d.name,'zh-Hans':d.type==='PERSONAL'?'个人示例 A':d.type==='BUSINESS'?'示例工作室':'马来西亚 · 公共观察'},evidence:d.evidence.map(e=>({...e,...(e.access==='PRIVATE'?{ownerSubjectId:d.id}:{})})),dimensions:d.dimensions,financial:d.financial,worldContext:d.worldContext||[],worldTrend:d.worldTrend||null,constraints:d.constraints},digest=sha(payload);
  await register(d.id,'SUBJECT_CONTEXT_REF',d.name,{contractVersion:SUBJECT_CONTEXT_VERSION,subjectType:d.type,visibility:d.visibility,canonicalSubjectRef:d.canonicalSubjectRef,profileId:'profile-ref:'+d.id,version:1,currentPayloadDigest:digest,legalForm:d.legalForm||null,dataNature:d.type==='COUNTRY'?'ARCHIVED_PUBLIC_CONTEXT':'SYNTHETIC_EXAMPLE'});
  const previous=(await registry.versionStore.list(d.id))[0];
  if(!previous||previous.checksum!==digest){await registry.versionStore.append({object_id:d.id,payload,checksum:digest,created_by:'LOCAL_QA_SEED'});if(previous){const obj=await registry.query.getObject(d.id),m={...obj.metadata,currentPayloadDigest:digest,version:obj.metadata.version+1,canonicalSubjectRef:d.canonicalSubjectRef,priorCanonicalSubjectRefs:[...(obj.metadata.priorCanonicalSubjectRefs||[]),obj.metadata.canonicalSubjectRef].filter((r,i,a)=>a.findIndex(x=>JSON.stringify(x)===JSON.stringify(r))===i)};sql.prepare('UPDATE pws_registry_objects SET metadata_json=?,updated_at=? WHERE object_id=?').run(JSON.stringify(m),now,d.id);}}
  // These exact qa-* references are synthetic fixtures, not source/acceptance records.
 }
 for(const [alias,subject,role,scopes] of [['A','qa-personal-A','OWNER',['profile:read']],['A','qa-business','OWNER',['profile:read','financial:read','financial:write']],['B','qa-business','VIEWER',['profile:read','financial:read']]]){
  const id='access:'+alias+':'+subject,version=(await registry.query.getObject(subject)).metadata.version;
  if(!sql.prepare('SELECT 1 FROM pws_registry_relationships WHERE relationship_id=?').get(id))await registry.relationshipStore.create({relationship_id:id,source_object_id:'account-ref:'+alias,target_object_id:subject,relationship_type:'SUBJECT_CONTEXT_ACCESS',attributes:{purpose:'SUBJECT_PROFILE_DISPLAY',subjectVersion:version,role,scopes},valid_from:now,created_by:'LOCAL_QA_SEED'});
  else{const row=sql.prepare('SELECT attributes_json FROM pws_registry_relationships WHERE relationship_id=?').get(id),a=JSON.parse(row.attributes_json);if(a.subjectVersion!==version)sql.prepare('UPDATE pws_registry_relationships SET attributes_json=? WHERE relationship_id=?').run(JSON.stringify({...a,subjectVersion:version}),id);}
 }
 return registry;
}
