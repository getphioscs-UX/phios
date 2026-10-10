import fs from 'node:fs';
import crypto from 'node:crypto';
import {VISUAL_REPORT_PRODUCTS,VISUAL_REPORT_BUNDLES} from '../functions/canonical-presentation-runtime/visual-report-registry.js';
const registryPath='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json',registry=JSON.parse(fs.readFileSync(registryPath));
const products=[...VISUAL_REPORT_PRODUCTS,...VISUAL_REPORT_BUNDLES,{productId:'FULL_SYSTEM',assetId:'COM-REPORT-FULL-SYSTEM',accent:'#9c8247'}];
const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
for(const [i,product] of products.entries()){
 if(product.productId==='ECR_FULL_REPORT')continue; // Preserve the registered ECR cover.
 const id=product.assetId,color=product.accent||'#9c8247',title=product.productId.replaceAll('_',' '),name=`PHIOS-${id}-v1.svg`,path=`assets/reports/${name}`;
 const count=product.productId.startsWith('BUNDLE')?3:4+(i%5);
 const geometry=Array.from({length:count},(_,n)=>{const angle=n*2*Math.PI/count,x=120+48*Math.cos(angle),y=113+48*Math.sin(angle);return `<path d="M120 113L${x.toFixed(2)} ${y.toFixed(2)}" stroke="${color}" opacity=".55"/><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="8" fill="#fcfaf5" stroke="${color}"/>`;}).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" role="img" aria-labelledby="title"><title id="title">${esc(title)} · PHI OS report cover</title><desc>Decorative product cover; not a customer chart or a semantic reading.</desc><rect x="15" y="9" width="210" height="302" rx="12" fill="#fcfaf5" stroke="${color}" stroke-width="2"/><path d="M37 34h166M37 275h166" stroke="#bca879"/><circle cx="120" cy="113" r="58" fill="none" stroke="#bca879"/>${geometry}<circle cx="120" cy="113" r="22" fill="${color}"/><text x="120" y="123" fill="#fcfaf5" text-anchor="middle" font-family="Georgia,serif" font-size="30">Φ</text><text x="120" y="211" fill="${color}" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" letter-spacing="1">${esc(product.productId.replace('_FULL_REPORT','').replaceAll('_',' '))}</text><text x="120" y="239" fill="#293638" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" letter-spacing="1">PHI OS · REPORTS</text></svg>\n`;
 fs.writeFileSync(path,svg);
 const entry={assetId:id,type:'REPORT',semanticName:title,objectKey:null,format:'SVG',sourceRegistry:'docs/visual-report-r1/presentation-registry.json',sourceAssetCode:id,remoteVerified:false,publicUrl:`/${path}`,available:true,verificationState:'REPO_BUNDLED_REVIEW_CANDIDATE',sha256:crypto.createHash('sha256').update(svg).digest('hex'),contentType:'image/svg+xml',delivery:{loading:'lazy',decoding:'async',fetchPriority:'auto'}};
 const index=registry.entries.findIndex(x=>x.assetId===id);if(index>=0)registry.entries[index]=entry;else registry.entries.push(entry);
}
registry.summary.count=registry.entries.length;
registry.summary.uniqueUpstreamProjectionCount=new Set(registry.entries.map(x=>x.sourceRegistry+"#"+x.sourceAssetCode)).size;
registry.summary.byType=Object.fromEntries([...new Set(registry.entries.map(x=>x.type))].sort().map(type=>[type,registry.entries.filter(x=>x.type===type).length]));
registry.summary.available=registry.entries.filter(x=>x.available).length;registry.summary.unavailable=registry.entries.length-registry.summary.available;
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');console.log('Registered 12 report-family covers, including the preserved ECR asset; no prices embedded.');
