import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildFixtureProjection} from '../../../scripts/lib/ecr-mandala-acceptance-fixture.mjs';
import {selectedCatalog,customerLayerLabel,customerLayerExplanation} from '../../../assets/customer-ui/js/specialists/ecr/customer-language.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const contract=read('content/embodied-configuration/ecr-customer-mandala-contract-v1.json');
const registry=read('content/reports/shared/report-visual-assets-r2.json');
const base=buildFixtureProjection(),projections={},layers={};
for(const locale of ['en','zh-Hans']){
 const p=structuredClone(base);p.locale=locale;projections[locale]=p;
 const s=selectedCatalog(p),items=[s.context,s.grammar,s.question,s.primaryCapability,p.selected.driverPriority[0],s.motion,s.configuration,s.activation];
 layers[locale]=contract.layers.map((l,i)=>({id:l.layerId,name:l.displayLabel[locale],position:customerLayerLabel(p,l.layerId,items[i],{role:'PRIMARY'}).primary,explanation:customerLayerExplanation(p,l.layerId,items[i],{role:'PRIMARY'})}));
}
const preview=['P01','P02','SEC-05'].map(page=>{
 const a=registry.assets.find(a=>a.methodId==='ECR'&&a.pageId===page&&a.language==='bilingual');
 if(!a||!a.active||a.customerSpecific!==false||a.approval!=='OWNER_APPROVED_R2_20261026'||a.verification!=='PUBLIC_BYTES_DECODED_AND_VISUALLY_REVIEWED')throw Error('PUBLIC_PREVIEW_ASSET_NOT_ADMITTED');
 return {...a,role:'PUBLIC_FIXED_ART_ONLY_NO_PRIVATE_CASE_TEXT'};
});
const admission=read('content/ecr-phi-card/admission/ecr-phi-card-customer-admission-v1.json');
const result={schemaVersion:'ECR-FLAGSHIP-PRESENTATION-PROJECTION-R1',derivedOnly:true,synthetic:true,fixtureSource:'content/embodied-configuration/acceptance/ecr-mandala-canonical-acceptance-fixture-v1.json',projections,layers,preview,cardPublicDisplayAdmitted:admission.customerAdmission===true&&admission.status==='CUSTOMER_ADMITTED',personalCardMappingEnabled:false,paidReportActivation:false};
fs.writeFileSync('assets/customer-ui/media/ecr-flagship-r1/presentation.json',JSON.stringify(result));
fs.writeFileSync('tools/review/ecr-flagship-visual-r1/ASSET-USAGE.json',JSON.stringify({hero:'Existing Mandala renderer, decorative clone of same public method fixture',eightLayerMandala:'Existing buildFixtureProjection + renderPhiMandalaVisual; personal runtime unchanged',originsAndReading:'New page-native editorial layout, first-party Book I/Founder references; not a semantic graph',cards:read('content/ecr-phi-card/ecr-phi-card-asset-registry-v1.json').assets,preview:preview.map(a=>({pageId:a.pageId,objectKey:a.objectKey,sha256:a.sha256,approval:a.approval})),newR2Objects:0,sourceContractSHA256:crypto.createHash('sha256').update(fs.readFileSync('content/embodied-configuration/ecr-customer-mandala-contract-v1.json')).digest('hex')},null,2));
console.log('8 bilingual authority labels; existing canonical fixture; 48 registered cards; 3 public fixed report assets.');
