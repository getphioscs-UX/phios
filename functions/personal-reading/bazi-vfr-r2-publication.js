import {projectBaziVfrReference} from './bazi-vfr-r1-publication.js';
import {BAZI_VFR_R2_COPY} from './narrative/bazi-vfr-r2-copy.js';
import {assertTriLayerSections,bilingualSectionSchema,VFR_BILINGUAL_SINGLE_CALL_V1} from '../canonical-presentation-runtime/vfr-trilayer-bilingual-contract.js';
export const BZR_DIAGRAM_FAMILIES=Object.freeze({pillars:'BZR-PILLAR-MATRIX',bars:'BZR-FIVE-ELEMENT-BARS',relations:'BZR-RELATION-NETWORK',technical:'BZR-TECHNICAL-FLOW',flow:'BZR-DOMAIN-FLOW',stack:'BZR-LAYER-STACK',loop:'BZR-CYCLE-LOOP',network:'BZR-ROLE-NETWORK',split:'BZR-SPLIT-COMPARE',integrated:'BZR-INTEGRATED-MAP',orbit:'BZR-ROLE-NETWORK'});
const anchors=[
 ['三庚并见','食伤水势','甲木偏财','寅申冲','土主金辅'],
 ['年柱庚申','月柱甲子','日柱庚辰','时柱庚寅','寅申冲'],
 ['食伤生财','甲木偏财透月','丙七杀藏寅','三庚比肩','土金承载'],
 ['甲木偏财透月','乙木正财藏辰','三庚比肩','辰土承载'],
 ['甲木财星','日支辰','三庚并见','寅申冲'],
 ['年柱庚申','日支辰','时柱庚寅','寅申冲'],
 ['三庚并见','水势明显','寅申冲','土承载'],
 ['土承载','金定界','水表达','木资源','火调候与责任'],
 ['原局四柱','己巳大运','丙寅年度','甲己合','寅巳申刑']
];
const anchorEn=[
 ['Three Geng stems','Water Output','Jia Indirect Wealth','Yin–Shen clash','Earth / Metal support'],
 ['Year Geng–Shen','Month Jia–Zi','Day Geng–Chen','Hour Geng–Yin','Yin–Shen clash'],
 ['Output → Wealth','Jia exposed in month','Bing hidden in Yin','Geng Peer stars','Earth / Metal carrying'],
 ['Jia Indirect Wealth','Yi hidden in Chen','Geng Peer stars','Chen carrying'],
 ['Jia Wealth','Chen day branch','Three Geng stems','Yin–Shen clash'],
 ['Year Geng–Shen','Chen day branch','Hour Geng–Yin','Yin–Shen clash'],
 ['Three Geng stems','Water tendency','Yin–Shen clash','Earth carrying'],
 ['Earth carrying','Metal boundaries','Water expression','Wood resources','Fire warmth / duty'],
 ['Natal pillars','Ji–Si Da Yun','Bing–Yin annual','Jia–Ji combination','Yin–Si–Shen punishment']
];
const plans=[['BZD-06','BZD-06-B'],['BZD-07-B','BZD-07'],['BZD-08','BZD-08-C','BZD-08-B'],['BZD-09','BZD-09-B','BZD-09-C'],['BZD-10','BZD-10-B'],['BZD-11-B','BZD-11'],['BZD-12','BZD-12-B'],['BZD-13-B','BZD-13'],['BZD-14','BZD-15','BZD-14-B']];
const technicalTypes=['technical','pillars','technical','split','relations','pillars','split','orbit','stack'];
const elements=['METAL','WATER','WOOD','EARTH','FIRE'];
export function projectBaziVfrR2(args){
 const ir=projectBaziVfrReference({...args,locale:'zh-Hans'});
 ir.localeMode='BILINGUAL_SINGLE_REPORT';ir.physicalComposition.version='VISUAL_FIRST_TRI_LAYER_R2';
 ir.sections=BAZI_VFR_R2_COPY.map((s,i)=>({...s,sectionMasterAsset:ir.sections[i].sectionMasterAsset,technicalAnchors:anchors[i],technicalAnchorsEn:anchorEn[i],professionalDiagramIds:[plans[i][0],...(i===8?[plans[i][1]]:[])],applicationDiagramIds:plans[i].slice(i===8?2:1),livedInterpretationSource:args.sourceDigests[s.id],sourceAcceptedParagraphIds:args.paragraphIds[s.id]}));
 ir.sections.forEach((s,i)=>{
  const d=ir.diagrams.find(d=>d.id===plans[i][0]);
  if(!['pillars','stack'].includes(technicalTypes[i])){
   d.type=technicalTypes[i];d.nodes=anchors[i].map((label,j)=>({label,labelEn:anchorEn[i][j],detail:'',element:elements[j%5]}));d.edges=undefined;
   if(d.type==='relations')d.edges=[{from:0,to:1,label:'现实连接',kind:'合'},{from:2,to:3,label:'自主与方向',kind:'冲'}];
  }
  for(const id of plans[i]){const x=ir.diagrams.find(d=>d.id===id);x.sourceSection=s.id;x.sourceTechnicalAnchors=s.technicalAnchors;x.sourceAcceptedParagraphIds=s.sourceAcceptedParagraphIds;x.layer=s.professionalDiagramIds.includes(id)?'TECHNICAL':'APPLICATION';x.caption=x.layer==='TECHNICAL'?s.technicalCaptionZh:s.applicationCaptionZh;x.captionEn=x.layer==='TECHNICAL'?s.technicalCaptionEn:s.applicationCaptionEn;x.titleEn=x.layer==='TECHNICAL'?s.titleEn+' · Structure':s.titleEn+' · In practice';}
 });
 // Precise S03 pillar-position technical diagram and distinct S09 temporal cycle.
 ir.diagrams.find(d=>d.id==='BZD-07').nodes=['进入环境','承担','累积','阶段完成','重构'].map((label,i)=>({label,labelEn:['Enter','Carry','Accumulate','Complete','Reorganize'][i],detail:'',element:elements[i]}));ir.diagrams.find(d=>d.id==='BZD-07').type='loop';
 ir.diagrams.find(d=>d.id==='BZD-09-B').type='flow';ir.diagrams.find(d=>d.id==='BZD-09-B').nodes=['收入','留存','配置','持久资源','选择权'].map((label,i)=>({label,labelEn:['Income','Retain','Allocate','Durable resources','Choice'][i],detail:'',element:elements[i]}));
 ir.diagrams.find(d=>d.id==='BZD-10-B').type='loop';ir.diagrams.find(d=>d.id==='BZD-10-B').nodes=['吸引','信任','一致行动','边界','共同现实','成长'].map((label,i)=>({label,labelEn:['Attraction','Trust','Consistent action','Boundaries','Shared reality','Growth'][i],detail:'',element:elements[i%5]}));
 ir.diagrams.find(d=>d.id==='BZD-11').type='network';
 ir.diagrams.find(d=>d.id==='BZD-12-B').type='loop';
 ir.diagrams.find(d=>d.id==='BZD-14-B').type='network';ir.diagrams.find(d=>d.id==='BZD-14-B').nodes=['支撑','责任','方向','边界','重构'].map((label,i)=>({label,labelEn:['Support','Responsibility','Direction','Boundaries','Reconfiguration'][i],detail:'',element:elements[i]}));
 ir.diagrams.find(d=>d.id==='BZD-SUMMARY').type='integrated';
 const dict={'年柱':'Year','月柱':'Month','日柱':'Day','时柱':'Hour','木':'Wood','火':'Fire','土':'Earth','金':'Metal','水':'Water','比肩':'Peer','劫财':'Rob Wealth','食神':'Eating God','伤官':'Hurting Officer','偏财':'Indirect Wealth','正财':'Direct Wealth','七杀':'Seven Killings','正官':'Direct Officer','偏印':'Indirect Resource','正印':'Direct Resource','原局':'Natal','大运':'Da Yun','年度层':'Annual','甲':'Jia','己':'Ji','巳':'Si','申':'Shen','寅':'Yin','专业认知':'Cognition','解决输出':'Solution','现实价值':'Adoption','可重复结构':'Repeatable value','成果':'Results','职责':'Duties','权限':'Authority','资源':'Resources','方法':'Methods','自己':'Self','伴侣':'Partner role','父母':'Parents role','子女与照顾对象':'Dependants role','能处理':'Keep functioning','继续增加':'More demands','支持进入':'Support enters','重新定界':'Set boundaries','恢复空间':'Recover space','建立':'Build','扩张':'Expand','筛选':'Select','重组':'Reorganize','再建立':'Build again','理解与判断':'Understand / judge','输出与价值':'Output / value','支持与承载':'Support / carry','重组与方向':'Reorganize / direction','判断':'Judge','理解':'Understand','落地':'Deliver','信息':'Information','组织':'Organize','落实':'Implement','一次解决':'One solution','形成方法':'Build a method','团队采用':'Team adoption','持续价值':'Sustained value','机会':'Opportunity','投入':'Commitment','承载':'Carrying','留存':'Retention','看见问题':'Notice needs','角色清楚':'Clear roles','可见支持':'Practical support','保留空间':'Keep space','日主庚金':'Geng Day Master','子月水势':'Zi-month Water','印比承载':'Resource / Peer support','财的连接':'Wealth connection','己巳 × 丙寅':'Ji–Si × Bing–Yin','庚金日主':'Geng Day Master','子月冬令':'Zi winter month','中和偏弱':'Moderately weak','土主 · 金辅':'Earth / Metal support','火的作用':'Fire role'};
 const frontEn=['The four pillars and their hidden stems preserve source position. Geng is the Day Master. Positions support later interpretation without fixed age bands.','Counts cover four stems, four branches and ten hidden stems: eighteen unweighted entries. They are an inventory, not energy percentages or a strength score.','The ten-god inventory covers three other visible stems and ten hidden stems. The Day Master itself is excluded. Zero denotes no entry in this inventory, not absence throughout life.','Zi winter context, Geng judgment and Water output are read together. Strength remains moderately weak; Earth carries, Metal assists, and Fire retains warmth and responsibility.','The Shen–Zi–Chen configuration and Yin–Shen clash remain together. Combination does not erase clash or establish complete Water transformation.'];
 for(const d of ir.diagrams){
  d.family=d.id==='BZD-03'?'BZR-TEN-GOD-BARS':BZR_DIAGRAM_FAMILIES[d.type];
  d.nodes=d.nodes.map(n=>({...n,labelEn:n.labelEn||dict[n.label]||n.label}));
  if(!d.sourceTechnicalAnchors)d.sourceTechnicalAnchors=['庚金日主','子月水势','土主金辅'];
  if(!d.captionEn)d.captionEn=frontEn[Number(d.id.slice(4))-1]||'Geng judgment, Water expression and Jia Wealth connect understanding with practical value. Earth and Metal carrying conditions remain; current timing is Ji–Si with Bing–Yin.';
  if(!d.titleEn)d.titleEn={'BZD-01':'Four Pillars & Hidden Stems','BZD-02':'Five Elements','BZD-03':'Ten Gods','BZD-04':'Season, Day Master & Carrying','BZD-05':'Natal Branch Relations','BZD-OVERVIEW':'BaZi at a Glance','BZD-SUMMARY':'Integrated Operating Map'}[d.id];
 }
 ir.diagrams.find(d=>d.id==='BZD-07-B').nodes.forEach((n,i)=>{n.detail=['早期环境','社会现实','自我位置','后续方向'][i];n.labelEn=['Origins','Social reality','Self-position','Later direction'][i];});
 ir.pages.forEach(p=>{const s=ir.sections.find(s=>s.id===p.sectionId);if(p.kind==='DIAGRAM'&&s)p.diagramIds=[plans[ir.sections.indexOf(s)][ir.pages.filter(x=>x.sectionId===s.id&&x.kind==='DIAGRAM').indexOf(p)]];const d=ir.diagrams.find(d=>d.id===p.diagramIds?.[0]);if(d){p.title=d.title;p.titleEn=d.titleEn;}if(s&&p.kind==='INTERPRETATION'){p.title=s.headlineZh;p.titleEn=s.headlineEn;}});
 const insightEn=[['Three Geng stems: independent judgment','Water tendency: observation and expression','Resource / Peer support: sustained capability'],['Year: early order and reality','Month: resources and social demands','Day / hour: carrying and renewed direction'],['How output gains adoption','Match responsibility, authority and resources','Turn personal methods into a system'],['Jia: external opportunity and flow','Yi: continuity and accumulation','Carrying conditions shape retention'],['Fulfilled promises build trust','Intimacy can retain independence','Shared carrying supports the long term'],['Family participates in practical choices','Capability does not mean unlimited duty','Support becomes actual shared work'],['Fast understanding may bring more tasks','Outward functioning can coexist with fatigue','Support, boundaries and recovery carry load'],['No fixed years or ages in the cycle','Elements describe functions, not timing order','Direction can change alongside accumulation'],['Ji Resource: support moves forward','Bing–Yin: responsibility and direction','Coexisting relations do not guarantee events']];
 ir.sections.forEach((s,j)=>{s.takeaways=s.takeaways.map((t,i)=>({...t,textEn:insightEn[j][i]}));});
 ir.pages[1].titleEn='How to Read';ir.pages[47].titleEn='Bring the Reading into Real Life';
 assertTriLayerSections(ir.sections,ir.diagrams);
 return ir;
}
export function buildBaziVfrR2Pack(ir){return {schemaVersion:'BAZI_VFR_R2_PACK_V1',methodId:'BZR',localeMode:ir.localeMode,bilingualContract:VFR_BILINGUAL_SINGLE_CALL_V1,chartAuthority:ir.natal,timingAuthority:ir.timing,authorityDigest:ir.authorityDigest,boundaries:['No exact Gregorian year, age or start date','No transformation conclusion','No deterministic events or health diagnosis'],sections:ir.sections.map(s=>({sectionId:s.id,purpose:s.titleZh,technicalAnchors:s.technicalAnchors,sourceDigest:s.livedInterpretationSource.sha256,canonicalSemanticSource:s.interpretationZh,diagramIds:[...s.professionalDiagramIds,...s.applicationDiagramIds]})),diagramData:ir.diagrams.map(d=>({id:d.id,family:d.family,nodes:d.nodes.map(n=>({label:n.label,value:n.value,detail:n.detail})),edges:d.edges,sourceTechnicalAnchors:d.sourceTechnicalAnchors})),realityContext:null,outputSchema:bilingualSectionSchema(ir.sections.map(s=>s.id))};}
