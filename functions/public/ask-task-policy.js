// Server-owned public task boundary. Client depth, entitlement and labels cannot grant execution.
export const FREE_ASK_TASKS=Object.freeze(['ENTRY','KNOWLEDGE_BASIC','PRODUCT_HELP']);
export const ASK_TASK_CONTRACT=Object.freeze({version:'PHI-OS-ASK-TASK-R1-v1',free:FREE_ASK_TASKS,enhanced:'NOT_ENABLED',reality:'EXISTING_AUTHORIZED_OWNER_ONLY'});
export function publicAskExecutionPolicy(){return Object.freeze({task:'KNOWLEDGE_BASIC',providerAllowed:false,reportGenerationAllowed:false,automaticPersistence:false});}
