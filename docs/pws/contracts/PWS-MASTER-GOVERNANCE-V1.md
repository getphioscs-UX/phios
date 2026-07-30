# PHI OS Master Governance and Conflict Resolution

Status: **Frozen v1**  
Baseline: `getphioscs-UX/phios` `main@4fd426aa87664e58073432d9c3654d35d8f2a820`

## 0.1 Source-of-Truth Priority

When two requirements conflict, PHI OS resolves them in this order:

```text
Reality Integrity / Evidence Boundary / Safety / Law
↓
Frozen Core Runtime Contract
↓
PDS v1.1 Experience and Design Requirements
↓
PWS / PJA Canonical Contract
↓
Registry and Migration Contract
↓
Page Implementation
↓
Copy and Visual Preference
```

The higher source always wins. A later page, copy change, migration or presentation preference cannot overwrite an earlier frozen responsibility boundary. Conflicts must not be silently merged; unresolved conflicts remain visible and their eventual resolution must be recorded.

## 0.2 PDS Mandatory Gate

Every public, customer, professional and technical view preserves Reality First, Understanding Before Explanation, Journey Before Page, One Primary Task, Progressive Disclosure, Unknowns Remain Visible, Evidence Boundary, Correctability, Verifiable Action, System Restraint, Consistent Behaviour and Reality Integrity.

Every implementation step records a PDS intent review, automated checks where possible, 360 px / 768 px / 1440 px visual acceptance, Chinese / English acceptance, keyboard and focus acceptance, touch target acceptance, Runtime regression and Production verification.

A contract-only change may mark visual acceptance as not applicable only when it changes no page or customer-visible behaviour and records that reason. This does not waive visual acceptance for a later page implementation. Automated checks cannot substitute for visual acceptance, and Production cannot be declared Passed before the deployed revision is verified.

## 0.3 Canonical Journey Mapping

| Experience stage | Customer-facing English | Technical surfaces |
|---|---|---|
| 进入 | Enter | Home / Journey Landing |
| 描述 | Describe | Entry |
| 发现 | Discover | Reconstruction |
| 理解 | Understand | Reading / Reality Map |
| 选择 | Choose | Navigation |
| 继续 | Continue | Review / Continuity / My Reality |

Technical routes and stable identifiers may remain unchanged. Customer-facing language follows the experience stage. Journey lifecycle state remains separate from Journey stage, and this presentation mapping cannot create a second Journey source of truth.

## Scope of this freeze

This step adds governance and automated conflict guards only. It changes no Runtime, API, Provider, migration, persistence, lineage or page behaviour. Consequently, visual, touch, keyboard and bilingual page acceptance are recorded as not applicable to this contract-only revision; they remain mandatory for every later page implementation.
