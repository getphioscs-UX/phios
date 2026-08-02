import { productRuntime as defaultProductRuntime } from '../product/product-runtime.js';
import {
  paymentProviderRegistry as defaultProviderRegistry
} from './payment-provider-registry.js';

export const COMMERCIAL_RUNTIME_CONTRACT = 'phi-os.pws.commercial-runtime.v1';

const CODE_PATTERN = /^[a-z][a-z0-9-]*$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const PAYMENT_ATTEMPT_STATES = Object.freeze([
  'pending', 'processing', 'succeeded', 'failed', 'cancelled'
]);

export class CommercialRuntimeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CommercialRuntimeError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function requiredText(value, field) {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new CommercialRuntimeError(
      'PWS_COMMERCIAL_INVALID', `${field} is required.`, { field }
    );
  }
  return text;
}

function code(value, field) {
  const normalized = requiredText(value, field);
  if (!CODE_PATTERN.test(normalized)) {
    throw new CommercialRuntimeError(
      'PWS_COMMERCIAL_INVALID', `${field} is invalid.`,
      { field, value: normalized }
    );
  }
  return normalized;
}

function currencyCode(value) {
  const normalized = requiredText(value, 'currency_code');
  if (!CURRENCY_PATTERN.test(normalized)) {
    throw new CommercialRuntimeError(
      'PWS_CURRENCY_INVALID', 'currency_code must be ISO 4217 uppercase.',
      { currency_code: normalized }
    );
  }
  return normalized;
}

function minorAmount(value, field = 'amount_minor') {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new CommercialRuntimeError(
      'PWS_PRICE_INVALID', `${field} must be a non-negative safe integer.`,
      { field, value }
    );
  }
  return value;
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function defaultId(prefix) {
  const random = crypto.randomUUID().replaceAll('-', '');
  return `${prefix}_${random}`;
}

function normalizeCurrency(input) {
  return freeze({
    currency_code: currencyCode(input.currency_code),
    minor_unit_digits: Number.isSafeInteger(input.minor_unit_digits)
      ? input.minor_unit_digits
      : 2,
    active: input.active !== false
  });
}

function normalizeRegion(input) {
  return freeze({
    region_code: code(input.region_code, 'region_code'),
    display_name: requiredText(input.display_name, 'display_name'),
    active: input.active !== false
  });
}

function normalizeCustomerSegment(input) {
  return freeze({
    customer_segment_code: code(
      input.customer_segment_code, 'customer_segment_code'
    ),
    display_name: requiredText(input.display_name, 'display_name'),
    active: input.active !== false
  });
}

function normalizePrice(input, currencies) {
  const currency = currencyCode(input.currency_code);
  if (!currencies.has(currency) || currencies.get(currency).active !== true) {
    throw new CommercialRuntimeError(
      'PWS_CURRENCY_NOT_AVAILABLE', 'Price references an unavailable Currency.',
      { currency_code: currency }
    );
  }
  return freeze({
    price_code: code(input.price_code, 'price_code'),
    price_version: requiredText(input.price_version, 'price_version'),
    currency_code: currency,
    amount_minor: minorAmount(input.amount_minor),
    status: requiredText(input.status || 'active', 'status'),
    effective_at: requiredText(input.effective_at, 'effective_at'),
    product_code: null,
    payment_provider_code: null
  });
}

function normalizeOffer(input, context) {
  const product = context.productRuntime.resolveProduct(input.product_code);
  const productVersion = context.productRuntime.resolveProductVersion(
    product.product_code, input.product_version
  );
  const priceCode = code(input.price_code, 'price_code');
  const regionCode = code(input.region_code, 'region_code');
  const segmentCode = code(
    input.customer_segment_code, 'customer_segment_code'
  );
  if (!context.prices.has(priceCode)) {
    throw new CommercialRuntimeError(
      'PWS_PRICE_NOT_FOUND', 'Offer references an unknown Price.',
      { price_code: priceCode }
    );
  }
  if (!context.regions.has(regionCode)) {
    throw new CommercialRuntimeError(
      'PWS_REGION_NOT_FOUND', 'Offer references an unknown Region.',
      { region_code: regionCode }
    );
  }
  if (!context.segments.has(segmentCode)) {
    throw new CommercialRuntimeError(
      'PWS_CUSTOMER_SEGMENT_NOT_FOUND',
      'Offer references an unknown Customer Segment.',
      { customer_segment_code: segmentCode }
    );
  }
  return freeze({
    offer_code: code(input.offer_code, 'offer_code'),
    offer_version: requiredText(input.offer_version, 'offer_version'),
    display_name: requiredText(input.display_name, 'display_name'),
    product_code: product.product_code,
    product_version: productVersion.version,
    price_code: priceCode,
    region_code: regionCode,
    customer_segment_code: segmentCode,
    status: requiredText(input.status || 'active', 'status'),
    creates_entitlement: false,
    activates_journey: false
  });
}

export const DEFAULT_COMMERCIAL_DEFINITIONS = freeze({
  currencies: [
    { currency_code: 'MYR', minor_unit_digits: 2, active: true }
  ],
  regions: [
    { region_code: 'my', display_name: 'Malaysia', active: true }
  ],
  customer_segments: [
    { customer_segment_code: 'public-customer', display_name: 'Public Customer', active: true },
    { customer_segment_code: 'member', display_name: 'Member', active: true },
    { customer_segment_code: 'professional-customer', display_name: 'Professional Customer', active: true }
  ],
  prices: [
    { price_code:'reality-journey-pass-v1-myr',price_version:'1.0.0',currency_code:'MYR',amount_minor:500,status:'active',effective_at:'2026-07-30T00:00:00.000Z' },
    { price_code:'phios-book-one-zh-pdf-myr',price_version:'1.0.0',currency_code:'MYR',amount_minor:8900,status:'active',effective_at:'2026-07-19T00:00:00.000Z' }
  ],
  offers: [
    { offer_code:'reality-journey-pass-v1-myr',offer_version:'1.0.0',display_name:'Reality Journey Pass — MYR',product_code:'reality-journey-pass-v1',product_version:'1.0.0',price_code:'reality-journey-pass-v1-myr',region_code:'my',customer_segment_code:'public-customer',status:'active' },
    { offer_code:'phios-book-one-zh-pdf-myr',offer_version:'1.0.0',display_name:'《世界如何形成》第一册 — MYR',product_code:'phios-book-one-zh-pdf',product_version:'1.0.0',price_code:'phios-book-one-zh-pdf-myr',region_code:'my',customer_segment_code:'public-customer',status:'active' }
  ]
});

export function createCommercialRuntime(options = {}) {
  const productRuntime = options.productRuntime || defaultProductRuntime;
  const providerRegistry = options.providerRegistry || defaultProviderRegistry;
  const clock = options.clock || (() => new Date().toISOString());
  const createId = options.createId || defaultId;
  const definitions = options.definitions || DEFAULT_COMMERCIAL_DEFINITIONS;

  const currencies = new Map(
    definitions.currencies.map(input => {
      const record = normalizeCurrency(input);
      return [record.currency_code, record];
    })
  );
  const regions = new Map(
    definitions.regions.map(input => {
      const record = normalizeRegion(input);
      return [record.region_code, record];
    })
  );
  const segments = new Map(
    definitions.customer_segments.map(input => {
      const record = normalizeCustomerSegment(input);
      return [record.customer_segment_code, record];
    })
  );
  const prices = new Map(
    definitions.prices.map(input => {
      const record = normalizePrice(input, currencies);
      return [record.price_code, record];
    })
  );
  const offerContext = { productRuntime, prices, regions, segments };
  const offers = new Map(
    definitions.offers.map(input => {
      const record = normalizeOffer(input, offerContext);
      return [record.offer_code, record];
    })
  );

  for (const [name, map] of Object.entries({ currencies, regions, segments, prices, offers })) {
    const expected = definitions[
      name === 'segments' ? 'customer_segments' : name
    ].length;
    if (map.size !== expected) {
      throw new CommercialRuntimeError(
        'PWS_COMMERCIAL_DEFINITION_CONFLICT', `Duplicate ${name} definition.`
      );
    }
  }

  const orders = new Map();
  const payments = new Map();
  const attempts = new Map();
  const receipts = new Map();
  const refunds = new Map();
  const settlements = new Map();

  const get = (map, id, codeValue, label) => {
    const record = map.get(requiredText(id, `${label}_id`));
    if (!record) {
      throw new CommercialRuntimeError(codeValue, `${label} was not found.`, {
        [`${label.toLowerCase()}_id`]: id
      });
    }
    return record;
  };
  const replace = (map, id, patch) => {
    const next = freeze({ ...map.get(id), ...patch, updated_at: clock() });
    map.set(id, next);
    return next;
  };

  const runtime = {
    contract: COMMERCIAL_RUNTIME_CONTRACT,
    listCurrencies: () => freeze([...currencies.values()]),
    listRegions: () => freeze([...regions.values()]),
    listCustomerSegments: () => freeze([...segments.values()]),
    listOffers: () => freeze([...offers.values()]),
    listPrices: () => freeze([...prices.values()]),
    resolveOffer(offerCode) {
      const record = offers.get(code(offerCode, 'offer_code'));
      if (!record) throw new CommercialRuntimeError('PWS_OFFER_NOT_FOUND', 'Offer was not found.');
      return record;
    },
    resolvePrice(priceCode) {
      const record = prices.get(code(priceCode, 'price_code'));
      if (!record) throw new CommercialRuntimeError('PWS_PRICE_NOT_FOUND', 'Price was not found.');
      return record;
    },
    createOrder(input) {
      const offer = runtime.resolveOffer(input.offer_code);
      const price = runtime.resolvePrice(offer.price_code);
      const product = productRuntime.resolveProduct(offer.product_code);
      const productVersion = productRuntime.resolveProductVersion(
        product.product_code, offer.product_version
      );
      const now = clock();
      const order = freeze({
        order_id: createId('order'),
        customer_id: requiredText(input.customer_id, 'customer_id'),
        state: 'draft',
        offer_snapshot: offer,
        price_snapshot: price,
        product_reference: freeze({
          product_code: product.product_code,
          product_version: productVersion.version
        }),
        payment_id: null,
        creates_entitlement: false,
        activates_journey: false,
        created_at: now,
        updated_at: now
      });
      orders.set(order.order_id, order);
      return order;
    },
    submitOrder(orderId) {
      const order = get(orders, orderId, 'PWS_ORDER_NOT_FOUND', 'Order');
      if (order.state !== 'draft') {
        throw new CommercialRuntimeError('PWS_ORDER_STATE_INVALID', 'Only draft Order may be submitted.');
      }
      return replace(orders, order.order_id, { state: 'pending_payment' });
    },
    createPayment(input) {
      const order = get(orders, input.order_id, 'PWS_ORDER_NOT_FOUND', 'Order');
      if (order.state !== 'pending_payment') {
        throw new CommercialRuntimeError('PWS_ORDER_STATE_INVALID', 'Order is not pending payment.');
      }
      if ([...payments.values()].some(item => item.order_id === order.order_id)) {
        throw new CommercialRuntimeError('PWS_PAYMENT_CONFLICT', 'Order already has a Payment.');
      }
      const now = clock();
      const payment = freeze({
        payment_id: createId('pay'),
        order_id: order.order_id,
        state: 'pending',
        currency_code: order.price_snapshot.currency_code,
        amount_minor: order.price_snapshot.amount_minor,
        provider_code: null,
        created_at: now,
        updated_at: now
      });
      payments.set(payment.payment_id, payment);
      return payment;
    },
    startPaymentAttempt(input) {
      const payment = get(payments, input.payment_id, 'PWS_PAYMENT_NOT_FOUND', 'Payment');
      if (!['pending', 'processing'].includes(payment.state)) {
        throw new CommercialRuntimeError('PWS_PAYMENT_STATE_INVALID', 'Payment cannot start an attempt.');
      }
      const order = get(orders, payment.order_id, 'PWS_ORDER_NOT_FOUND', 'Order');
      const providerRecord = providerRegistry.resolve(input.provider_code);
      if (!['configured', 'available'].includes(providerRecord.status.status)) {
        throw new CommercialRuntimeError(
          'PWS_PAYMENT_PROVIDER_NOT_AVAILABLE',
          'Registered Payment Provider is not available for an attempt.',
          { provider_code: providerRecord.provider.provider_code }
        );
      }
      if (!providerRegistry.supports({
        provider_code: providerRecord.provider.provider_code,
        currency: payment.currency_code,
        region: order.offer_snapshot.region_code,
        customer_segment: order.offer_snapshot.customer_segment_code,
        payment_method: requiredText(input.payment_method, 'payment_method')
      })) {
        throw new CommercialRuntimeError(
          'PWS_PAYMENT_PROVIDER_POLICY_DENIED',
          'Payment Provider Policy does not support this attempt.'
        );
      }
      const now = clock();
      const attempt = freeze({
        payment_attempt_id: createId('pattempt'),
        payment_id: payment.payment_id,
        provider_code: providerRecord.provider.provider_code,
        provider_policy_code: providerRecord.policy.policy_code,
        payment_method: input.payment_method,
        state: 'processing',
        provider_reference: null,
        failure_code: null,
        created_at: now,
        updated_at: now
      });
      attempts.set(attempt.payment_attempt_id, attempt);
      replace(payments, payment.payment_id, { state: 'processing' });
      return attempt;
    },
    recordPaymentAttemptResult(input) {
      const attempt = get(
        attempts, input.payment_attempt_id,
        'PWS_PAYMENT_ATTEMPT_NOT_FOUND', 'PaymentAttempt'
      );
      if (!PAYMENT_ATTEMPT_STATES.includes(input.result) ||
          !['succeeded', 'failed'].includes(input.result) ||
          attempt.state !== 'processing') {
        throw new CommercialRuntimeError(
          'PWS_PAYMENT_ATTEMPT_STATE_INVALID', 'Payment Attempt result is invalid.'
        );
      }
      const payment = get(payments, attempt.payment_id, 'PWS_PAYMENT_NOT_FOUND', 'Payment');
      const nextAttempt = replace(attempts, attempt.payment_attempt_id, {
        state: input.result,
        provider_reference: input.provider_reference == null
          ? null
          : requiredText(input.provider_reference, 'provider_reference'),
        failure_code: input.result === 'failed'
          ? code(input.failure_code || 'provider-failed', 'failure_code')
          : null
      });
      const nextPayment = replace(payments, payment.payment_id, {
        state: input.result === 'succeeded' ? 'succeeded' : 'failed'
      });
      if (input.result === 'succeeded') {
        replace(orders, payment.order_id, { state: 'confirmed' });
      }
      return freeze({ attempt: nextAttempt, payment: nextPayment });
    },
    issuePaymentReceipt(input) {
      const payment = get(payments, input.payment_id, 'PWS_PAYMENT_NOT_FOUND', 'Payment');
      if (payment.state !== 'succeeded') {
        throw new CommercialRuntimeError('PWS_PAYMENT_STATE_INVALID', 'Receipt requires succeeded Payment.');
      }
      if ([...receipts.values()].some(item => item.payment_id === payment.payment_id)) {
        throw new CommercialRuntimeError('PWS_PAYMENT_RECEIPT_CONFLICT', 'Receipt already exists.');
      }
      const receipt = freeze({
        payment_receipt_id: createId('receipt'),
        payment_id: payment.payment_id,
        order_id: payment.order_id,
        receipt_number: requiredText(input.receipt_number, 'receipt_number'),
        currency_code: payment.currency_code,
        amount_minor: payment.amount_minor,
        issued_at: clock()
      });
      receipts.set(receipt.payment_receipt_id, receipt);
      return receipt;
    },
    recordRefund(input) {
      const payment = get(payments, input.payment_id, 'PWS_PAYMENT_NOT_FOUND', 'Payment');
      if (!['succeeded', 'partially_refunded'].includes(payment.state)) {
        throw new CommercialRuntimeError('PWS_PAYMENT_STATE_INVALID', 'Payment cannot be refunded.');
      }
      const previous = [...refunds.values()]
        .filter(item => item.payment_id === payment.payment_id)
        .reduce((sum, item) => sum + item.amount_minor, 0);
      const amount = minorAmount(input.amount_minor);
      if (amount < 1 || previous + amount > payment.amount_minor) {
        throw new CommercialRuntimeError('PWS_REFUND_AMOUNT_INVALID', 'Refund exceeds Payment balance.');
      }
      const refund = freeze({
        refund_id: createId('refund'),
        payment_id: payment.payment_id,
        amount_minor: amount,
        currency_code: payment.currency_code,
        reason_code: code(input.reason_code, 'reason_code'),
        state: 'confirmed',
        recorded_at: clock()
      });
      refunds.set(refund.refund_id, refund);
      replace(payments, payment.payment_id, {
        state: previous + amount === payment.amount_minor
          ? 'refunded'
          : 'partially_refunded'
      });
      return refund;
    },
    recordSettlement(input) {
      const payment = get(payments, input.payment_id, 'PWS_PAYMENT_NOT_FOUND', 'Payment');
      if (!['succeeded', 'partially_refunded', 'refunded'].includes(payment.state)) {
        throw new CommercialRuntimeError('PWS_PAYMENT_STATE_INVALID', 'Settlement requires confirmed Payment facts.');
      }
      const settlement = freeze({
        settlement_id: createId('settlement'),
        payment_id: payment.payment_id,
        provider_code: code(input.provider_code, 'provider_code'),
        currency_code: payment.currency_code,
        gross_amount_minor: minorAmount(input.gross_amount_minor, 'gross_amount_minor'),
        fee_amount_minor: minorAmount(input.fee_amount_minor, 'fee_amount_minor'),
        net_amount_minor: minorAmount(input.net_amount_minor, 'net_amount_minor'),
        state: requiredText(input.state || 'settled', 'state'),
        settled_at: clock()
      });
      if (settlement.gross_amount_minor - settlement.fee_amount_minor !==
          settlement.net_amount_minor) {
        throw new CommercialRuntimeError(
          'PWS_SETTLEMENT_AMOUNT_INVALID', 'Settlement amounts do not reconcile.'
        );
      }
      providerRegistry.resolve(settlement.provider_code);
      settlements.set(settlement.settlement_id, settlement);
      return settlement;
    },
    getOrder: id => get(orders, id, 'PWS_ORDER_NOT_FOUND', 'Order'),
    getPayment: id => get(payments, id, 'PWS_PAYMENT_NOT_FOUND', 'Payment'),
    getPaymentAttempt: id => get(
      attempts, id, 'PWS_PAYMENT_ATTEMPT_NOT_FOUND', 'PaymentAttempt'
    )
  };

  return Object.freeze(runtime);
}

export const commercialRuntime = createCommercialRuntime();
