import {AST_MEANING_ONTOLOGY} from './ast-customer-reading-authority-v2.js';
import {composeAstPlanetSignMeaning} from './ast-planet-sign-composition-runtime.js';
import {
  AST_MFP_R_PLANET_SIGN_COMPOSITION_RULE,
  AST_MFP_R_PLANET_SIGN_HUMAN_ADMISSION,
  AST_MFP_R_PLANET_SIGN_PRODUCTION_ADMISSION
} from './ast-mfp-r-planet-sign-production-authority.js';

const PLANETS=Object.freeze(['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO']);
const SIGNS=Object.freeze(['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES']);
const list=v=>Array.isArray(v)?v:[];
const norm=x=>((Number(x)%360)+360)%360;
const signOf=longitude=>SIGNS[Math.floor(norm(longitude)/30)]||null;
const uniq=v=>[...new Set(list(v).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};

function governanceReady(){
  return AST_MFP_R_PLANET_SIGN_HUMAN_ADMISSION.status==='HUMAN_ACCEPTED'
    && AST_MFP_R_PLANET_SIGN_HUMAN_ADMISSION.accepted===24
    && AST_MFP_R_PLANET_SIGN_HUMAN_ADMISSION.rejected===0
    && AST_MFP_R_PLANET_SIGN_HUMAN_ADMISSION.pending===0
    && AST_MFP_R_PLANET_SIGN_PRODUCTION_ADMISSION.status==='PRODUCTION_ADMITTED'
    && AST_MFP_R_PLANET_SIGN_PRODUCTION_ADMISSION.productionAllowed===true
    && AST_MFP_R_PLANET_SIGN_PRODUCTION_ADMISSION.customerRuntimeUseAllowed===true
    && AST_MFP_R_PLANET_SIGN_PRODUCTION_ADMISSION.boundaries?.rendererMeaningCreated===false;
}

function primarySubjects(methodResult){
  return new Set(list(methodResult?.technical?.interpretationUnits)
    .filter(unit=>list(unit.semanticTags).includes('PRIMARY'))
    .map(unit=>list(unit.semanticTags).find(tag=>PLANETS.includes(tag)))
    .filter(Boolean));
}

export function buildAstMfpRPlanetSignEvidenceUnits(methodResult){
  if(methodResult?.methodId!=='AST'||methodResult?.state!=='READY_TO_READ'||!governanceReady())return freeze([]);
  const nodes=list(methodResult?.visualModel?.nodes).filter(node=>node?.role==='BODY'&&PLANETS.includes(node.label)&&Number.isFinite(Number(node.value)));
  if(nodes.length!==10)return freeze([]);
  const projectionId=methodResult?.technical?.projectionId;
  if(!projectionId)return freeze([]);
  const locale=methodResult.locale==='zh-Hans'?'zh-Hans':'en';
  return freeze(nodes.map(node=>{
    const signCode=signOf(node.value);
    const candidate=composeAstPlanetSignMeaning({
      planetCode:node.label,signCode,locale,meaningOntology:AST_MEANING_ONTOLOGY,
      compositionRule:AST_MFP_R_PLANET_SIGN_COMPOSITION_RULE
    });
    return {
      schemaVersion:'PHI-OS-AST-MFP-R-PLANET-SIGN-PRODUCTION-UNIT-v1.0.0',
      workCode:'MFP-R-AST-001',state:'CUSTOMER_PUBLISHABLE',
      recoveryUnitId:`AST-MFP-R-PS-${node.label}-${signCode}`,
      planetCode:node.label,signCode,planetLabel:candidate.planetLabel,signLabel:candidate.signLabel,
      customerText:candidate.customerText,
      projectionRefs:[`${projectionId}#POSITION:${node.label}`],
      meaningRefs:candidate.sourceRefs.slice(0,2),
      sourceRefs:candidate.sourceRefs,
      derivationRefs:['COMPOSITION_RULE:MFP-R-AST-001-PLANET-SIGN-v1'],
      boundaryRefs:[
        'MFP-R-AST-001:HUMAN_ACCEPTED_24_OF_24',
        'MFP-R-AST-001:PRODUCTION_ADMITTED',
        'MFP-R-AST-001:NO_RENDERER_MEANING'
      ],
      componentDigests:candidate.componentDigests,
      productionAdmissionRef:'content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-production-admission-v1.json',
      humanEvidenceRef:'content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-human-review-v1.json',
      machineEvidenceRef:'content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-machine-campaign-v1.json',
      boundaries:{...candidate.boundaries,humanAdmissionRequired:false,customerRuntimeUseAllowed:true,rendererCreatedMeaning:false}
    };
  }));
}

export function applyAstMfpRPlanetSignRecovery(methodResult){
  const allUnits=buildAstMfpRPlanetSignEvidenceUnits(methodResult);
  if(!allUnits.length)return methodResult;
  const primaries=primarySubjects(methodResult);
  const selected=allUnits.filter(unit=>primaries.has(unit.planetCode));
  if(!selected.length)return methodResult;
  const existingIds=new Set(list(methodResult?.technical?.interpretationUnits).map(x=>x.unitId));
  const selectedFresh=selected.filter(x=>!existingIds.has(x.recoveryUnitId));
  if(!selectedFresh.length&&methodResult?.technical?.mfpRPlanetSign?.state==='PRODUCTION_ADMITTED')return methodResult;

  const addedInsights=selectedFresh.map(unit=>freeze({
    insightId:unit.recoveryUnitId,
    title:`${unit.planetLabel} · ${unit.signLabel}`,
    summary:unit.customerText,
    body:unit.customerText,
    plainLanguageExplanation:unit.customerText,
    observableSignals:[],alternativeInterpretations:[],openQuestions:[],confidenceBoundary:null
  }));
  const addedLineage=selectedFresh.map(unit=>freeze({
    unitId:unit.recoveryUnitId,
    semanticTags:['AST',unit.planetCode,'SECONDARY'],
    projectionRefs:unit.projectionRefs,
    meaningRefs:unit.meaningRefs,
    derivationRefs:unit.derivationRefs,
    boundaryRefs:unit.boundaryRefs
  }));
  const technical={
    ...methodResult.technical,
    interpretationUnits:[...list(methodResult?.technical?.interpretationUnits),...addedLineage],
    mfpRPlanetSign:freeze({
      schemaVersion:'PHI-OS-AST-MFP-R-R2-RECOVERY-BINDING-v1.0.0',
      state:'PRODUCTION_ADMITTED',gapId:'MFP-R-AST-001',
      productionAdmissionRef:'content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-production-admission-v1.json',
      humanEvidenceRef:'content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-human-review-v1.json',
      machineEvidenceRef:'content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-machine-campaign-v1.json',
      semanticCorpusDigest:AST_MFP_R_PLANET_SIGN_PRODUCTION_ADMISSION.semanticCorpusDigest,
      totalAdmittedEvidenceUnits:allUnits.length,
      informationGainSelectedUnitRefs:selected.map(x=>x.recoveryUnitId),
      allEvidenceUnits:allUnits,
      rendererMeaningCreated:false
    })
  };
  return freeze({
    ...methodResult,
    insights:[...list(methodResult.insights),...addedInsights],
    technical,
    source:{...(methodResult.source||{}),lineageAvailable:true},
    mfpRecovery:Object.freeze({gapId:'MFP-R-AST-001',state:'PRODUCTION_ADMITTED',admittedEvidenceUnitCount:allUnits.length,customerReadingUnitCount:selected.length})
  });
}

export default Object.freeze({buildAstMfpRPlanetSignEvidenceUnits,applyAstMfpRPlanetSignRecovery});
