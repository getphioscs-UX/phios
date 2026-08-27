/* GENERATED FILE. Do not edit by hand.
 * Source: content/embodied-configuration/ecr-calculation-spec-v1.json
 */
export const ECR_CALCULATION_SPEC_RUNTIME = Object.freeze({
  "schemaVersion": "PHI-OS-ECR-CALCULATION-SPEC-v1.0.0",
  "work": "CX-R12R4B-R4-W31R",
  "status": "FROZEN_FOR_DETERMINISTIC_PROJECTION",
  "authorityClass": "PHIOS_FIRST_PARTY",
  "inputAuthority": "MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0",
  "anchor": {
    "code": "SOLAR_ECLIPTIC_ANCHOR_V1",
    "description": "Geocentric tropical ecliptic longitude of the Sun at the canonical birth instant.",
    "engine": "ASTRONOMY_ENGINE_JS",
    "engineVersion": "2.1.19",
    "license": "MIT",
    "scientificFactClaimedForInterpretation": false,
    "interpretiveConvention": true
  },
  "zeroPoint": {
    "longitudeDegrees": 0,
    "frame": "TROPICAL_ECLIPTIC",
    "boundaryConvention": "LOWER_INCLUSIVE_UPPER_EXCLUSIVE"
  },
  "layerRules": {
    "CC12": {
      "rule": "EQUAL_SECTOR",
      "count": 12,
      "sectorDegrees": 30,
      "source": "ecr-cosmological-context-registry-v1.json"
    },
    "G16": {
      "rule": "EQUAL_SECTOR",
      "count": 16,
      "sectorDegrees": 22.5,
      "source": "functions/runtime/formation/grammar-registry.js"
    },
    "Q16": {
      "rule": "GRAMMAR_ORDINAL_PAIR",
      "description": "Qn pairs with Gn for the baseline ECR coordinate; current Reality may later activate a different question through Runtime Decision Stack evidence.",
      "source": "functions/runtime/formation/fundamental-question-registry.js"
    },
    "R9": {
      "rule": "QUESTION_CAPABILITY_MATRIX_V1",
      "description": "Question identity selects a primary capability and optional supporting capabilities. This mapping is PHI OS first-party ECR calculation convention, not a Book I identity rewrite."
    },
    "D12": {
      "rule": "SOLAR_ANCHOR_DRIVER_SECTOR_DISTANCE_V1",
      "count": 12,
      "sectorDegrees": 30,
      "description": "All twelve Book I driver identities remain present. Baseline driver affinity is ranked by circular distance from the solar anchor to twelve equal driver sectors. It is not a live Current Reality priority."
    },
    "M8": {
      "rule": "EQUAL_SECTOR",
      "count": 8,
      "sectorDegrees": 45,
      "source": "ecr-motion-registry-v1.json"
    },
    "H64": {
      "rule": "EQUAL_SECTOR_ENVIRONMENT_FIRST",
      "count": 64,
      "sectorDegrees": 5.625,
      "source": "ecr-environment-first-configuration-v1.json",
      "upperTrigramRole": "ENVIRONMENT_PRIORITY",
      "lowerTrigramRole": "EMBODIED_RESPONSE_POSITION"
    },
    "A8": {
      "rule": "POSITION_WITHIN_H64_SEGMENT",
      "count": 8,
      "subsegmentDegrees": 0.703125,
      "source": "ecr-activation-registry-v1.json"
    }
  },
  "questionCapabilityMatrix": {
    "Q1": {
      "primary": "R2",
      "supporting": [
        "R3"
      ]
    },
    "Q2": {
      "primary": "R2",
      "supporting": [
        "R4"
      ]
    },
    "Q3": {
      "primary": "R2",
      "supporting": [
        "R1"
      ]
    },
    "Q4": {
      "primary": "R1",
      "supporting": [
        "R4"
      ]
    },
    "Q5": {
      "primary": "R6",
      "supporting": [
        "R5"
      ]
    },
    "Q6": {
      "primary": "R5",
      "supporting": [
        "R8"
      ]
    },
    "Q7": {
      "primary": "R8",
      "supporting": [
        "R6"
      ]
    },
    "Q8": {
      "primary": "R4",
      "supporting": [
        "R1",
        "R8"
      ]
    },
    "Q9": {
      "primary": "R7",
      "supporting": [
        "R3"
      ]
    },
    "Q10": {
      "primary": "R7",
      "supporting": [
        "R2"
      ]
    },
    "Q11": {
      "primary": "R7",
      "supporting": [
        "R5"
      ]
    },
    "Q12": {
      "primary": "R7",
      "supporting": [
        "R8"
      ]
    },
    "Q13": {
      "primary": "R4",
      "supporting": [
        "R1"
      ]
    },
    "Q14": {
      "primary": "R9",
      "supporting": [
        "R6"
      ]
    },
    "Q15": {
      "primary": "R4",
      "supporting": [
        "R7"
      ]
    },
    "Q16": {
      "primary": "R8",
      "supporting": [
        "R1"
      ]
    }
  },
  "boundaries": {
    "requiresExactBirthTime": true,
    "fabricatedTimeAllowed": false,
    "externalHumanDesignAuthorityConsumed": false,
    "rawHumanDesignMechanicsConsumed": false,
    "currentRealityPriorityClaimed": false,
    "customerMeaningCreatedByCalculation": false
  }
});
export default ECR_CALCULATION_SPEC_RUNTIME;
