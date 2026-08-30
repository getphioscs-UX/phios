import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture,FIXTURE_PATH} from './lib/ecr-mandala-acceptance-fixture.mjs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const spec=json('content/embodied-configuration/ecr-calculation-spec-v1.json');
const activation=json('content/embodied-configuration/ecr-activation-registry-v1.json');
const audit=json('content/embodied-configuration/ecr-customer-mandala-authority-audit-v1.json');
const contract=json('content/embodied-configuration/ecr-customer-mandala-contract-v1.json');
const adapter=read('functions/personal-reality-product/adapters/ecr-production-adapter.js');
const personal=read('perspectives/personal/index.html');

assert.equal(fixture.schemaVersion,'PHI-OS-ECR-MANDALA-CANONICAL-ACCEPTANCE-FIXTURE-v1.0.0');
assert.equal(fixture.baselineCommit,'402735ec373fba021235187312e4f526ba919807');
assert.equal(fs.existsSync(FIXTURE_PATH),true);
assert.equal(audit.gate.oneCalculationAuthority,true);
assert.equal(audit.gate.oneOntologyAuthority,true);
assert.equal(audit.gate.duplicatedEcrSemanticsAllowed,false);
assert.equal(contract.boundaries.rendererMayCreateSemanticSelection,false);
assert.equal(contract.boundaries.rendererMayCalculateGeometryFromOrdinalAndCount,true);
assert.equal(spec.layerRules.H64.upperTrigramRole,'ENVIRONMENT_PRIORITY');
assert.equal(spec.layerRules.H64.lowerTrigramRole,'EMBODIED_RESPONSE_POSITION');
assert.equal(activation.rules.goodBadScore,false);
assert.equal(activation.rules.fortuneLevel,false);
assert.match(adapter,/PHI_MANDALA/);assert.match(adapter,/CALCULATION_EXPLAINER/);assert.match(adapter,/COORDINATE_RELATIONSHIP/);assert.match(adapter,/DRIVER_PROFILE/);assert.match(adapter,/MOTION_CONFIGURATION/);assert.match(adapter,/ACTIVATION_TIMELINE/);assert.match(adapter,/PHI_CARD_VISUAL/);assert.match(adapter,/FULL_REPORT/);
assert.match(personal,/\/assets\/customer-ui\/surfaces\/ecr-specialist\.css/);
console.log('✓ ECR Mandala authority gate passed: W19–W23 reuse the frozen ECR calculation/ontology authorities and the canonical customer projection path.');
