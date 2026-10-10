import {visualProjectionBuilder} from './visual-report-projection-utils.js';
import {projectBaziStructuralBatch} from './bazi-structural-visual-pages.js';
import {projectBaziBalanceBatch} from './bazi-balance-visual-pages.js';
import {projectBaziDomainBatch} from './bazi-domain-visual-pages.js';
import {projectBaziTimingNavigationBatch} from './bazi-timing-navigation-visual-pages.js';
import {compilePublicationInterpretation} from './narrative/narrative-brief-compiler.js';
import {composePublicationNarrative,humanizePublicationStatement} from './narrative/narrative-writer.js';
import {PUBLICATION_VERSIONS,publicationPageDefinition} from '../canonical-presentation-runtime/report-publication-contract.js';
export function projectBaziVisualReport({reading:r,locale='en',depth='FREE',reviewMode=false,batch=null}){
 if(r?.methodId!=='BZR'||r.publicationDecision?.customerPublishable!==true)throw Error('VRPT_BZR_ADMITTED_READING_REQUIRED');
 if(batch!==null){if(['BAZI-DYNAMIC-R1-BATCH-04','BAZI-DYNAMIC-R1-BATCH-05'].includes(batch))return projectBaziTimingNavigationBatch({reading:r,locale,depth,reviewMode,batch});if(batch==='BAZI-DYNAMIC-R1-BATCH-03')return projectBaziDomainBatch({reading:r,locale,depth,reviewMode});if(batch==='BAZI-DYNAMIC-R1-BATCH-02')return projectBaziBalanceBatch({reading:r,locale,depth,reviewMode});if(batch!=='BAZI-DYNAMIC-R1-BATCH-01')throw Error('VRPT_BAZI_BATCH_UNKNOWN');return projectBaziStructuralBatch({reading:r,locale,depth,reviewMode});}
 const sourceReportRef=`BAZI_FULL_REPORT:${r.summary.reportDigest}`,m=r.professionalModules,pillars=r.structuralModel.pillars;
 const b=visualProjectionBuilder({methodId:'BZR',productId:'BAZI_FULL_REPORT',sourceReportRef,sourceProjectionId:pillars[0]?.stem.sourceRef.split('#')[0],locale,depth,reviewMode,identity:pillars.map(x=>({position:x.position,stem:x.stem.code,branch:x.branch.code}))});
 const {add,local,ref}=b,zh=locale==='zh-Hans',choose=x=>x?.[zh?'zhHans':'en'];
 const section=id=>r.readingSections.find(x=>x.code===id);
 const positions={YEAR:local('Year','年柱'),MONTH:local('Month','月柱'),DAY:local('Day','日柱'),HOUR:local('Hour','时柱')};
 const nodes=pillars.map(x=>({id:x.position,label:positions[x.position],secondary:`${x.stem.zh} ${x.branch.zh}`,sourceRefs:[x.stem.sourceRef,x.branch.sourceRef]}));
 const prompts=m.realityBridge.priorityPrompts.flatMap(x=>x.prompts);
 const insightsFor=kind=>{const chapter=m.customerNarrative.priorityChapters.find(x=>x.themeType===kind);return chapter?['thesis','condition'].map(key=>({text:choose(chapter[key]),sourceRef:`${chapter.chapterId}#${key}`,claimRef:`${chapter.chapterId}#${key}`})):[];};
 const freeInsights=r.summary.keyPoints.slice(0,2).map((text,i)=>({text,sourceRef:ref(`summary/keyPoints/${i}`),claimRef:ref(`summary/keyPoints/${i}`)}));
 add({id:'FOUNDATION',title:r.summary.title,question:local('Which four-pillar structure anchors this reading?','哪一组四柱结构构成本次读取的基础？'),templateId:'RPT-T02',type:'DOMAIN_GRID',nodes,insights:freeInsights,freePaid:'SHARED',...(depth==='FREE'&&prompts[0]?{navigationPrompt:{text:choose(prompts[0].prompt),sourceRef:prompts[0].promptId}}:{})});
 if(depth==='PAID'){
  const elementLabels={WOOD:local('Wood','木'),FIRE:local('Fire','火'),EARTH:local('Earth','土'),METAL:local('Metal','金'),WATER:local('Water','水')};
  add({id:'ELEMENTS',title:local('Five-element inventory','五行结构分布'),question:local('How are the unweighted elements distributed?','未加权的五行如何分布？'),templateId:'RPT-T04',type:'BAR',nodes:m.fiveElements.items.map(x=>({id:x.element,label:elementLabels[x.element],value:x.rawCount,sourceRefs:[ref(`professionalModules/fiveElements/items/${x.element}`)]})),informationUnitRefs:[ref('professionalModules/fiveElements')],boundaryText:local('Raw counts are not strength scores. No hidden-stem weighting is added.','原始计数不等于强弱分数；没有添加藏干权重。')});
  const groupLabels={PEER:local('Peer','比劫'),OUTPUT:local('Output','食伤'),WEALTH:local('Wealth','财'),OFFICER:local('Officer','官杀'),RESOURCE:local('Resource','印')};
  add({id:'TEN_GODS',title:local('Ten-god function groups','十神功能分组'),question:local('Which function groups are present in the source structure?','来源结构中出现了哪些功能分组？'),templateId:'RPT-T04',type:'BAR',nodes:m.tenGods.functionGroups.map(x=>({id:x.groupCode,label:groupLabels[x.groupCode],value:x.count,sourceRefs:[ref(`professionalModules/tenGods/functionGroups/${x.groupCode}`)]})),insights:insightsFor('TEN_GOD_GROUP'),informationUnitRefs:[ref('professionalModules/tenGods')]});
  const edges=m.relationships.items.flatMap(x=>x.positions.slice(1).map(position=>({from:x.positions[0],to:position,label:x.type,sourceRefs:[x.relationId]})));
  add({id:'RELATIONSHIPS',title:section('RELATIONSHIPS').title,question:local('Which pillars participate in the admitted interactions?','哪些柱位参与已准入的相互关系？'),templateId:'RPT-T07',type:'NETWORK',nodes,edges,insights:insightsFor('RELATIONSHIP'),informationUnitRefs:m.relationships.items.map(x=>x.relationId)});
  add({id:'PATTERNS',title:section('PATTERNS').title,question:local('Which pattern candidates remain open?','哪些格局候选仍保持开放？'),templateId:'RPT-T05',type:'DOMAIN_GRID',nodes:m.pattern.candidates.map(x=>({id:x.candidateId,label:zh?x.tenGodZh:x.patternFamily,secondary:local(x.visibleStemMatch?'Visible stem match':'No visible stem match',x.visibleStemMatch?'透干':'未透'),sourceRefs:[ref(`professionalModules/pattern/candidates/${x.candidateId}`)]})),insights:insightsFor('PATTERN'),informationUnitRefs:m.pattern.evidenceRefs,boundaryText:local('A primary pattern has not been established. Candidate presence is not a final verdict.','主格局尚未确定。候选出现不等于最终判断。')});
  const schools=section('SCHOOLS').blocks;
  const schoolCopy=[...new Set(schools.map(x=>x.text))];
  add({id:'SCHOOLS',title:section('SCHOOLS').title,question:local('How are the separate school views retained?','不同学派的视角怎样分别保留？'),templateId:'RPT-T08',type:'SPLIT_COMPARE',nodes:schools.map(x=>({id:x.schoolCode,label:x.title,secondary:local('Judgment remains open','判断保持开放'),sourceRefs:[ref(`readingSections/SCHOOLS/${x.schoolCode}`)]})),insights:schoolCopy.slice(0,3).map((text,i)=>({text,sourceRef:ref(`readingSections/SCHOOLS/copy/${i}`)})),informationUnitRefs:schools.map(x=>ref(`readingSections/SCHOOLS/${x.schoolCode}`))});
  const cycles=r.structuralModel.daYunTimeline;
  add({id:'TIMING',title:local('Luck-cycle sequence','大运序列'),question:local('Which calculated time intervals are available?','哪些计算时间区间已经可用？'),templateId:'RPT-T06',type:'TIMELINE',nodes:cycles.map(x=>({id:`cycle-${x.cycleNumber}`,label:`${x.startAge}–${x.endAge}`,secondary:`${x.pillar.stem.zh}${x.pillar.branch.zh}`,sourceRefs:[ref(`structuralModel/daYunTimeline/${x.cycleNumber}`)]})),informationUnitRefs:[ref('structuralModel/daYunTimeline')],boundaryText:local('Sequence only; without a target context no current cycle or annual activation is selected.','这里只呈现序列；缺少目标情境时，不选择当前大运或流年激活。')});
  if(m.professionalTimeline.state==='UNAVAILABLE')b.suppressedModules.push({id:'SELECTED_TIMING',reason:'TARGET_CONTEXT_NOT_SUPPLIED'});
  const open=section('OPEN').items;
  for(let i=0;i<open.length;i+=3)add({id:`OPEN-${i/3+1}`,title:section('OPEN').title,question:local('Which judgments must remain unresolved?','哪些判断需要继续保持开放？'),templateId:'RPT-T12',type:'SPLIT_COMPARE',nodes:open.slice(i,i+3).map((text,j)=>({id:String(i+j),label:local('Open','开放'),secondary:text,sourceRefs:[ref(`readingSections/OPEN/${i+j}`)]})),informationUnitRefs:open.slice(i,i+3).map((_,j)=>ref(`readingSections/OPEN/${i+j}`))});
  const trace=m.customerSafeGraph.summary;
  add({id:'TECHNICAL_EVIDENCE',title:local('Evidence and boundaries','证据与边界'),question:local('Which source records support the report?','哪些来源记录支持这份报告？'),templateId:'RPT-T14',type:'CONFIDENCE_OR_EVIDENCE_BADGE',nodes:[['sourceFindingCount',local('Findings','发现')],['sourceEvidenceCount',local('Evidence records','证据记录')],['sourceAuthorityCount',local('Authorities','来源权限')],['sourceUnknownCount',local('Open items','开放事项')]].map(([key,label])=>({id:key,label,secondary:String(trace[key]),sourceRefs:[ref(`professionalModules/customerSafeGraph/summary/${key}`)]})),informationUnitRefs:[ref('professionalModules/customerSafeGraph')],boundaryText:r.summary.boundary});
  add({id:'NAVIGATION',title:local('Reality navigation','现实导航'),question:local('Which observations could contradict the reading?','哪些现实观察可能反驳这次读取？'),templateId:'RPT-T11',type:'MINI_CARD',nodes:prompts.slice(0,2).map((x,i)=>({id:x.promptId,label:String(i+1),secondary:choose(x.prompt),sourceRefs:[x.promptId]})),informationUnitRefs:prompts.slice(0,2).map(x=>x.promptId)});
 }
 return b.finish();
}

// Successor projection under the existing BaZi Page IR owner; calculation and
// professional interpretation remain upstream. Existing batch output is intact.
export async function projectBaziPublicationPages({reading:r,locale,temporalContext,composition={},allowUnselectedTiming=false}){
 if(r?.publicationDecision?.customerPublishable!==true||!['zh-Hans','en'].includes(locale))throw Error('PUBLICATION_ADMITTED_BAZI_REQUIRED');
 const noTarget=allowUnselectedTiming&&temporalContext?.mode==='UNAVAILABLE'&&r.professionalModules.professionalTimeline.state==='UNAVAILABLE'&&r.professionalModules.professionalTimeline.targetContext===null;
 if(!temporalContext||(!noTarget&&r.professionalModules.professionalTimeline.state!=='EXPLICIT'))throw Error('PUBLICATION_RESOLVED_TEMPORAL_REQUIRED');
 const reports=[1,2,3,4,5].map(n=>projectBaziVisualReport({reading:r,locale,depth:'PAID',reviewMode:true,batch:`BAZI-DYNAMIC-R1-BATCH-0${n}`}));
 const originals=reports.flatMap(report=>report.pages),pick=(en,zh)=>locale==='en'?en:zh,language=locale==='en'?'en':'zhHans';
 const topicMap={16:'LIFE_OPERATION',17:'RELATIONSHIPS',18:'CAREER',19:'WEALTH',22:'CAREER',23:'CAREER',24:'PRESSURE',25:'LIFE_OPERATION'};
 const timeline=r.professionalModules.professionalTimeline;
 const selected=timeline.daYunTimeline.find(c=>c.isSelected);
 const annual=timeline.currentWindow?.annual;
 const sourceRef=`BAZI_FULL_REPORT:${r.summary.reportDigest}`;
 const topicRef=(code,key)=>`${sourceRef}#professionalModules/customerNarrative/topicNarratives/${r.professionalModules.customerNarrative.topicNarratives.findIndex(t=>t.topicCode===code)}/${key}`;
 const pages=[],internalPages=[],seenParagraphs=new Set(),seenBoundaries=new Set();
 for(let n=7;n<=26;n++){
  const source=originals.find(p=>p.pageNumber===({7:8,8:7}[n]||n)),definition=publicationPageDefinition('BZR',n);
  const topicCode=topicMap[n],topic=r.professionalModules.customerNarrative.topicNarratives.find(t=>t.topicCode===topicCode);
  const prompts=(r.professionalModules.realityBridge.topicPrompts||[]).filter(t=>t.topicCode===topicCode).flatMap(t=>t.prompts||[]);
  let statements=source.insights.map(i=>({text:i.text,sourceRef:i.sourceRef}));
  if(topic)statements=['lead','development'].filter(k=>topic[k]?.[language]).map(k=>({text:topic[k][language],sourceRef:topicRef(topicCode,k)}));
  let boundary=topic?.condition?.[language]||source.boundaryText;
  let observation=prompts.find(p=>p.promptType==='REPEAT_OR_CONTEXT')?.prompt?.[language]||'';
  let counter=prompts.find(p=>p.promptType==='COUNTEREXAMPLE')?.prompt?.[language]||'';
  if(n===20||n===21){
   statements=[{text:pick(`This reading is anchored to ${temporalContext.localDate} in ${temporalContext.timezone}. The birth chart remains the baseline; the time layers below show the selected observation window.`,`本次读取以 ${temporalContext.timezone} 的 ${temporalContext.localDate} 为观察时点。本命结构保持不变，下面的时间层用于定位这一阶段。`),sourceRef:`${sourceRef}#professionalModules/professionalTimeline/targetContext`}];
   boundary=pick('A time layer helps frame a comparison; it does not establish that an event has happened or will happen.','时间层用于界定对照范围，不能据此认定某件事已经发生或必然发生。');
  }
  if(n>=22&&n<=25){
   observation=observation||source.insights.at(-1)?.text||'';
   if(n===22)statements=[{text:pick('Use the work theme below as a question to investigate, then compare two concrete situations: one that fits the reading and one that differs. Your observations remain independent of the chart.','把下面的工作主题当作待核对的问题，再比较两个具体情境：一个与读取相符，另一个并不相符。现实记录始终独立于命盘。'),sourceRef:`${sourceRef}#professionalModules/realityBridge`},...statements.slice(0,1)];
   if(n===23)statements=[{text:pick(`For the observation window beginning ${temporalContext.localDate}, look back at how responsibility, support and output interact in your work. Record examples before deciding whether the theme fits.`,`以 ${temporalContext.localDate} 为观察起点，回看工作中的责任、支持与产出怎样相互作用。先记录例子，再判断这个主题是否贴近经验。`),sourceRef:`${sourceRef}#professionalModules/realityBridge`},...statements.slice(0,1)];
   if(n===25){const lead=r.professionalModules.customerNarrative.topicNarratives.find(t=>t.topicCode==='CAREER');statements=[{text:lead.lead[language],sourceRef:topicRef('CAREER','lead')},{text:pick('Choose one recent work situation. Describe the responsibility you carried, the support actually available, and what changed when the setting changed. Try one small, reversible adjustment; keep the example that challenges your first reading as well as the one that supports it.','选一个最近的工作情境，写下你承担的责任、实际获得的支持，以及环境改变后出现的差异。尝试一个可撤回的小调整；既保留支持最初理解的例子，也保留挑战它的例子。'),sourceRef:`${sourceRef}#professionalModules/realityBridge`}];}
  }
  if(n===26){statements=[{text:pick('Your report brings together the calculated birth structure, the method reading and a dated observation window. Use it to ask more precise questions about experience, rather than to turn an interpretation into a fixed identity.','这份报告连接了计算所得的出生结构、方法解读与带日期的观察范围。你可以用它更具体地提问，而不是把一次解读变成固定的自我定义。'),sourceRef:`${sourceRef}#professionalModules/customerSafeGraph`}];boundary=pick('Keep the chart, its interpretation and your lived evidence distinct. Return to the report when you have a concrete example to compare.','让命盘、解读与真实经验保持各自的边界。有了具体例子，再回到报告中对照。');observation='';counter='';}
  const structuralExplanation={
   7:['Read the four pillars from year to hour. Keeping the visible stems, branches and hidden stems distinct gives you a stable way to return to each part of the chart without turning one symbol into a description of your whole life.','从年柱到时柱阅读四柱。把天干、地支与藏干分别看清，能帮助你回到命盘中的具体位置，而不把单一符号当成整个人生的描述。'],
   8:['The Day Master is the reference point for this reading. Its position beside the month branch lets you consider the self-reference and the seasonal setting together, before reaching any judgment about strength.','日主是这次读取的参照点。把它与月支放在一起，是为了同时看见自我参照与季节背景，再讨论可能的强弱关系。'],
   9:['The distribution distinguishes the elements recorded in the chart. Use the table to see where each count comes from; a larger count alone does not tell you what you should become or what you lack in daily life.','这张分布图区分命盘中记录的五行。你可以通过表格看清每个计数来自哪里；数量较多本身，并不能说明你应该成为什么人，或现实生活中缺少什么。'],
   10:['The connecting lines show two different relationships: generation and control. Follow one connection at a time and keep its direction in view. A relationship between symbols is a way of reading the chart, not a measurement of how strongly two people or events affect you.','连线呈现两类不同关系：相生与相克。每次沿一条线阅读，并留意方向。符号之间的关系用于理解命盘，不是在测量两个人或两件事对你的影响强度。']
  };
  if(structuralExplanation[n])statements=[{text:pick(...structuralExplanation[n]),sourceRef:source.evidenceRefs[0]}];
  if(n===21)statements=[{text:pick(`At the selected observation time, the year pillar is ${annual?annual.stem.zh+annual.branch.zh:''}${selected?', alongside the '+selected.pillar.stem.zh+selected.pillar.branch.zh+' luck cycle':''}. Compare this time window with the birth structure before relating it to your experience. These are different layers, not interchangeable descriptions of you.`,`在所选观察时点，流年为${annual?annual.stem.zh+annual.branch.zh:''}${selected?'，大运为'+selected.pillar.stem.zh+selected.pillar.branch.zh:''}。把这一时间范围放回本命结构中比较，再联系实际经验；不同时间层并不是可以互相替代的自我描述。`),sourceRef:`${sourceRef}#professionalModules/professionalTimeline/currentWindow`}];
  if(n===25)statements[0]={text:pick(`Return to the work reading for this chart: ${r.professionalModules.customerNarrative.topicNarratives.find(t=>t.topicCode==='CAREER').development.en.split('. ')[0]}. Use that emphasis to choose the situation you will examine, rather than treating the following steps as a general instruction for everyone.`,`回到这张命盘的事业读取：${r.professionalModules.customerNarrative.topicNarratives.find(t=>t.topicCode==='CAREER').development.zhHans.split('。')[0]}。用这个重点选择你要观察的情境，而不是把下面的步骤当成适用于所有人的统一答案。`),sourceRef:topicRef('CAREER','development')};
  if(noTarget&&(n===20||n===21)){statements=[{text:pick('The calculated luck-cycle sequence is available. No observation window was selected, so this report does not select a current luck cycle or annual layer.','已计算的大运序列仍然可用。本次未选择观察时点，因此报告不选择当前大运或流年层。'),sourceRef:`${sourceRef}#professionalModules/professionalTimeline`}];boundary=pick('A sequence is not a current-period selection or an event prediction.','周期序列不等于当前阶段选择，也不是事件预测。');observation='';counter='';}
  if(noTarget&&n===26)statements=[{text:pick('Your report brings together the calculated birth structure and the admitted method reading. Compare it with independent experience; no current-period selection is implied.','报告连接计算所得的出生结构与已准入方法解读。请与独立经验比较；本次不暗示已选择当前时间层。'),sourceRef:`${sourceRef}#professionalModules/customerSafeGraph`}];
  statements=statements.filter(s=>!seenParagraphs.has(s.text));
  boundary=humanizePublicationStatement(boundary);observation=humanizePublicationStatement(observation);counter=humanizePublicationStatement(counter);
  if(seenBoundaries.has(boundary))boundary='';
  if(boundary)seenBoundaries.add(boundary);
  // A source-bound explanation is necessary even when provider admission is absent.
  if(!statements.length)statements=[{text:source.question,sourceRef:source.evidenceRefs[0]}];
  const interpretation=await compilePublicationInterpretation({methodId:'BZR',page:source,temporalContext,allowedStatements:statements,conditions:[boundary],counterSignals:counter?[counter]:[],realityQuestions:observation?[observation]:[]});
  const narrative=await composePublicationNarrative({interpretation,locale,executionClass:definition.executionClass,...composition});
  for(const paragraph of narrative.paragraphs)seenParagraphs.add(paragraph);
  pages.push({pageNumber:n,pageKey:definition.pageKey,section:definition.section,contentType:definition.contentType,visualVariant:definition.visualVariant,title:n===26?pick('A reading to return to','带着理解，回到生活'):definition.title[locale],lead:n===26?pick('What would you like to understand more clearly?','接下来，你想更清楚地理解什么？'):source.question,paragraphs:narrative.paragraphs,boundary,observation,counterSignal:counter,customerVisible:true,sourcePageNumber:source.pageNumber,
   provenanceHighlights:n===26?[pick('Birth structure established','命盘结构已建立'),pick('Method sources retained','方法证据已追溯'),pick('Interpretation boundaries preserved','解读边界已保留'),pick('Observation time saved','观察时间已保存'),pick('Lived evidence remains independent','现实证据保持独立')]:[],
   // Only visible diagram fields cross to the customer projection.
   facts:(n===26?[]:interpretation.canonicalFacts.filter(f=>typeof f.value==='number'&&Number.isFinite(f.value))).map(({label,value})=>({label,...(value!==undefined?{value}:{} )})),
   temporal:!noTarget&&n>=20&&n<=24?{date:temporalContext.localDate,timezone:temporalContext.timezone,mode:temporalContext.mode,selectedLuck:selected?`${selected.pillar.stem.zh}${selected.pillar.branch.zh}`:null,annual:annual?`${annual.stem.zh}${annual.branch.zh}`:null}:null});
  internalPages.push({pageNumber:n,internalOnly:true,interpretation,composition:narrative.internalOnly,sourcePage:source});
 }
 return {versions:PUBLICATION_VERSIONS,pages,internalPages,reports};
}
