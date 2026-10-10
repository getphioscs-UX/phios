import { inspectIChingLimitedProductionConfiguration } from '../iching-limited-production/iching-limited-production-v1.js';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff'
};
const clean = value => String(value ?? '').normalize('NFKC').trim();
const sha40 = value => /^[0-9a-f]{40}$/i.test(clean(value));
const present = value => Boolean(clean(value));
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers});

/**
 * ICH-PROD-W32R1D safe external-gate diagnostics.
 *
 * This route intentionally exposes only booleans, the public deployment SHA,
 * and the coarse request country. It never returns configured secret values,
 * tester email addresses, Access audiences, session material, account identity,
 * cookies or D1 row contents.
 *
 * Retire this diagnostic surface after W32R1/W33 production acceptance.
 */
export async function onRequestGet(context){
  const env=context?.env||{};
  const config=inspectIChingLimitedProductionConfiguration(context);
  const currentSha=clean(env.CF_PAGES_COMMIT_SHA).toLowerCase();
  const deploymentSha=clean(env.ICHING_LIMITED_PRODUCTION_DEPLOYMENT_SHA).toLowerCase();
  const browserAcceptedSha=clean(env.ICHING_LIMITED_PRODUCTION_LIVE_BROWSER_ACCEPTED_SHA).toLowerCase();
  const teamDomain=clean(env.PHIOS_ACCESS_TEAM_DOMAIN).replace(/\/$/,'');
  const audience=clean(env.PHIOS_ACCESS_AUD);
  const testerEmails=clean(env.ICHING_LIMITED_PRODUCTION_EMAILS);
  const allowedCountries=clean(env.ICHING_LIMITED_PRODUCTION_COUNTRIES);
  const rightsReview=clean(env.ICHING_LIMITED_PRODUCTION_RIGHTS_REVIEW_ID);
  const sessionSecret=clean(env.ICHING_LIMITED_PRODUCTION_SESSION_SECRET);
  const requestCountry=clean(context?.request?.cf?.country).toUpperCase();
  const gates={
    enabled:config.enabled===true,
    accessConfigured:config.accessConfigured===true,
    deploymentShaAligned:config.deploymentShaAligned===true,
    rightsReviewPresent:config.rightsReviewPresent===true,
    sessionSecretReady:config.sessionSecretReady===true,
    countryAllowed:config.countryAllowed===true
  };
  const allPreflightGatesReady=Object.values(gates).every(Boolean);
  return json({
    ok:true,
    method:'I_CHING',
    work:'ICH-PROD-W32R1D-SAFE-EXTERNAL-GATE-DIAGNOSTICS',
    state:allPreflightGatesReady?'EXTERNAL_PREFLIGHT_READY':'EXTERNAL_GATE_PENDING',
    deployment:{currentSha:sha40(currentSha)?currentSha:null},
    request:{country:requestCountry||null},
    gates,
    details:{
      currentShaPresent:sha40(currentSha),
      deploymentShaPresent:sha40(deploymentSha),
      browserAcceptedShaPresent:sha40(browserAcceptedSha),
      deploymentShaMatchesCurrent:sha40(deploymentSha)&&sha40(currentSha)&&deploymentSha===currentSha,
      browserAcceptedShaMatchesCurrent:sha40(browserAcceptedSha)&&sha40(currentSha)&&browserAcceptedSha===currentSha,
      accessTeamDomainPresent:present(teamDomain),
      accessTeamDomainShapeValid:/^https:\/\/[a-z0-9.-]+\.cloudflareaccess\.com$/i.test(teamDomain),
      accessAudiencePresent:present(audience),
      testerEmailAllowlistPresent:present(testerEmails),
      allowedCountryListPresent:present(allowedCountries),
      requestCountryPresent:present(requestCountry),
      rightsReviewValuePresent:present(rightsReview),
      sessionSecretLengthReady:sessionSecret.length>=32,
      runtimeDbBound:Boolean(env.RUNTIME_DB&&typeof env.RUNTIME_DB.prepare==='function')
    },
    boundaries:{
      secretValuesExposed:false,
      accessJwtExposed:false,
      testerIdentityExposed:false,
      configuredEmailExposed:false,
      configuredAudienceExposed:false,
      sessionSecretExposed:false,
      d1DataExposed:false,
      grantsExecutionAuthority:false,
      fullProduction:false
    }
  });
}

export async function onRequestPost(){
  return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);
}
