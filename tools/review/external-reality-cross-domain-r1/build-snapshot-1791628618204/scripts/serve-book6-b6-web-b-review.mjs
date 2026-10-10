import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
const port=Number(process.env.PORT||4176);
const host=process.env.HOST||'127.0.0.1';
const server=createPublicationReviewServer();
server.listen(port,host,()=>console.log('Book VI B6-WEB-B human review: http://'+host+':'+port+'/tools/review/BOOK-VI-B6-WEB-B-HUMAN-REVIEW.html'));
