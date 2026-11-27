import {mountMainNetwork} from './institution-main-network-r2.js';
const host=document.querySelector('[data-institution-public-network]');
export function allowedPublicNetwork(value){
 if(!value||value.privateReview!==false||value.publicationStatus!=='PUBLIC_SAFE_METADATA_ONLY')return false;
 for(const key of ['nodes','edges','sources','articles'])if(!Array.isArray(value[key]))return false;
 if(value.privateReviewRoot||value.accessBoundary||value.figureIndex||value.sourceReadback)return false;
 const approved=row=>row.publication?.status==='PUBLIC_APPROVED'&&typeof row.publication.authorityRef==='string'&&row.publication.authorityRef.length>0;
 if(!value.nodes.every(approved)||!value.edges.every(approved)||!value.articles.every(approved))return false;
 if(value.articles.some(a=>a.readingEndpoint?.includes('__institution_review')))return false;
 return true;
}
if(host){
 const canvas=host.querySelector('[data-institution-network-canvas]'),status=host.querySelector('[data-institution-network-status]');
 try{const response=await fetch('/data/institution/public-network.json',{credentials:'omit'});if(!response.ok)throw Error('PUBLIC_NETWORK_UNAVAILABLE');const data=await response.json();if(!allowedPublicNetwork(data))throw Error('PUBLIC_NETWORK_NOT_ADMITTED');if(data.nodes.length){canvas.hidden=false;status.hidden=true;mountMainNetwork(canvas,data);}else{canvas.hidden=true;}}
 catch{canvas.hidden=true;status.hidden=false;}
}
