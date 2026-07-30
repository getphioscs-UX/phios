# PWS-ENTRY-W2 Canonical Ownership Freeze

Baseline: `getphioscs-UX/phios main@39c45784994f36630cad62c368149c1cb99e9b13`

Prerequisite: the uncommitted PWS-ENTRY-W1 Delta in this delivery chain.

## Status

Canonical Ownership v1 is frozen by
`docs/pws/architecture/pws-canonical-ownership-v1.json`.

The paths beginning with `runtime/` are logical Owner Modules. W2 does not
create those physical directories, move current files, execute a Migration, or
activate new Production behavior. Creating empty or parallel implementations
at the target paths would violate the duplicate-object prohibition.

## Ownership rules

1. Every formal object appears exactly once in the ownership file.
2. Every object has exactly one scalar `writeSource`.
3. A `legacyPath` is a compatibility, projection, evidence or adapter source;
   it is never a new authoritative write source after W2.
4. Existing data and history remain readable throughout future migration.
5. A future physical move must be performed by the declared
   `migrationOwner`.
6. PJA pages, API response assemblers, AI Providers, payment webhooks and
   projections cannot create formal objects unless they invoke the canonical
   Owner Module command.
7. Shared owner modules such as `runtime/commercial` still expose one
   object-specific command namespace per object.

## Canonical owner map

| Object | Canonical owner | Only write source |
| --- | --- | --- |
| Professional | `runtime/professional` | `runtime/professional/commands` |
| Capability | `runtime/capability` | `runtime/capability/commands` |
| Credential | `runtime/credential` | `runtime/credential/commands` |
| Certification | `runtime/certification` | `runtime/certification/commands` |
| Method | `runtime/method` | `runtime/method/commands` |
| Service | `runtime/service` | `runtime/service/commands` |
| Product | `runtime/product` | `runtime/product/commands` |
| Offer | `runtime/commercial` | `runtime/commercial/offer/commands` |
| Price | `runtime/commercial` | `runtime/commercial/price/commands` |
| Order | `runtime/commercial` | `runtime/commercial/order/commands` |
| Payment | `runtime/commercial` | `runtime/commercial/payment/commands` |
| Entitlement | `runtime/entitlement` | `runtime/entitlement/commands` |
| Consent | `runtime/consent` | `runtime/consent/commands` |
| Assignment | `runtime/assignment` | `runtime/assignment/commands` |
| Workspace | `runtime/workspace` | `runtime/workspace/commands` |
| Evidence | `runtime/evidence` | `runtime/evidence/commands` |
| Journey | `runtime/journey` | `runtime/journey/commands` |
| Reading | `runtime/reading` | `runtime/reading/commands` |
| Navigation | `runtime/navigation` | `runtime/navigation/commands` |
| Deliverable | `runtime/deliverable` | `runtime/deliverable/commands` |
| Professional Response | `runtime/deliverable/professional-response` | `runtime/deliverable/professional-response/commands` |
| Knowledge Resource | `runtime/knowledge` | `runtime/knowledge/commands` |
| Question Route | `runtime/intelligence/routing` | `runtime/intelligence/routing/commands` |
| Provider Usage | `runtime/intelligence/usage` | `runtime/intelligence/usage/commands` |
| Provider Budget | `runtime/intelligence/cost` | `runtime/intelligence/cost/commands` |
| Follow-up | `runtime/operations` | `runtime/operations/follow-up/commands` |
| Governance | `runtime/governance` | `runtime/governance/commands` |
| Security | `runtime/security` | `runtime/security/commands` |

## Legacy handling

Every entry contains an explicit `deprecationPlan` with:

- a compatibility mode;
- a named target stage;
- `newWritesAllowed: false`;
- `preserveHistory: true`.

“Deprecation” therefore does not mean deletion. Existing Runtime, Book One
commerce, Professional Workspace, Financial Workspace, External Reader,
Consent, report, page and API implementations remain intact until a separately
authorised migration stage supplies an adapter, verifies parity and preserves
history.

## Freeze boundary

W2 changes architecture metadata, documentation, and automated checks only.
Runtime Registry count remains 48 content entries and 20 Runtime contracts;
Migration Registry remains versions 1–4. No HTML, API route, Migration SQL,
Runtime state machine, Provider router or persistence driver is changed.
