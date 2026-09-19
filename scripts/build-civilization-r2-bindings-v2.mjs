import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=read('content/civilization-atlas/maintenance/visual-activation-60247ff/r2-object-audit-v1.json');
const old=read('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v1.json');
const registry=read('content/civilization-atlas/visuals/civilization-visual-asset-registry-v2.json');
const ownerApprovalPath='content/civilization-atlas/visuals/civilization-visual-owner-acceptance-2026-09-19.json';
const ownerApproval=fs.existsSync(ownerApprovalPath)?read(ownerApprovalPath):null;
const english={
 INF:['Agriculture and irrigation','Granaries and storage','City walls and gates','Markets and fairs','Roads and relay stations','Ports and docks','Canals and waterworks','Temples, churches and mosques','Palaces and administrative centers','Libraries and archives','Schools and academies','Printing and writing systems','Workshops and crafts','Factories and steam industry','Railways and stations','Telegraphy and communication','Electricity and modern urban systems','Containers and logistics networks','Data centers and servers','Chips and AI computing infrastructure'],
 HF:['Hammurabi','Hatshepsut','Confucius','Ashoka','Alexander','Augustus','Justinian','Charlemagne','Genghis Khan','Ibn Khaldun','Zheng He','Gutenberg','James Watt','Gandhi','Deng Xiaoping','Alan Turing'],
 FLAG:['United States','China','India','Japan','South Korea','Singapore','Indonesia','Malaysia','Thailand','Vietnam','Philippines','Pakistan','Bangladesh','Iran','Türkiye','Russia','United Kingdom','France','Germany','Italy','Spain','Brazil','Mexico','Nigeria']
};
const observations={ 'VIS-CIV-WS-1250-ATMOSPHERE':{containsText:true,evidence:'Visual inspection of actual browser screenshot world-360.png; embedded labels/borders are illustration content, not historical authority.'} };
const assets=audit.rows.filter(r=>r.result==='VERIFIED_WEBP').map(r=>{
 const source=registry.assets.find(a=>a.assetId===r.assetId),prior=old.assets.find(a=>a.assetId===r.assetId);
 const ownerAccepted=ownerApproval?.decision==='OWNER_ACCEPTED'&&ownerApproval.assets.some(a=>a.assetId===r.assetId&&a.sha256===r.sha256);
 const accepted=prior?.sha256===r.sha256||ownerAccepted;
 const short=r.assetId.match(/^VIS-CIV-(INF|HF|FLAG)-(\d+)$/);
 const title={...r.subjectTitle};if(!title.en&&short)title.en=english[short[1]][Number(short[2])-1];
 if(r.family==='WORLD_RECONFIGURATION_SNAPSHOT'){const year=r.assetId.split('_').at(-1);title['zh-Hans']=`${year} 年世界重构`;title.en=`World reconfiguration · ${year}`;}
 return {assetId:r.assetId,family:r.family,subjectId:r.subjectId||r.assetId,subjectTitle:title,relatedBook:r.relatedBook?.includes('Book 6')?'BOOK-6':'BOOK-5',aspectRatio:source?.aspectRatio||'16:9',sourceRegistry:source?.sourceRegistry||'SUPPLEMENTAL_PRODUCTION_MAP',sourcePointer:source?.sourcePointer||r.assetId,bucketKey:r.bucketKey,publicUrl:r.publicUrl,sha256:r.sha256,bytes:r.bytes,status:'UPLOADED_VERIFIED',bindingState:'BOUND',deliveryVerified:true,ownerUploadConfirmed:true,reviewState:accepted?'ACCEPTED':'PENDING_HUMAN_REVIEW',reviewEvidence:ownerAccepted?ownerApprovalPath:accepted?prior.reviewEvidence:'User confirmed upload; HTTP GET and WebP signature verified. Visual/content acceptance remains pending.',containsText:observations[r.assetId]?.containsText??(accepted?(prior?.containsText??null):null),visualInspection:observations[r.assetId]?.evidence||'Not individually content-reviewed in this wave',embeddedTextAuthority:'NONE',displayTextAuthority:'HTML_REGISTRY_ONLY',historicalAuthority:false,canonicalAuthority:false,registryWriteAuthority:false,ocrWriteBackAllowed:false,fallback:'STRUCTURED_HTML_SVG'};
});
const doc={schemaVersion:'PHI-OS-CIVILIZATION-VISUAL-APPROVED-BINDINGS-v2',status:'VERIFIED_DELIVERY_HUMAN_REVIEW_PENDING',predecessor:'content/civilization-atlas/visuals/civilization-visual-approved-bindings-v1.json',sourceRegistry:'content/civilization-atlas/visuals/civilization-visual-asset-registry-v2.json',sourceAudit:'content/civilization-atlas/maintenance/visual-activation-60247ff/r2-object-audit-v1.json',pendingReviewPolicy:'LOCAL_REVIEW_ONLY_UNTIL_EXPLICIT_HUMAN_ACCEPTANCE',historicalRegistryChanged:false,actualBucketTotal:null,assets};
if(assets.every(a=>a.reviewState==='ACCEPTED')){doc.status='VERIFIED_DELIVERY_OWNER_ACCEPTED';doc.ownerAcceptance=ownerApprovalPath;}
fs.writeFileSync('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json',JSON.stringify(doc,null,2)+'\n');
console.log(`Verified delivery bindings ${assets.length}; accepted ${assets.filter(a=>a.reviewState==='ACCEPTED').length} (including explicit owner acceptance); pending ${assets.filter(a=>a.reviewState!=='ACCEPTED').length}.`);
