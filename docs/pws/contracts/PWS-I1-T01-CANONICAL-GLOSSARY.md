# PWS-I1-T01 Canonical Glossary

Status: **Frozen v1**  
Baseline: `getphioscs-UX/phios main@358abb1473ecab105fc93f8d34c623886bf842b4`

The machine-readable authority is
`docs/pws/contracts/pws-canonical-glossary-v1.json`. This Contract standardises
names only. It does not instantiate an object, create persistence, add a
Registry entry or change presentation copy.

## Naming rules

1. The 35 canonical English terms are case-sensitive and their IDs are stable.
2. New schemas, operations, events and APIs use canonical terms, never Legacy
   Alias names.
3. Legacy aliases remain readable through adapters, but cannot be write
   sources.
4. `context_required` aliases cannot be resolved by string replacement, an API,
   a page or an AI Provider. Their owning module must supply the context.
5. Presentation labels do not create formal objects.
6. A Provider result is Candidate material until an authorised operation
   validates it; it cannot name or promote a formal object.

## Canonical terms

| Domain | Terms |
|---|---|
| Professional eligibility | Professional, Capability, Credential, Certification |
| Method and service | Method, Service |
| Commercial | Product, Offer, Price, Order, Payment, Entitlement |
| Authority and workspace | Consent, Assignment, Workspace, Professional Readiness |
| Information | Evidence, Record, Candidate, Observation, Knowledge Resource |
| Reports and delivery | Journey Report, Professional Response, Specialist Report, Deliverable, Signature |
| Operations | Follow-up, Complaint, Incident |
| Governance | Policy, Organization, Restriction, Governance |
| Intelligence | Question Route, Provider Usage |

## Legacy Alias decisions

| Legacy Alias | Resolution | Canonical result |
|---|---|---|
| Case | context required | Candidate / Assignment / Workspace |
| Task | context required | Assignment / Follow-up |
| Job | context required | Assignment / Provider Usage |
| Project | mapped | Workspace |
| Ticket | context required | Complaint / Incident / Follow-up |
| ServiceProduct | mapped | Product with Service reference |
| ServiceEntitlement | mapped | Entitlement with Service reference |
| ProfessionalCandidateReport | mapped | Candidate; never automatically a report or Deliverable |
| JPR | mapped | Journey Report |
| Public Journey | presentation alias | Existing Runtime Journey reference; no new PWS object |
| Reality Demo | presentation only | No formal object |

## Compatibility decisions

- Existing `professional-task` contracts remain Legacy-compatible. Their name
  does not authorise creation of a second canonical Task object.
- Existing Public Journey documentation and UI copy remain valid presentation
  language.
- Existing Reality Demo pages remain isolated and do not become Journey,
  Evidence, Record or Workspace.
- Existing philosophical glossaries in `Content/glossary/` remain untouched;
  they serve Knowledge presentation rather than PWS object naming.
