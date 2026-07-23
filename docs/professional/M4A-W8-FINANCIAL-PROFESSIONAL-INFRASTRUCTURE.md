# M4A-W8｜Financial Professional Infrastructure

## Outcome

M4A-W8 provides the schema, evidence, calculation, assumption, risk,
professional-authority and product-neutral infrastructure required before the
Professional Workspace begins collecting Financial Intake.

The implementation is based on M4A-W7 privacy governance and remains separate
from the frozen Runtime Engine.

## Financial schema

Migration `0003_financial_professional_infrastructure.sql` creates:

1. `client_household`
2. `financial_objective`
3. `income_item`
4. `expense_item`
5. `asset_item`
6. `liability_item`
7. `bank_account_summary`
8. `investment_item`
9. `property_item`
10. `insurance_policy`
11. `tax_profile`
12. `retirement_plan`
13. `education_plan`
14. `estate_profile`
15. `financial_ratio`
16. `financial_risk`
17. `financial_recommendation`
18. `financial_action`
19. `financial_review`

All household child records use foreign keys with cascade deletion. Financial
actions retain a nullable recommendation reference so a superseded
recommendation can be removed without silently deleting the action history.

### Storage rules

- Monetary values use integer minor units, such as sen, instead of floating
  currency values.
- Percent ownership uses basis points.
- Account and policy references must be masked.
- Property location is general, not an exact address.
- Education records use an opaque child reference, not a child's name or
  identity number.
- Full account, policy, identity and tax numbers are absent.
- Raw document content and public file URLs are absent.
- Financial values carry evidence source, evidence date and verification
  status.

The schema is authoritative at:

```text
db/schema/financial-professional-schema-v1.sql
```

The immutable deployment migration is:

```text
db/migrations/0003_financial_professional_infrastructure.sql
```

## Evidence contract

Every Financial value is traceable as:

- User Entered
- Document Extracted
- Professional Entered
- Calculated
- Estimated
- Projected
- Unverified

Calculated values require formula and input-evidence references. Estimated and
projected values require assumption references. Evidence records contain a
private source reference, never raw document content.

## Formula Registry

The central registry contains:

- Liquidity Ratio
- Debt-to-income Ratio
- Current Ratio
- Leverage Ratio
- Savings Ratio
- Net Worth
- Cash Flow Surplus
- Retirement Gap
- Education Gap
- Insurance Gap

Each result records:

- formula version;
- input date;
- evidence source IDs;
- assumption IDs;
- calculation time;
- review status;
- explicit professional override, if any.

A zero denominator returns `insufficient_input`, not infinity. A calculation
never creates a Risk Flag, Recommendation or action by itself.

## Assumption Registry

The registry defines types but deliberately provides no global numeric
defaults:

- Inflation Rate
- Investment Return
- Income Growth
- Expense Growth
- Property Growth
- Retirement Age
- Life Expectancy
- Education Inflation
- Insurance Cost Growth
- Exchange Rate

Every assumption needs an explicit value, unit, version, source, jurisdiction,
effective date, review date and author. Reports must list every assumption ID
used. An assumption is not a guaranteed outcome.

## Financial Risk Flags

The registry defines:

- Negative Cash Flow
- Insufficient Liquidity
- High Debt Burden
- Low Savings Capacity
- Insurance Gap
- Concentrated Investment
- Property Concentration
- Currency Exposure
- Retirement Gap
- Education Gap
- Estate Gap
- Missing Critical Evidence
- Outdated Valuation

Thresholds are not hidden defaults. A reviewed, versioned and
jurisdiction-specific Risk Policy must supply them.

Every triggered flag requires evidence and Professional Review. A Risk Flag
does not automatically become a Recommendation or transaction.

## Professional authority

The authority record captures:

- Professional Qualification
- Licence or Registration
- Jurisdiction
- Permitted Service Scope
- Restricted Product Advice
- Insurance Scope
- Investment Scope
- Tax Scope
- Estate Scope
- Expiry Date

The authorization contract rejects expired, inactive, jurisdiction-mismatched
and out-of-scope sign-off. Product-specific advice remains unavailable in W8.

This registry records and enforces declared scope; it does not independently
verify a licence with a regulator. Production onboarding must add that
verification before a Professional can be activated.

## Product-neutral boundary

Before a direction can be created, the following must be complete and
evidence-referenced:

1. Current Financial Position
2. Confirmed Risks
3. Goal Constraints
4. Missing Data
5. Available Options

W8 supports direction-level navigation such as cash-flow stabilisation,
emergency reserves, debt review, protection-gap review, funding and estate
preparation.

It does not identify or transact:

- a specific insurance policy;
- a specific fund;
- a specific property sale;
- a specific loan.

A later product-specific step requires appropriate authority, conflict
disclosure, commission disclosure and a client decision. That step is not
enabled here.

## Frozen boundaries

M4A-W8 does not change:

- M2 Runtime stages or contracts
- M2 Professional Access
- M4A-W3 Consent
- M4A-W7 Data Governance
- existing migrations 0001 and 0002
- Cloudflare binding configuration

M4A-W8 does not yet provide:

- Professional Workspace UI
- Financial Intake UI
- document upload
- report generation
- automated product recommendations
- checkout or public Professional pages

## Next gate

Proceed to M4A-W2 Professional Workspace. W2 can now build Financial Intake,
Evidence Mapping, Review Queue and revision interfaces against the W8 schema.
