import {executeAndProjectMcd5CurrentRequest} from '../../method-client-delivery/canonical-projection-runtime-current.js';
import {onRequestPost as meaningPost} from '../../api/method-meaning.js';
import {REPORT_REFERENCE_BLUEPRINTS} from '../../canonical-presentation-runtime/report-blueprint-reference.js';
import {numFpRoleMeta} from '../../num-full-production/num-full-production-rules.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {resolveAlternativeTimingPhase} from '../../num-expansion/num-alternative-timing-runtime.js';
import roleSources from '../../../content/professional/num-production/full-production/rich-meaning/claims/num-r2-source-claims-v1.json';
import {numPublicationVisual} from './numerology-publication-visuals.js';

export const NUM_R20_PUBLICATION_VERSION='NUM-R20-33PHYS-LOCAL-v1';
export const NUM_R20_INSERTIONS=Object.freeze([{sectionId:'SEC-04',before:'P06'},{sectionId:'SEC-05',before:'P08'},{sectionId:'SEC-06',before:'P09'},{sectionId:'SEC-07',before:'P13'},{sectionId:'SEC-08',before:'P15'},{sectionId:'SEC-09',before:'P17'},{sectionId:'SEC-10',before:'P19'},{sectionId:'SEC-11',before:'P21'},{sectionId:'SEC-12',before:'P23'}]);
const arr=x=>Array.isArray(x)?x:[];
const owner='functions/num-full-production/num-integrated-reading-runtime.js';
function fail(code){throw Object.assign(Error(code),{code});}
export async function calculateNumPublicationSnapshot({canonicalInput,expansionInput={},relationshipConsent,localReview=false}={}){
 if(!localReview)fail('NUM_R20_LOCAL_ONLY');
 if(canonicalInput?.consent?.granted!==true||!canonicalInput?.consent?.recordId)fail('NUM_R20_METHOD_CONSENT_REQUIRED');
 if(typeof expansionInput.identityInput?.fullBirthName==='string'&&expansionInput.identityInput.fullBirthName.length>240)fail('NUM_R20_NAME_EXCEEDS_EXISTING_240_CHARACTER_CONTRACT');
 // Explicit nulls satisfy the existing canonical envelope without inventing a
 // time, place or timezone for this birth-date method.
 canonicalInput={birthTime:null,birthPlace:{displayName:null,countryCode:null,latitude:null,longitude:null},timezone:{iana:null,utcOffsetAtBirth:null,source:'UNKNOWN',confidence:'UNKNOWN'},timeAccuracy:'UNKNOWN',locale:'en',inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0',...canonicalInput};
 if(expansionInput.birthDate!==canonicalInput?.birthDate)fail('NUM_R20_BIRTH_LINEAGE_MISMATCH');
 if(expansionInput.relationship&&!(relationshipConsent?.granted===true&&relationshipConsent?.purpose==='NUM_REPORT_COMPARISON'&&relationshipConsent?.comparisonBirthDate===expansionInput.relationship.comparisonBirthDate))fail('NUM_R20_COMPARISON_CONSENT_REQUIRED');
 const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',capability:'CALCULATION',purposeCode:'NUM_R20_LOCAL_PUBLICATION',canonicalInput,executionParameters:expansionInput.targetDate?{targetDate:expansionInput.targetDate}:{},consentRecordId:canonicalInput?.consent?.recordId,requestId:'NUM-R20-'+await sha256Stable({canonicalInput,expansionInput})};
 const result=await executeAndProjectMcd5CurrentRequest(request),projection=result.canonicalProjection;
 if(!['EXECUTED_BOUND_SCOPE','PARTIAL_EXECUTION'].includes(result.execution?.executionStatus)||!projection?.calculation?.values?.some(v=>v.code==='LIFE_PATH'&&Number.isFinite(v.value)))fail('NUM_R20_NATIVE_CALCULATION_REQUIRED');
 const nativeExpansionInput={...expansionInput},inputAdmission={};
 const name=expansionInput.identityInput?.fullBirthName;if(name&&/[^A-Z\s\-'/.]/i.test(name.normalize('NFKD').replace(/[\u0300-\u036f]/g,''))){delete nativeExpansionInput.identityInput;inputAdmission.name='UNSUPPORTED_NAME_SCRIPT_NOT_TRANSLITERATED';}
 if(expansionInput.targetDate)try{resolveAlternativeTimingPhase({birthDate:expansionInput.birthDate,targetDate:expansionInput.targetDate});}catch(error){if(error.message!=='NUM_ENERGY_BIRTH_DATE_INVALID')throw error;delete nativeExpansionInput.targetDate;inputAdmission.energyTiming={state:'DERIVED_ENERGY_DATE_RULE_UNRESOLVED',nativeError:error.message,westernTargetDatePreserved:expansionInput.targetDate};}
 const readings={};for(const locale of ['zh-Hans','en']){const r=await meaningPost({request:new Request('https://phios.local/api/method-meaning',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({schemaVersion:'PHI-OS-CMP-METHOD-MEANING-REQUEST-v1.0.0',locale,canonicalProjection:projection,numerologyExpansionInput:nativeExpansionInput})})});const b=await r.json();if(!r.ok||b.integratedReading?.customerPublishable!==true)fail(b.error||'NUM_R20_NATIVE_MEANING_REQUIRED');readings[locale]=b.integratedReading;}
 const inputDigest=await sha256Stable({canonicalInput,expansionInput,relationshipConsent:relationshipConsent||null}),calculationDigest=await sha256Stable(projection),semanticDigest=await sha256Stable(readings);
 const identity={inputDigest,calculationDigest,semanticDigest,version:NUM_R20_PUBLICATION_VERSION};if(Object.keys(inputAdmission).length)identity.admissionDigest=await sha256Stable({inputAdmission,nativeExpansionInput});
 return deepFreeze({schemaVersion:NUM_R20_PUBLICATION_VERSION,canonicalInput,inputDigest,calculationDigest,semanticDigest,projection,readings,expansionInput,nativeExpansionInput,inputAdmission,relationshipConsent:relationshipConsent||null,sourceVersions:{calculation:projection.method?.version,integrated:readings.en.schemaVersion,r18:readings.en.sections.expansion?.schemaVersion,d8:readings.en.sections.depth?.schemaVersion},snapshotDigest:await sha256Stable(identity),customerPublishable:false});
}
export async function verifyNumR20Snapshot(s){
 if(s?.schemaVersion!==NUM_R20_PUBLICATION_VERSION)fail('NUM_R20_SNAPSHOT_VERSION_MISMATCH');
 const inputDigest=await sha256Stable({canonicalInput:s.canonicalInput,expansionInput:s.expansionInput,relationshipConsent:s.relationshipConsent||null}),calculationDigest=await sha256Stable(s.projection),semanticDigest=await sha256Stable(s.readings);
 const identity={inputDigest,calculationDigest,semanticDigest,version:NUM_R20_PUBLICATION_VERSION};if(Object.keys(s.inputAdmission||{}).length)identity.admissionDigest=await sha256Stable({inputAdmission:s.inputAdmission,nativeExpansionInput:s.nativeExpansionInput});
 if(inputDigest!==s.inputDigest||calculationDigest!==s.calculationDigest||semanticDigest!==s.semanticDigest||await sha256Stable(identity)!==s.snapshotDigest)fail('NUM_R20_SNAPSHOT_DIGEST_MISMATCH');
 if(s.sourceVersions.calculation!==s.projection.method.version||s.sourceVersions.integrated!==s.readings.en.schemaVersion||s.sourceVersions.d8!==s.readings.en.sections.depth.schemaVersion)fail('NUM_R20_SOURCE_VERSION_MISMATCH');return true;
}
export async function numR20PublicationContentDigest(s){
 // Keep raw evidence digests intact. Only these two audited, non-content fields
 // vary across identical native executions: execution timestamp and its derived
 // meaning-bundle identifier. Content cache identity is distinct from evidence.
 const projection=structuredClone(s.projection),readings=structuredClone(s.readings);if(projection.execution)projection.execution.executedAt=null;
 for(const r of Object.values(readings))r.sourceMeaningBundleCode=null;
 return sha256Stable({inputDigest:s.inputDigest,projection,readings,sourceVersions:s.sourceVersions,version:NUM_R20_PUBLICATION_VERSION,inputAdmission:s.inputAdmission||{}});
}

// Every interpretive unit is an intact existing admitted runtime payload. New
// publication prose only describes scope, missing inputs and observation tasks.
export function composeNumR20Pages(snapshot){
 const pages=[];const reference=REPORT_REFERENCE_BLUEPRINTS.find(b=>b.methodId==='NUM');
 for(let number=6;number<=24;number++){
  const p=reference.pages[number-1],id='P'+String(number).padStart(2,'0'),languages={};
  for(const locale of ['zh-Hans','en']){
   const zh=locale==='zh-Hans',ir=snapshot.readings[locale];if(ir?.sourceProjectionId!==snapshot.projection.projectionId)fail('NUM_R20_PROJECTION_LINEAGE_MISMATCH');
   const s=ir.sections,d=s.depth.sections,e=s.expansion.sections,rich=s.richReading;
   const units=[],facts=[],gaps=[];const select=(z,en)=>zh?z:en;
   const unit=(key,text,sourceRef,{sourceClaimId=null,school=null,kind='STRUCTURAL_INTERPRETATION',limited=false}={})=>{if(typeof text!=='string'||!text.trim())return;units.push({unitId:id+':'+key,text,sourceClaimId,sourceRef,school,kind,limited});};
   const claim=(key,x,ref)=>{if(!x)return;if(x.runtimeUseAllowed!==true||x.customerPublishable===false){gaps.push(x.blocker||x.availability||'UNADMITTED_CLAIM');return;}unit(key,x.text,ref,{sourceClaimId:x.sourceClaimId||x.claimId||null,school:x.school||'MODERN_WESTERN_PYTHAGOREAN_PRACTITIONER_LAYER'});};
   const depth=(key,items,ref)=>arr(items).forEach((x,i)=>claim(key+':'+i,x,ref+'['+i+']'));
   const value=(x)=>typeof x==='object'?JSON.stringify(x):String(x??select('未知','Unknown'));
   const fact=(label,v,ref)=>facts.push({label,value:value(v),sourceRef:ref,kind:'CALCULATED_FACT'});
   const scope=(key,z,en,ref=owner+'#boundaries')=>unit(key,select(z,en),ref,{kind:'CONTEXT_AND_CONDITIONS'});
   const snap=arr(s.snapshot);const core=snap.filter(x=>['LIFE_PATH','BIRTHDAY_NUMBER','ATTITUDE_NUMBER'].includes(x.role));
   const name=roles=>arr(d.nameRoleMeanings).filter(x=>roles.includes(x.role));const secondary=roles=>arr(d.secondaryRoleMeanings).filter(x=>roles.includes(x.role));
   switch(number){
    case 6:
     core.forEach(x=>fact(x.label,x.value,'projection.calculation.values#'+x.role));s.integratedNarrative.forEach((t,i)=>unit('overview:'+i,t,owner+'#sections.integratedNarrative['+i+']'));
     scope('identity','这些结果来自本次输入的出生日期；姓名层与目标日期周期使用各自的输入。报告以不同位置及其关系组织解释，不把计算值当作已经证实的人格事实。','These results come from the supplied birth date. Name layers and target-date cycles use their own inputs. The report organizes roles and their relationships; a calculated value is not a verified personality fact.');break;
    case 7:
     snap.forEach(x=>fact(x.label,`${x.rawValue} → ${x.value}`, 'projection.calculation.values#'+x.role));
     for(const source of roleSources.claims.filter(c=>c.claimType==='ROLE_DEFINITION')){if(source.reviewState!=='HUMAN_ADMITTED'||source.runtimeUseAllowed!==true)continue;unit('role-source:'+source.claimId,source.sourceBoundParaphrase[zh?'zhHans':'en'],'content/professional/num-production/full-production/rich-meaning/claims/num-r2-source-claims-v1.json#'+source.claimId,{sourceClaimId:source.claimId,kind:'ROLE_DEFINITION',school:'MODERN_WESTERN_PYTHAGOREAN_PRACTITIONER_LAYER'});}
     scope('masters','11、22、33是否保留，取决于具体字段与既有归约规则。出生日数与生日数的别名不算两条独立证据；姓名角色也不能从出生日期补造。','Preservation of 11, 22 or 33 depends on the field and its existing reduction rule. Birth Day and Birthday aliases are not independent evidence. Name roles cannot be fabricated from the birth date.','functions/num-full-production/num-full-production-rules.js');break;
    case 8:
     arr(s.relationships).forEach((x,i)=>unit('relation:'+i,x.summary,owner+'#relationshipFindings['+i+']',{kind:'STRUCTURAL_RELATION'}));
     arr(rich.relationshipSynthesis).forEach((x,i)=>claim('synthesis:'+i,x,'functions/num-full-production/num-rich-reading-preview.js#relationshipSynthesis['+i+']'));
     scope('limits','这里比较的是同一份计算中不同位置的重复、区别与周期呼应，不是两个人的合盘，也不产生配对分数。','This compares repetition, distinctions and cycle echoes among roles in one calculation. It is not a two-person compatibility reading and creates no score.');break;
    case 9:
     for(let n=1;n<=9;n++)fact(select('数字 ','Digit ')+n,e.digitDistribution.frequency[n],'expansion.sections.digitDistribution.frequency.'+n);
     scope('distribution','上图只统计当前出生日期输入范围内1至9的出现次数；零不参与九数分布。分布图与归约后的生命路径、姓名字母频率是不同资料，不可混成同一张人格量表。','This chart counts digits 1–9 only within the current birth-date input scope; zero is excluded from the nine-digit distribution. It is distinct from reduced Life Path values and name-letter frequencies, and is not a personality scale.','functions/num-expansion/num-digit-distribution-runtime.js');
     scope('scope','同一数字在多个位置出现，首先说明计算来源与位置的关系。频次不能证明能力、健康、价值或未来结果；后续解释仍需其所属学派的已准入来源。','Repeated values first describe calculation scope and role relationships. Frequency does not establish ability, health, worth or future outcomes. Any further interpretation still needs an admitted source within its own school.');break;
    case 10:
     fact(select('出生日期重复数字','Repeated birth-date digits'),e.digitDistribution.repeatedDigits,'expansion.sections.digitDistribution.repeatedDigits');fact(select('出生日期未出现数字','Absent birth-date digits'),e.digitDistribution.missingDigits,'expansion.sections.digitDistribution.missingDigits');
     depth('name-absence',d.karmicLessonMeanings,'depth.sections.karmicLessonMeanings');
     scope('separation','上述姓名重复／缺失解释只属于已确认姓名的字母映射，不是出生日期缺数的解释。“缺失”不等于缺陷，“重复”也不能定义一个人的全部身份。没有合格姓名输入时，不生成姓名层含义。','The name-frequency interpretations above apply only to the confirmed name-letter mapping, not to absent birth-date digits. Absence is not deficiency and repetition is not a total identity. Without an eligible name input, no name-layer meaning is generated.');break;
    case 11:
     arr(s.standoutThemes).forEach((x,i)=>unit('priority:'+i,x.summary,owner+'#sections.standoutThemes['+i+']',{kind:'STRUCTURAL_RELATION'}));
     if(d.energyPatternMeanings?.length)claim('energy-baseline',d.energyPatternMeanings[0],'depth.sections.energyPatternMeanings[0]');
     scope('schools','能量数字学模式与西方毕达哥拉斯数字角色属于不同系统。本页并列保留其来源，不把相似数字或排列转成同一个含义；主要主题的优先次序是阅读组织，不是重要性或真实性评分。','Energy Numerology patterns and Western Pythagorean roles belong to different systems. Their sources remain separate; similar digits or arrangements do not create one shared meaning. Reading priority is not a truth or importance score.');break;
    case 12:
     depth('energy-other',arr(d.energyPatternMeanings).slice(1),'depth.sections.energyPatternMeanings.secondary');
     depth('bridge',secondary(['BRIDGE']),'depth.sections.secondaryRoleMeanings');
     scope('unknown','这里只使用实际计算且有已准入含义的模式。某个组合未被解释，不表示它没有意义，也不允许依据相似数字补写；桥数是角色间差值，不是好坏或配对评分。','Only calculated patterns with admitted meanings are interpreted. An unexplained combination is not proof of meaninglessness and cannot be completed by analogy. A bridge is a role difference, not a goodness or compatibility score.');break;
    case 13:
     rich.roleReadings.filter(x=>x.role==='LIFE_PATH').forEach(x=>claim('life-path',x,'functions/num-full-production/num-rich-reading-preview.js#roleReading.LIFE_PATH'));
     depth('expression',name(['EXPRESSION']),'depth.sections.nameRoleMeanings');
     scope('resources','这些是传统中的条件性资源视角，不是客户已经具备的技能证明。把解释与一次实际任务、可见行动及支持条件对照；没有经验材料时，不宣称这些资源已在现实中出现。','These are conditional resource lenses within a tradition, not proof of acquired skills. Compare them with an actual task, observable action and supporting conditions. Without experience evidence, the report does not claim that these resources have appeared in life.');break;
    case 14:
     rich.roleReadings.filter(x=>['BIRTHDAY_NUMBER','ATTITUDE_NUMBER'].includes(x.role)).forEach(x=>claim('role:'+x.role,x,'functions/num-full-production/num-rich-reading-preview.js#roleReading.'+x.role));
     depth('balance',secondary(['BALANCE']),'depth.sections.secondaryRoleMeanings');
     scope('friction','保留原解释中的“可能”“压力下”与“失衡时”等条件，不把摩擦写成稳定缺陷。缺少当前处境资料时，无法断定某项张力正在发生；请保留不符合的经验。','Conditions such as “may”, “under pressure” and “imbalance” remain part of the interpretation. Friction is not a fixed defect. Without current context, the report cannot establish that a tension is occurring; retain experiences that do not fit.');break;
    case 15:
     depth('maturity',name(['MATURITY']),'depth.sections.nameRoleMeanings');
     depth('subconscious',secondary(['SUBCONSCIOUS_SELF']),'depth.sections.secondaryRoleMeanings');
     scope('self','姓名归约与生日组合得到的角色，只在其已核对的计算方法内成立。它们可以作为自我观察问题，但不替代你的选择、经历或对自身方向的判断。','Roles derived from name reduction and birth-date combinations apply only within their checked calculation method. They can frame self-observation, but do not replace your choices, experience or judgment about direction.');break;
    case 16:
     depth('name-relations',name(['SOUL_URGE','PERSONALITY']),'depth.sections.nameRoleMeanings');
     if(d.relationship&&snapshot.relationshipConsent?.granted){for(const [i,x] of arr(d.relationship.roleComparisons).entries())if(x.text&&x.runtimeUseAllowed)claim('two-person:'+i,x,'depth.sections.relationship.roleComparisons['+i+']');}
     else gaps.push('SECOND_PERSON_NOT_SUPPLIED_OR_NOT_AUTHORIZED');
     scope('other-person','单人姓名角色描述自己的传统观察视角，不能推断他人的想法。未提供并授权第二人的独立输入，本页不生成双方关系结论；真实互动仍需沟通、行为与共同经历。','Single-person name roles frame a traditional perspective on oneself; they cannot reveal another person’s mind. Without separately supplied and authorized second-person inputs, no two-person conclusion is generated. Real interaction still requires communication, behavior and shared experience.');break;
    case 17:
     depth('thinking',secondary(['RATIONAL_THOUGHT','PLANES_OF_EXPRESSION']),'depth.sections.secondaryRoleMeanings');
     const chart=d.secondaryChart;if(chart?.availability==='AVAILABLE'){fact(select('思考视角值','Thinking-role value'),chart.rationalThought?.value,'depth.sections.secondaryChart.rationalThought');for(const [k,v]of Object.entries(chart.planes||{}))fact(select({PHYSICAL:'身体层面',MENTAL:'心智层面',EMOTIONAL:'情绪层面',INTUITIVE:'直觉层面'}[k]||k,k),v.count,'depth.sections.secondaryChart.planes.'+k+'.count');}
     scope('work','这些来源只支持姓名分布与角色定义，不支持根据该数值指定职业、推断工作绩效或承诺收入。工作观察需要任务要求、技能、经验、时间与实际机会。','These sources support name distributions and role definitions only. They do not justify assigning a career, inferring performance or promising income from a number. Work observation also needs task requirements, skills, experience, time and real opportunities.');break;
    case 18:
     depth('resources',d.hiddenPassionMeanings,'depth.sections.hiddenPassionMeanings');
     scope('value','姓名频率的传统含义不是财务状况。它不能量化现金、债务、资产或投资能力。若要比较资源使用，请另行核对真实金额、时间、责任与取舍，不从数字学生成财富结论。','Traditional name-frequency meanings are not a financial position. They cannot measure cash, debts, assets or investment ability. To compare resource use, examine actual amounts, time, responsibilities and trade-offs; do not derive wealth conclusions from numerology.');break;
    case 19:
     const long=arr(d.longCycleMeanings);long.filter(x=>x.role==='PERIOD_CYCLE').forEach(x=>fact(select('时期周期 ','Period Cycle ')+x.cycleNumber,x.value,'depth.sections.longCycleMeanings#PERIOD_CYCLE:'+x.cycleNumber));
     depth('period-meaning',long.filter(x=>x.role==='PERIOD_CYCLE'),'depth.sections.longCycleMeanings.period');
     if(e.pinnacleChallenge.ageBoundaryValidation==='NOT_SUPPORTED_BY_LEARNING_CORPUS_EVIDENCE')scope('age-source','学习资料未核定年龄区间；图示区间仅来自独立的原生西方周期计算，不能用一个系统的说明替另一个系统背书。','The learning corpus does not establish age bands. The diagram uses only the separate native Western cycle calculation; one system cannot validate another.','expansion.sections.pinnacleChallenge.ageBoundaryValidation');
     scope('cycles','时期、高峰与挑战周期采用各自来源的归约和年龄区间。保留主数、零值与边界状态；未核定的年龄界限不能成为转折事件的确定日期。它们不是能量数字学人生阶段的同义词。','Period, Pinnacle and Challenge cycles retain their own reductions and age bands. Master numbers, zero values and boundary status are preserved. Unverified age boundaries cannot establish an event date. These are not aliases for Energy Numerology life phases.');break;
    case 20:
     for(const x of arr(s.timing.calendar))fact(numFpRoleMeta(x.code,locale).label,x.value,'sections.timing.calendar#'+x.code);depth('calendar',rich.cycleReadings,'sections.richReading.cycleReadings');
     fact(select('目标日期','Target date'),snapshot.expansionInput.targetDate||select('未提供','Not supplied'),'input.targetDate');
     scope('target','个人年、月、日以明确的目标日期计算；报告不会自动用今天替换缺失日期。能量流年与西方个人周期保持分开，不能凭同值推断同一事件或把主题转成预测。','Personal Year, Month and Day use an explicit target date; the report does not silently replace a missing date with today. Energy timing and Western personal cycles remain separate. Equal values cannot establish a shared event or turn themes into predictions.');break;
    case 21:
     gaps.push('CURRENT_REALITY_EVIDENCE_NOT_IN_THIS_SNAPSHOT');
     scope('no-reality','本次快照没有可独立核对的当前现实材料，因此不能判断任何数字解释已经得到印证、正在发生或造成了某种结果。下面保留原生读取中的对照问题；它们是问题，不是个人经历。','This snapshot contains no independently checkable current-reality evidence. It cannot establish that an interpretation is confirmed, occurring or causing an outcome. The native reading’s comparison questions below are questions, not personal experiences.');
     arr(s.realityReflection).forEach((t,i)=>unit('reflection:'+i,t,owner+'#reflectionPrompts['+i+']',{kind:'REALITY_OBSERVATION'}));break;
    case 22:
     scope('record','为一个问题记录一次具体情境、观察日期、可见行动、结果与反例。不要把“觉得像自己”写成独立验证，也不要把未发生的事件补为证据；记录可保留未知或暂缓判断。','For one question, record a concrete situation, observation date, visible action, outcome and counterexample. Feeling that a description fits is not independent verification. Do not fill in events that did not occur; retain unknowns or defer judgment.');break;
    case 23:
     scope('reversible','从上一页的观察问题中选择一个当前可核对的方向，列出一个低风险、可撤回的行动及回看时间。数字主题只帮助组织问题，不能替你决定工作、关系、投资或健康行动。','Choose one currently checkable direction from the observation questions. Identify a low-risk, reversible action and a review date. Numerical themes can organize questions; they cannot decide work, relationship, investment or health actions for you.');
     if(s.realityReflection[0])unit('navigation:0',s.realityReflection[0],owner+'#reflectionPrompts[0]',{kind:'REALITY_OBSERVATION'});break;
    case 24:
     fact(select('计算权威','Calculation authority'),snapshot.sourceVersions.calculation,'snapshot.sourceVersions.calculation');fact(select('解释版本','Interpretation version'),snapshot.sourceVersions.integrated,'snapshot.sourceVersions.integrated');fact(select('目标日期','Target date'),snapshot.expansionInput.targetDate||select('未提供','Not supplied'),'input.targetDate');
     scope('evidence','计算可重复，不等于传统解释已被现代实证验证。报告区分计算结果、已准入的传统说明、条件性观察与真实经历；未准入含义和未知组合保持关闭。','Repeatable calculation does not establish that traditional interpretation is empirically verified. This report distinguishes calculated results, admitted traditional explanations, conditional observation and real experience. Unadmitted meanings and unknown combinations remain closed.');
     scope('limits','不提供命运、疾病、财富或关系结果预测；不依据缺数推断缺陷，不把学派混合，也不把客户付款视为缺失资料的授权。需要专业判断时，应使用实际信息及合格专业意见。','The report does not predict destiny, disease, wealth or relationship outcomes; infer defects from missing digits; merge schools; or treat payment as permission to invent missing information. Professional decisions require actual information and qualified advice.');break;
   }
   if([10,13,15,16,17,18].includes(number)&&!arr(d.nameRoleMeanings).length){const nameInput=snapshot.expansionInput.identityInput;gaps.push(!nameInput?'NAME_INPUT_ABSENT':!nameInput.customerConfirmed?'NAME_NOT_CONFIRMED':/Y/i.test(nameInput.fullBirthName||'')?'NAME_Y_CLASSIFICATION_REQUIRED':/[^A-Za-z\s'-]/.test(nameInput.fullBirthName||'')?'NAME_UNSUPPORTED_SCRIPT':'NAME_ROLE_ALIGNMENT_UNRESOLVED');}
   if(number===20&&!snapshot.expansionInput.targetDate)gaps.push('TARGET_DATE_ABSENT');
   if([19,20].includes(number)&&snapshot.inputAdmission?.energyTiming)gaps.push('ENERGY_TIMING_DERIVED_DATE_RULE_UNRESOLVED');
   languages[locale]={units,facts,gaps,inputSummary:number===6?{birthDate:snapshot.expansionInput.birthDate,nameInput:snapshot.expansionInput.identityInput?.fullBirthName||null,nameMeaningAdmitted:arr(d.nameRoleMeanings).some(x=>x.runtimeUseAllowed),targetDate:snapshot.expansionInput.targetDate||null}:null,structuredVisual:numPublicationVisual(snapshot,number,locale),observationPrompt:s.realityReflection[(number-6)%Math.max(1,s.realityReflection.length)]||null,semanticScope:units.some(u=>u.kind==='STRUCTURAL_INTERPRETATION')?'ADMITTED_CLAIM_CONTENT':units.some(u=>u.kind==='ROLE_DEFINITION')?'ROLE_DEFINITION_ONLY':'STRUCTURE_OR_OBSERVATION_ONLY'};
  }
  const zh=languages['zh-Hans'],en=languages.en;
  if(JSON.stringify(zh.units.map(x=>[x.unitId,x.sourceClaimId,x.sourceRef]))!==JSON.stringify(en.units.map(x=>[x.unitId,x.sourceClaimId,x.sourceRef])))fail('NUM_R20_LANGUAGE_UNIT_LINEAGE_MISMATCH');
  pages.push({logicalPageId:id,title:p.title,pageRole:'BODY_CONTENT',sourceAuthority:owner,languages,customerPublishable:false});
 }
 return deepFreeze(pages);
}
export function numR20PhysicalPlan(pages,locale){
 if(!['zh-Hans','en','bilingual'].includes(locale))fail('NUM_R20_LANGUAGE_REQUIRED');
 if(pages.length!==19||new Set(pages.map(p=>p.logicalPageId)).size!==19)fail('NUM_R20_NINETEEN_BODY_PAGES_REQUIRED');
 const out=[];for(let n=1;n<=24;n++){const logicalPageId='P'+String(n).padStart(2,'0'),insert=NUM_R20_INSERTIONS.find(x=>x.before===logicalPageId);if(insert)out.push({physicalPageNumber:out.length+1,logicalPageId:null,pageRole:'FIXED_MASTER_SECTION',sectionId:insert.sectionId,languagePolicy:'bilingual',assetRef:'NUM:'+insert.sectionId+':bilingual',contentRef:null,sourceAuthority:'OWNER_NUM_R20'});out.push({physicalPageNumber:out.length+1,logicalPageId,pageRole:n<=5?'FIXED_EDITORIAL':'BODY_CONTENT',sectionId:null,languagePolicy:locale,assetRef:n<=5?'NUM:'+logicalPageId+':'+locale:'NUM:BODY',contentRef:n>5?logicalPageId:null,sourceAuthority:n<=5?'EXISTING_EDITORIAL':owner});}return deepFreeze(out);
}
