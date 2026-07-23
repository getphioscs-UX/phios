# M4A-W7｜Professional Data and Privacy

## Outcome

M4A-W7 closes the governance contract for professional data before PHI OS
adds Financial Infrastructure or a Professional Workspace.

It governs five separate areas:

1. Human Design Data Governance
2. Financial Data Governance
3. Professional Notes Governance
4. Report Governance
5. File Governance

This milestone defines policy and executable validation contracts. It does not
activate uploads, storage, automated retention, deletion, exports, Financial
Intake, a Professional Workspace, or regulated advice.

## Data classification

PHI OS uses a Professional sub-classification that remains compatible with the
M2 Runtime classifications.

| Professional classification | M2 classification | Examples |
| --- | --- | --- |
| Professional Private | Private | Service preferences and appointment metadata |
| Professional Restricted | Sensitive | Birth data, chart files, financial values and reports |
| Professional Highly Restricted | Sensitive | Identity, account, policy and tax numbers; signatures; exact addresses; minors' data |
| Professional Record | Professional | Notes, interpretations and report governance records |
| Professional Audit | Professional | Consent, access, download and deletion events without source payloads |

Nothing in these classes is public by default. Professional access does not
transfer ownership.

## Human Design governance

The governed fields are:

- Birth Date
- Birth Time
- Birth Place
- Chart Image
- Chart PDF
- Derived Chart Fields
- Professional Interpretation

Birth and chart data are service data, not default Runtime Memory. The client
must separately choose service-only use, future-session retention, or deletion
after completion. Future-session retention expires and requires fresh consent
at least annually.

Export and deletion requests are owner-verified and include secure export,
uploaded-chart deletion, Professional Notes review and account-deletion
requests. W7 records the request; it does not claim that a storage action has
already occurred.

## Financial governance and minimisation

Restricted Financial Data includes income, balances, investment and property
values, debt, insurance, tax, net worth and financial reports.

Highly Restricted Identifiers include identity numbers, full account and policy
numbers, tax numbers, signatures, exact addresses and minors' data.

The minimised Financial record retains only what the service requires:

- masked account or policy reference;
- general property location;
- required financial value and currency;
- evidence date;
- ownership;
- evidence source and verification status.

Full identifiers, exact addresses and raw source-document text are excluded
from the minimised record.

Long-term Runtime Memory remains off by default. When the client explicitly
chooses selected summaries or scheduled annual reviews, only a confirmed
summary may enter Runtime Memory:

- Financial Position Date
- Income Range
- Expense Range
- Net Worth Range
- Major Liabilities
- Primary Goals
- Professional Review Date

The summary cannot embed source files, exact identifiers or precise account
balances.

## Professional Notes and Reports

Each Professional Note has one note type and one matching content class.
Client facts, document verification, assumptions, calculations, professional
assessment, product-neutral recommendation, client decision, implementation
and review are not mixed in the same note.

`regulated_advice_note` is reserved but disabled. Its presence in the
governance vocabulary does not authorise regulated advice.

Report governance keeps metadata separate from report content:

- Report, client and service identifiers
- Report type and version
- Data date and generation date
- Source references
- Assumptions
- Review status and reviewer

Reports are restricted and non-public by default. Export must be logged.

## File security

Allowed file types are PDF, JPG/JPEG, PNG, CSV and XLSX. The contract sets a
25 MiB per-file maximum.

Every file requires:

- secure private upload;
- encryption in transit and at rest;
- matching extension and MIME type;
- malware scan;
- signed temporary access of no more than 15 minutes;
- access expiry and download logging;
- no public URL;
- a deletion workflow.

Original filenames and source contents do not enter the audit record.
Highly restricted files cannot be requested through ordinary email.

W8 must provide the private object storage, malware scanner, signed-access
service and deletion worker before file upload can be enabled.

## Retention and deletion

Retention is separate from access consent. There is no indefinite option.

Operational defaults defined by this contract are:

- source documents: delete 30 days after report delivery when the client
  chooses source deletion or service-only retention;
- Professional working file: review/delete 90 days after service completion;
- final report: review/delete after 30 days for short retention, otherwise
  after 365 days;
- annual-review or future-session retention: explicit expiry and fresh consent
  at least annually.

The seven-year accounting rule applies only to PHI OS transaction and
accounting records that are actually subject to that obligation. It does not
automatically convert client bank statements, tax files, policy documents,
charts or other source files into accounting records.

A legal retention exception must state the legal basis, exact record classes,
expiry and approving role. It cannot be indefinite.

Consent withdrawal immediately stops new access and processing. Deletion is
then reviewed against the recorded service and legal basis; the system must not
claim deletion before the deletion worker confirms it.

## Malaysia policy references

The design follows the Malaysian Personal Data Protection principles that
require notice and choice, purpose limitation, security, data integrity,
access, and storage no longer than necessary:

- <https://www.pdp.gov.my/ppdpv1/en/principles-of-personal-data-protection/>
- <https://www.pdp.gov.my/ppdpv1/en/faq/>

The separate seven-year accounting record scope is based on the Income Tax Act
record-keeping requirement:

- <https://www.hasil.gov.my/wp-content/uploads/20231101-akta-cukai-pendapatan-1967-act-53.pdf>

Production legal and privacy review remains required. This milestone is an
engineering governance contract, not legal advice or a declaration of complete
regulatory compliance.

## Frozen boundaries

M4A-W7 does not change:

- M2 Runtime Security and Privacy
- M2 Professional Access Boundary
- M4A-W3 Consent and Sharing
- Runtime stages or contracts
- D1 schema or migrations
- Cloudflare bindings

## Next gate

Proceed to M4A-W8 Financial Professional Infrastructure. W8 may implement
schemas and security infrastructure against these contracts. M4A-W2 Workspace
must not collect or expose sensitive Financial or Human Design data before W8
passes.
