import {createMir10DemandSignal} from './pca-demand-production-loop-v2.js';
const map={KAP:'KAP',GUIDED_READING:'GUIDED_READING',RJX:'RJX',SEARCH:'SEARCH',KNOWLEDGE_RETRIEVAL:'KNOWLEDGE_RETRIEVAL'};
export function adaptAggregateDemandSummary(source,summary={}){const s=String(source||'').toUpperCase();if(!map[s])throw new Error('PCA_MIR10_SOURCE_ADAPTER_UNSUPPORTED');return createMir10DemandSignal({...summary,sourceSurface:map[s]})}
export const adaptKapDemandSummary=summary=>adaptAggregateDemandSummary('KAP',summary);
export const adaptGuidedReadingDemandSummary=summary=>adaptAggregateDemandSummary('GUIDED_READING',summary);
export const adaptRjxDemandSummary=summary=>adaptAggregateDemandSummary('RJX',summary);
export const adaptSearchDemandSummary=summary=>adaptAggregateDemandSummary('SEARCH',summary);
export const adaptKnowledgeRetrievalDemandSummary=summary=>adaptAggregateDemandSummary('KNOWLEDGE_RETRIEVAL',summary);
