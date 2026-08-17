export function evaluateRule(edge, context={}){
  const present=new Set(context.conditions||[]); const conflicts=[];
  const missing=(edge.requiredConditions||[]).filter(c=>!present.has(c));
  const hitDisqualifiers=(edge.disqualifiers||[]).filter(c=>present.has(c));
  if(missing.length||hitDisqualifiers.length) return Object.freeze({eligible:false,missingRequired:missing,disqualifiers:hitDisqualifiers,weights:null,precedence:null,conflict:conflicts,fallback:'UNKNOWN'});
  return Object.freeze({eligible:true,missingRequired:[],disqualifiers:[],weights:context.weights??null,precedence:context.precedence??null,conflict:conflicts,fallback:null});
}
