import fs from 'node:fs';
import {resolveEcrCoordinateFromSolarLongitude} from '../../functions/embodied-configuration/ecr-calculation-runtime.js';
import {buildEcrCustomerMandalaProjection} from '../../functions/embodied-configuration/ecr-customer-mandala-projection.js';
import {adaptEcrPersonalRealityProduct} from '../../functions/personal-reality-product/adapters/ecr-production-adapter.js';

export const FIXTURE_PATH='content/embodied-configuration/acceptance/ecr-mandala-canonical-acceptance-fixture-v1.json';
export const fixture=JSON.parse(fs.readFileSync(FIXTURE_PATH,'utf8'));
const item=(code,value,meta={})=>({code,value,rawValue:null,meta});

export function buildFixtureReadingIR(){
  const resolved=resolveEcrCoordinateFromSolarLongitude(fixture.anchorLongitude);
  return {
    schemaVersion:'PHI-OS-ECR-RUNTIME-READING-IR-v1.0.0',
    sourceProjectionId:'CMP-ECR-W22-CANONICAL-FIXTURE-001',
    sourceMeaningBundleCode:'ECR-W22-FIXTURE-MEANING-LINEAGE',
    locale:fixture.locale,
    boundaries:{currentRealityKnown:false,currentDriverPriorityClaimed:false},
    sections:{
      coordinate:{
        anchorLongitude:fixture.anchorLongitude,
        context:[item(resolved.cosmologicalContext.contextId,resolved.cosmologicalContext.zodiacCode)],
        grammar:[item(resolved.grammar.code,resolved.grammar.code)],
        question:[item(resolved.question.questionId,resolved.question.questionId)]
      },
      response:{
        capabilities:[item(resolved.capability.primary.id,'PRIMARY',{priority:'PRIMARY'}),...resolved.capability.supporting.map(x=>item(x.id,'SUPPORTING',{priority:'SUPPORTING'}))],
        driverPriority:resolved.driverPriority.drivers.map(x=>item(x.driverId,x.baselineAffinity,{rank:x.rank,angularDistanceDegrees:x.angularDistanceDegrees,classification:resolved.driverPriority.classification}))
      },
      change:{
        motion:[item(resolved.motion.motionId,resolved.motion.motionId)],
        configuration:[item(resolved.configuration.configurationId,resolved.configuration.configurationId)],
        activation:[item(resolved.activation.activationId,resolved.activation.activationId)]
      }
    }
  };
}

export function buildFixtureProjection(){return buildEcrCustomerMandalaProjection(buildFixtureReadingIR());}

export function buildFixtureProduct(){
  const readingIR=buildFixtureReadingIR(),mandalaProjection=buildEcrCustomerMandalaProjection(readingIR);
  const fullReport={schemaVersion:'PHI-OS-ECR-CUSTOMER-FULL-REPORT-v1.0.0',publicationState:'CUSTOMER_PUBLISHABLE',title:'Fixture ECR report',subtitle:'Acceptance fixture',sections:[{sectionId:'FIXTURE',title:'Fixture',card:{oneLineInsight:'Fixture',flowingExpression:'Observable flowing expression',strainedExpression:'Observable strained expression'},acceptedInterpretation:{interpretationUnitId:'ECR-FIXTURE-U1',plainLanguageExplanation:'Governed fixture interpretation',observableSignals:['Observable signal'],openQuestions:['Open reality question'],alternativeInterpretations:['Alternative interpretation']},sourceRefs:['ECR-FIXTURE-U1']}],deeperReading:[],evidenceAndBoundaries:{interpretationResultId:'ECR-FIXTURE-IR',admissionRef:'ECR-FIXTURE-ADMISSION',boundaries:{currentRealityKnown:false}},sourceRefs:['ECR-FIXTURE-U1']};
  return adaptEcrPersonalRealityProduct({readingIR,mandalaProjection,fullReport,locale:fixture.locale});
}
