import {customerSafeSyntheticBaziText,fixtureVisibleInternalTerms} from './lib/bazi-r2-customer-safe-synthetic-manuscript.mjs';
import {startP7} from './lib/bazi-r2-p7-terminal-harness.mjs';

import fs from 'node:fs';

import assert from 'node:assert/strict';

import {randomBytes} from 'node:crypto';

import {DatabaseSync} from 'node:sqlite';


import {
  createSqliteD1Adapter,
  loadRuntimeMigrations
} from './runtime-migration-loader.mjs';


import {commerceApi} from
  '../functions/commerce/commerce-stripe-api.js';


import {onRequestPost as webhook} from
  '../functions/api/stripe-webhook.js';


import {STRIPE_PRODUCT_REGISTRY} from
  '../functions/pws/commercial/stripe-product-registry.js';


import {createStripeTestSignature} from
  '../functions/commerce/stripe-client.js';


import {saveCanonicalPerson} from
  '../functions/account/canonical-person-store.js';


import {prepareAccountBaziCandidate} from
  '../functions/report-delivery/bazi-account-candidate.js';


import {buildCustomerNativeBaziInputs} from
  '../functions/report-delivery/bazi-customer-native-inputs.js';


import {
  generateAndReleaseAccountBazi,
  openAccountBaziMaterial,
  listAccountBaziMaterials
} from '../functions/account/bazi-account-delivery.js';


import {
  VERSIONS,
  SECTIONS,
  BATCHES,
  digest as manuscriptDigest
} from '../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';


import {
  buildBaziProductionGenerationConfig
} from '../functions/personal-reading/deep-manuscript/bazi-production-generation-config.js';


import {
  compileBaziDeepPublication
} from '../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js';


import {
  createReportGenerationStore
} from '../functions/personal-reading/report-generation-store.js';


import {
  createReportBudget
} from '../functions/personal-reading/report-generation-budget.js';


import {digest as outputDigest} from
  '../functions/account/oidc-auth.js';


const terminal=process.env.P7R3_AUDIT_ONLY==='1'?{fail:async()=>{},close:async()=>{}}:await startP7();
try{
﻿/*
  BaZi R2 P7
  Subject-bound full local orchestration proof.

  Boundaries:
  - synthetic customer only
  - signed QA checkout/webhook fixture
  - customer-native BaZi authority
  - synthetic manuscript producer injected explicitly
  - synthetic renderer service receipt
  - no OpenAI key
  - no provider/network calls
  - no production activation
  - no deploy
  - historical Journey A evidence remains untouched
*/

/* -------------------------------------------------- */
/* DATABASE / COMMERCE                                */
/* -------------------------------------------------- */

const sql = new DatabaseSync(':memory:');

for (const migration of loadRuntimeMigrations(process.cwd()).migrations) {
  sql.exec(migration.sql);
}

const db = createSqliteD1Adapter(sql);

const owner = process.env.P7R3H_MODE?'P7R3H-OWNER-A':process.env.P7R3G_MODE?'P7R3G-OWNER-A':process.env.P7R3F_MODE?'P7R3F-OWNER-A':'BAZI-R2-P7-OWNER-A';
const otherOwner = 'BAZI-R2-P7-OWNER-B';

const productId = 'COM-REPORT-BAZI-FULL';

const product = STRIPE_PRODUCT_REGISTRY.find(
  row => row.productId === productId
);

assert(product);

const now = Date.now();

const controlledPolicy = {
  campaignId: 'bazi-r2-p7-local-fixture',
  ownerId: owner,
  maximumUses: 1,
  startsAt: new Date(now - 60000).toISOString(),
  expiresAt: new Date(now + 86400000).toISOString(),
  completedProductIds: [productId],
  products: {
    [productId]: {
      couponId: 'coupon_bazi_r2_p7',
      originalAmountMinor: 6900,
      paidAmountMinor: 500
    }
  }
};

const objects = new Map();

const env = {
  RUNTIME_DB: db,

  STRIPE_ENVIRONMENT: 'QA',
  STRIPE_SECRET_KEY: 'sk_test_fixture_only',
  STRIPE_WEBHOOK_SECRET: 'whsec_fixture_only',

  PHIOS_COMMERCE_QA_ENABLED: 'true',

  PHIOS_CONTROLLED_PURCHASE_ENABLED: 'true',
  PHIOS_CONTROLLED_PURCHASE_POLICY:
    JSON.stringify(controlledPolicy),

  PHIOS_ENVIRONMENT: 'local',

  AUTH_SESSION_SECRET:
    'bazi-r2-p7-local-session-secret-not-production',

  CANONICAL_PERSON_ENCRYPTION_KEY:
    randomBytes(32).toString('hex'),

  PRIVATE_REPORTS: {
    async put(key, value) {
      objects.set(key, value);
    },

    async get(key) {
      if (!objects.has(key)) return null;

      const value = objects.get(key);

      return {
        async text() {
          return value;
        },

        async json() {
          return JSON.parse(value);
        }
      };
    }
  }
};


/* -------------------------------------------------- */
/* EXTERNAL NETWORK MUST NEVER BE USED                */
/* -------------------------------------------------- */

let forbiddenExternalCalls = 0;


/* -------------------------------------------------- */
/* SYNTHETIC STRIPE                                   */
/* -------------------------------------------------- */

let checkoutSession = null;
let checkoutCreates = 0;

const stripeFixture = async (url, options = {}) => {
  const parsed = new URL(url);
  const body = new URLSearchParams(options.body);

  if (parsed.pathname === '/v1/account') {
    return Response.json({
      id: 'acct_1UFr0TBEKXJyHMkK'
    });
  }

  if (parsed.pathname === '/v1/customers') {
    return Response.json({
      id: 'cus_bazir2p7',
      livemode: false
    });
  }

  if (parsed.pathname === '/v1/checkout/sessions') {
    checkoutCreates++;

    assert.equal(
      body.get('line_items[0][price]'),
      product.qaPriceId
    );

    assert.equal(
      body.get('line_items[1][price_data][unit_amount]'),
      '1000'
    );

    assert.equal(
      body.get('discounts[0][coupon]'),
      'coupon_bazi_r2_p7'
    );

    const metadata = Object.fromEntries(
      [...body]
        .filter(([key]) => key.startsWith('metadata['))
        .map(([key, value]) => [
          key.slice(9, -1),
          value
        ])
    );

    checkoutSession = {
      id: 'cs_test_bazir2p7',
      url:
        'https://checkout.stripe.com/c/pay/cs_test_bazir2p7',
      expires_at: Math.floor(now / 1000) + 1800,
      livemode: false,

      metadata,

      customer: 'cus_bazir2p7',
      payment_intent: 'pi_bazir2p7',

      currency: 'myr',
      mode: 'payment',

      payment_status: 'unpaid',

      amount_subtotal: 6900,
      amount_total: 500,

      total_details: {
        amount_discount: 6400,
        amount_tax: 0,
        amount_shipping: 0
      },

      discounts: [
        {
          coupon: 'coupon_bazi_r2_p7'
        }
      ],

      line_items: {
        has_more: false,
        data: [
          {
            price: {
              id: product.qaPriceId
            },
            quantity: 1
          },
          {
            price: {
              id: 'price_QA_inline_surcharge',
              currency: 'myr',
              unit_amount: 1000,
              product: product.qaProductId
            },
            quantity: 1
          }
        ]
      }
    };

    return Response.json(checkoutSession);
  }

  if (
    parsed.pathname ===
    '/v1/checkout/sessions/cs_test_bazir2p7'
  ) {
    return Response.json(checkoutSession);
  }

  throw Error(
    'P7_UNEXPECTED_STRIPE_FIXTURE_REQUEST:' +
    parsed.pathname
  );
};


/* -------------------------------------------------- */
/* ACCOUNT CONTEXT                                    */
/* -------------------------------------------------- */

function context(
  who = owner,
  key = 'bazi-r2-p7-checkout-key'
) {
  return {
    env,

    fetch: stripeFixture,

    data: {
      symbolicAccountIdentity: {
        userId: who,
        providerId: 'P7_LOCAL_FIXTURE',
        verified: true,
        authenticated: true
      }
    },

    request: new Request(
      'https://controlled.test/api/commerce-checkout',
      {
        method: 'POST',

        headers: {
          origin: 'https://controlled.test',
          'idempotency-key': key,
          'content-type': 'application/json'
        },

        body: JSON.stringify({
          productId,
          reportLocale: 'bilingual',
          reportLanguageMode: 'BILINGUAL',
          acceptDigitalPolicy: true
        })
      }
    )
  };
}


/* -------------------------------------------------- */
/* CHECKOUT + SIGNED WEBHOOK                          */
/* -------------------------------------------------- */

const checkout = await commerceApi(
  context(),
  'checkout'
);

assert.equal(
  checkout.status,
  201,
  await checkout.clone().text()
);

assert.equal(checkoutCreates, 1);

let eventSequence = 0;

async function sendWebhook() {
  const raw = JSON.stringify({
    id:
      'evt_bazir2p7' +
      (++eventSequence),

    type: 'checkout.session.completed',
    livemode: false,

    data: {
      object: checkoutSession
    }
  });

  const signature =
    await createStripeTestSignature(
      raw,
      env.STRIPE_WEBHOOK_SECRET,
      Math.floor(Date.now() / 1000)
    );

  return webhook({
    env,
    fetch: stripeFixture,

    request: new Request(
      'https://controlled.test/api/stripe-webhook',
      {
        method: 'POST',

        headers: {
          'stripe-signature': signature
        },

        body: raw
      }
    )
  });
}


/* unpaid webhook must not create purchase */

await sendWebhook();

assert.equal(
  sql.prepare(
    'SELECT count(*) n FROM commerce_purchases'
  ).get().n,
  0
);


/* paid webhook */

checkoutSession.payment_status = 'paid';

const acceptedWebhook =
  await sendWebhook();

assert.equal(
  acceptedWebhook.status,
  200,
  await acceptedWebhook.clone().text()
);

assert.equal(
  sql.prepare(
    'SELECT count(*) n FROM commerce_purchases'
  ).get().n,
  1
);

assert.equal(
  sql.prepare(
    "SELECT count(*) n FROM digital_entitlements WHERE entitlement_status='active'"
  ).get().n,
  1
);

/*
  From this point onward the Commerce/Stripe fixture is complete.
  No external network/provider transport is permitted during
  BaZi native input, generation, publication or release.
*/
globalThis.fetch = async () => {
  forbiddenExternalCalls++;
  throw Error('P7_EXTERNAL_NETWORK_FORBIDDEN');
};


/* -------------------------------------------------- */
/* NATIVE PERSON / NATIVE BAZI AUTHORITY              */
/* -------------------------------------------------- */

const ownerContext = context();

const auditUuid=crypto.randomUUID;
if(process.env.P7R3H_MODE){let first=true;crypto.randomUUID=()=>first?(first=false,'73000000-0000-4000-8000-000000000008'):auditUuid.call(crypto);}
if(process.env.P7R3G_MODE){let first=true;crypto.randomUUID=()=>first?(first=false,'73000000-0000-4000-8000-000000000007'):auditUuid.call(crypto);}
if(process.env.P7R3F_MODE){let first=true;crypto.randomUUID=()=>first?(first=false,'73f00000-0000-4000-8000-000000000001'):auditUuid.call(crypto);}
if(process.env.P7R3_AUDIT_ONLY==='1'){
 const old=JSON.parse(fs.readFileSync('content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/CUSTOMER-MATERIAL-METADATA.json','utf8'));
 let first=true;crypto.randomUUID=()=>{if(first){first=false;return old.personId;}return auditUuid.call(crypto);};
}
const person = await saveCanonicalPerson(
  ownerContext,
  {
    action: 'save',
    expectedVersion: 0,

    name: process.env.P7R3H_MODE?'Lin Mei':'BaZi R2 P7 synthetic subject',

    birth: {
      birthDate: '1991-08-17',
      birthTime: '09:20:00',

      birthPlace: {
        displayName: 'Kuala Lumpur',
        countryCode: 'MY',
        latitude: 3.139,
        longitude: 101.6869
      },

      timezone: {
        iana: 'Asia/Kuala_Lumpur',
        utcOffsetAtBirth: '+08:00'
      },

      timeAccuracy: 'EXACT'
    },

    calculationSex: 'FEMALE',

    consent: {
      personalMethod: true,
      report: true,
      saveBirthInput: true
    },

    expiresAt:
      new Date(
        now + 30 * 86400000
      ).toISOString()
  }
);

crypto.randomUUID=auditUuid;
const prepared =
  await prepareAccountBaziCandidate(
    ownerContext,
    {
      personId: person.personId
    }
  );

assert.equal(
  prepared.state,
  'RELEASE_PENDING'
);

const native =
  await buildCustomerNativeBaziInputs(
    ownerContext,
    prepared
  );
if(process.env.P7R3_AUDIT_ONLY==='1'){
 const {captureP7R3SourceAudit}=await import('./lib/bazi-r2-p7r3-source-audit.mjs');
 await captureP7R3SourceAudit({native,prepared,person});
 process.exit(0);
}

assert.equal(
  native.pack.subject.subjectId,
  person.personId
);

assert.equal(
  native.pack.lineage.authority.owner,
  'EXISTING_BZR_NATIVE_RUNTIME'
);

assert.notEqual(
  native.pack.subject.subjectId,
  'BDM-REFERENCE-GENG'
);


/* -------------------------------------------------- */
/* CURRENT ACCEPTED CONFIG                            */
/* -------------------------------------------------- */

const canonicalConfig =
  buildBaziProductionGenerationConfig();

assert.equal(
  canonicalConfig.approval.statement,
  'HUMAN ACCEPT BAZI DEEP MANUSCRIPT R2'
);

assert.equal(
  canonicalConfig.approval.productionFrozen,
  true
);

assert.equal(
  canonicalConfig.policy.productionActivated,
  false
);

assert.equal(
  canonicalConfig.policy.REPORT_PROVIDER_LIVE_ALLOWED,
  false
);


/* -------------------------------------------------- */
/* SYNTHETIC CUSTOMER-NATIVE MANUSCRIPT               */
/* -------------------------------------------------- */

/*
  Do not reuse BDM-REFERENCE-GENG prose.

  This text exists only to test the publication/release
  machinery against this synthetic person's native pack.
*/

function zhText(sectionId){return customerSafeSyntheticBaziText(native.pack,sectionId,'zh-Hans');}
function enText(sectionId){return customerSafeSyntheticBaziText(native.pack,sectionId,'en');}

const sections = [];

for (const section of SECTIONS) {
  const zhHansManuscript =
    zhText(section.sectionId);

  const enManuscript =
    enText(section.sectionId);

  sections.push({
    sectionId: section.sectionId,

    zhHansManuscript,
    enManuscript,

    unitDigests: {
      'zh-Hans':
        await manuscriptDigest(
          zhHansManuscript
        ),

      en:
        await manuscriptDigest(
          enManuscript
        )
    }
  });
}


/*
  Keep provider usage empty.

  The three production batches are asserted separately below;
  fabricated provider usage must not enter the customer artifact.
*/

const snapshotBody = {
  version:
    'BDM-MANUSCRIPT-SNAPSHOT-1',

  candidateId:
    'P7-SYNTHETIC-CANDIDATE',

  orderId: null,
  experimentId: null,

  subjectId:
    person.personId,

  method: 'BAZI',

  authorityDigest:
    native.pack.authorityDigest,

  timingDigest:
    native.pack.timingDigest,

  realityDigest:
    native.pack.realityDigest,

  versions: VERSIONS,

  model:
    'SYNTHETIC_ZERO_PROVIDER_CUSTOMER_NATIVE_FIXTURE',

  subject:
    native.pack.subject,

  actualExperimentCost: 0,
  usageComplete: true,

  normalProviderCalls: 0,
  standardTechnicalRecoveryCalls: 0,
  deliveryRescueCalls: 0,

  sections,

  usage: [],

  fixture: false,

  generatedAt:
    new Date(now).toISOString()
};

const syntheticSnapshot = {
  ...snapshotBody,
  digest:
    await manuscriptDigest(
      snapshotBody
    )
};


/* -------------------------------------------------- */
/* INJECTED PRODUCER                                  */
/* -------------------------------------------------- */

let producerCalls = 0;
let budgetLedgerSeeds = 0;
let syntheticPaidBinding = null;

async function syntheticProducer(args) {
  producerCalls++;

  /*
    Real production transport creates the durable lifecycle ledger
    when the first budgeted provider request is reserved.

    This P7 producer intentionally performs ZERO provider calls, so
    it must create the equivalent empty lifecycle ledger explicitly.

    This is test fixture state only:
    - no PRIMARY request is fabricated
    - no provider usage is fabricated
    - no cost is recorded
    - follow-up reserve remains untouched
  */
  syntheticPaidBinding = structuredClone(args.binding);

  const budgetStore =
    await createReportGenerationStore(
      args.env,
      args.binding
    );

  await budgetStore.withLock(
    'lifecycle',
    async () => {
      const existing =
        await budgetStore.get('lifecycle');

      if (existing) {
        for (const key of [
          'ownerAccountId',
          'orderId',
          'reportId',
          'productId',
          'authorityDigest'
        ]) {
          assert.equal(
            existing[key],
            args.binding[key],
            `existing lifecycle binding mismatch: ${key}`
          );
        }

        return;
      }

      const ledger =
        createReportBudget({
          ...args.binding,
          verifiedPayment: true
        });

      assert.equal(
        Object.keys(
          ledger.requests || {}
        ).length,
        0
      );

      assert.equal(
        ledger.delivered,
        false
      );

      await budgetStore.put(
        'lifecycle',
        ledger
      );

      budgetLedgerSeeds++;
    }
  );

  assert.equal(
    args.pack.subject.subjectId,
    person.personId
  );

  assert.equal(
    args.pack.digest,
    native.pack.digest
  );

  assert.equal(
    args.approval.statement,
    'HUMAN ACCEPT BAZI DEEP MANUSCRIPT R2'
  );

  assert.equal(
    args.approval.productionFrozen,
    true
  );

  assert.deepEqual(
    args.approval.versions,
    VERSIONS
  );

  assert.equal(
    args.order.paymentConfirmed,
    true
  );

  assert.equal(
    args.order.subjectId,
    person.personId
  );

  assert.equal(
    args.order.authorityDigest,
    native.pack.digest
  );

  return {
    snapshot:
      syntheticSnapshot,

    cacheHit: false,

    providerCalls: 0
  };
}



const fixtureLeaks=sections.flatMap(s=>['zhHansManuscript','enManuscript'].flatMap(field=>fixtureVisibleInternalTerms(s[field])));assert.deepEqual(fixtureLeaks,[],'FIXTURE_VISIBLE_INTERNAL_LANGUAGE_BEFORE_RELEASE');
if(process.env.P7R3H_MODE){const d='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/p7r3h-continuation/';fs.mkdirSync(d,{recursive:true});fs.writeFileSync(d+'FIXTURE-HYGIENE-BEFORE-RELEASE.json',JSON.stringify({status:'PASS',fixtureVisibleInternalTerms:fixtureLeaks,owner,personId:person.personId,nativePackDigest:native.pack.digest,sections:sections.map(s=>({sectionId:s.sectionId,zh:s.zhHansManuscript,en:s.enManuscript,fixtureVisibleInternalTerms:[]}))},null,2)+'\n');}
env.METHOD_REPORT_RENDERER=terminal.renderer;
if(process.env.P7R3_TARGETED_ONLY==='1'){
 const publication=await compileBaziDeepPublication({snapshot:syntheticSnapshot,pack:native.pack,productionFrozen:true,presentationMode:'BILINGUAL'});
 await terminal.targeted(publication,native.pack);
}else if(process.env.P7R1_RENDERER_ONLY==='1'||process.env.P7R3F_MODE==='targeted'||process.env.P7R3G_MODE==='targeted'){
 const publication=await compileBaziDeepPublication({snapshot:syntheticSnapshot,pack:native.pack,productionFrozen:true,presentationMode:'BILINGUAL'});
 const response=await terminal.renderer.fetch(new Request('https://local.invalid/verify',{method:'POST',body:JSON.stringify({method:'BZR',publication})}));
 const evidence=await response.json();
 if(!response.ok)throw Error('P7R1_TARGETED_RENDERER_REJECTED');
 console.log('P7R1 targeted renderer HTTP',response.status,JSON.stringify(evidence.verification));
}else{
const release=await generateAndReleaseAccountBazi(ownerContext,{personId:person.personId,locale:'bilingual'},{produce:syntheticProducer});
const opened=await openAccountBaziMaterial(ownerContext,release.reportId);
await terminal.verify({opened,release,owner,person,prepared,native,snapshot:syntheticSnapshot,producerInvocations:()=>producerCalls,reopen:()=>openAccountBaziMaterial(ownerContext,release.reportId),externalCalls:()=>forbiddenExternalCalls});
}
}catch(error){await terminal.fail(error);throw error;}finally{await terminal.close();}
