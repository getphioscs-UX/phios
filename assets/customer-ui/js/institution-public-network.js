import {mountMainNetwork} from './institution-main-network-r2.js';
const host=document.querySelector('[data-institution-public-network]');
export function allowedPublicNetwork(value){
 if(!value||value.privateReview!==false||value.publicationStatus!=='PUBLIC_SAFE_METADATA_ONLY')return false;
 for(const key of ['nodes','edges','sources','articles'])if(!Array.isArray(value[key]))return false;
 if(value.privateReviewRoot||value.accessBoundary||value.figureIndex||value.sourceReadback)return false;
 const approved=row=>row.publication?.status==='PUBLIC_APPROVED'&&typeof row.publication.authorityRef==='string'&&row.publication.authorityRef.length>0;
 if(!value.nodes.every(approved)||!value.edges.every(approved)||!value.articles.every(approved))return false;
 if(!value.sources.every(approved))return false;
 // Reuse the existing published example only. A private research row cannot
 // acquire publication authority merely by carrying an approval-shaped label.
 const authority='EXISTING_PUBLISHED_EDITORIAL:subjects/institution/index.html@edc87ff53de71b952efe61dd86e5f752e7414f06';
 if([...value.nodes,...value.edges,...value.sources,...value.articles].some(row=>row.publication.authorityRef!==authority))return false;
 if(value.nodes.some(n=>!['ASEAN','ASEAN_DECLARATION_1967','ADAM_MALIK_1967'].includes(n.id)))return false;
 if(new Set(value.nodes.map(n=>n.id)).size!==value.nodes.length||new Set(value.edges.map(e=>e.edgeId)).size!==value.edges.length)return false;
 const nodes=new Set(value.nodes.map(n=>n.id));
 if(value.edges.some(e=>!['PUBLISHED-CASE-ESTABLISHES','PUBLISHED-CASE-SIGNATURE'].includes(e.edgeId)||!e.evidence?.length||e.evidence.some(r=>r.sourceId!=='UNTS-22341')))return false;
 if(value.edges.some(e=>!nodes.has(e.subjectId)||!nodes.has(e.objectId)||e.eventDate!=='1967-08-08'||(e.edgeId==='PUBLISHED-CASE-ESTABLISHES'?(e.subjectId!=='ASEAN_DECLARATION_1967'||e.objectId!=='ASEAN'||e.predicate!=='ESTABLISHES'):(e.subjectId!=='ADAM_MALIK_1967'||e.objectId!=='ASEAN_DECLARATION_1967'||e.predicate!=='SIGNS_IN_OFFICIAL_ROLE'))))return false;
 if(value.sources.some(s=>s.sourceId!=='UNTS-22341'||s.url!=='https://treaties.un.org/doc/Publication/UNTS/Volume%201331/volume-1331-I-22341-English.pdf'))return false;
 if(value.articles.some(a=>a.readingEndpoint||a.id!=='book4-article-018'||a.href!=='/articles/book4-article-018'))return false;
 return true;
}
if(host){
 const canvas=host.querySelector('[data-institution-network-canvas]'),status=host.querySelector('[data-institution-network-status]');
 try{const response=await fetch('/data/institution/public-network.json',{credentials:'omit'});if(!response.ok)throw Error('PUBLIC_NETWORK_UNAVAILABLE');const data=await response.json();if(!allowedPublicNetwork(data))throw Error('PUBLIC_NETWORK_NOT_ADMITTED');if(data.nodes.length){canvas.hidden=false;status.hidden=true;let pending=false;const render=()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;canvas.replaceChildren();mountMainNetwork(canvas,data);});};window.addEventListener('popstate',render);window.addEventListener('phios:localechange',render);render();}else{canvas.hidden=true;}}
 catch{canvas.hidden=true;status.hidden=false;}
}
