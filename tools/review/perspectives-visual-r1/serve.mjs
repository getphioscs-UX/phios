import '../../../scripts/lib/report-zero-cost-preload.mjs';
import {createPublicationReviewServer} from './review-server.mjs';
const server=createPublicationReviewServer(),handler=server.listeners('request')[0];server.removeAllListeners('request');server.on('request',(req,res)=>{if(req.method!=='GET'){res.writeHead(405).end('READ_ONLY_REVIEW');return;}handler(req,res);});server.listen(4318,'127.0.0.1',()=>console.log('Read-only local review: http://127.0.0.1:4318/tools/review/PERSPECTIVES-VISUAL-R1-HUMAN-REVIEW.html'));
