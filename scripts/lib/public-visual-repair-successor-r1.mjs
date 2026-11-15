import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// Exact presentation-only successor; all previous R6 and Health assertions remain active.
export function publicVisualRepairPredecessorBytes(bytes){
 const sha=b=>createHash('sha256').update(b).digest('hex');
 if(sha(bytes)!=="ee3fbe3896e9e5e4b461af858e752e8abe2e241ec3154a0346d25e866ea5b842")return bytes;
 const text=bytes.toString('utf8');
 const changes=[["img.addEventListener('load',()=>{if(img.naturalWidth>0){img.hidden=false;img.classList.remove('jm-asset-unavailable');img.dataset.jmAssetState='loaded';const figure=img.closest('.jm-method-figure');if(figure)figure.hidden=false;const holder=img.closest('.jm-editorial-hero,.jm-method-card,.jm-state');if(holder&&!holder.querySelector('img.jm-asset-unavailable'))holder.classList.remove('jm-text-only');}});","img.addEventListener('load',()=>{if(img.naturalWidth>0)img.dataset.jmAssetState='loaded';});"],["const heroImage=art(ids.hero,m.en+' — illustrative method scene',m.zh+'：方法意象图',{eager:true});heroImage.classList.add('jm-hero-img');hero.prepend(heroImage);","hero.prepend(art(ids.hero,m.en+' — illustrative method scene',m.zh+'：方法意象图',{eager:true}));"]];
 let restored=text;for(const [current,prior] of changes){assert.equal(restored.split(current).length,2,'Exactly one registered visual repair hunk required');restored=restored.replace(current,prior);}
 const result=Buffer.from(restored);assert.equal(sha(result),"90a573f40f4e0566bdaf26352aa688fd44e4069abc48810f2a4e39c6b1a17e11",'Visual successor must reconstruct exact prior customer runtime');return result;
}
