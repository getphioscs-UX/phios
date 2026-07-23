import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { evaluateEntryRuleFirst } from '../functions/runtime/entry/rule-entry.js';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const registry = JSON.parse(read('content/registry/runtime-bugs.json'));
if (registry.status !== 'closed') throw new Error('Bug Register is not closed.');
for (const severity of ['P0','P1','P2','P3','P4']) if (!(severity in registry.openCounts)) throw new Error(`Bug severity missing: ${severity}`);
if ((registry.bugs || []).some(bug => !['P0','P1','P2','P3','P4'].includes(bug.severity) || bug.status !== 'closed')) throw new Error('Bug Register contains an invalid or open item.');
if ((registry.bugs || []).some(bug => !fs.existsSync(path.join(root, bug.evidence)))) throw new Error('Bug Register evidence is missing.');

const entry = read('assets/js/reality-entry.js');
for (const token of ['answerBindings','askedTargets','getSession(SESSION.entryState)','entry.correctionQuestion','requestedTarget || \'revision\'']) if (!entry.includes(token)) throw new Error(`Entry closure missing: ${token}`);
const undated = evaluateEntryRuleFirst({ conversation:[{role:'user',content:'Work feels uncertain and I check decisions repeatedly.'}], entryRound:1, askedTargets:['observed_change'], answerBindings:[{target:'observed_change',content:'Work feels uncertain and I check decisions repeatedly.'}] });
assert.equal(undated.assessment.entryRound, 1, 'Home input must count as round one.');
assert.notEqual(undated.extractedFields?.time?.precision, 'exact_date', 'Entry generated an unsupported exact date.');

const reconstructionHtml = read('reality-reconstruction.html');
if ((reconstructionHtml.match(/customer-summary-edit/g) || []).length !== 5) throw new Error('Reconstruction edit controls are incomplete.');
for (const token of ['continueToReading','returnToEntryButton']) if (!reconstructionHtml.includes(token)) throw new Error(`Reconstruction closure missing: ${token}`);
const reconstructionBridge = read('assets/js/modules/reconstruction-reading.js');
for (const token of ['createReadingInput','evidenceBoundary','updateContinueToReadingButton']) if (!reconstructionBridge.includes(token)) throw new Error(`Reconstruction Evidence Mapping missing: ${token}`);

const readingLoader = read('assets/js/modules/reading-loader.js');
const readingController = read('assets/js/reading.js');
const readingRenderer = read('assets/js/modules/reading-render.js');
if (!/isAcceptedSchema\(\s*['"]readingInput['"]/.test(readingLoader)) throw new Error('Reading schema fallback is not registry-bound.');
for (const token of ['integratedReading','readingKnownReality','readingUnknownReality','sentenceOwnership']) if (!readingRenderer.includes(token)) throw new Error(`Reading render field missing: ${token}`);
if (!readingController.includes('finally') || !/classList\.remove\(\s*['"]is-reading['"]/.test(readingController)) throw new Error('Reading loading state is not released.');
if (!read('functions/api/read-runtime.js').includes('outputLanguage')) throw new Error('Reading language contract is missing.');
const readingRule = read('functions/runtime/reading/rule-reading.js');
for (const token of ['Trigger condition remains unestablished.','Desired transition remains unestablished.','evidenceWatchFromUnknownReality']) if (!readingRule.includes(token)) throw new Error(`Reading language/evidence-watch closure missing: ${token}`);

const navigationRule = read('functions/runtime/navigation/rule-navigation.js');
const navigationApi = read('functions/api/navigate-runtime.js');
const navigationLoader = read('assets/js/modules/navigation-loader.js');
const navigationRender = read('assets/js/modules/navigation-render.js');
const navigationSelection = read('assets/js/modules/navigation-path-selection.js');
const navigationState = read('assets/js/modules/navigation-state.js');
for (const token of ['source: {','evidenceActionLink']) if (!navigationRule.includes(token)) throw new Error(`Navigation provenance missing: ${token}`);
for (const token of ['localizedCurrentRuntime','localizedTransitionLabel','localizedUnknownReality','localizedEvidenceWatch','localizedAlternativeSummary']) if (!navigationRule.includes(token)) throw new Error(`Navigation language closure missing: ${token}`);
if (!/navigateRuntimeRuleFirst\(\s*navigationInput,\s*runtimeOptions\s*\)/.test(navigationApi)) throw new Error('Navigation API does not forward the requested Runtime language.');
if (!navigationApi.includes('runtimeCopyVersion') || !navigationLoader.includes('NAVIGATION_RUNTIME_COPY_VERSION')) throw new Error('Old mixed-language Navigation session responses are not invalidated.');
for (const token of ['navigation.pathSource','navigation.evidenceAction']) if (!navigationRender.includes(token)) throw new Error(`Navigation provenance not rendered: ${token}`);
if (!navigationState.includes('setSession(SESSION.navigation')) throw new Error('Navigation state is not saved.');
if (!navigationSelection.includes("window.location.assign('/reality-review.html')")) throw new Error('Review navigation is not wired.');
const navigationReadiness = read('functions/runtime/reading/navigation-readiness.js');
for (const token of ['advisories','directionRequired: false','runtimeRegionRequired: false','patternRequiredForObservation: false','reportedExperienceRequiredForObservation: false','observation-first path']) if (!navigationReadiness.includes(token)) throw new Error(`Observation-first Navigation closure missing: ${token}`);
const reconstructionRenderer = read('assets/js/modules/reconstruction-render.js');
for (const token of ['localizedDerivedUnknownReality','reconstruction.unknownFields.']) if (!reconstructionRenderer.includes(token)) throw new Error(`Reconstruction language closure missing: ${token}`);

const continuity = 'functions/runtime/continuity/reality-continuity-contract.js';
if (!fs.existsSync(path.join(root, continuity))) throw new Error('Reality Continuity Contract is missing.');
if (!read('package.json').includes('check-reality-continuity-contract.mjs')) throw new Error('Continuity check is not part of npm run check.');

console.log('✓ M1-W5 Entry, Reconstruction, Reading, Navigation, and Continuity bug closure checks passed.');
