import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CommercialRuntimeError,
  createCommercialRuntime
} from '../functions/pws/commercial/commercial-runtime.js';
import {
  PaymentProviderRegistryError,
  createPaymentProviderRegistry,
  paymentProviderRegistry
} from '../functions/pws/commercial/payment-provider-registry.js';
import { productRuntime } from '../functions/pws/product/product-runtime.js';

let sequence = 0;
let tick = 0;
const clock = () => `2026-08-02T01:00:${String(tick++).padStart(2, '0')}.000Z`;
const createId = prefix => `${prefix}_${String(++sequence).padStart(32, '0')}`;

assert.deepEqual(
  paymentProviderRegistry.list().map(item => item.provider.provider_code).sort(),
  ['duitnow', 'fpx', 'stripe', 'touch-n-go-ewallet']
);
assert(paymentProviderRegistry.list().every(
  item => item.provider.registry_presence_is_production_requirement === false &&
    item.policy.production_required === false &&
    item.configuration.credentials_stored === false
));
assert.equal(paymentProviderRegistry.resolve('fpx').status.status, 'registered');
assert.equal(paymentProviderRegistry.resolve('stripe').provider.legacy_integration, true);

const futureRegistry = createPaymentProviderRegistry({ providers: [{
  provider_code: 'future-gateway',
  display_name: 'Future Gateway',
  provider_kind: 'future_provider',
  production_enabled: false,
  policy: {
    policy_code: 'future-gateway-policy',
    supported_currencies: ['MYR'],
    supported_regions: ['my'],
    supported_customer_segments: ['public-customer'],
    payment_methods: ['future_method']
  },
  configuration: {
    configuration_code: 'future-gateway-reference',
    environment: 'test',
    configuration_reference: 'FUTURE_PROVIDER_* environment bindings'
  },
  status: {
    status: 'available',
    checked_at: '2026-08-02T00:00:00.000Z',
    reason_code: 'test-fixture'
  }
}] });
assert.equal(futureRegistry.resolve('future-gateway').provider.production_enabled, false);

assert.throws(() => createPaymentProviderRegistry({ providers: [{
  provider_code: 'unsafe-provider',
  display_name: 'Unsafe Provider',
  provider_kind: 'gateway',
  policy: {
    policy_code: 'unsafe-policy',
    supported_currencies: ['MYR'],
    supported_regions: ['my'],
    supported_customer_segments: ['public-customer'],
    payment_methods: ['card']
  },
  configuration: {
    configuration_code: 'unsafe-config',
    environment: 'test',
    secret_key: 'must-not-be-stored'
  },
  status: { status:'registered',checked_at:'2026-08-02T00:00:00.000Z' }
}] }), error => error instanceof PaymentProviderRegistryError &&
  error.code === 'PWS_PAYMENT_PROVIDER_SECRET_FORBIDDEN');

const runtime = createCommercialRuntime({ clock, createId });
const bookOffer = runtime.resolveOffer('phios-book-one-zh-pdf-myr');
const bookPrice = runtime.resolvePrice(bookOffer.price_code);
assert.equal(bookOffer.product_code, 'phios-book-one-zh-pdf');
assert.equal(bookOffer.product_version, '1.0.0');
assert.equal('amount_minor' in bookOffer, false);
assert.equal(bookPrice.amount_minor, 8900);
assert.equal(bookPrice.currency_code, 'MYR');
assert.equal(bookPrice.product_code, null);
assert.equal(bookPrice.payment_provider_code, null);

const productBeforeFailure = JSON.stringify(
  productRuntime.resolveProduct(bookOffer.product_code)
);
let failedOrder = runtime.createOrder({
  customer_id: 'customer_fixture_failed',
  offer_code: bookOffer.offer_code
});
assert.equal(failedOrder.payment_id, null);
failedOrder = runtime.submitOrder(failedOrder.order_id);
const failedPayment = runtime.createPayment({ order_id: failedOrder.order_id });
assert.equal(failedPayment.provider_code, null);
assert.equal('payment_id' in failedOrder, true);
const failedAttempt = runtime.startPaymentAttempt({
  payment_id: failedPayment.payment_id,
  provider_code: 'stripe',
  payment_method: 'card'
});
assert.equal(failedAttempt.provider_code, 'stripe');
assert.equal(failedAttempt.provider_policy_code, 'stripe-book-policy');
runtime.recordPaymentAttemptResult({
  payment_attempt_id: failedAttempt.payment_attempt_id,
  result: 'failed',
  failure_code: 'provider-unavailable'
});
assert.equal(runtime.getPayment(failedPayment.payment_id).state, 'failed');
assert.equal(runtime.getOrder(failedOrder.order_id).state, 'pending_payment');
assert.equal(
  JSON.stringify(productRuntime.resolveProduct(bookOffer.product_code)),
  productBeforeFailure
);

let paidOrder = runtime.createOrder({
  customer_id: 'customer_fixture_paid',
  offer_code: bookOffer.offer_code
});
paidOrder = runtime.submitOrder(paidOrder.order_id);
const payment = runtime.createPayment({ order_id: paidOrder.order_id });
const attempt = runtime.startPaymentAttempt({
  payment_id: payment.payment_id,
  provider_code: 'stripe',
  payment_method: 'fpx'
});
runtime.recordPaymentAttemptResult({
  payment_attempt_id: attempt.payment_attempt_id,
  result: 'succeeded',
  provider_reference: 'external_fixture_reference'
});
assert.equal(runtime.getPayment(payment.payment_id).state, 'succeeded');
assert.equal(runtime.getOrder(paidOrder.order_id).state, 'confirmed');
const receipt = runtime.issuePaymentReceipt({
  payment_id: payment.payment_id,
  receipt_number: 'PHI-FIXTURE-0001'
});
assert.equal(receipt.amount_minor, 8900);
const refund = runtime.recordRefund({
  payment_id: payment.payment_id,
  amount_minor: 900,
  reason_code: 'customer-approved'
});
assert.equal(refund.amount_minor, 900);
assert.equal(runtime.getPayment(payment.payment_id).state, 'partially_refunded');
const settlement = runtime.recordSettlement({
  payment_id: payment.payment_id,
  provider_code: 'stripe',
  gross_amount_minor: 8900,
  fee_amount_minor: 300,
  net_amount_minor: 8600
});
assert.equal(settlement.net_amount_minor, 8600);

assert.throws(() => runtime.recordRefund({
  payment_id: payment.payment_id,
  amount_minor: 9000,
  reason_code: 'invalid-excess'
}), error => error instanceof CommercialRuntimeError &&
  error.code === 'PWS_REFUND_AMOUNT_INVALID');
assert.throws(() => runtime.recordSettlement({
  payment_id: payment.payment_id,
  provider_code: 'stripe',
  gross_amount_minor: 8900,
  fee_amount_minor: 300,
  net_amount_minor: 8500
}), error => error.code === 'PWS_SETTLEMENT_AMOUNT_INVALID');

const futureRuntime = createCommercialRuntime({
  providerRegistry: futureRegistry, clock, createId
});
let futureOrder = futureRuntime.createOrder({
  customer_id: 'customer_fixture_future',
  offer_code: 'phios-book-one-zh-pdf-myr'
});
futureOrder = futureRuntime.submitOrder(futureOrder.order_id);
const futurePayment = futureRuntime.createPayment({ order_id: futureOrder.order_id });
const futureAttempt = futureRuntime.startPaymentAttempt({
  payment_id: futurePayment.payment_id,
  provider_code: 'future-gateway',
  payment_method: 'future_method'
});
assert.equal(futureAttempt.provider_code, 'future-gateway');

let unavailableOrder = runtime.createOrder({
  customer_id: 'customer_fixture_unavailable',
  offer_code: 'phios-book-one-zh-pdf-myr'
});
unavailableOrder = runtime.submitOrder(unavailableOrder.order_id);
const unavailablePayment = runtime.createPayment({
  order_id: unavailableOrder.order_id
});
assert.throws(() => runtime.startPaymentAttempt({
  payment_id: unavailablePayment.payment_id,
  provider_code: 'fpx',
  payment_method: 'fpx'
}), error => error.code === 'PWS_PAYMENT_PROVIDER_NOT_AVAILABLE');

const contract = JSON.parse(fs.readFileSync(new URL(
  '../docs/pws/commercial/pws-i4-w2-commercial-runtime-contract-v1.json',
  import.meta.url
)));
assert.equal(contract.separationRules.offerOwnsProduct, false);
assert.equal(contract.separationRules.priceOwnsProduct, false);
assert.equal(contract.separationRules.orderOwnsPayment, false);
assert.equal(contract.separationRules.paymentOwnsProvider, false);
assert.equal(contract.providerRules.registryPresenceIsProductionRequirement, false);
assert.equal(contract.boundaries.createsEntitlement, false);
assert.equal(contract.boundaries.activatesJourney, false);
assert.equal(contract.freeze, 'PWS-I4-W2-Passed');

console.log('✓ PWS-I4-W2 Commercial Runtime passed.');
console.log('  Offer, Price, Order, Payment and Provider contracts remain separate.');
console.log("  Stripe, FPX, DuitNow, Touch 'n Go and future Provider registration are bounded by Policy and Status.");
console.log('  Provider failure changes no Product. Freeze: PWS-I4-W2-Passed.');
