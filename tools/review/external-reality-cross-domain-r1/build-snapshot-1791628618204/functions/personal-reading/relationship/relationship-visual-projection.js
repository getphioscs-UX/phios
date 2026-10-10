import {createHash} from 'node:crypto';
import {RELATIONSHIP_NARRATIVE_BRIEF_SCHEMA} from './relationship-narrative-brief.js';

export const RELATIONSHIP_VISUAL_PROJECTION_SCHEMA='PHI-OS-PVP-R1-RELATIONSHIP-VISUAL-PROJECTION-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const arr=value=>Array.isArray(value)?value:[];
const text=value=>String(value??'').trim();
const uniq=values=>[...new Set(values.map(text).filter(Boolean))];
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const signal=x=>freeze({signalId:text(x?.signalId)||null,kind:text(x?.kind)||'OPEN',statement:text(x?.statement),refs:freeze(uniq(arr(x?.refs))),methods:freeze(uniq(arr(x?.methods))),sourceClasses:freeze(uniq(arr(x?.sourceClasses))),qualifier:text(x?.qualifier)||null});
const take=(xs,n)=>freeze(arr(xs).filter(x=>text(x?.statement)).slice(0,n).map(signal));

export function buildRelationshipVisualProjection(brief,{depth='FREE'}={}){
  if(brief?.schemaVersion!==RELATIONSHIP_NARRATIVE_BRIEF_SCHEMA)throw Object.assign(new Error('PVP_REL_REL_W7_BRIEF_REQUIRED'),{code:'PVP_REL_REL_W7_BRIEF_REQUIRED'});
  if(brief?.governance?.compatibilityScoreCreated!==false)throw Object.assign(new Error('PVP_REL_COMPATIBILITY_SCORE_BOUNDARY_REQUIRED'),{code:'PVP_REL_COMPATIBILITY_SCORE_BOUNDARY_REQUIRED'});
  if(brief?.governance?.partnerHiddenStateInferred!==false)throw Object.assign(new Error('PVP_REL_PARTNER_HIDDEN_STATE_BOUNDARY_REQUIRED'),{code:'PVP_REL_PARTNER_HIDDEN_STATE_BOUNDARY_REQUIRED'});
  const mode=brief.relationshipIntent?.mode;
  const specific=mode==='SPECIFIC_PERSON_RELATIONSHIP';
  if(specific&&!brief.participantB)throw Object.assign(new Error('PVP_REL_PARTICIPANT_B_REQUIRED'),{code:'PVP_REL_PARTICIPANT_B_REQUIRED'});
  if(!specific&&brief.participantB)throw Object.assign(new Error('PVP_REL_SELF_PATTERN_PARTICIPANT_B_FORBIDDEN'),{code:'PVP_REL_SELF_PATTERN_PARTICIPANT_B_FORBIDDEN'});
  const sourceClasses=uniq(arr(brief.sourceClassLocks).map(x=>x?.sourceClass));
  const methods=uniq([
    ...arr(brief.participantA?.relevantMethodRefs),...arr(brief.participantB?.relevantMethodRefs),
    ...arr(brief.connectionDynamics).flatMap(x=>arr(x?.methods)),...arr(brief.complementaryDynamics).flatMap(x=>arr(x?.methods)),...arr(brief.tensions).flatMap(x=>arr(x?.methods))
  ]);
  const rfigs=freeze({
    'RFIG-001':freeze({visualId:'RFIG-001',visualCode:'REL-A-B-STRUCTURE-MAP',state:'READY',participantA:freeze({participantRef:brief.participantA?.participantRef||null,baselineThemes:take(brief.participantA?.baselineThemes,4)}),participantB:specific?freeze({participantRef:brief.participantB?.participantRef||null,baselineThemes:take(brief.participantB?.baselineThemes,4),precisionBoundary:freeze(arr(brief.participantB?.precisionBoundary).slice(0,8))}):null,governance:freeze({participantsRemainDistinct:true,identityMerge:false})}),
    'RFIG-002':freeze({visualId:'RFIG-002',visualCode:'REL-CONVERGENCE-TENSION',state:'READY',connection:take(brief.connectionDynamics,4),tension:take(brief.tensions,4),nonConvergence:take(brief.nonConvergence,3),governance:freeze({convergenceIsNotTruthVote:true,compatibilityScoreCreated:false})}),
    'RFIG-003':freeze({visualId:'RFIG-003',visualCode:'REL-COMPLEMENTARITY',state:specific?'READY':'NOT_APPLICABLE',complementarity:specific?take(brief.complementaryDynamics,4):freeze([]),asymmetries:specific?take(brief.asymmetries,3):freeze([]),misreadRisks:specific?take(brief.misreadRisks,3):freeze([]),governance:freeze({partnerHiddenStateInferred:false,stayLeaveDirectiveCreated:false})}),
    'RFIG-004':freeze({visualId:'RFIG-004',visualCode:'REL-METHOD-EVIDENCE-MAP',state:'READY',methods:freeze(methods),sourceClasses:freeze(sourceClasses),profileSourceClasses:freeze(uniq(arr(brief.profileSourceClassLocks).map(x=>x?.sourceClass))),sourceLockCount:arr(brief.sourceClassLocks).length,governance:freeze({sourceClassesRemainDistinct:true,methodVoting:false,scientificValidationClaim:false})}),
    'RFIG-005':freeze({visualId:'RFIG-005',visualCode:'REL-REALITY-BRIDGE',state:'READY',currentReality:take(brief.currentReality,4),counterEvidence:freeze(arr(brief.counterEvidence).slice(0,4).map(text).filter(Boolean)),openQuestions:freeze(arr(brief.dynamicCuriosityQuestions).slice(0,3).map(text).filter(Boolean)),governance:freeze({currentRealityCustomerControlled:true,currentRealityProvesMethod:false,currentRealityDisprovesMethod:false,automaticPersistence:false})})
  });
  const seed={schemaVersion:RELATIONSHIP_VISUAL_PROJECTION_SCHEMA,relationshipIntentId:brief.relationshipIntent.relationshipIntentId,mode,locale:brief.relationshipIntent.locale,sourceBriefId:brief.briefId,sourceBriefDigest:brief.briefSemanticDigest,depth:depth==='DEEP'?'DEEP':'FREE',rfigs,visibleFree:['RFIG-001','RFIG-002','RFIG-005'],deepAdditional:['RFIG-003','RFIG-004'],governance:{projectionOnly:true,relW7MeaningAuthorityPreserved:true,compatibilityScoreCreated:false,partnerHiddenStateInferred:false,relationshipOutcomeGuaranteed:false,commerceAuthorityCreated:false}};
  return freeze({...seed,projectionDigest:digest(seed)});
}

export default Object.freeze({buildRelationshipVisualProjection});
