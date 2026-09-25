import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
const port=Number(process.env.PORT||4177);
const host=process.env.HOST||'127.0.0.1';
const server=createPublicationReviewServer();
server.listen(port,host,()=>console.log('B6-WEB-F successor human review: http://'+host+':'+port+'/tools/review/B6-WEB-F-SUCCESSOR-HUMAN-REVIEW.html'));
