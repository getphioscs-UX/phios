const grants=new WeakSet();
const fail=code=>{throw Object.assign(Error(code),{code,status:503});};
export function productionKnowledgeReady(env){return env.PHIOS_MEMBERSHIP_ASK_CREDIT_ENABLED==='true'&&env.PHIOS_MEMBERSHIP_KNOWLEDGE_EXECUTION_ENABLED==='true'&&env.PHIOS_CONTINUITY_DISPATCHER==='CREDIT_V1'&&env.PHIOS_CONTINUITY_PROVIDER_ENABLED!=='true'&&env.PHIOS_MEMBERSHIP_MODEL_CALIBRATION==='COMPACT_REVIEW_V3_ACCEPTED'&&env.PHIOS_MEMBERSHIP_COST_PROFILE==='LUNA_METER_V1_ACCEPTED';}
export function createProductionKnowledgeCapability(env){if(!productionKnowledgeReady(env))fail('MEMBERSHIP_EXECUTION_CLOSED');const capability=Object.freeze({});grants.add(capability);return capability;}
export function isProductionKnowledgeCapability(env,capability){return grants.has(capability)&&productionKnowledgeReady(env);}
export function requireLegacyContinuityRoute(env){if(env.PHIOS_CONTINUITY_DISPATCHER==='CREDIT_V1')fail('LEGACY_CONTINUITY_DISPATCH_FENCED');if(env.PHIOS_CONTINUITY_DISPATCHER&&env.PHIOS_CONTINUITY_DISPATCHER!=='LEGACY')fail('CONTINUITY_DISPATCHER_CLOSED');}
