/** R2-W14 deterministic intent routing. Intent changes priority only; never astrology meaning. */
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const fail=code=>{throw Object.assign(new Error(code),{code})};
const norm=s=>String(s||'').trim().toLowerCase();
export function resolveAstCustomerIntent({rawIntent='',explicitProfileId=null,registry}={}){
 if(registry?.schemaVersion!=='PHI-OS-AST-INTENT-ROUTING-REGISTRY-v1.0.0')fail('AST_INTENT_REGISTRY_REQUIRED');
 const profiles=registry.profiles||{},explicit=String(explicitProfileId||'').toUpperCase();
 if(explicit&&profiles[explicit])return freeze({schemaVersion:'PHI-OS-AST-INTENT-RESOLUTION-v1.0.0',intentId:explicit,resolution:'EXPLICIT_PROFILE',rawIntent:String(rawIntent||''),matchedCues:[],meaningChanged:false});
 const text=norm(rawIntent);if(!text)return freeze({schemaVersion:'PHI-OS-AST-INTENT-RESOLUTION-v1.0.0',intentId:'OPEN',resolution:'EMPTY_FALLBACK',rawIntent:'',matchedCues:[],meaningChanged:false});
 const scored=Object.entries(profiles).filter(([id])=>id!=='OPEN').map(([id,p])=>{const matched=(p.cues||[]).filter(c=>text.includes(norm(c)));return {id,matched,score:matched.length,priority:Number(p.priority||0)}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.priority-a.priority||a.id.localeCompare(b.id));
 const hit=scored[0];return freeze({schemaVersion:'PHI-OS-AST-INTENT-RESOLUTION-v1.0.0',intentId:hit?.id||'OPEN',resolution:hit?'LEXICAL_CUE':'NO_MATCH_FALLBACK',rawIntent:String(rawIntent||''),matchedCues:hit?.matched||[],meaningChanged:false});
}
export default Object.freeze({resolveAstCustomerIntent});
