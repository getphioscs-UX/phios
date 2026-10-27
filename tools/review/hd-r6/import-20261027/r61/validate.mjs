import fs from 'node:fs';import assert from 'node:assert/strict';import {randomBytes,randomUUID} from 'node:crypto';
import {calculateInternalChartPreview,acknowledgeInternalPreview} from '../../../../../functions/external-profile/hd-internal-chart-candidate.js';
import {issueHdConfirmationSnapshot,verifyHdConfirmationSnapshot,createHdConfirmationHeadStore} from '../../../../../functions/external-profile/hd-report-automation-candidate.js';
import {loadHdR5LocalResources} from '../../../../../scripts/lib/hd-r5-local-resources.mjs';
import {qaCoreEnvironment} from '../../../../../scripts/lib/p8-shared-core-qa.mjs';
import {predicateMatches,retiredSourceIds} from '../field-review.mjs';
import {selectOwnerReview,inspectSelection,conditions,presentationId} from './selection.mjs';
const root='tools/review/hd-r6/import-20261027/',d=root+'r61/',j=p=>JSON.parse(fs.readFileSync(p)),out=(p,v)=>fs.writeFileSync(d+p,JSON.stringify(v,null,2)+'\n');
export const rows=j(root+'candidate/PARAGRAPH-INDEX.json').paragraphs;
export const activeSourceIds=j(root+'candidate/ACTIVE-SOURCE-INDEX.json').registeredSources.map(x=>x.id);
export async function environment(){
 const original=j('.tmp/hd-report-publication-r51/CURRENT-PLAN.json'),raw=await calculateInternalChartPreview(original.input),preview=acknowledgeInternalPreview(raw,{chartDigest:raw.chartDigest,confirmed:true});
 assert.equal(preview.chartDigest,original.preview.chartDigest);
 const qa=qaCoreEnvironment('.tmp/hd-r61/'+randomUUID(),{fresh:true});qa.env.PHIOS_HD_INTERNAL_CONFIRMATION_LOCAL='true';
 const identity={userId:'QA-HD-R61-A',sessionId:'QA-HD-R61-SESSION',providerId:'LOCAL_QA',authenticated:true,verified:true},options={identity,secret:randomBytes(32).toString('hex'),now:new Date().toISOString(),runtimeDependencyDigest:loadHdR5LocalResources().runtimeDependencyDigest};
 const confirmationOwner=await createHdConfirmationHeadStore(qa.env,identity),generation=await confirmationOwner.invalidate(),proof=issueHdConfirmationSnapshot(preview,{...options,confirmationGeneration:generation});await confirmationOwner.activate(generation,()=>proof);
 return {qa,ctx:{preview,token:proof.token,options,confirmationOwner,activeSourceIds,requestedUse:'OWNER_REVIEW'}};
}
export function variant(chart,name){const c=structuredClone(chart);if(name==='line43.4')c.activations.find(a=>a.layer==='PERSONALITY'&&a.bodyCode==='SUN').line=4;if(name==='gate-only')c.channels=c.channels.filter(x=>!x.gates.includes(43));if(name==='other-profile')c.profile.profileCode='4/6';if(name==='other-type')c.typeCode='PROJECTOR';if(name==='other-authority')c.authority='SACRAL';if(name==='other-definition')c.definition.definitionCode='SINGLE_DEFINITION';if(name==='cross-order'){const s=c.activations.find(a=>a.layer==='PERSONALITY'&&a.bodyCode==='SUN'),e=c.activations.find(a=>a.layer==='PERSONALITY'&&a.bodyCode==='EARTH');[s.gate,e.gate]=[e.gate,s.gate];c.incarnationCross.personalitySun=s.gate;c.incarnationCross.personalityEarth=e.gate;c.incarnationCross.configurationCode='23/43|29/30';}if(name==='missing')c.activations=c.activations.filter(a=>!(a.layer==='PERSONALITY'&&a.bodyCode==='SUN'));if(name==='contradictory')c.activations.push({...c.activations[0]});return c;}
async function main(){
 let network=0;globalThis.fetch=async()=>{network++;throw Error('OFFLINE_ONLY');};
 const checks=[],test=(id,f)=>{f();checks.push({id,status:'PASS'});}, {qa,ctx}=await environment();
 try{
 const decisions=await selectOwnerReview(rows,ctx), selected=rows.filter((r,i)=>decisions[i].matched);
 for(const [i,r]of rows.entries()){test('commercial-denied '+r.reviewLocation,()=>{assert.equal(decisions[i].commercialGate,'BLOCKED');assert.equal(decisions[i].customerParagraph,null);});}
 for(const language of ['zh-Hans','en']){
  const get=id=>rows.find(r=>r.subsectionId===id&&r.language===language), probe=(r,c=ctx.preview.chart)=>inspectSelection(r,c,{activeSourceIds});
  test(language+' 43.5 exact real Sun/side/line selected',()=>assert(probe(get('SEC07.05')).matched));
  test(language+' 43.4 rejects 43.5 paragraph',()=>assert(!probe(get('SEC07.05'),variant(ctx.preview.chart,'line43.4')).matched));
  test(language+' complete 43-23 matches',()=>assert(probe(get('SEC07.07')).matched));
  test(language+' Gate43 alone does not match complete channel',()=>assert(!probe(get('SEC07.07'),variant(ctx.preview.chart,'gate-only')).matched));
  for(const name of ['other-profile','other-type','other-authority','other-definition','cross-order','missing','contradictory'])test(language+' actual selector denies '+name,()=>assert(!probe(get(name==='cross-order'?'SEC09.01':'SEC15.12'),variant(ctx.preview.chart,name)).matched));
  test(language+' null Cross name does not blanket-stop structural private review',()=>{assert.equal(ctx.preview.chart.incarnationCross.namedCross,null);assert(probe(get('SEC09.01')).matched);});
  test(language+' Low Sound exact scope omitted',()=>assert(!probe(get('SEC10.06')).matched));
  test(language+' independent Right paragraph remains reviewable',()=>assert(probe(get('SEC10.04')).matched));
  test(language+' optional PHS paragraph remains held',()=>assert(!probe(rows.find(r=>r.subsectionId==='SEC15.11'&&r.paragraph===3&&r.language===language)).matched));
  test(language+' no SEC10.07',()=>assert(!rows.some(r=>r.language===language&&r.subsectionId==='SEC10.07')));
  for(const source of [...retiredSourceIds,'FAKE_UNADMITTED'])test(language+' withdrawn/unregistered denied '+source,()=>assert(!probe({...get('SEC07.05'),activeSourceIds:[source]}).matched));
  for(let tone=1;tone<=6;tone++)test(language+' Tone '+tone+' never creates subtype/cognition',()=>{const c=structuredClone(ctx.preview.chart);c.variables.fields.designUpper.tone=tone;assert.equal(predicateMatches(c,{fieldAlias:'variables.determination.soundSubtype',op:'eq',value:'LOW'}).state,'UNMAPPED');assert.equal(c.variables.fields.designUpper.cognition,null);});
 }
 const allPredicates=[...new Map(rows.flatMap(r=>conditions(r).all).map(p=>[JSON.stringify(p),p])).values()];
 for(const language of ['zh-Hans','en'])for(const p of allPredicates){const got=predicateMatches(ctx.preview.chart,p);if(got.state==='UNMAPPED')continue;test(language+' exact typed condition '+JSON.stringify(p),()=>assert.equal(got.matched,true));test(language+' false expected value '+JSON.stringify(p),()=>{const wrong={...p,value:p.fieldAlias==='completeChannel'?'1-2':p.fieldAlias.startsWith('centers.')?'Head':typeof p.value==='number'?99:'UNMATCHED'};assert.notEqual(predicateMatches(ctx.preview.chart,wrong).matched,true);});}
 const deny=async(id,context)=>{await assert.rejects(()=>selectOwnerReview(rows,context));checks.push({id,status:'PASS'});};
 await deny('cross-account signed snapshot denial',{...ctx,options:{...ctx.options,identity:{...ctx.options.identity,userId:'QA-OTHER'}}});
 await deny('expired signed confirmation',{...ctx,options:{...ctx.options,now:new Date(Date.parse(ctx.options.now)+16*60000).toISOString()}});
 await deny('customer use cannot read HOLD text',{...ctx,requestedUse:'CUSTOMER_REPORT'});
 await assert.rejects(()=>selectOwnerReview([{...rows[0],chartResultDigest:'0'.repeat(64)}],ctx));checks.push({id:'immutable paragraph snapshot mismatch',status:'PASS'});
 await ctx.confirmationOwner.invalidate();await deny('existing SQL owner revocation denies reread',ctx);
 test('presentation numbering contiguous without registry rename',()=>{assert.equal(presentationId('SEC10.08'),'10.7');assert.equal(rows.find(r=>r.subsectionId==='SEC10.08').subsectionId,'SEC10.08');});
 test('provider/network zero',()=>assert.equal(network,0));
 out('SELECTED-OWNER-CONTENT.json',{at:new Date().toISOString(),scope:'Private owner-only review, actual immutable matched calculation witness; not customer content, no commercial admission',selectionPath:'selectOwnerReview using real signed snapshot and isolated existing SQL head',chartDigest:ctx.preview.chartDigest,namedCross:null,rows:selected,decisions});
 out('TEST-RESULTS.json',{at:new Date().toISOString(),status:'LOCAL_SELECTION_SAFETY_PASS_SUBTYPE_POSITIVE_CASE_BLOCKED',passed:checks.length,checks,paragraphs:rows.length,selected:selected.length,omitted:rows.length-selected.length,providerCalls:network,costUSD:0,productionWrites:0,blocked:'Low Sound true/false cannot be certified without independently verified subtype. Cases above test omission, not fabricated success.',reusedPriorEvidence:{path:root+'CONDITIONAL-TESTS.json',passed:455,scope:'Original predicate families incl missing/stale/contradictory; retained unchanged'},syntheticVariants:'Counterfactual selector tests, not newly certified charts; actual confirmed selection remains bound to immutable original digests'});
 console.log({passed:checks.length,selected:selected.length,omitted:rows.length-selected.length});
 }finally{qa.sql.close();}
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/r61/validate.mjs'))await main();
