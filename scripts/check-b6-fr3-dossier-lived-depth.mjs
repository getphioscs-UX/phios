import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const depth=json('content/civilization-atlas/reconfiguration/dossier-knowledge-depth-v1.json');
const knowledge=json('content/civilization-atlas/reconfiguration/knowledge-state-contract-v1.json');
const renderer=read('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
const loader=read('assets/js/pages/civilization-atlas/atlas-data.js');

assert.equal(depth.dossiers.length,12,'FR3 requires knowledge-depth records for all 12 dossiers.');
assert.ok(knowledge.states.some(x=>x.id==='STRUCTURAL_KNOWLEDGE'),'STRUCTURAL_KNOWLEDGE state missing.');
assert.ok(knowledge.states.some(x=>x.id==='OBSERVED_SIGNAL'),'OBSERVED_SIGNAL state missing.');
assert.ok(loader.includes('dossier-knowledge-depth-v1.json'),'Dossier depth overlay is not wired into the atlas loader.');
assert.ok(loader.includes('knowledgeDepth:overlay.get(d.id)||null'),'Dossier depth overlay merge missing.');

for(const d of depth.dossiers){
  assert.ok(d.structuralProfile?.zh&&d.structuralProfile?.en,d.id+' structural profile must be bilingual.');
  assert.ok((d.structuralPressures||[]).length>=2,d.id+' requires structural pressure depth.');
  assert.ok((d.reconfigurationAxes||[]).length>=2,d.id+' requires reconfiguration axes.');
  assert.ok((d.signals||[]).length>=2,d.id+' requires observation signals.');
  assert.ok((d.unknowns||[]).length>=1,d.id+' requires a scoped unknown boundary.');
  for(const id of ['livingEnvironment','employmentOpportunity','incomeCostBalance','housingPressure','personalFutureCapacity']){
    const x=d.lived?.[id];
    assert.ok(x?.zh&&x?.en,d.id+' '+id+' requires bilingual lived-reality transmission copy.');
    assert.ok((x.observeZh||[]).length>=4&&x.observeZh.length===(x.observeEn||[]).length,d.id+' '+id+' observation targets must be bilingual.');
  }
}
const sea=depth.dossiers.find(x=>x.id==='DOSSIER-SEA');
assert.ok(sea.structuralPressures.length>=3&&sea.reconfigurationAxes.length>=3&&sea.signals.length>=3,'Representative Southeast Asia dossier must carry deeper FR3 content.');

for(const forbidden of ['等待当前资料','Awaiting current evidence','当前压力需要经过时效性资料验收后才显示','Current pressures appear only after time-sensitive evidence is admitted.','目前不从历史案例推断当代方向。','Contemporary direction is not inferred from historical cases.','尚无已验收的当前讯号。','No current signals have been admitted yet.']){
  assert.ok(!renderer.includes(forbidden),'FR3 renderer still contains empty-state primary copy: '+forbidden);
}
assert.ok(renderer.includes('结构底盘')&&renderer.includes('Structural runtime'),'FR3-A dossier semantic model missing.');
assert.ok(renderer.includes('结构性压力')&&renderer.includes('Structural pressures'),'FR3-C pressure layer missing.');
assert.ok(renderer.includes('正在重组的结构轴')&&renderer.includes('Observed reconfiguration axes'),'FR3-D reconfiguration layer missing.');
assert.ok(renderer.includes('观察讯号')&&renderer.includes('Observation signals'),'FR3-E signal layer missing.');
assert.ok(renderer.includes('Unknown boundary'),'FR3-F unknown containment missing.');
assert.ok(renderer.includes('Current-value layer not yet admitted'),'FR3-I current-value optional overlay boundary missing.');
assert.ok(renderer.includes('The registered transmission mechanisms and observation dimensions remain visible below'),'FR3-G/H lived transmission must survive missing current values.');

console.log('B6-FR3 PASS: dossier semantic depth, structural derivation, pressures, reconfiguration axes, signals, unknown containment, lived-reality transmission, optional current overlay, bilingual projection, and representative Southeast Asia review target are wired.');
