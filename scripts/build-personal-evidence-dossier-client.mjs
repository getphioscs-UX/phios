import {build} from 'esbuild';
await build({entryPoints:['assets/customer-ui/js/personal-products/personal-evidence-dossier-entry.js'],bundle:true,format:'esm',platform:'browser',outfile:'assets/customer-ui/js/personal-products/personal-evidence-dossier.bundle.js',logLevel:'silent'});
