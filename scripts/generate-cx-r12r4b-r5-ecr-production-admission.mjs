import fs from 'node:fs';
import crypto from 'node:crypto';
const check=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const shaFile=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(p,text)=>{if(check){if(!fs.existsSync(p)||fs.readFileSync(p,'utf8')!==text)throw new Error(`R5_ADMISSION_DRIFT:${p}`)}else{fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(p,text)}};
const reviewPath='content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-human-review-results-v1.json';
const reviewCasesPath='content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-human-review-cases-v1.json';
const machinePath='content/customer-experience-rebuild/r12r4b/cx-r12r4b-r4-ecr-machine-campaign-v1.json';
const meaningPath='content/embodied-configuration/meaning/ecr-atomic-meaning-registry-v1.json';
const calcPath='content/embodied-configuration/ecr-calculation-spec-v1.json';
const review=read(reviewPath),reviewCases=read(reviewCasesPath),machine=read(machinePath),meaning=read(meaningPath),calc=read(calcPath);
const dims=['methodFidelityAccepted','customerClarityAccepted','nonFortuneTellingBoundaryAccepted','lineageAccepted'];
if(review.status!=='HUMAN_REVIEW_COMPLETE'||review.requiredCaseCount!==48||review.acceptedCaseCount!==48||review.rejectedCaseCount!==0||review.pendingCaseCount!==0||!review.aggregateAttestation)throw new Error('ECR_R5_REQUIRES_48_OF_48_HUMAN_ACCEPTANCE');
if(review.results.length!==48||reviewCases.cases.length!==48||review.results.some((x,i)=>x.caseId!==reviewCases.cases[i].caseId||!dims.every(k=>x[k]===true)))throw new Error('ECR_R5_HUMAN_REVIEW_CASE_BINDING_INVALID');
if(machine.caseCount!==64||!Object.values(machine.assertions).every(Boolean))throw new Error('ECR_R5_MACHINE_CAMPAIGN_NOT_ACCEPTED');
if(meaning.entries?.length!==145||!meaning.entries.every(x=>x.status==='PRODUCTION'))throw new Error('ECR_R5_MEANING_AUTHORITY_NOT_PRODUCTION');
if(calc.status!=='FROZEN_FOR_DETERMINISTIC_PROJECTION')throw new Error('ECR_R5_CALCULATION_SPEC_NOT_FROZEN');
const evidence={
  machineCampaignRef:machinePath,machineCampaignSha256:shaFile(machinePath),machineCaseCount:64,
  humanReviewCasesRef:reviewCasesPath,humanReviewCasesSha256:shaFile(reviewCasesPath),
  humanReviewResultsRef:reviewPath,humanReviewResultsSha256:shaFile(reviewPath),humanAcceptedCaseCount:48,
  meaningAuthorityRef:meaningPath,meaningAuthoritySha256:shaFile(meaningPath),atomicMeaningCount:145,
  calculationAuthorityRef:calcPath,calculationAuthoritySha256:shaFile(calcPath)
};
const admission={
  schemaVersion:'PHI-OS-CX-R12R4B-R5-ECR-PRODUCTION-ADMISSION-v1.0.0',work:'CX-R12R4B-R5-W33R',baselineCommit:'850b382f363a83e2968b16db7942da6af9432377',status:'ECR_PRODUCTION_COMPOSITION_ADMITTED',
  methodAdmission:{ECR:{acceptedCases:48,requiredCases:48,humanReviewed:true,compositionCustomerPublishable:true,acceptanceBasis:'ADMITTED_COMPOSITION_RULESET'}},
  evidence,
  composition:{sharedRuntimeVersion:'2.0.0',compositionRuleVersion:'CX-R12R3B-COMPOSITION-RULES-v1.0.0',ecrRuleRefs:['CX-COMP-ECR-CONTEXT-GRAMMAR-QUESTION-v1','CX-COMP-ECR-QUESTION-CAPABILITY-v1','CX-COMP-ECR-DRIVER-PRIORITY-v1','CX-COMP-ECR-MOTION-CONFIGURATION-v1','CX-COMP-ECR-CONFIGURATION-ACTIVATION-v1']},
  boundaries:{calculationAuthorityChanged:false,atomicMeaningAuthorityChanged:false,compositionRulesChangedByAdmission:false,admissionCreatesNewMeaning:false,liveCustomerHumanReviewClaimed:false,currentRealityAssumed:false,humanDesignAuthorityConsumed:false,xpfExternalProfileConsumed:false,crossPerspectiveCompositionStarted:false,rendererCreatesMeaning:false,aiCreatesMeaning:false},
  publication:{publicationAllowed:true,customerPublishable:true,methodId:'ECR',publicMethodCode:'EMBODIED_CONFIGURATION_PROJECTION'}
};
const admissionPath='content/customer-experience-rebuild/r12r4b/admission/ecr-production-admission-v1.json';
const admissionText=JSON.stringify(admission,null,2)+'\n';write(admissionPath,admissionText);
const admissionSha=crypto.createHash('sha256').update(admissionText).digest('hex');
const consumer=`/** Generated runtime projection of ECR R5 production admission. */\nconst AUTHORITY_REF='${admissionPath}';\nconst AUTHORITY_SHA256='${admissionSha}';\nconst EVIDENCE_REF='${reviewPath}';\nexport const CX_R12R4B_ECR_COMPOSITION_ADMISSION_CONSUMER=Object.freeze({schemaVersion:'PHI-OS-CX-R12R4B-ECR-COMPOSITION-ADMISSION-CONSUMER-v1.0.0',sourceAuthorityRef:AUTHORITY_REF,sourceAuthoritySha256:AUTHORITY_SHA256,evidenceRef:EVIDENCE_REF,status:'CONSUMES_ECR_HUMAN_REVIEWED_COMPOSITION_ADMISSION',methodId:'ECR',acceptedCases:48,requiredCases:48,boundary:Object.freeze({createsMeaningAuthority:false,createsInterpretationAuthority:false,changesAtomicMeaning:false,changesCompositionRules:false,liveCustomerHumanReviewClaimed:false})});\nexport function ecrCompositionAdmissionFor(methodId){if(methodId!=='ECR')return null;return Object.freeze({methodId:'ECR',sourceAuthorityRef:AUTHORITY_REF,sourceAuthoritySha256:AUTHORITY_SHA256,compositionCustomerPublishable:true,humanReview:Object.freeze({methodFidelityAccepted:true,customerClarityAccepted:true,evidenceRef:EVIDENCE_REF,reviewerRefs:Object.freeze([AUTHORITY_REF])})});}\n`;
write('functions/customer-projection/r12r4b-ecr-composition-admission-consumer-v1.js',consumer);
const acceptance={schemaVersion:'PHI-OS-CX-R12R4B-R5-ACCEPTANCE-v1.0.0',work:'CX-R12R4B-R5-W33R',baselineCommit:'850b382f363a83e2968b16db7942da6af9432377',status:'ECR_MACHINE_HUMAN_PRODUCTION_ADMISSION_ACCEPTED',machine:{required:64,accepted:64,evidenceRef:machinePath},human:{required:48,accepted:48,rejected:0,pending:0,evidenceRef:reviewPath,reviewedBy:review.aggregateAttestation.reviewedBy,reviewedAt:review.aggregateAttestation.reviewedAt},productionAdmission:{created:true,authorityRef:admissionPath,authoritySha256:admissionSha,customerPublicationAllowed:true},customerSurface:{sharedCustomerReadingSupported:true,customerPersonalRealityApiSupportsEcr:true,customerSelectorExposed:false,selectorCutoverDeferred:true},boundaries:{xpfRemainsCustomerSuppliedExternalContext:true,hdrRemainsInternalValidationOnly:true,ecrIsPhiOsFirstParty:true,crossMethodReadingNotStarted:true,currentRealityNotAssumed:true,liveCustomerHumanReviewClaimed:false},nextSequentialWork:'CX-R12R4B-W34_SHARED_SEMANTIC_DIMENSION_REGISTRY'};
write('content/customer-experience-rebuild/r12r4b/cx-r12r4b-r5-acceptance-v1.json',JSON.stringify(acceptance,null,2)+'\n');
console.log(check?'✓ ECR R5 production admission is current.':'✓ ECR R5 production admission written.');
console.log('  Machine 64/64; human 48/48; ECR composition rules admitted for customer publication.');
