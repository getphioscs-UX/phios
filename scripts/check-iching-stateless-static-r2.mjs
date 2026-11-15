import {pathToFileURL} from 'node:url';
import './check-iching-stateless-current-r2.mjs';
import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import path from 'node:path';
import {validateCurrentIChingInputs} from './lib/iching-stateless-source-successor-r2.mjs';
validateCurrentIChingInputs();
const result=spawnSync(process.execPath,[...process.execArgv,'--import',pathToFileURL(path.resolve('scripts/lib/iching-stateless-legacy-static-preload-r2.mjs')).href,path.resolve('scripts/check-iching-full-production-static-v1.mjs')],{cwd:process.cwd(),env:process.env,stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;assert.equal(result.status,0,'ICHING_EXACT_LEGACY_STATIC_FAILED');
console.log('Original frozen static assertions PASS using exact archived authority in a separate process; current36 checked independently.');
