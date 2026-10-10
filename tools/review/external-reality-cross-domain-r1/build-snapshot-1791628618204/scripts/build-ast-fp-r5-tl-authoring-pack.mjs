import {read,save,ref,digest} from './build-ast-fp-r5-tl-reference.mjs';
import {buildAstR5CustomerAuthoringPack} from '../functions/ast-full-production/ast-r5-customer-authoring-pack.js';
const root='content/professional/ast-full-production/';
export function makePack(){return buildAstR5CustomerAuthoringPack({canonicalReference:read(ref('canonical-projection')),r4Reference:read(ref('r4-professional-semantic')),r5Reference:read(ref('whole-chart-synthesis')),claims:read(root+'claims/ast-fp-r4a-professional-semantic-candidate-claims-v1.json'),admission:read(root+'admission/ast-fp-r4a-professional-semantic-human-admission-v1.json'),locationSnapshot:read(ref('location-resolution')),compositionRules:read(root+'registries/ast-r5-whole-chart-composition-rule-registry-v2.json')});}
const pack=makePack();save(ref('customer-authoring-pack'),{...pack,authoringPackDigest:digest(pack)});
const keys=['subjectDisplayName','locale','wholeChartSummary','coreThemes','supportSignals','tensionSignals','rulershipSummary','angleSummary','distributionSummary','aspectNetworkClusters','houseRulerSectionRoutes','sectionPlan','sectionSourceBindings','boundaries','authoringInstructions'];
save('tools/review/AST-FP-R5-TL-CHAT-AUTHORING-HANDOFF.json',{...Object.fromEntries(keys.map(k=>[k,pack[k]])),birthDisplay:pack.chartIdentity,houseSystem:'PLACIDUS_V1',bodyEvidence:pack.bodyEvidence,admittedClaims:pack.admittedClaims,themeOwnership:pack.themeOwnership,aspectDynamics:pack.aspectDynamics,authoringPackDigest:digest(pack)});
console.log('TL authoring pack built',digest(pack));
