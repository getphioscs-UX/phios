import {adaptAcceptedMethodReadingEnvelope} from './method-production-adapter-core.js';
import {buildCustomerClaimIR} from './customer-claim-ir.js';
import {resolveCustomerPriorities} from './customer-priority-resolver.js';
import {composeCustomerThemes} from './customer-theme-composer.js';
import {deduplicateClaims} from './claim-deduplicator.js';
import {resolveSectionInformationGain} from './section-information-gain-resolver.js';
import {preserveContradictions} from './contradiction-preservation.js';
import {buildCustomerNarrativeIR} from './customer-narrative-ir.js';
import {buildCustomerReadingIA} from './customer-reading-ia.js';
import {buildCustomerReadingLayout} from './customer-reading-layout.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

export const SMR_R2_PRODUCTION_ADMISSION=freeze({
  schemaVersion:'PHI-OS-SMR-R2-PRODUCTION-ADMISSION-v1.0.0',
  productionAllowed:true,
  customerCutoverAllowed:true,
  methods:{AST:true,BZR:true,ZWR:true,NUM:true,ECR:true},
  humanReview:{benchmark5of5:true,integration20of20:true},
  structuralDiversity40of40:true,
  singleApi:'/api/customer-personal-reality',
  crossMethodComposition:false
});

export async function maybeBuildProductionSingleMethodReadingR2({methodResult,customerIntent=null,locale='en'}={}){
  const methodId=methodResult?.methodId;
  if(SMR_R2_PRODUCTION_ADMISSION.productionAllowed!==true||SMR_R2_PRODUCTION_ADMISSION.methods[methodId]!==true)return null;
  if(methodResult?.state!=='READY_TO_READ')return null;
  const envelope=adaptAcceptedMethodReadingEnvelope(methodResult,{expectedMethodId:methodId});
  const claims=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope,customerIntent});
  const priority=resolveCustomerPriorities({claimCollection:claims,customerIntent});
  const themes=composeCustomerThemes({priorityResolution:priority});
  const claimDedup=deduplicateClaims({claims:priority.claims});
  const informationGain=resolveSectionInformationGain({priorityResolution:priority,themeCollection:themes});
  const contradiction=preserveContradictions({priorityResolution:priority,themeCollection:themes,claimDedup});
  const narrative=buildCustomerNarrativeIR({priorityResolution:priority,themeCollection:themes,sectionInformationGain:informationGain,contradictionPreservation:contradiction});
  const readingIA=buildCustomerReadingIA({narrativeIR:narrative});
  const layout=buildCustomerReadingLayout({readingIA});
  return freeze({
    schemaVersion:'PHI-OS-SINGLE-METHOD-READING-R2-PRODUCTION-v1.0.0',
    state:'PRODUCTION',methodId,locale,readingAuthorityRef:envelope.readingAuthorityRef,semanticDigest:envelope.semanticDigest,
    readingIA,layout,
    technical:freeze({
      defaultCollapsed:true,
      interpretationUnitRefs:uniq(envelope.interpretationUnitRefs),
      sourceLineage:uniq(envelope.sourceLineage),
      ruleLineage:uniq(envelope.ruleLineage),
      boundaryFlags:uniq(envelope.boundaryFlags),
      claimCount:priority.claims.length,
      themeCount:themes.themes.length,
      eligibleSectionRefs:readingIA.sections.filter(section=>section.eligibility==='SECTION_ELIGIBLE').map(section=>section.sectionId),
      suppressedDuplicateCount:narrative.narrativeDedup?.suppressedDuplicateCount||0
    }),
    governance:freeze({
      productionAdmission:'R2_W17_5_OF_5_PLUS_W18_40_OF_40_PLUS_W19_20_OF_20',
      humanReviewedProductComposition:true,
      liveCustomerIndividuallyHumanReviewed:false,
      rawProjectionCreatesCustomerConclusion:false,
      rendererCreatesMeaning:false,
      methodRuntimeRecalculated:false,
      crossMethodCompositionPerformed:false,
      webMobilePrintConsumeSameIA:true,
      technicalDefaultCollapsed:true
    })
  });
}
