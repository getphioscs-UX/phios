if(document.body.dataset.cxSurface==='ICHING_FULL_PRODUCTION'){
  document.body.dataset.ichingRunCutover='redirecting';
  document.documentElement.style.visibility='hidden';
  location.replace('/perspectives/iching/consult/');
}
