/*
  BaZi R2 P5
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


/* -------------------------------------------------- */
/* DATABASE / COMMERCE                                */
/* -------------------------------------------------- */

const sql = new DatabaseSync(':memory:');

for (const migration of loadRuntimeMigrations(process.cwd()).migrations) {
  sql.exec(migration.sql);
}

const db = createSqliteD1Adapter(sql);

const owner = 'BAZI-R2-P5-OWNER-A';
const otherOwner = 'BAZI-R2-P5-OWNER-B';

const productId = 'COM-REPORT-BAZI-FULL';

const product = STRIPE_PRODUCT_REGISTRY.find(
  row => row.productId === productId
);

assert(product);

const now = Date.now();

const controlledPolicy = {
  campaignId: 'bazi-r2-p5-local-fixture',
  ownerId: owner,
  maximumUses: 1,
  startsAt: new Date(now - 60000).toISOString(),
  expiresAt: new Date(now + 86400000).toISOString(),
  completedProductIds: [productId],
  products: {
    [productId]: {
      couponId: 'coupon_bazi_r2_p5',
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
    'bazi-r2-p5-local-session-secret-not-production',

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
      id: 'cus_bazir2p5',
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
      'coupon_bazi_r2_p5'
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
      id: 'cs_test_bazir2p5',
      url:
        'https://checkout.stripe.com/c/pay/cs_test_bazir2p5',
      expires_at: Math.floor(now / 1000) + 1800,
      livemode: false,

      metadata,

      customer: 'cus_bazir2p5',
      payment_intent: 'pi_bazir2p5',

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
          coupon: 'coupon_bazi_r2_p5'
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
    '/v1/checkout/sessions/cs_test_bazir2p5'
  ) {
    return Response.json(checkoutSession);
  }

  throw Error(
    'P5_UNEXPECTED_STRIPE_FIXTURE_REQUEST:' +
    parsed.pathname
  );
};


/* -------------------------------------------------- */
/* ACCOUNT CONTEXT                                    */
/* -------------------------------------------------- */

function context(
  who = owner,
  key = 'bazi-r2-p5-checkout-key'
) {
  return {
    env,

    fetch: stripeFixture,

    data: {
      symbolicAccountIdentity: {
        userId: who,
        providerId: 'P5_LOCAL_FIXTURE',
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
      'evt_bazir2p5' +
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
  throw Error('P5_EXTERNAL_NETWORK_FORBIDDEN');
};


/* -------------------------------------------------- */
/* NATIVE PERSON / NATIVE BAZI AUTHORITY              */
/* -------------------------------------------------- */

const ownerContext = context();

const person = await saveCanonicalPerson(
  ownerContext,
  {
    action: 'save',
    expectedVersion: 0,

    name: 'BaZi R2 P5 synthetic subject',

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
    'P5-SYNTHETIC-CANDIDATE',

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
    'SYNTHETIC_OFFLINE_NO_PROVIDER',

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
/* PUBLICATION PREFLIGHT                              */
/* -------------------------------------------------- */

const publicationPreflight =
  await compileBaziDeepPublication({
    snapshot:
      syntheticSnapshot,

    pack:
      native.pack,

    productionFrozen:
      true,

    presentationMode:
      'BILINGUAL'
  });

console.log(
  JSON.stringify({
    event:
      'P5_PUBLICATION_PREFLIGHT',

    customerPublishable:
      publicationPreflight.customerPublishable,

    fixture:
      publicationPreflight.fixture,

    reviewOnly:
      publicationPreflight.reviewOnly,

    pageCount:
      publicationPreflight.publication.pageCount,

    diagramCount:
      publicationPreflight.technical.diagrams.length,

    coverage:
      publicationPreflight.editorial.coverage
  }, null, 2)
);

assert.equal(
  publicationPreflight.fixture,
  false
);

assert.equal(
  publicationPreflight.reviewOnly,
  false
);

assert.equal(
  publicationPreflight.publication.pageCount,
  48
);

assert.equal(
  publicationPreflight.technical.diagrams.length,
  15
);

assert.equal(
  publicationPreflight.customerPublishable,
  true,
  JSON.stringify(
    publicationPreflight.editorial.coverage,
    null,
    2
  )
);


/* Synthetic batch topology proof, no provider ledger fabrication */

assert.deepEqual(
  BATCHES.map(
    batch => batch.sectionIds
  ),
  [
    ['S02', 'S03', 'S04'],
    ['S05', 'S06', 'S07'],
    ['S08', 'S09', 'S10']
  ]
);


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

    This P5 producer intentionally performs ZERO provider calls, so
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


/* -------------------------------------------------- */
/* SYNTHETIC BZR RENDERER SERVICE                     */
/* -------------------------------------------------- */

let rendererCalls = 0;

env.METHOD_REPORT_RENDERER = {
  async fetch(request) {
    rendererCalls++;

    const payload =
      await request.json();

    assert.equal(
      payload.method,
      'BZR'
    );

    const publication =
      payload.publication;

    assert.equal(
      publication.identity.subjectId,
      person.personId
    );

    assert.equal(
      publication.manuscript.digest,
      syntheticSnapshot.digest
    );

    assert.equal(
      publication.publication.pageCount,
      48
    );

    assert.equal(
      publication.technical.diagrams.length,
      15
    );

    assert.equal(
      publication.customerPublishable,
      true
    );

    assert.equal(
      publication.reviewOnly,
      false
    );

    const diagramIds =
      publication.technical.diagrams.map(
        diagram => diagram.id
      );

    const html =
      '<!doctype html><html><body>' +
      publication.publication.pages
        .map(page =>
          `<section class="bdm-page" data-page-number="${page.pageNumber}"></section>`
        )
        .join('') +
      diagramIds
        .map(id =>
          `<div data-diagram-id="${id}"></div>`
        )
        .join('') +
      '</body></html>';

    const htmlDigest =
      await outputDigest(html);

    return Response.json({
      html,

      verification: {
        schemaVersion:
          'METHOD_BROWSER_VERIFICATION_V1',

        verifier:
          'P5_SYNTHETIC_BZR_RENDERER_SERVICE',

        passed: true,

        manuscriptDigest:
          syntheticSnapshot.digest,

        publicationDigest:
          publication.digest,

        browserReady: true,
        pdfReady: true,
        printReady: true,

        pageCount: 48,
        diagramCount: 15,

        brokenImages: 0,
        overflowCount: 0,
        errorCount: 0,

        outputDigest:
          htmlDigest,

        providerCalls: 0
      }
    });
  }
};


/* -------------------------------------------------- */
/* RELEASE                                             */
/* -------------------------------------------------- */

const release =
  await generateAndReleaseAccountBazi(
    ownerContext,

    {
      personId:
        person.personId,

      locale:
        'bilingual'
    },

    {
      produce:
        syntheticProducer
    }
  );

assert.equal(
  release.cacheHit,
  false
);

assert.equal(
  release.providerCalls,
  0
);

assert.equal(
  producerCalls,
  1
);

assert.equal(
  rendererCalls,
  1
);

assert.equal(
  budgetLedgerSeeds,
  1
);

assert(
  syntheticPaidBinding,
  'P5 paid binding must be captured'
);

const completedBudgetStore =
  await createReportGenerationStore(
    env,
    syntheticPaidBinding
  );

let completedBudgetLedger;

await completedBudgetStore.withLock(
  'lifecycle',
  async () => {
    completedBudgetLedger =
      await completedBudgetStore.get(
        'lifecycle'
      );
  }
);

assert(
  completedBudgetLedger,
  'P5 lifecycle ledger must exist'
);

/*
  No provider request was fabricated merely to satisfy
  delivery accounting.
*/
assert.equal(
  Object.keys(
    completedBudgetLedger.requests || {}
  ).length,
  0
);

assert.equal(
  completedBudgetLedger.delivered,
  true
);

assert.equal(
  completedBudgetLedger.hardCapUsd,
  4
);

assert.equal(
  completedBudgetLedger.followupReserveUsd,
  0.4
);


/* -------------------------------------------------- */
/* IMMUTABLE REOPEN                                    */
/* -------------------------------------------------- */

const opened1 =
  await openAccountBaziMaterial(
    ownerContext,
    release.reportId
  );

const opened2 =
  await openAccountBaziMaterial(
    ownerContext,
    release.reportId
  );

assert.equal(
  opened1.row.report_id,
  release.reportId
);

assert.equal(
  opened1.row.snapshot_id,
  syntheticSnapshot.digest
);

assert.equal(
  opened1.row.output_digest,
  opened2.row.output_digest
);

assert.equal(
  opened1.html,
  opened2.html
);


/* -------------------------------------------------- */
/* LIST                                                 */
/* -------------------------------------------------- */

const list =
  await listAccountBaziMaterials(
    ownerContext
  );

assert.equal(
  list.length,
  1
);

assert.equal(
  list[0].reportId,
  release.reportId
);

assert.equal(
  list[0].method,
  'BZR'
);

assert.equal(
  list[0].status,
  'RELEASED'
);


/* -------------------------------------------------- */
/* SECOND RELEASE MUST CACHE                           */
/* -------------------------------------------------- */

const releaseAgain =
  await generateAndReleaseAccountBazi(
    ownerContext,

    {
      personId:
        person.personId,

      locale:
        'bilingual'
    },

    {
      produce:
        syntheticProducer
    }
  );

assert.equal(
  releaseAgain.reportId,
  release.reportId
);

assert.equal(
  releaseAgain.cacheHit,
  true
);

assert.equal(
  releaseAgain.providerCalls,
  0
);

assert.equal(
  producerCalls,
  1,
  'cached release must not invoke producer again'
);

assert.equal(
  rendererCalls,
  1,
  'cached release must not invoke renderer again'
);


/* -------------------------------------------------- */
/* CROSS ACCOUNT                                      */
/* -------------------------------------------------- */

const otherContext =
  context(otherOwner);

await assert.rejects(
  () =>
    openAccountBaziMaterial(
      otherContext,
      release.reportId
    )
);

assert.equal(
  (
    await listAccountBaziMaterials(
      otherContext
    )
  ).length,
  0
);


/* -------------------------------------------------- */
/* FOLLOW-UP GRANT                                    */
/* -------------------------------------------------- */

const followupCount =
  sql.prepare(
    `SELECT COUNT(*) AS n
     FROM account_report_followup_grants
     WHERE report_id=?`
  ).get(
    release.reportId
  ).n;

assert.equal(
  followupCount,
  1
);


/* -------------------------------------------------- */
/* FINAL NETWORK / STORAGE ASSERTIONS                 */
/* -------------------------------------------------- */

assert.equal(
  forbiddenExternalCalls,
  0
);

assert.equal(
  sql.prepare(
    'SELECT COUNT(*) n FROM account_method_report_materials'
  ).get().n,
  1
);

assert.equal(
  sql.prepare(
    'SELECT COUNT(*) n FROM commerce_purchases'
  ).get().n,
  1
);


/* -------------------------------------------------- */
/* RESULT                                               */
/* -------------------------------------------------- */

const result = {
  status:
    'PASS',

  test:
    'BAZI_R2_P5_SUBJECT_BOUND_COMPLETE_LOCAL_RELEASE',

  scope:
    'LOCAL_SYNTHETIC_CUSTOMER_NATIVE_AUTHORITY_SYNTHETIC_MANUSCRIPT_SYNTHETIC_RENDERER_NO_PROVIDER',

  customerId:
    owner,

  personId:
    person.personId,

  personVersion:
    prepared.personVersion,

  purchaseId:
    prepared.purchaseId,

  reportId:
    release.reportId,

  customerNativeAuthority:
    true,

  referenceSubjectUsed:
    false,

  referenceSubjectId:
    'BDM-REFERENCE-GENG',

  syntheticBatchTopology:
    BATCHES.map(
      batch => ({
        batchId:
          batch.batchId,

        sectionIds:
          batch.sectionIds
      })
    ),

  pageCount:
    48,

  diagramCount:
    15,

  productionAdmission:
    'HUMAN ACCEPT BAZI DEEP MANUSCRIPT R2',

  productionFrozen:
    true,

  productionActivated:
    false,

  providerLiveAllowed:
    false,

  producerInvocations:
    producerCalls,

  rendererInvocations:
    rendererCalls,

  reopenProviderCalls:
    0,

  reopenRendererCalls:
    0,

  cachedSecondRelease:
    releaseAgain.cacheHit,

  sameReportIdOnReplay:
    releaseAgain.reportId ===
    release.reportId,

  accountIsolation:
    'PASS',

  followupGrantCreated:
    followupCount === 1,

  providerCalls:
    0,

  providerCostUSD:
    0,

  externalNetworkCalls:
    forbiddenExternalCalls,

  realPayment:
    false,

  deployed:
    false,

  liveCustomer:
    false
};

const out =
  'content/production-closure/' +
  'live-customer-commercial-convergence/' +
  'BAZI-R2-P5-SUBJECT-BOUND-LOCAL-RELEASE.json';

fs.writeFileSync(
  out,
  JSON.stringify(
    result,
    null,
    2
  ) + '\n'
);

console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);

sql.close();













