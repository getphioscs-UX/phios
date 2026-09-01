import crypto from 'node:crypto';
import {adaptCanonicalHumanDesignChartToR3Facts} from '../../external-profile/human-design-r3-facts-adapter.js';
import {HD_R3_RUNTIME_SOURCE_INDEX as HD_INDEX} from '../../external-profile/human-design-r3-runtime-source-index.js';
import {HD_REL_R1_SEMANTIC_INDEX as SEMANTICS} from './hd-rel-r1-semantic-index.js';

export const HD_REL_R1_COMPOSITE_SCHEMA='PHI-OS-HD-REL-R1-COMPOSITE-STRUCTURE-IR-v1.0.0';
export const HD_REL_R1_COMPOSITION_SCHEMA='PHI-OS-HD-REL-R1-RELATIONSHIP-COMPOSITION-v1.0.0';
export const HD_REL_R1_REALITY_SCHEMA='PHI-OS-HD-REL-R1-REALITY-COMPOSITION-v1.0.0';
const ACCEPTED='PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0';
const CLAIM_SCHEMA='PHI-OS-METHOD-RELATIONSHIP-CLAIM-v1.0.0';
const RESPONSE_STATES=Object.freeze(['CONFIRMS','PARTIALLY_CONFIRMS','CONTRADICTS','NOT_OBSERVED','CONTEXT_DEPENDENT']);
const CLASS_ORDER=Object.freeze(['ELECTROMAGNETIC','COMPANIONSHIP','DOMINANCE','COMPROMISE']);
const FORBIDDEN_KEYS=new Set(['compatibilityScore','compatibilityPercentage','matchPercentage','soulmate','destinedRelationship','relationshipVerdict','partnerHiddenState','partnerHiddenFeeling','stayLeaveDirective']);

function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function stable(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return `[${v.map(stable).join(',')}]`;return `{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;}
function digest(v){return crypto.createHash('sha256').update(stable(v)).digest('hex');}
function uniq(a){return [...new Set((a||[]).filter(x=>x!==null&&x!==undefined&&x!==''))];}
function scan(v,path='$'){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){if(FORBIDDEN_KEYS.has(k))fail(`HD_REL_R1_FORBIDDEN_FIELD:${path}.${k}`,409);scan(x,`${path}.${k}`);}}
function accepted(x,side){if(x?.schemaVersion!==ACCEPTED||x.methodId!=='HD'||x.boundary?.acceptedAuthorityOnly!==true)fail(`HD_REL_R1_${side}_ACCEPTED_HD_READING_REQUIRED`,400);return x;}
function confirmedChart(x,side){if(!x||x.profileFamily!=='HUMAN_DESIGN'||x.authorityClass!=='CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT'||x.provenance?.customerConfirmed!==true)fail(`HD_REL_R1_${side}_CONFIRMED_EXTERNAL_HD_CHART_REQUIRED`,400);if(x.provenance?.phiosCalculated===true||x.provenance?.automaticHumanDesignCalculationUsed===true)fail(`HD_REL_R1_${side}_PHIOS_CALCULATED_CHART_FORBIDDEN`,409);return x;}
function gateSet(chart,facts){const s=new Set((chart.structure?.activations||[]).map(x=>Number(x.gate)).filter(g=>HD_INDEX.gates[String(g)]));for(const ch of facts.channels||[])for(const g of ch.gates)s.add(g);return s;}
function stateOf(facts,center){for(const k of ['defined','undefined','open','unknown'])if(facts.centers?.[k]?.includes(center))return k.toUpperCase();return 'UNKNOWN';}
function channelOwned(facts,id){return Boolean((facts.channels||[]).find(x=>x.channelId===id));}
function relationId(kind,subject,a,b){return `HDREL-${kind}-${subject}-${digest({kind,subject,a,b}).slice(0,16).toUpperCase()}`;}
function ownersForEndpoint(aGates,bGates,g){const out=[];if(aGates.has(g))out.push('A');if(bGates.has(g))out.push('B');return out;}

export function buildHdRelationshipCompositeStructure({acceptedA,acceptedB,chartA,chartB,participantARef='A',participantBRef='B'}={}){
  accepted(acceptedA,'A');accepted(acceptedB,'B');confirmedChart(chartA,'A');confirmedChart(chartB,'B');
  if(!participantARef||!participantBRef||participantARef===participantBRef)fail('HD_REL_R1_DISTINCT_PARTICIPANTS_REQUIRED',400);
  const factsA=adaptCanonicalHumanDesignChartToR3Facts(chartA),factsB=adaptCanonicalHumanDesignChartToR3Facts(chartB);
  const aGates=gateSet(chartA,factsA),bGates=gateSet(chartB,factsB);
  const gateContributions=uniq([...aGates,...bGates]).sort((a,b)=>a-b).map(g=>freeze({gate:g,center:HD_INDEX.gates[String(g)]?.center||null,owners:ownersForEndpoint(aGates,bGates,g),sourceRefs:uniq([...(factsA.sourceRefsBySubject?.[`GATE.${g}`]||[]),...(factsB.sourceRefsBySubject?.[`GATE.${g}`]||[])])}));
  const channelInteractions=[];const primaryOwnedGates=new Set();
  for(const row of Object.values(HD_INDEX.channels)){
    const id=row.channelId,[g1,g2]=[row.gateA,row.gateB];const aFull=channelOwned(factsA,id),bFull=channelOwned(factsB,id);const a1=aGates.has(g1),a2=aGates.has(g2),b1=bGates.has(g1),b2=bGates.has(g2);const aCount=Number(a1)+Number(a2),bCount=Number(b1)+Number(b2);
    let interactionClass=null,ownerSide=null,contributionPattern=null,relationshipOnlyCompletion=false,inconsistent=false;
    if(aFull&&bFull){interactionClass='COMPANIONSHIP';ownerSide='BOTH';contributionPattern='BOTH_FULL_CHANNEL';}
    else if(aFull!==bFull){const fullSide=aFull?'A':'B',otherCount=aFull?bCount:aCount;ownerSide=fullSide;if(otherCount===0){interactionClass='DOMINANCE';contributionPattern=`${fullSide}_FULL_OTHER_NONE`;}else if(otherCount===1){interactionClass='COMPROMISE';contributionPattern=`${fullSide}_FULL_OTHER_ONE_GATE`;}else{inconsistent=true;contributionPattern=`${fullSide}_FULL_OTHER_BOTH_GATES_UNLISTED_CHANNEL`;}}
    else if(!aFull&&!bFull&&aCount===1&&bCount===1&&((a1&&b2)||(a2&&b1))){interactionClass='ELECTROMAGNETIC';ownerSide='RELATIONSHIP_FIELD';contributionPattern='COMPLEMENTARY_ENDPOINTS';relationshipOnlyCompletion=true;}
    if(!interactionClass&&!inconsistent)continue;
    const sourceRefs=uniq([...(factsA.sourceRefsBySubject?.[`CHANNEL.${id}`]||[]),...(factsB.sourceRefsBySubject?.[`CHANNEL.${id}`]||[]),'HD-REL-SRC-DISTINCTION-SCIENCE-P58-P60']);
    const r=freeze({relationId:relationId('CHANNEL',id,{aFull,a1,a2},{bFull,b1,b2}),channelId:id,gateA:g1,gateB:g2,centerA:row.centerA,centerB:row.centerB,interactionClass,ownerSide,contributionPattern,relationshipOnlyCompletion,inconsistent,participantA:{fullChannel:aFull,gateA:a1,gateB:a2},participantB:{fullChannel:bFull,gateA:b1,gateB:b2},sourceRefs,boundary:{relationshipFieldOnly:relationshipOnlyCompletion,natalChartARewritten:false,natalChartBRewritten:false,compositeAuthorityCreated:false}});
    channelInteractions.push(r);if(interactionClass&&!inconsistent){primaryOwnedGates.add(g1);primaryOwnedGates.add(g2);}
  }
  const gateCompanionships=[];for(const g of [...aGates].filter(x=>bGates.has(x)).sort((a,b)=>a-b)){const primaryChannelRefs=channelInteractions.filter(r=>r.interactionClass&&!r.inconsistent&&(r.gateA===g||r.gateB===g)).map(r=>r.relationId);gateCompanionships.push(freeze({relationId:relationId('GATE',String(g),participantARef,participantBRef),gate:g,center:HD_INDEX.gates[String(g)]?.center||null,interactionClass:'COMPANIONSHIP',primaryChannelRefs,suppressedByChannelOwner:primaryChannelRefs.length>0,sourceRefs:uniq([...(factsA.sourceRefsBySubject?.[`GATE.${g}`]||[]),...(factsB.sourceRefsBySubject?.[`GATE.${g}`]||[]),'HD-REL-SRC-DISTINCTION-SCIENCE-P58-P60'])}));}
  const compositeChannels=channelInteractions.filter(x=>x.interactionClass&&!x.inconsistent).map(x=>x.channelId);const fieldDefinedCenters=new Set();for(const id of compositeChannels){const c=HD_INDEX.channels[id];if(c){fieldDefinedCenters.add(c.centerA);fieldDefinedCenters.add(c.centerB)}}
  const centerField=Object.keys(HD_INDEX.centers).map(k=>k.split('.')[0]).filter((x,i,a)=>a.indexOf(x)===i).map(center=>{const supporting=channelInteractions.filter(r=>r.interactionClass&&!r.inconsistent&&(r.centerA===center||r.centerB===center)).map(r=>r.relationId);return freeze({center,participantAState:stateOf(factsA,center),participantBState:stateOf(factsB,center),relationshipFieldDefined:fieldDefinedCenters.has(center),supportingChannelRelationRefs:supporting,contextualOnly:true});});
  const core={schemaVersion:HD_REL_R1_COMPOSITE_SCHEMA,methodId:'HD',relationshipScale:'DYADIC_A_X_B',participantRefs:{A:participantARef,B:participantBRef},acceptedReadingRefs:{A:acceptedA.readingAuthorityRef,B:acceptedB.readingAuthorityRef},chartRefs:{A:chartA.chartDigest||digest(chartA),B:chartB.chartDigest||digest(chartB)},factsDigests:{A:factsA.factsDigest,B:factsB.factsDigest},gateContributions,channelInteractions,gateCompanionships,centerField,sourceRefs:['HD-REL-SRC-DISTINCTION-SCIENCE-P58-P60','HD-REL-SRC-HD-PRO-R3-W8','HD-REL-SRC-HD-PRO-R3-W9'],boundaries:{confirmedExternalChartsOnly:true,phiosHumanDesignBirthCalculationUsed:false,participantChartsRemainDistinct:true,relationshipCompositeIsNotNatalChart:true,compositeTypeCreated:false,compositeAuthorityCreated:false,individualAuthorityPreserved:true,compatibilityScoreCreated:false,partnerHiddenStateInferred:false,relationshipOutcomePredicted:false,pentaCreated:false,bg5Created:false}};
  scan(core);return freeze({...core,semanticDigest:digest(core)});
}

function text(v,locale){return locale==='en'?v?.en:v?.zhHans||v?.en||'';}
function semanticTemplateForRelation(relation){return SEMANTICS.channelClaims[`${relation.channelId}|${relation.interactionClass}`]||null;}
function participantOwnership(relation){if(relation.ownerSide==='A')return 'A';if(relation.ownerSide==='B')return 'B';if(relation.ownerSide==='BOTH')return 'A+B';return 'RELATIONSHIP_FIELD';}

export function composeHdRelationshipSemanticClaims({composite,locale='zh-Hans'}={}){
  if(composite?.schemaVersion!==HD_REL_R1_COMPOSITE_SCHEMA)fail('HD_REL_R1_COMPOSITE_STRUCTURE_REQUIRED',400);
  const claims=[];const owners=new Set();
  for(const relation of composite.channelInteractions||[]){if(!relation.interactionClass||relation.inconsistent)continue;const tpl=semanticTemplateForRelation(relation);if(!tpl)fail(`HD_REL_R1_CHANNEL_TEMPLATE_REQUIRED:${relation.channelId}:${relation.interactionClass}`,409);if(owners.has(tpl.semanticOwnerId))continue;owners.add(tpl.semanticOwnerId);
    const owner=participantOwnership(relation),primaryRef=relation.relationId;const supportRefs=[primaryRef,`HD_REL_OWNER:${owner}`,`HD_REL_CHANNEL:${relation.channelId}`,...(relation.sourceRefs||[])];
    claims.push(freeze({schemaVersion:CLAIM_SCHEMA,relationshipClaimId:`HDRELCL-${digest({owner:tpl.semanticOwnerId,composite:composite.semanticDigest}).slice(0,24).toUpperCase()}`,methodId:'HD',participantARefs:[composite.acceptedReadingRefs.A,composite.chartRefs.A],participantBRefs:[composite.acceptedReadingRefs.B,composite.chartRefs.B],compositionRuleId:`HD-REL-R1-W2-${relation.interactionClass}`,semanticOwnerId:tpl.semanticOwnerId,claimClass:tpl.claimClass,headline:text(tpl.headline,locale),summary:text(tpl.relationshipMeaning,locale),supportRefs:uniq(supportRefs),tensionRefs:relation.interactionClass==='COMPROMISE'?[`HD_REL_ADJUSTMENT_PRESSURE:${relation.channelId}`]:[],conditionRefs:[relation.contributionPattern],counterRefs:[text(tpl.counterObservation,locale)],timingRefs:[],precisionBoundaryRefs:['CONFIRMED_EXTERNAL_HD_CHART:A','CONFIRMED_EXTERNAL_HD_CHART:B','NO_BIRTH_DATA_RECALCULATION'],sourceRefs:uniq(tpl.sourceRefs),customerPublishable:false,governance:{humanAdmissionState:'PENDING',rendererCreatesMeaning:false,crossMethodMeaningCreated:false,compatibilityScoreCreated:false,partnerHiddenStateInferred:false,guaranteedOutcomeCreated:false,channelPrimarySemanticOwner:true,gateEvidenceSupportingOnly:true,centerEvidenceContextOnly:true,individualAuthorityPreserved:true}}));
  }
  const usedGates=new Set((composite.channelInteractions||[]).filter(r=>r.interactionClass&&!r.inconsistent).flatMap(r=>[r.gateA,r.gateB]));
  for(const relation of composite.gateCompanionships||[]){if(relation.suppressedByChannelOwner||usedGates.has(relation.gate))continue;const tpl=SEMANTICS.gateClaims[String(relation.gate)];if(!tpl||owners.has(tpl.semanticOwnerId))continue;owners.add(tpl.semanticOwnerId);claims.push(freeze({schemaVersion:CLAIM_SCHEMA,relationshipClaimId:`HDRELCL-${digest({owner:tpl.semanticOwnerId,composite:composite.semanticDigest}).slice(0,24).toUpperCase()}`,methodId:'HD',participantARefs:[composite.acceptedReadingRefs.A,composite.chartRefs.A],participantBRefs:[composite.acceptedReadingRefs.B,composite.chartRefs.B],compositionRuleId:'HD-REL-R1-W2-COMPANIONSHIP-GATE',semanticOwnerId:tpl.semanticOwnerId,claimClass:'CONNECTION',headline:text(tpl.headline,locale),summary:text(tpl.relationshipMeaning,locale),supportRefs:[relation.relationId,`HD_REL_SHARED_GATE:${relation.gate}`],tensionRefs:[],conditionRefs:['SHARED_GATE_NO_HIGHER_PRIORITY_CHANNEL_OWNER'],counterRefs:[text(tpl.counterObservation,locale)],timingRefs:[],precisionBoundaryRefs:['CONFIRMED_EXTERNAL_HD_CHART:A','CONFIRMED_EXTERNAL_HD_CHART:B','NO_BIRTH_DATA_RECALCULATION'],sourceRefs:uniq(tpl.sourceRefs),customerPublishable:false,governance:{humanAdmissionState:'PENDING',rendererCreatesMeaning:false,crossMethodMeaningCreated:false,compatibilityScoreCreated:false,partnerHiddenStateInferred:false,guaranteedOutcomeCreated:false,channelPrimarySemanticOwner:false,gatePrimaryOnlyBecauseNoChannelOwner:true,centerEvidenceContextOnly:true,individualAuthorityPreserved:true}}));}
  const centerEvidence=(composite.centerField||[]).filter(x=>x.relationshipFieldDefined&&x.supportingChannelRelationRefs.length).map(x=>freeze({center:x.center,participantAState:x.participantAState,participantBState:x.participantBState,supportingChannelRelationRefs:x.supportingChannelRelationRefs,semanticRole:'SUPPORTING_CONTEXT_ONLY'}));
  const core={schemaVersion:HD_REL_R1_COMPOSITION_SCHEMA,methodId:'HD',compositeDigest:composite.semanticDigest,locale,claims,claimCount:claims.length,centerEvidence,customerPublishable:false,governance:{onePrimaryOwnerPerSemanticCluster:true,channelOverGatePrecedence:true,gateOverCenterPrecedence:true,humanAdmissionRequired:true,humanAdmissionState:'PENDING',genericCompatibilityEngineCreated:false,relationshipOutcomePredicted:false,individualAuthorityPreserved:true}};
  scan(core);return freeze({...core,semanticDigest:digest(core)});
}

export function buildHdRelationshipRealityComposition({composition,locale='zh-Hans',maxQuestions=8}={}){
  if(composition?.schemaVersion!==HD_REL_R1_COMPOSITION_SCHEMA)fail('HD_REL_R1_COMPOSITION_REQUIRED',400);
  const questions=[];for(const claim of composition.claims||[]){let tpl=null;if(claim.semanticOwnerId.startsWith('HD_REL:CHANNEL:')){const parts=claim.semanticOwnerId.split(':');tpl=SEMANTICS.channelClaims[`${parts[2]}|${parts[3]}`];}else if(claim.semanticOwnerId.startsWith('HD_REL:GATE:')){tpl=SEMANTICS.gateClaims[claim.semanticOwnerId.split(':')[2]];}if(!tpl)continue;const interactionClass=tpl.interactionClass;questions.push(freeze({realityQuestionId:`HDRELQ-${digest({claim:claim.relationshipClaimId,locale}).slice(0,20).toUpperCase()}`,semanticOwnerId:claim.semanticOwnerId,relationshipClaimId:claim.relationshipClaimId,interactionClass,domain:interactionClass==='DOMINANCE'||interactionClass==='COMPROMISE'?'ASYMMETRY':'RELATIONSHIP_STRUCTURE',question:text(tpl.realityObservation,locale),counterPrompt:text(tpl.counterObservation,locale),responseStates:RESPONSE_STATES,sourceRefs:claim.sourceRefs}));}
  const selected=questions.slice(0,Math.max(1,Math.min(Number(maxQuestions)||8,12)));const core={schemaVersion:HD_REL_R1_REALITY_SCHEMA,methodId:'HD',compositionDigest:composition.semanticDigest,questions:selected,totalEligibleQuestions:questions.length,responseStates:RESPONSE_STATES,governance:{semanticOwnerGenerated:true,genericTraitQuestionCreated:false,customerContradictionIsValidEvidence:true,realityDoesNotProveHumanDesign:true,partnerHiddenStateInferred:false,compatibilityScoreCreated:false}};scan(core);return freeze({...core,semanticDigest:digest(core)});
}

export function composeHdDualChartRelationship({acceptedA,acceptedB,chartA,chartB,participantARef='A',participantBRef='B',locale='zh-Hans'}={}){
  const composite=buildHdRelationshipCompositeStructure({acceptedA,acceptedB,chartA,chartB,participantARef,participantBRef});
  const composition=composeHdRelationshipSemanticClaims({composite,locale});
  const reality=buildHdRelationshipRealityComposition({composition,locale});
  return freeze({schemaVersion:'PHI-OS-HD-REL-R1-DUAL-CHART-RELATIONSHIP-RESULT-v1.0.0',methodId:'HD',composite,composition,reality,claimCount:composition.claimCount,customerPublishable:false,boundaries:{humanAdmissionRequired:true,humanAccepted:false,compatibilityScoreCreated:false,soulmateVerdictCreated:false,partnerHiddenStateInferred:false,guaranteedOutcomeCreated:false,individualAuthorityPreserved:true,phiosHumanDesignBirthCalculationUsed:false,pentaCreated:false,bg5Created:false}});
}

export default Object.freeze({buildHdRelationshipCompositeStructure,composeHdRelationshipSemanticClaims,buildHdRelationshipRealityComposition,composeHdDualChartRelationship});
