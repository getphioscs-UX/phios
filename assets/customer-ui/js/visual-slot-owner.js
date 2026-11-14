// DOM slot custody only. Asset identity and approval stay with the existing resolvers.
export function claimExistingHeroSlot(host,asset){
 const scope=host.closest('.vr2-hero-surface,.cx-hero,.cx-p1-hero')||host;
 const filename=decodeURIComponent(new URL(asset.publicUrl,location.href).pathname.split('/').pop());
 const matches=[...scope.querySelectorAll('[data-vr2-role="HERO"] img')].filter(i=>i.dataset.approvedVisual===filename||i.dataset.cxAsset===asset.assetId);
 if(!matches.length)return null;
 const image=matches[0],figure=image.closest('figure');if(!figure)return null;
 // Rehome the original semantic composition instead of creating a second consumer.
 if(!host.contains(figure))host.prepend(figure);
 host.dataset.visualSlot='MAIN_HERO';host.dataset.visualOwner='PAGE_COMPOSITION';
 figure.dataset.visualSlot='MAIN_HERO';figure.dataset.visualOwner='PAGE_COMPOSITION';
 figure.classList.remove('vr2-story');figure.classList.add('r5-context-guide');
 for(const legacy of host.querySelectorAll('[data-r5-guide]'))if(legacy!==figure&&!legacy.contains(figure)){legacy.hidden=true;legacy.dataset.visualSupersededBy='PAGE_COMPOSITION';}
 for(const duplicate of matches.slice(1)){const wrapper=duplicate.closest('figure');if(wrapper&&wrapper!==figure){wrapper.hidden=true;wrapper.dataset.visualSupersededBy='PAGE_COMPOSITION';}}
 return figure;
}

// Closed source viewers and quarantined legacy figures are not the active main slot.
export function declaredPageHero(main){return [...(main?.querySelectorAll('[data-vr2-role="HERO"]')||[])].find(n=>!n.closest('[hidden],details:not([open])'))||null;}
