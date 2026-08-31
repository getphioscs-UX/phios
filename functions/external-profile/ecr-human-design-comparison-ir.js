import crypto from 'node:crypto';
import {HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION} from './human-design-context-transport.js';
import {HD_EXTERNAL_READING_IR_VERSION} from './human-design-external-authority.js';

export const ECR_HD_COMPARISON_IR_VERSION='PHI-OS-ECR-R3-ECR-HD-COMPARISON-IR-v1.0.0';
export const ECR_HD_COMPARISON_RULE_VERSION='PHI-OS-ECR-R3-ECR-HD-COMPARISON-RULES-v1.0.0';

const ECR_RULES=Object.freeze({
  CONTEXT_QUESTION:'COMPOSITION_RULE:CX-COMP-ECR-CONTEXT-GRAMMAR-QUESTION-v1',
  QUESTION_CAPABILITY:'COMPOSITION_RULE:CX-COMP-ECR-QUESTION-CAPABILITY-v1',
  DRIVER_PRIORITY:'COMPOSITION_RULE:CX-COMP-ECR-DRIVER-PRIORITY-v1',
  MOTION_CONFIGURATION:'COMPOSITION_RULE:CX-COMP-ECR-MOTION-CONFIGURATION-v1',
  CONFIGURATION_ACTIVATION:'COMPOSITION_RULE:CX-COMP-ECR-CONFIGURATION-ACTIVATION-v1'
});

const DIMENSIONS=Object.freeze([
  Object.freeze({
    dimensionId:'DECISION_NAVIGATION',
    relationClass:'SHARED_OBSERVATION_DOMAIN',
    ecrDerivationRefs:Object.freeze([ECR_RULES.CONTEXT_QUESTION,ECR_RULES.QUESTION_CAPABILITY,ECR_RULES.DRIVER_PRIORITY]),
    hdClaimCodes:Object.freeze(['HD.STRATEGY','HD.AUTHORITY','HD.MOTIVATION','HD.PERSPECTIVE']),
    copy:Object.freeze({
      en:Object.freeze({label:'Decision and navigation',statement:'Both perspectives can be used to observe how a decision becomes actionable, but they do not describe the same mechanism. ECR keeps the active question, available capability and baseline driver distinct; Human Design contributes only the confirmed Strategy, Authority, Motivation or Perspective lenses that are actually present.',question:'When an important choice appears, what does ECR ask you to notice, what does the confirmed Human Design context ask you to notice, and where do those observations diverge?'}),
      zhHans:Object.freeze({label:'决定与导航',statement:'两个视角都可以用来观察一个决定如何变得可行动，但它们描述的不是同一套机制。ECR 会把当前问题、可用能力与基线驱动力分开；Human Design 只提供客户已经确认、且本次确实存在的 Strategy、Authority、Motivation 或 Perspective 视角。',question:'当一个重要选择出现时，ECR 要你观察什么？已确认的 Human Design 又要你观察什么？两边从哪里开始分开？'})
    })
  }),
  Object.freeze({
    dimensionId:'CARRIER_ACTION_RESPONSE',
    relationClass:'COMPLEMENTARY_LENSES',
    ecrDerivationRefs:Object.freeze([ECR_RULES.QUESTION_CAPABILITY,ECR_RULES.MOTION_CONFIGURATION]),
    hdClaimCodes:Object.freeze(['HD.TYPE','HD.STRATEGY','HD.CENTERS','HD.DEFINITION']),
    copy:Object.freeze({
      en:Object.freeze({label:'Carrier, action and response',statement:'ECR describes which capability the active question calls for and how the surrounding field relates to embodied response. Confirmed Human Design Type, Strategy, Centers or Definition can add a separate carrier-and-action lens. A capability is not a Center, and an ECR response position is not a Type or Definition.',question:'Across real situations, do the two perspectives direct attention to the same moment of action, or to different parts of the carrier–response process?'}),
      zhHans:Object.freeze({label:'载体、行动与回应',statement:'ECR 描述当前问题调用什么能力，以及周围场域与载体回应如何发生关系；已确认的 Human Design Type、Strategy、Centers 或 Definition 可以补充另一种载体与行动视角。ECR 的 capability 不是 Center，ECR 的回应位置也不是 Type 或 Definition。',question:'放回真实情境时，两种视角是在提醒你观察同一个行动时刻，还是在观察载体—回应过程中的不同环节？'})
    })
  }),
  Object.freeze({
    dimensionId:'ENVIRONMENT_CONTEXT',
    relationClass:'SHARED_OBSERVATION_DOMAIN',
    ecrDerivationRefs:Object.freeze([ECR_RULES.MOTION_CONFIGURATION]),
    hdClaimCodes:Object.freeze(['HD.ENVIRONMENT','HD.COGNITION','HD.DETERMINATION','HD.TRAJECTORY','HD.PERSPECTIVE','HD.CENTERS']),
    copy:Object.freeze({
      en:Object.freeze({label:'Environment and context',statement:'ECR has an explicit environment-first configuration convention. Confirmed Human Design Environment, Cognition, PHS/Determination, Variable/Trajectory, Perspective or Centers may also invite observation of context and sensory conditions. Sharing an observation domain does not make the underlying structures equivalent.',question:'Which environmental differences are repeatedly observable, and which descriptions remain specific to only one of the two systems?'}),
      zhHans:Object.freeze({label:'环境与情境',statement:'ECR 有明确的 environment-first configuration 约定；已确认的 Human Design Environment、Cognition、PHS/Determination、Variable/Trajectory、Perspective 或 Centers 也可能要求观察情境与感官条件。两边进入同一个观察领域，并不代表底层结构彼此等价。',question:'哪些环境差异会在现实中反复出现？哪些描述只属于其中一个体系，而不应被硬套到另一个体系？'})
    })
  }),
  Object.freeze({
    dimensionId:'EXPRESSION_RELATIONSHIP_INTEGRATION',
    relationClass:'COMPLEMENTARY_LENSES',
    ecrDerivationRefs:Object.freeze([ECR_RULES.CONTEXT_QUESTION,ECR_RULES.DRIVER_PRIORITY,ECR_RULES.MOTION_CONFIGURATION]),
    hdClaimCodes:Object.freeze(['HD.PROFILE','HD.DEFINITION','HD.CENTERS','HD.CHANNELS','HD.GATES']),
    copy:Object.freeze({
      en:Object.freeze({label:'Expression, relationship and integration',statement:'ECR can frame how background conditions, driver priority and field–response relations organize expression. Confirmed Human Design Profile, Definition, Centers, Channels or Gates can supply a separate relational and expression vocabulary. Neither side is used here to prove identity, compatibility or motive.',question:'Which relational or expression patterns recur across contexts, and which appear only when a particular environment, role or resource condition is present?'}),
      zhHans:Object.freeze({label:'表达、关系与整合',statement:'ECR 可以说明背景条件、驱动力优先级与场域—回应关系如何组织表达；已确认的 Human Design Profile、Definition、Centers、Channels 或 Gates 则提供另一套关系与表达词汇。这里不会用任何一边去证明固定身份、相容性或真实动机。',question:'哪些关系或表达模式会跨情境反复出现？哪些只会在特定环境、角色或资源条件下出现？'})
    })
  }),
  Object.freeze({
    dimensionId:'CHANGE_TIMING_NON_EQUIVALENCE',
    relationClass:'NO_DIRECT_EQUIVALENCE',
    ecrDerivationRefs:Object.freeze([ECR_RULES.MOTION_CONFIGURATION,ECR_RULES.CONFIGURATION_ACTIVATION]),
    hdClaimCodes:Object.freeze(['HD.AUTHORITY']),
    copy:Object.freeze({
      en:Object.freeze({label:'Change and timing: no direct equivalent',statement:'ECR Motion and Activation describe position inside an ECR change window. A confirmed Human Design Authority may also invite observation of timing, but it is not an ECR activation stage. This dimension is intentionally kept as non-equivalent rather than converted into a field-to-field mapping.',question:'What evidence belongs specifically to ECR change/activation, and what belongs specifically to the confirmed Human Design decision-timing lens?'}),
      zhHans:Object.freeze({label:'变化与时机：没有直接对应',statement:'ECR 的 Motion 与 Activation 描述的是 ECR 变化窗口中的位置；已确认的 Human Design Authority 也可能要求观察决定时机，但它不是 ECR activation stage。本维度刻意保留为「没有直接对应」，不会转成字段对字段映射。',question:'哪些现实证据只属于 ECR 的变化／激活结构？哪些只属于已确认 Human Design 的决策时机视角？'})
    })
  })
]);

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const localeOf=value=>value==='zh-Hans'?'zh-Hans':'en';
function fail(code,details={}){const error=Object.assign(new TypeError(code),{code,...details});throw error}

function normalizeEcrReading(reading){
  if(reading?.methodId!=='ECR'||reading?.state!=='READY_TO_READ')fail('ECR_HD_COMPARISON_ACCEPTED_ECR_READING_REQUIRED');
  if(reading?.technical?.acceptanceBasis!=='ADMITTED_COMPOSITION_RULESET'||reading?.technical?.lifecycle?.customerPublishable!==true)fail('ECR_HD_COMPARISON_ECR_PUBLICATION_AUTHORITY_REQUIRED');
  if(!reading?.technical?.interpretationResultId||!reading?.technical?.semanticDigest||!reading?.technical?.derivationDigest)fail('ECR_HD_COMPARISON_ECR_LINEAGE_REQUIRED');
  if(reading?.technical?.boundary?.rendererCreatesMeaning!==false||reading?.technical?.boundary?.realityKnown!==false)fail('ECR_HD_COMPARISON_ECR_BOUNDARY_REQUIRED');
  const insightIndex=new Map(list(reading.insights).map(item=>[item?.insightId,item]));
  const units=list(reading.technical.interpretationUnits).map(technical=>{
    const insight=insightIndex.get(technical?.unitId);
    if(!technical?.unitId||!insight)fail('ECR_HD_COMPARISON_ECR_ACCEPTED_UNIT_REQUIRED',{unitId:technical?.unitId||null});
    if(!list(technical.derivationRefs).length||!list(technical.meaningRefs).length||!list(technical.projectionRefs).length)fail('ECR_HD_COMPARISON_ECR_UNIT_LINEAGE_REQUIRED',{unitId:technical.unitId});
    return freeze({
      interpretationUnitId:technical.unitId,
      title:insight.title||null,
      summary:insight.summary||null,
      plainLanguageExplanation:insight.plainLanguageExplanation||insight.body||null,
      confidenceBoundary:insight.confidenceBoundary||null,
      derivationRefs:freeze(uniq(technical.derivationRefs)),
      meaningRefs:freeze(uniq(technical.meaningRefs)),
      projectionRefs:freeze(uniq(technical.projectionRefs)),
      boundaryRefs:freeze(uniq(technical.boundaryRefs))
    });
  });
  if(!units.length)fail('ECR_HD_COMPARISON_ECR_ACCEPTED_UNIT_REQUIRED');
  return freeze({
    methodId:'ECR',
    interpretationResultId:reading.technical.interpretationResultId,
    projectionId:reading.technical.projectionId||null,
    semanticDigest:reading.technical.semanticDigest,
    derivationDigest:reading.technical.derivationDigest,
    compositionRuleVersion:reading.technical.compositionRuleVersion||null,
    admissionRef:reading.technical.admissionRef||null,
    humanReviewEvidenceRef:reading.technical.humanReviewEvidenceRef||null,
    units:freeze(units)
  });
}

function normalizeHdContext(context){
  if(context?.schemaVersion!==HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION||context?.contextType!=='CONFIRMED_HUMAN_DESIGN_EXTERNAL_CONTEXT')fail('ECR_HD_COMPARISON_CONFIRMED_HD_CONTEXT_REQUIRED');
  if(context?.authorityClass!=='CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT'||context?.readingAvailability?.customerPublishable!==true)fail('ECR_HD_COMPARISON_HD_PUBLICATION_AUTHORITY_REQUIRED');
  if(context?.boundary?.serverRebuiltCanonicalChart!==true||context?.boundary?.clientDerivedChartTrusted!==false||context?.boundary?.xpfCountsTowardMethodAgreement!==false)fail('ECR_HD_COMPARISON_HD_TRANSPORT_BOUNDARY_REQUIRED');
  const reading=context.humanDesignReading;
  if(reading?.schemaVersion!==HD_EXTERNAL_READING_IR_VERSION||reading?.publicationDecision?.customerPublishable!==true)fail('ECR_HD_COMPARISON_HD_READING_REQUIRED');
  if(reading?.boundaries?.customerSuppliedExternalContext!==true||reading?.boundaries?.phiosCalculated!==false||reading?.boundaries?.hdrPublicExecutionUsed!==false)fail('ECR_HD_COMPARISON_HD_READING_BOUNDARY_REQUIRED');
  if(context?.lineage?.profileDigest!==context.sourceProfileDigest||context?.lineage?.readingDigest!==reading.readingDigest)fail('ECR_HD_COMPARISON_HD_LINEAGE_MISMATCH');
  const claims=[];
  for(const section of list(reading.sections))for(const claim of list(section?.claims)){
    if(!claim?.claimCode||claim?.customerConfirmed!==true||claim?.phiosCalculated!==false||claim?.authorityClass!=='CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT')fail('ECR_HD_COMPARISON_HD_CLAIM_BOUNDARY_REQUIRED');
    claims.push(freeze({
      claimCode:claim.claimCode,
      sectionCode:section.sectionCode||null,
      label:claim.label||null,
      value:claim.value,
      explanation:claim.explanation||null,
      runtimeDomains:freeze(uniq(claim.runtimeDomains)),
      boundary:claim.boundary||null,
      sourceRef:claim.sourceRef||null,
      authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',
      customerConfirmed:true,
      phiosCalculated:false
    }));
  }
  if(!claims.length)fail('ECR_HD_COMPARISON_HD_PUBLISHABLE_CLAIM_REQUIRED');
  return freeze({
    methodId:'XPF',
    profileFamily:'HUMAN_DESIGN',
    authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',
    profileDigest:context.sourceProfileDigest,
    chartDigest:context.lineage.chartDigest||null,
    readingDigest:reading.readingDigest,
    compositionDigest:context.lineage.compositionDigest||null,
    transportDigest:context.transportDigest,
    claims:freeze(claims)
  });
}

function unitMatchesRule(unit,rule){return unit.derivationRefs.some(ref=>rule.ecrDerivationRefs.includes(ref))}
function claimMatchesRule(claim,rule){return rule.hdClaimCodes.includes(claim.claimCode)}
function comparisonStatus(ecrUnits,hdClaims){if(ecrUnits.length&&hdClaims.length)return 'READY';if(ecrUnits.length)return 'ECR_ONLY';if(hdClaims.length)return 'HUMAN_DESIGN_ONLY';return 'NO_SOURCE_MATERIAL'}

function buildDimension(rule,ecr,hd,locale){
  const ecrUnits=ecr.units.filter(unit=>unitMatchesRule(unit,rule));
  const hdClaims=hd.claims.filter(claim=>claimMatchesRule(claim,rule));
  const copy=rule.copy[locale==='zh-Hans'?'zhHans':'en'];
  return freeze({
    dimensionId:rule.dimensionId,
    label:copy.label,
    relationClass:rule.relationClass,
    status:comparisonStatus(ecrUnits,hdClaims),
    comparisonStatement:copy.statement,
    observationQuestion:copy.question,
    ecr:Object.freeze({
      authorityClass:'PHI_OS_NATIVE_ECR',
      interpretationUnitRefs:Object.freeze(ecrUnits.map(unit=>unit.interpretationUnitId)),
      units:Object.freeze(ecrUnits)
    }),
    humanDesign:Object.freeze({
      authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',
      claimRefs:Object.freeze(hdClaims.map(claim=>claim.claimCode)),
      claims:Object.freeze(hdClaims)
    }),
    relationBoundary:Object.freeze({
      sharedObservationDomainIsNotAgreement:true,
      directFieldEquivalence:false,
      ecrCoordinateMappedToHumanDesignField:false,
      humanDesignFieldMappedToEcrCoordinate:false,
      compatibilityClaimed:false,
      contradictionClaimed:false,
      causalRelationClaimed:false,
      currentRealityKnown:false
    })
  });
}

export function buildEcrHumanDesignComparisonIR({acceptedEcrReading,humanDesignContext,locale='en'}={}){
  const l=localeOf(locale);
  const ecr=normalizeEcrReading(acceptedEcrReading);
  const hd=normalizeHdContext(humanDesignContext);
  const dimensions=freeze(DIMENSIONS.map(rule=>buildDimension(rule,ecr,hd,l)));
  const usedEcr=new Set(dimensions.flatMap(item=>item.ecr.interpretationUnitRefs));
  const usedHd=new Set(dimensions.flatMap(item=>item.humanDesign.claimRefs));
  const ready=dimensions.filter(item=>item.status==='READY');
  const seed={
    schemaVersion:ECR_HD_COMPARISON_IR_VERSION,
    comparisonRuleVersion:ECR_HD_COMPARISON_RULE_VERSION,
    comparisonType:'ECR_WITH_CONFIRMED_HUMAN_DESIGN',
    locale:l,
    publicationState:'COMPARISON_IR_READY',
    sourceLineage:freeze({
      ecr:freeze({interpretationResultId:ecr.interpretationResultId,projectionId:ecr.projectionId,semanticDigest:ecr.semanticDigest,derivationDigest:ecr.derivationDigest,compositionRuleVersion:ecr.compositionRuleVersion,admissionRef:ecr.admissionRef,humanReviewEvidenceRef:ecr.humanReviewEvidenceRef}),
      humanDesign:freeze({profileDigest:hd.profileDigest,chartDigest:hd.chartDigest,readingDigest:hd.readingDigest,compositionDigest:hd.compositionDigest,transportDigest:hd.transportDigest,authorityClass:hd.authorityClass})
    }),
    dimensions,
    summary:freeze({
      readyDimensionIds:freeze(ready.map(item=>item.dimensionId)),
      sharedObservationDomainIds:freeze(ready.filter(item=>item.relationClass==='SHARED_OBSERVATION_DOMAIN').map(item=>item.dimensionId)),
      complementaryLensIds:freeze(ready.filter(item=>item.relationClass==='COMPLEMENTARY_LENSES').map(item=>item.dimensionId)),
      noDirectEquivalenceIds:freeze(dimensions.filter(item=>item.relationClass==='NO_DIRECT_EQUIVALENCE'&&item.status!=='NO_SOURCE_MATERIAL').map(item=>item.dimensionId)),
      unmappedEcrInterpretationUnitRefs:freeze(ecr.units.filter(unit=>!usedEcr.has(unit.interpretationUnitId)).map(unit=>unit.interpretationUnitId)),
      unmappedHumanDesignClaimRefs:freeze(hd.claims.filter(claim=>!usedHd.has(claim.claimCode)).map(claim=>claim.claimCode))
    }),
    boundaries:freeze({
      comparisonIrCreated:true,
      customerRendererCreated:false,
      ecrRemainsPhiOsNative:true,
      humanDesignRemainsCustomerSuppliedExternalContext:true,
      phiosHumanDesignCalculationAuthorityCreated:false,
      humanDesignRecalculated:false,
      hdrPublicExecutionUsed:false,
      directFieldEquivalenceCreated:false,
      ecrCoordinateToHumanDesignFieldMappingCreated:false,
      humanDesignFieldToEcrCoordinateMappingCreated:false,
      methodAgreementClaimed:false,
      convergenceClaimed:false,
      compatibilityScoreCreated:false,
      contradictionResolved:false,
      methodVoteCreated:false,
      xpfCountsTowardMethodAgreement:false,
      newEcrMeaningCreated:false,
      newHumanDesignMeaningCreated:false,
      currentRealityEvidenceCreated:false,
      currentRealityConclusionCreated:false,
      rendererCreatesMeaning:false,
      persisted:false,
      runtimeMemoryWritten:false
    })
  };
  return freeze({...seed,comparisonDigest:digest(seed)});
}

export default Object.freeze({
  ECR_HD_COMPARISON_IR_VERSION,
  ECR_HD_COMPARISON_RULE_VERSION,
  buildEcrHumanDesignComparisonIR
});
