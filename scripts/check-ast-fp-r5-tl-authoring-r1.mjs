import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,ref,digest,synthesis} from './build-ast-fp-r5-tl-reference.mjs';
import {buildAstAspectNetworkClusters} from '../functions/ast-full-production/ast-aspect-network-clusters.js';
import {buildAstHouseRulerSectionRoutes,assertAstAuthoringSectionEvidence} from '../functions/ast-full-production/ast-house-ruler-section-routes.js';
globalThis.fetch=()=>{throw Error('R1_NETWORK_FORBIDDEN');};
const root='content/professional/ast-full-production/',c=read(ref('canonical-projection')),r=read(ref('r4-professional-semantic')),s=read(ref('whole-chart-synthesis')),pack=read(ref('customer-authoring-pack')),rules=read(root+'registries/ast-r5-whole-chart-composition-rule-registry-v2.json');
assert.equal(c.canonicalProjection.projectionId,'CMP2-3353E1115566DDE4F27C808E');assert.equal(digest(c.canonicalProjection),'02f96934070156352695f361c9f7e3c9c8f5ca39962b4c536c5eb5b3ebb9721c');assert.equal(digest(r.professionalSemanticProjection),'e5b89516602f0ba6371e88d0c145393cc036dc7bc7be3a085fd7c293545ac78c');
assert.equal(read(root+'admission/ast-fp-r4a-professional-semantic-human-admission-v1.json').status,'HUMAN_ADMITTED_21_OF_21');
const aspects=c.canonicalProjection.calculation.structures.find(x=>x.code==='ASPECTS').items,bodyEvidence=s.syntheses.en.bodyEvidence;
const args={aspects,bodyEvidence,policy:rules.aspectNetworkCluster};const clusters=buildAstAspectNetworkClusters(args);
assert.deepEqual(clusters,buildAstAspectNetworkClusters({...args,aspects:[...aspects].reverse(),bodyEvidence:Object.fromEntries(Object.entries(bodyEvidence).reverse())}));
const required=clusters.find(x=>x.bodyCodes.join('|')==='JUPITER|NEPTUNE|SATURN|VENUS');assert(required);assert.equal(required.evidenceAspectCodes.length,6);assert.deepEqual(required.houseNumbers,[6,12]);assert.equal(required.namedTraditionalPattern,false);
for(const cluster of clusters){assert(cluster.bodyCodes.length>=3);assert(cluster.edges.length>=2);assert.equal(cluster.connected,true);for(const edge of cluster.edges){const original=aspects.find(x=>x.code===edge.aspectCode);assert(original);assert.equal(edge.fromCode,original.meta.fromCode);assert.equal(edge.toCode,original.meta.toCode);assert.equal(edge.type,original.meta.type);assert.equal(edge.orbDegrees,original.meta.orb);}}
// Connected chains qualify; disconnected, two-body and over-orb sets cannot.
const evidence={A:{houseNumber:1},B:{houseNumber:2},C:{houseNumber:3},D:{houseNumber:4}};
const edge=(code,fromCode,toCode,orb=0.1)=>({code,meta:{fromCode,toCode,type:'SEXTILE',orb,authorizedOrbDegrees:4}});
const syntheticProbe={bodyEvidence:evidence,policy:rules.aspectNetworkCluster};
assert.equal(buildAstAspectNetworkClusters({...syntheticProbe,aspects:[edge('E1','A','B'),edge('E2','C','D')]}).length,0);
assert.equal(buildAstAspectNetworkClusters({...syntheticProbe,aspects:[edge('E1','A','B')]}).length,0);
assert.equal(buildAstAspectNetworkClusters({...syntheticProbe,aspects:[edge('E1','A','B'),edge('E2','B','C')]}).length,1);
assert.equal(buildAstAspectNetworkClusters({...syntheticProbe,aspects:[edge('E1','A','B',1),edge('E2','B','C',1)]}).length,0);
for(const locale of ['en','zh-Hans']){assert.deepEqual(s.syntheses[locale],synthesis(c.canonicalProjection,r.professionalSemanticProjection,locale));assert(!s.syntheses[locale].coreThemes.some(x=>x.familyCode==='ASPECT_DYNAMICS'));assert(s.syntheses[locale].coreThemes.some(x=>x.familyCode==='ASPECT_NETWORK_CLUSTER'));}
assert.deepEqual(s.syntheses.en.coreThemes.map(x=>x.themeKey),s.syntheses['zh-Hans'].coreThemes.map(x=>x.themeKey));
const routes=buildAstHouseRulerSectionRoutes({canonicalProjection:c.canonicalProjection,professionalSemanticProjection:r.professionalSemanticProjection,bodyEvidence:s.syntheses['zh-Hans'].bodyEvidence,routePolicy:rules.houseRulerSectionRoutes});assert.deepEqual(pack.houseRulerSectionRoutes,routes);
const route=id=>routes.find(x=>x.sectionId===id),section=id=>pack.sectionPlan.find(x=>x.sectionId===id);
const rel=route('RELATIONSHIPS_RECIPROCITY');assert.equal(rel.routes[0].rulerBodyCode,'SATURN');assert.equal(rel.routes[0].rulerActualSign,'CAPRICORN');assert.equal(rel.routes[0].rulerActualHouse,6);assert(rel.angleRefs.includes('DSC'));for(const b of required.bodyCodes)assert(section(rel.sectionId).allowedBodyRefs.includes(b));for(const e of required.evidenceAspectCodes)assert(section(rel.sectionId).allowedAspectRefs.includes(e));
const work=route('WORK_RESPONSIBILITY_PUBLIC_DIRECTION');assert.equal(work.routes[0].rulerBodyCode,'MARS');assert.equal(work.routes[0].rulerActualSign,'SCORPIO');assert.equal(work.routes[0].rulerActualHouse,4);assert(work.angleRefs.includes('MC'));assert(work.aspectRefs.some(code=>aspects.some(x=>x.code===code&&['TRINE','SEXTILE'].includes(x.meta.type))));
const res=route('RESOURCES_SECURITY_DEPENDENCY');assert.deepEqual(res.routes.map(x=>[x.houseNumber,x.rulerBodyCode,x.rulerActualHouse]),[[2,'SUN',5],[8,'SATURN',6]]);
const inner=section('SELF_EXPRESSION_INNER_REGULATION');for(const b of ['MARS','PLUTO'])assert(inner.allowedBodyRefs.includes(b));assert(inner.allowedAngleRefs.includes('IC'));assert(inner.allowedHouseRefs.includes(4));
assertAstAuthoringSectionEvidence(pack.sectionPlan,routes,c.canonicalProjection);
const empty=structuredClone(pack.sectionPlan);empty.find(x=>x.sectionId==='RELATIONSHIPS_RECIPROCITY').allowedBodyRefs=[];assert.throws(()=>assertAstAuthoringSectionEvidence(empty,routes,c.canonicalProjection),/INSUFFICIENT/);
const unavailable=structuredClone(routes);unavailable.find(x=>x.sectionId==='RELATIONSHIPS_RECIPROCITY').status='EVIDENCE_LIMITED';assert.throws(()=>assertAstAuthoringSectionEvidence(pack.sectionPlan,unavailable,c.canonicalProjection),/LIMIT_REQUIRED/);
const missingMc=structuredClone(pack.sectionPlan);missingMc.find(x=>x.sectionId==='WORK_RESPONSIBILITY_PUBLIC_DIRECTION').allowedAngleRefs=[];assert.throws(()=>assertAstAuthoringSectionEvidence(missingMc,routes,c.canonicalProjection),/ROUTE_REQUIRED/);
const missingEight=structuredClone(routes);missingEight.find(x=>x.sectionId==='RESOURCES_SECURITY_DEPENDENCY').routes.pop();assert.throws(()=>assertAstAuthoringSectionEvidence(pack.sectionPlan,missingEight,c.canonicalProjection),/ROUTE_REQUIRED/);
const counts=pack.aspectDynamics.reduce((m,x)=>(m[x.state]=(m[x.state]||0)+1,m),{});assert.deepEqual(counts,{SEPARATING:9,APPLYING:10});
for(const cluster of pack.aspectNetworkClusters)for(const edge of cluster.edges)assert.equal(edge.dynamicState,pack.aspectDynamics.find(x=>x.aspectCode===edge.aspectCode).state);
assert.equal(pack.customerIntent,'OPEN');assert.equal(pack.governance.customerManuscriptWritten,false);assert(!JSON.stringify(pack).includes('/fixtures/'));assert(!fs.readFileSync('scripts/build-ast-fp-r5-tl-authoring-r1.mjs','utf8').includes('executeAndProjectAstV2'));
console.log(JSON.stringify({status:'PASS',canonical:'UNCHANGED',r4:'UNCHANGED',clusterCount:clusters.length,relationshipEvidence:'PASS',workEvidence:'PASS',resourceEvidence:'PASS',providerCalls:0,canonicalCalculationCalls:0}));
