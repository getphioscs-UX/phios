import {build} from 'esbuild';
await build({entryPoints:['tools/review/financial-document-s2-a1/test.mjs'],bundle:true,format:'esm',platform:'node',packages:'external',outfile:'.tmp/financial-document-s2-a1-runner.mjs'});
await import(new URL('../../../.tmp/financial-document-s2-a1-runner.mjs',import.meta.url));
