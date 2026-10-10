import fs from 'node:fs';
import { readJson, writeJson, criticalCodes, homepageFigureCodes } from './lib.mjs';

const criticalPath='content/web/homepage/hpc2-pre/hpc2-pre-critical-asset-registry-v1.json';
const finalPath='content/web/homepage/hpc2-pre/hpc2-pre-final-readiness-v1.json';
const browserPath='content/web/homepage/hpc2-pre/review/browser-visual-review-v1.json';
const pre8Path='content/web/homepage/hpc2-pre/hpc2-pre-r2-upload-remote-verification-v1.json';
const deliveryPath='content/web/homepage/hpc2-pre/hpc2-pre-public-delivery-activation-v1.json';
const consumptionPath='content/web/homepage/hpc2-pre/hpc2-pre-homepage-consumption-v1.json';
const acceptancePath='content/web/homepage/hpc2-pre/acceptance/hpc2-pre-repository-readiness-acceptance-v1.json';

const critical=readJson(criticalPath);
const final=readJson(finalPath);
const browser=readJson(browserPath);
const pre8=readJson(pre8Path);
const delivery=readJson(deliveryPath);
const consumption=readJson(consumptionPath);
const index=fs.readFileSync('index.html','utf8');
const home=fs.readFileSync('assets/js/pages/home-production.js','utf8');

const records=critical.records.filter(r=>criticalCodes.includes(r.assetCode));
const accepted=records.filter(r=>r.humanAccepted===true).length;
const remote=records.filter(r=>r.remoteVerified===true).length;
const browserAccepted=browser.matrix.length===6 && browser.matrix.every(r=>r.decision==='ACCEPTED' && Object.values(r.checks||{}).every(v=>v==='ACCEPTED'));
const heroWired=index.includes('data-hpc2-hero="HERO-001"') && home.includes("'HERO-001'");
const coversWired=criticalCodes.filter(x=>x.startsWith('BOOK-')).every(code=>home.includes('resolveBookCover'));
const figuresWired=homepageFigureCodes.every(code=>index.includes(`data-hpc2-figure=\"${code}\"`) || home.includes(`'${code}'`));
const noLocalBypass=!home.includes('figurePublicSrc') && home.includes('resolveCanonicalVisual');
const codeConsumed=heroWired && coversWired && figuresWired && noLocalBypass;

let state='BLOCKED';
if (accepted===16 && remote===16) state=codeConsumed ? 'CONSUMED_NOT_BROWSER_ACCEPTED' : 'VISUAL_ASSETS_READY_NOT_CONSUMED';
if (accepted===16 && remote===16 && codeConsumed && browserAccepted) state='HPC2_PRE_READY';

final.state=state;
final.counts.criticalHumanAccepted=accepted;
final.counts.criticalRemoteVerified=remote;
Object.assign(final.gates, {
  criticalAssetsHumanAccepted: accepted===16,
  criticalAssetsRemoteVerified: remote===16,
  publicAssetDeliveryOperational: remote===16 && browserAccepted,
  heroActuallyVisible: browserAccepted && heroWired,
  fiveCoversActuallyVisible: browserAccepted && coversWired,
  governedFiguresActuallyVisible: browserAccepted && figuresWired,
  noLocalGovernedAssetBypass: noLocalBypass,
  browserAcceptancePassed: browserAccepted,
  customerVisibleDelta: browserAccepted
});
final.status=state==='HPC2_PRE_READY'?'HPC2_PRE_READY_FROZEN':'FAIL_CLOSED_PENDING_EXTERNAL_AND_HUMAN_GATES';
writeJson(finalPath,final);

pre8.criticalRemoteVerifiedCount=remote;
pre8.status=remote===16?'CRITICAL_REMOTE_VERIFIED':'UPLOAD_RECONCILED_REMOTE_VERIFICATION_PENDING';
writeJson(pre8Path,pre8);

delivery.productionEnvironmentConfigurationObservedInRepository=false;
delivery.deploymentPublicAssetConfigAccepted=browserAccepted;
delivery.remoteObjectVerificationComplete=remote===16;
delivery.status=browserAccepted?'PUBLIC_ASSET_DELIVERY_DEPLOYMENT_ACCEPTED':(remote===16?'REMOTE_OBJECTS_VERIFIED_DEPLOYMENT_CONFIG_AND_BROWSER_ACCEPTANCE_PENDING':'DELIVERY_RUNTIME_WIRED_ENVIRONMENT_CONFIGURATION_AND_REMOTE_VERIFICATION_REQUIRED');
writeJson(deliveryPath,delivery);

consumption.status=codeConsumed?'CODE_WIRED_FAIL_CLOSED_PENDING_REMOTE_OR_BROWSER_ACCEPTANCE':'CODE_INTEGRATION_INCOMPLETE';
consumption.staticConsumerAudit={heroWired,coversWired,figuresWired,noLocalGovernedAssetBypass:noLocalBypass};
writeJson(consumptionPath,consumption);

const acceptance=readJson(acceptancePath);
acceptance.currentReadinessState=state;
acceptance.repositoryImplementationComplete=codeConsumed;
acceptance.externalAndHumanGatesComplete=state==='HPC2_PRE_READY';
acceptance.status=state==='HPC2_PRE_READY'?'HPC2_PRE_READY':'REPOSITORY_SUCCESSOR_READY_EXTERNAL_HUMAN_GATES_PENDING';
writeJson(acceptancePath,acceptance);

const executionManifestPath='content/web/homepage/hpc2-pre/hpc2-pre-execution-manifest-v1.json';
if(fs.existsSync(executionManifestPath)){const execution=readJson(executionManifestPath);execution.currentFinalReadinessState=state;execution.repositoryImplementationStatus=codeConsumed?'COMPLETE_FAIL_CLOSED':'INCOMPLETE';execution.reasonFinalReadinessBlocked=state==='HPC2_PRE_READY'?[]:[...(remote===16?[]:['16/16 live remote verification incomplete']),...(accepted===16?[]:['16/16 TL critical visual acceptance incomplete']),...(browserAccepted?[]:['6/6 deployed browser visual acceptance incomplete'])];writeJson(executionManifestPath,execution);}

console.log(`✓ HPC2-PRE status refreshed: ${state}; Human ${accepted}/16; Remote ${remote}/16; Browser ${browserAccepted?'ACCEPTED':'PENDING'}; Code consumer ${codeConsumed?'WIRED':'INCOMPLETE'}.`);
