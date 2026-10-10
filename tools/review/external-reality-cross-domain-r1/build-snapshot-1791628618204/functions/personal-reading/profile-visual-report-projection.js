import {visualProjectionBuilder} from './visual-report-projection-utils.js';
import {buildProfileCustomerVisualProjection} from '../profile/profile-customer-visual-projection.js';
export function projectProfileVisualReport({view,locale='en',depth='FREE',reviewMode=false}){
 if(view?.schemaVersion!=='PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1'||!view.signalCards?.length||!view.semanticDigest)throw Error('VRPT_PROFILE_SOURCE_REQUIRED');
 const p=buildProfileCustomerVisualProjection({progressiveView:view}),b=visualProjectionBuilder({methodId:'PROFILE',productId:'PROFILE_FULL_REPORT',sourceReportRef:view.semanticDigest,sourceProjectionId:p.schemaVersion,locale,depth,reviewMode,identity:{participantRef:view.participantRef,mode:view.mode,signalRefs:view.signalCards.map(x=>x.signalRef)}}),{add,ref,local:L}=b;
 const label=s=>view.selfAssessmentRadar?.axes.find(a=>a.domainId===s.domainId)?.label||view.careerInterest?.axes.find(a=>a.signalRef===s.signalRef)?.label||(s.facetId||s.domainId).replaceAll('_',' ');
 const value=v=>typeof v!=='object'?String(v):v.rawCorrect!=null?`${L('Correct / attempted','答对／作答')}: ${v.rawCorrect} / ${v.rawAttempted}`:v.score!=null?`${v.score} (${(v.rawRange||[]).join('–')})`:v.rawTotal!=null?`${L('Raw total','原始总分')}: ${v.rawTotal}`:v.rawPoints!=null?`${L('Raw points','原始得分')}: ${v.rawPoints}`:JSON.stringify(v);
 const insight=(text,path)=>({text,sourceRef:ref(path),claimRef:ref(path)});
 add({id:'SNAPSHOT',title:L('Your Profile evidence','你的 Profile 证据'),question:L('Which evidence sources are available?','目前有哪些证据来源？'),templateId:'RPT-T02',type:'DOMAIN_GRID',nodes:view.sourceLegend.map(s=>({id:s.sourceClass,label:s.label,secondary:s.description,sourceRefs:[ref(`sourceLegend.${s.sourceClass}`)]})),insights:view.boundaries.slice(0,2).map((t,i)=>insight(t,`boundaries.${i}`)),informationUnitRefs:[ref('sourceLegend')]});
 if(depth==='FREE')return b.finish();
 for(const lane of p.figures[0].data.lanes||[]){
  const cards=view.signalCards.filter(s=>s.sourceClass===lane.sourceClass&&s.providerFamily===lane.providerFamily);
  for(let i=0;i<cards.length;i+=6){const group=cards.slice(i,i+6);add({id:`SIGNALS_${lane.sourceKey}_${i}`,title:L('Source-specific dimensions','保留来源的维度'),question:L('What did this source actually report?','这个来源实际报告了什么？'),templateId:'RPT-T05',type:'DOMAIN_GRID',nodes:group.map(s=>({id:s.signalRef,label:label(s),secondary:value(s.value),rawValue:s.value,role:s.sourceLabel,sourceRefs:[s.signalRef]})),informationUnitRefs:group.map(s=>s.signalRef),boundaryText:L('Values retain their original instrument. They are not a shared score or a normed percentile.','数值保留原始工具口径，不构成统一分数或常模百分位。')});}
 }
 const axes=(view.careerInterest?.axes||view.selfAssessmentRadar?.axes||[]).filter(x=>!x.missing&&Number.isFinite(x.score??x.value));
 if(axes.length)add({id:'SOURCE_PATTERN',title:L('Within-source pattern','单一来源中的分布'),question:L('How do the original dimensions compare within this source?','同一来源中的原始维度如何分布？'),templateId:'RPT-T04',type:'BAR',nodes:axes.map(x=>({id:x.signalRef,label:x.label,value:x.score??x.value,sourceRefs:[x.signalRef]})),informationUnitRefs:[ref('sourceNativeDistribution')],boundaryText:view.selfAssessmentRadar?.interpretation||view.boundaries[1]});
 const questions=view.careerInterest?.currentRealityPrompts||[];
 for(let i=0;i<questions.length;i+=3)add({id:`NAV_${i}`,title:L('Return to lived experience','回到真实经验'),question:L('What can you observe next?','接下来可以观察什么？'),templateId:'RPT-T11',type:'MINI_CARD',nodes:questions.slice(i,i+3).map((t,n)=>({id:`Q${i+n}`,label:L(`Observation ${i+n+1}`,`观察 ${i+n+1}`),secondary:t,sourceRefs:[ref(`careerInterest.currentRealityPrompts.${i+n}`)]})),informationUnitRefs:[ref(`careerInterest.currentRealityPrompts.${i}`)]});
 for(const f of p.figures.filter(f=>f.state!=='READY'))b.suppressedModules.push({id:f.pfig,reason:'MISSING_SOURCE_EVIDENCE',boundaries:f.boundaries});
 return {...b.finish(),sourceSignalRefs:view.signalCards.map(s=>s.signalRef),entryMode:view.mode,coverage:'SOURCE_ADAPTIVE_CANDIDATE_NOT_COMPLETE_PAID_BLUEPRINT',pfigProjection:p};
}
