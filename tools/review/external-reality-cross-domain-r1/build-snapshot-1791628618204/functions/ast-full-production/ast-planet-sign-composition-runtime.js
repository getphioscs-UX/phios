const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const entries=o=>Array.isArray(o?.entries)?o.entries:[];
const by=(o,family,key)=>entries(o).find(x=>x.meaningFamily===family&&x.semanticKey===key);
const localeOf=x=>x==='zh-Hans'?'zh-Hans':'en';
function required(x,code){if(!x){const e=new Error(code);e.code=code;throw e}return x}
function fill(template,values){return Object.entries(values).reduce((s,[k,v])=>s.replaceAll(`{${k}}`,String(v??'')),String(template||''))}
export function composeAstPlanetSignMeaning({planetCode,signCode,locale='en',meaningOntology,compositionRule}={}){
 const l=localeOf(locale);
 if(compositionRule?.workCode!=='MFP-R-AST-001'||compositionRule?.ownerProgram!=='AST_FULL_PRODUCTION')required(null,'AST_MFP_R_PLANET_SIGN_RULE_REQUIRED');
 if(compositionRule?.rules?.humanAdmissionRequiredBeforeCustomerRuntime!==true)required(null,'AST_MFP_R_HUMAN_GATE_REQUIRED');
 const fn=required(by(meaningOntology,'AST_FUNCTIONAL_DRIVER',planetCode),'AST_MFP_R_PLANET_FUNCTION_MEANING_REQUIRED');
 const dir=required(by(meaningOntology,'AST_DIRECTION_MODE',signCode),'AST_MFP_R_SIGN_DIRECTION_MEANING_REQUIRED');
 const planetLabel=fn.labels?.[l]||fn.labels?.en||planetCode, signLabel=dir.labels?.[l]||dir.labels?.en||signCode;
 const functionDefinition=required(fn.definitions?.[l]||fn.definitions?.en,'AST_MFP_R_PLANET_FUNCTION_TEXT_REQUIRED');
 const directionDefinition=required(dir.definitions?.[l]||dir.definitions?.en,'AST_MFP_R_SIGN_DIRECTION_TEXT_REQUIRED');
 const customerText=fill(compositionRule.compositionGrammar?.[l]||compositionRule.compositionGrammar?.en,{planetLabel,signLabel,functionDefinition,directionDefinition});
 return freeze({
  schemaVersion:'PHI-OS-AST-PLANET-SIGN-COMPOSED-UNIT-v1.0.0',workCode:'MFP-R-AST-001',state:'MACHINE_CANDIDATE_HUMAN_REVIEW_REQUIRED',locale:l,
  planetCode,signCode,planetLabel,signLabel,customerText,
  sourceRefs:[`${fn.meaningCode}@${fn.meaningVersion}`,`${dir.meaningCode}@${dir.meaningVersion}`,'content/professional/ast-production/meaning/ast-meaning-ontology-v1.json','content/professional/ast-production/contracts/ast-composite-meaning-rules-v1.json','content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-composition-rule-v1.json'],
  componentDigests:{planetFunction:fn.meaningCanonicalDigest,signDirection:dir.meaningCanonicalDigest},
  boundaries:{newStandaloneMeaningIdentityCreated:false,rendererCreatedMeaning:false,personalityFactCreated:false,destinyClaimCreated:false,eventPredictionCreated:false,humanAdmissionRequired:true,customerRuntimeUseAllowed:false}
 });
}
export default Object.freeze({composeAstPlanetSignMeaning});
