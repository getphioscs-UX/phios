import assert from 'node:assert/strict';
import fs from 'node:fs';

const BASELINE='492ecdddc1f84e5a915f416c60c61ed23e4fcb7f';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const read=p=>fs.readFileSync(p,'utf8');

export function assertPprC1CurrentSuccessor(){
 const recon=readJson('content/customer-experience-rebuild/ppr-c1/audit/ppr-c1-current-main-reconciliation-492ecdd-v1.json');
 const r4=readJson('content/professional/personal-reality/r4/authority/ppr-r4-method-input-successor-freeze-v1.json');
 assert.equal(recon.baselineCommit,BASELINE);
 assert.equal(recon.status,'RECONCILED_TO_CURRENT_SUCCESSOR_AUTHORITY');
 assert.equal(recon.canonical.route,'/perspectives/personal/');
 assert.equal(recon.canonical.api,'/api/customer-personal-reality');
 assert.equal(recon.canonical.liveSharedSingleMethodRenderer,null);
 assert.equal(fs.existsSync('assets/customer-ui/js/surfaces/single-method-reading.js'),false,'retired live generic renderer must stay absent');
 assert.equal(fs.existsSync(recon.canonical.nonLiveCompatibilityCopy),true,'non-live compatibility copy missing');
 const client=read('assets/customer-ui/js/surfaces/personal-reality.js');
 assert.doesNotMatch(client,/from ['"]\.\/single-method-reading\.js['"]/);
 assert.match(client,/renderProductRoute/);
 const productRenderers=read('assets/customer-ui/js/personal-products/personal-product-renderers.js');
 const registry=read('assets/customer-ui/js/personal-products/specialist-renderer-registry.js');
 assert.match(productRenderers,/mountApprovedSpecialistRenderer/);
 assert.match(registry,/PPR_R3_BAZI_PRODUCT_V1/);
 assert.equal(r4.baselineCommit,BASELINE);
 assert.equal(r4.status,'ACTIVE_SUCCESSOR_OF_PPR_R3_INPUT_BOUNDARY');
 assert.equal(r4.boundaries.pprR3SpecialistRendererAuthorityReplaced,false);
 return Object.freeze({recon,r4});
}
