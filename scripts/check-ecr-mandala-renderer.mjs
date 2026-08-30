import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildFixtureProjection,buildFixtureProduct} from './lib/ecr-mandala-acceptance-fixture.mjs';
import {renderPhiMandalaVisual} from '../assets/customer-ui/js/specialists/ecr/mandala-renderer.js';
import {renderCalculationStoryVisual} from '../assets/customer-ui/js/specialists/ecr/calculation-story-renderer.js';
import {renderCoordinateStoryVisual} from '../assets/customer-ui/js/specialists/ecr/coordinate-story-renderer.js';
import {renderDriverProfileVisual} from '../assets/customer-ui/js/specialists/ecr/driver-profile-renderer.js';
import {renderMotionConfigurationVisual} from '../assets/customer-ui/js/specialists/ecr/motion-renderer.js';
import {renderActivationTimelineVisual} from '../assets/customer-ui/js/specialists/ecr/activation-renderer.js';
import {renderEcrReadingReport} from '../assets/customer-ui/js/specialists/ecr/reading-report-renderer.js';
import {renderTechnicalDisclosure} from '../assets/customer-ui/js/specialists/ecr/technical-disclosure-renderer.js';

const sources=fs.readdirSync('assets/customer-ui/js/specialists/ecr').filter(x=>x.endsWith('.js')).map(x=>fs.readFileSync(`assets/customer-ui/js/specialists/ecr/${x}`,'utf8'));
for(const source of sources){assert.doesNotMatch(source,/<style>/i,'ECR specialist renderer must use scoped CSS instead of inline style blocks');}
const joined=sources.join('\n');for(const forbidden of ['resolveEcrCoordinateFromSolarLongitude','calculateEcrSolarAnchor','sectorIndex(','canonicalBirthUtcIso('])assert.equal(joined.includes(forbidden),false,`renderer recalculation forbidden: ${forbidden}`);
const p=buildFixtureProjection(),visual={title:'你的 PHI 构型',payload:p},product=buildFixtureProduct();
const parts=[renderPhiMandalaVisual(visual),renderCalculationStoryVisual(visual),renderCoordinateStoryVisual(visual),renderDriverProfileVisual(visual),renderMotionConfigurationVisual(visual),renderActivationTimelineVisual(visual)];
for(let i=1;i<=6;i++)assert.match(parts.join(''),new RegExp(`id="ecr-section-0${i}"`));
const reading=renderEcrReadingReport(product,{payload:{cards:[{title:'Fixture',subtitle:'Visual summary',oneLineInsight:'Machine-only fixture card',asset:{objectKey:''}}]}});
for(let i=7;i<=11;i++)assert.match(reading,new RegExp(`id="ecr-section-${String(i).padStart(2,'0')}"`));
assert.match(renderTechnicalDisclosure(product),/id="ecr-section-12"/);
assert.match(parts[0],/data-ecr-mandala-explore/);assert.match(parts[0],/data-ecr-mandala-scroll-region/);assert.match(parts[3],/role="meter"/);assert.match(parts[4],/ENVIRONMENT PRIORITY|环境优先/);assert.match(parts[5],/阶段 ≠ 吉凶/);
console.log('✓ ECR Mandala renderer gate passed: 01–12 product IA is reachable, scoped CSS owns styling, and browser renderers remain presentation-only.');
