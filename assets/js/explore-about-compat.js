// Exact legacy-fragment bridge into the accepted Founder R3 narrative; no new authority.
const targets=new Map([['why','founder-origin'],['how','founder-connected-reality'],['start','founder-next-step'],['faq','founder-trust']]);
const id=location.hash.slice(1),target=targets.get(id);location.replace('/about/founder/'+(target?'#'+target:''));
