import {createPhiCardReviewServer} from './lib/phi-card-review-server.mjs';
const server=createPhiCardReviewServer();server.listen(48731,'127.0.0.1',()=>console.log('PHI Card Reading local review: http://127.0.0.1:48731/ · GET-only · stop with Ctrl+C'));
