/** AST-FP-R4 professional semantic sidecar. It derives governed structural
 * semantics from an existing Canonical AST v2 projection. It never mutates the
 * projection and never creates a customer interpretation or outcome claim. */
export const AST_R4_SEMANTIC_SCHEMA_VERSION='PHI-OS-AST-PROFESSIONAL-SEMANTIC-PROJECTION-v1.0.0';
const CORE=Object.freeze(['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO']);
const SIGNS=Object.freeze(['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES']);
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];
const fail=code=>{throw Object.assign(new Error(code),{code})};
const norm=v=>{const n=Number(v);if(!Number.isFinite(n))fail('AST_R4_LONGITUDE_INVALID');return ((n%360)+360)%360};
const sep=(a,b)=>{const d=Math.abs(norm(a)-norm(b));return Math.min(d,360-d)};
const signIndex=longitude=>Math.floor(norm(longitude)/30);
const signCode=longitude=>SIGNS[signIndex(longitude)];
const group=(p,code)=>list(p?.calculation?.structures).find(x=>x.code===code)?.items||[];
const pairKey=(a,b)=>[a,b].sort().join('|');
function uniqueLeader(counts){const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));return rows.length&&rows[0][1]>rows[1][1]?{state:'UNIQUE_DISTRIBUTION_LEADER',code:rows[0][0],count:rows[0][1],margin:rows[0][1]-rows[1][1]}:{state:'TIED_NO_SINGLE_LEADER',codes:rows.filter(x=>x[1]===rows[0]?.[1]).map(x=>x[0]),count:rows[0]?.[1]||0};}
function canonicalCycle(cycle){if(!cycle.length)return '';const variants=cycle.map((_,i)=>[...cycle.slice(i),...cycle.slice(0,i)].join('>'));return variants.sort()[0]}
function assertBundle(authority,registries){
 if(authority?.schemaVersion!=='PHI-OS-AST-FP-R4-PROFESSIONAL-SEMANTIC-AUTHORITY-v1.0.0'||authority.production?.customerCutoverAllowed!==false)fail('AST_R4_AUTHORITY_INVALID');
 const {angles,rulership,elementModality,aspectPatterns,aspectDynamics}=registries||{};
 if(angles?.schemaVersion!=='PHI-OS-AST-R4-ANGLE-SEMANTIC-REGISTRY-v1.0.0')fail('AST_R4_ANGLE_REGISTRY_INVALID');
 if(rulership?.schoolPolicy?.chainAuthority!=='TRADITIONAL_SEVEN_PRIMARY_V1'||rulership.schoolPolicy.silentSchoolMixingAllowed!==false)fail('AST_R4_RULERSHIP_SCHOOL_INVALID');
 if(elementModality?.countScope!=='CORE_10_PLANETS_UNWEIGHTED')fail('AST_R4_ELEMENT_MODALITY_POLICY_INVALID');
 if(aspectPatterns?.schemaVersion!=='PHI-OS-AST-R4-ASPECT-PATTERN-REGISTRY-v1.0.0')fail('AST_R4_PATTERN_REGISTRY_INVALID');
 if(aspectDynamics?.governance?.eventTimingNotCalculated!==true||aspectDynamics?.policy?.linearProbeCreatesTransitPrediction!==false)fail('AST_R4_DYNAMICS_POLICY_INVALID');
 return {angles,rulership,elementModality,aspectPatterns,aspectDynamics};
}
function buildRulership({positions,angles,cusps,registry}){
 const byBody=new Map(positions.map(x=>[x.code,x]));const rows=new Map(registry.signs.map(x=>[x.signCode,x]));
 const rulerForSign=s=>{const row=rows.get(s);if(!row)fail('AST_R4_UNKNOWN_RULERSHIP_ROW');return row};
 const dispositorFor=body=>{const p=byBody.get(body);if(!p)return null;const row=rulerForSign(signCode(p.value));return {bodyCode:body,signCode:row.signCode,primaryRuler:row.primaryTraditionalRuler,modernCoRulerAnnotation:row.modernCoRulerAnnotation||null}};
 const chainFor=start=>{const path=[],seen=new Map();let current=start;for(let guard=0;guard<24;guard++){
   if(seen.has(current)){const cycle=path.slice(seen.get(current));return {bodyCode:start,path,terminalType:'CYCLE',cycle,cycleKey:canonicalCycle(cycle)}};
   seen.set(current,path.length);path.push(current);const d=dispositorFor(current);if(!d)return {bodyCode:start,path,terminalType:'UNRESOLVED',terminalBody:null};
   if(d.primaryRuler===current)return {bodyCode:start,path,terminalType:'FINAL_DISPOSITOR',terminalBody:current};current=d.primaryRuler;
 }fail('AST_R4_DISPOSITOR_CHAIN_GUARD_EXCEEDED')};
 const planetaryDispositors=positions.map(p=>dispositorFor(p.code));const chains=positions.map(p=>chainFor(p.code));
 const finalDispositors=[...new Set(chains.filter(x=>x.terminalType==='FINAL_DISPOSITOR').map(x=>x.terminalBody))].sort();
 const cycleMap=new Map();for(const c of chains.filter(x=>x.terminalType==='CYCLE'))if(!cycleMap.has(c.cycleKey))cycleMap.set(c.cycleKey,c.cycle);
 const asc=angles.find(x=>x.code==='ASC');const ascRow=asc?rulerForSign(signCode(asc.value)):null;
 const chartRuler=ascRow?{angleCode:'ASC',ascendantSign:ascRow.signCode,bodyCode:ascRow.primaryTraditionalRuler,modernCoRulerAnnotation:ascRow.modernCoRulerAnnotation||null}:null;
 const houseRulers=cusps.map(x=>{const row=rulerForSign(signCode(x.value));return {houseNumber:x.meta?.houseNumber||Number(String(x.code).replace('HOUSE_','')),cuspLongitude:norm(x.value),signCode:row.signCode,primaryRuler:row.primaryTraditionalRuler,modernCoRulerAnnotation:row.modernCoRulerAnnotation||null}}).sort((a,b)=>a.houseNumber-b.houseNumber);
 return {schoolPolicy:registry.schoolPolicy,chartRuler,houseRulers,planetaryDispositors,dispositorChains:chains,finalDispositors,cycles:[...cycleMap.entries()].map(([cycleKey,members])=>({cycleKey,members}))};
}
function buildElementModality(positions,rulershipRegistry,policy){
 const rows=new Map(rulershipRegistry.signs.map(x=>[x.signCode,x]));const ec=Object.fromEntries(Object.keys(policy.elements).map(x=>[x,0])),mc=Object.fromEntries(Object.keys(policy.modalities).map(x=>[x,0])),sc=Object.fromEntries(SIGNS.map(x=>[x,0]));
 for(const p of positions){const s=signCode(p.value),row=rows.get(s);if(!row)fail('AST_R4_UNKNOWN_SIGN');ec[row.element]++;mc[row.modality]++;sc[s]++}
 return {scope:policy.countScope,totalBodies:positions.length,elementCounts:ec,modalityCounts:mc,signCounts:sc,elementLeader:uniqueLeader(ec),modalityLeader:uniqueLeader(mc),leaderPolicy:policy.leaderPolicy};
}
function classifyAspectDynamic(edge,byBody,policy){
 const a=byBody.get(edge.meta?.fromCode),b=byBody.get(edge.meta?.toCode),type=edge.meta?.type,angle=policy.aspectAngles?.[type];if(!a||!b||!Number.isFinite(angle))fail('AST_R4_ASPECT_ENDPOINT_INVALID');
 const current=sep(a.value,b.value),orb=Math.abs(current-angle),sa=a.meta?.speedLongitudeDegreesPerDay,sb=b.meta?.speedLongitudeDegreesPerDay;
 if(orb<=policy.policy.exactOrbToleranceDegrees)return {state:'EXACT',currentSeparationDegrees:current,currentOrbDegrees:orb,futureProbeDays:policy.policy.futureProbeDays};
 if(!Number.isFinite(sa)||!Number.isFinite(sb))return {state:policy.policy.missingSpeedState,currentSeparationDegrees:current,currentOrbDegrees:orb,futureProbeDays:policy.policy.futureProbeDays};
 const future=sep(norm(a.value+sa*policy.policy.futureProbeDays),norm(b.value+sb*policy.policy.futureProbeDays)),futureOrb=Math.abs(future-angle),eps=policy.policy.comparisonEpsilonDegrees;
 const state=futureOrb<orb-eps?'APPLYING':futureOrb>orb+eps?'SEPARATING':'UNDETERMINED';
 return {state,currentSeparationDegrees:current,currentOrbDegrees:orb,futureProbeDays:policy.policy.futureProbeDays,futureProbeOrbDegrees:futureOrb,relativeLongitudeSpeedDegreesPerDay:Number((sb-sa).toFixed(12))};
}
function detectPatterns(aspects,registry){
 const edgeMap=new Map(aspects.map(e=>[pairKey(e.meta.fromCode,e.meta.toCode),e]));const bodies=[...new Set(aspects.flatMap(e=>[e.meta.fromCode,e.meta.toCode]))].sort((a,b)=>CORE.indexOf(a)-CORE.indexOf(b));const results=[];
 const combos=(arr,n,start=0,prefix=[],out=[])=>{if(prefix.length===n){out.push(prefix);return out}for(let i=start;i<arr.length;i++)combos(arr,n,i+1,[...prefix,arr[i]],out);return out};
 const edgesFor=set=>{const edges=[];for(let i=0;i<set.length;i++)for(let j=i+1;j<set.length;j++){const e=edgeMap.get(pairKey(set[i],set[j]));if(e)edges.push(e)}return edges};
 const counts=edges=>edges.reduce((m,e)=>(m[e.meta.type]=(m[e.meta.type]||0)+1,m),{});
 const equalCounts=(actual,required)=>Object.entries(required).every(([k,v])=>(actual[k]||0)===v)&&Object.values(actual).reduce((a,b)=>a+b,0)===Object.values(required).reduce((a,b)=>a+b,0);
 for(const rule of registry.patterns){for(const set of combos(bodies,rule.bodyCount)){const edges=edgesFor(set);const c=counts(edges);if(!equalCounts(c,rule.requiredEdgeMultiset))continue;let apexBodyCode=null;if(rule.patternCode==='T_SQUARE'){apexBodyCode=set.find(body=>edges.filter(e=>e.meta.type==='SQUARE'&&[e.meta.fromCode,e.meta.toCode].includes(body)).length===2)||null}
   results.push({patternCode:rule.patternCode,bodyCodes:set,evidenceAspectCodes:edges.map(e=>e.code).sort(),edgeCounts:c,apexBodyCode,label:rule.label,candidateMeaning:rule.candidateMeaning,maxNormalizedOrb:Math.max(...edges.map(e=>Number(e.meta.authorizedOrbDegrees)>0?Number(e.meta.orb)/Number(e.meta.authorizedOrbDegrees):0))});}}
 return results.sort((a,b)=>a.patternCode.localeCompare(b.patternCode)||a.bodyCodes.join('|').localeCompare(b.bodyCodes.join('|')));
}
export function buildAstProfessionalSemanticProjection({canonicalProjection,authority,registries}={}){
 const r=assertBundle(authority,registries),p=canonicalProjection;if(p?.schemaVersion!=='PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0')fail('AST_R4_CANONICAL_PROJECTION_V2_REQUIRED');
 const all=list(p.calculation?.positions),positions=all.filter(x=>CORE.includes(x.code));if(positions.length!==CORE.length||new Set(positions.map(x=>x.code)).size!==CORE.length)fail('AST_R4_CORE10_REQUIRED');
 const angles=group(p,'ANGLES'),cusps=group(p,'HOUSE_CUSPS'),aspects=group(p,'ASPECTS');const angleReg=new Map(r.angles.items.map(x=>[x.code,x]));
 const angleSemantics=angles.map(x=>{const reg=angleReg.get(x.code);if(!reg)fail('AST_R4_ANGLE_CODE_UNREGISTERED');const sign=signCode(x.value),signRow=r.rulership.signs.find(y=>y.signCode===sign);return {code:x.code,longitude:norm(x.value),signCode:sign,element:signRow.element,modality:signRow.modality,structuralRole:reg.structuralRole,label:reg.label,candidateMeaning:reg.candidateMeaning}});
 const byBody=new Map(positions.map(x=>[x.code,x]));const aspectDynamics=aspects.map(edge=>({aspectCode:edge.code,fromCode:edge.meta?.fromCode,toCode:edge.meta?.toCode,type:edge.meta?.type,authorizedOrbDegrees:edge.meta?.authorizedOrbDegrees,...classifyAspectDynamic(edge,byBody,r.aspectDynamics)}));
 const output={schemaVersion:AST_R4_SEMANTIC_SCHEMA_VERSION,workCode:'AST-FP-R4',sourceProjectionId:p.projectionId,sourceProjectionSchemaVersion:p.schemaVersion,authoritySchemaVersion:authority.schemaVersion,sections:{angles:angleSemantics,rulership:buildRulership({positions,angles,cusps,registry:r.rulership}),elementModality:buildElementModality(positions,r.rulership,r.elementModality),aspectPatterns:detectPatterns(aspects,r.aspectPatterns),aspectDynamics},availability:{angles:angles.length===4?'AVAILABLE':'UNAVAILABLE_UPSTREAM',houseRulers:cusps.length===12?'AVAILABLE':'UNAVAILABLE_UPSTREAM',patterns:aspects.length?'AVAILABLE':'UNAVAILABLE_UPSTREAM',dynamics:aspects.length?'AVAILABLE':'UNAVAILABLE_UPSTREAM'},boundary:{sourceProjectionMutated:false,ephemerisCreated:false,newAspectGeometryCreated:false,customerMeaningAdmitted:false,customerInterpretationCreated:false,outcomePredictionCreated:false,customerCutoverAllowed:false}};
 return freeze(output);
}
export default Object.freeze({buildAstProfessionalSemanticProjection});
