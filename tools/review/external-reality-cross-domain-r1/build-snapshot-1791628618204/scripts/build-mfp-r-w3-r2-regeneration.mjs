import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildBenchmark} from './smr-benchmark-support.mjs';
import {applyAstMfpRPlanetSignRecovery} from '../functions/ast-full-production/ast-mfp-r-planet-sign-recovery.js';
import {adaptAstrologyProductionInput} from '../functions/single-method-reading/astrology-production-adapter.js';
import {buildCustomerClaimIR} from '../functions/single-method-reading/customer-claim-ir.js';
import {resolveCustomerPriorities} from '../functions/single-method-reading/customer-priority-resolver.js';
import {composeCustomerThemes} from '../functions/single-method-reading/customer-theme-composer.js';
import {deduplicateClaims} from '../functions/single-method-reading/claim-deduplicator.js';
import {resolveSectionInformationGain} from '../functions/single-method-reading/section-information-gain-resolver.js';
import {preserveContradictions} from '../functions/single-method-reading/contradiction-preservation.js';
import {buildCustomerNarrativeIR} from '../functions/single-method-reading/customer-narrative-ir.js';
import {buildCustomerReadingIA} from '../functions/single-method-reading/customer-reading-ia.js';
import {buildCustomerReadingLayout} from '../functions/single-method-reading/customer-reading-layout.js';

const BASELINE='7c6126404fe8e257b44937a0149bf23c837c538f';
const ROOT='content/professional/method-full-production-recovery';
const REG=`${ROOT}/regression`;
const BEFORE=`${REG}/ast-mfp-r-r2-before-reading-v1.json`;
const AFTER=`${REG}/ast-mfp-r-r2-after-reading-v1.json`;
const OUT=`${ROOT}/mfp-r-r2-regeneration-regression-v1.json`;
const intent={intentId:'EXPRESSION',prompt:'Understand expression and communication patterns.'};
const list=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(list(v).filter(Boolean))];
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const write=(p,v)=>{fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n')};
const visibleTexts=ia=>list(ia?.sections).flatMap(s=>list(s.items)).map(i=>i?.text).filter(Boolean);
const duplicateTextCount=ia=>{const a=visibleTexts(ia);return a.length-new Set(a).size};
const evidenceCoverage=priority=>{const claims=list(priority?.claims);const covered=claims.filter(c=>list(c.evidenceRefs).length>0).length;return {coveredClaims:covered,totalClaims:claims.length,ratio:claims.length?covered/claims.length:1}};
const internalLeakCount=ia=>visibleTexts(ia).filter(t=>/(?:CUSTOMER_PUBLISHABLE|SOURCE_ADMITTED|projectionDigest|renderOwnerId|AST-R4A|AST-R5|MFP-R-AST-001|COMPOSITION_RULE:|CM-AST-)/i.test(t)).length;
const infoGain=ig=>list(ig?.sections).reduce((n,s)=>n+(Number(s.informationGainCount)||0),0);
const claimIds=priority=>list(priority?.claims).map(c=>c.claimId);
const stateByClaim=con=>new Map(list(con?.relations).map(x=>[x.claimRef,x.state]));

function afterPipeline(methodResult){
 const envelope=adaptAstrologyProductionInput(methodResult);
 const claims=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope,customerIntent:intent});
 const priority=resolveCustomerPriorities({claimCollection:claims,customerIntent:intent});
 const themes=composeCustomerThemes({priorityResolution:priority});
 const claimDedup=deduplicateClaims({claims:priority.claims});
 const informationGain=resolveSectionInformationGain({priorityResolution:priority,themeCollection:themes});
 const contradiction=preserveContradictions({priorityResolution:priority,themeCollection:themes,claimDedup});
 const narrative=buildCustomerNarrativeIR({priorityResolution:priority,themeCollection:themes,sectionInformationGain:informationGain,contradictionPreservation:contradiction});
 const ia=buildCustomerReadingIA({narrativeIR:narrative});
 const layout=buildCustomerReadingLayout({readingIA:ia});
 return {envelope,claims,priority,themes,claimDedup,informationGain,contradiction,narrative,ia,layout};
}

function snapshot(kind,x,methodResult){
 const recovery=methodResult?.technical?.mfpRPlanetSign||null;
 const recoveryClaimRefs=claimIds(x.priority).filter(id=>id.includes('AST-MFP-R-PS-'));
 const visibleRecoveryClaimRefs=uniq(list(x.ia?.sections).flatMap(s=>list(s.items)).flatMap(i=>list(i.sourceClaimRefs)).filter(id=>id.includes('AST-MFP-R-PS-')));
 const semanticPayload={interpretationUnitRefs:x.envelope.interpretationUnitRefs,claims:list(x.priority.claims).map(c=>({claimId:c.claimId,semanticDimension:c.semanticDimension,headline:c.headline,structuralMeaning:c.structuralMeaning,evidenceRefs:c.evidenceRefs})),themes:list(x.themes.themes).map(t=>({primaryClaimRef:t.primaryClaimRef,claimRefs:t.claimRefs})),visibleTexts:visibleTexts(x.ia)};
 return {
  schemaVersion:'PHI-OS-MFP-R-AST-R2-READING-SNAPSHOT-v1.0.0',
  baselineCommit:BASELINE,kind,methodId:'AST',projectionId:methodResult?.technical?.projectionId||null,
  authorityBasis:{productionAdmissionRef:x.envelope.productionAdmissionRef,semanticDigest:x.envelope.semanticDigest,compositionRuleVersion:x.envelope.compositionRuleVersion},
  counts:{
   acceptedInterpretationUnits:list(x.envelope.interpretationUnitRefs).length,claims:list(x.priority.claims).length,
   uniqueSemanticOwners:list(x.claimDedup.semanticClusters).length,themes:list(x.themes.themes).length,
   eligibleSections:list(x.ia.sections).filter(s=>s.eligibility==='SECTION_ELIGIBLE').length,
   visibleParagraphs:visibleTexts(x.ia).length,renderedDuplicateParagraphs:duplicateTextCount(x.ia),
   sourceLineage:list(x.envelope.sourceLineage).length,ruleLineage:list(x.envelope.ruleLineage).length,
   temporalClaims:list(x.envelope.temporalClaims).length,informationGain:infoGain(x.informationGain),
   recoveryClaims:recoveryClaimRefs.length,visibleRecoveryClaims:visibleRecoveryClaimRefs.length
  },
  firstScreenClaimRefs:list(x.priority.firstScreenClaimRefs),
  eligibleSectionRefs:list(x.ia.sections).filter(s=>s.eligibility==='SECTION_ELIGIBLE').map(s=>s.sectionId),
  evidenceCoverage:evidenceCoverage(x.priority),
  contradiction:{counts:x.contradiction.counts,preservedCounterEvidenceRefs:list(x.contradiction.preservedCounterEvidenceRefs),relationStates:list(x.contradiction.relations).map(r=>({claimRef:r.claimRef,state:r.state}))},
  dedup:{clusterCount:list(x.claimDedup.semanticClusters).length,decisions:x.claimDedup.decisions,fullExplanationMaxPerCluster:x.claimDedup.boundary?.fullExplanationMaxPerCluster},
  informationGainSections:list(x.informationGain.sections).map(s=>({sectionId:s.sectionId,eligibility:s.eligibility,informationGainCount:s.informationGainCount,newClaimRefs:s.newClaimRefs})),
  lineage:{interpretationUnitRefs:x.envelope.interpretationUnitRefs,sourceLineage:x.envelope.sourceLineage,ruleLineage:x.envelope.ruleLineage,boundaryFlags:x.envelope.boundaryFlags},
  recovery:recovery?{state:recovery.state,totalAdmittedEvidenceUnits:recovery.totalAdmittedEvidenceUnits,informationGainSelectedUnitRefs:recovery.informationGainSelectedUnitRefs,visibleRecoveryClaimRefs,semanticCorpusDigest:recovery.semanticCorpusDigest,rendererMeaningCreated:recovery.rendererMeaningCreated}:null,
  readability:{firstScreenBlocks:x.layout.firstScreen.blockCount,firstScreenThemes:x.layout.firstScreen.themeCount,mobileNoHorizontalOverflow:x.layout.mobile.noHorizontalOverflow,mobileNoNestedScroll:x.layout.mobile.noNestedScroll,printClippedChartAllowed:x.layout.print.clippedChartAllowed,technicalDefaultCollapsed:x.layout.technical.defaultCollapsed,internalTokenLeakCount:internalLeakCount(x.ia)},
  semanticDigest:hash(semanticPayload)
 };
}

const before=await buildBenchmark('AST');
const recoveredMethodResult=applyAstMfpRPlanetSignRecovery(before.methodResult);
const after=afterPipeline(before.methodResult);
const beforeSnap=snapshot('BEFORE_MFP_R_AST_001',before,before.methodResult);
const afterSnap=snapshot('AFTER_MFP_R_AST_001',after,recoveredMethodResult);
write(BEFORE,beforeSnap);write(AFTER,afterSnap);

const originalStates=stateByClaim(before.contradiction),afterStates=stateByClaim(after.contradiction);
const tensionPreserved=[...originalStates].every(([ref,state])=>afterStates.get(ref)===state);
const counterPreserved=list(before.contradiction.preservedCounterEvidenceRefs).every(ref=>list(after.contradiction.preservedCounterEvidenceRefs).includes(ref));
const priorityStable=JSON.stringify(beforeSnap.firstScreenClaimRefs)===JSON.stringify(afterSnap.firstScreenClaimRefs);
const recoveryVisible=afterSnap.counts.visibleRecoveryClaims===3&&afterSnap.recovery?.totalAdmittedEvidenceUnits===10;
const lineageImproved=afterSnap.counts.sourceLineage>beforeSnap.counts.sourceLineage&&afterSnap.counts.ruleLineage>beforeSnap.counts.ruleLineage;
const noDedupRegression=afterSnap.counts.renderedDuplicateParagraphs===0&&afterSnap.dedup.fullExplanationMaxPerCluster===1;
const readable=afterSnap.readability.firstScreenBlocks<=8&&afterSnap.readability.firstScreenThemes<=3&&afterSnap.readability.mobileNoHorizontalOverflow&&afterSnap.readability.mobileNoNestedScroll&&!afterSnap.readability.printClippedChartAllowed&&afterSnap.readability.technicalDefaultCollapsed&&afterSnap.readability.internalTokenLeakCount===0;
const timingStable=beforeSnap.counts.temporalClaims===afterSnap.counts.temporalClaims;
const improved=recoveryVisible&&lineageImproved&&priorityStable&&counterPreserved&&tensionPreserved&&noDedupRegression&&readable&&timingStable;

const regression={
 gapId:'MFP-R-AST-001',methodId:'AST',beforeReadingRef:BEFORE,afterReadingRef:AFTER,
 knowledgeDelta:{admittedPlanetSignEvidenceUnits:10,selectedForCustomerInformationGain:afterSnap.counts.recoveryClaims,machineCases:240,humanAcceptedCases:24,productionAdmissionRef:'content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-production-admission-v1.json'},
 semanticDelta:{beforeClaimCount:beforeSnap.counts.claims,afterClaimCount:afterSnap.counts.claims,beforeUniqueSemanticOwnerCount:beforeSnap.counts.uniqueSemanticOwners,afterUniqueSemanticOwnerCount:afterSnap.counts.uniqueSemanticOwners,beforeThemeCount:beforeSnap.counts.themes,afterThemeCount:afterSnap.counts.themes,visibleRecoveryClaimRefs:afterSnap.recovery?.visibleRecoveryClaimRefs||[]},
 customerValueDelta:{newSignSpecificExplanationsVisible:afterSnap.counts.visibleRecoveryClaims,firstScreenPriorityStable:priorityStable,eligibleSectionSetStable:JSON.stringify(beforeSnap.eligibleSectionRefs)===JSON.stringify(afterSnap.eligibleSectionRefs),paragraphRepetitionDelta:afterSnap.counts.renderedDuplicateParagraphs-beforeSnap.counts.renderedDuplicateParagraphs,informationGainDelta:afterSnap.counts.informationGain-beforeSnap.counts.informationGain,customerReadabilityPassed:readable},
 dimensions:{
  claimCount:{before:beforeSnap.counts.claims,after:afterSnap.counts.claims},
  uniqueSemanticOwnerCount:{before:beforeSnap.counts.uniqueSemanticOwners,after:afterSnap.counts.uniqueSemanticOwners},
  evidenceCoverage:{before:beforeSnap.evidenceCoverage,after:afterSnap.evidenceCoverage},
  counterEvidencePreservation:{preserved:counterPreserved,before:beforeSnap.contradiction.preservedCounterEvidenceRefs,after:afterSnap.contradiction.preservedCounterEvidenceRefs},
  tensionPreservation:{preserved:tensionPreserved},
  priorityStability:{stable:priorityStable,beforeFirstScreenClaimRefs:beforeSnap.firstScreenClaimRefs,afterFirstScreenClaimRefs:afterSnap.firstScreenClaimRefs},
  dedupRate:{beforeClusters:beforeSnap.counts.uniqueSemanticOwners,afterClusters:afterSnap.counts.uniqueSemanticOwners,fullExplanationMaxPerCluster:afterSnap.dedup.fullExplanationMaxPerCluster},
  paragraphRepetition:{before:beforeSnap.counts.renderedDuplicateParagraphs,after:afterSnap.counts.renderedDuplicateParagraphs},
  informationGain:{before:beforeSnap.counts.informationGain,after:afterSnap.counts.informationGain,newVisibleRecoveryClaims:afterSnap.counts.visibleRecoveryClaims},
  sourceLineage:{before:beforeSnap.counts.sourceLineage,after:afterSnap.counts.sourceLineage},
  ruleLineage:{before:beforeSnap.counts.ruleLineage,after:afterSnap.counts.ruleLineage},
  timingBoundaries:{stable:timingStable,beforeTemporalClaims:beforeSnap.counts.temporalClaims,afterTemporalClaims:afterSnap.counts.temporalClaims},
  customerReadability:{passed:readable,after:afterSnap.readability}
 },
 dedupRegression:!noDedupRegression,lineageRegression:!lineageImproved,rendererMeaningRegression:recoveredMethodResult?.technical?.mfpRPlanetSign?.rendererMeaningCreated!==false||after.ia.boundary?.rendererMeaningCreated!==false,
 decision:improved?'IMPROVED':'REGRESSED'
};
const out={
 schemaVersion:'PHI-OS-MFP-R-W3-R2-REGENERATION-REGRESSION-v1.0.0',workCode:'MFP-R-W3',baselineCommit:BASELINE,status:improved?'R2_REGENERATION_COMPLETE':'R2_REGENERATION_REGRESSED',closureRef:`${ROOT}/mfp-r-w2-selective-fp-closure-v1.json`,
 regressions:[regression],pendingGapIds:[],
 requiredPipeline:['Full Production Result','AcceptedMethodReadingEnvelope','Claim IR','Theme','Semantic Dedup','Information Gain','Narrative IR','Customer Reading'],
 requiredDimensions:['claim count','unique semantic owner count','evidence coverage','counter-evidence preservation','tension preservation','priority stability','dedup rate','paragraph repetition','information gain','source lineage','rule lineage','timing boundaries','customer readability'],
 governance:{rendererMeaningRegressionAllowed:false,regressedDecisionAllowed:false,backendOnlyImprovementSufficient:false,moreClaimsAloneMeansImprovement:false},
 generatedDeterministically:true
};
write(OUT,out);
if(!improved)throw new Error(`MFP_R_W3_REGRESSED:${JSON.stringify(regression.dimensions)}`);
console.log(`✓ MFP-R-W3 regeneration built: AST claims ${beforeSnap.counts.claims}→${afterSnap.counts.claims}; semantic owners ${beforeSnap.counts.uniqueSemanticOwners}→${afterSnap.counts.uniqueSemanticOwners}; ${afterSnap.counts.visibleRecoveryClaims} Planet×Sign explanations add information gain; first-screen priority stable; 0 repeated paragraphs.`);
