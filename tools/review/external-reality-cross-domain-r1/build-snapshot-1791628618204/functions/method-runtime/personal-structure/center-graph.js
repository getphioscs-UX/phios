/** MIR-3 defined-center graph; complete SCU edges alone define Centers. */
export const CENTER_CODES=Object.freeze(['HEAD','AJNA','THROAT','G','EGO','SACRAL','SPLEEN','SOLAR_PLEXUS','ROOT']);
export const MOTOR_CENTERS=Object.freeze(['SACRAL','SOLAR_PLEXUS','EGO','ROOT']);
function adjacency(channels){const a=new Map(CENTER_CODES.map(c=>[c,new Set()])); for(const ch of channels||[]){a.get(ch.centerA).add(ch.centerB);a.get(ch.centerB).add(ch.centerA);} return a;}
export function buildCenterGraph(activatedChannels, hangingGates=[]) {
  const defined=new Set(); for(const c of activatedChannels||[]){defined.add(c.centerA);defined.add(c.centerB);} const a=adjacency(activatedChannels);
  const components=[]; const seen=new Set();
  for(const start of CENTER_CODES){if(!defined.has(start)||seen.has(start))continue;const q=[start],comp=[];seen.add(start);while(q.length){const x=q.shift();comp.push(x);for(const y of a.get(x)){if(defined.has(y)&&!seen.has(y)){seen.add(y);q.push(y);}}}components.push(Object.freeze(comp.sort()));}
  return Object.freeze({definedCenters:Object.freeze([...defined].sort()),undefinedCenters:Object.freeze(CENTER_CODES.filter(c=>!defined.has(c)).sort()),activatedChannels:Object.freeze([...(activatedChannels||[])]),hangingGates:Object.freeze([...(hangingGates||[])]),connectedComponents:Object.freeze(components)});
}
export function centersConnected(graph,a,b){if(!graph.definedCenters.includes(a)||!graph.definedCenters.includes(b))return false;return graph.connectedComponents.some(c=>c.includes(a)&&c.includes(b));}
export function anyDefinedMotorHasPathToThroat(graph){return MOTOR_CENTERS.some(m=>graph.definedCenters.includes(m)&&centersConnected(graph,m,'THROAT'));}
