/** R2-W19 method-scoped admission evaluator. AST is evaluated only from AST-owned gates. */
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
export function evaluateAstMethodScopedProductionAdmission({w17Acceptance,w18Results,r3Certification}={}){
 const w17=Boolean(w17Acceptance?.status==='MACHINE_ACCEPTED_241_OF_241'&&w17Acceptance?.actual?.failed===0&&w17Acceptance?.actual?.acceptanceRate===1);
 const w18=Boolean(w18Results?.status==='HUMAN_ACCEPTED_24_OF_24'&&w18Results?.accepted===24&&w18Results?.needsRevision===0&&w18Results?.rejected===0&&w18Results?.pending===0);
 const r3=Boolean(r3Certification?.boundaries?.independentEphemerisAccuracyCertificationEstablished===true&&r3Certification?.runtimeCertificationGate?.currentExecutionState==='PASS');
 const ast=w17&&w18&&r3;
 return freeze({schemaVersion:'PHI-OS-AST-R2-W19-METHOD-SCOPED-PRODUCTION-DECISION-v1.0.0',methodFlags:{AST:ast},prerequisites:{w17MachineAcceptanceSatisfied:w17,w18FinalCustomerHumanAcceptanceSatisfied:w18,r3IndependentEphemerisCertificationSatisfied:r3},scope:{otherMethodProductionAdmissionRequired:false,legacySmr48GateRequired:false,legacySmr48MayBePromoted:false},customerRuntimeUseAllowed:ast,customerPublicationAllowed:ast,productionAllowed:ast,customerCutoverAllowed:ast});
}
export default Object.freeze({evaluateAstMethodScopedProductionAdmission});
