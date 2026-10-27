// Compose the existing signed-OIDC Account suite with the existing card adapter.
// No new auth implementation, live login or identity header bypass.
import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const reviewDir=process.env.PHI_CARD_REVIEW_DIR||'tools/review/phi-card-customer-experience-r2/r23';
let source=fs.readFileSync('scripts/check-fw-account-auth.mjs','utf8');
source=source.replace("from 'jose'","from '"+import.meta.resolve('jose')+"'");
source=source.replace(/(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,(_,a,p,c)=>a+new URL(p,new URL('./check-fw-account-auth.mjs',import.meta.url)).href+c);
source=`import {createPhiCardCustomerExperience} from '${new URL('../functions/ecr-phi-card/ecr-customer-experience-r1.js',import.meta.url).href}';
import {authorities,syntheticResult} from '${new URL('./lib/phi-card-customer-local.mjs',import.meta.url).href}';
const bridgeChecks=[];\n`+source;
const marker="const projected=await (await middleware(trusted)).json();";
if(!source.includes(marker))throw Error('ACCOUNT_SUITE_DRIFT');
source=source.replace(marker,marker+`
 const cardAuthority=authorities(),fixture=syntheticResult();fixture.ownerId=who.userId;
 const cardContext={request:new Request('http://localhost/api/phi-card-customer-local'),env:{...env,PHIOS_PHI_CARD_LOCAL:'true'},data:trusted.data};
 const cards=createPhiCardCustomerExperience({context:cardContext,...cardAuthority,resolveOwnedResult:async({owner,resultId})=>owner===who.userId&&resultId===fixture.resultId?fixture:null});
 const ce=await cards.personal({resultId:fixture.resultId,locale:'en'}),cz=await cards.personal({resultId:fixture.resultId,locale:'zh-Hans'});
 assert.deepEqual(ce.cards.map(c=>c.cardId),cz.cards.map(c=>c.cardId));assert.equal(ce.resultDigest,cz.resultDigest);assert(ce.cards.length<=6);assert(ce.cards.every(c=>c.reading.status==='R2_BASELINE_CONTENT_APPROVED'));
 const savedCardReading=await cards.saveReading({resultId:fixture.resultId,locale:'en',consent:true});assert(savedCardReading.key);
 fixture.entitlementActive=false;await assert.rejects(()=>cards.personal({resultId:fixture.resultId,locale:'en'}),/ACCESS_DENIED/);fixture.entitlementActive=true;
 fixture.customerPublishable=false;await assert.rejects(()=>cards.personal({resultId:fixture.resultId,locale:'en'}),/ADMITTED_SOURCE_REQUIRED/);fixture.customerPublishable=true;
 await assert.rejects(()=>cards.personal({resultId:'UNOWNED',locale:'en'}),/ACCESS_DENIED/);
 assert.throws(()=>createPhiCardCustomerExperience({context:{...cardContext,data:{}},...cardAuthority,resolveOwnedResult:async()=>fixture}),/ACCOUNT_REQUIRED/);
 bridgeChecks.push({issuerKind:issuer.includes('custom')?'CUSTOM':'DEFAULT',actualVerifiedOidcIdentity:true,middlewareOwnerPassedToCards:true,selectionStable:true,locales:true,unownedDenied:true,anonymousDenied:true,providerCalls:0});
 `);
const after="assert.equal(await authenticate(context('/api/private',{headers:{cookie:session+'tampered'}})),null);";
source=source.replace(after,after+`
 const again=await authApi(context('/api/auth/login'),'login'),againUrl=new URL(again.headers.get('location'));nonce=againUrl.searchParams.get('nonce');
 const againCookie=again.headers.get('set-cookie').split(';')[0];const againResponse=await authApi(context('/api/auth/callback?code=test&state='+againUrl.searchParams.get('state'),{headers:{cookie:againCookie}}),'callback');assert.equal(againResponse.status,302);
 const newSession=againResponse.headers.getSetCookie().find(c=>c.startsWith(SESSION_COOKIE+'=')).split(';')[0],reentered=await authenticate(context('/api/private',{headers:{cookie:newSession}}));assert.equal(reentered.userId,who.userId);assert.notEqual(newSession,session);bridgeChecks.at(-1).logoutRevokesOldSession=true;bridgeChecks.at(-1).reentrySameOwner=true;
 const reentryContext=context('/api/private',{headers:{cookie:newSession}});reentryContext.next=()=>Response.json({ok:true});await middleware(reentryContext);const cardsAgain=createPhiCardCustomerExperience({context:{...cardContext,data:reentryContext.data},...cardAuthority,resolveOwnedResult:async({owner,resultId})=>owner===reentered.userId&&resultId===fixture.resultId?fixture:null});const reopenedCardReading=await cardsAgain.reopen({key:savedCardReading.key,locale:'zh-Hans'});assert.deepEqual(reopenedCardReading.cards.map(c=>c.cardId),ce.cards.map(c=>c.cardId));bridgeChecks.at(-1).saveLogoutReentryReopenSameSpread=true;bridgeChecks.at(-1).entitlementRevokedDenied=true;bridgeChecks.at(-1).nonPublishableSourceDenied=true;
 `);
source=source.replaceAll('docs/financial-will-successor-r1/fw-production',reviewDir+'/account-oidc');
source+=`\nfs.writeFileSync('${reviewDir}/ACCOUNT-BRIDGE.json',JSON.stringify({status:'PASS_ISOLATED_SIGNED_OIDC_TO_EXISTING_CARD_ADAPTER',checks:bridgeChecks,liveProviderLogin:'NOT_RUN',productionWrites:0,providerCalls:0},null,2));`;
await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
