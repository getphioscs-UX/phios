import {describeBaziNativeCycle} from '../../personal-professional-reading/bazi-customer-narrative-composer.js';
import {TEN_GODS} from '../../bzr-full-production/bazi-structural-registry.js';
import {BAZI_SECTION_EDITORIAL} from '../bazi-section-editorial.js';
import {describeBaziR11TenGod} from '../bazi-section-publication.js';
import {SECTIONS,FIELD,VERSIONS,digest} from './bazi-deep-manuscript-contract.js';
const MAP={S02:['CAPABILITY','S02_PERSONALITY'],S03:['LIFE_OPERATION','S03_LIFE_STRUCTURE'],S04:['CAREER','S04_CAREER'],S05:['WEALTH','S05_WEALTH'],S06:['RELATIONSHIPS','S06_RELATIONSHIP'],S07:['FAMILY',null],S08:['PRESSURE','S07_HEALTH']};
// Publication adaptation only: existing native customer prose, R11 editorial
// copy, R11 Ten-God description and existing Reality Bridge questions. Never
// call the reference-specific R11 paragraph projection as a generic manuscript.
export async function adaptBaziR11Publication({reading,pack,sourceDigest}={}){
 if(reading?.evidence?.sourceNatalProjectionId!==pack.lineage?.publicationSource?.projectionId)throw Error('BZR_R11_READING_SOURCE_MISMATCH');
 const p=reading.professionalModules,n=p.customerNarrative,sections=[],seen=new Set();
 for(const spec of SECTIONS){
  const units=[];
  const add=(id,text,sourceRef,kind='METHOD_INTERPRETATION')=>{
   if(!text?.en||!text?.zhHans)return;const key=text.en+'|'+text.zhHans;if(seen.has(key))return;seen.add(key);units.push({id:spec.sectionId+':'+id,sourceRef,kind,'zh-Hans':{text:text.zhHans},en:{text:text.en}});
  };
  if(MAP[spec.sectionId]){
   const [code,edKey]=MAP[spec.sectionId],index=n.topicNarratives.findIndex(t=>t.topicCode===code),topic=n.topicNarratives[index],facts=p.professionalTopics.topics.find(t=>t.topicCode===code);
   if(!topic||!facts)throw Error('BZR_R11_NATIVE_TOPIC_REQUIRED');
   const ref='professionalModules/customerNarrative/topicNarratives/'+index;
   add('lead',topic.lead,ref+'/lead');add('native-mechanism',topic.development,ref+'/development');
   for(const [i,depth] of (topic.publicationDepth||[]).entries())add('native-depth-'+i,depth.text,ref+'/publicationDepth/'+i);
   if(edKey){const ed=BAZI_SECTION_EDITORIAL[edKey].bridge;add('r11-domain-mechanism',{en:ed.en,zhHans:ed['zh-Hans']},'functions/personal-reading/bazi-section-editorial.js#'+edKey+'.bridge');}
   // Pick different topic-relevant actual records, not a reference chart's gods.
   const candidates=[...(facts.relevantTenGods||[])].filter(x=>x.count>0).sort((a,b)=>b.count-a.count||a.tenGodCode.localeCompare(b.tenGodCode));
   for(const t of candidates.slice(0,2)){
    const item=p.tenGods.items.find(x=>x.tenGodCode===t.tenGodCode);if(!item)throw Error('BZR_R11_TEN_GOD_SOURCE_REQUIRED');
    const en=describeBaziR11TenGod(item,'en'),zh=describeBaziR11TenGod(item,'zh-Hans');
    // Exact first complete sentence; the shared caution is not repeated 14 times.
    add('r11-'+t.tenGodCode,{en:en.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0].trim()||en,zhHans:zh.match(/^[\s\S]*?[。！？]/)?.[0]||zh},'professionalModules/tenGods/items/'+p.tenGods.items.indexOf(item));
   }
   add('condition',topic.condition,ref+'/condition','BOUNDARY');
   const prompts=p.realityBridge.topicPrompts.find(t=>t.topicCode===code)?.prompts||[];
   for(const prompt of prompts.slice(0,2))add('observe-'+prompt.index,prompt.prompt,'professionalModules/realityBridge#'+prompt.promptId,'OBSERVATION_PROMPT');
  }else{
   const timeline=p.professionalTimeline,ed=BAZI_SECTION_EDITORIAL.S08_TIMING;
   if(spec.sectionId==='S09'){
    add('r11-long-term-domain',{en:ed.intro.en,zhHans:ed.intro['zh-Hans']},'functions/personal-reading/bazi-section-editorial.js#S08_TIMING.intro');
    const cycles=timeline.daYunTimeline||[];
    if(!cycles.length)add('no-cycles',{en:'No admitted Da Yun sequence is available for this report. A personal long-term timing reading is therefore unavailable.',zhHans:'本报告没有获准的大运序列，因此暂不能提供个人长期时序解读。'},'professionalModules/professionalTimeline/daYunTimeline','BOUNDARY');
    for(const cycle of cycles){
     const pillar=cycle.pillar.stem.zh+cycle.pillar.branch.zh;
     add('cycle-'+cycle.cycleNumber,{en:`Da Yun ${cycle.cycleNumber}: ${pillar}; age-band reference ${cycle.startAge}-${cycle.endAge}. The stem role is ${cycle.stemTenGod.en}; the recorded hidden-stem roles are ${cycle.branchHiddenTenGods.map(t=>TEN_GODS[t.tenGodCode]?.en||t.tenGodZh).join(', ')}.`,zhHans:`第${cycle.cycleNumber}步大运：${pillar}；年龄参考${cycle.startAge}-${cycle.endAge}岁。运干对应${cycle.stemTenGod.zh}，藏干对应${cycle.branchHiddenTenGods.map(t=>t.tenGodZh).join('、')}。`},'professionalModules/professionalTimeline/daYunTimeline/'+(cycle.cycleNumber-1),'TIMING_FACT');
     add('cycle-mechanism-'+cycle.cycleNumber,describeBaziNativeCycle(cycle),'professionalModules/professionalTimeline/daYunTimeline/'+(cycle.cycleNumber-1)+'#functionGroups','TIMING');
    }
    add('cycle-scope',{en:'These are the admitted cycle sequence and age-band references, not precise transition instants or a claim that a particular cycle is current. Selecting a current Da Yun and annual layer requires a complete observation date, time and timezone.',zhHans:'这里列出已有的大运顺序与年龄参考，不把它们当作精确交运时刻，也不把其中某一步直接称为当前大运。选择当前大运与流年层，需要完整的观察日期、时间与时区。'},'professionalModules/professionalTimeline/state','BOUNDARY');
   }else if(n.timingNarrative.available){
    add('current-identity',n.timingNarrative.headline,'professionalModules/customerNarrative/timingNarrative/headline','TIMING_FACT');
    n.timingNarrative.paragraphs.forEach((t,i)=>add('current-'+i,t,'professionalModules/customerNarrative/timingNarrative/paragraphs/'+i,'TIMING'));
    const w=timeline.currentWindow,year=w.annual;
    add('annual-source',{en:`Annual layer / Liu Nian: ${year.stem.zh}${year.branch.zh}; observation date ${timeline.targetContext.targetDate}.`,zhHans:`年度层／流年：${year.stem.zh}${year.branch.zh}；观察日期：${timeline.targetContext.targetDate}。`},'professionalModules/professionalTimeline/currentWindow/annual','TIMING_FACT');
    add('r11-timing-domain',{en:ed.bridge.en,zhHans:ed.bridge['zh-Hans']},'functions/personal-reading/bazi-section-editorial.js#S08_TIMING.bridge');
   }else{
    add('not-admitted',n.timingNarrative.headline,'professionalModules/customerNarrative/timingNarrative/headline','BOUNDARY');
    add('missing-input',{en:'The observation date, local time, IANA timezone and UTC offset have not been supplied together. No current Da Yun or annual pillar is selected, and no current personal timing interpretation is claimed.',zhHans:'观察日期、当地时间、IANA时区与UTC偏移尚未完整提供。本报告不选择当前大运或流年干支，也不宣称已完成当前个人时序解读。'},'normalizeBaziTargetContext#UNAVAILABLE','BOUNDARY');
    add('r11-timing-domain',{en:ed.bridge.en,zhHans:ed.bridge['zh-Hans']},'functions/personal-reading/bazi-section-editorial.js#S08_TIMING.bridge');
   }
  }
  const text=Object.fromEntries(Object.entries(FIELD).map(([l,f])=>[f,units.map(u=>u[l].text).join('\n\n')]));
  sections.push({sectionId:spec.sectionId,...text,publicationUnits:units,contentAdmission:spec.sectionId==='S10'&&!n.timingNarrative.available?'CURRENT_TIMING_UNAVAILABLE_EXPLICIT_BOUNDARY':'NATIVE_SOURCE_BOUND_R11_REUSE',unitDigests:{'zh-Hans':await digest(text.zhHansManuscript),en:await digest(text.enManuscript)}});
 }
 const body={version:'BDM-MANUSCRIPT-SNAPSHOT-1',method:'BAZI',authorityDigest:pack.authorityDigest,timingDigest:pack.timingDigest,realityDigest:pack.realityDigest,versions:VERSIONS,sections,usage:[],fixture:true,reviewSource:'USER_ACCEPTED_R11_NATIVE_REUSE_R1_1_CANDIDATE',sourceDigest,providerCalls:0};
 return {...body,digest:await digest(body)};
}
