import {SMR_R2_DEDUP_RULES} from './smr-r2-rules.js';
const list=value=>Array.isArray(value)?value:[];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const norm=value=>String(value??'').toUpperCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=value=>new Set(norm(value).split(/\s+/).filter(Boolean));
function jaccard(A,B){if(!A.size&&!B.size)return 1;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/(A.size+B.size-hit||1)}
export function deduplicateNarrativeBlocks({blocks}={}){
  const accepted=[];const decisions=[];
  for(const block of list(blocks)){
    const text=block.text??block.structuralMeaning??'';const key=norm(text);const t=tokens(text);
    const prior=accepted.find(item=>item.key===key||jaccard(item.tokens,t)>=SMR_R2_DEDUP_RULES.narrativeTokenJaccard);
    if(!prior){accepted.push({block,key,tokens:t});decisions.push(freeze({...block,dedupDecision:'PRIMARY_EXPLANATION',primaryNarrativeRef:block.narrativeRef||block.claimRef||block.themeRef||null}));continue}
    const addsContext=Boolean(block.contextKey&&block.contextKey!==prior.block.contextKey)||Boolean(block.newInformationRefs?.length);
    decisions.push(freeze({...block,dedupDecision:addsContext?'CONTEXT_DERIVATIVE':'SUPPRESSED_DUPLICATE',primaryNarrativeRef:prior.block.narrativeRef||prior.block.claimRef||prior.block.themeRef||null}));
  }
  return freeze({schemaVersion:'PHI-OS-SMR-R2-NARRATIVE-DEDUP-v1.0.0',blocks:decisions,boundary:{fullExplanationMax:1,contextDerivativeRequiresNewInformation:true,deterministic:true}});
}
