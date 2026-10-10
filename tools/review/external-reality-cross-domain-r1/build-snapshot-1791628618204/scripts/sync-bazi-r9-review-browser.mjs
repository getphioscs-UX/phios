import {build} from 'esbuild';
await build({
 entryPoints:['assets/customer-ui/js/personal-products/bazi-r9-review-runtime.js'],
 outfile:'assets/customer-ui/js/personal-products/bazi-r9-review-runtime.bundle.js',
 bundle:true,
 format:'esm',
 platform:'browser',
 minify:true
});
console.log('Built BaZi R9 browser runtime bundle.');
