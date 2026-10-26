/** Adapter into the existing report contract; no new registry or publication authority. */
export function resolveSubstructureMeaningCandidate({field,color,orientation,resolution,corpus}){
 if(!['DETERMINATION','ENVIRONMENT','PERSPECTIVE','MOTIVATION'].includes(field)||!Number.isInteger(color)||color<1||color>6||!['LEFT','RIGHT'].includes(orientation))throw new TypeError('SUBSTRUCTURE_MEANING_INPUT_INVALID');
 const canonicalKey=['DETERMINATION','ENVIRONMENT'].includes(field)?`${color}.${orientation==='LEFT'?'左':'右'}`:String(color);
 const matches=(corpus?.meaningUnits||[]).filter(x=>x.field===field&&x.canonicalKey===canonicalKey);
 if(matches.length!==1)return Object.freeze({status:'UNAVAILABLE',reason:'NO_UNIQUE_EXISTING_MAPPING',field,canonicalKey,theme:null});
 const unit=matches[0],sources=(resolution?.sourceUnits||[]).filter(s=>unit.sourceRefs.includes(s.sourceUnitId));
 const anchored=sources.length===unit.sourceRefs.length&&sources.length>0&&sources.every(s=>s.sourceTextSha256===unit.sourceTrace?.sourceTextSha256);
 const eligible=anchored&&unit.humanAccepted===true&&unit.machineVerified===true&&unit.customerPublishableR3===true;
 return Object.freeze({status:eligible?'APPROVED_EXISTING_MAPPING':'HELD_EXISTING_MAPPING_SCOPE',field,canonicalKey,
  mappingId:unit.meaningUnitId,mappingVersion:corpus.schemaVersion,sourceRefs:unit.sourceRefs,
  sourceSha256:unit.sourceTrace?.sourceTextSha256,sourceAnchored:anchored,
  acceptedTerms:eligible?unit.label:null,candidateTerms:unit.label,theme:eligible?unit.semanticTheme:null,
  applicability:'ADVANCED_MODIFIER_ONLY_NO_CORE_OVERRIDE',medicalUseAllowed:false,
  unsupported:['Medical assessment','Nutrition/treatment prescription','Automatic transfer of external-chart acceptance to internally calculated values']});
}
export function buildSubstructureReportCandidate({variables,activations,resolution,corpus}){
 const mappings=Object.fromEntries(Object.values(variables.fields).filter(x=>x.color!=null).map(x=>[x.role,resolveSubstructureMeaningCandidate({field:x.role,color:x.color,orientation:x.orientation,resolution,corpus})]));
 const inputFor=section=>section===7?{activations:activations.map(x=>({activationId:x.activationId,gate:x.gate,line:x.line,substructure:x.substructure}))}:[10,11,15].includes(section)?{variables,mappings}:null;
 return Object.freeze({scope:'LOCAL_17_SECTION_ADAPTER_CANDIDATE',externalChartMayBeOverwritten:false,
  sections:[7,10,11,15,16,17].map(section=>Object.freeze({section,structuredInput:inputFor(section),
   generationAllowed:false,publicationAllowed:false,
   mode:[16,17].includes(section)?'REVERSIBLE_OBSERVATION_ONLY_NO_PERSONAL_FACT_INFERENCE':'SOURCE_BOUND_ADVANCED_MODIFIER_CANDIDATE',
   blockers:['External calibration disagreement unresolved','Internal calculation admission separate from existing external-chart acceptance','Upload/image extraction and automated report delivery not verified',...([10,11,15].includes(section)&&Object.values(mappings).some(x=>x.status!=='APPROVED_EXISTING_MAPPING')?['Advanced mapping acceptance/scope not established for calculated input']:[])]})),
  historicalReportsChanged:false,productionActivated:false});
}
