import fs from 'node:fs';import {startCardCustomer,folder} from './lib/phi-card-customer-local.mjs';
fs.mkdirSync('.tmp/phi-card-customer-experience-r1',{recursive:true});const s=await startCardCustomer({port:48732,file:'.tmp/phi-card-customer-experience-r1/human-review.sqlite'});console.log(s.url+'/ · Local synthetic session only. Provider 0. Production closed.');
