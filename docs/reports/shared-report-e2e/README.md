# Shared Report Delivery E2E Proof — QA Runbook

Status: READY FOR LIVE TWO-SESSION PROOF
Source method: Zi Wei / ZWR
Composer: REPORT-PRO-COMPOSER-R1
Reference: ZIWEI-PROFESSIONAL-SYNTHESIS-R5
Model gate: gpt-5.6-sol

## Goal

Prove once:

real entitlement
→ canonical person
→ reference-governed T3 composition
→ semantic verifier PASS
→ immutable customer snapshot
→ private browser renderer PASS
→ released material
→ account library positive open
→ logout
→ new authenticated session
→ reopen same report
→ same semantic snapshot
→ same rendered output digest
→ no provider regeneration on reopen

This proof is shared infrastructure authority. It is not repeated end-to-end for every method.

## Prerequisites

- QA deployment contains the current main branch.
- The authenticated QA account already owns a real Stripe-test Zi Wei entitlement.
- The selected canonical person has REPORT and PERSONAL_METHOD consent.
- OPENAI_API_KEY is configured for QA.
- METHOD_REPORT_RENDERER private service binding is configured.
- PRIVATE_REPORTS and RUNTIME_DB are configured.

## Phase 1 — generate, verify, release and open

Run from Edge DevTools Console while signed in to QA. Replace `<PERSON_ID>` with the existing owned canonical person ID.

```js
const now = new Date();
const parts = new Intl.DateTimeFormat('en-CA', {
  year:'numeric', month:'2-digit', day:'2-digit',
  hour:'2-digit', minute:'2-digit', second:'2-digit',
  hour12:false
}).formatToParts(now).reduce((a,p)=>(a[p.type]=p.value,a),{});
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const offsetMin = -now.getTimezoneOffset();
const sign = offsetMin >= 0 ? '+' : '-';
const abs = Math.abs(offsetMin);
const offset = sign + String(Math.floor(abs/60)).padStart(2,'0') + ':' + String(abs%60).padStart(2,'0');
const targetContext = {
  targetDate: parts.year + '-' + parts.month + '-' + parts.day,
  targetTime: parts.hour + ':' + parts.minute + ':' + parts.second,
  targetTimezone: {iana: zone, utcOffsetAtTarget: offset},
  source: 'DEVICE_DEFAULT'
};
const phase1 = await fetch('/api/shared-report-e2e-proof', {
  method:'POST',
  credentials:'include',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({
    action:'generate-release-open',
    personId:'<PERSON_ID>',
    locale:'zh-Hans',
    targetContext
  })
}).then(r=>r.json());
console.log(phase1);
copy(JSON.stringify(phase1,null,2));
```

Required result:

```
ok = true
proof.state = PHASE1_RELEASED_AND_OPENED
proof.nextAction = LOGOUT_LOGIN_THEN_POST_REOPEN
```

Keep only the returned `proof.reportId`.

## Session break

Use the normal account Logout action. Complete provider logout if prompted, then sign in again through the normal QA login flow.

The final proof requires a different verified Auth0 session ID. Calling Phase 2 without a real logout/login must fail with:

`SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED`

## Phase 2 — reopen immutable material

After login, run:

```js
const phase2 = await fetch('/api/shared-report-e2e-proof', {
  method:'POST',
  credentials:'include',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({
    action:'reopen',
    reportId:'<REPORT_ID_FROM_PHASE_1>'
  })
}).then(r=>r.json());
console.log(phase2);
copy(JSON.stringify(phase2,null,2));
```

Final required result:

```
ok = true
proof.state = PASS
proof.sharedDeliveryAuthorityEligible = true
proof.admissionReceipt.state = PASS
```

The returned `admissionReceipt` is sanitized and safe to record in the public repo. Do not copy the private R2 proof object into Git.

## Shared reuse after PASS

Once the sanitized receipt is admitted, BaZi, Human Design, Cross, Astrology, ECR, Profile and Numerology do not repeat the shared Stripe/account/snapshot/reopen proof.

Each method still proves its own delta:

- method authority pack
- human-accepted editorial reference
- reference-governed composition
- method-specific renderer/page contract where different
- method-specific access-negative cases where applicable
