import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
const server=createPublicationReviewServer();
server.listen(8788,'127.0.0.1',()=>console.log('Book V review: http://127.0.0.1:8788/tools/review/BOOK-V-PKA-R1-HUMAN-REVIEW.html — local assets and existing Ask handlers; no live model configured.'));
