import crypto from 'node:crypto';
import {HD_CENTER_CODES} from './human-design-canonical-chart.js';
import {HD_R3_RUNTIME_SOURCE_INDEX as INDEX} from './human-design-r3-runtime-source-index.js';

export const HD_R3_FACTS_ADAPTER_VERSION='PHI-OS-HD-PRO-R3-W23-CONFIRMED-CHART-FACTS-ADAPTER-v1.0.0';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const raw=v=>String(v??'').trim();
const norm=v=>raw(v).toLowerCase().normalize('NFKC').replace(/[‐‑‒–—]/g,'-').replace(/[\s_]+/g,' ').trim();
const has=(s,terms)=>terms.some(t=>s.includes(t));

const TYPE_ALIASES=[
  ['MANIFESTING_GENERATOR',['manifesting generator','manifesting-generator','显示生产者','顯示生產者']],
  ['MANIFESTOR',['manifestor','显示者','顯示者']],['GENERATOR',['generator','生产者','生產者']],
  ['PROJECTOR',['projector','投射者']],['REFLECTOR',['reflector','反映者','反射者']]
];
const AUTH_ALIASES=[
  ['MENTAL_ENVIRONMENTAL',['mental / environmental','mental environmental','environmental authority','mental projector','环境权威','環境權威','心智权威','心智權威','外在型']],
  ['EGO_MANIFESTED',['ego manifested','ego-manifested','will manifested','意志显化','意志顯化','显示型意志','顯示型意志']],
  ['EGO_PROJECTED',['ego projected','ego-projected','will projected','意志投射','投射型意志']],
  ['SELF_PROJECTED',['self projected','self-projected','自我投射']],
  ['EMOTIONAL',['emotional','solar plexus','情绪','情緒']],['SACRAL',['sacral','荐骨','薦骨']],
  ['SPLENIC',['splenic','spleen','脾权威','脾權威']],['LUNAR',['lunar','moon authority','月亮权威','月亮權威']]
];
const DEF_ALIASES=[
  ['NO_DEFINITION',['no definition','无定义','無定義']],['TRIPLE_SPLIT',['triple split','3 split','three split','三分人']],
  ['QUAD_SPLIT',['quad split','quadruple split','4 split','四分人']],['SINGLE',['single definition','single','一分人']],
  ['SPLIT',['split definition','split','二分人']]
];
function alias(value,rows){const s=norm(value);if(!s)return null;for(const [key,terms] of rows)if(has(s,terms.map(norm)))return key;return null}
function profile(value){const m=raw(value).match(/([1-6])\s*[\/|-]\s*([1-6])/);const p=m?`${m[1]}/${m[2]}`:null;return p&&INDEX.profiles[p]?p:null}
function channelCode(v){const m=raw(v).match(/^([1-9]|[1-5]\d|6[0-4])\s*[-–—]\s*([1-9]|[1-5]\d|6[0-4])$/);if(!m)return null;const a=Number(m[1]),b=Number(m[2]);const direct=`${a}-${b}`,reverse=`${b}-${a}`;return INDEX.channels[direct]?direct:INDEX.channels[reverse]?reverse:null}
function advancedKey(field,value){const s=norm(value);if(!s)return null;for(const unit of INDEX.advanced[field]||[]){if(norm(unit.canonicalKey)===s)return unit.canonicalKey;const en=norm(unit.label?.en), zh=norm(unit.label?.zhHans);if((en&&(en===s||en.startsWith(`${s} |`)||en.includes(s)))||(zh&&(zh===s||zh.includes(s))))return unit.canonicalKey;}return null}
function addRefs(map,key,refs){if(!key||!refs?.length)return;map[key]=uniq([...(map[key]||[]),...refs])}

function deriveCenterState(chart,channels,gateNumbers){
  const defined=new Set(chart?.structure?.definedCenters||[]);
  for(const ch of channels){const row=INDEX.channels[ch.channelId];if(row){defined.add(row.centerA);defined.add(row.centerB)}}
  const gatesByCenter=new Map();for(const g of gateNumbers){const c=INDEX.gates[String(g)]?.center;if(c){if(!gatesByCenter.has(c))gatesByCenter.set(c,[]);gatesByCenter.get(c).push(g)}}
  const explicitNonDefined=new Set(chart?.structure?.openCenters||[]);
  const undefinedCenters=[],openCenters=[],unknownCenters=[];
  for(const c of HD_CENTER_CODES){
    if(defined.has(c))continue;
    if(gatesByCenter.get(c)?.length){undefinedCenters.push(c);continue;}
    if(explicitNonDefined.has(c)){openCenters.push(c);continue;}
    unknownCenters.push(c);
  }
  return {defined:[...defined].filter(c=>HD_CENTER_CODES.includes(c)),undefined:undefinedCenters,open:openCenters,unknown:unknownCenters,classificationBoundary:{explicitOpenCentersFromR2AreLegacyNonDefinedInput:true,activeGateWithoutDefinitionClassifiesAsUndefined:true,unclassifiedWithoutGateRemainsUnknown:true,completeChannelEndpointsMaySupportDefinedState:true}};
}

function topology(centers,channels){
  const nodes=new Set(centers.defined);const adj=new Map([...nodes].map(n=>[n,new Set()]));
  for(const ch of channels){const row=INDEX.channels[ch.channelId];if(!row)continue;const a=row.centerA,b=row.centerB;if(nodes.has(a)&&nodes.has(b)){adj.get(a).add(b);adj.get(b).add(a)}}
  const seen=new Set(),clusters=[];for(const n of nodes){if(seen.has(n))continue;const stack=[n],group=[];seen.add(n);while(stack.length){const x=stack.pop();group.push(x);for(const y of adj.get(x)||[])if(!seen.has(y)){seen.add(y);stack.push(y)}}clusters.push(group.sort())}
  return clusters.sort((a,b)=>b.length-a.length||a.join(',').localeCompare(b.join(',')));
}

export function adaptCanonicalHumanDesignChartToR3Facts(chart,{customerIntent=''}={}){
  if(!chart||chart.profileFamily!=='HUMAN_DESIGN'||chart.authorityClass!=='CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT'||chart.provenance?.customerConfirmed!==true)throw new TypeError('HD_R3_CONFIRMED_EXTERNAL_CHART_REQUIRED');
  const type=alias(chart.core?.type?.value,TYPE_ALIASES);const authority=alias(chart.core?.authority?.value,AUTH_ALIASES);const p=profile(chart.core?.profile?.value);const definition=alias(chart.core?.definition?.value,DEF_ALIASES);
  const channels=uniq((chart.structure?.channels||[]).map(channelCode).filter(Boolean)).map(id=>{const row=INDEX.channels[id];return Object.freeze({channelId:id,gates:[row.gateA,row.gateB],centers:[row.centerA,row.centerB]})});
  const gateNumbers=uniq((chart.structure?.activations||[]).map(x=>Number(x.gate)).filter(g=>INDEX.gates[String(g)])).sort((a,b)=>a-b);
  const centers=deriveCenterState(chart,channels,gateNumbers);
  const channelGateSet=new Set(channels.flatMap(c=>c.gates));
  const hangingGates=gateNumbers.filter(g=>!channelGateSet.has(g)).map(g=>({gate:g,center:INDEX.gates[String(g)].center})).filter(x=>centers.undefined.includes(x.center));
  const layers={PERSONALITY:new Set(),DESIGN:new Set()};for(const a of chart.structure?.activations||[]){if(layers[a.layer])layers[a.layer].add(Number(a.gate))}
  const personalityDesignPairs=[];for(const ch of channels){const [a,b]=ch.gates;if((layers.PERSONALITY.has(a)&&layers.DESIGN.has(b))||(layers.PERSONALITY.has(b)&&layers.DESIGN.has(a)))personalityDesignPairs.push({personalityGate:layers.PERSONALITY.has(a)?a:b,designGate:layers.DESIGN.has(b)?b:a,relationship:'CHANNEL_COMPONENTS',channelId:ch.channelId})}
  const advanced={},advancedUnmapped={};for(const field of ['determination','cognition','environment','perspective','motivation','trajectory']){const v=chart.advanced?.[field]?.value;if(!v)continue;const key=advancedKey(field,v);if(key)advanced[field]=key;else advancedUnmapped[field]=v}
  const refs={};if(type)addRefs(refs,`TYPE.${type}`,INDEX.types[type]?.sourceRefs);if(authority)addRefs(refs,`AUTHORITY.${authority}`,INDEX.authorities[authority]?.sourceRefs);if(p)addRefs(refs,`PROFILE.${p.replace('/','_')}`,INDEX.profiles[p]?.sourceRefs);if(definition)addRefs(refs,`DEFINITION.${definition}`,INDEX.definitions[definition]?.sourceRefs);
  for(const c of centers.defined)addRefs(refs,`CENTER.${c}.DEFINED`,INDEX.centers[`${c}.DEFINED`]?.sourceRefs);for(const c of centers.undefined)addRefs(refs,`CENTER.${c}.UNDEFINED`,INDEX.centers[`${c}.UNDEFINED`]?.sourceRefs);for(const c of centers.open)addRefs(refs,`CENTER.${c}.OPEN`,INDEX.centers[`${c}.OPEN`]?.sourceRefs);
  for(const ch of channels){addRefs(refs,`CHANNEL.${ch.channelId}`,INDEX.channels[ch.channelId]?.sourceRefs);for(const g of ch.gates)addRefs(refs,`GATE.${g}`,INDEX.gates[String(g)]?.sourceRefs)}for(const h of hangingGates)addRefs(refs,`GATE.${h.gate}`,INDEX.gates[String(h.gate)]?.sourceRefs);
  for(const pd of personalityDesignPairs){addRefs(refs,`GATE.${pd.personalityGate}.PERSONALITY`,INDEX.gates[String(pd.personalityGate)]?.sourceRefs);addRefs(refs,`GATE.${pd.designGate}.DESIGN`,INDEX.gates[String(pd.designGate)]?.sourceRefs)}
  for(const [field,key] of Object.entries(advanced)){const unit=(INDEX.advanced[field]||[]).find(x=>x.canonicalKey===key);addRefs(refs,`ADVANCED.${field.toUpperCase()}.${key}`,unit?.sourceRefs)}
  const facts={type,authority,profile:p,definition,centers,channels,hangingGates,personalityDesignPairs,advanced,advancedUnmapped,sourceRefsBySubject:refs,customerIntent:String(customerIntent||'').slice(0,500),chartDigest:chart.chartDigest,rawConfirmed:{type:chart.core?.type?.value||null,authority:chart.core?.authority?.value||null,profile:chart.core?.profile?.value||null,definition:chart.core?.definition?.value||null,strategy:chart.core?.strategy?.value||null,incarnationCross:chart.core?.incarnationCross?.value||null,signature:chart.core?.signature?.value||null,notSelfTheme:chart.core?.notSelfTheme?.value||null,variable:chart.advanced?.variable?.value||null},topologyClusters:topology(centers,channels),boundary:{confirmedExternalChartOnly:true,phiosCalculated:false,unknownCoreValueNotInvented:true,advancedUnmappedNotSemanticallyPromoted:true,personalityDesignDistinctGateMeaningNotInvented:true}};
  return Object.freeze({...facts,factsDigest:digest(facts)});
}

export function buildHumanDesignR3StructuralMap(chart,facts){
  const priorityGateSet=new Set((facts.channels||[]).flatMap(c=>c.gates).concat((facts.hangingGates||[]).map(x=>x.gate)));
  const centerState=new Map([...facts.centers.defined.map(c=>[c,'DEFINED']),...facts.centers.undefined.map(c=>[c,'UNDEFINED']),...facts.centers.open.map(c=>[c,'OPEN']),...facts.centers.unknown.map(c=>[c,'UNKNOWN'])]);
  const centers=HD_CENTER_CODES.map(code=>({code,state:centerState.get(code)||'UNKNOWN',sourceRefs:facts.sourceRefsBySubject[`CENTER.${code}.${centerState.get(code)}`]||[]}));
  const channels=(facts.channels||[]).map(ch=>{const row=INDEX.channels[ch.channelId];return {channelId:ch.channelId,gates:ch.gates,centers:ch.centers,label:row?.label||null,sourceRefs:row?.sourceRefs||[]}});
  const gates=uniq((chart.structure?.activations||[]).map(a=>a.gate)).sort((a,b)=>a-b).map(g=>({gate:g,center:INDEX.gates[String(g)]?.center||null,layers:uniq((chart.structure?.activations||[]).filter(a=>a.gate===g).map(a=>a.layer)),priorityEvidence:priorityGateSet.has(g),identity:INDEX.gates[String(g)]?.identity||null}));
  const advanced=['variable','determination','cognition','environment','perspective','motivation','trajectory'].map(field=>({field,value:chart.advanced?.[field]?.value||null,semanticStatus:field==='variable'?'STRUCTURAL_ORIENTATION_ONLY':facts.advanced[field]?'SEMANTIC_ADMITTED':chart.advanced?.[field]?.value?'SOURCE_VALUE_NOT_MAPPED':'NOT_AVAILABLE'})).filter(x=>x.value);
  return Object.freeze({schemaVersion:'PHI-OS-HD-PRO-R3-W24-STRUCTURAL-HD-MAP-v1.0.0',chartDigest:chart.chartDigest,summary:{type:chart.core?.type?.value||null,authority:chart.core?.authority?.value||null,profile:chart.core?.profile?.value||null,definition:chart.core?.definition?.value||null},centers:Object.freeze(centers),channels:Object.freeze(channels),gates:Object.freeze(gates),definitionTopology:Object.freeze({definition:chart.core?.definition?.value||null,clusters:Object.freeze(facts.topologyClusters||[]),clusterCount:(facts.topologyClusters||[]).length}),personalityDesign:Object.freeze({personalityGateCount:(chart.structure?.activations||[]).filter(a=>a.layer==='PERSONALITY').length,designGateCount:(chart.structure?.activations||[]).filter(a=>a.layer==='DESIGN').length,semanticDistinctionStatus:'STRUCTURAL_PROVENANCE_ONLY'}),advanced:Object.freeze(advanced),boundaries:Object.freeze({notOfficialBodyGraphReplica:true,explanatoryStructuralMap:true,all64GatesDefaultVisible:false,all36ChannelsDefaultVisible:false,unknownStateVisibleRatherThanGuessed:true})});
}
