import {visualProjectionBuilder} from './visual-report-projection-utils.js';
export function projectAstVisualReport({projection:p,depth='FREE',reviewMode=false}){
 if(p?.schemaVersion!=='PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0'||p.governance?.sourceAuthoritiesPreserved!==true)throw Error('VRPT_AST_PRODUCT_REQUIRED');
 const sourceReportRef=`AST_FULL_REPORT:${p.semanticDigest}`,b=visualProjectionBuilder({methodId:'AST',productId:'ASTROLOGY_FULL_REPORT',sourceReportRef,sourceProjectionId:p.projectionId,locale:p.locale,depth,reviewMode,identity:{projectionId:p.projectionId,positions:p.chart.positions.map(x=>({bodyCode:x.bodyCode,longitude:x.longitude,houseNumber:x.houseNumber})),houseSystemId:p.houseSystemId}});
 const {add,local,ref}=b;
 const bodies=p.chart.positions.map(x=>({id:x.bodyCode,label:x.bodyLabel,code:x.bodyCode,rawValue:{sign:x.signLabel,degreeWithinSign:x.degreeWithinSign},sourceRefs:x.sourceRefs}));
 const themes=p.keyConfigurations||[],copy=t=>({text:t.readerText,sourceRef:t.narrativeRef,claimRef:t.narrativeRef});
 add({id:'NATAL_CHART',title:local('Your natal chart','你的出生星盘'),question:local('How is the whole chart organized?','整张命盘怎样组织？'),templateId:'RPT-T03',type:'RADIAL_MAP',nodes:bodies,insights:depth==='FREE'?themes.slice(0,2).map(copy):[],freePaid:'SHARED',visual:{type:'RADIAL_MAP',nodes:bodies,edges:[],dataRefs:[ref('chart')],labels:bodies.map(x=>x.label),a11ySummary:local('Calculated natal chart with source house geometry','保留来源宫位几何的计算星盘'),nativeRenderer:'AST_CX_R3_NATAL_CHART',encoding:'EXISTING_NATAL_CHART_OWNER'}});
 if(depth==='PAID'){
  const labels={FIRE:local('Fire','火'),EARTH:local('Earth','土'),AIR:local('Air','风'),WATER:local('Water','水'),CARDINAL:local('Cardinal','基本'),FIXED:local('Fixed','固定'),MUTABLE:local('Mutable','变动')};
  for(const key of ['elementCounts','modalityCounts']){
   const nodes=Object.entries(p.distribution?.[key]||{}).map(([id,value])=>({id,label:labels[id]||id,value,sourceRefs:p.distribution.sourceRefs}));
   add({id:key,title:local(key==='elementCounts'?'Element distribution':'Modality distribution',key==='elementCounts'?'元素分布':'模式分布'),question:local('What does the unweighted planet count show?','未加权的行星计数显示什么？'),templateId:'RPT-T04',type:'BAR',nodes,informationUnitRefs:[ref(`distribution/${key}`)],boundaryText:local('Unweighted counts are structural distribution, not a personality strength score.','未加权计数是结构分布，不是人格强度分数。')});
  }
  for(const [i,theme] of themes.entries()){
   if(theme.dynamicCounts){add({id:`THEME-${i+1}`,title:theme.readerTitle,question:local('What are the source aspect movement states?','来源相位的动态状态是什么？'),templateId:'RPT-T04',type:'BAR',nodes:Object.entries(theme.dynamicCounts).map(([id,value])=>({id,label:local(id,{EXACT:'精确',APPLYING:'入相',SEPARATING:'出相',UNDETERMINED:'未确定'}[id]||id),value,sourceRefs:theme.sourceRefs})),insights:[copy(theme)],informationUnitRefs:theme.evidenceRefs});continue;}
   const selected=[...bodies.filter(x=>theme.bodyCodes.includes(x.id)),...p.chart.angles.filter(x=>theme.angleCodes?.includes(x.angleCode)).map(x=>({id:x.angleCode,label:x.label,code:x.signLabel,sourceRefs:x.sourceRefs}))];
   const edges=p.chart.aspects.filter(x=>theme.evidenceRefs.includes(x.aspectRef)&&selected.some(n=>n.id===x.fromCode)&&selected.some(n=>n.id===x.toCode)).map(x=>({from:x.fromCode,to:x.toCode,label:x.type,sourceRefs:x.sourceRefs}));
   add({id:`THEME-${i+1}`,title:theme.readerTitle,question:local('Which governed connections support this theme?','哪些受治理的连接支持这个主题？'),templateId:'RPT-T07',type:'NETWORK',nodes:selected,edges,insights:[copy(theme)],informationUnitRefs:theme.evidenceRefs});
  }
  for(let offset=0;offset<p.planetHouseDirectory.length;offset+=5){const group=p.planetHouseDirectory.slice(offset,offset+5);add({id:`HOUSE_DOMAINS-${offset/5+1}`,title:local('Functions in their life domains','功能所在的生活领域'),question:local('Where does each source function enter everyday life?','各个来源功能通过哪些领域进入生活？'),templateId:'RPT-T05',type:'DOMAIN_GRID',nodes:group.map(x=>({id:x.bodyCode,label:`${x.bodyLabel} · ${local('House','宫')} ${x.houseNumber}`,secondary:`${x.functionLabel} · ${x.domainLabel}`,sourceRefs:x.sourceRefs})),informationUnitRefs:group.flatMap(x=>x.meaningRefs)});}
  for(const kind of ['support','tension']){
   const signals=p.wholeChartReading[kind]||[],refs=new Set(signals.map(x=>x.signalRef));
   const aspects=p.chart.aspects.filter(x=>refs.has(x.aspectRef));const ids=new Set(aspects.flatMap(x=>[x.fromCode,x.toCode]));
   add({id:kind.toUpperCase(),title:local(kind==='support'?'Support connections':'Tension connections',kind==='support'?'支持连接':'张力连接'),question:local('Which connections carry this reading?','哪些连接构成这部分读取？'),templateId:'RPT-T07',type:'NETWORK',nodes:bodies.filter(x=>ids.has(x.id)),edges:aspects.map(x=>({from:x.fromCode,to:x.toCode,label:x.type,sourceRefs:x.sourceRefs})),insights:signals.slice(0,3).map(x=>({text:x.readerText,sourceRef:x.signalRef,claimRef:x.signalRef})),informationUnitRefs:signals.map(x=>x.signalRef)});
  }
  const rulers=p.rulership?.planetaryDispositors||[];
  add({id:'RULERSHIP',title:local('Rulership routes','守护关系路径'),question:local('Where do the existing dispositor routes lead?','既有守护路径通向哪里？'),templateId:'RPT-T07',type:'NETWORK',nodes:bodies,edges:rulers.map(x=>({from:x.bodyCode,to:x.primaryRuler,sourceRefs:[ref(`rulership/planetaryDispositors/${x.bodyCode}`)]})),informationUnitRefs:[ref('rulership')],boundaryText:local('Traditional seven-planet primary rulership. Modern outer-planet rulers remain annotations.','采用传统七曜主守护关系；现代外行星守护保留为注记。')});
  if(p.timing?.state==='UNAVAILABLE')b.suppressedModules.push({id:'TIMING',reason:p.timing.reason});
  if(p.realityComparison?.state==='NOT_BOUND')b.suppressedModules.push({id:'CURRENT_REALITY',reason:'INDEPENDENT_REALITY_EVIDENCE_NOT_BOUND'});
 }
 return b.finish();
}
