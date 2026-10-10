import {registerHooks} from 'node:module';
// Pages bundles ordinary JSON imports. Supply Node's required attribute only
// in the local regression process, leaving deployable source unchanged.
registerHooks({
 resolve(specifier,context,nextResolve){
  if(specifier.endsWith('.json') && context.parentURL?.includes('/functions/')){
   return nextResolve(specifier,{...context,importAttributes:{...context.importAttributes,type:'json'}});
  }
  return nextResolve(specifier,context);
 },
 load(url,context,nextLoad){
  if(url.startsWith('file:') && url.endsWith('.json'))return nextLoad(url,{...context,importAttributes:{...context.importAttributes,type:'json'}});
  return nextLoad(url,context);
 }
});
