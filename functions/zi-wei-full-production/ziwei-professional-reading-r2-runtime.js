import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';
import {ZIWEI_PRO_R2_AUTHORITY,ZIWEI_PRO_R2_STAR_PROFILES,ZIWEI_PRO_R2_PALACE_LENSES,ZIWEI_PRO_R2_COMBINATION_RULES,ZIWEI_PRO_R2_TRANSFORMATION_MODIFIERS,resolveZiweiProR2StateAuthority,buildZiweiProR2StateCensus,ziweiProR2LocaleValue,ziweiProR2StarLabel,ziweiProR2PalaceLabel} from './ziwei-professional-reading-r2-authority-v1.js';

export const ZIWEI_PRO_R2_PRESENTATION_SCHEMA='PHI-OS-ZIWEI-PRO-R2-W0-W7-PROFESSIONAL-PRESENTATION-v1.0.0';
export const ZIWEI_PRO_R2_VISUAL_TYPE='ZIWEI_PRO_R2_PROFESSIONAL_PRESENTATION';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];
const t=(l,en,zh)=>l==='zh-Hans'?zh:en;
const lv=(v,l)=>ziweiProR2LocaleValue(v,l);
function fail(code){const e=new Error(code);e.code=code;throw e;}
function section(report,code){return list(report?.sections).find(x=>x?.sectionCode===code)||null;}
function unique(v){return [...new Set(v.filter(Boolean))];}

export function composeZiweiProR2StarPalace(starCode,palaceCode,locale='en'){
 const profile=ZIWEI_PRO_R2_STAR_PROFILES[starCode],lens=ZIWEI_PRO_R2_PALACE_LENSES[palaceCode];
 if(!profile||!lens)return null;
 const allowed=profile.customerRuntimeAllowed===true;
 if(!allowed)return freeze({starCode,palaceCode,status:'HUMAN_GATED',customerRuntimeAllowed:false,paragraph:null});
 const d=profile.dimensions;
 const paragraph=t(locale,
  `${ziweiProR2StarLabel(starCode,locale)} brings ${lv(d.coreFunction,locale)} into ${lv(lens.domain,locale)}. In this palace the useful question is ${lv(lens.readingQuestion,locale)}; the decision pattern is therefore read through ${lv(d.decisionPattern,locale)}, while its pressured form may appear as ${lv(d.pressureMode,locale)}.`,
  `${ziweiProR2StarLabel(starCode,locale)}的「${lv(d.coreFunction,locale)}」进入${ziweiProR2PalaceLabel(palaceCode,locale)}后，语义落点会转向${lv(lens.domain,locale)}。这里较值得观察的是：${lv(lens.readingQuestion,locale)}；因此决策方式要结合「${lv(d.decisionPattern,locale)}」来读，而压力升高时则留意「${lv(d.pressureMode,locale)}」。`);
 return freeze({starCode,palaceCode,status:'CUSTOMER_READY',customerRuntimeAllowed:true,paragraph,highExpression:lv(d.highExpression,locale),strainedExpression:lv(d.strainedExpression,locale)});
}

function professionalStarUnit(star,palaceCode,branch,locale){
 const profile=ZIWEI_PRO_R2_STAR_PROFILES[star.starCode]||null;
 const state=resolveZiweiProR2StateAuthority(star.starCode,branch);
 const composition=composeZiweiProR2StarPalace(star.starCode,palaceCode,locale);
 return freeze({starCode:star.starCode,label:ziweiProR2StarLabel(star.starCode,locale),profileAdmissionState:profile?.admissionState||'SOURCE_PENDING',customerMeaningAvailable:profile?.customerRuntimeAllowed===true,stateAuthority:state.status,stateCode:state.customerVisible?state.stateCode:null,stateLabel:state.customerVisible?state.stateLabel:null,stateCustomerVisible:state.customerVisible===true,compositionStatus:composition?.status||'UNAVAILABLE',compositionParagraph:composition?.paragraph||null});
}

function combinationUnits(stars,locale){
 const codes=new Set(stars.map(x=>x.starCode));
 return ZIWEI_PRO_R2_COMBINATION_RULES.filter(rule=>rule.customerRuntimeAllowed===true&&rule.stars.every(code=>codes.has(code))).map(rule=>freeze({combinationId:rule.combinationId,label:lv(rule.label,locale),paragraph:lv(rule.interaction,locale),patternQualificationCreated:rule.patternQualificationCreated===true}));
}
function transformationUnits(block,locale){
 return list(block.transformationSummary).map(item=>{
   const modifier=ZIWEI_PRO_R2_TRANSFORMATION_MODIFIERS[item.transformationCode];
   const target=ZIWEI_PRO_R2_STAR_PROFILES[item.targetStarCode];
   if(!modifier||!target?.customerRuntimeAllowed)return null;
   const lens=ZIWEI_PRO_R2_PALACE_LENSES[block.palaceCode];
   const paragraph=t(locale,
    `${lv(modifier.label,locale)} on ${ziweiProR2StarLabel(item.targetStarCode,locale)} means ${lv(modifier.function,locale)} through ${lv(target.dimensions.coreFunction,locale)} in ${lv(lens.domain,locale)}. The same-palace structure and palace network determine how this is expressed. ${lv(modifier.boundary,locale)}`,
    `${ziweiProR2StarLabel(item.targetStarCode,locale)}在${ziweiProR2PalaceLabel(block.palaceCode,locale)}化为${lv(modifier.label,locale)}时，先读${lv(modifier.function,locale)}，再让它通过该星的「${lv(target.dimensions.coreFunction,locale)}」落到${lv(lens.domain,locale)}。同宫结构与三方四正会继续改变实际表现。${lv(modifier.boundary,locale)}`);
   return freeze({transformationCode:item.transformationCode,targetStarCode:item.targetStarCode,label:`${lv(modifier.label,locale)} · ${ziweiProR2StarLabel(item.targetStarCode,locale)}`,paragraph,boundary:lv(modifier.boundary,locale),layer:'NATAL'});
 }).filter(Boolean);
}
function networkParagraphs(block,locale){
 const n=block.networkContext||{},triads=list(n.triadPalaces),flanks=list(n.flankPalaces),out=[];
 if(triads.length)out.push(t(locale,
  `The triad palaces (${triads.join(', ')}) are not automatic support. They show domains that repeatedly exchange resources, action or responsibility with ${block.title}, so they change the conditions under which this palace can operate.`,
  `三方${triads.join('、')}不是自动「加分」或支持；它们代表会与${block.title}反复交换资源、行动与责任的领域，因此会改变本宫能否顺利运作的现实条件。`));
 if(n.oppositePalace)out.push(t(locale,
  `The opposite palace (${n.oppositePalace}) is the paired-axis response context, not an automatic conflict. It helps show the external or counterpart situation in which this palace becomes visible.`,
  `对宫${n.oppositePalace}不是自动冲突，而是同一轴线上的回应情境：它帮助说明${block.title}通常会在什么外部或相对环境中被触发、被看见。`));
 if(flanks.length)out.push(t(locale,
  `The flanking palaces (${flanks.join(', ')}) form the nearest structural frame. They describe adjacent constraints and available interfaces without being scored as good or bad.`,
  `夹宫${flanks.join('、')}构成本宫最近的结构框架，说明紧邻限制与可用接口；这里只读条件，不判吉凶。`));
 if(n.emptyMainStarPalace){
   const refs=list(n.oppositeMainStarReference).map(x=>ziweiProR2StarLabel(x.starCode,locale));
   out.push(t(locale,
    `This is a fourteen-main-star empty palace. Read its own domain first; use ${refs.length?refs.join(' / '):'the opposite main-star structure'} as reference only, then return to the triad network, local support/pressure stars, natal transformations and timing activation. The opposite stars are not moved into this palace and their standalone meanings do not become this palace's own meaning.`,
    `本宫属于十四主星空宫。读取顺序先回到本宫主题，再把${refs.length?refs.join('、'):'对宫主星结构'}作为参照，然后检查三方网络、本宫驻守辅曜／压力星、本命四化与时间层激活。对宫主星不会被搬进本宫，其单星意义也不会直接变成本宫星意。`));
 }
 return out;
}
function palaceUnit(block,locale){
 const lens=ZIWEI_PRO_R2_PALACE_LENSES[block.palaceCode];if(!lens)return null;
 const stars=list(block.starSummary).map(x=>professionalStarUnit(x,block.palaceCode,block.branch,locale));
 const starParagraphs=stars.filter(x=>x.customerMeaningAvailable&&x.compositionParagraph).map(x=>x.compositionParagraph);
 const combos=combinationUnits(stars,locale),transformations=transformationUnits(block,locale),net=networkParagraphs(block,locale);
 const opening=t(locale,
   `${block.title} reads ${lv(lens.domain,locale)}. The chart does not turn this domain into a fixed identity or guaranteed outcome; it asks ${lv(lens.readingQuestion,locale)}.`,
   `${block.title}的主旨是${lv(lens.domain,locale)}。这里不把宫位写成固定人格或必然结果，而是先问：${lv(lens.readingQuestion,locale)}。`);
 const paragraphs=[opening,...starParagraphs,...combos.map(x=>x.paragraph),...transformations.map(x=>x.paragraph),...net];
 const displayNames=stars.map(s=>s.stateCustomerVisible&&s.stateLabel?`${s.label}（${s.stateLabel}）`:s.label);
 return freeze({palaceCode:block.palaceCode,title:block.title,branch:block.branch,branchLabel:block.branchLabel,isLifePalace:block.isLifePalace===true,isBodyPalace:block.isBodyPalace===true,isStructuralFocus:block.isStructuralFocus===true,domain:lv(lens.domain,locale),readingQuestion:lv(lens.readingQuestion,locale),starDisplayNames:displayNames,stars,combinations:combos,transformations,network:{triadPalaces:list(block.networkContext?.triadPalaces),oppositePalace:block.networkContext?.oppositePalace||null,flankPalaces:list(block.networkContext?.flankPalaces),emptyMainStarPalace:block.networkContext?.emptyMainStarPalace===true,oppositeMainStarReference:list(block.networkContext?.oppositeMainStarReference),paragraphs:net},paragraphs:unique(paragraphs),customerOpenBoundarySuppressed:true,technicalUnknownRefs:list(block.why?.unknownRefs),technicalQualifierCodes:list(block.why?.qualifierCodes),sourceBlockDigest:block.blockDigest||null});
}

export function buildZiweiProfessionalReadingR2({publicationEnvelope,locale=publicationEnvelope?.locale||'en'}={}){
 if(publicationEnvelope?.schemaVersion!=='PHI-OS-ZIWEI-CX-R1-CURRENT-PUBLICATION-ENVELOPE-v1.0.0')fail('ZIWEI_PRO_R2_CURRENT_PUBLICATION_ENVELOPE_REQUIRED');
 if(publicationEnvelope.state!=='CUSTOMER_PUBLISHABLE')fail('ZIWEI_PRO_R2_CUSTOMER_PUBLISHABLE_REQUIRED');
 const report=publicationEnvelope.report||{},palaceSection=section(report,'PALACES');if(!palaceSection||list(palaceSection.items).length!==12)fail('ZIWEI_PRO_R2_TWELVE_PALACE_REPORT_REQUIRED');
 const snap=stableStringify(publicationEnvelope);
 const palaces=palaceSection.items.map(x=>palaceUnit(x,locale));
 const stateCensus=buildZiweiProR2StateCensus();
 const gatedStars=unique(palaces.flatMap(p=>p.stars.filter(s=>!s.customerMeaningAvailable).map(s=>s.starCode)));
 const pendingStateCells=palaces.flatMap(p=>p.stars.filter(s=>s.stateAuthority!=='ADMITTED').map(s=>({palaceCode:p.palaceCode,starCode:s.starCode,stateAuthority:s.stateAuthority}))); 
 const base={schemaVersion:ZIWEI_PRO_R2_PRESENTATION_SCHEMA,work:'ZIWEI-PRO-R2-W0-W7',version:'1.0.0',locale,status:'ENGINEERING_ACTIVE_20_STARS_8_HUMAN_GATED',sourcePublicationEnvelopeDigest:publicationEnvelope.envelopeDigest||null,coverage:{stateCensus,activeStandaloneStars:ZIWEI_PRO_R2_AUTHORITY.activeStarCount,humanGatedStandaloneStars:ZIWEI_PRO_R2_AUTHORITY.humanGatedStarCount,professionalDimensionCells:252,customerActiveDimensionCells:180,customerReadyStarPalacePairs:240,totalStarPalacePairs:336,customerReadyStarPalacePct:71.43,gatedStarPalacePairs:96,currentTransformationTargetCoverage:'15/15',networkProtocolPalaces:'12/12',patternsProfessionalReading:'W8_PENDING',topicsProfessionalReading:'W11_PENDING',professionalTimingNavigation:'W12_PENDING'},palaces,customerRules:{onlyAdmittedStateChipVisible:true,unspecifiedPlaceholderVisible:false,humanGatedCandidateMeaningVisible:false,oppositeStarBorrowingAllowed:false,transformationGuaranteeAllowed:false,patternAutoQualificationCreated:false},technical:{humanGatedStarCodes:gatedStars,pendingOrNotApplicableStateCells:pendingStateCells,w2HumanAdmissionRef:'content/professional/zi-wei-professional-reading-r2/review/ziwei-pro-r2-w2-human-review-results-template-v1.json',w17ProfessionalCutoverAllowed:false},boundaries:{symbolicInterpretationNotFixedPersonality:true,candidateDoesNotEqualProductionMeaning:true,noMedicalDiagnosis:true,noFinancialAdvice:true,noGuaranteedEvent:true,noGoodBadScore:true}};
 const professionalDigest=sha256Stable(base);
 if(stableStringify(publicationEnvelope)!==snap)fail('ZIWEI_PRO_R2_INPUT_MUTATION_FORBIDDEN');
 return freeze({...base,professionalDigest});
}

export default Object.freeze({buildZiweiProfessionalReadingR2,composeZiweiProR2StarPalace,ZIWEI_PRO_R2_VISUAL_TYPE,ZIWEI_PRO_R2_PRESENTATION_SCHEMA});
