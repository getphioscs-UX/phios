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

const frozenPaths = [
  'scripts/check-bazi-r2-p5-subject-bound-release.mjs',
  'content/production-closure/live-customer-commercial-convergence/BAZI-R2-P5-FREEZE.json',
  'content/production-closure/live-customer-commercial-convergence/BAZI-R2-P5-2-FREEZE.json',
  'content/production-closure/live-customer-commercial-convergence/BAZI-R2-P5-SUBJECT-BOUND-LOCAL-RELEASE.json',
  'content/production-closure/live-customer-commercial-convergence/BAZI-R2-P5-2-GENG-VISIBLE-PARITY.json'
];
const frozenBefore = new Map(await Promise.all(frozenPaths.map(async p=>[p,await outputDigest(fs.readFileSync(p,'utf8'))])));
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
  throw Error('P6_EXTERNAL_NETWORK_FORBIDDEN');
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



/* P6: one delivered report, native four-slot history, and existing saved sources. */
import {generateAccountReportQuestion} from '../functions/account/paid-report-question-generation.js';
import {generatePaidReportFollowup} from '../functions/personal-reading/paid-report-followup.js';
import {readReportQuestionHistory} from '../functions/account/report-followup-store.js';
import {inspectReportBudget} from '../functions/personal-reading/report-generation-budget.js';
import {collectMyRealitySavedSources} from '../functions/account/my-reality-saved-sources.js';
import {onRequestGet as reportQuestionApi} from '../functions/api/account-report-questions.js';

const outputPath='content/production-closure/live-customer-commercial-convergence/BAZI-R2-P6-FOUR-FOLLOWUPS-MY-REALITY.json';
const receipts=[];
let syntheticTransportInvocations=0;
const beforeReplayFlag=process.env.REPORT_ZERO_COST_REPLAY;
process.env.REPORT_ZERO_COST_REPLAY='true';
// Local flags do not change persisted production admission or provider opt-in.
env.PHIOS_REPORT_FOLLOWUP_QA_ENABLED='true';
env.PHIOS_REPORT_FOLLOWUP_GENERATION_ENABLED='true';
env.PHIOS_MY_REALITY_SAVED_QA_ENABLED='true';
env.OPENAI_API_KEY='SYNTHETIC_PLACEHOLDER_NOT_A_CREDENTIAL';
env.REPORT_FOLLOWUP_MODEL_PROFILE=JSON.stringify({modelId:'P6_SYNTHETIC_LOCAL_NO_MODEL',pricingVerified:true,pricingSource:'SYNTHETIC_LOCAL_BUDGET_TEST_ONLY_NOT_PROVIDER_PRICING',pricingVerifiedAt:new Date(now).toISOString(),maxOutputTokens:256,inputPricePerMillion:0.1,cachedInputPricePerMillion:0,outputPricePerMillion:0.1});
const questions=[
 ['这份报告中最值得我先观察的工作模式是什么？','S04','可以先观察报告工作部分描述的责任、标准与支持条件，回到实际任务核对，不把结构当作已发生的职业事实。','Observe the responsibilities, standards and support conditions described in the work section against actual tasks. The structure does not establish career events.'],
 ['关系部分里，哪些地方适合回到现实互动验证？','S06','可以用报告关系部分作为观察线索，核对实际互动中的自主与靠近，不能据此推断伴侣的隐秘动机。','Use the relationship section as an observation cue for autonomy and closeness in actual interactions, without inferring a partner’s hidden motives.'],
 ['资源与财富部分最需要我长期观察的是什么？','S05','可以长期观察报告资源部分提到的收入、成本与支持条件，实际记录仍需由你提供，报告不保证财富结果。','Observe income, costs and support conditions discussed in the resource section over time. Actual records must come from you; the report does not guarantee wealth outcomes.'],
 ['当前时序应该怎样作为观察背景，而不是事件预测？','S10','可以把报告已提供的时序作为不同尺度的观察背景，保持未提供的事件未知，不补造新的命盘或时序事实。','Treat the supplied timing layers as observation context at different scales. Unprovided events remain unknown; no new natal or timing facts are introduced.']
];
const requestBody=i=>({reportId:release.reportId,requestId:`BAZI-R2-P6-FOLLOWUP-Q${i+1}`,question:questions[i][0],consentVersion:'P6-SYNTHETIC-CONSENT-v1'});
const readBudget=()=>completedBudgetStore.withLock('lifecycle',()=>completedBudgetStore.get('lifecycle'));
const history=()=>readReportQuestionHistory(env,{ownerAccountId:owner,reportId:release.reportId});
const objectSnapshot=()=>JSON.stringify([...objects].sort(([a],[b])=>a.localeCompare(b)));
const stateSnapshot=()=>JSON.stringify({history:sql.prepare('SELECT * FROM account_report_followup_questions ORDER BY request_id').all(),states:sql.prepare('SELECT * FROM report_generation_state ORDER BY namespace,state_key').all(),costs:sql.prepare('SELECT * FROM provider_product_cost_entries ORDER BY request_id').all(),objects:objectSnapshot()});
function syntheticTransport(index,{invalid=false}={}){return async(url,options)=>{
 assert.equal(url,'https://api.openai.com/v1/responses');
 // This injected function performs no fetch/socket operation. The address is only
 // the native adapter argument. Zero counters below are synthetic schema values,
 // explicitly NOT OpenAI token receipts or observed provider telemetry.
 const payload=JSON.parse(options.body),source=JSON.parse(payload.input[1].content);
 assert.equal(source.questionDigest,await outputDigest(invalid?'P6 isolated failed answer':questions[index][0]));
 const supplied=source.sections.find(s=>s.sectionId===questions[index][1]);assert(supplied);
 const h=await history(),row=h.rows.find(r=>r.question_digest===source.questionDigest);
 assert.equal(row.history_state,'RESERVED');assert.equal(h.grant.included_questions,4);
 assert.equal(h.grant.report_id,release.reportId);assert.equal(h.grant.purchase_id,prepared.purchaseId);
 // The native transport already holds the lifecycle lock here. Inspect only;
 // do not recursively acquire that same exclusive lock from the fixture.
 const ledger=JSON.parse(sql.prepare("SELECT value_json FROM report_generation_state WHERE state_key='lifecycle'").get().value_json);assert.equal(ledger.delivered,true);
 const reservation=ledger.requests[row.request_id];assert.equal(reservation.phase,'FOLLOWUP');assert(reservation.reservedUsd<=0.10);
 assert.equal(sql.prepare('SELECT count(*) n FROM digital_entitlements WHERE customer_id=? AND entitlement_status=?').get(owner,'active').n,1);
 syntheticTransportInvocations++;
 const answer={questionDigest:source.questionDigest,zhHans:questions[index][2],en:questions[index][3],supportRefs:invalid?['UNSUPPLIED-REF']:supplied.authorityRefs};
 receipts.push({kind:'SYNTHETIC_LOCAL_TRANSPORT_NO_PROVIDER',reportId:release.reportId,requestId:row.request_id,questionDigest:source.questionDigest,projectedMaximumUsd:reservation.reservedUsd,actualExternalCalls:0,actualSpendUSD:0,notOpenAITokenReceipt:true,invalidAnswer:invalid});
 return Response.json({status:'completed',output_text:JSON.stringify(answer),syntheticLocalReceipt:true,notOpenAITokenReceipt:true,usage:{input_tokens:0,output_tokens:0,input_tokens_details:{cached_tokens:0},source:'SYNTHETIC_SCHEMA_ZERO_COUNTERS_NOT_OBSERVED_PROVIDER_TOKENS'}});
};}
const generate=i=>generateAccountReportQuestion(ownerContext,requestBody(i),{fetcher:syntheticTransport(i)});
const apiContext=(who=owner)=>({...context(who),request:new Request(`https://controlled.test/api/account-report-questions?reportId=${release.reportId}`)});
try{
 const initial=await history();assert.equal(initial.grant.included_questions,4);assert.equal(initial.rows.length,0);
 const q1=await generate(0);assert.equal(q1.cacheHit,false);
 const beforeReplay=stateSnapshot(),callsBefore=syntheticTransportInvocations;
 const replay=await generate(0);assert.equal(replay.cacheHit,true);assert.equal(replay.providerCalls,0);assert.deepEqual(replay.answer,q1.answer);
 assert.equal(syntheticTransportInvocations,callsBefore);assert.equal(stateSnapshot(),beforeReplay);

 // Fork this same journey in a SQL savepoint; no unrelated purchase, grant or
 // hand-inserted answer. Native failure is observed, then test-only rollback
 // restores the successful journey so its four included answers remain intact.
 const savedObjects=new Map(objects);sql.exec('SAVEPOINT p6_isolated_failure');
 const completedQ1=JSON.stringify((await history()).rows[0]);
 let failureError;try{await generateAccountReportQuestion(ownerContext,{reportId:release.reportId,requestId:'BAZI-R2-P6-ISOLATED-FAILURE',question:'P6 isolated failed answer',consentVersion:'P6-SYNTHETIC-CONSENT-v1'},{fetcher:syntheticTransport(0,{invalid:true})});}catch(e){failureError=e.message;}
 assert.equal(failureError,'FOLLOWUP_SOURCE_VALIDATION_FAILED');
 const failedHistory=await history(),failedRow=failedHistory.rows.find(r=>r.request_id==='BAZI-R2-P6-ISOLATED-FAILURE');
 assert.equal(failedRow.history_state,'FAILED');assert.equal(failedRow.answer_object_key,null);
 assert.equal(JSON.stringify(failedHistory.rows.find(r=>r.request_id===requestBody(0).requestId)),completedQ1);
 const failureBudget=inspectReportBudget(await readBudget());assert.equal(failureBudget.unknownUsage,false);assert.equal(failureBudget.inFlight,false);assert.equal(failedHistory.includedRemaining,3);
 const failureProof={error:failureError,state:failedRow.history_state,completedAnswerCreated:false,completedQ1Unchanged:true,includedRemaining:failedHistory.includedRemaining,unknownUsage:failureBudget.unknownUsage,inFlight:failureBudget.inFlight,isolation:'SQL_SAVEPOINT_AND_PRIVATE_OBJECT_MAP_SNAPSHOT_OF_SAME_DELIVERED_REPORT'};
 sql.exec('ROLLBACK TO p6_isolated_failure; RELEASE p6_isolated_failure');objects.clear();for(const[k,v]of savedObjects)objects.set(k,v);
 assert.equal(stateSnapshot(),beforeReplay);
 for(let i=1;i<4;i++)await generate(i);
 const four=await history();assert.equal(four.rows.length,4);assert.equal(four.includedRemaining,0);
 for(const row of four.rows){assert.equal(row.history_state,'COMPLETE');const object=await env.PRIVATE_REPORTS.get(row.answer_object_key);assert(object);const raw=await object.text();assert.equal(await outputDigest(raw),row.answer_digest);const answer=JSON.parse(raw);assert.equal(answer.questionDigest,row.question_digest);assert.equal(answer.sourceSnapshotId,syntheticSnapshot.digest);assert(answer.zhHans&&answer.en&&answer.supportRefs.length);assert(answer.supportRefs.every(ref=>ref.startsWith(`BAZI:${native.pack.digest}:`)));}
 const immutable=stateSnapshot();const again=await generate(0);assert.deepEqual(again.answer,q1.answer);assert(again.cacheHit);assert.equal(again.providerCalls,0);assert.equal(stateSnapshot(),immutable);
 await assert.rejects(()=>generateAccountReportQuestion(ownerContext,{...requestBody(0),question:'Different immutable question'},{fetcher:syntheticTransport(0)}),/FOLLOWUP_IDEMPOTENCY_CONFLICT/);
 assert.equal(stateSnapshot(),immutable);
 // Native account adapter may offer a separate continuity product, which must
 // be denied here. Its rejection creates no fifth row/other entitlement.
 let accountQ5Error;try{await generateAccountReportQuestion(ownerContext,{...requestBody(0),requestId:'BAZI-R2-P6-FOLLOWUP-Q5',question:'第五个新的报告问题'},{fetcher:syntheticTransport(0)});}catch(e){accountQ5Error=e.message;}
 assert(accountQ5Error);assert.equal(stateSnapshot(),immutable);
 let fifthQuestionError;try{await generatePaidReportFollowup({env,binding:syntheticPaidBinding,request:{requestId:'BAZI-R2-P6-FOLLOWUP-Q5',phase:'FOLLOWUP',projectedMaximumUsd:0.1},question:'第五个新的报告问题',consentVersion:'P6-SYNTHETIC-CONSENT-v1',model:JSON.parse(env.REPORT_FOLLOWUP_MODEL_PROFILE),invoke:()=>{throw Error('FIFTH_TRANSPORT_MUST_NOT_RUN');},validateAnswer:()=>{throw Error('FIFTH_VALIDATOR_MUST_NOT_RUN');}});}catch(e){fifthQuestionError=e.message;}
 assert.equal(fifthQuestionError,'REPORT_FOUR_FOLLOWUPS_EXHAUSTED');assert.equal(stateSnapshot(),immutable);
 const budget=await readBudget(),budgetState=inspectReportBudget(budget);assert.equal(budget.delivered,true);assert.equal(budget.hardCapUsd,4);assert.equal(budget.followupReserveUsd,0.4);assert.equal(budget.includedFollowups,4);assert.equal(budgetState.followupsUsed,4);assert.equal(budgetState.unknownUsage,false);assert.equal(budgetState.inFlight,false);assert.equal(budgetState.spentUsd,0);
 const beforeReopen={producerCalls,rendererCalls,objects:objectSnapshot()};const reopened=await openAccountBaziMaterial(ownerContext,release.reportId);assert.equal(reopened.row.output_digest,opened1.row.output_digest);assert.equal(reopened.row.snapshot_id,opened1.row.snapshot_id);assert.equal(reopened.html,opened1.html);assert.equal(producerCalls,beforeReopen.producerCalls);assert.equal(rendererCalls,beforeReopen.rendererCalls);assert.equal(objectSnapshot(),beforeReopen.objects);
 const historyResponse=await reportQuestionApi(apiContext());assert.equal(historyResponse.status,200);const apiHistory=await historyResponse.json();assert.equal(apiHistory.items.length,4);assert(apiHistory.items.every(x=>x.historyState==='COMPLETE'&&x.answer));
 const sources=await collectMyRealitySavedSources(apiContext());const reportVisible=sources.reports.some(r=>r.id===release.reportId&&r.sourceClass==='PURCHASED_METHOD_REPORT');assert(reportVisible);
 const visibleQuestions=sources.history.filter(x=>x.reportId===release.reportId&&x.state==='COMPLETE'&&x.answer);const historyVisible=visibleQuestions.length===4;
 for(const row of visibleQuestions){assert.deepEqual(row.answer,apiHistory.items.find(x=>x.requestId===row.id).answer);}
 await assert.rejects(()=>readReportQuestionHistory(env,{ownerAccountId:otherOwner,reportId:release.reportId}),e=>e.message==='REPORT_UNAVAILABLE'&&e.status===404);
 await assert.rejects(()=>generateAccountReportQuestion(context(otherOwner),requestBody(0),{fetcher:syntheticTransport(0)}),e=>e.message==='REPORT_UNAVAILABLE'&&e.status===404);
 const denied=await reportQuestionApi(apiContext(otherOwner));const unknown=await reportQuestionApi({...apiContext(otherOwner),request:new Request('https://controlled.test/api/account-report-questions?reportId=NONEXISTENT')});assert.equal(denied.status,404);assert.equal(unknown.status,denied.status);assert.deepEqual(await denied.json(),await unknown.json());
 const otherSources=await collectMyRealitySavedSources(apiContext(otherOwner));assert(!otherSources.reports.some(r=>r.id===release.reportId));assert(!otherSources.history.some(r=>r.reportId===release.reportId||r.id===release.reportId));
 assert.equal((await history()).rows.length,4);assert.equal(followupCount,1);assert.equal(sql.prepare('SELECT count(*) n FROM account_report_followup_grants WHERE report_id=?').get(release.reportId).n,1);assert.equal(forbiddenExternalCalls,0);
 for(const[p,hash]of frozenBefore)assert.equal(await outputDigest(fs.readFileSync(p,'utf8')),hash,'Frozen P5 evidence changed: '+p);
 const result={status:historyVisible?'PASS_LOCAL':'PARTIAL',test:'BAZI_R2_P6_FOUR_FOLLOWUPS_MY_REALITY_ZERO_PROVIDER_LOCAL',P6_REPORT_AND_FOLLOWUPS:'PASS_LOCAL',P6_MY_REALITY_REPORT:'PASS_LOCAL',P6_MY_REALITY_FOLLOWUP_HISTORY:historyVisible?'PASS_LOCAL':'IMPLEMENTATION_GAP',customerId:owner,personId:person.personId,purchaseId:prepared.purchaseId,reportId:release.reportId,reportReopen:'PASS_LOCAL',sameReportId:reopened.row.report_id===release.reportId,sameMaterialDigest:true,sameSnapshot:true,followupGrantCreated:true,includedQuestions:4,completedQuestions:4,includedRemaining:0,q1ReplayCacheHit:replay.cacheHit,q1ReplayProviderCalls:replay.providerCalls,fifthQuestionDenied:true,fifthQuestionError,accountQ5Error,budgetDelivered:budget.delivered,hardCapUSD:budget.hardCapUsd,followupReserveUSD:budget.followupReserveUsd,followupsUsed:budgetState.followupsUsed,unknownUsage:budgetState.unknownUsage,inFlight:budgetState.inFlight,myRealityReportVisible:reportVisible,myRealityFollowupHistoryVisible:historyVisible,myRealitySchemaLimitation:historyVisible?null:'CURRENT_SCHEMA_NOT_PROJECTED',accountIsolation:'PASS_LOCAL',producerInvocations:producerCalls,rendererInvocations:rendererCalls,reopenProviderCalls:0,reopenRendererCalls:0,providerCalls:0,providerCostUSD:0,externalNetworkCalls:forbiddenExternalCalls,productionActivated:false,providerLiveAllowed:false,realPayment:false,deployed:false,liveCustomer:false,syntheticTransportInvocations,syntheticTransportSemantics:'Native result providerCalls=1 denotes one injected transport invocation, NOT an external provider call. Synthetic zero usage counters are schema fixtures, not OpenAI token receipts.',receipts,failureProof,budget,apiHistory,myReality:sources,immutability:'PASS_LOCAL',frozenEvidenceUnchanged:[...frozenBefore].map(([path,sha256])=>({path,sha256})),commit:'NOT PERFORMED',push:'NOT PERFORMED'};
 fs.writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,reportId:result.reportId,completedQuestions:4,myRealityReportVisible:reportVisible,myRealityFollowupHistoryVisible:historyVisible,providerCalls:0,externalNetworkCalls:0},null,2));
}catch(error){fs.writeFileSync(outputPath,JSON.stringify({status:'FAILED',test:'BAZI_R2_P6_FOUR_FOLLOWUPS_MY_REALITY_ZERO_PROVIDER_LOCAL',error:error.message,stack:error.stack,providerCalls:0,providerCostUSD:0,externalNetworkCalls:forbiddenExternalCalls,syntheticTransportInvocations,receipts,productionActivated:false,providerLiveAllowed:false,realPayment:false,deployed:false,liveCustomer:false},null,2));throw error;}finally{if(beforeReplayFlag===undefined)delete process.env.REPORT_ZERO_COST_REPLAY;else process.env.REPORT_ZERO_COST_REPLAY=beforeReplayFlag;sql.close();}
