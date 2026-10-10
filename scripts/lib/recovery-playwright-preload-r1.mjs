// Read-only fallback to the desktop-bundled runtime; never install dependencies.
import fs from 'node:fs';import{registerHooks}from'node:module';import{pathToFileURL}from'node:url';
const runtime='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(specifier==='playwright'&&error.code==='ERR_MODULE_NOT_FOUND'&&fs.existsSync(runtime))return{url:pathToFileURL(runtime).href,shortCircuit:true};throw error;}}});
