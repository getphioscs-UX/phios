# AUTH EXTERNAL CONFIGURATION COMPLETE

Production:
AUTH_PROVIDER=auth0
AUTH_ISSUER=https://auth.getphios.com/
AUTH_CLIENT_ID=<configured in Cloudflare>
AUTH_CLIENT_SECRET=<configured as encrypted Cloudflare secret>
AUTH_SESSION_SECRET=<configured as encrypted Cloudflare secret>

Preview / QA:
AUTH_PROVIDER=auth0
AUTH_ISSUER=https://dev-2g55joboofph0ax7.us.auth0.com/
AUTH_CLIENT_ID=<configured in Cloudflare>
AUTH_CLIENT_SECRET=<configured as encrypted Cloudflare secret>
AUTH_SESSION_SECRET=<configured as independent encrypted Cloudflare secret>

Do not create or request any password storage.
Use OIDC discovery from AUTH_ISSUER.
Do not hardcode Auth0 canonical domain.
Production must use the configured custom-domain issuer consistently.
Preview must use the configured default tenant issuer consistently.

### PHI OS｜Financial + Will Production Successor

## FW-S1 → FW-S10 Full Production Master Work

**Execution baseline:**
`d9e727d4223dc6f3e411a704ceb46beb66e08840`

**Branch:**
`main`

**Repository:**
`getphioscs-UX/phios`

**Execution mode:**
Continue from the existing Financial + Will successor implementation. Do not restart the work, do not replace the existing Financial route, and do not create parallel Financial, Will, Relationship, Account, Report, Commerce, Professional, Reality, or Ask runtimes.

The supplied prior `MASTER-WORK.md` remains preserved verbatim as historical execution authority. This successor closes the remaining production gaps identified after the implementation at the execution baseline above.

---

# 0｜MISSION

Complete the existing Financial + Will customer journey through production while introducing a reusable, account-bound **People & Relationships context** so customers do not repeatedly enter the same spouse, child, dependent, family-member, partner, beneficiary, executor, or other-person data across:

- Financial planning

- Family financial planning

- Will / estate intake

- Relationship Runtime

- Astrology relationship use

- BaZi relationship use

- Zi Wei relationship use

- Human Design relationship use

- Numerology relationship use

- Tarot contextual readings

- I Ching contextual readings

- Personal reports

- My Reality

- Account continuity

- Released-report Ask


This shared layer is a governed data/reference layer.

It is **not** a new Relationship Runtime.

It is **not** a new Financial Runtime.

It is **not** a new Will Runtime.

It is **not** a replacement for RDG, My Reality, FDR, DAR, RLR, PFR, RR, Commerce, or existing method authority.

---

# 1｜CURRENT CANONICAL AUTHORITIES TO PRESERVE

Before changing code, inspect and preserve at minimum:

```text
content/customer-experience-rebuild/contracts/my-reality-workspace-contract-v1.json

content/governance/lens-router/successors/relationship-route-successor-v2.json
content/governance/relational/contracts/two-person-input-consent-contract-v1.json

content/financial/data-runtime/contracts/financial-person-contract-v1.json
content/financial/data-runtime/contracts/financial-household-contract-v1.json
content/financial/data-runtime/contracts/financial-fact-contract-v1.json
content/financial/data-runtime/contracts/financial-reality-snapshot-contract-v1.json
content/financial/data-runtime/contracts/financial-change-event-contract-v1.json
content/financial/data-runtime/contracts/financial-data-consent-contract-v1.json
content/financial/data-runtime/contracts/financial-data-retention-contract-v1.json
content/financial/data-runtime/contracts/fdr-dar-cross-consumption-binding-v1.json

content/document-assembly/contracts/person-role-contract-v1.json
content/document-assembly/contracts/dar-fdr-consumption-binding-v1.json

content/legal/will/schemas/will-intake-v1.schema.json
content/legal/will/contracts/will-sensitive-data-classification-v1.json
content/legal/will/contracts/will-data-retention-contract-v1.json
content/legal/will/contracts/will-download-privacy-contract-v1.json
content/legal/will/contracts/will-share-integrity-contract-v1.json

functions/professional/financial/testamentary-security-v1.js

content/financial/professional-review/authority/financial-professional-authority-successor-v1.json
content/financial/professional-review/contracts/professional-financial-review-state-machine-v1.json
content/financial/professional-review/contracts/professional-financial-review-signature-contract-v1.json

content/financial/holistic-planning-product/contracts/hfp-rr-handoff-contract-v1.json

content/runtime/customer-report-runtime/contracts/report-candidate-contract-v2.json

functions/account/account-contract.js
functions/account/my-reality-account-projection.js
functions/symbolic-method-persistence/symbolic-account-identity-v1.js

functions/commerce/commerce-stripe-api.js

db/migrations/0001_platform_foundation.sql
db/migrations/0003_financial_professional_infrastructure.sql
db/migrations/0005_pws_universal_registry.sql
db/migrations/0006_commerce_stripe_r1.sql
```

Do not weaken an existing frozen authority merely to make acceptance pass.

Where a frozen contract is incompatible with production requirements, create a versioned successor and explicit predecessor/successor binding.

---

# 2｜GLOBAL INVARIANTS

These invariants are mandatory for FW-S1 through FW-S10:

```text
NO_PARALLEL_FINANCIAL_RUNTIME_CREATED
NO_PARALLEL_WILL_RUNTIME_CREATED
NO_PARALLEL_RELATIONSHIP_RUNTIME_CREATED
NO_PARALLEL_ACCOUNT_RUNTIME_CREATED
NO_PARALLEL_REPORT_RUNTIME_CREATED
NO_PARALLEL_COMMERCE_RUNTIME_CREATED
NO_PARALLEL_PROFESSIONAL_RUNTIME_CREATED

NO_MODEL_GENERATED_FINANCIAL_CALCULATION
NO_MODEL_GENERATED_PROFESSIONAL_JUDGMENT
NO_MODEL_GENERATED_LEGAL_VALIDITY
NO_AUTOMATIC_LEGAL_APPOINTMENT
NO_AUTOMATIC_BENEFICIARY_INFERENCE
NO_AUTOMATIC_OWNERSHIP_INFERENCE

NO_FULL_IDENTITY_NUMBER_DRAFT_STORAGE
NO_RAW_FINANCIAL_OR_WILL_PAYLOAD_IN_ANALYTICS
NO_RAW_FINANCIAL_OR_WILL_PAYLOAD_IN_LOGS
NO_PUBLIC_R2_WILL_DOCUMENT
NO_PUBLIC_PERMANENT_REPORT_URL
NO_LOCALSTORAGE_FOR_PRODUCTION_FINANCIAL_OR_WILL_DRAFT
NO_SESSIONSTORAGE_FOR_PRODUCTION_FINANCIAL_OR_WILL_DRAFT

PAYMENT_IS_NOT_PROFESSIONAL_PERMISSION
PAYMENT_IS_NOT_LEGAL_APPROVAL
ENTITLEMENT_IS_NOT_PROFESSIONAL_PERMISSION

RELEASED_FACTS_ONLY_FOR_ASK
```

---

# 3｜TARGET CUSTOMER ARCHITECTURE

The production customer model shall become:

```text
VERIFIED CUSTOMER ACCOUNT
        │
        ├── My Reality
        │     │
        │     ├── People & Relationships
        │     ├── Financial Reality
        │     ├── Current / Personal Reality
        │     ├── Drafts
        │     ├── Reports
        │     └── Continuity
        │
        ├── Commerce / Entitlements
        │
        └── Account Privacy / Consent
```

People & Relationships becomes a reusable account-owned reference surface:

```text
ACCOUNT
  ↓
PEOPLE DIRECTORY
  ↓
PERSON REFERENCES
  ↓
PURPOSE-SCOPED CONSENT
  ↓
ADAPTERS
  ├── Personal methods
  ├── Relationship Runtime
  ├── FDR household
  ├── DAR / Will
  ├── Tarot context
  ├── I Ching context
  └── Released-report Ask
```

There must be one reusable `personId` per saved person.

Individual domain owners retain their own domain-specific semantics.

Example:

```text
Person = shared reference object
Spouse = customer-declared relationship context

Financial household member = FDR role
Beneficiary = DAR customer instruction
Executor = DAR customer instruction
Relationship participant = RLR subject reference

These are NOT interchangeable.
```

---

# 4｜PEOPLE & RELATIONSHIPS DATA MODEL

Introduce a governed shared person-reference layer under existing RDG / My Reality continuity authority.

Do not make FDR the general-purpose person owner.

Do not make DAR the general-purpose person owner.

Do not make Relationship Runtime the person database.

A saved person may have:

```text
personId
accountOwnerUserId
linkedUserId                 optional
subjectClass
displayName

relationshipToAccountOwner
relationshipVerificationState

birthDate                    optional
birthTime                    optional
birthTimePrecision           optional
birthPlace                   optional

residencyJurisdiction        optional

minorOrDependentState        optional

createdAt
updatedAt
version
```

Allowed subject classes should include at minimum:

```text
SELF
DEPENDENT
DECLARED_THIRD_PARTY
LINKED_ADULT_ACCOUNT
```

Relationship verification state must distinguish:

```text
SELF_DECLARED
GUARDIAN_DECLARED
BILATERAL_CONFIRMED
UNVERIFIED
```

Never convert `SELF_DECLARED` to `BILATERAL_CONFIRMED` automatically.

Never merge two accounts merely because names and birth dates match.

---

# 5｜PURPOSE-SCOPED PERSON USE

Each reusable person must support explicit purpose scopes.

At minimum:

```text
PERSONAL_METHOD
RELATIONSHIP_READING
FINANCIAL_PLANNING
WILL_ASSEMBLY
PROFESSIONAL_REVIEW
REPORT
TAROT_CONTEXT
ICHING_CONTEXT
ASK_PERSONALIZATION
```

Purpose consent must include:

```text
consentId
personId
grantingSubjectReference
purposeScope
dataScopes
grantedAt
expiresAt
revocationState
consentVersion
authorityBasis
```

No wildcard purpose.

No default grant-all.

No checkbox may silently grant unrelated scopes.

---

# 6｜DATA MINIMIZATION BY CONSUMER

## Personal methods

May consume only required saved profile/birth data.

## Relationship Runtime

May consume:

```text
personId
display name
relationship context
method-required personal inputs
```

For two adult subjects, retain existing bilateral active-consent requirement.

A relationship label entered by one user does not constitute the other adult's consent.

## Financial planning

May consume:

```text
personId
household role
dependency state
birth/age data when calculation requires it
financial facts explicitly admitted to FDR
```

## Will

May consume:

```text
personId
name
declared Will role
relevant contact/address/identity information
```

Will roles must remain separate customer declarations.

## Tarot / I Ching

Normally consume only:

```text
personId
display label
relationship context
question context
```

Do not send birth data, financial facts, address or identity data unless a separate method contract explicitly requires them.

---

# FW-S1｜CONTRACT + PRIVACY RECONCILIATION

## Objective

Resolve the current conflict between:

```text
person-role-contract-v1.json
```

which requires:

```text
idNumber
address
```

and:

```text
testamentary-security-v1.js
```

which states:

```text
fullIdentityNumberStorageAllowed: false
```

without inventing dummy identity values or weakening security.

---

## S1.1 Person Role successor

Create a versioned successor for the DAR person role contract.

Do not mutate frozen v1 in place if it is frozen authority.

The persisted person-role successor must NOT require a persistable full identity number.

Persisted role object shall support:

```text
personId
fullName
idType
identityCaptureState
identityReferenceLast4       optional
address
addressCaptureState
relationship
contact
nationality
roles
```

`roles` continues to include governed Will roles.

The successor must explicitly state:

```text
roleDoesNotCreateLegalAppointment = true
fullIdentityNumberPersisted = false
fullIdentityNumberMayBeFinalizationOnly = true
```

---

## S1.2 Ephemeral finalization identity

Create a separate Will finalization identity contract.

It may receive full identity data only for:

```text
FINAL_REVIEW
PRIVATE_DOCUMENT_RENDER
LEGAL_REVIEW_HANDOFF
```

Rules:

```text
memoryOnly = true
logForbidden = true
analyticsForbidden = true
urlForbidden = true
queryStringForbidden = true
draftPersistenceForbidden = true
automaticRetentionForbidden = true
```

If the final private Will/PDF legitimately contains the identity value, the finished private document remains governed by Will private-document storage requirements.

This does not authorize storing raw identity input in ordinary draft/state tables.

---

## S1.3 Shared People contracts

Create or version the minimum contracts needed for:

```text
ACCOUNT_PERSON_REFERENCE
PERSON_RELATIONSHIP_REFERENCE
PURPOSE_SCOPED_PERSON_USE
```

Place data authority under the existing RDG / My Reality authority, not RLR/FDR/DAR.

Before creating a contract, census the repo for an equivalent canonical owner.

Reuse an existing owner if found.

---

## S1.4 Adult / minor rules

Preserve:

```text
adultHouseholdMembersRequireSeparateConsent = true
minorRequiresRecordedAuthorityBasis = true
```

Relationship Runtime keeps bilateral consent.

Will may record the testator's declared beneficiary/executor/guardian person without pretending that person has accepted an appointment.

---

## S1 acceptance

Create:

```text
scripts/check-fw-s1-contract-privacy.mjs
```

It must prove at least:

```text
PASS no persisted full id number
PASS no dummy identity
PASS no inferred address
PASS v1 authority preserved
PASS successor relationship explicit
PASS adult consent boundary
PASS minor authority basis
PASS purpose scopes fail closed
PASS no new runtime authority
```

Commit only after targeted check and `npm.cmd run check` pass.

---

# FW-S2｜FULL CANONICAL WILL SCHEMA ROUND TRIP

## Objective

Upgrade the current working subset into the complete canonical Will intake and round trip.

---

## S2.1 Will schema successor

Create a versioned Will intake successor referencing the reconciled person-role successor.

Preserve all existing canonical categories:

```text
testator
jurisdiction
domicile

executors
substituteExecutors

guardians
substituteGuardians

beneficiaries

witnesses
digitalFacilitators
translators

properties
businessInterests
bankAssets
investments
insurance
epf
prs
vehicles
jewellery
digitalAssets
otherAssets

specificGifts
residuaryDistribution
trustInstructions
digitalAssetInstructions

language
translatorRequired
```

---

## S2.2 Full specialized fields

Complete customer-facing support for:

```text
nomination state

EPF nomination
EPF intended treatment
PRS nomination/treatment

insurance nomination
insurance treatment

trust instructions
trustees where admitted
trust conditions

substitute beneficiaries

business succession
business continuity intent

translator
language confirmation

witness requirements / declarations

survivorship condition
age condition
trust condition

specific gift
percentage gift
equal-share gift
residue share
per-asset distribution
class distribution

custom/special condition
```

Do not convert customer intent into legal advice.

Use:

```text
CUSTOMER_DECLARATION
REQUIRES_LEGAL_REVIEW
UNKNOWN
NOT_APPLICABLE
```

where appropriate.

---

## S2.3 People reuse UI

At each Will person-selection point show saved people first.

Example:

```text
Choose a person

☑ Use Husband from My Reality
☐ Add another person
```

Selecting the person does NOT automatically assign the Will role.

The customer must separately choose:

```text
BENEFICIARY
EXECUTOR
SUBSTITUTE_EXECUTOR
GUARDIAN
SUBSTITUTE_GUARDIAN
WITNESS
TRANSLATOR
DIGITAL_FACILITATOR
```

---

## S2.4 Direct entry remains available

Customers without saved People entries must still be able to enter Will data directly.

Direct entry and reused-person entry must produce the same canonical Will intake object.

---

## S2.5 Round trip

Prove:

```text
UI
→ canonical intake object
→ validation
→ approval snapshot
→ DAR
→ report
→ private render
→ re-open/review
```

without dropping specialized fields.

---

## S2.6 Distribution integrity

All percentage models must invoke existing share-integrity authority.

Fail closed on:

```text
99%
101%
negative %
missing beneficiary
invalid asset ref
invalid substitute ref
```

No silent balancing.

---

## S2 acceptance

Add a machine checker proving every canonical field survives UI → schema → report round trip.

No specialized field may exist only in schema while being inaccessible to the customer.

---

# FW-S3｜FINANCIAL INVENTORY + REVISION + SCENARIO COMPLETION

## Objective

Complete Financial Reality without creating a second calculation engine.

---

## S3.1 Canonical source

Continue:

```text
FDR → FCR → FAR → HFP
```

Do not calculate outside FCR.

Do not generate findings outside FAR.

Do not generate professional advice outside PFR.

---

## S3.2 Inventory completeness

Complete support for:

```text
household members
dependants

income streams
salary
business income
rental income
investment income
irregular income
other income

expenses
fixed
variable
annual
irregular

cash
bank
fixed deposits
property
investment
business interests
EPF
PRS
insurance cash values
vehicles
digital / other assets

liabilities
mortgage
personal loan
vehicle loan
business debt
credit facilities
other debt

guarantees

protection
life
TPD
critical illness
medical

financial goals
education
retirement
property
liquidity
protection
estate
business continuity
other goals

explicit assumptions
```

---

## S3.3 Unknowns must survive persistence

Existing canonical FDR rules state:

```text
UNKNOWN ≠ 0
DECLINED ≠ 0
NOT_PROVIDED ≠ 0
RANGE ≠ exact number
APPROXIMATE ≠ exact number
```

Audit `0003_financial_professional_infrastructure.sql`.

Do NOT persist canonical FDR through any legacy table constraint that silently:

```text
defaults ownership to 100%
requires missing amount to become zero
collapses a range
forces unknown into exact
```

If the existing D1 table semantics cannot represent the FDR Fact Envelope correctly, create an additive canonical FDR persistence successor.

Do not rewrite deployed migrations.

---

## S3.4 Revision history

Use existing:

```text
financial-change-event-contract-v1
financial-reality-snapshot-contract-v1
```

Every committed edit creates:

```text
change event
→ validated change
→ new immutable snapshot
→ new digest
```

No in-place mutation of historical FDR snapshots.

---

## S3.5 Scenario comparison

Use existing:

```text
financial-scenario-contract
financial-scenario-comparison-contract
```

Do not create scenario math in the UI.

Support explicit customer-selectable comparison such as:

```text
Current
Scenario A
Scenario B
```

but FCR remains the calculation authority.

---

## S3.6 Capacity/load interpretation

Expose all governed FCR/FAR capacity/load results required by the master work.

Missing inputs must result in an explicit unknown/insufficient state rather than invented confidence.

---

# FW-S4｜ACCOUNT-BOUND ENCRYPTED DRAFT PERSISTENCE

## Objective

Install the missing production Customer Account identity layer and encrypted Financial/Will drafts.

---

# S4.1 Existing account foundation

Reuse:

```text
users
runtime_entities
```

from:

```text
db/migrations/0001_platform_foundation.sql
```

Reuse `/account`.

Do not create a second account system.

---

## S4.2 Authentication provider

Current account contract is preview-only.

Production requires a real external authentication provider.

Do NOT build a home-grown password database.

Do NOT persist customer passwords in D1.

Codex shall implement an authentication-provider adapter and trusted server identity bridge.

The provider must support at minimum:

```text
registration
login
email verification
password recovery or equivalent account recovery
logout
verified server identity
stable subject identifier
```

Production request identity must become:

```text
context.data.symbolicAccountIdentity = {
  userId,
  providerId,
  sessionId,
  verified: true,
  authenticated: true
}
```

Only trusted server middleware may set this.

Never trust:

```text
request body userId
query userId
arbitrary header userId
client localStorage identity
```

---

## S4.3 Account middleware

Introduce server middleware covering protected APIs.

It shall:

```text
verify provider session/token
resolve stable provider subject
map/create PHI OS user
set trusted identity context
set CKA account access context
continue request
```

Commerce must then reuse the same verified identity already expected by:

```text
functions/commerce/commerce-stripe-api.js
```

---

## S4.4 User mapping

The PHI OS `users.user_id` is the canonical application user identifier.

The authentication provider subject must be mapped server-side.

Never derive account identity from email alone.

Email changes must not create a second user automatically.

---

## S4.5 People persistence

Add account-bound People & Relationships persistence.

Recommended logical records:

```text
account_people
account_relationships
account_person_consents
```

Exact names may follow existing repo conventions.

Every row must be account scoped.

Cross-account access must fail closed.

---

## S4.6 Encrypted drafts

Financial and Will saved drafts must be encrypted at the application/storage boundary.

Use Web Crypto / AES-GCM or an already governed encryption owner if present.

Encryption key comes from Cloudflare Secret.

Never commit encryption key.

Suggested logical draft record:

```text
draftId
userId
draftType
schemaVersion
objectVersion
ciphertext
iv
keyVersion
digest
retentionId
consentId
createdAt
updatedAt
status
```

Allowed draft types:

```text
FINANCIAL
WILL
```

Will draft ciphertext must still exclude full raw identity number if the security policy forbids persistent full identity storage.

---

## S4.7 Save UX

Customer must explicitly choose:

```text
Save securely to my account
```

Do not silently turn an ephemeral guest intake into persistent account data.

---

## S4.8 Guest mode

Guest users may continue to use the existing ephemeral intake where allowed.

Guest mode may produce:

```text
temporary intake
preliminary local result
local print where already governed
```

Guest mode may NOT provide:

```text
production save
restore
cross-device continuity
purchase ownership
released-report account history
private stored Will
```

---

## S4.9 Manual external gate

Codex must emit a deployment checklist for the project owner.

Do not claim production Account acceptance until the project owner has configured the authentication provider and Cloudflare secrets.

Required values will depend on the chosen provider but normally include:

```text
AUTH_ISSUER
AUTH_CLIENT_ID
AUTH_CLIENT_SECRET
AUTH_JWKS_URL / provider equivalent
AUTH_CALLBACK_URL
```

The project owner performs provider-console / Cloudflare-secret actions.

Repository code remains Codex-owned.

---

# FW-S5｜FDR → DAR CANONICAL LINEAGE CUTOVER

## Objective

Retire the temporary conceptual model of “copy financial data into Will”.

Use the existing canonical FDR → DAR read-only binding.

---

## S5.1 Required lineage

Every Will use of an FDR fact must retain:

```text
financialRealityId
financialRealityVersion
financialRealityDigest
snapshotId
snapshotDigest
factId
```

---

## S5.2 Explicit consent

Financial Planning consent does not authorize Will use.

Before DAR consumes FDR facts:

```text
WILL_ASSEMBLY consent = required
```

Show the customer what will be reused.

---

## S5.3 No copy authority

DAR may reference authorized FDR facts.

DAR may not become the owner of the financial fact.

DAR may not silently mutate:

```text
asset value
ownership
currency
account holder
property status
financial beneficiary
```

---

## S5.4 Estate inclusion remains separate

For every referenced asset, Will UI asks separately:

```text
Include for Will review?

YES
NO
UNSURE
```

This is a customer estate-planning declaration.

It is not a legal conclusion.

---

## S5.5 Reverse sync

If the customer detects an incorrect financial fact while preparing Will:

```text
Update Financial Reality
```

must route back to FDR.

Then:

```text
FDR change event
→ new FDR snapshot
→ new digest
→ refreshed DAR reference
```

DAR must never edit the old FDR snapshot directly.

---

## S5.6 Guarantees

Guarantees remain separate.

Do not deduct guarantees automatically from estate totals.

---

## S5 acceptance

Prove:

```text
no duplicate financial authority
no copied mutable FDR fact
lineage complete
consent required
revocation fail closed
reverse sync versioned
estate declaration separate
```

---

# FW-S6｜PFR PRODUCTION AUTHORITY INSTALLATION

## Objective

Close:

```text
PFR_PRODUCTION_AUTHORITY_NOT_INSTALLED
```

without bypassing human Professional authority.

---

## S6.1 Preserve PR owner

PFR remains Financial specialization under existing Professional Runtime.

No second generic Professional authority.

---

## S6.2 Production chain

Implement:

```text
Professional identity
→ eligibility
→ assignment
→ consent
→ PFR review case
```

Use existing Professional access contracts.

Use PWS registry/storage where already assigned by authority.

---

## S6.3 PFR state machine

A production PFR case must traverse only allowed transitions:

```text
OPEN
→ IN_REVIEW

IN_REVIEW
→ NEEDS_MORE_INFORMATION
or
→ RECOMMENDATION_DRAFTED

RECOMMENDATION_DRAFTED
→ CUSTOMER_DISCUSSION

CUSTOMER_DISCUSSION
→ APPROVED

APPROVED
→ SIGNED

SIGNED
→ SUPERSEDED
```

No skipping directly from OPEN to SIGNED.

---

## S6.4 Human Professional

Professional judgment must remain attributable to a human.

AI may:

```text
summarize governed facts
prepare calculation references
surface missing information
prepare draft wording where allowed
```

AI may not:

```text
approve recommendation
sign recommendation
invent professional recommendation
grant professional eligibility
```

---

## S6.5 Signature

Signed PFR contribution must bind:

```text
reviewDigest
recommendationDigest
hfpCandidateDigest
professionalId
signatureReference
signedAt
```

No AI signature.

---

## S6.6 Manual Professional gate

Codex may implement bootstrap/admin tooling.

Actual Professional identity/eligibility approval must be explicitly completed by an authorized human.

Do not hardcode a Professional as verified solely to pass tests.

Fixtures may use synthetic Professional identities only in fixture mode.

---

# FW-S7｜HFP → RR + PAID ENTITLEMENT + RELEASE

## Objective

Connect the completed Financial report to the existing Commerce and Report Runtime.

---

## S7.1 HFP handoff

HFP stops at governed candidate submission.

HFP must not claim:

```text
APPROVED
RELEASED
FINAL
PUBLISHED
```

RR owns report lifecycle.

---

## S7.2 Financial product entitlement

Reuse existing Commerce Financial product.

Verified Account required.

Existing Stripe customer/account binding remains canonical.

Do not use browser state as entitlement.

---

## S7.3 Release gates

Financial full report release requires all applicable gates:

```text
verified account

valid paid entitlement

complete/acceptable FDR state

FCR complete where required

FAR complete where required

required PFR signed contribution

HFP candidate

RR validation

release decision
```

Payment alone never opens a report that still requires Professional completion.

---

## S7.4 Will product

Will purchase/service state also does not equal:

```text
legal completion
legal execution
legal validity
signed Will
```

Commerce order and legal-document lifecycle stay separate.

---

## S7.5 Entitlement state

Bind:

```text
customerId
productId
purchaseId
entitlementId
reportCandidateReference
releasedReportReference
```

without embedding raw intake in Commerce.

---

# FW-S8｜ACCOUNT / REPORTS + PRIVATE PDF + ASK BINDING

## Objective

Make Account the customer's continuity surface.

---

## S8.1 `/account`

Account shall expose:

```text
Profile
People & Relationships
Privacy / Consent

Purchases & Access

Drafts
  Financial
  Will

My Reports

Membership / Services

Delete / Export / Data Rights
```

---

## S8.2 `/reality/`

My Reality shall project, not duplicate:

```text
People & Relationships summary
Financial Reality
active journeys
reports
history
continuity
```

Account remains identity/access surface.

My Reality remains Reality workspace.

---

## S8.3 Report states

Customer-visible report states must distinguish at minimum:

```text
DRAFT
NEEDS_INFORMATION
PROFESSIONAL_REVIEW
READY_FOR_RELEASE
RELEASED
SUPERSEDED
REVOKED
```

Do not label a preliminary Financial result as Full Released Report.

---

## S8.4 Private PDF

Released Financial and Will artifacts are private.

Requirements:

```text
authenticated owner
short-lived token
private, no-store
noindex
nofollow
noarchive
no public R2 object
no permanent public URL
```

Use existing governed download-token patterns where applicable.

---

## S8.5 Will document privacy

Will document must comply with existing Will download privacy contract.

A download token does not mean legal execution.

---

## S8.6 Ask

Ask may consume only governed released facts.

Allowed:

```text
released report facts
released report summaries
released derived customer-safe facts
```

Forbidden:

```text
draft Will
raw identity number
unsigned PFR
Professional private notes
unreleased recommendation
raw financial intake
raw bank/policy/account identifiers
deleted/revoked information
```

Ask retrieval must enforce account ownership and release state server-side.

---

# FW-S9｜FULL FIXTURE + BROWSER + PRINT + RESTORE MATRIX

## Objective

Run complete production-quality machine and browser acceptance.

---

# S9.1 Financial fixtures — minimum 22

Create or map exact canonical fixtures covering:

```text
F01 complete single-person exact data
F02 zero debt
F03 missing asset values
F04 declined income information
F05 range-based asset values
F06 approximate expenses
F07 resolved multi-currency
F08 unresolved FX
F09 irregular income
F10 annual income normalization
F11 large guarantee
F12 joint asset with customer-declared interest only
F13 unknown ownership share
F14 business owner
F15 family with children
F16 education goal
F17 retirement gap
F18 protection gap
F19 negative cash flow
F20 strong financial position
F21 scenario comparison
F22 revision/history with stale evidence
```

If the supplied master attachment has stricter/different named 22 cases, use the attachment's exact cases and preserve this list as supplemental coverage.

---

# S9.2 Will fixtures — minimum 19

Cover:

```text
W01 simple 100% residue
W02 specific gift + residue
W03 multiple beneficiaries balanced to 100%
W04 distribution below 100%
W05 distribution above 100%
W06 substitute beneficiary
W07 survivorship condition
W08 age condition
W09 trust condition
W10 minor + guardian + substitute guardian
W11 executor + substitute executor
W12 translator required
W13 witness fields
W14 EPF / PRS nomination unresolved
W15 insurance nomination/treatment unresolved
W16 business succession
W17 digital assets
W18 FDR-linked Will with consent + reverse sync
W19 unresolved identity finalization fail-closed
```

---

# S9.3 People reuse fixtures

Test:

```text
self
dependent child
declared adult spouse
linked adult spouse
adult without bilateral consent
revoked consent
person reused Financial → Will
person reused Personal Method → Relationship
Tarot relationship context
I Ching relationship context
cross-account access denial
```

---

# S9.4 Account fixtures

Test:

```text
guest
pending verification
verified account
invalid session
expired session
logout
cross-account isolation
deleted account
withdrawn retention consent
```

---

# S9.5 Browser matrix

Run real browser automation at:

```text
1440px desktop
390px mobile
```

Languages:

```text
zh-Hans
en
```

Flows:

```text
registration/login fixture
account
People & Relationships

Financial direct entry
Financial saved-person entry
Financial save
Refresh
restore
edit
revision history
scenario comparison
preliminary report

Financial → Will consent
Will direct entry
Will People reuse
Will FDR reference
Will save
Refresh
restore
distribution edit
share integrity
final review

Account → Reports

Back
Refresh
sign-out
sign-in
restore

print view
private report access
unauthorized private report denial
```

No horizontal overflow.

No uncaught errors.

No broken asset.

No false PASS from source-code inspection.

---

# S9.6 Native print dialog

Browser automation may verify invocation and print CSS.

If the environment cannot inspect the operating-system native print dialog, record:

```text
PRINT_DIALOG_NATIVE_UI = HUMAN_REQUIRED
```

Do not falsely mark native print-dialog confirmation as automated PASS.

---

# S9.7 PDF acceptance

For generated private PDFs verify:

```text
expected page count
A4 or governed format
no clipped text
no overflow
correct headers/footers
correct bilingual/single-language presentation
private-delivery behavior
no internal identifiers
no raw debug state
```

---

# FW-S10｜DEPLOYED PRODUCTION E2E + FINAL FREEZE

## Objective

Move from local evidence to actual deployed production evidence.

---

## S10.1 Pre-deployment mandatory state

Require:

```text
git status clean

all targeted FW checks PASS

npm.cmd run check = 0

Pages Functions build = PASS

all required D1 migrations generated

all secret names documented

no secret committed
```

---

## S10.2 Manual deployment prerequisites

Project owner must complete any external account actions that cannot be performed from repository code:

```text
authentication provider created/enabled
email verification enabled

production callback URL configured
preview callback URL configured

Cloudflare auth secrets installed

RUNTIME_DB production binding confirmed
D1 migration applied

draft encryption key secret installed

Stripe QA secrets confirmed
Stripe webhook secret confirmed

R2 private bindings confirmed where required
```

Codex must provide exact secret names and commands/checklist.

Do not print secret values.

---

## S10.3 Preview E2E

First deploy to governed Preview.

Run:

```text
real authentication
real verified account
real D1 save/restore
real People reuse

real Financial intake
real Financial persistence

real Will intake
real Financial → Will consent
real FDR lineage

real Stripe QA checkout
real entitlement

real PFR fixture/human staging path where permitted

real RR release candidate

real Account Reports
real private PDF

real Ask released-fact isolation
```

---

## S10.4 Production E2E

After Preview passes, execute against:

```text
https://getphios.com
```

Use production-safe test identities/data.

Do not use real unnecessary identity/financial data for acceptance.

Repeat at minimum:

```text
account
People
Financial
Will
save/restore
purchase/entitlement where production commerce is enabled
report
private download
Ask isolation
logout / unauthorized denial
```

---

## S10.5 Rockwills

Rockwills portal remains:

```text
NOT_RUN
```

unless the project owner explicitly authorizes live-portal inspection.

Do not claim Rockwills parity from screenshots or assumptions.

Do not scrape or automate a third-party authenticated portal without explicit authority.

---

# S10.6 Final freeze artifacts

Produce final governed artifacts recording:

```text
execution baseline
final commit
migration versions
Account provider state
D1 state
Financial authority map
Will authority map
People/Relationship authority map
PFR authority state
RR state
Commerce state

fixture results
browser results
PDF results
production E2E results

remaining manual/legal boundaries
```

Final status may only become:

```text
FINANCIAL_WILL_PRODUCTION_SUCCESSOR_ACCEPTED
```

when all mandatory non-human gates pass and all mandatory human/external gates have recorded evidence.

Otherwise use an accurate partial status such as:

```text
CODE_COMPLETE_EXTERNAL_ACCOUNT_CONFIGURATION_REQUIRED

or

PRODUCTION_DEPLOYED_PFR_HUMAN_AUTHORITY_REQUIRED

or

PRODUCTION_DEPLOYED_LEGAL_REVIEW_REQUIRED
```

Never convert an unresolved human/external dependency into PASS.

---

# 7｜FINAL PRODUCTION CHAINS

## Shared people chain

```text
VERIFIED ACCOUNT
        ↓
PEOPLE & RELATIONSHIPS
        ↓
PERSON REFERENCE
        ↓
PURPOSE CONSENT
        ↓
consumer-specific adapter
```

---

## Financial chain

```text
VERIFIED ACCOUNT
        ↓
PEOPLE / HOUSEHOLD SELECTION
        ↓
FDR
        ↓
IMMUTABLE FDR SNAPSHOT
        ↓
FCR
        ↓
FAR
        ↓
HFP PRELIMINARY
        ↓
PFR HUMAN REVIEW
        ↓
SIGNED PFR CONTRIBUTION
        ↓
HFP REPORT CANDIDATE
        ↓
RR
        ↓
PAID ENTITLEMENT GATE
        ↓
RR RELEASE
        ↓
ACCOUNT / REPORTS
        ↓
PRIVATE PDF
        ↓
RELEASED-FACTS-ONLY ASK
```

---

## Will chain

```text
VERIFIED ACCOUNT
        ↓
PEOPLE SELECTION
        │
        ├── saved People
        └── direct entry
        ↓
OPTIONAL FDR FACT REFERENCES
        ↓
EXPLICIT WILL_ASSEMBLY CONSENT
        ↓
CUSTOMER ESTATE DECLARATIONS
        ↓
CANONICAL WILL INTAKE
        ↓
DAR
        ↓
SHARE INTEGRITY
        ↓
LEGAL / PROFESSIONAL ESCALATION
        ↓
FINAL IDENTITY CAPTURE WHEN REQUIRED
        ↓
PRIVATE DOCUMENT ASSEMBLY
        ↓
RR / GOVERNED RELEASE
        ↓
ACCOUNT / REPORTS
        ↓
PRIVATE DOWNLOAD
```

---

## Relationship chain

```text
ACCOUNT PEOPLE DIRECTORY
        ↓
PERSON A
PERSON B
        ↓
RLR CONSENT CHECK
        ↓
BILATERAL CONSENT WHEN REQUIRED
        ↓
EXISTING RELATIONSHIP RUNTIME
        ↓
METHOD-SPECIFIC RELATIONAL READOUTS
```

Do not create another Relationship engine.

---

## Tarot / I Ching contextual chain

```text
ACCOUNT PEOPLE DIRECTORY
        ↓
OPTIONAL SUBJECT / RELATIONSHIP CONTEXT
        ↓
MINIMUM REQUIRED CONTEXT ONLY
        ↓
EXISTING TAROT / I CHING RUNTIME
```

No financial/legal/private data is automatically attached.

---

# 8｜CUSTOMER UX REQUIREMENT — NO REPEATED ENTRY

Where saved People exist, all applicable product intakes must first offer:

```text
Use someone from My Reality
```

with selectable cards/check boxes.

Example:

```text
Who is this about?

☑ Teresa
☑ Husband
☐ Child A
☐ Child B

+ Add another person
```

After selection show exactly what information will be reused.

Example:

```text
We will reuse:

✓ Name
✓ Relationship
✓ Date of birth
✓ Birth time
✓ Birth place

We will NOT use:

— Financial information
— Will information
— Identity number
```

For Financial:

```text
Use for Family Financial Planning
```

For Will:

```text
Use for Will Assembly
```

For Relationship:

```text
Use for Relationship Reading
```

These are separate purpose grants.

---

# 9｜SECURITY REQUIREMENTS

Protected mutation endpoints must enforce:

```text
verified server identity
same-origin / CSRF protection as applicable
account ownership
purpose consent
schema validation
size limits
no-store
no PII logs
```

Encryption material belongs only in environment secrets.

Never expose:

```text
encryption keys
Stripe secret
webhook signing secret
auth client secret
raw session token
full identity number
```

to client JavaScript.

---

# 10｜DATABASE MIGRATION RULE

The current latest migration at baseline is:

```text
0006_commerce_stripe_r1.sql
```

Use the next additive migration number after re-checking current `main`.

Never edit an already-deployed migration merely to simplify this work.

The successor migration should contain only the storage structures proven necessary by FW-S1–S8.

Migration must be:

```text
idempotence-safe where repository policy requires
foreign-key aware
transaction tested
rollback/recovery documented
production-safe
```

Run the existing migration/runtime check suites.

---

# 11｜DO NOT DO

Do not:

```text
create Financial Runtime v2 beside FDR/FCR/FAR/HFP

create Will Runtime beside DAR

create Relationship database inside RLR

make FinancialPerson the universal PHI OS person object

make DAR Person the universal PHI OS person object

treat relationship labels as verified relationship truth

treat household membership as joint ownership

treat spouse status as beneficiary status

treat beneficiary status as legal validity

auto-create executor/guardian/beneficiary

copy FDR assets into an independent Will asset authority

infer ownership share

fill missing numbers with zero

persist full IC/passport solely to satisfy a schema

store password in D1

trust browser userId

use localStorage as production persistence

release report because Stripe payment succeeded

let Ask read draft Financial or Will data

mark human/legal/third-party portal work as automated PASS
```

---

# 12｜REQUIRED EXECUTION REPORT

At completion return a single structured implementation report containing:

```text
Baseline verified
Final commit

Files added
Files changed

Contracts added/versioned

Database migration
Migration result

Account provider integration
Account external configuration state

People & Relationships state

FW-S1 result
FW-S2 result
FW-S3 result
FW-S4 result
FW-S5 result
FW-S6 result
FW-S7 result
FW-S8 result
FW-S9 result
FW-S10 result

npm check exit code

Targeted checks

Browser evidence
desktop
mobile
zh-Hans
en

Financial fixture count
Will fixture count

Production deployment URL

Remaining manual actions

Remaining Professional actions

Remaining legal actions

Final acceptance status
```

Do not state the complete attachment is accepted until all mandatory FW-S1–FW-S10 criteria are actually satisfied.

---

# FINAL SUCCESS CONDITIONS

The successor is successful when a verified customer can:

```text
1. Create/sign in to a PHI OS account.

2. Enter themselves and family/related persons once.

3. Reuse those persons across permitted PHI OS experiences.

4. Explicitly authorize each purpose separately.

5. Start a Financial plan using saved household people.

6. Save, close, return and restore Financial work securely.

7. Receive governed FDR/FCR/FAR/HFP output.

8. Complete required human PFR review.

9. Purchase/own the correct report entitlement.

10. Receive a released private Financial report in Account.

11. Begin Will planning from the same saved People.

12. Explicitly authorize FDR facts for Will Assembly.

13. Complete every canonical Will field.

14. Preserve FDR → DAR lineage without copying authority.

15. Save/restore Will securely without storing forbidden full identity data.

16. Complete legal/professional review where required.

17. Receive the final private document through governed delivery.

18. Ask PHI OS questions about released report facts without exposing drafts or private raw data.

19. Use the same saved people later for Relationship, Tarot, I Ching and other permitted methods without repeating basic input.

20. Revoke consent, edit data, export data or delete account according to governing RDG rights.
```

Only then may the system record:

```text
FINANCIAL_WILL_PRODUCTION_SUCCESSOR_ACCEPTED
```