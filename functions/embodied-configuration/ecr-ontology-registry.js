import { GRAMMAR_CODES, GRAMMAR_REGISTRY } from '../runtime/formation/grammar-registry.js';
import {
  FUNDAMENTAL_QUESTION_CODES,
  FUNDAMENTAL_QUESTION_REGISTRY,
  validateFundamentalQuestionRegistry
} from '../runtime/formation/fundamental-question-registry.js';
import {
  RUNTIME_CAPABILITIES,
  RUNTIME_DRIVERS
} from '../runtime/formation/book-1-runtime-model.js';
import { ECR_SPECIFIC_ONTOLOGY_RUNTIME } from './ecr-specific-ontology-runtime.js';

export const ECR_ONTOLOGY_SCHEMA='PHI-OS-ECR-CANONICAL-ONTOLOGY-v1.0.0';
export const ECR_ONTOLOGY_VERSION='1.0.0';

export function getEcrCanonicalOntology(){
  return Object.freeze({
    schemaVersion:ECR_ONTOLOGY_SCHEMA,
    version:ECR_ONTOLOGY_VERSION,
    authorityClass:'PHIOS_FIRST_PARTY',
    coreTheory:Object.freeze({
      grammarCodes:GRAMMAR_CODES,
      grammars:GRAMMAR_REGISTRY,
      questionCodes:FUNDAMENTAL_QUESTION_CODES,
      questions:FUNDAMENTAL_QUESTION_REGISTRY,
      capabilities:RUNTIME_CAPABILITIES,
      drivers:RUNTIME_DRIVERS
    }),
    ecrSpecific:ECR_SPECIFIC_ONTOLOGY_RUNTIME,
    boundary:Object.freeze({
      ecrForksCoreGrammar:false,
      ecrForksCoreQuestions:false,
      ecrForksCoreCapabilities:false,
      ecrForksCoreDrivers:false,
      customerMeaningCreated:false,
      calculationImplemented:false
    })
  });
}

export function validateEcrCanonicalOntology(){
  const ontology=getEcrCanonicalOntology();
  const valid=GRAMMAR_CODES.length===16 &&
    validateFundamentalQuestionRegistry().valid &&
    RUNTIME_CAPABILITIES.length===9 &&
    RUNTIME_DRIVERS.length===12 &&
    ontology.ecrSpecific.cosmologicalContext.length===12 &&
    ontology.ecrSpecific.motions.length===8 &&
    ontology.ecrSpecific.configurations.length===64 &&
    ontology.ecrSpecific.activations.length===8;
  return Object.freeze({valid,schemaVersion:ECR_ONTOLOGY_SCHEMA,version:ECR_ONTOLOGY_VERSION});
}

export default getEcrCanonicalOntology;
