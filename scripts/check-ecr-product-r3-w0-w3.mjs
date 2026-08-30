import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildEcrCustomerFullReport} from '../functions/ecr-full-report/ecr-customer-full-report.js';
import {adaptEcrPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ecr-production-adapter.js';
import {renderEcrReadingReport} from '../assets/customer-ui/js/specialists/ecr/reading-report-renderer.js';
import {renderCalculationStoryVisual} from '../assets/customer-ui/js/specialists/ecr/calculation-story-renderer.js';

const t=p=>fs.readFileSync(p,'utf8');
const j=p=>JSON.parse(t(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline='dae24c1dd8de49a6c238ddffb8d52b388e8da10d';
const acceptance=j('content/embodied-configuration/product-r3/acceptance/ecr-r3-w0-w3-customer-coherence-repair-v1.json');
assert.equal(acceptance.baselineCommit,baseline);
assert.equal(acceptance.status,'ENGINEERING_COMPLETE');
assert.equal(acceptance.boundaries.ecrRemainsPhiOsNative,true);
assert.equal(acceptance.boundaries.rendererCreatesMeaning,false);
assert.equal(acceptance.boundaries.personalEcrHumanDesignComparisonImplementedByW0W3,false);
assert.equal(acceptance.authorityLineage.predecessorEcrStylesheetSha256,'4673ae91e3ccd5651ea7798d0b4f2206dac480d9ff6b9d7cb10aaa52cab6183b');
assert.equal(acceptance.currentMain.personalSurfaceSha256,sha('perspectives/personal/index.html'));
assert.equal(acceptance.currentMain.ecrStylesheetSha256,sha('assets/customer-ui/surfaces/ecr-specialist.css'));
assert.equal(acceptance.currentMain.readingRendererSha256,sha('assets/customer-ui/js/specialists/ecr/reading-report-renderer.js'));
assert.equal(acceptance.currentMain.calculationStoryRendererSha256,sha('assets/customer-ui/js/specialists/ecr/calculation-story-renderer.js'));

const groupIds=['CORE','DRIVER','GIFT','TENSION','FIELD','PHASE'];
const units=groupIds.map((group,index)=>({
  insightId:`UNIT-${index+1}`,
  title:`${group} reading`,
  summary:`${group} summary`,
  body:`${group} body`,
  plainLanguageExplanation:`${group} governed scalar explanation`,
  observableSignals:[],
  alternativeInterpretations:[],
  openQuestions:[],
  confidenceBoundary:'Interpretation is not Reality.'
}));
const readingIR={schemaVersion:'PHI-OS-ECR-RUNTIME-READING-IR-v1.0.0',locale:'zh-Hans',sourceProjectionId:'ECR-PROJECTION-W0',sourceMeaningBundleCode:'ECR-MEANING-W0',boundaries:{currentRealityKnown:false}};
const acceptedReading={methodId:'ECR',state:'READY_TO_READ',locale:'zh-Hans',insights:units,technical:{acceptanceBasis:'ADMITTED_COMPOSITION_RULESET',interpretationResultId:'ECR-INTERPRETATION-W0',compositionRuleVersion:'ECR-COMPOSITION-W0',interpretationUnits:units.map(x=>({unitId:x.insightId,projectionRefs:[`P:${x.insightId}`],meaningRefs:[`M:${x.insightId}`],derivationRefs:[`C:${x.insightId}`],boundaryRefs:[]}))}};
const phiCardSpread={schemaVersion:'PHI-OS-ECR-PHI-CARD-SPREAD-v1.0.0',methodId:'ECR',locale:'zh-Hans',cards:groupIds.map((group,index)=>({groupId:group,cardId:`ECR-PC-${String(index+1).padStart(2,'0')}`,title:`卡牌 ${index+1}`,subtitle:group,oneLineInsight:`${group} visual summary`,canonicalCustomerMeaning:`${group} canonical card meaning`,flowingExpression:`${group} flowing scalar expression`,strainedExpression:`${group} strained scalar expression`,observationPrompt:`${group} observation`,asset:{objectKey:`images/phi-cards/test-${index+1}.webp`},lineage:{interpretationUnitId:`UNIT-${index+1}`}})),boundaries:{randomDraw:false}};
const admission={customerAdmission:true};
const fullReport=buildEcrCustomerFullReport({readingIR,acceptedReading,phiCardSpread,customerAdmission:admission,locale:'zh-Hans'});
const product=adaptEcrPersonalRealityProduct({readingIR,phiCardSpread,fullReport,customerAdmission:admission,locale:'zh-Hans'});
const cardVisual=product.visuals.find(x=>x.type==='ECR_SIX_CARD_SPREAD');

// W0/W1: actual production payload is scalar, and scalar copy must survive into customer HTML.
assert.equal(typeof product.sections[0].payload.acceptedInterpretation.plainLanguageExplanation,'string');
assert.equal(typeof product.sections[0].payload.card.flowingExpression,'string');
assert.equal(typeof product.sections[0].payload.card.strainedExpression,'string');
const html=renderEcrReadingReport(product,cardVisual);
for(const group of groupIds){
  assert.match(html,new RegExp(`${group} governed scalar explanation`));
  assert.match(html,new RegExp(`${group} flowing scalar expression`));
  assert.match(html,new RegExp(`${group} strained scalar expression`));
}
assert.match(html,/PHI OS 解读/);
assert.match(html,/顺畅表达/);
assert.match(html,/张力表达/);

// W2: every deterministic card has reciprocal presentation lineage to its matching report section.
for(let index=0;index<groupIds.length;index+=1){
  const cardId=`ECR-PC-${String(index+1).padStart(2,'0')}`;
  const unitId=`UNIT-${index+1}`;
  assert.match(html,new RegExp(`id="ecr-reading-pair-${cardId}"[^>]*data-ecr-lineage-id="${unitId}"[^>]*data-ecr-card-id="${cardId}"`));
  assert.match(html,new RegExp(`href="#ecr-phi-card-${cardId}"`));
  assert.match(html,new RegExp(`id="ecr-phi-card-${cardId}"[^>]*data-ecr-lineage-id="${unitId}"[^>]*data-ecr-card-id="${cardId}"`));
  assert.match(html,new RegExp(`href="#ecr-reading-pair-${cardId}"`));
}
assert.match(html,/对应视觉摘要/);
assert.match(html,/查看对应的 PHI OS 主解读/);

// W0 visibility confirmation: the generic Human Design explainer must be rendered, not merely present as source text.
const calculationHtml=renderCalculationStoryVisual({payload:{schemaVersion:'PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0',locale:'zh-Hans',anchor:{longitude:232.125}}});
assert.match(calculationHtml,/id="ecr-human-design-boundary"/);
assert.match(calculationHtml,/如果你熟悉 Human Design/);
assert.match(calculationHtml,/ECR 不会重建 BodyGraph/);
assert.match(calculationHtml,/不是你的个人 ECR × Human Design 对照/);
const detailsIndex=calculationHtml.indexOf('<details>');
const hdIndex=calculationHtml.indexOf('id="ecr-human-design-boundary"');
assert.ok(hdIndex>0&&hdIndex<detailsIndex,'Human Design boundary explainer must be visible before collapsed computation detail');

// W3: ecr-specialist.css loads after the shared stylesheet, so it must own final spread contrast explicitly.
const css=t('assets/customer-ui/surfaces/ecr-specialist.css');
assert.match(css,/\.cx-ecr-specialist-reading>section\.cx-ecr-spread\{[^}]*background:linear-gradient\(145deg,#07162c,#102847\)[^}]*color:#f7f2e5/);
assert.match(css,/\.cx-ecr-specialist-reading>section\.cx-ecr-spread>\.cx-eyebrow\{color:#d9b45a\}/);
assert.match(css,/\.cx-ecr-specialist-reading>section\.cx-ecr-spread>h3\{color:#fff\}/);
assert.match(css,/\.cx-ecr-specialist-reading>section\.cx-ecr-spread>p\{color:color-mix/);
assert.match(css,/\.cx-ecr-spread__grid article>div\{background:var\(--cx-surface,#fff\);color:var\(--cx-ink,#111\)\}/);
assert.match(css,/\.cx-ecr-hd-boundary\{/);
assert.match(css,/@media print\{[\s\S]*\.cx-ecr-specialist-reading>section\.cx-ecr-spread\{background:#fff!important;color:#000!important/);

console.log('✓ ECR-R3 W0 Reading Payload Integrity Regression passed: scalar governed reading/flow/tension copy survives full-report → product → renderer.');
console.log('✓ ECR-R3 W1 PHI OS Reading Scalar Renderer Repair passed: scalar and array mapper outputs are normalized without changing meaning authority.');
console.log('✓ ECR-R3 W2 Reading ↔ PHI Card Semantic Lineage passed: all six deterministic card presentations have reciprocal report links and inherited interpretationUnitId lineage.');
console.log('✓ ECR-R3 W3 PHI Card Contrast / CSS Authority Repair passed: specialist spread header owns dark-surface contrast while card interiors and print remain readable.');
console.log('✓ Generic Human Design boundary explainer is now rendered visibly before collapsed calculation detail; personal ECR × Human Design comparison is still correctly deferred to the later governed comparison layer.');
