import {digest,VERSIONS} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
import {renderBaziDeepManuscript} from '../../assets/customer-ui/js/personal-products/bazi-deep-manuscript-pages.js';
export async function renderCustomerBaziHtml(ir){
 const {digest:hash,...body}=ir||{};
 if(ir?.method!=='BAZI'||await digest(body)!==hash||ir.lineage?.versions?.renderer!==VERSIONS.renderer||ir.publication?.pages?.length!==48||ir.technical?.diagrams?.length!==15||ir.customerPublishable!==true||ir.fixture||ir.reviewOnly)throw Error('BAZI_CUSTOMER_PUBLICATION_REQUIRED');
 const lang=ir.presentationMode==='EN'?'en':'zh-Hans',styles=['/assets/customer-ui/surfaces/bazi-deep-manuscript-r2.css','/assets/customer-ui/surfaces/report-print-shell-v2.css','/assets/customer-ui/surfaces/bazi-print-shell-v2.css'];
 return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PHI OS · BaZi</title>${styles.map(h=>`<link rel="stylesheet" href="${h}">`).join('')}</head><body><main class="report-root">${renderBaziDeepManuscript(ir)}</main></body></html>`;
}
