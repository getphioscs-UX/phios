# PHI OS｜FINANCIAL + WILL FULL PRODUCTION SUCCESSOR R1

## Financial Reality → Holistic Financial Report → Estate Readiness → Will / Testamentary Planning

### FULL PRODUCTION MASTER WORK STEP

```
WORK ID
PHIOS-FIN-WILL-FULL-PRODUCTION-R1

PRODUCTS
1. PHI OS Financial Reality / Financial Navigation Report
2. PHI OS Estate & Will Planning / Testamentary Information Report

EXECUTION MODE
CURRENT MAIN IN-PLACE SUCCESSOR IMPLEMENTATION

REPOSITORY
getphioscs-UX/phios

BRANCH
main

STARTING AUTHORITY
Do not assume a historic baseline commit.
At execution start record:

git status
git branch --show-current
git rev-parse HEAD
git log -1 --oneline

Use the actual current main HEAD as executionBaselineCommit.

Do not request or produce a changed-file delta ZIP.
Work directly against the current repository.
Do not create a parallel runtime.
Do not rebuild frozen backend authorities.
```

---

# 0｜PRIMARY DIRECTIVE

The repository already contains substantial Financial and Will infrastructure.

This work is NOT permission to rebuild:

```
FDR
Financial Data Runtime

FCR
Financial Calculation Runtime

FAR
Financial Analysis Runtime

HFP
Holistic Financial Planning Product

PFR
Professional Financial Review

DAR / Document Assembly

Will legal governance

Testamentary intake/runtime
```

The objective is:

```
EXISTING BACKEND AUTHORITY
        ↓
CUSTOMER INTAKE
        ↓
FINANCIAL REALITY
        ↓
FINANCIAL ANALYSIS
        ↓
HOLISTIC FINANCIAL REPORT
        ↓
ESTATE READINESS
        ↓
WILL / TESTAMENTARY INTAKE
        ↓
ESTATE & LEGACY REPORT
        ↓
PROFESSIONAL / LEGAL HANDOFF
```

Do not introduce:

```
Financial Runtime v2
Estate Runtime v2
Will Composer v2
Estate Calculator v2
Financial Recommendation Engine v2
Legal LLM Runtime
parallel report authority
parallel professional judgment authority
parallel customer financial database
```

Existing authority must be consumed.

---

# 1｜CURRENT CANONICAL AUTHORITIES TO PRESERVE

Before modifying production code, inspect and treat these as authoritative upstream material.

## Financial Product Authority

```
content/financial/product-activation/contracts/
financial-runtime-product-contract-v1.json
```

Preserve canonical flow:

```
FINANCIAL_INTAKE
→ NORMALIZED_FINANCIAL_STATE
→ CALCULATION
→ FINANCIAL_SNAPSHOT
→ SCENARIO
→ FINDINGS
→ PROFESSIONAL_HANDOFF
```

Preserve authority ownership:

```
Financial data            = FDR
Financial calculations    = FCR
Financial analysis        = FAR
Planning candidate        = HFP
Professional judgment     = PFR
```

Hard boundaries already frozen:

```
modelFinancialCalculationAllowed = false
modelRecommendationAllowed = false
hiddenScenarioDefaultsAllowed = false
automaticPersistenceAllowed = false
automaticRealityCaseCreationAllowed = false
professionalRecommendationRequiresPfr = true
```

DO NOT weaken these rules.

---

# 2｜CURRENT CUSTOMER SURFACE

Current customer authority identifies:

```
canonical route
/professional/financial/

HTML
professional/financial/index.html

client
assets/customer-ui/js/surfaces/financial-reality.js

API
/api/customer-financial-reality
```

Authority source:

```
content/customer-experience-rebuild/authority/
financial-reality-customer-surface-v2.json
```

Existing customer architecture already supports:

```
staged intake
9 intake stages
overview before calculations
calculation drill-down
finding humanization
planning fail-closed
professional layer separation
report release gating
My Reality handoff
```

This work must upgrade and complete this customer surface.

Do not create another customer-facing financial route unless required as a child route of this canonical product.

---

# 3｜CURRENT FINANCIAL REPORT SEMANTIC AUTHORITY

Existing HFP registry defines 22 canonical semantic sections.

Source:

```
content/financial/holistic-planning-product/registries/
holistic-financial-plan-section-registry-v1.json
```

Preserve all 22 sections and their authority ownership:

```
01 Financial Reality Snapshot
02 Household
03 Net Worth
04 Liquidity
05 Cash Flow
06 Liabilities
07 Protection
08 Goals
09 Education
10 Retirement
11 Investment Structure
12 Business Wealth
13 Estate & Succession
14 Cross-border
15 Key Findings
16 Scenario Analysis
17 Professional Recommendations
18 Alternatives & Disadvantages
19 Action Plan
20 Review & Continuity
21 Unknowns / Missing Evidence
22 Assumptions & Boundaries
```

IMPORTANT:

The registry controls semantic sections.

It does NOT force the customer PDF to have exactly 22 visible pages.

Customer Report Runtime may visually compose these sections into a coherent publication-quality report, but may not silently remove semantic sections.

---

# 4｜CURRENT WILL / ESTATE AUTHORITY

Use the existing Will infrastructure.

Primary schema:

```
content/legal/will/schemas/
will-intake-v1.schema.json
```

It already includes:

```
testator
jurisdiction
domicile

executors
substitute executors

guardians
substitute guardians

beneficiaries

immovable property
private company
partnership
sole proprietorship

bank accounts

unit trusts
listed securities

insurance

EPF
PRS

vehicles
jewellery

safe deposits

digital assets
intellectual property
domain names
online accounts
crypto assets

other assets

specific gifts
residuary distribution
trust instructions
digital asset instructions

language
translator requirement
```

DO NOT replace this schema with a simplified Will form.

---

# 5｜CURRENT TESTAMENTARY REPORT AUTHORITY

Existing implementation:

```
functions/professional/financial/
testamentary-intake-v1.js

functions/professional/financial/
testamentary-report-v1.js

functions/professional/financial/
testamentary-security-v1.js
```

Existing report already owns these sections:

```
scope_and_status
identity_and_family
executors_and_guardians
beneficiaries
estate_financial_summary
trusts_gifts_and_exclusions
digital_assets
funeral_wishes
advisors_and_documents
gaps_and_conflicts
review_consent
legal_review_boundary
```

Existing deterministic estate calculation already supports:

```
grossEstate
totalLiabilities
netEstateBeforeTaxFeesAndDistribution
```

Existing report boundary must remain:

```
professionalReviewRequired = true
jurisdictionReviewRequired = true
executedInstrument = false
automaticExecution = false
legalValidityDetermined = false
fieldsInvented = false
modelGeneratedFacts = false
modelMayOverrideCalculations = false
```

Do not change Will output into an automatically executable legal instrument.

---

# 6｜PRODUCT MODEL

Create ONE connected customer journey:

```
MY REALITY
   ↓
FINANCIAL REALITY
   ↓
FINANCIAL NAVIGATION REPORT
   ↓
ESTATE READINESS
   ↓
WILL / ESTATE PLANNING
   ↓
TESTAMENTARY INFORMATION REPORT
   ↓
PROFESSIONAL / LEGAL REVIEW
```

Financial and Will are related but not identical products.

Financial Report is the broad financial reality product.

Will Report is a specialist successor surface.

Do not merge everything into one gigantic form.

---

# 7｜FINANCIAL CUSTOMER ENTRY

Upgrade `/professional/financial/` into a polished customer product.

The first screen must answer:

```
Where am I financially now?

What is strong?

What is carrying load?

What is exposed?

What is changing?

What requires attention?

What can I do next?
```

Avoid financial-adviser back-office appearance.

Avoid raw JSON.

Avoid displaying governance codes such as:

```
FDR
FCR
FAR
HFP
PFR
DAR
```

to normal customers.

These may exist internally only.

---

# 8｜FINANCIAL INTAKE — 9 STAGES

Retain the existing 9-stage staged-intake concept.

Complete it into the following customer flow.

## Stage 1 — Household

Collect:

```
customer
partner / spouse
children
dependants
parents requiring support
household relationships
country
jurisdiction
primary currency
other relevant currencies
employment status
business ownership
```

Do not force fields that are not relevant.

Allow:

```
known
unknown
not applicable
prefer not to provide
range only
```

where supported by FDR.

---

## Stage 2 — Income

Collect multiple income streams:

```
salary
commission
business income
rental income
investment income
pension
allowances
other recurring income
irregular income
```

Each stream should support:

```
owner
amount
frequency
currency
gross / net if relevant
stable / variable
source evidence
confidence / disclosure state
```

---

## Stage 3 — Living Expenses & Commitments

Support:

```
household spending
housing
utilities
transport
children
education
medical
insurance premiums
parental support
subscriptions
lifestyle
business commitments
tax provision
other recurring expenses
```

Do not require item-level micromanagement if the customer only knows a monthly total.

Progressive disclosure:

```
quick amount
→ category breakdown
→ detailed evidence
```

---

# 9｜ASSET INVENTORY — COMPLETE COVERAGE

Use the existing FDR asset contracts as authority.

At customer level provide an **Asset Inventory** inspired by the functional completeness of the attached estate inventory reference, but implement original PHI OS UI and wording.

Required major categories:

```
1. Safe Deposit / Stored Valuables
2. Bank Accounts / Cash
3. Immovable Property
4. Insurance / Policy Benefits
5. Investments
6. Business Interests
7. Retirement Assets
8. Vehicles
9. Digital Assets
10. Intellectual Property
11. Other Assets
```

Where relevant also support:

```
EPF
PRS
unit trust
listed shares
private company
partnership
sole proprietorship
foreign account
foreign property
joint asset
trust-held asset
nominee-held asset
crypto
domain names
online business assets
receivables
jewellery
collectibles
```

Each asset record must support where authority permits:

```
asset type
description
owner
ownership percentage
joint ownership
estimated gross value
currency
valuation date
location / jurisdiction
liquidity class
income generating yes/no
encumbered yes/no
linked liability
beneficiary / nomination if relevant
evidence source
last reviewed date
notes
```

Never expose full account numbers where not needed.

Use masked identifiers.

---

# 10｜LIABILITY INVENTORY

Required categories include:

```
housing loan
overdraft
car loan
credit card
personal loan
business loan
income tax payable
investment financing
education loan
family/private debt
foreign debt
other liability
```

Each liability:

```
borrower
joint borrower
current balance
currency
interest rate if known
monthly repayment
maturity
secured asset
lender
evidence
notes
```

---

# 11｜GUARANTEES

The Rockwills-style asset booklet correctly treats guarantees separately.

PHI OS already has:

```
financial-guarantee-contract-v1.json
```

Activate this in customer UI.

Collect:

```
guarantor
borrower / entity supported
guarantee type
maximum exposure
current estimated exposure
currency
secured / unsecured
expiry if known
supporting document
notes
```

Guarantees MUST NOT be hidden inside liabilities.

Show separately because:

```
current liability ≠ contingent exposure
```

---

# 12｜NET ESTATE / NET WORTH

Display at least two different metrics.

Do not collapse them.

## Financial Net Worth

```
Total Financial Assets
− Total Financial Liabilities
= Net Worth
```

## Estate Snapshot

Where sufficient evidence exists:

```
Gross Estate
− Liabilities
= Net Estate Before Tax / Fees / Distribution
```

Clearly state:

```
Net Estate is an informational estate snapshot.
It does not establish legal ownership,
estate inclusion,
tax treatment,
probate treatment,
beneficiary entitlement,
or distributability.
```

Never add insurance death benefit blindly to estate property without respecting its legal / nomination treatment.

Unknown estate inclusion must remain unknown.

---

# 13｜FINANCIAL REALITY DASHBOARD

After intake, customer sees an immediate summary.

Required cards:

```
Net Worth
Liquid Assets
Monthly Income
Monthly Expenses
Monthly Surplus / Deficit
Debt
Protection
Retirement Position
Investment Concentration
Property Exposure
Business Exposure
Estate Readiness
Data Completeness
```

Visualize:

```
ASSETS
    ↕
LIABILITIES

INCOME
    ↕
EXPENSES

CAPACITY
    ↕
LOAD

CURRENT REALITY
    →
FUTURE COMMITMENTS
```

Use existing financial visual assets where available:

```
PHIOS-FIGURE-ASSETS-LIABILITIES-STRUCTURE
PHIOS-FIGURE-FINANCIAL-CONTINUITY
PHIOS-FIGURE-FINANCIAL-DECISION-FLOW
PHIOS-FIGURE-FINANCIAL-REALITY-SYSTEM-MAP
PHIOS-FIGURE-FINANCIAL-REALITY-SYSTEM
```

Do not produce duplicate figures where existing governed assets already satisfy the role.

---

# 14｜CAPACITY VS LOAD

Introduce a customer-readable PHI OS Financial Capacity layer using only existing deterministic/analysis authority.

Display where calculable:

```
Liquidity Capacity
Emergency Capacity
Debt Capacity
Protection Capacity
Savings Capacity
Investment Capacity
Retirement Capacity
Estate Liquidity
Income Resilience
```

Against:

```
Housing Load
Debt Load
Family Dependency Load
Education Load
Lifestyle Load
Business Dependency
Property Concentration
Medical / Protection Exposure
Future Commitment Load
Guarantee Exposure
```

These are presentation and interpretation groupings.

Do NOT invent new scores unless an existing canonical formula/authority defines them.

If no canonical score exists:

show qualitative / source-backed state, not a fake numeric score.

---

# 15｜CASH FLOW

Customer report must contain:

```
monthly income
monthly recurring expense
debt servicing
insurance commitments
investment commitments
net monthly position
annualized position
```

Support:

```
positive
near-neutral
negative
variable
unknown
```

Where income is irregular, avoid false precision.

Show ranges where ranges were entered.

---

# 16｜LIQUIDITY

Show:

```
cash / near-cash
required short-term obligations
emergency reserve
liquid asset ratio if canonically supported
months of expense coverage if supported
locked / illiquid assets
```

Do not count:

```
property
business value
non-redeemable asset
uncertain asset
```

as immediately liquid.

---

# 17｜PROTECTION

Use product-neutral analysis.

Analyse:

```
death exposure
disability exposure
critical illness exposure
medical exposure
income interruption
debt exposure
dependant exposure
business dependency
estate liquidity requirement
```

Display:

```
KNOWN COVER
RELEVANT NEED
GAP / SURPLUS / UNKNOWN
```

Do not make insurance product recommendations unless a PFR-authorized professional recommendation exists.

---

# 18｜GOALS

Goal model must support:

```
emergency fund
home
education
business capital
travel
family support
investment
retirement
legacy
estate liquidity
other
```

Each:

```
target amount
currency
target date
priority
current funding
required funding
uncertainty
evidence
```

---

# 19｜EDUCATION

For children/dependants:

```
current age
education start date
duration
current cost
inflation assumption
existing funding
required future capital
gap
```

All calculations must go through FCR.

Never calculate in client JavaScript.

---

# 20｜RETIREMENT

Report should present:

```
Current Trajectory
Projected Retirement Capital
Expected Retirement Income
Required Retirement Capital
Gap / Surplus
```

When available run existing scenario engine for:

```
base scenario
lower return
higher inflation
earlier retirement
longer retirement
higher expenses
```

No hidden assumptions.

Display every material assumption.

---

# 21｜INVESTMENT STRUCTURE

Do not turn this section into fund sales.

Analyse:

```
liquidity
time horizon
asset allocation
concentration
property concentration
business concentration
currency concentration
market exposure
income dependence
risk capacity
goal alignment
```

If recommendation requires professional judgment:

```
PFR REQUIRED
```

Fail closed.

---

# 22｜BUSINESS WEALTH

For business owners support:

```
business value
ownership %
business income dependency
key-person dependency
business liabilities
personal guarantees
shareholder agreements
succession arrangements
business continuity
liquidity
```

Never automatically treat business valuation as liquid personal wealth.

---

# 23｜ESTATE READINESS INSIDE FINANCIAL REPORT

Financial Report section 13 remains:

```
ESTATE & SUCCESSION
```

But this section is NOT a full Will Report.

Provide:

```
Estate Inventory Completion
Beneficiary / Nomination Visibility
Executor Preparedness
Guardian Requirement
Digital Asset Readiness
Business Succession Status
Estate Liquidity
Guarantee Exposure
Document Availability
Will Status
Review Required
```

Then CTA:

```
Continue to Estate & Will Planning
```

Only show this CTA when relevant.

---

# 24｜FINANCIAL REPORT PRODUCTION

Generate a polished customer Financial Navigation Report.

The semantic source is the existing 22-section HFP registry.

Recommended visible publication structure:

```
P01 Cover

P02 How to Read This Report

P03 Financial Reality at a Glance

P04 Household & Responsibility Map

P05 Asset Landscape

P06 Liabilities & Guarantees

P07 Net Worth & Liquidity

P08 Cash Flow

P09 Financial Capacity & Load

P10 Protection

P11 Goals

P12 Education

P13 Retirement

P14 Investment Structure

P15 Property & Business Wealth

P16 Estate & Succession Readiness

P17 Cross-border Position
     only when applicable

P18 Key Findings

P19 Scenario Analysis

P20 Professional Recommendations
     only when PFR authority is present

P21 Alternatives & Disadvantages
     only when PFR authority is present

P22 Action Plan

P23 Review & Continuity

P24 Unknowns / Missing Evidence

P25 Assumptions & Boundaries
```

The exact page count may expand dynamically.

Do not show empty pages.

A semantic section may render:

```
NOT APPLICABLE
NOT PROVIDED
UNKNOWN
NEEDS REVIEW
```

instead of disappearing when that distinction matters.

---

# 25｜FINANCIAL REPORT VISUAL LANGUAGE

Do not use the metaphysical/celestial report language of:

```
BaZi
Human Design
Profile
Cross
Astrology
```

as the main financial aesthetic.

Keep PHI OS brand:

```
ivory
navy
champagne gold
soft blue
editorial whitespace
premium typography
subtle glow
```

But financial visuals must emphasize:

```
balance sheets
flows
time horizons
scenario bands
asset maps
ownership maps
household networks
cash-flow diagrams
risk exposure
goal timelines
estate flow
```

No stock-market cliché.

No piles of coins.

No luxury wealth fantasy.

No "get rich" imagery.

---

# 26｜FINANCIAL FREE / FULL PRODUCT BOUNDARY

Customer may receive a useful free/preliminary view.

## Preliminary / Free

Allow:

```
Financial Reality Snapshot
Asset / Liability Summary
Net Worth
Cash Flow Snapshot
Top Findings
Data Completeness
Estate Readiness indicator
```

## Full Financial Report

Unlock:

```
full 22-section analysis
scenario analysis
protection
goals
education
retirement
investment structure
business wealth
estate succession
professional review
action plan
continuity
```

Do not lock basic customer-entered facts behind payment.

---

# 27｜WILL PRODUCT ENTRY

Will customer journey begins from either:

```
Financial Report → Estate Readiness
```

or direct:

```
Estate & Will Planning
```

Direct entry must still be able to consume existing financial data with explicit user consent.

Do NOT silently copy private data into a Will case.

Ask:

```
Use my existing Financial Reality data
```

or:

```
Start separately
```

---

# 28｜WILL / ESTATE ASSET INVENTORY

Present a customer-friendly **Personal Estate Inventory**.

Use the existing Will schema and FDR where applicable.

Required top-level sections:

```
01 Safe Deposit & Stored Valuables
02 Bank Accounts
03 Immovable Properties
04 Insurance
05 Investments
06 Business Interests
07 Retirement Assets
08 Vehicles
09 Digital Assets
10 Intellectual Property
11 Other Assets
12 Liabilities
13 Guarantees
14 Special Instructions / Notes
```

Then:

```
Gross Asset Value
Total Liabilities
Contingent Guarantees
Indicative Net Estate
```

Important:

Guarantees are NOT deducted automatically from net estate unless they are actual payable liabilities under the authoritative calculation.

Display separately.

---

# 29｜ASSET MANAGEMENT / DOCUMENT LOCATION

The external reference includes “Asset Management.”

PHI OS should interpret this more usefully as:

```
Asset Administration & Document Location
```

Track:

```
institution
advisor / contact
document location
ownership evidence
nomination evidence
valuation evidence
policy documents
title documents
company documents
digital access instructions
```

Do NOT store account passwords or private keys.

For digital assets:

```
record existence
provider
identifier hint
access instruction location
digital facilitator
```

Never store seed phrases.

---

# 30｜FAMILY & ROLE MAP

Will customer UI must allow:

```
testator

spouse / partner
children
minor children
dependants
parents

executor
substitute executor

guardian
substitute guardian

beneficiary
substitute beneficiary

trustee if applicable
digital facilitator
translator
advisor
witness
```

Person records must resolve to declared people.

Do not duplicate person records for each role.

---

# 31｜EXECUTOR & GUARDIAN

Explain in plain language:

```
Executor
manages the estate administration process.

Guardian
is relevant where minor children may require a guardian.

Substitute Executor / Guardian
acts if the primary person cannot or will not act.
```

Do not claim appointment validity until jurisdiction review.

---

# 32｜BENEFICIARY & DISTRIBUTION BUILDER

Consume existing:

```
will-distribution-contract-v1.json
```

Support:

```
Specific Gift
Percentage Gift
Equal Share
Residue Share
Substitute Beneficiary
Per-Asset Distribution
Class Distribution
Survivorship Condition
Age Condition
Trust Condition
```

UI must show distribution visually.

Example:

```
RESIDUARY ESTATE
        ↓
Child A 40%
Child B 40%
Parent 20%
```

Validation:

```
percentage total
duplicate recipient
undeclared beneficiary
missing substitute
unassigned asset
conflicting gift
unclear ownership
```

Never automatically rebalance percentages.

---

# 33｜SPECIAL GIFTS

Support:

```
specific property
cash amount
jewellery
collectible
business interest
digital asset
other specific asset
```

Show clearly that:

```
customer instruction ≠ legally effective clause
```

until admitted and reviewed.

---

# 34｜TRUST / MINOR BENEFICIARY INSTRUCTIONS

Where minor or conditional distributions exist:

collect structured intent:

```
beneficiary
age
condition
trust intent
trustee preference
purpose
education support
maintenance support
release timing
```

Do not draft novel legal clauses with an LLM.

Pass into governed clause eligibility / legal review.

---

# 35｜DIGITAL ASSETS

Support:

```
domain
website
email
social account
cloud storage
digital business asset
crypto asset
online marketplace
copyrighted material
other
```

Fields:

```
description
owner
service/provider
identifier hint
location of access instructions
digital facilitator
desired action
notes
```

Never collect:

```
passwords
private keys
seed phrases
full recovery codes
```

---

# 36｜INSURANCE / EPF / PRS / NOMINATION

Show separately:

```
asset exists
estimated value / benefit
nomination known?
beneficiary known?
document evidence available?
estate treatment known?
professional / legal review needed?
```

Do NOT imply:

```
nominee = beneficiary
insurance benefit = estate asset
EPF = estate asset
```

without applicable jurisdictional authority.

---

# 37｜BUSINESS SUCCESSION

When business ownership exists, include:

```
business entity
ownership %
co-owners
shareholder agreement
buy-sell arrangement
business debt
personal guarantee
key-person protection
successor
management continuity
ownership succession
```

Use existing PFR business succession contract when professional review is needed.

---

# 38｜ESTATE LIQUIDITY

Show:

```
Estimated estate cash / liquid assets

vs

known immediate liabilities
administration-related known commitments
family cash needs
business continuity needs
```

Do not estimate taxes, probate fees, legal fees or jurisdiction-specific costs without authority.

Unknown remains unknown.

---

# 39｜WILL READINESS STATUS

Create customer-facing readiness states.

Not a legal validity score.

Use:

```
INVENTORY_INCOMPLETE

INVENTORY_READY

DISTRIBUTION_INCOMPLETE

DISTRIBUTION_READY

ROLE_SELECTION_INCOMPLETE

REVIEW_REQUIRED

READY_FOR_PROFESSIONAL_REVIEW

PROFESSIONAL_REVIEWED
```

Never show:

```
100% legally valid
Will valid
Probate guaranteed
```

---

# 40｜WILL REPORT

Use existing testamentary report authority but replace the current development-style raw HTML presentation with a production customer report projection.

Do NOT change its legal semantics.

Recommended publication structure:

```
P01 Cover
Estate & Legacy Planning

P02 How to Read This Report

P03 Scope & Status

P04 Your Family & Responsibility Map

P05 Executors & Guardians

P06 Beneficiary Map

P07 Personal Asset Inventory

P08 Liabilities & Guarantees

P09 Estate Financial Summary

P10 Ownership & Estate Inclusion Questions

P11 Specific Gifts

P12 Residuary Distribution

P13 Trust & Minor Beneficiary Instructions

P14 Insurance / EPF / Nomination Review

P15 Business Succession

P16 Digital Assets

P17 Funeral / Personal Wishes
where admitted

P18 Advisors & Important Documents

P19 Gaps & Conflicts

P20 Estate Readiness

P21 Professional / Legal Review Questions

P22 Next Actions

P23 Information Date & Provenance

P24 Legal Boundary
```

Do not call this:

```
Final Will
Executed Will
Legal Will
```

unless a later authorized legal workflow explicitly owns execution.

Preferred customer product name:

```
Estate & Will Planning Report
```

or

```
Estate & Legacy Planning Report
```

Internal artifact may remain:

```
Testamentary Information Draft
```

---

# 41｜LEGAL BOUNDARY

Prominent but non-alarming statement:

```
This report organizes the information and intentions
you provided for estate and Will planning.

It is not an executed Will,
does not determine legal validity,
and may require professional legal review
before any legal instrument is prepared or signed.
```

Chinese:

```
本报告用于整理你提供的遗产与遗嘱规划资料及意愿。

它不是已经签署并生效的遗嘱，
不会自动判断法律效力。
在正式制作或签署法律文件之前，
相关内容可能需要专业法律审核。
```

Do not bury this only in Terms.

---

# 42｜FINANCIAL → WILL DATA HANDOFF

Implement an explicit handoff contract.

Example customer step:

```
We can use the assets, liabilities,
business interests and household information
already confirmed in your Financial Reality.

[Review and use this information]
[Start separately]
```

Before transfer show:

```
Assets: 12
Liabilities: 4
Business interests: 1
Household members: 5
Last reviewed: YYYY-MM-DD
```

Customer must confirm.

Will remains capable of storing Will-specific additions without polluting Financial Reality automatically.

Changes require explicit reverse-sync confirmation.

---

# 43｜NO SILENT TWO-WAY SYNC

Rules:

```
Financial → Will:
explicit copy/reference consent

Will → Financial:
explicit customer confirmation

No automatic overwrite.

No hidden merge.

No dedupe by name alone.

No financial amount overwrite from Will notes.

No Will beneficiary overwrite from insurance nomination.
```

---

# 44｜EVIDENCE

Each material item should retain provenance.

Customer-facing evidence state:

```
Confirmed by you
Document provided
Calculated
Professional interpretation
Requires confirmation
Missing evidence
```

Do not expose internal low-level provenance IDs unless user requests technical detail.

---

# 45｜EDITING

All customer facts must be editable from relevant section.

Example:

```
Property
RM 670,000

[Edit]
```

Opening edit should preserve:

```
original value
new value
effective date
source
change reason if material
```

Do not delete history when runtime already supports change events.

---

# 46｜PRINT / DOWNLOAD

Both Financial and Estate reports require:

```
A4
desktop print
mobile view
page breaks
no clipped text
no hidden critical warnings
charts printable
tables printable
bilingual-ready architecture
English
Simplified Chinese
```

Customer can:

```
View report
Print
Save PDF
Return later
```

respecting access and report-release gates.

---

# 47｜PRIVACY

Financial / Will data is highly sensitive.

Respect existing privacy contracts.

Never include in logs:

```
full account numbers
identity document number
full policy number
passwords
crypto private keys
seed phrases
exact digital credentials
```

Use redaction.

Download must honor existing testamentary security and Will download privacy contracts.

---

# 48｜PROFESSIONAL WORKSPACE

Do not expose professional workspace functionality to general customer.

Professional view should support:

```
review case
review facts
review evidence
review calculations
review findings
accept / amend / reject findings
enter professional recommendation
enter alternatives
enter disadvantages
record no-action option
review estate issues
request legal escalation
release report
```

PFR is the only professional judgment authority.

---

# 49｜LEGAL ESCALATION

Trigger review where needed:

```
uncertain ownership
foreign property
foreign domicile
cross-border estate
business succession
minor beneficiary
trust condition
custom legal clause
conflicting nominations
complex beneficiary class
capacity concern
translator requirement
uncertain witness requirements
uncertain execution formalities
```

System response:

```
Professional legal review required.
```

Not:

```
Invalid
Illegal
Impossible
```

unless an authorized rule explicitly determines it.

---

# 50｜EXTERNAL REFERENCE POLICY

The supplied Rockwills Personal Asset Inventory reference may be used only as a functional completeness reference.

Observed useful functional concepts include:

```
Safe Deposit Box
Bank Accounts
Immovable Properties
Insurance
Investment / Business
Asset Management
Car
Digital Assets
Other Assets
Liabilities
Guarantees
Special Instructions / Notes
Net Estate Valuation
```

Do not:

```
copy proprietary HTML
copy CSS
copy exact visual layout
scrape authenticated/private data
reuse logo
reuse protected copy
impersonate Rockwills
```

Create original PHI OS UX.

If browser access to the supplied portal requires authentication and an authorized session is not available:

```
mark external live portal verification NOT_RUN
```

and use the supplied screenshots only as functional evidence.

Do not fabricate browser verification.

---

# 51｜PUBLIC PRODUCT DISCOVERY

Add/upgrade discovery only within existing website architecture.

Financial:

```
Financial Reality
Financial Navigation Report
```

Estate:

```
Estate & Will Planning
```

Public product pages explain:

```
what it does
what information is needed
what customer receives
privacy
professional review boundary
```

Do not expose customer financial data publicly.

---

# 52｜MY REALITY INTEGRATION

My Reality should show:

```
Financial Reality

status:
Not started
In progress
Snapshot ready
Report available
Review required
Updated
```

And if applicable:

```
Estate & Will Planning

status:
Not started
Inventory in progress
Review required
Report available
Professional review
```

No retired page resurrection.

---

# 53｜REPORT CARDS

Customer Account / Reports should display:

```
Financial Navigation Report
Updated YYYY-MM-DD
[Open]

Estate & Will Planning Report
Updated YYYY-MM-DD
[Open]
```

Respect existing RR report-release authority.

Do not expose unreleased professional drafts.

---

# 54｜ASK PHI OS CONTEXT

Once released, allow Ask PHI OS to consume report facts within allowed customer context.

Examples:

```
Why is my liquidity considered low?

What is creating the greatest pressure
on my monthly cash flow?

Which goals are most affected
by my current debt commitments?

Which parts of my estate information
are still incomplete?
```

Ask must not invent:

```
new financial calculation
product recommendation
legal advice
beneficiary entitlement
will validity
```

Use governed report evidence.

---

# 55｜I18N

All production customer surfaces require:

```
en
zh-Hans
```

No mixed-language leakage.

Financial terms should use professional but understandable language.

Do not mechanically translate:

```
estate
executor
guardian
residuary estate
beneficiary
nomination
liquidity
guarantee
```

without established locale wording.

---

# 56｜ACCESSIBILITY

Required:

```
keyboard navigation
visible focus
form labels
error summary
screen-reader descriptions
semantic tables
sufficient contrast
reduced motion compatibility
mobile form usability
```

Charts require text equivalents.

---

# 57｜MOBILE

390px acceptance is mandatory.

Do not use desktop financial tables that require uncontrolled horizontal scrolling.

Convert large financial tables into:

```
summary cards
expandable records
mobile detail drawer
```

where appropriate.

---

# 58｜DESKTOP

1440px:

```
no excessively stretched text
reasonable report reading width
side-by-side comparison when useful
sticky section navigation where appropriate
```

---

# 59｜CUSTOMER EXPERIENCE REQUIREMENTS

Customer must never have to understand backend terminology.

Do not display:

```
canonical contract
fixture
runtime
projection
authority
schema
deterministic
fail closed
```

unless in developer/professional context.

Translate into customer language.

Example:

```
NEEDS_INPUT
→ We still need a little more information.

UNKNOWN
→ Not yet confirmed.

PROFESSIONAL_REVIEW_REQUIRED
→ A professional review is required before this section can be finalized.
```

---

# 60｜NO FAKE COMPLETENESS

A missing field must not become:

```
0
none
not applicable
```

unless user explicitly selected it.

Maintain distinction:

```
0
unknown
not provided
not applicable
declined
range only
```

This is especially critical for:

```
asset value
liability
insurance
estate
beneficiary
business ownership
guarantee
```

---

# 61｜NO FAKE RECOMMENDATIONS

FAR findings may identify:

```
liquidity gap
retirement gap
protection gap
education gap
business concentration
estate gap
guarantee exposure
```

But product/action recommendations require existing authority.

Never convert:

```
finding
```

into:

```
Buy X product.
```

without PFR.

---

# 62｜AUTOMATED TESTS

Extend existing checks rather than creating a parallel QA framework.

At minimum preserve/pass:

```
check-cx-r13-financial-reality.mjs

check-m4a-financial-infrastructure.mjs

check-m4a-financial-reality-navigation.mjs

check-m4a-w2a-financial-workspace-operationalization.mjs

check-m4a-w2b-financial-revision-navigation.mjs

check-m4a-w2c-financial-intake-calculation.mjs

check-m4a-w4-financial-reports.mjs

check-m4a-w5-financial-appointments.mjs

check-m4a-w6-financial-public-pages.mjs

check-ptrc-w8-financial-runtime.mjs

check-stage14-financial-runtime-product-activation.mjs

check-wpr-w22-professional-financial-production.mjs
```

Add successor checks for this work only where missing.

Suggested:

```
check-fin-will-r1-authority-continuity.mjs
check-fin-will-r1-customer-intake.mjs
check-fin-will-r1-asset-inventory.mjs
check-fin-will-r1-guarantee-separation.mjs
check-fin-will-r1-financial-report.mjs
check-fin-will-r1-estate-handoff.mjs
check-fin-will-r1-will-intake.mjs
check-fin-will-r1-will-report.mjs
check-fin-will-r1-privacy.mjs
check-fin-will-r1-i18n.mjs
check-fin-will-r1-no-parallel-runtime.mjs
```

---

# 63｜FIXTURE ACCEPTANCE

Run at minimum:

```
single person
couple
family with children
joint assets
business owner
high net worth
cross-border
partial disclosure
declined information
range-only
missing assets
negative cash flow
zero debt
large guarantee
protection gap
education gap
retirement gap
estate gap
business concentration
scenario sensitivity
estate-heavy
missing-data
```

Will-specific:

```
single testator
married with minor children
substitute executor
guardian required
multiple beneficiaries
specific gift
residuary distribution
minor beneficiary
business interest
digital assets
safe deposit
foreign property
insurance nomination unknown
EPF nomination unknown
guarantee exposure
custom clause request
translator required
missing ownership evidence
conflicting beneficiary instruction
```

---

# 64｜BROWSER ACCEPTANCE

Use real browser execution where available.

Do not infer PASS from DOM or source.

Required flows.

## Financial E2E

```
open /professional/financial/
→ start
→ household
→ income
→ expenses
→ assets
→ liabilities
→ guarantees
→ goals
→ review
→ calculate
→ financial snapshot
→ drill-down
→ report
→ print
→ return
→ edit input
→ recalculate
```

## Financial → Will

```
Financial Report
→ Estate Readiness
→ Continue to Estate & Will Planning
→ review imported records
→ confirm
→ add executor
→ add guardian
→ add beneficiaries
→ review assets
→ distribution
→ gaps
→ report
```

## Will direct entry

```
Estate & Will Planning
→ start separately
→ create inventory
→ calculate estate snapshot
→ roles
→ beneficiary structure
→ distribution
→ report
```

Test:

```
390px
1440px
English
Chinese
keyboard
Back
Refresh
save/restore
print
PDF
```

Unsupported real browser capabilities:

```
NOT_RUN
```

Never fake PASS.

---

# 65｜VISUAL QA

Financial report:

```
NO_CLIPPED_TEXT
NO_OVERFLOW
A4_PAGE_BREAKS
TABLE_HEADERS_REPEAT_WHERE_NEEDED
CHART_LABELS_VISIBLE
PRINT_CONTRAST
ZERO / UNKNOWN DISTINGUISHABLE
WARNINGS_VISIBLE
ASSUMPTIONS_VISIBLE
```

Estate report:

```
NO_CLIPPED_TEXT
PAGE_BREAKS_REVIEWED
WARNINGS_VISIBLE
DISCLAIMER_VISIBLE
PROVENANCE_READABLE
NO_PRIVATE_CREDENTIALS
NO_EXECUTED_WILL_PRESENTATION
```

---

# 66｜SECURITY QA

Verify:

```
no account number leaks
no private keys
no seed phrase
no password collection
no unauthorized case enumeration
no report access by guessing ID
no cross-account report exposure
no public financial payload
no raw Will snapshot in analytics
```

---

# 67｜REPORT RELEASE

Financial report state:

```
DRAFT
CALCULATED
FINDINGS_READY
PROFESSIONAL_REVIEW_REQUIRED
PROFESSIONALLY_REVIEWED
RELEASED
```

Will:

```
INTAKE
INVENTORY_READY
REVIEW_REQUIRED
DRAFT_REPORT
PROFESSIONAL_REVIEW
LEGAL_REVIEW_REQUIRED
RELEASED_INFORMATION_REPORT
```

Do not equate RELEASED_INFORMATION_REPORT with executed legal Will.

---

# 68｜SUCCESS CRITERIA

Work is not accepted merely because:

```
npm check passes
```

Final acceptance requires:

```
existing backend authority preserved

financial customer intake usable

Rockwills-level estate inventory coverage
without copying Rockwills product design

asset/liability/guarantee distinction correct

net worth works

estate snapshot works

cash flow works

existing FCR calculations consumed

existing FAR findings consumed

HFP 22-section report consumed

PFR judgment remains gated

Financial Report production-ready

Estate Readiness connected

Will intake production-ready

testamentary report visually production-ready

legal boundaries preserved

Financial ↔ Will consent handoff works

English / Chinese complete

mobile usable

desktop usable

print/PDF usable

privacy passes

real-browser E2E executed
where capability exists
```

---

# 69｜DELIVERABLES

Codex must commit all production changes directly to the working repository.

Do NOT return a Delta ZIP.

Return a concise final execution report containing:

```
1. executionBaselineCommit

2. final commit SHA

3. files changed

4. existing authorities reused

5. new customer surfaces activated

6. Financial Report status

7. Estate / Will Report status

8. Financial → Will handoff status

9. test results

10. real browser results

11. NOT_RUN items

12. remaining professional/legal prerequisites

13. production URLs / preview URLs

14. explicit confirmation:
   NO_PARALLEL_FINANCIAL_RUNTIME_CREATED

15. explicit confirmation:
   NO_PARALLEL_WILL_RUNTIME_CREATED

16. explicit confirmation:
   NO_AUTOMATIC_LEGAL_VALIDITY_CLAIM

17. explicit confirmation:
   NO_MODEL_GENERATED_FINANCIAL_CALCULATION

18. explicit confirmation:
   PROFESSIONAL_RECOMMENDATIONS_REMAIN_PFR_GATED
```

---

# 70｜FINAL PRODUCT PRINCIPLE

Financial:

```
PHI OS does not merely tell the customer
how much money they have.

It shows:

what they own
what they owe
what they carry
what they can sustain
what is exposed
what is changing
and what requires attention next.
```

Estate:

```
PHI OS does not merely ask
who receives the assets.

It organizes:

what exists
who owns it
who depends on the person
who will administer the estate
who is intended to benefit
what remains uncertain
what requires professional review
and what must happen next.
```

The final experience should feel like:

```
FINANCIAL REALITY
        ↓
FINANCIAL CLARITY
        ↓
FINANCIAL NAVIGATION
        ↓
ESTATE READINESS
        ↓
LEGACY CONTINUITY
```

```

我特别确认了一个很重要的点：你现在 repo 的 **Financial backend 已经远远超过附件 Rockwills 那个 inventory screen 的能力**。例如已经有 `financial-asset-contract`、`financial-liability-contract`、`financial-guarantee-contract`、multi-currency、cash flow、retirement、education、protection、estate-gap、business concentration、scenario、HFP 22 sections、PFR 和 Will schema。所以 Codex 这一轮重点应该是**把已经存在的能力真正接到客户体验上，而不是继续写一大堆新的后台 contract**。

另外，你给的 `myportal.rockwills.com/paib2.cfm` 我这里尝试直接读取时，被该 portal 的访问限制挡住了，因此不能声称已经实际走查其登录后页面；但你上传的两个截图已经足以把 **Asset Inventory + Gross Assets / Liabilities / Net Estate + Guarantees** 这些关键功能覆盖写进执行规范。真正执行时，如果 Codex 的浏览器环境已有你授权的登录状态，可以把 live portal 当作额外 UX benchmark；没有登录权限就必须标 `NOT_RUN`，不要因此阻塞 PHI OS 的开发。
```
