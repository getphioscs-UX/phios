import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
// Optional local bundled runtime: no package download or repository dependency mutation.
registerHooks({resolve(specifier,context,next){
 if(specifier==='playwright'&&process.env.W11R6_WORKSPACE_NODE_MODULES)return next(pathToFileURL(path.join(process.env.W11R6_WORKSPACE_NODE_MODULES,'playwright/index.mjs')).href,context);
 return next(specifier,context);
}});
