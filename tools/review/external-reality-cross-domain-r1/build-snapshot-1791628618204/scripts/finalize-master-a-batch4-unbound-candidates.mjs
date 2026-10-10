import fs from 'node:fs';
const d='content/knowledge/structured/successors/master-a-v2-batch4';
const registry=JSON.parse(fs.readFileSync(d+'/navigation-object-registry-v1.json','utf8'));
for(const o of registry.objects){if(o.sourceRefs!==null)o.unresolvedSourceRefs=o.sourceRefs;o.sourceRefs=null;}
fs.writeFileSync(d+'/navigation-object-registry-v1.json',JSON.stringify(registry,null,2)+'\n');
const schema=JSON.parse(fs.readFileSync(d+'/navigation-contracts-v1.schema.json','utf8'));
for(const [key,value]of Object.entries(registry.objects[0])){
  if(!schema.$defs.navigationObject.properties[key]?.const&&!['objectType','sourceRefs','unresolvedSourceRefs'].includes(key)){
    if(typeof value==='string')schema.$defs.navigationObject.properties[key]={type:'string',minLength:1};
    else if(value===null)schema.$defs.navigationObject.properties[key]={const:null};
    else if(Array.isArray(value))schema.$defs.navigationObject.properties[key]={type:'array',items:{type:'string'}};
  }
}
schema.$defs.navigationObject.properties.canonicalNodeRefs={type:'array',maxItems:0};
schema.$defs.navigationObject.properties.nodeCode={const:null};
for(const key of ['status','authorityOwner','runtimeHandoffType','universalCanonicalObjectStatus','dataClass'])schema.$defs.navigationObject.properties[key]={const:registry.objects[0][key]};
schema.$defs.navigationObject.properties.provenance={type:'object',required:['kind','governingWork','canonicalBookMapping','canonicalPublicationProse','canonicalNodeBinding','rawManuscriptRead'],properties:{kind:{const:'USER_SCOPED_EDITORIAL_STRUCTURED_CANDIDATE'},governingWork:{type:'object'},canonicalBookMapping:{type:'object'},canonicalPublicationProse:{const:false},canonicalNodeBinding:{const:null},rawManuscriptRead:{const:false}},additionalProperties:false};
schema.$defs.navigationObject.properties.sourceRefs={const:null};
schema.$defs.navigationObject.properties.unresolvedSourceRefs={type:'object'};
if(!schema.$defs.navigationObject.required.includes('unresolvedSourceRefs'))schema.$defs.navigationObject.required.push('unresolvedSourceRefs');
schema.canonicalAdmissionBoundary='This validates a withheld unbound candidate envelope only. It does not relax the shared canonical sourceRefs schema or claim universal canonical admission.';
fs.writeFileSync(d+'/navigation-contracts-v1.schema.json',JSON.stringify(schema,null,2)+'\n');
