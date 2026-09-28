import assert from 'node:assert/strict';

const explicit=process.env.ECR_R9_PREVIEW_URL||process.argv[2]||null;
const candidates=[explicit,'https://ecr-r9-preview-e2e.phios-github.pages.dev','https://qa.phios-github.pages.dev'].filter(Boolean);
async function resolveBase(){
  const failures=[];
  for(const raw of [...new Set(candidates)]){
    const base=raw.replace(/\/+$/,'');
    try{
      const response=await fetch(base+'/perspectives/personal/',{redirect:'follow',headers:{accept:'text/html'}});
      const text=await response.text();
      if(response.ok&&text.includes('data-cx-surface="PERSONAL_REALITY"'))return {base,page:text,status:response.status};
      failures.push({base,status:response.status,body:text.slice(0,160)});
    }catch(error){failures.push({base,error:String(error?.message||error)})}
  }
  throw new Error('ECR_R9_PREVIEW_NOT_REACHABLE:'+JSON.stringify(failures));
}

const snapshot=(locale)=>({
  schemaVersion:'PHI-OS-CONFIRMED-BIRTH-LOCATION-SNAPSHOT-v1.0.0',
  state:'CONFIRMED',
  binding:{birthDate:'2000-01-01',birthTime:'00:01:00'},
  location:{
    provider:'OPENSTREETMAP_NOMINATIM',providerRef:'N123',state:'CONFIRMED',
    displayName:'Synthetic validation fixture',customerLabel:'Synthetic validation fixture',
    localizedName:null,englishName:'Synthetic validation fixture',
    countryCode:'MY',country:'Malaysia',region:'Selangor',locality:'Synthetic validation fixture',
    latitude:3.1,longitude:101.7,
    timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',historicalOffsetMinutes:480,source:'GOVERNED_RESOLUTION',confidence:'HIGH'}
  }
});

const payload=locale=>({
  consent:true,
  methods:['ecr'],
  locale,
  intent:'R9 deployed Preview E2E validation only',
  reportSubjectName:'Synthetic R9 ECR',
  birthDate:'2000-01-01',
  birthTime:'00:01',
  birthTimeUnknown:false,
  placeRef:'N123',
  birthLocationSnapshot:snapshot(locale),
  ecrV41PreviewAcceptance:true
});

async function checkAsset(baseUrl){
  const response=await fetch(baseUrl,{redirect:'follow'});
  assert(response.ok,`PHI Card asset failed ${response.status}: ${baseUrl}`);
  assert.match(response.headers.get('content-type')||'',/^image\//i);
}
function findSection(report,id){return (report?.sections||[]).find(x=>x.sectionId===id)}
async function runLocale(base,locale){
  const response=await fetch(base+'/api/customer-personal-reality',{
    method:'POST',
    headers:{'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify(payload(locale))
  });
  const body=await response.json().catch(()=>({}));
  assert.equal(response.status,200,`${locale} response status: ${response.status} ${JSON.stringify(body).slice(0,600)}`);
  assert.equal(body.ok,true);
  assert.equal(body.privacy?.saved,false);

  const route=body.view?.productRoute;
  assert.equal(route?.mode,'SINGLE_METHOD');
  assert.equal(route?.methodId,'ECR');
  const product=route?.primaryProduct;
  assert(product,'ECR primary product missing');
  assert.equal(product.methodId,'ECR');
  assert.equal(product.productType,'PHI_CONFIGURATION_READING');
  assert.equal(product.state,'CUSTOMER_PUBLISHABLE','Preview candidate must be renderer-visible');
  assert.equal(product.publication?.previewOnly,true);
  assert.equal(product.publication?.customerPublishable,false,'Preview must not admit production');
  assert.equal(product.publication?.status,'PREVIEW_E2E_CANDIDATE');

  const report=product.sourceProduct?.fullReport;
  assert.equal(report?.edition,'ECR_HUMAN_RUNTIME_V4_1');
  assert.equal(report?.depth,'PAID');
  assert.equal(report?.sections?.length,14);
  assert.equal(report?.boundaries?.customerProductionAdmitted,false);

  const initialization=findSection(report,'INITIALIZATION');
  const activations=initialization?.content?.activations||[];
  const earth=activations.filter(x=>x.body==='EARTH');
  assert.equal(earth.length,2,'Personality + Design Earth required');
  assert(earth.every(x=>Number.isInteger(x.gate)&&Number.isFinite(x.line)));
  assert.equal(activations.filter(x=>x.body==='CHIRON').length,0);

  const current=findSection(report,'CURRENT_REALITY');
  assert.equal(current?.content?.status,'UNBOUND');
  assert.deepEqual(current?.content?.observations,[]);

  const mandala=(product.visuals||[]).find(x=>x.type==='ECR_PHI_MANDALA_V1');
  assert(mandala,'Mandala visual missing');
  assert.equal(mandala.payload?.sectors?.length,64);
  assert.equal(mandala.payload?.markers?.length,28);
  assert.equal(mandala.payload?.markers?.filter(x=>x.bodyCode==='EARTH').length,2);
  assert.equal(mandala.payload?.markers?.filter(x=>x.bodyCode==='CHIRON').length,0);
  assert.equal(mandala.payload?.sectors?.[0]?.eclipticStartDeg,302);
  assert.equal(mandala.payload?.sectors?.[0]?.ecrConfigurationRef,'ECR-H48');

  const spread=(product.visuals||[]).find(x=>x.type==='ECR_SIX_CARD_SPREAD');
  assert(spread,'Phi Card spread missing');
  const cards=spread.payload?.cards||[];
  assert.equal(cards.length,6);
  assert.deepEqual(cards.map(x=>x.slot),['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY']);
  assert(cards.every(x=>['ADMITTED_SELECTION','UNKNOWN'].includes(x.status)));
  const admitted=cards.filter(x=>x.status==='ADMITTED_SELECTION');
  for(const card of admitted){
    assert(card.cardId);
    assert(card.asset?.objectKey);
    await checkAsset('https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/'+card.asset.objectKey.replace(/^\/+/,'')); 
  }

  const serialized=JSON.stringify(product);
  assert(!/CHIRON/i.test(serialized));
  assert(!/compositional semantic resolver has no human-admitted rules|组合语义解析器在此字段还没有经过人工准入的规则/.test(serialized));
  assert.equal(product.boundaries?.previewOnly,true);
  assert.equal(product.boundaries?.previewDoesNotAdmitProduction,true);
  return {locale,sections:report.sections.length,earth:earth.map(x=>({layer:x.layer,gate:x.gate,line:x.line})),cards:cards.map(x=>({slot:x.slot,cardId:x.cardId,status:x.status,asset:x.asset?.objectKey||null})),admittedCards:admitted.length};
}

const {base,page,status}=await resolveBase();
assert.equal(status,200);
assert(page.includes('/assets/customer-ui/surfaces/personal-reality-r12.css'));
const assetPaths=[
  '/assets/customer-ui/js/specialists/ecr/product-renderer.js',
  '/assets/customer-ui/surfaces/ecr-specialist.css',
  '/assets/customer-ui/js/personal-products/specialist-renderer-host.js'
];
for(const path of assetPaths){
  const r=await fetch(base+path,{redirect:'follow'});
  assert(r.ok,`Preview asset missing: ${path} -> ${r.status}`);
}
const results=[];
for(const locale of ['en','zh-Hans'])results.push(await runLocale(base,locale));
console.log(JSON.stringify({status:'PASS',previewBase:base,route:'/perspectives/personal/',api:'/api/customer-personal-reality',results,boundaries:{previewOnly:true,customerProductionAdmitted:false}},null,2));
console.log('PASS R9 deployed Preview E2E: V4.1 Human Runtime, deterministic Earth D11, bilingual 14-section report, six governed PHI Card slots, R2 assets, Current Reality boundary, and preview-only production firewall are live.');
