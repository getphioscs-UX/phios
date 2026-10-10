const norm=v=>String(v||'').trim().toLowerCase();
export function resolveHealthConcept(question, registry={}){const q=norm(question);let best=null;for(const c of registry.concepts||[]){for(const t of [...(c.enTerms||[]),...(c.zhHansTerms||[])]){const n=norm(t).replace(/\s*\/\s*/g,' ');for(const p of n.split(/\s+\/\s+|\s+or\s+/)){if(p&&q.includes(p)){if(!best||p.length>best.match.length)best={concept:c,match:p};}}}}return best?.concept||null;}
export function resolveKnowledgePacket(conceptId, corpus={}){return (corpus.packets||[]).find(x=>x.conceptId===conceptId)||null;}
