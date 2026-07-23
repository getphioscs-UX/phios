# M4A-W3 — Consent and Sharing

## Outcome

M4A-W3 establishes the consent contract that must exist before PHI OS builds
Professional Workspace, Financial Intake, sensitive uploads or report
generation.

Consent is explicit, purpose-bound, professional-bound, service-bound,
resource-bound and time-bound. Nothing is selected by default and wildcard
access is prohibited.

## Consent scope

The contract supports independent selection of:

- Entry, Reconstruction, Reading, Navigation and Runtime Memory
- uploaded files and previous reports
- Human Design chart and birth information
- financial categories including income, expenses, balances, investments,
  properties, liabilities, insurance, tax, retirement, education and estate

Granting access to one category does not grant access to another category.
Consent permits the stated access; it does not automatically permit retention,
regulated advice, onward sharing or ownership.

## Duration

Supported periods are:

- one-time access
- 7 days
- 30 days
- 90 days
- until service completion
- a valid custom expiry date

Expired, consumed one-time, completed-service and revoked consent cannot be
used for new access.

## Revocation

The client may revoke Runtime, financial, Human Design, uploaded-file, report,
follow-up or all Professional access. Partial revocation leaves unrelated,
explicit scopes intact.

Revocation stops new access. It retains the necessary audit record and does
not claim to automatically delete a report already lawfully delivered. Copies
and source material remain subject to the deletion and retention policy that
will be frozen in M4A-W7.

## Joint household boundary

Each adult is a separate data subject. A main client or spouse cannot authorise
another adult's bank, insurance or tax information. Each participant grants
their own resource scopes. A minor requires a recorded guardian authority
basis.

## Human Design boundary

Human Design consent separately confirms:

- birth information was submitted voluntarily
- birth-time accuracy may affect the chart
- the interpretation is not medical, psychological or scientific diagnosis
- future access can be revoked

Human Design access remains an interpretive perspective and does not convert
chart data into Runtime Evidence.

## Recommendation acknowledgement

Financial consent confirms that:

- analysis uses the information and information date supplied
- omissions or errors can affect calculations and recommendations
- projections depend on assumptions and do not guarantee future results
- the client retains the final decision
- investment, insurance, tax, legal or estate action may require an
  appropriately qualified or authorised professional

Acknowledgement does not itself activate or authorise regulated advice.

## Access audit

The access-event contract stores identifiers, purpose, time, duration, scope,
service, action and outcome. It must not store document content, financial
values, birth details or free-text client information.

## Current implementation boundary

This work package does not add consent UI, D1 persistence, Financial Intake,
uploads, Workspace, reports, payment, email sharing, or regulated advice.
Those functions remain blocked.

The next required work package is `M4A-W7 — Professional Data and Privacy`.

## Verification

```powershell
npm run check:m4a-consent-sharing
npm run check
```
