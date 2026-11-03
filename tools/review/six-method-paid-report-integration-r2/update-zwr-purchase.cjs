const fs=require('fs'),path=require('path'),crypto=require('crypto'),r=__dirname,w='C:/phios/.worktrees/five-method-paid-report-production-r1';
const files=['functions/report-delivery/ziwei-controlled-generation.js','functions/report-delivery/ziwei-production-generation-v1.js','functions/account/ziwei-controlled-report-material.js','functions/account/ziwei-pdf-delivery.js'];
for(const f of files){const p=w+'/'+f,s=fs.readFileSync(p,'utf8'),b=r+'/baseline/'+f;if(!fs.existsSync(b)){fs.mkdirSync(path.dirname(b),{recursive:true});fs.writeFileSync(b,s);}let next=s;
 if(f.includes('/report-delivery/')){next=next.replace("import {ownedReportPresentation} from '../commerce/book-commerce-store.js';","import {ownedZiweiPurchase} from './ziwei-purchase-binding.js';").replace('requireZiweiEntitlement(context,locale){','requireZiweiEntitlement(context,locale,{purchaseId=null}={}){').replace('ownedReportPresentation(context.env,identity.userId,ZIWEI_PRODUCT)','ownedZiweiPurchase(context,identity.userId,ZIWEI_PRODUCT,{purchaseId})');}
 else next=next.replaceAll('requireZiweiEntitlement(context,candidate.locale)','requireZiweiEntitlement(context,candidate.locale,{purchaseId:candidate.purchaseId})').replaceAll('requireZiweiEntitlement(context,m.locale)','requireZiweiEntitlement(context,m.locale,{purchaseId:m.purchaseId})');
 fs.writeFileSync(p,next);
}
