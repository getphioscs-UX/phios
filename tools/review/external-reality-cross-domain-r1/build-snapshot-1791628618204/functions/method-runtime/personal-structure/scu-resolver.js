/** MIR-3 PHI OS 36-SCU structural resolver. Meaning remains owned by CMR. */
export const SCU_ENDPOINTS = Object.freeze([
  ['SCU-01',64,47,'HEAD','AJNA'],['SCU-02',61,24,'HEAD','AJNA'],['SCU-03',63,4,'HEAD','AJNA'],
  ['SCU-04',17,62,'AJNA','THROAT'],['SCU-05',43,23,'AJNA','THROAT'],['SCU-06',11,56,'AJNA','THROAT'],
  ['SCU-07',1,8,'G','THROAT'],['SCU-08',7,31,'G','THROAT'],['SCU-09',13,33,'G','THROAT'],['SCU-10',10,20,'G','THROAT'],
  ['SCU-11',16,48,'SPLEEN','THROAT'],['SCU-12',57,20,'SPLEEN','THROAT'],['SCU-13',34,20,'SACRAL','THROAT'],
  ['SCU-14',35,36,'SOLAR_PLEXUS','THROAT'],['SCU-15',12,22,'SOLAR_PLEXUS','THROAT'],['SCU-16',21,45,'EGO','THROAT'],
  ['SCU-17',10,57,'G','SPLEEN'],['SCU-18',2,14,'G','SACRAL'],['SCU-19',10,34,'G','SACRAL'],['SCU-20',15,5,'G','SACRAL'],
  ['SCU-21',46,29,'G','SACRAL'],['SCU-22',25,51,'G','EGO'],['SCU-23',27,50,'SACRAL','SPLEEN'],['SCU-24',34,57,'SACRAL','SPLEEN'],
  ['SCU-25',18,58,'SPLEEN','ROOT'],['SCU-26',32,54,'SPLEEN','ROOT'],['SCU-27',28,38,'SPLEEN','ROOT'],['SCU-28',26,44,'EGO','SPLEEN'],
  ['SCU-29',3,60,'SACRAL','ROOT'],['SCU-30',9,52,'SACRAL','ROOT'],['SCU-31',42,53,'SACRAL','ROOT'],
  ['SCU-32',59,6,'SACRAL','SOLAR_PLEXUS'],['SCU-33',19,49,'ROOT','SOLAR_PLEXUS'],['SCU-34',39,55,'ROOT','SOLAR_PLEXUS'],
  ['SCU-35',41,30,'ROOT','SOLAR_PLEXUS'],['SCU-36',40,37,'EGO','SOLAR_PLEXUS']
].map(([scuCode,gateA,gateB,centerA,centerB])=>Object.freeze({scuCode,gateA,gateB,centerA,centerB})));
function refsByGate(activations) {
  const map = new Map();
  for (const a of activations || []) {
    if (a.status === 'UNKNOWN' || !Number.isInteger(a.gate)) continue;
    const list = map.get(a.gate) || [];
    list.push(a.activationId || `${a.layer}:${a.bodyCode}`);
    map.set(a.gate, list);
  }
  return map;
}
export function resolveActivatedChannels(activations) {
  const byGate = refsByGate(activations);
  const activeGateSet = new Set(byGate.keys());
  const activatedChannels=[];
  for (const e of SCU_ENDPOINTS) {
    if (activeGateSet.has(e.gateA) && activeGateSet.has(e.gateB)) {
      const aRefs=Object.freeze([...(byGate.get(e.gateA)||[])]), bRefs=Object.freeze([...(byGate.get(e.gateB)||[])]);
      const layers=new Set();
      for(const a of activations||[]) if((a.gate===e.gateA||a.gate===e.gateB)&&a.status!=='UNKNOWN') layers.add(a.layer);
      activatedChannels.push(Object.freeze({...e,gates:Object.freeze([e.gateA,e.gateB]),centers:Object.freeze([e.centerA,e.centerB]),gateAActivationRefs:aRefs,gateBActivationRefs:bRefs,layerComposition:Object.freeze([...layers].sort())}));
    }
  }
  const completedGates=new Set(activatedChannels.flatMap(c=>[c.gateA,c.gateB]));
  const hangingGates=Object.freeze([...activeGateSet].filter(g=>!completedGates.has(g)).sort((a,b)=>a-b));
  return Object.freeze({activeGateSet:Object.freeze([...activeGateSet].sort((a,b)=>a-b)),activatedChannels:Object.freeze(activatedChannels),hangingGates});
}
