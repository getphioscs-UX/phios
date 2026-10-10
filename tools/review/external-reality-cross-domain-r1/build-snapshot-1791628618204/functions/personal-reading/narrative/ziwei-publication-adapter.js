import {buildZiweiFullProductionCustomerRuntime} from '../../zi-wei-full-production/ziwei-full-production-customer-runtime.js';
import {buildZiweiProfessionalReadingR2V2} from '../../zi-wei-full-production/ziwei-professional-reading-r2-runtime-v2.js';
import {sha256Stable} from '../../zi-wei-runtime/zwr-utils.js';
import {buildReportPublicationIrV2,assertPublicationIrV2Preservation} from './report-publication-ir-v2.js';
import {ZIWEI_REPORT_VERSION,ZIWEI_REPORT_SECTIONS,ZIWEI_STAR_PROFILES as stars,ZIWEI_PALACE_LENSES as lenses,ZIWEI_TRANSFORMATION_MODIFIERS as modifiers,AUTHORITIES,PROHIBITED} from './ziwei-semantic-canon.js';
const unique=a=>[...new Set(a)],pick=(l,v)=>v[l],id=(type,code)=>`ZWR:${type}:${code}`;
const palaceLabel=(code,l)=>lenses[code]?.label[l]||code;
const palaceCode=label=>Object.values(lenses).find(p=>p.palaceCode===label||Object.values(p.label).includes(label))?.palaceCode;
const fail=code=>{throw Error(code)};

export function assertZiweiClaimBinding(claim,evidence){
 const s=evidence.structured||evidence;
 if(claim.subjectId!==s.subjectId||claim.inputFingerprint!==s.inputFingerprint)fail('ZIWEI_WRONG_SUBJECT');
 if(!ZIWEI_REPORT_SECTIONS.some(r=>r.sectionId===claim.sectionId))fail('ZIWEI_WRONG_SECTION');
 if(claim.structure.palaces.some(c=>!s.palaces.some(p=>p.palaceCode===c)))fail('ZIWEI_UNBOUND_PALACE');
 if(claim.structure.placements.some(id=>!s.placements.some(p=>p.entityId===id&&claim.structure.palaces.includes(p.palaceCode))))fail('ZIWEI_UNBOUND_STAR');
 if(claim.structure.timingLayers.some(t=>!['NATAL','DA_XIAN','LIU_NIAN'].includes(t))||claim.timingRelevance.some(t=>!['NATAL','DA_XIAN','LIU_NIAN'].includes(t.layer)))fail('ZIWEI_UNSUPPORTED_TIMING');
 if(claim.structure.transformations.some(id=>!s.transformations.some(t=>t.entityId===id)))fail('ZIWEI_UNBOUND_TRANSFORMATION');
 if(!claim.sourceRefs.length||Object.keys(AUTHORITIES).some(k=>!claim.authority[k]?.length))fail('ZIWEI_AUTHORITY_REQUIRED');
 for(const u of s.unknowns.filter(u=>!u.placementId||claim.structure.placements.includes(u.placementId)))if(!claim.unknowns.some(x=>JSON.stringify(x)===JSON.stringify(u)))fail('ZIWEI_UNKNOWN_DROPPED');
 if(PROHIBITED.some(p=>!claim.prohibitedExtensions.includes(p)))fail('ZIWEI_BOUNDARY_DROPPED');
 return true;
}

export async function buildZiweiReportEvidence({subjectId,executionRequest,targetContext,locale}={}){
 if(!subjectId||locale!==executionRequest?.canonicalInput?.locale)fail('ZIWEI_REPORT_SUBJECT_LOCALE_REQUIRED');
 const input=executionRequest.canonicalInput;
 const inputFingerprint=sha256Stable({birthDate:input.birthDate,birthTime:input.birthTime,birthPlace:input.birthPlace,timezone:input.timezone,timeAccuracy:input.timeAccuracy,sex:executionRequest.executionParameters?.traditionalCalculationSex});
 const runtime=await buildZiweiFullProductionCustomerRuntime({executionRequest,targetContext,locale});
 if(!runtime.executionReuse.sourceCalculationBuiltOnce||runtime.executionReuse.secondNatalCalculationPerformed)fail('ZIWEI_CALCULATION_OWNER_DRIFT');
 const pro=buildZiweiProfessionalReadingR2V2({publicationEnvelope:runtime.customerProduct,locale});
 const key=`${subjectId}:${inputFingerprint.slice(0,16)}`;
 const placements=pro.palaces.flatMap(p=>p.stars.map(s=>({entityId:id('STAR_PLACEMENT',`${key}:${p.palaceCode}:${s.starCode}`),starId:id('STAR',s.starCode),starCode:s.starCode,palaceId:id('PALACE',p.palaceCode),palaceCode:p.palaceCode,branch:p.branch,starClass:p.chartDensity.stars.find(x=>x.starCode===s.starCode)?.starClass,state:s.stateCustomerVisible?s.stateCode:null,stateAuthority:s.stateAuthority,meaningAdmitted:s.customerMeaningAvailable,sourceRefs:[AUTHORITIES.editorial[0]+`#${s.starCode}/${p.palaceCode}`,`runtime:${runtime.sourceDigests.chartDigest}#${p.palaceCode}/${s.starCode}`]})));
 if(placements.length!==28||placements.some(p=>!p.meaningAdmitted))fail('ZIWEI_REPORT_ADMITTED_PLACEMENTS_REQUIRED');
 const relationships=pro.palaces.flatMap(p=>[
  ['OPPOSITION',[p.network.oppositePalace]],['TRIAD',p.network.triadPalaces],['FLANK',p.network.flankPalaces]
 ].map(([type,labels])=>{const targets=labels.map(palaceCode);if(targets.some(x=>!x))fail('ZIWEI_UNBOUND_RELATIONSHIP');return {entityId:id(type,`${key}:${p.palaceCode}:${targets.join('+')}`),entityType:type==='FLANK'?'PALACE_RELATIONSHIP':type,from:p.palaceCode,to:targets,semanticOperator:null,topologyOnly:true,sourceRefs:[AUTHORITIES.semantic[4],`runtime:${runtime.sourceDigests.chartDigest}#${p.palaceCode}/network`]};}));
 const rawTiming=runtime.customerProduct.report.sections.find(s=>s.sectionCode==='TIMING').items;
 if(rawTiming.some(t=>!['DA_XIAN','LIU_NIAN','CROSS_LAYER'].includes(t.kind)))fail('ZIWEI_UNSUPPORTED_TIMING');
 // CROSS_LAYER is an existing comparison, not a fourth calculated time layer.
 const timingItems=rawTiming.filter(t=>t.kind!=='CROSS_LAYER');
 const timing=[{entityId:id('TIMING_LAYER',key+':NATAL'),layer:'NATAL',role:'STRUCTURAL_BASELINE'},...timingItems.map(t=>({entityId:id('TIMING_LAYER',key+':'+t.kind),layer:t.kind,role:t.kind==='DA_XIAN'?'LONG_CYCLE_MODIFICATION':'YEAR_LEVEL_ACTIVATION',focus:t.focus,sourceRefs:[AUTHORITIES.calculation[3],`runtime:${runtime.sourceDigests.dynamicProjectionId}#${t.kind}`]}))];
 if(timing.some(t=>!['NATAL','DA_XIAN','LIU_NIAN'].includes(t.layer)))fail('ZIWEI_UNSUPPORTED_TIMING');
 const transformations=[...pro.palaces.flatMap(p=>p.transformations.map(t=>({layer:'NATAL',palaceCode:p.palaceCode,transformationCode:t.transformationCode,targetStarCode:t.targetStarCode}))),...timingItems.flatMap(t=>t.transformations.map(x=>({layer:t.kind,palaceCode:x.palaceCode,transformationCode:x.transformationCode,targetStarCode:x.targetStarCode})))].map(t=>({...t,entityId:id('TRANSFORMATION',`${key}:${t.layer}:${t.palaceCode}:${t.targetStarCode}:${t.transformationCode}`),sourceRefs:[AUTHORITIES.semantic[3],AUTHORITIES.calculation[1]]}));
 for(const t of transformations)if(!placements.some(p=>p.starCode===t.targetStarCode&&p.palaceCode===t.palaceCode))fail('ZIWEI_UNBOUND_TRANSFORMATION');
 const patterns=pro.patternsProfessional.map(p=>({entityId:id('PATTERN',key+':'+p.patternCode),patternCode:p.patternCode,palaceCodes:p.affectedPalaceCodes,sourceRefs:[AUTHORITIES.semantic[5]]}));
 const unknowns=[{kind:'LIU_YUE',state:'NOT_SUPPORTED'},{kind:'MISCELLANEOUS_STARS_OUTSIDE_28',state:'NOT_SUPPORTED'},...placements.filter(p=>p.state===null).map(p=>({kind:'BRIGHTNESS',placementId:p.entityId,state:p.stateAuthority}))];
 const structured={subjectId,inputFingerprint,subjectKey:key,palaces:pro.palaces.map(p=>({palaceId:id('PALACE',p.palaceCode),palaceCode:p.palaceCode,branch:p.branch,isLifePalace:p.isLifePalace,isBodyPalace:p.isBodyPalace})),placements,relationships,axes:relationships.filter(r=>r.entityType==='OPPOSITION').filter((r,i,a)=>a.findIndex(x=>[x.from,...x.to].sort().join()===[r.from,...r.to].sort().join())===i).map(r=>({entityId:id('AXIS',key+':'+[r.from,...r.to].sort().join('+')),palaces:[r.from,...r.to],relationshipRef:r.entityId})),starGroups:pro.palaces.flatMap(p=>p.combinations.map(c=>({entityId:id('STAR_GROUP',key+':'+p.palaceCode+':'+c.combinationId),palaceCode:p.palaceCode,combinationId:c.combinationId,sourceRefs:[AUTHORITIES.semantic[0]]}))),transformations,patterns,timing,unknowns,targetContext,sourceDigests:runtime.sourceDigests,sourceRefs:Object.values(AUTHORITIES).flat(),governance:{historicalAtomicMeaningUnchanged:true,productionAdmissionGranted:false}};
 return {structured,pro,sourceEnvelope:runtime.customerProduct,executionReuse:runtime.executionReuse};
}

export async function buildZiweiPublicationSection({evidence,sectionId,locale}={}){
 if(!['S02','S04','S05'].includes(sectionId))fail('ZIWEI_PROTOTYPE_SCOPE_ONLY');
 if(evidence.pro.locale!==locale)fail('ZIWEI_PUBLICATION_LOCALE_MISMATCH');
 const s=evidence.structured,reg=ZIWEI_REPORT_SECTIONS.find(r=>r.sectionId===sectionId),body=s.palaces.find(p=>p.isBodyPalace).palaceCode;
 const primary=unique(reg.primaryPalaces.map(p=>p==='BODY'?body:p)),context=reg.contextPalaces.filter(p=>!primary.includes(p)),codes=unique([...primary,...context]);
 const placements=s.placements.filter(p=>codes.includes(p.palaceCode)),primaryPlacements=placements.filter(p=>primary.includes(p.palaceCode));
 const emphasis=primaryPlacements.slice().sort((a,b)=>(a.palaceCode===primary[0]?0:1)-(b.palaceCode===primary[0]?0:1)||(a.starClass==='MAIN'?0:1)-(b.starClass==='MAIN'?0:1)||a.starCode.localeCompare(b.starCode));
 const first=emphasis[0];if(!first)fail('ZIWEI_PRIMARY_STRUCTURE_UNAVAILABLE');
 const second=placements.filter(p=>p.starClass==='MAIN'&&p.palaceCode!==first.palaceCode).sort((a,b)=>codes.indexOf(a.palaceCode)-codes.indexOf(b.palaceCode)||a.starCode.localeCompare(b.starCode))[0]||emphasis[1];
 if(!second)fail('ZIWEI_CONTEXT_STRUCTURE_UNAVAILABLE');
 const p1=stars[first.starCode],p2=stars[second.starCode],d1=p1.dimensions,d2=p2.dimensions;
 const dim=key=>pick(locale,d1[key]),other=key=>pick(locale,d2[key]),name=p=>stars[p.starCode].label[locale];
 const field=sectionId==='S04'?'workExpression':sectionId==='S05'?'resourceExpression':'decisionPattern';
 const relationships=s.relationships.filter(r=>codes.includes(r.from));
 const tx=s.transformations.filter(t=>codes.includes(t.palaceCode));
 const timing=s.timing.filter(t=>t.layer==='NATAL'||codes.includes(t.focus?.natalDomainCode)||tx.some(x=>x.layer===t.layer));
 const structure={palaces:codes,primaryPalaces:primary,placements:placements.map(p=>p.entityId),relationships:relationships.map(r=>r.entityId),transformations:tx.map(t=>t.entityId),patterns:s.patterns.filter(p=>p.palaceCodes.some(c=>codes.includes(c))).map(p=>p.entityId),timingLayers:timing.map(t=>t.layer)};
 const refs=unique([...s.sourceRefs,`input:${s.inputFingerprint}`,`runtime:${s.sourceDigests.chartDigest}`]);
 const semanticKey=sha256Stable({subject:s.subjectKey,sectionId,structure,first:first.entityId,second:second.entityId}).slice(0,16);
 const make=(claimType,meaning,extra={})=>({claimId:`ZWR:${s.subjectKey}:${sectionId}:${semanticKey}:${claimType}`,subjectId:s.subjectId,inputFingerprint:s.inputFingerprint,sectionId,claimType,structure,meaning,conditions:[{entityId:id('CONDITION',first.starCode+':HIGH'),text:d1.highExpression}],counterweights:[{entityId:id('COUNTERWEIGHT',first.starCode+':STRAINED'),text:d1.strainedExpression},{entityId:id('COUNTERWEIGHT',second.starCode+':CONTEXT'),text:d2.highExpression}],observableExpressions:[{entityId:id('OBSERVABLE_EXPRESSION',first.starCode+':'+field),text:d1[field],status:'SYMBOLIC_POSSIBILITY_NOT_OBSERVED'}],timingRelevance:timing,navigationImplications:[{entityId:id('NAVIGATION_IMPLICATION',first.starCode+':HIGH'),text:d1.highExpression,mode:'CONDITIONAL_REFLECTION'}],sourceRefs:refs,authority:AUTHORITIES,confidence:'SYMBOLIC_CONDITIONAL',unknowns:s.unknowns.filter(u=>!u.placementId||structure.placements.includes(u.placementId)),prohibitedExtensions:PROHIBITED,semanticOperators:['CO_OCCURS_WITH','CONTEXTUALIZES'],certainty:'CONDITIONAL',...extra});
 const claims=[
  make('BASELINE_STRUCTURE',{primary:p1.dimensions,context:p2.dimensions,relation:'CO_OCCURS_WITH_NOT_AUTOMATIC_SUPPORT'}),
  make('CONDITIONAL_EXPRESSION',{constructive:d1.highExpression,strained:d1.strainedExpression},{semanticOperators:['CONSTRAINS','CONTEXTUALIZES']}),
  make('COUNTERWEIGHT',{context:d2.highExpression,pressure:d2.strainedExpression},{semanticOperators:['CONTEXTUALIZES']}),
  make('OBSERVABLE_EXPRESSION',{primary:d1[field],context:d2[field]},{semanticOperators:['QUESTION']}),
  make('TIMING_MODIFIER',{modifiers:tx.map(t=>({structure:t,meaning:modifiers[t.transformationCode]})),layers:timing},{semanticOperators:['TIMING_RELEVANCE']}),
  make('NAVIGATION_IMPLICATION',{primary:d1.highExpression,context:d2.highExpression},{semanticOperators:['QUESTION']}),
  make('UNKNOWN',{items:s.unknowns},{semanticOperators:['OPEN'],certainty:'UNRESOLVED'})
 ];
 claims.forEach(c=>assertZiweiClaimBinding(c,evidence));
 const zh=locale==='zh-Hans',join=items=>items.join(zh?'、':', ');
 const loc=p=>palaceLabel(p.palaceCode,locale);
 const scene=sectionId==='S04'?(zh?'一项任务的分工、权限与交付':'the responsibilities, authority and delivery of a real task'):sectionId==='S05'?(zh?'一次资源投入的所得、占用与留存':'the return, commitment and retention involved in a resource decision'):(zh?'一次需要定方向、又要回应环境的选择':'a choice that requires direction while responding to the environment');
 const paragraphs=[
  zh?`从${join(primary.map(c=>palaceLabel(c,locale)))}进入这组结构，${loc(first)}的${name(first)}把「${dim('coreFunction')}」带到前台；${loc(second)}的${name(second)}则让「${other('coreFunction')}」同时参与。两者放在一起，要观察的是「${dim(field)}」怎样与「${other(field)}」在同一现实情境中衔接，而不是只凭一颗星为自己下定义。`:`Read this structure through ${join(primary.map(c=>palaceLabel(c,locale)))}. ${name(first)} in ${loc(first)} foregrounds ${dim('coreFunction')}, while ${name(second)} in ${loc(second)} adds ${other('coreFunction')}. The practical question is how “${dim(field)}” can operate alongside “${other(field)}” in the same situation, rather than treating either symbol as a complete description of you.`,
  zh?`这组功能较有建设性的条件是「${dim('highExpression')}」。压力上升时，同一功能也可能转成「${dim('strainedExpression')}」；周边${loc(second)}的「${other('highExpression')}」提供了另一个需要核对的条件，但若它本身变成「${other('strainedExpression')}」，就不能把它当作自动补偿。这里保留两种表达及其条件，不把张力抹平成一个“平衡”的标签。`:`The constructive condition is ${dim('highExpression')}. Under strain, the same function can appear as ${dim('strainedExpression')}. The surrounding ${loc(second)} context offers another condition to examine—${other('highExpression')}—but it cannot be assumed to compensate if it instead becomes ${other('strainedExpression')}. Keep these conditional expressions distinct rather than collapsing them into a label of balance.`,
  zh?`可以用${scene}来检验这份读取：是否真的出现「${dim(field)}」，同时又需要「${other(field)}」？相关宫位的对宫、三方与相邻宫位只说明结构联系，不能单凭几何位置认定支持或冲突。若实际经验与这些表达不符，应保留反例，而不是替命盘补造经历。`:`Use ${scene} to test the reading: do you actually encounter “${dim(field)}” while also needing “${other(field)}”? Opposite, triad and adjacent palaces locate structural relationships; geometry alone does not establish support or conflict. Preserve real counterexamples instead of supplying life events that the chart never calculated.`
 ];
 const relevantTx=tx.filter(t=>primary.includes(t.palaceCode));
 const txText=relevantTx.map(t=>zh?`${palaceLabel(t.palaceCode,locale)}的${stars[t.targetStarCode].label[locale]}在${t.layer==='NATAL'?'本命':t.layer==='DA_XIAN'?'大限':'流年'}层出现${modifiers[t.transformationCode].label[locale]}，修饰为「${pick(locale,modifiers[t.transformationCode].function)}」`:`${modifiers[t.transformationCode].label[locale]} on ${stars[t.targetStarCode].label[locale]} in ${palaceLabel(t.palaceCode,locale)} at the ${t.layer==='NATAL'?'natal':t.layer==='DA_XIAN'?'Da Xian':'Liu Nian'} layer ${pick(locale,modifiers[t.transformationCode].function)}`);
 const dx=s.timing.find(t=>t.layer==='DA_XIAN'),yr=s.timing.find(t=>t.layer==='LIU_NIAN');
 paragraphs.push(zh?`本命是结构基线；当前大限的焦点为${palaceLabel(dx.focus.natalDomainCode,locale)}，${yr.focus.lunarYear}流年焦点为${palaceLabel(yr.focus.natalDomainCode,locale)}。${txText.length?txText.join('；')+'。':`这两个时间层没有为${join(primary.map(c=>palaceLabel(c,locale)))}新增直接四化落点，不能把未激活写成好坏判断。`}时间层只能调整观察重点，不能推出财富、工作或关系事件。`:`The natal chart remains the structural baseline. The current Da Xian foregrounds ${palaceLabel(dx.focus.natalDomainCode,locale)}; ${yr.focus.lunarYear} Liu Nian foregrounds ${palaceLabel(yr.focus.natalDomainCode,locale)}. ${txText.length?txText.join('; ')+'.':`These layers add no direct transformation to ${join(primary.map(c=>palaceLabel(c,locale)))}; non-activation is not a verdict.`} These modifiers adjust what to observe, not the certainty of a financial, work or relationship event.`);
 paragraphs.push(zh?`下一步先围绕${scene}，比较两种条件：什么时候可以做到「${dim('highExpression')}」，什么时候却变成「${dim('strainedExpression')}」？再核对${loc(second)}能否维持「${other('highExpression')}」。这比单凭星名选择职业、承诺结果或扩大投入，更贴近这组结构能够支持的导航范围。`:`For ${scene}, compare the conditions under which ${dim('highExpression')} remains possible with those in which it becomes ${dim('strainedExpression')}. Then check whether ${loc(second)} can sustain ${other('highExpression')}. This keeps navigation tied to the structure rather than selecting a profession, promising an outcome or increasing a commitment from a star name alone.`);
 const claimGroups=[[0],[1,2],[3],[4],[5,6]];
 const candidate={blocks:paragraphs.map((text,i)=>({role:'CONTEXTUAL_INTERPRETATION',text,claimRefs:claimGroups[i].map(n=>claims[n].claimId)}))};
 const semanticDigest=sha256Stable({subject:s.subjectKey,structure,claims:claims.map(c=>({id:c.claimId,type:c.claimType,meaning:c.meaning}))});
 const brief={methodId:'ZWR',sectionKey:sectionId,claims:claims.map(c=>({...c,text:'',conditions:c.conditions.map(x=>pick(locale,x.text)),counterweights:c.counterweights.map(x=>pick(locale,x.text)),timing:c.timingRelevance,observableSignals:c.observableExpressions})),briefSemanticDigest:semanticDigest,sourceSemanticDigest:semanticDigest,sourceAuthorityVersion:ZIWEI_REPORT_VERSION};
 const publicationIr=await buildReportPublicationIrV2({methodId:'ZWR',reportVersion:ZIWEI_REPORT_VERSION,sectionKey:sectionId,locale,brief,candidate,semanticOwner:'ZIWEI_PRO_R2_AUTHORITY_V2',compositionOwner:ZIWEI_REPORT_VERSION,snapshotLineage:{subjectId:s.subjectId,inputFingerprint:s.inputFingerprint,sourceCalculationDigest:s.sourceDigests.sourceCalculationDigest}});
 if(!assertPublicationIrV2Preservation({publicationIr,brief}).accepted)fail('ZIWEI_SHARED_IR_PRESERVATION_FAILED');
 return {subjectId:s.subjectId,locale,sectionId,title:reg.title[locale],normalizedEvidence:{subjectId:s.subjectId,sectionId,palaces:codes,primaryStars:primaryPlacements.filter(p=>p.starClass==='MAIN'),supportingStars:placements.filter(p=>p.starClass!=='MAIN'),transformations:tx,relationships,patterns:s.patterns.filter(p=>p.palaceCodes.some(c=>codes.includes(c))),timing,conditions:claims[0].conditions,counterweights:claims[0].counterweights,sourceRefs:refs},claims,brief,publicationIr,paragraphs:publicationIr.blocks.map(b=>b.prose),selectedComposition:{primary:first.entityId,context:second.entityId},humanDecision:null,productionAdmissionGranted:false};
}
