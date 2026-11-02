if(document.body.dataset.cxSurface==='ICHING_FULL_PRODUCTION'){
  document.body.dataset.ichingRunCutover='redirecting';
  document.documentElement.style.visibility='hidden';
  const destination=new URL(location.href);
  destination.pathname='/perspectives/iching/consult/';
  location.replace(destination.pathname+destination.search+destination.hash);
}
