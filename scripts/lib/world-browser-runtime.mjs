import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
export function loadWorldPlaywright(){
 if(process.env.WORLD_PLAYWRIGHT_MODULE)return require(process.env.WORLD_PLAYWRIGHT_MODULE);
 try{return require('playwright');}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
 return require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
export function worldBrowserLaunchOptions(){
 const executable=process.env.WORLD_BROWSER_EXECUTABLE|| (process.platform==='win32'?path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe'):null);
 return {headless:true,...(executable&&fs.existsSync(executable)?{executablePath:executable}:{})};
}
