import {projectBaziPublicationPages} from './bazi-visual-report-projection.js';
import {buildBaziPublicationVisual} from '../canonical-presentation-runtime/bazi-publication-visuals.js';
import {compilePublicationInterpretation} from './narrative/narrative-brief-compiler.js';
import {composePublicationNarrative,humanizePublicationStatement} from './narrative/narrative-writer.js';
import {BAZI_SECTION_EDITORIAL} from './bazi-section-editorial.js';
import {buildSectionEvidencePack,T3_SECTIONS,crossSectionEditorialCheck} from './narrative/bazi-editorial-contract.js';
import {composeBaziT3Section,canShowT3} from './narrative/bazi-t3-composition.js';
import {BAZI_SECTION_REGISTRY,REPORT_PAGE_FAMILIES,validateSectionRegistry,bindSectionVisual,splitSemanticBlocks,textUnits} from '../canonical-presentation-runtime/report-section-contract.js';

// Adapter inside the existing projection owner: native facts are calculated
// upstream. The section engine never interprets raw birth data.
export async function projectBaziSectionPublication({reading,locale,temporalContext,composition={},unavailableModules=[]}={}){
 validateSectionRegistry();
 const legacy=await projectBaziPublicationPages({reading,locale,temporalContext});
 const lang=locale==='en'?'en':'zhHans',pick=(en,zh)=>locale==='en'?en:zh;
 const source=n=>legacy.pages.find(p=>p.pageNumber===n),internal=n=>legacy.internalPages.find(p=>p.pageNumber===n).interpretation;
 const topics=reading.professionalModules.customerNarrative.topicNarratives;
 const topic=code=>topics.find(t=>t.topicCode===code);
 const modules={},block=(text,sourceRef,role='EDITORIAL_GUIDANCE')=>({text:humanizePublicationStatement(text),sourceRef,role});
 const edRef='functions/personal-reading/bazi-section-editorial.js';
 const paragraphs=(key,texts,sourceRef)=>modules[key]={blocks:texts.filter(Boolean).map(t=>block(t,sourceRef))};
 const e=s=>BAZI_SECTION_EDITORIAL[s];
 const makeNarrative=(key,section,code)=>{
  const t=topic(code);if(!t)return;
  const idx=topics.indexOf(t),ref=`professionalModules/customerNarrative/topicNarratives/${idx}`;
  modules[key]={blocks:[block(t.lead[lang],`${ref}/lead`,'METHOD_INTERPRETATION'),block(t.development[lang],`${ref}/development`,'METHOD_INTERPRETATION'),block(e(section).bridge[locale],`${edRef}#${section}`)],boundary:humanizePublicationStatement(t.condition[lang])};
 };
 for(const [key,n] of [['baziChart',7],['dayMaster',8],['fiveElements',9],['chartStructure',12],['usefulElements',14]])modules[key]={blocks:[],sourcePages:[n],facts:source(n).facts,evidence:internal(n).evidence};
 modules.baziChart.blocks=[block(e('S01_OVERVIEW').bridge[locale],`${edRef}#S01_OVERVIEW`)];
 modules.chartStructure.blocks=[block(source(12).paragraphs.concat(source(13).paragraphs).join(' '),internal(12).evidence[0],'METHOD_INTERPRETATION'),block(pick('Read each candidate alongside the conditions that would establish it, keeping a visible path separate from a completed judgment.','请把候选模式与成立所需的条件一起阅读，分清路径可见与判断完成之间的差别。'),`${edRef}#S03_LIFE_STRUCTURE`)];
 modules.chartStructure.boundary=source(12).boundary;
 makeNarrative('personalityNarrative','S02_PERSONALITY','CAPABILITY');
 makeNarrative('lifeStructureNarrative','S03_LIFE_STRUCTURE','LIFE_OPERATION');
 makeNarrative('careerNarrative','S04_CAREER','CAREER');
 makeNarrative('wealthNarrative','S05_WEALTH','WEALTH');
 makeNarrative('relationshipNarrative','S06_RELATIONSHIP','RELATIONSHIPS');
 paragraphs('healthNarrative',[e('S07_HEALTH').bridge[locale],pick('Keep a distinction between a busy schedule, your own description of strain, and any explanation proposed for it. Neither an element count nor a pressure symbol can establish a bodily cause. If you revisit this chapter later, compare the circumstances you recorded, rather than looking for a predicted condition to confirm. Your experience may change while the birth chart remains the same.','请区分繁忙的安排、自己感受到的负担，以及对它提出的解释。五行数量或压力符号都不能建立身体病因。以后回到本章时，比较记录中的实际情境，而不是寻找某种预测中的状态。出生结构保持不变，经验仍可能随环境而改变。')],`${edRef}#S07_HEALTH`);
 const itemMap={chartHighlights:'S01_OVERVIEW',strengths:'S02_PERSONALITY',careerFields:'S04_CAREER',financialAdvice:'S05_WEALTH',relationshipAdvice:'S06_RELATIONSHIP',wellnessAdvice:'S07_HEALTH',nextSteps:'S09_GUIDANCE'};
 for(const [key,section] of Object.entries(itemMap))modules[key]={blocks:[],items:e(section).items.map(i=>block(i[locale],`${edRef}#${section}`))};
 // Strengths, challenges and social style share the admitted observation set;
 // they are not fabricated independent measurements.
 modules.challenges={blocks:[]};modules.socialStyle={blocks:[]};
 modules.timingContext={blocks:[block(source(20).paragraphs[0],internal(20).evidence[0],'METHOD_INTERPRETATION'),block(e('S08_TIMING').bridge[locale],`${edRef}#S08_TIMING`)],temporal:{...source(20).temporal,generatedAt:temporalContext.generatedAt,localTime:temporalContext.localTime},observations:e('S08_TIMING').items.slice(0,2).map(x=>x[locale]),boundary:source(20).boundary};
 modules.currentYearInsight={blocks:source(21).paragraphs.map(t=>block(t,internal(21).evidence[0],'METHOD_INTERPRETATION')),temporal:modules.timingContext.temporal,observations:[e('S08_TIMING').items[2][locale],pick('What stayed consistent across the year boundary, despite the change in the named time layer?','时间层名称改变前后，哪些经验仍然保持一致？')],boundary:pick('The year layer frames observation; this reading does not identify specific events as opportunities or warnings.','流年层用于界定观察范围；本次读取不把具体事件判断为机会或预警。')};
 // Optional career timing is absent unless an upstream adapter supplies an
 // admitted career-specific module. Generic current-year data is insufficient.
 paragraphs('integratedGuidance',[e('S09_GUIDANCE').bridge[locale]],`${edRef}#S09_GUIDANCE`);
 modules.integratedGuidance.items=['CAREER','WEALTH','RELATIONSHIPS'].map(code=>block(topic(code).lead[lang],`professionalModules/customerNarrative/topicNarratives/${topics.indexOf(topic(code))}/lead`,'METHOD_INTERPRETATION'));
 paragraphs('boundaries',[e('S10_APPENDIX').bridge[locale]],`${edRef}#S10_APPENDIX`);
 paragraphs('methodology',[pick('BaZi organizes a birth reading around four pillars and uses the Day Master as a reference position. The diagrams in this report preserve the distinctions between visible stems, branches, hidden stems and element counts. Structural candidates are shown with their conditions, so an open pattern remains open rather than becoming a final verdict. The timing chapter adds only the layers resolved by the existing method engine for the saved observation window. These layers accompany the birth structure; they do not replace it. Read the prose as a bounded explanation of that structure, then compare it with independent experience.','八字围绕四柱组织出生读取，并以日主作为参照位置。本报告的图表区分天干、地支、藏干与五行计数；结构候选与成立条件一同呈现，因此仍开放的格局不会被写成最终判断。时间章节只加入既有方法引擎针对保存的观察窗口所解析的层次，它们与本命结构一起阅读，不取代本命。请把文字看作有范围的结构说明，再用独立经验来比较。')],`${edRef}#S10_APPENDIX`);
 for(const name of unavailableModules)delete modules[name];
 const sections=[],internalSections=[],pages=[],t3Interpretations=[];
 for(const section of BAZI_SECTION_REGISTRY.sections){
  const editorial=e(section.key),sourceNumbers=({S01_OVERVIEW:[7,8,9],S02_PERSONALITY:[14],S03_LIFE_STRUCTURE:[11,12,13,14,15],S04_CAREER:[18],S05_WEALTH:[19],S06_RELATIONSHIP:[17],S07_HEALTH:[24],S08_TIMING:[20,21],S09_GUIDANCE:[16,18,19,17],S10_APPENDIX:[26]})[section.key];
  const sourcePage=legacy.reports.flatMap(r=>r.pages).find(p=>p.pageNumber===sourceNumbers[0]);
  const definitions=section.pages.slice(1).filter(p=>!p.optional||p.dataModules.every(k=>modules[k]));
  const pageBlocks=[];
  for(const def of definitions){
   if(def.primaryVisualRef){
    const count=def.primaryVisualRef==='BZR-VIS-TEN-GOD-DETAILS'?reading.professionalModules.tenGods.items.length:1;
    for(let offset=0;offset<count;offset+=4){const visual=buildBaziPublicationVisual({reading,primaryVisualRef:def.primaryVisualRef,locale,topicCode:def.visualTopic,offset});
     pageBlocks.push({definitionKey:def.key,visualContinuation:offset?`_CONT_${offset/4+1}`:'',pageFamily:def.family,title:def.title[locale],contentBlocks:def.primaryVisualRef==='BZR-VIS-FOUR-PILLARS'?modules.baziChart.blocks:[],items:[],sourcePages:[],facts:[],observations:[],boundary:visual.boundary,primaryVisualRef:visual.primaryVisualRef,primaryVisualHtml:visual.primaryVisualHtml});
    }continue;
   }
   const selected=def.dataModules.map(k=>modules[k]).filter(Boolean),blocks=selected.flatMap(m=>m.blocks||[]),items=selected.flatMap(m=>m.items||[]);
   if(def.omitWhenInsufficient&&(!selected.length||def.family==='INSIGHT_LIST_PAGE'&&items.length<3))continue;
   if(!selected.length)throw Error(`SECTION_REQUIRED_MODULE_MISSING:${def.key}`);
   pageBlocks.push({definitionKey:def.key,pageFamily:def.family,title:def.title[locale],contentBlocks:blocks,items,sourcePages:selected.flatMap(m=>m.sourcePages||[]),facts:selected.flatMap(m=>m.facts||[]),temporal:selected.find(m=>m.temporal)?.temporal||null,observations:selected.flatMap(m=>m.observations||[]),boundary:selected.map(m=>m.boundary).filter(Boolean).join(' ')});
  }
  const sectionObject={sectionKey:section.key,title:section.title,openerIntro:editorial.intro[locale],keyThemes:pageBlocks.map(p=>p.title),pageBlocks,boundaryNotes:pageBlocks.map(p=>p.boundary).filter(Boolean),practicalObservations:pageBlocks.flatMap(p=>p.observations),temporalContext};
  const narrative=pageBlocks.find(p=>p.pageFamily==='NARRATIVE_ANALYSIS_PAGE'||p.pageFamily==='SUMMARY_PAGE');
  const allowed=(narrative||pageBlocks.find(p=>p.contentBlocks.length)||pageBlocks[0]).contentBlocks;
  const interpretation=await compilePublicationInterpretation({methodId:'BZR',page:{...sourcePage,pageId:section.key,evidenceRefs:[...new Set(sourceNumbers.flatMap(n=>internal(n).evidence))]},temporalContext,allowedStatements:allowed.map(b=>({text:b.text,sourceRef:b.sourceRef})),conditions:sectionObject.boundaryNotes,realityQuestions:sectionObject.practicalObservations});
  const composed=await composePublicationNarrative({interpretation,locale,executionClass:narrative?'T3_DEEP_COMPOSITION':'T2_LIGHT_COMPOSITION',...composition,...(composition.t3?{providerAdapters:{}}:{}),sectionComposition:sectionObject});
  if(narrative&&composed.internalOnly.evidenceAdmission==='SEMANTIC_VERIFIER_ACCEPTED'){
   const maximum=REPORT_PAGE_FAMILIES[narrative.pageFamily].budget[locale==='en'?'en':'zh']?.[1]||500;
   if(composed.paragraphs.every(text=>textUnits(text,locale)<=maximum))narrative.contentBlocks=composed.paragraphs.map(text=>block(text,section.key,'VERIFIED_SECTION_COMPOSITION'));
   else composed.internalOnly={...composed.internalOnly,executionClass:'T2_LIGHT_COMPOSITION',evidenceAdmission:'SOURCE_BOUND_CANONICAL_STATEMENTS',fallbackState:'DEEP_COMPOSITION_FALLBACK',fallbackReason:'COMPOSITION_BUDGET_REJECTED'};
  }
  let t3=null;
  if(composition.t3&&T3_SECTIONS.includes(section.key)){
   // Build from all deterministic pages in this section; timing includes both
   // the luck and annual layers. Guidance also receives prior admitted sections.
   const packInterpretation={...interpretation,canonicalFacts:[...new Map(sourceNumbers.flatMap(n=>internal(n).canonicalFacts).map(f=>[f.sourceRefs[0],f])).values()]};
   const topicCode=({S02_PERSONALITY:'CAPABILITY',S03_LIFE_STRUCTURE:'LIFE_OPERATION',S04_CAREER:'CAREER',S05_WEALTH:'WEALTH',S06_RELATIONSHIP:'RELATIONSHIPS',S07_HEALTH:'PRESSURE',S09_GUIDANCE:'LIFE_OPERATION'})[section.key];
   const prompts=(reading.professionalModules.realityBridge.topicPrompts||[]).filter(p=>p.topicCode===topicCode).flatMap(p=>p.prompts||[]);
   packInterpretation.counterSignals=prompts.filter(p=>p.promptType==='COUNTEREXAMPLE').map(p=>p.prompt[lang]);
   packInterpretation.realityQuestions=prompts.filter(p=>p.promptType==='REPEAT_OR_CONTEXT').map(p=>p.prompt[lang]);
   if(section.key==='S07_HEALTH'){
    const pressure=topic('PRESSURE');
    if(pressure){const ref=`professionalModules/customerNarrative/topicNarratives/${topics.indexOf(pressure)}`;packInterpretation.allowedInterpretations=['lead','development'].map(k=>({text:pressure[k][lang],sourceRef:`${ref}/${k}`}));packInterpretation.tensionSignals=[pressure.condition[lang]];}
   }
   if(section.key==='S08_TIMING'){
    packInterpretation.allowedInterpretations=sourceNumbers.flatMap(n=>internal(n).allowedInterpretations);
    packInterpretation.canonicalFacts.push({id:'SAVED_TEMPORAL_LAYERS',label:'Saved natal comparison window, luck cycle and year',displayValue:source(20).temporal,sourceRefs:[`${reading.summary.reportDigest}#professionalModules/professionalTimeline/currentWindow`]});
   }
   const relatedPriorities=(reading.professionalModules.customerNarrative.priorityChapters||[]).filter(p=>topic(topicCode)?.priorityRefs?.includes(p.priorityRef)||(section.key==='S08_TIMING'&&p.themeType==='TIMING'));
   for(const chapter of relatedPriorities){
    const index=reading.professionalModules.customerNarrative.priorityChapters.indexOf(chapter),ref=`professionalModules/customerNarrative/priorityChapters/${index}`;
    packInterpretation.allowedInterpretations=[...packInterpretation.allowedInterpretations,...['thesis','development','condition'].filter(k=>chapter[k]?.[lang]).map(k=>({text:chapter[k][lang],sourceRef:`${ref}/${k}`}))];
   }
   const pack=await buildSectionEvidencePack({interpretation:packInterpretation,locale,sectionKey:section.key,relatedInterpretations:t3Interpretations,reading});
   t3Interpretations.push(packInterpretation);
   t3=await composeBaziT3Section({pack,...composition,snapshot:composition.t3.snapshots?.[section.key]});
   t3.evidencePack=pack;
   if(t3.status==='PASS'&&canShowT3(composition.t3)){
    const n=t3.snapshot.finalNarrative,target=narrative||pageBlocks.find(p=>p.pageFamily==='TIMING_PAGE');
    const main=[n.lead,...n.interpretation,...n.howThisMayShowUp,n.closingInsight].filter(b=>b.text.trim());
    const secondary=pageBlocks.find(p=>p!==target&&['INSIGHT_LIST_PAGE','TIMING_PAGE'].includes(p.pageFamily));
    const secondaryBlocks=[...n.supportingConditions,...n.tensionConditions];
    if(!secondary)main.push(...secondaryBlocks);
    const maximum=REPORT_PAGE_FAMILIES[target.pageFamily].budget[locale==='en'?'en':'zh']?.[1]||500;
    // Preserve registered page families; too much text returns the whole
    // section to T2 rather than silently deleting claims or conditions.
    const listRange=REPORT_PAGE_FAMILIES.INSIGHT_LIST_PAGE.budget[locale==='en'?'enItem':'zhItem'];
    const listFits=secondary?.pageFamily!=='INSIGHT_LIST_PAGE'||(secondaryBlocks.length<=6&&secondaryBlocks.every(b=>textUnits(b.text,locale)<=listRange[1]));
    if(listFits&&main.reduce((sum,b)=>sum+textUnits(b.text,locale),0)<=maximum){
     target.contentBlocks=main.map(b=>block(b.text,section.key,'VERIFIED_SECTION_COMPOSITION'));
     target.items=[];
     if(secondary?.pageFamily==='INSIGHT_LIST_PAGE')secondary.items=secondaryBlocks.map(b=>block(b.text,section.key,'VERIFIED_SECTION_COMPOSITION'));
     else if(secondary)secondary.contentBlocks=secondaryBlocks.map(b=>block(b.text,section.key,'VERIFIED_SECTION_COMPOSITION'));
     for(const pb of pageBlocks){if(!pb.primaryVisualRef)pb.boundary='';pb.observations=[];}
     pageBlocks.at(-1).observations=[...n.observationPrompt,...n.counterSignals,...n.realityCheck].map(b=>b.text);
     pageBlocks.at(-1).boundary=n.boundaryNote.text;
    }else t3={...t3,status:'FALLBACK',internalOnly:{...t3.internalOnly,fallbackState:'T3_FALLBACK_USED',fallbackReason:'COMPOSITION_BUDGET_REJECTED'}};
   }
  }
  internalSections.push({sectionKey:section.key,interpretation,composition:composed.internalOnly,sectionComposition:sectionObject,...(t3?{t3}:{} )});
  const publicationTitle=composition.t3&&section.key==='S07_HEALTH'?{en:'Wellbeing & Daily Rhythm','zh-Hans':'身心状态与日常节奏'}:section.title;
  const base={sectionKey:section.key,section:section.key,sectionNumber:section.number,sectionTitle:publicationTitle,visualBinding:bindSectionVisual(section.key),facts:[],paragraphs:[],boundary:'',observations:[],customerVisible:true};
  const admittedT3=t3?.status==='PASS'&&canShowT3(composition.t3);
  pages.push({...base,pageKey:section.pages[0].key,definitionKey:section.pages[0].key,pageFamily:'SECTION_OPENER_PAGE',title:publicationTitle[locale],paragraphs:[admittedT3?t3.snapshot.finalNarrative.headline.text:editorial.intro[locale]],visualVariant:'SECTION_OPENER'});
  for(const pb of pageBlocks){
   const budget=REPORT_PAGE_FAMILIES[pb.pageFamily].budget,maxUnits=budget[locale==='en'?'en':'zh']?.[1]||500;
   const chunks=splitSemanticBlocks(pb.contentBlocks,{locale,maxUnits});
   if(!chunks.length)chunks.push([]);
   for(const [i,chunk] of chunks.entries())pages.push({...base,pageKey:pb.definitionKey+(pb.visualContinuation||'')+(i?`_CONT_${i+1}`:''),definitionKey:pb.definitionKey,pageFamily:pb.pageFamily,title:pb.title+(i||pb.visualContinuation?pick(' · continued',' · 续'):''),paragraphs:chunk.map(b=>b.text),facts:i?[]:pb.facts,sourcePages:i?[]:pb.sourcePages,primaryVisualRef:pb.primaryVisualRef||null,primaryVisualHtml:i?null:pb.primaryVisualHtml||null,items:i?[]:pb.items.map(b=>b.text),temporal:pb.temporal,observations:i?[]:pb.observations,boundary:i===chunks.length-1?pb.boundary:'',visualVariant:'BODY',contentBudget:{units:chunk.reduce((sum,b)=>sum+textUnits(b.text,locale),0),maximum:maxUnits}});
  }
  sections.push({key:section.key,title:section.title});
 }
 const sectionSequence=new Map();
 pages.forEach((p,i)=>{p.pageNumber=i+7;p.sequenceWithinSection=(sectionSequence.get(p.sectionKey)||0)+1;sectionSequence.set(p.sectionKey,p.sequenceWithinSection);p.isSectionOpener=p.pageFamily==='SECTION_OPENER_PAGE';p.contentDensity=p.isSectionOpener?'LOW':p.pageFamily==='NARRATIVE_ANALYSIS_PAGE'?'NARRATIVE':'STRUCTURED';p.compositionBudget=REPORT_PAGE_FAMILIES[p.pageFamily].budget;});
 const crossSection=composition.t3?crossSectionEditorialCheck(internalSections.filter(s=>s.t3?.status==='PASS').map(s=>s.t3.snapshot)):null;
 if(crossSection?.status==='REJECT'&&canShowT3(composition.t3)){
  const safe=await projectBaziSectionPublication({reading,locale,temporalContext,unavailableModules,composition:{}});
  return {...safe,internalSections,crossSection,t3Fallback:'CROSS_SECTION_REPETITION'};
 }
 return {pages,sections,internalSections,legacy,...(crossSection?{crossSection}:{})};
}
