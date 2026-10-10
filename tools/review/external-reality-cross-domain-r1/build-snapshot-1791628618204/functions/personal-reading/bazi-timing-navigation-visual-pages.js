// Batches 4/5 are subordinate presentations of admitted reading modules.
// No clock lookup, timing calculation, reality adjudication or opportunity verdict.
import {projectBaziStructuralBatch} from './bazi-structural-visual-pages.js';
import {visualProjectionBuilder} from './visual-report-projection-utils.js';
export function projectBaziTimingNavigationBatch(options){
 const base=projectBaziStructuralBatch(options),{reading:r,locale,depth,reviewMode,batch}=options,m=r.professionalModules;
 if(!['BAZI-DYNAMIC-R1-BATCH-04','BAZI-DYNAMIC-R1-BATCH-05'].includes(batch))throw Error('BAZI_FINAL_BATCH_UNKNOWN');
 const t=(en,zh)=>locale==='bilingual'?`${zh} / ${en}`:locale==='zh-Hans'?zh:en;
 const b=visualProjectionBuilder({methodId:base.methodId,productId:base.productId,sourceReportRef:base.sourceReportRef,sourceProjectionId:base.sourceProjectionId,locale:locale==='bilingual'?'zh-Hans':locale,depth,reviewMode,identity:base.identity}),ref=b.ref;
 const localized=x=>{if(!x||!['en','zhHans'].every(k=>typeof x[k]==='string'&&x[k].trim()))throw Error('BAZI_FINAL_COPY_REQUIRED');return t(x.en,x.zhHans);};
 const node=(id,label,value,path,extra={})=>({id,label,value,sourceRefs:[ref(path)],...extra});
 const add=(number,title,question,templateId,type,nodes,insights,extra={})=>{
  b.add({id:`P${number}`,pageNumber:number,title:t(...title),question:t(...question),templateId,type,nodes,insights:insights.map(([text,path])=>({text,sourceRef:ref(path)})),boundaryText:t('Method structure is not lived evidence or a predicted outcome.','方法结构不等于现实证据，也不是结果预测。'),visualTemplateId:number<23?'M07':'M08',reportIdentity:base.productId,accessState:extra.accessState||'OPEN',visualDesign:structuredClone(base.pages[0].visualDesign),informationUnitRefs:[...new Set(nodes.flatMap(n=>n.sourceRefs))]});
  const p=b.pages.at(-1);p.visual={...p.visual,context:base.pages[0].visual.context,unit:t('Source-bound structure; no accuracy or energy score.','有来源的结构；不生成准确率或能量评分。'),...extra};
  const extraRefs=extra.sourceRefs||[];p.visual.dataRefs=[...new Set([...p.visual.dataRefs,...extraRefs])];p.evidenceRefs=[...new Set([...p.evidenceRefs,...extraRefs])];
 };
 if(batch.endsWith('04')){
  const tl=m.professionalTimeline,w=tl?.currentWindow,cycles=tl?.daYunTimeline;
  if(!tl||!['UNAVAILABLE','EXPLICIT'].includes(tl.state)||!w||!['NO_TARGET','FULL','DA_YUN_ONLY','LIU_NIAN_ONLY'].includes(w.completeness)||!Array.isArray(cycles)||!cycles.length||!tl.boundaries?.natalPriorityRemainsBaseline||tl.boundaries.currentDateInferred!==false||tl.boundaries.browserTimezoneInferred!==false)throw Error('BAZI_TIMING_SOURCE_REQUIRED');
  if(tl.state==='UNAVAILABLE'&&(tl.targetContext!==null||w.available||w.completeness!=='NO_TARGET'||w.currentDaYun||w.annual||cycles.some(x=>x.isSelected)))throw Error('BAZI_TIMING_NO_TARGET_CONTRADICTION');
  if(tl.state==='EXPLICIT'&&(!tl.targetContext?.targetDate||!tl.targetContext.targetTime||!tl.targetContext.targetTimezone?.iana||!tl.targetContext.targetTimezone.utcOffsetAtTarget||!w.available||w.completeness==='NO_TARGET'))throw Error('BAZI_TIMING_TARGET_REQUIRED');
  const glyph=p=>{if(!p?.stem?.zh||!p.branch?.zh)throw Error('BAZI_TIMING_PILLAR_REQUIRED');return p.stem.zh+p.branch.zh;};
  const seen=new Set();const bands=cycles.map((c,i)=>{
   if(!Number.isInteger(c.cycleNumber)||seen.has(c.cycleNumber)||!Number.isFinite(c.startAge)||!Number.isFinite(c.endAge)||c.endAge<=c.startAge||typeof c.isSelected!=='boolean'||(i&&c.startAge<cycles[i-1].endAge))throw Error('BAZI_TIMING_CYCLE_INVALID');seen.add(c.cycleNumber);
   if(c.certainty!=='DETERMINISTIC')throw Error('BAZI_TIMING_CERTAINTY_UNSUPPORTED');
   return node(`CYCLE-${c.cycleNumber}`,`${c.startAge}–${c.endAge}`,glyph(c.pillar),`professionalModules/professionalTimeline/daYunTimeline/${i}`,{cycleNumber:c.cycleNumber,startAge:c.startAge,endAge:c.endAge,selected:c.isSelected,certainty:c.certainty});
  });
  if(w.currentDaYun){const matches=bands.filter(x=>x.selected);if(matches.length!==1||matches[0].cycleNumber!==w.currentDaYun.cycleNumber||matches[0].value!==glyph(w.currentDaYun.pillar))throw Error('BAZI_TIMING_SELECTION_MISMATCH');}else if(bands.some(x=>x.selected))throw Error('BAZI_TIMING_SELECTION_MISMATCH');
  if((w.completeness==='FULL'&&(!w.currentDaYun||!w.annual))||(w.completeness==='DA_YUN_ONLY'&&(!w.currentDaYun||w.annual))||(w.completeness==='LIU_NIAN_ONLY'&&(w.currentDaYun||!w.annual)))throw Error('BAZI_TIMING_COMPLETENESS_MISMATCH');
  if(w.annual&&!Number.isInteger(w.annual.year))throw Error('BAZI_TIMING_ANNUAL_REQUIRED');
  const noTarget=t('No target selected','未选择目标时间'),missing=t('Unavailable','不可用');
  const selection=tl.targetContext?`${tl.targetContext.targetDate} ${tl.targetContext.targetTime} · ${tl.targetContext.targetTimezone.iana} ${tl.targetContext.targetTimezone.utcOffsetAtTarget}`:noTarget;
  const shared={bands,annualAvailable:!!w.annual,cycleAvailable:!!w.currentDaYun,target:tl.targetContext,selection,completeness:w.completeness,sourceRefs:[ref('professionalModules/professionalTimeline'),ref('temporalContext')]};
  add(20,['Timing Architecture','时间结构'],['Which time layers are actually available?','实际有哪些可用的时间层？'],'RPT-T06','TIMELINE',bands,[[t('Age bands preserve the source sequence.','年龄阶段保留来源顺序。'),'professionalModules/professionalTimeline/daYunTimeline'],[t('No target means no current-period selection.','没有目标时间，就不选择当前周期。'),'professionalModules/professionalTimeline/boundaries']],shared);
  const periodNodes=[node('NATAL',t('Natal baseline','本命基线'),r.structuralModel.pillars.map(p=>p.stem.zh+p.branch.zh).join(' · '),'structuralModel/pillars'),node('DA_YUN',t('Selected luck pillar','所选大运'),w.currentDaYun?glyph(w.currentDaYun.pillar):missing,'professionalModules/professionalTimeline/currentWindow/currentDaYun',{available:!!w.currentDaYun}),node('ANNUAL',t('Selected annual pillar','所选流年'),w.annual?`${w.annual.year} · ${glyph(w.annual)}`:missing,'professionalModules/professionalTimeline/currentWindow/annual',{available:!!w.annual})];
  add(21,['Current or Selected Period','当前／所选周期'],['What belongs to the selected time window?','哪些内容属于所选时间窗口？'],'RPT-T09','LAYER_STACK',periodNodes,[[t('The selected window does not replace the natal baseline.','所选窗口不替代本命基线。'),'professionalModules/professionalTimeline/boundaries']],{...shared,accessState:tl.state==='UNAVAILABLE'?'DATA_REQUIRED':w.completeness==='FULL'?'OPEN':'CONDITIONAL'});
  // This reading envelope contains method-side comparison metadata and prompts,
  // not independently admitted Current Reality observations or counter-evidence.
  if(!m.realityComparison?.boundaries||m.realityComparison.boundaries.customerResonanceIsEvidence!==false)throw Error('BAZI_REALITY_BOUNDARY_REQUIRED');
  if('currentEvidence' in m.realityComparison||'counterEvidence' in m.realityComparison||'comparisonStatus' in m.realityComparison)throw Error('BAZI_REALITY_ADMISSION_CONTRACT_UNSUPPORTED');
  const rows=[
   node('METHOD_PROJECTION',t('METHOD PROJECTION','方法投射'),t('Natal structure + available timing','本命结构＋可用时间层'),'professionalModules/professionalTimeline'),
   node('CURRENT_EVIDENCE',t('CURRENT EVIDENCE','当前证据'),t('Not supplied','未提供'),'professionalModules/realityComparison/boundaries'),
   node('COUNTER_EVIDENCE',t('COUNTER-EVIDENCE','反向证据'),t('Not supplied; not treated as absent','未提供；不视为不存在'),'professionalModules/realityComparison/boundaries'),
   node('STATUS',t('STATUS','状态'),t('Not compared','尚未比较'),'professionalModules/realityComparison/boundaries'),
   node('WHY',t('WHY','原因'),t('Independent observations are required','需要独立的现实观察记录'),'professionalModules/realityComparison/boundaries')
  ];
  add(22,['Current Reality Comparison','当前现实对照'],['What can be compared with independent observations?','哪些内容可与独立观察比较？'],'RPT-T08','SPLIT_COMPARE',rows,[[t('Method evidence is not Current Reality evidence.','方法证据不等于当前现实证据。'),'professionalModules/realityComparison/boundaries']],{accessState:'DATA_REQUIRED',comparisonState:'NOT_COMPARED',currentEvidenceState:'NOT_SUPPLIED',counterEvidenceState:'NOT_SUPPLIED'});
 }else{
  const bridge=m.realityBridge,topics=m.customerNarrative?.topicNarratives,graph=m.customerSafeGraph;
  if(!bridge?.boundaries||bridge.boundaries.customerAnswerChangesMethodVerdict!==false||bridge.boundaries.counterEvidenceWelcome!==true||!Array.isArray(bridge.topicPrompts)||!Array.isArray(topics)||!graph?.lineage||!graph.summary)throw Error('BAZI_NAVIGATION_SOURCE_REQUIRED');
  const prompt=(code,type)=>{const i=bridge.topicPrompts.findIndex(x=>x.topicCode===code),j=bridge.topicPrompts[i]?.prompts.findIndex(x=>x.promptType===type),p=bridge.topicPrompts[i]?.prompts[j];if(!p?.promptId)throw Error('BAZI_NAVIGATION_PROMPT_REQUIRED');return {text:localized(p.prompt),path:`professionalModules/realityBridge/topicPrompts/${i}/prompts/${j}/prompt`};};
  const career=prompt('CAREER','REPEAT_OR_CONTEXT'),counter=prompt('CAREER','COUNTEREXAMPLE'),support=prompt('PRESSURE','COUNTEREXAMPLE');
  const cue=(id,en,zh,value,path)=>node(id,t(en,zh),value,path,{secondary:value});
  add(23,['Observable Signals','可观察信号'],['When should the method theme be compared with experience?','何时将方法主题与经验对照？'],'RPT-T13','FLOW',[
   cue('WHEN','WHEN','何时',t('Across work settings','跨不同工作情境'),career.path),cue('OBSERVE','OBSERVE','观察',career.text,career.path),cue('COUNTER_SIGNAL','COUNTER-SIGNAL','反向信号',counter.text,counter.path)
  ],[[t('These are observation prompts, not observed facts.','这些是观察提示，并非已观察到的事实。'),'professionalModules/realityBridge/boundaries']],{promptMode:'QUESTIONS_NOT_PREDICTIONS'});
  const ci=topics.findIndex(x=>x.topicCode==='CAPABILITY');if(ci<0)throw Error('BAZI_NAVIGATION_CONDITION_REQUIRED');
  add(24,['Opportunities & Risks','机会与风险'],['Which support and carrying conditions deserve investigation?','哪些支持与承载条件值得查证？'],'RPT-T08','SPLIT_COMPARE',[
   cue('OPPORTUNITY','OPPORTUNITY','机会',support.text,support.path),cue('CONDITION','CONDITION','条件',localized(topics[ci].condition),`professionalModules/customerNarrative/topicNarratives/${ci}/condition`),cue('RISK','RISK','风险',counter.text,counter.path)
  ],[[t('Exploration questions, not predictions.','探索问题，并非预测。'),'professionalModules/realityBridge/boundaries']],{promptMode:'QUESTIONS_NOT_PREDICTIONS'});
  const process=[['NOTICE','NOTICE','觉察','Record a concrete situation.','记录一个具体情境。',career.path],['COMPARE','COMPARE','比较','Look for a contrasting example.','寻找一个相反的例子。',counter.path],['TEST','TEST','测试','Choose a small, reversible test.','选择小规模、可逆的测试。','professionalModules/realityBridge/boundaries'],['REVIEW','REVIEW','回顾','Review observations and what changed.','回顾观察记录及变化。','professionalModules/realityBridge/boundaries']];
  add(25,['Reality Navigation','现实导航'],['How can observation lead to a reviewable next step?','如何从观察走向可回顾的下一步？'],'RPT-T11','FLOW',process.map(([id,en,zh,a,z,path])=>cue(id,en,zh,t(a,z),path)),[[t('This is an observation workflow, not a method verdict.','这是观察流程，不是方法判断。'),'professionalModules/realityBridge/boundaries']],{navigationMode:'USER_REQUESTED_OBSERVATION_WORKFLOW'});
  const fields=[['sourceFindingCount','Findings','发现'],['sourceEvidenceCount','Method evidence','方法证据'],['sourceAuthorityCount','Authorities','来源权限'],['sourceUnknownCount','Open items','开放事项']];
  if(fields.some(([k])=>!Number.isInteger(graph.summary[k])||graph.summary[k]<0)||!r.evidence?.sourceNatalProjectionId||!r.summary.reportDigest)throw Error('BAZI_LINEAGE_SOURCE_REQUIRED');
  const lineage=[node('NATAL',t('Chart calculation','排盘'),r.evidence.sourceNatalProjectionId,'evidence/sourceNatalProjectionId'),node('READING',t('Method reading','方法读取'),r.summary.reportDigest,'summary/reportDigest'),node('MODULES',t('Interpretation','解读'),graph.lineage.customerProjectionOwner,'professionalModules/customerSafeGraph/lineage'),node('PAGE_IR',t('Report','报告'),base.sourceReportRef,'summary/reportDigest')];
  add(26,['Evidence, Boundary & Closing','证据、边界与结语'],['Which lineage supports this report, and what remains open?','哪些来源支持报告，哪些仍保持开放？'],'RPT-T14','NETWORK',lineage,[[t('Current Reality evidence remains separate.','当前现实证据保持独立。'),'professionalModules/realityComparison/boundaries'],[t('Your life, in context.','在情境中理解你的人生。'),'professionalModules/realityBridge/boundaries']],{lineage,trace:fields.map(([key,en,zh])=>node(key,t(en,zh),graph.summary[key],`professionalModules/customerSafeGraph/summary/${key}`)),sourceRefs:fields.map(([key])=>ref(`professionalModules/customerSafeGraph/summary/${key}`))});
 }
 return {...b.finish(),locale,visualBatch:batch,totalPages:26,batchPageRange:batch.endsWith('04')?[20,22]:[23,26],reviewMode:true};
}
