import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildFixtureProjection,buildFixtureReadingIR} from './lib/ecr-mandala-acceptance-fixture.mjs';
import {renderTechnicalDisclosure} from '../assets/customer-ui/js/specialists/ecr/technical-disclosure-renderer.js';

const acceptance=JSON.parse(fs.readFileSync('content/embodied-configuration/acceptance/ecr-mandala-w26-technical-disclosure-acceptance-v1.json','utf8'));
const p=buildFixtureProjection(),readingIR=buildFixtureReadingIR();
assert.equal(p.calculation.engineLabel,'Astronomy Engine JS');
assert.equal(p.calculation.engineVersion,'2.1.19');
assert.equal(p.calculation.referenceFrameLabel,'Geocentric Tropical Ecliptic');
assert.equal(p.calculation.calculationSpecSchemaVersion,'PHI-OS-ECR-CALCULATION-SPEC-v1.0.0');
const product={locale:'zh-Hans',sourceProduct:{readingIR,mandalaProjection:p,fullReport:{evidenceAndBoundaries:{interpretationResultId:'ECR-INTERPRETATION-W26',admissionRef:'ECR-ADMISSION-W26',technicalLineage:{compositionRuleVersion:'1.0.0',compositionRuleRefs:['COMPOSITION_RULE:ECR-W26-RULE'],meaningRefs:['ECR-W26-MEANING']},boundaries:{rendererCreatesMeaning:false,currentRealityKnown:false}}}}};
const html=renderTechnicalDisclosure(product);
assert.match(html,/id="ecr-section-12"/);
assert.match(html,/<details><summary>计算与来源<\/summary>/);
assert.doesNotMatch(html,/<details open/);
for(const field of acceptance.requiredFields){const zhAlias=field==='Boundaries'?'边界标记':field;assert(html.includes(field)||html.includes(zhAlias),`W26 missing ${field}`)}
assert.match(html,/225\.3515625°/);
assert.match(html,/Geocentric Tropical Ecliptic/);
assert.match(html,/Astronomy Engine JS · 2\.1\.19/);
assert.match(html,/PHI-OS-ECR-CALCULATION-SPEC-v1\.0\.0/);
assert.match(html,/COMPOSITION_RULE:ECR-W26-RULE/);
assert.match(html,/ECR-W26-MEANING/);
assert.match(html,/renderer 两者都不创造/);
console.log('✓ ECR PHI Mandala W26 technical disclosure acceptance passed.');
console.log('  Technical lineage is available in a default-collapsed appendix with calculation engine/spec, projection, meaning and composition refs.');
