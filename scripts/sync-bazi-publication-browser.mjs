import {build} from 'esbuild';
// Pages does not serve functions/ as static modules. Compile the existing
// publication owner for the browser; never copy its contract into a new owner.
await build({entryPoints:['assets/customer-ui/js/personal-products/publication-report-pages.js'],outfile:'assets/customer-ui/js/personal-products/publication-report-pages.bundle.js',bundle:true,format:'esm',platform:'browser',minify:true});
