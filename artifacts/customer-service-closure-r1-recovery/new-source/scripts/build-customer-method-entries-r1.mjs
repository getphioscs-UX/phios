// Five entry documents, one existing Personal Reality form/controller/engine.
// No duplicated scorer, report owner, entitlement, or generated customer result.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const registryPath='content/customer-experience-rebuild/registries/cx-r12r4-method-availability-registry-v1.json';
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
const template=fs.readFileSync('perspectives/personal/index.html','utf8');
const entries=registry.methods.filter(m=>m.standaloneEntry).map(m=>[m.methodId,m.standaloneEntry.formValue,m.standaloneEntry.route.split('/').filter(Boolean).at(-1)]);
const records=[];const publicLinks=[];
for(const [id,value,slug]of entries){
 const method=registry.methods.find(x=>x.methodId===id);if(!method)throw Error('METHOD_OWNER_MISSING:'+id);
 const route='/perspectives/'+slug+'/';publicLinks.push({methodId:id,route,label:method.label});
 let html=template.replace('href="/perspectives/personal/"','href="'+route+'"').replace(/<title>[^<]*<\/title>/,'<title>'+method.label.en+' — PHI OS</title>');
 html=html.replace(/<form(?=[^>]*data-cx-personal-form)/,'<form method="post"');
 html=html.replace('data-cx-surface="PERSONAL_REALITY"','data-cx-surface="PERSONAL_REALITY" data-customer-method="'+value+'"');
 // Keep the mature input, precision controls, charts, sections, report gates and back links.
 html=html.replace('<main',`<nav aria-label="Method entry"><a href="/perspectives/personal/" data-cx-en="All personal methods" data-cx-zh="返回个人方法">All personal methods</a> · <a href="/account/" data-cx-en="My reports" data-cx-zh="我的报告">My reports</a></nav><main`);
 const heading=/<h1([^>]*)>[\s\S]*?<\/h1>/;
 html=html.replace(heading,`<h1 class="cx-title" data-cx-en="${method.label.en}" data-cx-zh="${method.label['zh-Hans']}">${method.label.en}</h1>`);
 fs.mkdirSync('perspectives/'+slug,{recursive:true});const file='perspectives/'+slug+'/index.html';fs.writeFileSync(file,html);
 records.push({methodId:id,route,formValue:value,owner:'assets/customer-ui/js/surfaces/personal-reality.js',api:'/api/customer-personal-reality',methodAvailabilityPreserved:method.experienceState,path:file,sha256:createHash('sha256').update(html).digest('hex'),templateSHA256:createHash('sha256').update(template).digest('hex')});
}
fs.writeFileSync('assets/customer-ui/js/surfaces/personal-method-entries.generated.js','// Generated from the existing availability registry; entry presence grants no execution.\nexport const PERSONAL_METHOD_ENTRIES='+JSON.stringify(publicLinks,null,2)+';\n');
fs.mkdirSync('content/production-closure/live-customer-commercial-convergence/customer-service-closure-r1',{recursive:true});
fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/customer-service-closure-r1/METHOD-ENTRY-BUILD.json',JSON.stringify({changeClass:'EXPLICIT_CUSTOMER_ENTRY_SUCCESSOR_NO_EXECUTION_AUTHORITY_CHANGE',registryPath,entries:records},null,2));
console.log('Generated five canonical entry documents over one native form/controller; HD publication availability unchanged.');
