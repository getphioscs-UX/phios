import { ECR_BOOK_CORE_THEORY_RUNTIME } from './ecr-book-core-theory-runtime.js';
import { ECR_SPECIFIC_ONTOLOGY_RUNTIME } from './ecr-specific-ontology-runtime.js';

export const ECR_ONTOLOGY_SCHEMA='PHI-OS-ECR-CANONICAL-ONTOLOGY-v1.0.0';
export const ECR_ONTOLOGY_VERSION='1.0.2';

export function getEcrCanonicalOntology(){
  return Object.freeze({
    schemaVersion:ECR_ONTOLOGY_SCHEMA,
    version:ECR_ONTOLOGY_VERSION,
    authorityClass:'PHIOS_FIRST_PARTY',
    coreTheory:ECR_BOOK_CORE_THEORY_RUNTIME,
    ecrSpecific:ECR_SPECIFIC_ONTOLOGY_RUNTIME,
    boundary:Object.freeze({
      ecrForksCoreGrammar:false,
      ecrForksCoreQuestions:false,
      ecrForksCoreCapabilities:false,
      ecrForksCoreDrivers:false,
      bookCoreTheoryProjectionOnly:true,
      pdsProtectedRuntimeMutationRequired:false,
      customerMeaningCreated:true,
      calculationImplemented:true,
      interpretationCandidateIntegrated:true,
      customerPublicationAdmitted:true
    })
  });
}

export function validateEcrCanonicalOntology(){
  const ontology=getEcrCanonicalOntology();
  const valid=ontology.coreTheory.grammarCodes.length===16 &&
    ontology.coreTheory.questionCodes.length===16 &&
    ontology.coreTheory.capabilities.length===9 &&
    ontology.coreTheory.drivers.length===12 &&
    ontology.ecrSpecific.cosmologicalContext.length===12 &&
    ontology.ecrSpecific.motions.length===8 &&
    ontology.ecrSpecific.configurations.length===64 &&
    ontology.ecrSpecific.activations.length===8;
  return Object.freeze({valid,schemaVersion:ECR_ONTOLOGY_SCHEMA,version:ECR_ONTOLOGY_VERSION});
}

export default getEcrCanonicalOntology;
