import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fullReportFixture,reviewEntitlement} from './lib/ecr-full-report-fixture.mjs';
import {resolveEcrCoordinateFromSolarLongitude} from '../functions/embodied-configuration/ecr-calculation-runtime.js';
import {buildEcrCustomerFullReport} from '../functions/ecr-full-report/ecr-customer-full-report.js';
import {ECR_CORE_SECTION_IDS} from '../functions/ecr-full-report/ecr-core-report-projection.js';
import {renderEcrProduct} from '../assets/customer-ui/js/specialists/ecr/product-renderer.js';
import {commercialRuntime} from '../functions/pws/commercial/commercial-runtime.js';
import {ECR_FULL_REPORT_ADMISSION} from '../functions/ecr-full-report/ecr-full-report-admission.js';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {DEFAULT_PRODUCT_DEFINITIONS} from '../functions/pws/registry/product-offer-registry.js';
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const results=[],review=[],coverage=Object.fromEntries(['GRAMMAR','CORE_QUESTION','CAPABILITY_REGION','DRIVER_PRIORITY','MOTION','PHI_CONFIGURATION','ACTIVATION'].map(x=>[x,new Set()]));
const writeReview=process.argv.includes('--write-review');
const dir='docs/ecr-full-r1/core-review';
if(writeReview)fs.mkdirSync(dir+'/cases',{recursive:true});
for(let i=0;i<64;i++){
 let identity=null,cardIds=null;
 for(const locale of ['en','zh-Hans']){
  const f=await fullReportFixture(i,locale),before=hash({ir:f.readingIR,cards:f.phiCardSpread,mandala:f.mandalaProjection});
  assert.deepEqual(resolveEcrCoordinateFromSolarLongitude(f.longitude),resolveEcrCoordinateFromSolarLongitude(f.longitude));
  const paid=f.report(true),free=f.report(false),repeat=f.report(true);
  assert.deepEqual(paid,repeat);assert.deepEqual(paid.structuralIdentity,free.structuralIdentity);
  assert.deepEqual(paid.phiCardIds,f.phiCardSpread.cards.map(x=>x.cardId));
  assert.deepEqual(paid.sections.map(x=>x.sectionId),ECR_CORE_SECTION_IDS);
  assert.equal(free.sections[0].sectionId,'PHI_CARD');assert.equal(free.claims.length,0);
  assert(!JSON.stringify(free).includes('flowingExpression'));assert(!JSON.stringify(free).includes('strainedExpression'));
  for(const claim of paid.claims){assert(claim.claimId);assert(claim.evidenceRefs.length);assert(claim.lineage.meaningRefs.length);assert(claim.lineage.ruleRefs.length);assert.equal(claim.methodId,'ECR');}
  const sectionClaims=paid.sections.flatMap(s=>s.claims||[]);assert.equal(new Set(sectionClaims.map(x=>x.structuralMeaning)).size,sectionClaims.length,'no duplicate section prose');
  for(const s of paid.sections)assert(s.body||s.cards?.length||s.claims?.length||s.observations?.length,'no empty paid section');
  const sel=f.mandalaProjection.selected;
  assert.equal(paid.structuralIdentity.CORE_QUESTION[0].code,sel.questionId);assert.equal(paid.structuralIdentity.CAPABILITY_REGION[0].code,sel.primaryCapabilityId);
  assert.deepEqual(paid.structuralIdentity.DRIVER_PRIORITY.map(x=>x.code),sel.driverPriority.map(x=>x.driverId));
  for(const [k,m] of [['MOTION','motionId'],['PHI_CONFIGURATION','configurationId'],['ACTIVATION','activationId']])assert.equal(paid.structuralIdentity[k][0].code,sel[m]);
  if(identity){assert.deepEqual(paid.structuralIdentity,identity);assert.deepEqual(paid.phiCardIds,cardIds)}identity=paid.structuralIdentity;cardIds=paid.phiCardIds;
  for(const [key,value] of Object.entries(identity))for(const x of key==='DRIVER_PRIORITY'?value.slice(0,1):value)coverage[key].add(x.code);
  const product=f.product(paid),render=renderEcrProduct({product});assert.equal(render.status,'RENDERED');
  assert.equal((render.readingHtml.match(/data-ecr-full-section=/g)||[]).length,11);
  assert(!render.readingHtml.includes('data-ecr-full-section="EMBODIED_CONFIGURATION"'));
  assert.equal(before,hash({ir:f.readingIR,cards:f.phiCardSpread,mandala:f.mandalaProjection}));
  assert.throws(()=>buildEcrCustomerFullReport({...f.args,reviewMode:false,sharedEntitlement:reviewEntitlement(true)}),/REVIEW_ONLY/);
  const denied=buildEcrCustomerFullReport({...f.args,sharedEntitlement:{paid:true}});assert.equal(denied.depth,'FREE');
  assert.throws(()=>buildEcrCustomerFullReport({...f.args,readingIR:{...f.readingIR,sourceProjectionId:'wrong'}}),/SOURCE_MISMATCH/);
  results.push({caseId:`ECR-FULL-${String(i+1).padStart(2,'0')}-${locale}`,locale,anchorLongitude:f.longitude,structuralIdentity:identity,phiCardIds:cardIds,semanticDigest:paid.lineage.semanticDigest,reportDigest:hash(paid),status:'PASS'});
  if(writeReview&&(i%3===0||i===61||i===62)){
   const caseId=`ECR-FULL-${String(i+1).padStart(2,'0')}-${locale}`;
   fs.writeFileSync(`${dir}/cases/${caseId}.json`,JSON.stringify({caseId,synthetic:true,paid:product,free:f.product(free)},null,2)+'\n');
   review.push({caseId,locale,fixture:`cases/${caseId}.json`,reportDigest:hash(paid),structuralIdentity:identity,decision:'PENDING'});
  }
 }
}
assert.equal(coverage.PHI_CONFIGURATION.size,64);assert.equal(coverage.MOTION.size,8);assert.equal(coverage.ACTIVATION.size,8);assert.equal(coverage.GRAMMAR.size,16);assert.equal(coverage.CORE_QUESTION.size,16);
const offer=commercialRuntime.resolveOffer('ecr-full-report-myr'),price=commercialRuntime.resolvePrice(offer.price_code);assert.equal(price.currency_code,'MYR');assert.equal(price.amount_minor,3900);assert.equal(offer.status,'draft');assert.throws(()=>commercialRuntime.createOrder({offer_code:offer.offer_code,customer_id:'review'}),/Only active/);
assert.equal(ECR_FULL_REPORT_ADMISSION.customerPublishable,false);
assert(!DEFAULT_PRODUCT_DEFINITIONS.some(p=>p.product_code==='ecr-full-report'),'draft must not be activated by legacy registry seeding');
const routeFixture=await fullReportFixture(0,'en');
const routeInput={selectedKeys:['ecr'],locale:'en',results:[{key:'ecr',ok:true,spec:{methodCode:'EMBODIED_CONFIGURATION'},canonicalProjection:routeFixture.projection,readingMethod:routeFixture.acceptedReading}]};
const legacyRoute=await buildPersonalRealityProductRoute(routeInput);
assert(!JSON.stringify(legacyRoute).includes('ECR_FULL_R1'),'public legacy route stays unchanged before admission');
const reviewRoute=await buildPersonalRealityProductRoute({...routeInput,ecrFullReportReview:true,ecrSharedEntitlement:reviewEntitlement(true)});
assert(JSON.stringify(reviewRoute).includes('ECR_FULL_R1'),'shared route consumes the successor report');
const assets=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json'));
const asset=assets.entries.find(x=>x.assetId==='COM-REPORT-ECR-FULL');assert(asset?.available);assert.equal(crypto.createHash('sha256').update(fs.readFileSync('.'+asset.publicUrl)).digest('hex'),asset.sha256);
const result={work:'ECR-FULL-R1',structuralCases:64,bilingualExecutions:results.length,coverage:Object.fromEntries(Object.entries(coverage).map(([k,v])=>[k,[...v]])),humanAcceptance:'PENDING',productionAdmission:false,fixtureScope:'Synthetic solar anchors for coordinate coverage; existing astronomical calculation authority unchanged',results};
fs.mkdirSync('docs/ecr-full-r1',{recursive:true});fs.writeFileSync('docs/ecr-full-r1/core-machine-results.json',JSON.stringify(result,null,2)+'\n');
if(writeReview){assert.equal(review.length,48);fs.writeFileSync(`${dir}/cases.json`,JSON.stringify({work:'ECR-FULL-R1',structuralCases:24,localeViews:48,status:'PENDING',cases:review},null,2)+'\n');}
console.log(`PASS ECR-FULL-R1: 64 structural cases / ${results.length} bilingual executions; free/paid payload isolation, shared lineage, PHI Card/Mandala consistency, draft Commerce. Human acceptance PENDING.`);
