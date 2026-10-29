// Test-only read-through of missing immutable JSON dependencies; no full checkout/install.
import fs from 'node:fs';import path from 'node:path';import {syncBuiltinESMExports,registerHooks} from 'node:module';import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),base='C:/phios',reads=new Set();
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(!context.parentURL||!specifier.endsWith('.json'))throw error;const url=new URL(specifier,context.parentURL);if(url.protocol!=='file:')throw error;const rel=path.relative(root,fileURLToPath(url)).replaceAll('\\','/');if(! /^(content|docs)\//.test(rel)||rel.includes('../'))throw error;const file=path.join(base,rel);if(!fs.existsSync(file))throw error;reads.add(rel);return next(pathToFileURL(file).href,context);}}});
process.on('exit',()=>{const output=path.join(root,'tools/review/world-market-integration-r1');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,path.basename(process.argv[1]||'test')+'-sparse-reads.json'),JSON.stringify({testOnly:true,primarySourceReadOnly:true,jsonDependencies:[...reads]},null,2));});

// Read-only support for existing freeze checks using fs rather than ESM imports.
const originalRead=fs.readFileSync,originalExists=fs.existsSync,originalStat=fs.statSync;
function sourcePath(p){if(typeof p!=='string'&&!(p instanceof URL))return p;const absolute=p instanceof URL?fileURLToPath(p):path.resolve(p),rel=path.relative(root,absolute).replaceAll('\\','/');if(rel==='wrangler.jsonc'&&process.env.WORLD_BASELINE_CONFIG)return path.resolve(process.env.WORLD_BASELINE_CONFIG);if(!originalExists(absolute)&&(/^(content|tools\/review|books|knowledge|docs|db)\//.test(rel)||rel==='reality-entry.html')){const fallback=path.join(base,rel);if(originalExists(fallback)){reads.add(rel);return fallback;}}return p;}
fs.readFileSync=(p,...args)=>originalRead(sourcePath(p),...args);fs.existsSync=p=>originalExists(sourcePath(p));fs.statSync=(p,...args)=>originalStat(sourcePath(p),...args);syncBuiltinESMExports();

const originalWrite=fs.writeFileSync;
fs.writeFileSync=(p,...args)=>{if(typeof p==='string'){const rel=path.relative(root,path.resolve(p)).replaceAll('\\','/');if(rel.startsWith('artifacts/')){p=path.join(root,'tools/review/world-market-integration-r1/wmda-r2/legacy-output',rel);fs.mkdirSync(path.dirname(p),{recursive:true});}}return originalWrite(p,...args);};syncBuiltinESMExports();

const originalPromiseRead=fs.promises.readFile.bind(fs.promises),originalAccess=fs.promises.access.bind(fs.promises);
fs.promises.readFile=(p,...args)=>originalPromiseRead(sourcePath(p),...args);fs.promises.access=(p,...args)=>originalAccess(sourcePath(p),...args);

const originalReaddir=fs.promises.readdir.bind(fs.promises);fs.promises.readdir=(p,...args)=>originalReaddir(sourcePath(p),...args);
