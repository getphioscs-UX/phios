from pathlib import Path
def edit(path, pairs):
 p=Path(path);s=p.read_bytes().decode('utf-8')
 for old,new in pairs:
  if old!=new and new in s:continue
  if s.count(old)!=1:raise RuntimeError('EXPECTED_SINGLE_MATCH:'+path+':'+old[:70])
  s=s.replace(old,new)
 p.write_bytes(s.encode('utf-8'))
edit('functions/commerce/commerce-stripe-api.js',[
 ("import {resolveCommerceBookSourceKey}","import {resolveCommerceBookSourceKey,bookLanguageIdentity,requireBookPdfReadiness}"),
 ('STRIPE_PRODUCT_REGISTRY.filter(p=>p.active).map','STRIPE_PRODUCT_REGISTRY.filter(p=>p.active&&p.catalogVisible!==false).map'),
 ('checkoutAvailable:!p.checkoutBlockedReason&&commerceCheckoutAvailable(env)','checkoutAvailable:!p.checkoutBlockedReason&&(!p.requiresBookPdfReadiness||env.PHIOS_BOOK_PDF_CHECKOUT_ENABLED===\'true\')&&commerceCheckoutAvailable(env)'),
 ('const body=await readJsonBody(request),p=commerceProduct(body.productId);',"const body=await readJsonBody(request);if(Object.keys(body).some(k=>k!=='productId'))return json({success:false,error:'book_download_input_invalid'},422);const p=commerceProduct(body.productId);"),
 ("if(product.category==='BOOK') resolveCommerceBookSourceKey(env,product.productId);","let bookPdf=null;if(product.category==='BOOK'){if(bookLanguageIdentity(product.productId))bookPdf=await requireBookPdfReadiness(env,product.productId);else resolveCommerceBookSourceKey(env,product.productId);}"),
 ('const contextSnapshot=reference?{readingId:reference}:{};','const contextSnapshot=reference?{readingId:reference}:{};if(bookPdf)contextSnapshot.bookPdf=bookPdf;')
])
edit('functions/commerce/stripe-client.js',[
 ("const body=new URLSearchParams({mode,customer:customerId", "const body=new URLSearchParams({mode,customer:customerId"),
 ("if(product.fulfillmentType==='CONTINUITY_QUOTA_REFILL'){","if(product.deliveryFormat==='FULL_PDF_DOWNLOAD'){const b=JSON.parse(order.context_json||'{}').bookPdf;if(!b||b.productId!==product.productId||b.language!==product.language)throw Error('BOOK_PDF_METADATA_REQUIRED');Object.assign(metadata,{book_code:b.bookCode,book_language:b.language,book_source_sha256:b.sourceSha256});body.set('custom_text[submit][message]',`Full PDF · ${b.bookCode} · ${b.language==='en'?'English':'中文'} · RM89. Other languages sold separately.`);}\n    if(product.fulfillmentType==='CONTINUITY_QUOTA_REFILL'){")
])
edit('functions/commerce/commerce-stripe-events.js',[
 ("import {dispatchWatermark}","import {orderBookPdfSource} from './book-product-registry.js';\nimport {dispatchWatermark}"),
 ('const presentation=validateOrderReportPresentation(product,order);',"const bookPdf=orderBookPdfSource(order);if(bookPdf)assert(metadata.book_code===bookPdf.bookCode&&metadata.book_language===bookPdf.language&&metadata.book_source_sha256===bookPdf.sourceSha256);\n  const presentation=validateOrderReportPresentation(product,order);")
])
edit('functions/commerce/book-delivery.js',[
 ('sourceObjectKey: job.source_object_key,',"sourceObjectKey: job.source_object_key,\n        ...(watermark.bookPdf?{sourceBinding:watermark.bookPdf.binding,sourceSha256:watermark.bookPdf.sourceSha256,expectedPageCount:watermark.bookPdf.pageCount,bookCode:watermark.bookPdf.bookCode,language:watermark.bookPdf.language}:{}),")
])
edit('functions/api/book-one-download.js',[
 ("import {\n  consumeDownloadToken,", "import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';\nimport {\n  consumeDownloadToken,"),
 ('export async function onRequestGet({ request, env = {} })','export async function onRequestGet({ request, env = {},data={} })'),
 ('consumeDownloadToken({ env, rawToken })','consumeDownloadToken({ env, rawToken,customerId:normalizeVerifiedSymbolicAccountIdentity(data.symbolicAccountIdentity)?.userId||null })'),
 ('(?:book-one|com-book-0[1-7])','(?:book-one|com-book-0[1-7]|com-book-0[1-4]-(?:zh|en))'),
 ('const fingerprint = await hmacHex(',"if(authorization.bookPdf){const b=authorization.bookPdf,m=object.customMetadata||{};if(m.productId!==b.productId||m.language!==b.language||m.sourceSha256!==b.sourceSha256||m.purchaseId!==authorization.purchase_id||Number(m.pageCount)!==b.pageCount)throw Object.assign(Error('Purchased PDF identity mismatch.'),{status:409,code:'book_pdf_identity_mismatch'});}\n    const fingerprint = await hmacHex("),
 ('\'attachment; filename="PHI-OS-Licensed-Book-Watermarked.pdf"\'',"authorization.bookPdf?`attachment; filename=\"PHI-OS-${authorization.bookPdf.bookCode}-${authorization.bookPdf.language}.pdf\"`:'attachment; filename=\"PHI-OS-Licensed-Book-Watermarked.pdf\"'")
])
edit('functions/api/book-one-watermark-complete.js',[
 ("import {\n  markWatermarkFailed,","import {decryptSensitive} from '../commerce/commerce-crypto.js';\nimport {\n  markWatermarkFailed,"),
 ('await markWatermarkReady({',"const identity=JSON.parse(await decryptSensitive(job.watermark_payload_ciphertext,env.BOOK_ACCESS_TOKEN_SECRET));if(identity.bookPdf){const b=identity.bookPdf,m=object.customMetadata||{};if(m.productId!==b.productId||m.language!==b.language||m.sourceSha256!==b.sourceSha256||m.purchaseId!==job.purchase_id||Number(m.pageCount)!==b.pageCount)throw Object.assign(Error('Completed PDF does not match the purchased version.'),{status:409,code:'book_pdf_identity_mismatch'});}\n    await markWatermarkReady({")
])
