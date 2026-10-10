import { materializeMedia, parseArgs } from './lib/car-production/car-production-v1.mjs';
const { positional, options }=parseArgs(process.argv.slice(2)); const candidateCode=positional[0];
if(!candidateCode||!options.alt||!options.rights||!options.accessibility) throw new Error('USAGE: npm run car:materialize-media -- <CANDIDATE> --alt <text> --rights owned|licensed|cleared --accessibility passed [--file <same candidate file>] [--width N --height N]');
const media=await materializeMedia({candidateCode,altText:options.alt,rightsStatus:options.rights,accessibilityStatus:options.accessibility,file:options.file||null,width:options.width||null,height:options.height||null});
console.log(JSON.stringify({status:'MEDIA_MATERIALIZED',mediaCode:media.mediaCode,publicSrc:media.publicSrc,width:media.width,height:media.height,rightsStatus:media.rightsStatus,accessibilityStatus:media.accessibilityStatus,publicationCreated:false},null,2));
