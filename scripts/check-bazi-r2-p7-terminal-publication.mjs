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

const owner = 'BAZI-R2-P7-OWNER-A';
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
if(process.env.P7R3_AUDIT_ONLY==='1'){
 const old=JSON.parse(fs.readFileSync('content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/CUSTOMER-MATERIAL-METADATA.json','utf8'));
 let first=true;crypto.randomUUID=()=>{if(first){first=false;return old.personId;}return auditUuid.call(crypto);};
}
const person = await saveCanonicalPerson(
  ownerContext,
  {
    action: 'save',
    expectedVersion: 0,

    name: 'BaZi R2 P7 synthetic subject',

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

function zhText(sectionId) {
  const p = native.pack.natal?.pillars || {};
  const dayMaster =
    native.pack.natal?.dayMaster ||
    String(p.day || '').slice(0, 1) ||
    '当前日主';

  const marker = [
    p.year,
    p.month,
    p.day,
    p.hour
  ].filter(Boolean).join('、');

  const livedBySection = {
    S02:
      '在现实生活与日常选择中，这些结构只形成观察线索，不等同于已经发生的人生事实。',
    S03:
      '在现实生活、学习与做事方式中，可以观察这些结构怎样同时表现为能力与限制。',
    S04:
      '在现实工作、职业责任、标准与期限中，可以观察这些结构怎样形成实际承载。',
    S05:
      '在现实收入、成本、客户与资源安排中，可以观察这些结构怎样进入财富与资源管理。',
    S06:
      '在亲密关系、信任、情绪与伴侣互动中，可以观察自主与靠近之间的实际关系张力。',
    S07:
      '在家庭、照顾、实际分担与隐形责任中，可以观察支持网络怎样真实运作。',
    S08:
      '在现实生活与高负荷阶段，可以观察压力怎样进入节奏、判断与日常反应。',
    S09:
      '在长期生活节奏与不同阶段中，可以观察结构怎样持续、转向或重新组织。',
    S10:
      '在现实生活的节奏变化中，时序只提供观察背景，不直接等同于事件预测。'
  };

  const lines = [
    `当前客户的日主为 ${dayMaster}，四柱为 ${marker}；本节的命理机制只绑定这份客户原生命盘中的日主、月令与已计算结构。`,
    livedBySection[sectionId] ||
      '在现实生活与日常选择中，可以观察这些结构如何表现，但不能把结构直接写成既成事实。',
    '支持与承载条件会改变同一结构的实际表现，因此必须同时保留资源、支持、恢复与制衡条件。',
    `本节只用于验证 ${sectionId} 的客户原生出版链，命盘主体始终为 ${person.personId}。`,
    '任何没有进入当前 authority pack 的个人经历、事件、关系事实或现实结论都继续保持未知。',
    '结构解释必须返回当前客户自己的命盘来源，不能用其他 reference subject 的文字或结论替代。'
  ];

  if (sectionId === 'S10') {
    lines.splice(
      2,
      0,
      '当前大运与流年构成不同尺度的时序层；本地 fixture 只承认当前 pack 已提供的时序事实，不补造特定干支或事件。'
    );
  }

  return lines.join('\n\n');
}

function enText(sectionId) {
  const p = native.pack.natal?.pillars || {};
  const dayMaster =
    native.pack.natal?.dayMaster ||
    String(p.day || '').slice(0, 1) ||
    'current Day Master';

  const marker = [
    p.year,
    p.month,
    p.day,
    p.hour
  ].filter(Boolean).join(', ');

  const livedBySection = {
    S02:
      'In daily life and ordinary choices, these structures provide observation cues rather than proof of events that have already happened.',
    S03:
      'In daily life, learning and practical work, the same structure can be observed through both capacity and limitation.',
    S04:
      'In career, work responsibilities, standards and deadlines, the structure can be observed through actual carrying demands.',
    S05:
      'In daily work, income and costs show how resource choices operate in practice.',
    S06:
      'In intimacy, trust, emotional exchange and partner relationships, the structure can be observed through the tension between autonomy and closeness.',
    S07:
      'In family life, care, actual sharing and invisible responsibilities, the support network can be observed in practice.',
    S08:
      'In daily life and periods of heavy demand, pressure can be observed through pace, judgment and practical response.',
    S09:
      'In daily life, longer cycles show how structure persists, changes and reorganises in practice.',
    S10:
      'In the changing pace of daily life, timing provides context for observation and does not itself establish a predicted event.'
  };

  const lines = [
    `The current customer's Day Master is ${dayMaster}, with four pillars ${marker}; the mechanism in this section is bound only to this customer-native chart and its calculated structure.`,
    livedBySection[sectionId] ||
      'In daily life and practical choices, the structure can be observed without converting it into an established personal fact.',
    'Support and carrying conditions can change how the same structure is expressed, so resources, support, recovery and counterweights remain visible.',
    `This section exists only to verify the customer-native publication chain for ${sectionId}, with subject ${person.personId}.`,
    'Any lived event, relationship fact or reality conclusion that is absent from the current authority pack remains unknown.',
    'The interpretation must return to this customer-native chart and must never substitute prose or conclusions from another reference subject.'
  ];

  if (sectionId === 'S10') {
    lines.splice(
      2,
      0,
      'The current Da Yun and annual layer form distinct timing scales; this fixture uses only timing facts present in the current pack and does not invent a specific stem-branch combination or event.'
    );
  }

  return lines.join('\n\n');
}

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



env.METHOD_REPORT_RENDERER=terminal.renderer;
if(process.env.P7R3_TARGETED_ONLY==='1'){
 const publication=await compileBaziDeepPublication({snapshot:syntheticSnapshot,pack:native.pack,productionFrozen:true,presentationMode:'BILINGUAL'});
 await terminal.targeted(publication,native.pack);
}else if(process.env.P7R1_RENDERER_ONLY==='1'){
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
