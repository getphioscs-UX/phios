import { sha256Stable } from './zwr-utils.js';
import { assertZiWeiInternalCalculationActivated } from './runtime-activation-gate.js';
export function projectZiWeiCalculationIR(ir, options={}){
  assertZiWeiInternalCalculationActivated(options);
  if(ir?.schemaVersion!=='PHI-OS-ZWR-CALCULATION-IR-v1.0.0') throw Object.assign(new Error('Zi Wei Calculation IR v1 required'),{code:'ZWR_CALCULATION_IR_REQUIRED'});
  const projectionCore={
    schemaVersion:'PHI-OS-ZWR-CANONICAL-METHOD-PROJECTION-v1.0.0',
    method:{methodCode:'ZI_WEI_DOU_SHU',publicLabel:'Zi Wei Structural Projection',methodVersion:'0.1.0-candidate',status:'VALIDATED_INTERNAL_NOT_PRODUCTION_ACTIVATED',calculationMode:'NATAL_STRUCTURAL_V1'},
    calculation:{calendar:ir.calendar,palaces:ir.palaceStructure.palaces,lifePalace:ir.palaceStructure.lifePalace,bodyPalace:ir.palaceStructure.bodyPalace,fiveElementBureau:ir.palaceStructure.fiveElementBureau,mainStars:ir.mainStars.stars,supportStars:ir.supportStars.stars,transformations:ir.transformations.transformations},
    projection:{sourceCalculationDigest:ir.calculationDigest,scopeCode:ir.scopeCode,stableClientCandidateSchema:true,productionClientContractActivated:false},
    unknown:[],
    evidence:[
      {type:'RULE_SOURCE',status:'AVAILABLE',sourceCode:'ZI_WEI_CALCULATION_POLICY',reference:'content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json',version:ir.policy.authorityVersion,confidence:'HIGH'},
      {type:'CALCULATION_AUTHORITY',status:'VALIDATED_INTERNAL',sourceCode:'ZWR_W7_W13',reference:'ZWR deterministic runtime candidate',version:'1.0.0',confidence:'HIGH'},
      {type:'RUNTIME_AUTHORITY',status:'NOT_PRODUCTION_ACTIVATED',sourceCode:'ZI_WEI_RUNTIME',reference:'Phase 4 ZWR',version:'0.1.0-candidate',confidence:'HIGH'}
    ],
    version:{runtimeVersion:'0.1.0-candidate',inputContractVersion:'ZWR-CANONICAL-INPUT-v1',projectionContractVersion:'ZWR-W13-v1',policyVersion:ir.policy.authorityVersion},
    execution:{status:'VALIDATED_INTERNAL',runtimeIdentity:'ZI_WEI_RUNTIME',productionDispatchAllowed:false},
    interpretation:{included:false,meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false}
  };
  return {...projectionCore,projectionId:`ZWRP-${sha256Stable(projectionCore).slice(0,24)}`};
}
