/** PHI OS UX-W3–W10 public symbolic result view-model. Presentation only; no method calculation authority. */
const METHODS=new Set(['I_CHING','TAROT']);
const clean=v=>String(v??'').normalize('NFKC').trim();
const arr=v=>Array.isArray(v)?v:[];
const clone=v=>structuredClone(v);
function requireMethod(m){const x=clean(m).toUpperCase();if(!METHODS.has(x))throw new TypeError('UNSUPPORTED_SYMBOLIC_METHOD');return x;}
function sourcesFromInterpretation(i){
 const out=[]; const seen=new Set();
 const visit=v=>{if(!v)return;if(Array.isArray(v)){v.forEach(visit);return;}if(typeof v!=='object')return;
  if(v.sourceId){const k=`${v.sourceId}|${v.perspectiveId||''}`;if(!seen.has(k)){seen.add(k);out.push({sourceId:v.sourceId,perspectiveId:v.perspectiveId||null,provenance:clone(v.provenance||{})});}}
  Object.values(v).forEach(visit);
 }; visit(i); return Object.freeze(out);
}
function evidenceFor(method,e){
 if(method==='I_CHING') return Object.freeze({sixLines:clone(e.sixLines||e.lines||[]),primaryHexagram:clone(e.primaryHexagram||e.primary||null),changingLines:clone(e.changingLines||[]),relatingHexagram:clone(e.relatingHexagram||e.relating||null)});
 return Object.freeze({deck:clone(e.deck||null),draw:clone(e.draw||e.draws||[]),orientation:clone(e.orientation||null),spread:clone(e.spread||null),position:clone(e.position||e.positions||[])});
}
export function createSymbolicPublicViewModel({method,question,methodEvidence,projection,interpretation,realityComparison,unknowns=[],nextActions=[],sources=null,realityContext=null,complexity=null}={}){
 const m=requireMethod(method);if(!clean(question))throw new TypeError('SYMBOLIC_QUESTION_REQUIRED');
 const sourceList=sources?clone(sources):sourcesFromInterpretation(interpretation);
 const usingContext=realityContext?.usingCurrentRealityContext===true;
 const hierarchy=Object.freeze([
  {order:1,id:'YOUR_INPUT',data:Object.freeze({question:clean(question)})},
  {order:2,id:'METHOD_EVIDENCE',data:evidenceFor(m,methodEvidence||{})},
  {order:3,id:'PROJECTION',data:clone(projection||{})},
  {order:4,id:'SYMBOLIC_INTERPRETATION',data:clone(interpretation||{}),sources:sourceList},
  {order:5,id:'REALITY_COMPARISON',data:clone(realityComparison||{})},
  {order:6,id:'WHAT_REMAINS_UNCERTAIN',data:Object.freeze(arr(unknowns).map(clean).filter(Boolean))},
  {order:7,id:'POSSIBLE_NEXT_QUESTIONS_ACTIONS',data:Object.freeze(arr(nextActions).map(clean).filter(Boolean))}
 ]);
 return Object.freeze({schemaVersion:'PHI-OS-SYMBOLIC-PUBLIC-VIEW-MODEL-v1.0.0',method:m,hierarchy,sourceVisibility:Object.freeze({available:sourceList.length>0,label:'View sources',sources:sourceList}),realityContext:Object.freeze({usingCurrentRealityContext:usingContext,label:usingContext?'Using current Reality context':'Current Reality context is not being used',contextItems:usingContext?clone(realityContext.contextItems||[]):[]}),guestPolicy:Object.freeze({hiddenPersistentReadingHistory:false,browserLocalReadingHistory:false}),complexCaseHandoff:Object.freeze({show:complexity?.isComplex===true,label:'Explore Reality Journey',automatic:false}),authority:Object.freeze({establishesFacts:false,predictsGuaranteedOutcomes:false,createsRealityTruth:false,directsDecision:false})});
}
export function createSymbolicSaveEnvelope({question,methodEvidence,projection,reading,userNotes=''}={}){return Object.freeze({question:clean(question).slice(0,800),methodEvidence:clone(methodEvidence||{}),projection:clone(projection||{}),reading:clone(reading||{}),userNotes:clean(userNotes).slice(0,4000)});}
