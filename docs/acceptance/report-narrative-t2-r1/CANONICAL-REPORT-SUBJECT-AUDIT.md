# RNT2-W18 — Canonical Report Subject Audit

## Result

`PARTIAL / PRODUCTION NAME BINDING BLOCKED`

## Existing trusted owners found

### Birth data

Canonical birth data is owned by:

- `content/professional/method-client-delivery/contracts/canonical-birth-input-contract-v1.json`
- `functions/method-client-delivery/canonical-birth-input-runtime.js`

It owns:

- birthDate
- birthTime
- birthPlace
- timezone
- timeAccuracy
- locale
- consent
- inputVersion

Unknown time is explicitly null and fabricated defaults are forbidden.

### Subject reference

MPA initialization owns a stable `subjectReference`:

- `content/professional/method-production-activation/schemas/mpa-birth-initialization-data-v1.schema.json`
- `functions/method-production-activation/birth-initialization-data-runtime.js`

### Released-report customer identity

Released report delivery owns customer identifiers such as:

- `client_id`
- `customerId`
- `customerReference.customerId`

These are identity references, not customer-visible names.

## Display-name audit

No canonical customer-visible `displayName`, `clientName`, `customerName`, or equivalent trusted report-subject display-name owner was found in the audited current report input / release / account / canonical birth owners.

Therefore:

- customerId MUST NOT be printed as the customer name;
- account email MUST NOT be transformed into a name;
- a fixture name MUST NOT be reused;
- name MUST NOT be inserted into CanonicalBirthInput;
- cover production must fail closed until an existing trusted person/subject identity owner supplies an explicit display name.

## Successor boundary

RNT2 adds only:

`REPORT_SUBJECT_PRESENTATION_V1`

This is presentation transport, not a new identity authority. It binds:

- existing subjectReference
- explicit trusted displayName
- CanonicalBirthInput birthDate
- CanonicalBirthInput birthTime
- timeAccuracy
- source references
- privacy-safe subjectFingerprint

## Production gate

`DISPLAY_NAME_AUTHORITY = BLOCKED_PENDING_TRUSTED_UPSTREAM_BINDING`

Birth-date and birth-time cover binding are authority-complete.

Customer-name cover binding is implementation-complete but production-blocked until the trusted upstream display-name owner is identified or added by a separate authorized identity successor.
